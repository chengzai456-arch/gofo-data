// ============================================================
// Cloudflare Worker — GOFO AI 项目跟踪看板 API
// 架构: Feishu API 直连(实时) + KV 缓存(兜底)
// 端点:
//   GET  /api/data    → 返回 KV 缓存数据（页面初始加载）
//   GET  /api/refresh → 直连飞书 API 拉取最新数据，更新 KV，返回给前端
//                       鉴权: Origin 白名单 + 8s/IP 限流，防跨站/脚本滥用
//   POST /api/update  → 外部写入 KV（由 GitHub Actions 同步脚本调用）
//                       鉴权: X-Update-Key
// ============================================================

const KV_KEY = "bitable_data";
const BASE_TOKEN = "UpCxbXml4a6u9us4BwCcRdGDnPg";
const TABLE_ID = "tblSr9y6Wf811s7z";

// /api/refresh 允许的来源（浏览器跨域请求会带 Origin header）。
// 部署到新域名/新环境时把对应 origin 加入；"null" 兼容本地 file:// 打开页面。
const ALLOWED_ORIGINS = new Set([
  "https://chengzai456-arch.github.io",
  "null",
]);

// 同一 IP 两次 /api/refresh 的最小间隔（毫秒）
const REFRESH_WINDOW_MS = 3000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Update-Key, X-Refresh-Key",
};

// 内嵌 fallback 数据（KV 为空且 Feishu 不可用时使用）
const FALLBACK_DATA = {
  total: 0,
  updated_at: "",
  records: [],
};

// ---- 飞书 API 工具函数 ----

/** 获取 tenant_access_token */
async function getFeishuToken(env) {
  const res = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: env.FEISHU_APP_ID,
        app_secret: env.FEISHU_APP_SECRET,
      }),
    }
  );
  const json = await res.json();
  if (json.code !== 0) throw new Error(`Token API: ${json.msg} (code=${json.code})`);
  return json.tenant_access_token;
}

/**
 * 按字段名精确提取值，处理飞书多维表各种字段类型：
 * - text / number / boolean: 直接返回字符串
 * - select: ["选项名"] 或 [{name:"选项名"}]
 * - user: [{name:"姓名", id:"ou_xxx"}]
 * - url: {text:"...", link:"..."}
 */
function getVal(fields, fieldName) {
  const v = fields[fieldName];
  if (v === undefined || v === null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "";
    const first = v[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") return first.name || first.text || "";
    return "";
  }
  if (typeof v === "object") return v.link || v.text || v.name || "";
  return "";
}

/** 从 markdown 文本中提取第一个 URL */
function extractMarkdownUrl(str) {
  if (!str) return "";
  const md = str.match(/\[([^\]]*)\]\(([^)]+)\)/);
  if (md) return md[2];
  const url = str.match(/https?:\/\/[^\s]+/);
  return url ? url[0] : "";
}

