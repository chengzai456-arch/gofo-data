/**
 * rebuild-index.js — 让 index.html 内嵌数据与 data.json 保持对齐（无需任何 Secrets）
 *
 * 背景：data.json 由 Cloudflare Worker 每 5 分钟写回 GitHub；index.html 的内嵌数据(EMBEDDED_DATA)
 *       旧流程只能靠 GitHub Actions + 飞书凭证(fetch-and-build.js)重建，凭证缺失时永不更新，
 *       导致页面离线兜底数据长期陈旧(曾停留在 8-27)。
 *
 * 本脚本只读取仓库内的 data.json + index.template.html：
 *   - 若内嵌 records 与 data.json records 相同 → 不动（幂等，避免每 5 分钟无意义提交/仓库膨胀）
 *   - 不同 → 用模板重建 index.html（LOGIN_HASH 沿用现有值，BUILD_TIMESTAMP=当前时间）
 *            → 本地运行：直接覆写 index.html 供 git 提交
 *            → Actions 运行(有 GITHUB_TOKEN)：走 Contents API PUT，含 sha 冲突重试
 *
 * 用法：
 *   node rebuild-index.js                 # 本地：重建 index.html（不提交）
 *   GITHUB_TOKEN=xxx node rebuild-index.js  # CI：重建后直接 API 推送
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const TPL = path.join(ROOT, "index.template.html");
const DATA = path.join(ROOT, "data.json");
const INDEX = path.join(ROOT, "index.html");
const GH_OWNER = "chengzai456-arch";
const GH_REPO = "gofo-data";
const GH_PATH = "index.html";

function embedJsonOf(html) {
  // EMBEDDED_DATA 为单行 JSON，位于 `var EMBEDDED_DATA = {...};` 行
  const i = html.indexOf("var EMBEDDED_DATA = ");
  if (i < 0) return null;
  const rest = html.slice(i + "var EMBEDDED_DATA = ".length);
  const lineEnd = rest.indexOf("\n");
  let body = (lineEnd < 0 ? rest : rest.slice(0, lineEnd)).trim();
  if (body.endsWith(";")) body = body.slice(0, -1).trim();
  try { return JSON.parse(body); } catch { return null; }
}

function nowStamp() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

async function apiPut(token, content, sha) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;
  const body = {
    message: "sync: index 内嵌数据对齐 data.json",
    content: Buffer.from(content, "utf8").toString("base64"),
  };
  if (sha) body.sha = sha;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "gofo-rebuild-index",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      console.log(`[ok] index.html 已更新 (sha=${sha ? sha.slice(0, 7) : "new"})`);
      return true;
    }
    const err = await res.json().catch(() => ({}));
    if (res.status === 409 && attempt < 4) {
      // sha 冲突（并发提交）→ 重新读取 sha 重试
      const g = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "User-Agent": "gofo-rebuild-index" } });
      const meta = await g.json().catch(() => ({}));
      body.sha = meta.sha;
      console.log(`[retry ${attempt}] 409 sha 冲突，用 ${body.sha ? body.sha.slice(0, 7) : "(无)"} 重试`);
      continue;
    }
    console.error(`[fail] PUT ${res.status}:`, err.message || "");
    return false;
  }
  return false;
}

async function main() {
  if (!fs.existsSync(DATA)) { console.error("data.json 不存在"); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const hasTpl = fs.existsSync(TPL);

  // 与当前 index.html 内嵌 records 比较，幂等短路
  let cur = null, curLoginHash = "", curBuild = "";
  if (fs.existsSync(INDEX)) {
    cur = fs.readFileSync(INDEX, "utf8");
    const m1 = cur.match(/var LOGIN_HASH = "([0-9a-f]{64})"/);
    if (m1) curLoginHash = m1[1];
    const m2 = cur.match(/var BUILD_TIMESTAMP = "([^"]+)"/);
    if (m2) curBuild = m2[1];
    const emb = embedJsonOf(cur);
    if (emb && JSON.stringify(emb.records) === JSON.stringify(data.records)) {
      console.log("[skip] 内嵌 records 与 data.json 一致，无需重建");
      return;
    }
  }

  if (!hasTpl) {
    // 模板不存在则无法重建（本地可能删了模板），此时用 fetch-and-build 同款注入逻辑保护
    console.error("index.template.html 不存在，无法重建");
    process.exit(1);
  }
  let html = fs.readFileSync(TPL, "utf8");
  const loginHash = curLoginHash || "6ce20308599f0bbb871c115b0243197ea6177d56b9913ed2da6fa8e1c8dfe04e";
  html = html.split("__LOGIN_HASH__").join(loginHash);
  html = html.split("__BUILD_TIMESTAMP__").join(nowStamp());
  html = html.split("__EMBEDDED_DATA_PLACEHOLDER__").join(JSON.stringify(data));

  if (process.env.GITHUB_TOKEN) {
    // CI：Contents API 直推（不需要本地 git 历史/凭据）
    const shaRes = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "User-Agent": "gofo-rebuild-index" },
    });
    let sha = "";
    if (shaRes.ok) { const meta = await shaRes.json(); sha = meta.sha || ""; }
    const ok = await apiPut(process.env.GITHUB_TOKEN, html, sha);
    process.exit(ok ? 0 : 1);
  }

  // 本地：覆写文件供 git 提交
  fs.writeFileSync(INDEX, html, "utf8");
  console.log(`[ok] 本地 index.html 已重建 (${data.records.length} 条, build=${nowStamp()})`);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
