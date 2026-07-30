#!/usr/bin/env node
// ============================================================
// build.js — 从飞书多维表拉取数据并生成含内嵌数据的 index.html
// ============================================================

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CONFIG = {
  BASE_TOKEN: "ZAF7bY8FMavTH6s1rbKcy7wqnvb",
  TABLE_ID: "tblknrJ29fXaFWFg",
  VIEW_ID: "vewIIgrFyG",
  DASHBOARD_DIR: path.join(__dirname),
  LARK_CLI: "C:\\Users\\Administrator\\.workbuddy\\binaries\\node\\versions\\22.22.2\\lark-cli.cmd",
  PASSWORD: "gofo2025",  // 访问密码，修改后重建即可
};

const FIELD_MAP = {
  0: "publish_date", 1: "active", 2: "notification", 3: "notification_en",
  4: "title", 5: "title_en", 6: "video_url", 7: "duration",
  8: "subtitle_lang", 9: "system", 10: "system_en", 11: "module",
  12: "module_en", 13: "coverage", 14: "coverage_en", 15: "creator",
};

function parseRecord(values) {
  const r = {};
  values.forEach((val, i) => {
    const key = FIELD_MAP[i];
    if (!key) return;
    if (Array.isArray(val)) {
      r[key] = key === "creator" ? (val[0]?.name || "") : (val[0] || "");
    } else if (typeof val === "string") {
      r[key] = val;
    } else {
      r[key] = String(val || "");
    }
  });
  if (r.video_url) {
    const m = r.video_url.match(/\]\((https?:\/\/[^\s)]+)\)/);
    r.video_url = m ? m[1] : (r.video_url.startsWith("http") ? r.video_url : "");
  }
  const dm = (r.duration || "").match(/(\d+)s/);
  r.duration_seconds = dm ? parseInt(dm[1]) : 0;
  if (r.publish_date) r.publish_date = r.publish_date.split(" ")[0];
  return r.title ? r : null;
}

function fetchRecords() {
  console.log("[1/4] 从飞书多维表拉取数据...");
  const cmd = [
    `"${CONFIG.LARK_CLI}" base +record-list`,
    `--base-token "${CONFIG.BASE_TOKEN}"`,
    `--table-id "${CONFIG.TABLE_ID}"`,
    `--view-id "${CONFIG.VIEW_ID}"`,
    "--limit 500", "--format json", "--as user",
  ].join(" ");
  const output = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
  const json = JSON.parse(output);
  if (!json.ok) throw new Error(`lark-cli error: ${JSON.stringify(json.error)}`);
  const records = json.data.data.map(parseRecord).filter((r) => r !== null);
  console.log(`   获取 ${records.length} 条有效记录`);
  return records;
}

function readTemplate() {
  const templatePath = path.join(CONFIG.DASHBOARD_DIR, "index.template.html");
  if (fs.existsSync(templatePath)) {
    console.log("[2/4] 读取模板: index.template.html");
    return fs.readFileSync(templatePath, "utf-8");
  }
  console.log("[2/4] 模板不存在，从现有 index.html 生成");
  return null;
}

function generateHtml(records) {
  const now = new Date().toISOString();
  const data = { total: records.length, updated_at: now, records };

  // 序列化为格式化的 JSON
  const dataJson = JSON.stringify(data, null, 2);

  // 读取模板或使用内联模板
  let template = fs.readFileSync(path.join(__dirname, "index.template.html"), "utf-8");
  const html = template.replaceAll("__EMBEDDED_DATA_PLACEHOLDER__", dataJson);
  return html;
}

function main() {
  const records = fetchRecords();
  const now = new Date().toISOString();
  const data = { total: records.length, updated_at: now, records };
  const dataJson = JSON.stringify(data, null, 2);

  console.log("[3/4] 生成文件...");

  // 写入 data.json
  fs.writeFileSync(path.join(CONFIG.DASHBOARD_DIR, "data.json"), dataJson, "utf-8");
  console.log("   ✓ data.json");

  // 模板必须存在才生成 index.html
  const templatePath = path.join(__dirname, "index.template.html");
  if (!fs.existsSync(templatePath)) {
    console.error("❌ index.template.html 不存在，请先创建模板");
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, "utf-8");
  let html = template.replaceAll("__EMBEDDED_DATA_PLACEHOLDER__", dataJson);
  html = html.replaceAll("__BUILD_TIMESTAMP__", now);
  html = html.replaceAll("__LOGIN_HASH__", crypto.createHash("sha256").update(CONFIG.PASSWORD).digest("hex"));

  fs.writeFileSync(path.join(CONFIG.DASHBOARD_DIR, "index.html"), html, "utf-8");
  console.log("   ✓ index.html (数据已嵌入)");

  // 摘要
  console.log("\n[4/4] 📊 数据摘要:");
  console.log(`   总记录: ${records.length}`);
  const modules = {};
  records.forEach((r) => { if (r.module) modules[r.module] = (modules[r.module] || 0) + 1; });
  Object.entries(modules).forEach(([k, v]) => console.log(`   ${k}: ${v} 条`));

  console.log("\n✅ 构建完成 — 可将 dashboard/ 目录部署到 CloudStudio");
}

main();