/** 时间戳/字符串 -> YYYY-MM-DD（固定 GMT+8，与飞书显示一致） */
function formatDate(v) {
  if (!v) return "";
  const n = Number(v);
  if (!isNaN(n) && n > 100000000000) {
    const d = new Date(n + 8 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof v === "string" && v.includes(" ")) return v.split(" ")[0];
  return String(v);
}

/** 从飞书多维表拉取全部记录 */
async function fetchRecords(token) {
  const all = [];
  let pt = "";
  while (true) {
    let url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records?page_size=100`;
    if (pt) url += `&page_token=${pt}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const r = await res.json();
    if (r.code !== 0) throw new Error(`Records API: ${r.msg} (code=${r.code})`);
    if (r.data && r.data.items) {
      r.data.items.forEach((item) => {
        if (item.fields) {
          const fields = item.fields;
          const title = getVal(fields, "AI项目名称");
          if (!title) return;
          all.push({
            title: title.trim(),
            group: getVal(fields, "所属小组") || "未分组",
            status: getVal(fields, "当前进度") || "待启动",
            owner: getVal(fields, "负责人") || "",
            deadline: formatDate(getVal(fields, "预计完成时间")),
            has_blocker: getVal(fields, "是否有卡点") || "否",
            efficiency_hours: parseFloat(getVal(fields, "提效时间H")) || 0,
            has_skill: getVal(fields, "已形成可复用SKILL") ? "是" : "否",
            online: getVal(fields, "已上线") || "",
            ai_hours: parseFloat(getVal(fields, "AI处理后工时H/月")) || 0,
            orig_hours: parseFloat(getVal(fields, "原工时H/月")) || 0,
            progress: parseFloat(getVal(fields, "进度条")) || 0,
            result_link: extractMarkdownUrl(getVal(fields, "成果晾晒（skill&链接）")),
            blocker_detail: getVal(fields, "卡点问题（详细描述）") || "",
            lessons: getVal(fields, "经验教训") || "",
            results: getVal(fields, "成果展示") || "",
            calibration: getVal(fields, "数据校准") || "",
            style_tuning: getVal(fields, "样式调优") || "",
            data_input: getVal(fields, "数据投喂") || "",
          });
        }
      });
    }
    if (r.data && r.data.has_more) {
      pt = r.data.page_token;
    } else {
      break;
    }
  }
  return all;
}

// ---- 主 handler ----

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================================
    // POST /api/update — 已废弃（gofo 不用此端点；曾被外部项目污染 KV）
    // 任何写入请求统一返回 410 Gone，引导调用方使用自己专属的 Worker
    // ============================================================
    if (path === "/api/update") {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Deprecated. POST KV updates to your own Worker — this endpoint is reserved for gofo and rejects external writes.",
        }),
        {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ============================================================
    // GET /api/refresh — 直连飞书 API，实时拉取最新数据
    // 鉴权1: Origin 白名单（拦截浏览器跨站调用）
    // 鉴权2: 按 IP 限流（拦截 curl/脚本高频刷量）
    // ============================================================
    if (path === "/api/refresh" && request.method === "GET") {
      // 鉴权 1: Origin 白名单
      const origin = request.headers.get("Origin");
      if (!origin || !ALLOWED_ORIGINS.has(origin)) {
        console.log(`[/api/refresh] rejected origin="${origin}" allowed=${origin ? ALLOWED_ORIGINS.has(origin) : false}`);
        return new Response(
          JSON.stringify({ ok: false, error: "Forbidden origin" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 鉴权 2: 按 IP 限流（KV 异常时 fail-open，避免误伤正常用户）
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const rlKey = "rl_refresh:" + ip;
      const now = Date.now();
      let limited = false;
      try {
        const lastTs = await env.BITABLE_DATA.get(rlKey);
        if (lastTs && now - parseInt(lastTs) < REFRESH_WINDOW_MS) {
          limited = true;
        } else {
          await env.BITABLE_DATA.put(rlKey, String(now), { expirationTtl: 60 });
        }
      } catch (e) {
        console.error("[/api/refresh] Rate-limit KV error:", e.message);
      }
      if (limited) {
        console.log(`[/api/refresh] rate limited ip=${ip}`);
        return new Response(
          JSON.stringify({ ok: false, error: "Rate limited, please retry later" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      try {
        console.log("[/api/refresh] Getting Feishu token...");
        const token = await getFeishuToken(env);
        console.log("[/api/refresh] Fetching records...");
        const records = await fetchRecords(token);
        console.log(`[/api/refresh] Got ${records.length} records`);

        const data = {
          total: records.length,
          updated_at: new Date().toISOString(),
          records,
        };

        // 写入 KV（确保 /api/data 与实时刷新结果一致）
        await env.BITABLE_DATA.put(KV_KEY, JSON.stringify(data));

        return new Response(
          JSON.stringify({ ok: true, data, source: "feishu-live" }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          }
        );
      } catch (err) {
        console.error("[/api/refresh] Error:", err.message);
        return new Response(
          JSON.stringify({ ok: false, error: err.message, source: "error" }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ============================================================
    // GET /api/data — 返回 KV 缓存数据
    // ============================================================
    if (path === "/api/data" || path === "/" || path === "") {
      try {
        const cached = await env.BITABLE_DATA.get(KV_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          return new Response(JSON.stringify({ ok: true, data, source: "kv" }), {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60",
            },
          });
        }
      } catch (e) {
        // KV 读取失败，继续 fallback
      }

      return new Response(
        JSON.stringify({ ok: true, data: FALLBACK_DATA, source: "fallback" }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );
    }

    // 404
    return new Response(JSON.stringify({ ok: false, error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },

  // Cron 定时触发: 拉取飞书最新数据写入 KV
  //（需 Cloudflare 配置 Cron Trigger，见 wrangler.toml [triggers]）
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshAndCache(env));
  },
};

// scheduled 与 fetch 共用的刷新缓存逻辑
async function refreshAndCache(env) {
  try {
    console.log("[scheduled] Getting Feishu token...");
    const token = await getFeishuToken(env);
    const records = await fetchRecords(token);
    const data = {
      total: records.length,
      updated_at: new Date().toISOString(),
      records,
    };
    await env.BITABLE_DATA.put(KV_KEY, JSON.stringify(data));
    console.log(`[scheduled] refreshed ${records.length} records -> KV`);
  } catch (err) {
    console.error("[scheduled] failed:", err.message);
  }
}
