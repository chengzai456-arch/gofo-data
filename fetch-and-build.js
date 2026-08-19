/**
 * fetch-and-build.js
 * 从飞书多维表拉取数据并生成 index.html + data.json
 * GitHub Actions 用（纯 Node.js，不依赖 lark-cli）
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");

const CONFIG = {
  APP_ID: process.env.FEISHU_APP_ID,
  APP_SECRET: process.env.FEISHU_APP_SECRET,
  BASE_TOKEN: "UpCxbXml4a6u9us4BwCcRdGDnPg",
  TABLE_ID: "tblSr9y6Wf811s7z",
  PASSWORD: process.env.DASHBOARD_PASSWORD || "gofo2025",
};

const DASHBOARD_DIR = path.join(__dirname);
const TEMPLATE_PATH = path.join(DASHBOARD_DIR, "index.template.html");

function httpsReq(url, opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve(JSON.parse(d)); } catch { reject(new Error(d.substring(0,200))); }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

async function getToken() {
  const r = await httpsReq(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    { method: "POST", headers: { "Content-Type": "application/json" } },
    JSON.stringify({ app_id: CONFIG.APP_ID, app_secret: CONFIG.APP_SECRET })
  );
  if (r.code !== 0) throw new Error(`Token: ${r.msg}(${r.code})`);
  return r.tenant_access_token;
}

/**
 * 按字段名精确提取值，处理飞书多维表各种字段类型：
 * - text: 字符串
 * - select: ["选项名"] 或 [{name:"选项名"}]
 * - user: [{name:"姓名",id:"ou_xxx"}]
 * - datetime: 字符串
 */
function getVal(fields, fieldName) {
  const v = fields[fieldName];
  if (v === undefined || v === null) return "";

  // 字符串 / 数字 / 布尔
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);

  // 数组（select / multi_select / user）
  if (Array.isArray(v)) {
    if (v.length === 0) return "";
    const first = v[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      return first.name || first.text || "";
    }
    return "";
  }

  // 对象（text/url 类型有时为 {text:"...", link:"..."}）
  if (typeof v === "object") {
    return v.link || v.text || v.name || "";
  }

  return "";
}

/** 时间戳/字符串 -> YYYY-MM-DD（固定 GMT+8，与飞书显示一致） */
function formatDate(v) {
  if (!v) return "";
  const n = Number(v);
  if (!isNaN(n) && n > 100000000000) {
    // 毫秒时间戳 + 8h 偏移，确保与飞书 GMT+8 显示一致
    const d = new Date(n + 8 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  }
  if (typeof v === "string" && v.includes(" ")) return v.split(" ")[0];
  return String(v);
}

/** 从 markdown 文本中提取第一个 URL */
function extractMarkdownUrl(str) {
  if (!str) return "";
  // [text](url)
  const md = str.match(/\[([^\]]*)\]\(([^)]+)\)/);
  if (md) return md[2];
  // 纯 URL
  const url = str.match(/https?:\/\/[^\s]+/);
  return url ? url[0] : "";
}

async function getRecords(token) {
  const all = [];
  let pt = "";
  while (true) {
    let url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${CONFIG.BASE_TOKEN}/tables/${CONFIG.TABLE_ID}/records?page_size=100`;
    if (pt) url += `&page_token=${pt}`;
    const r = await httpsReq(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    if (r.code !== 0) throw new Error(`Records: ${r.msg}(${r.code})`);
    if (r.data && r.data.items) {
      r.data.items.forEach((item) => {
        if (item.fields) {
          const fields = item.fields;
          let title = getVal(fields, "AI项目名称");
          // 兜底: 字段名被意外修改/加了不可见字符时, 模糊匹配字段 key
          if (!title) {
            const fbKey = Object.keys(fields).find((k) => k.replace(/\s|\u200B/g, "").startsWith("AI项目名称"));
            if (fbKey) title = getVal(fields, fbKey);
          }
          if (!title) return;
          all.push({
            title: title.trim(),
            group: getVal(fields, "所属小组") || "未分组",
            status: getVal(fields, "当前进度") || "待启动",
            owner: getVal(fields, "负责人") || "",
            deadline: getVal(fields, "预计完成时间") || "",
            has_blocker: getVal(fields, "是否有卡点") || "否",
            has_skill: getVal(fields, "已形成可复用SKILL") ? "是" : "否",
            online: getVal(fields, "已上线") || "",
            ai_hours: parseFloat(getVal(fields, "AI处理后工时H/月")) || 0,
            orig_hours: parseFloat(getVal(fields, "原工时H/月")) || 0,
            efficiency_hours: parseFloat(getVal(fields, "提效时间H")) || 0,
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
    if (r.data && r.data.has_more) { pt = r.data.page_token; } else { break; }
  }
  return all;
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function main() {
  try {
    console.log("[1/3] Token...");
    const token = await getToken();
    console.log("  OK");

    console.log("[2/3] Records...");
    const records = await getRecords(token);
    console.log(`  ${records.length} 条`);

    console.log("[3/3] Build...");
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    const dataJson = JSON.stringify({ total: records.length, updated_at: now, records });
    const loginHash = sha256(CONFIG.PASSWORD);

    let html = fs.readFileSync(TEMPLATE_PATH, "utf-8");
    html = html.replaceAll("__EMBEDDED_DATA_PLACEHOLDER__", dataJson);
    html = html.replaceAll("__BUILD_TIMESTAMP__", now);
    html = html.replaceAll("__LOGIN_HASH__", loginHash);
    fs.writeFileSync(path.join(DASHBOARD_DIR, "index.html"), html, "utf-8");
    fs.writeFileSync(path.join(DASHBOARD_DIR, "data.json"), JSON.stringify({ total: records.length, updated_at: now, records }), "utf-8");
    console.log("  OK");

    console.log(`\nCOUNT=${records.length}`);
  } catch (e) {
    console.error("FAIL:", e.message);
    process.exit(1);
  }
}

main();
