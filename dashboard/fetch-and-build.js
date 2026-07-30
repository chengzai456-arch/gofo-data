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
  BASE_TOKEN: "ZAF7bY8FMavTH6s1rbKcy7wqnvb",
  TABLE_ID: "tblknrJ29fXaFWFg",
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

function getVal(fields, name) {
  for (const k of Object.keys(fields)) {
    if (fields[k] && typeof fields[k] === "object" && fields[k].text !== undefined) {
      return String(fields[k].text || "");
    }
  }
  for (const k of Object.keys(fields)) {
    const v = fields[k];
    if (Array.isArray(v)) {
      const texts = v.filter(x => x && x.text).map(x => x.text).join(", ");
      if (texts) return texts;
    }
  }
  for (const k of Object.keys(fields)) {
    if (typeof fields[k] === "string") return fields[k];
    if (typeof fields[k] === "number") return String(fields[k]);
  }
  return "";
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
          const title = getVal(fields, "标题");
          if (!title || /弃用|废弃|请忽略/i.test(title)) return;
          all.push({
            title: title.trim(),
            module: getVal(fields, "模块") || "其他",
            system: getVal(fields, "系统") || "未分类",
            leader: getVal(fields, "负责人") || "",
            status: getVal(fields, "状态") || "进行中",
            duration: parseFloat(getVal(fields, "时长")) || 0,
            gus: getVal(fields, "GUS") || "",
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

    console.log(`\n::set-output name=count::${records.length}`);
  } catch (e) {
    console.error("FAIL:", e.message);
    process.exit(1);
  }
}

main();
