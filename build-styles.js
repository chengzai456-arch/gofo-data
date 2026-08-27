// GOFO 看板风格变体生成器
// 基于 index.template.html 生成 3 套风格: 晨曦浅色 / 霓虹赛博 / 商务蓝金
const fs = require('fs');
const crypto = require('crypto');

const src = fs.readFileSync('index.template.html', 'utf8');
const dataJson = fs.readFileSync('data.json', 'utf8');
const hash = crypto.createHash('sha256').update('gofo2025').digest('hex');
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

// ---------- 风格定义 ----------
const themes = {

  // ============ A. 晨曦 · 极简浅色 ============
  light: {
    name: '晨曦浅色',
    root: `:root{
    --bg:#f4f6fb; --bg2:#eef1f8;
    --card:rgba(255,255,255,.88); --card-hover:#ffffff;
    --border:rgba(15,23,42,.09); --border-strong:rgba(15,23,42,.18);
    --text:#0f172a; --dim:#64748b;
    --indigo:#2563eb; --cyan:#0ea5e9; --green:#10b981; --yellow:#f59e0b; --red:#ef4444;
    --purple:#8b5cf6; --orange:#f97316; --pink:#ec4899;
    --radius:20px;
    --shadow:0 1px 3px rgba(15,23,42,.05),0 10px 30px rgba(15,23,42,.06);
    --shadow-hover:0 4px 12px rgba(15,23,42,.08),0 20px 44px rgba(15,23,42,.10);
    --font-num:'Space Grotesk','Inter',-apple-system,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;
  }`,
    css: `
  /* ===== 浅色主题覆盖 ===== */
  body{background:
    radial-gradient(1100px 560px at 85% -12%, rgba(37,99,235,.07), transparent 60%),
    radial-gradient(900px 500px at -8% 30%, rgba(14,165,233,.06), transparent 58%),
    var(--bg);
    color:var(--text);font-weight:400}
  ::selection{background:rgba(37,99,235,.16)}
  .bg-grid{opacity:.55}
  .orb{opacity:.20;filter:blur(80px)}
  .orb.o1{background:rgba(37,99,235,.5)}
  .orb.o2{background:rgba(14,165,233,.4)}
  .orb.o3{background:rgba(139,92,246,.35)}
  #progressBar{background:linear-gradient(90deg,#2563eb,#0ea5e9);box-shadow:0 0 10px rgba(37,99,235,.45);height:3px}
  .container{max-width:1280px;padding:36px 28px 48px}

  .login-overlay{background:radial-gradient(800px 460px at 50% -10%,rgba(37,99,235,.08),transparent 60%),#f4f6fb}
  .login-box{background:rgba(255,255,255,.92);border:1px solid rgba(15,23,42,.08);border-radius:24px;
    box-shadow:0 24px 70px rgba(15,23,42,.12);backdrop-filter:blur(18px)}
  .login-box::before{background:linear-gradient(135deg,rgba(37,99,235,.5),transparent 40%,transparent 60%,rgba(14,165,233,.45))}
  .login-logo{background:linear-gradient(135deg,#2563eb,#0ea5e9);box-shadow:0 10px 28px rgba(37,99,235,.28)}
  .login-input{background:#f8fafc;border-color:rgba(15,23,42,.12);color:var(--text)}
  .login-input:focus{border-color:var(--indigo);box-shadow:0 0 0 3px rgba(37,99,235,.14)}
  .login-btn{background:linear-gradient(92deg,#2563eb,#2563eb 55%,#0ea5e9);box-shadow:0 10px 24px rgba(37,99,235,.28)}

  .logo-badge{background:linear-gradient(135deg,#2563eb,#0ea5e9);box-shadow:0 8px 24px rgba(37,99,235,.25)}
  .gradient-text{background:linear-gradient(92deg,#2563eb,#0ea5e9 50%,#8b5cf6 85%);animation:none}
  .pill{background:rgba(255,255,255,.85);border-color:rgba(15,23,42,.08);box-shadow:var(--shadow);color:var(--dim)}
  .refresh-btn{background:rgba(255,255,255,.9);border-color:rgba(15,23,42,.1);box-shadow:var(--shadow)}
  .refresh-btn:hover{border-color:var(--indigo);box-shadow:0 0 0 3px rgba(37,99,235,.14)}

  .metric-card{background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow)}
  .metric-card:hover{transform:translateY(-3px);border-color:var(--border-strong);box-shadow:var(--shadow-hover)}
  .metric-card::after{background:radial-gradient(320px 120px at 80% -20%,rgba(37,99,235,.06),transparent 70%)}
  .metric-value{color:#1e293b}
  .m-indigo .metric-ico{background:rgba(37,99,235,.10);color:#2563eb}
  .m-indigo .metric-value{color:#1d4ed8}
  .m-green .metric-ico{background:rgba(16,185,129,.10);color:#10b981}
  .m-green .metric-value{color:#059669}
  .m-cyan .metric-ico{background:rgba(14,165,233,.10);color:#0ea5e9}
  .m-cyan .metric-value{color:#0284c7}
  .m-yellow .metric-ico{background:rgba(245,158,11,.10);color:#f59e0b}
  .m-yellow .metric-value{color:#d97706}
  .m-purple .metric-ico{background:rgba(139,92,246,.10);color:#8b5cf6}
  .m-purple .metric-value{color:#7c3aed}
  .m-red .metric-ico{background:rgba(239,68,68,.10);color:#ef4444}
  .m-red .metric-value{color:#dc2626}
  .m-indigo{box-shadow:inset 0 2px 0 rgba(37,99,235,.35),var(--shadow)}
  .m-green{box-shadow:inset 0 2px 0 rgba(16,185,129,.35),var(--shadow)}
  .m-cyan{box-shadow:inset 0 2px 0 rgba(14,165,233,.35),var(--shadow)}
  .m-yellow{box-shadow:inset 0 2px 0 rgba(245,158,11,.35),var(--shadow)}
  .m-purple{box-shadow:inset 0 2px 0 rgba(139,92,246,.35),var(--shadow)}
  .m-red{box-shadow:inset 0 2px 0 rgba(239,68,68,.35),var(--shadow)}

  .chart-card,.table-section{background:var(--card);border:1px solid var(--border);box-shadow:var(--shadow)}
  .chart-center .cc-val{color:#059669;text-shadow:none}
  thead th{background:rgba(241,245,249,.92);color:#64748b;border-bottom:1px solid rgba(15,23,42,.08)}
  tbody tr{border-bottom:1px solid rgba(15,23,42,.05)}
  tbody tr:hover{background:rgba(37,99,235,.05)}
  .progress-bar{background:rgba(15,23,42,.10)}
  .progress-fill{background:linear-gradient(90deg,#2563eb,#0ea5e9)}
  .filter-btn{background:#f8fafc;border-color:rgba(15,23,42,.1);color:#64748b}
  .filter-btn:hover{border-color:var(--indigo);color:var(--text)}
  .filter-btn.active{background:linear-gradient(92deg,#2563eb,#0ea5e9);color:#fff;box-shadow:0 6px 16px rgba(37,99,235,.3)}
  .search-input{background:#f8fafc;border-color:rgba(15,23,42,.1);color:var(--text)}
  .search-input:focus{border-color:var(--indigo);box-shadow:0 0 0 3px rgba(37,99,235,.14)}
  .tag-blue{background:rgba(37,99,235,.09);color:#1d4ed8}
  .tag-green{background:rgba(16,185,129,.10);color:#059669}
  .tag-yellow{background:rgba(245,158,11,.10);color:#b45309}
  .tag-orange{background:rgba(249,115,22,.10);color:#c2410c}
  .tag-gray{background:rgba(100,116,139,.10);color:#475569}
  .tag-red{background:rgba(239,68,68,.10);color:#dc2626}
  .tag-purple{background:rgba(139,92,246,.10);color:#7c3aed}
  .tag-cyan{background:rgba(14,165,233,.10);color:#0284c7}
  footer{border-top-color:rgba(15,23,42,.08)}
  .toast{background:rgba(255,255,255,.96);border-color:rgba(15,23,42,.1);box-shadow:0 16px 44px rgba(15,23,42,.18)}
  .header-left h1{font-weight:750}
  .metric-value{font-size:36px}`,

    jsReplace: [
      ['#8b96a8', '#64748b'],                    // chart tick 色
      ['rgba(148,163,184,.10)', 'rgba(100,116,139,.13)'], // chart grid 色
      ['#0d1424', '#ffffff'],                    // doughnut border
      ['#a78bfa', '#6366f1'],                    // top 图主色
      ['#c4b5fd', '#818cf8'],                    // top 图 hover
      ['#cbd5e1', '#334155'],                    // top 图 y tick
    ],
    htmlReplace: [
      ['<title>GOFO AI 提效看板</title>', '<title>GOFO AI 提效看板</title>'],
      ['<div class="subtitle">飞书多维表数据驱动 · 自动实时同步</div>', '<div class="subtitle">飞书多维表数据驱动 · 极简浅色</div>'],
    ],
  },

  // ============ B. 霓虹 · 赛博深空 ============
  neon: {
    name: '霓虹赛博',
    root: `:root{
    --bg:#05060c; --bg2:#090b18;
    --card:rgba(10,13,26,.78); --card-hover:rgba(18,22,44,.9);
    --border:rgba(168,85,247,.20); --border-strong:rgba(34,211,238,.45);
    --text:#eef0ff; --dim:#8f93b8;
    --indigo:#a855f7; --cyan:#22d3ee; --green:#34d399; --yellow:#fbbf24; --red:#fb7185;
    --purple:#c084fc; --orange:#fb923c; --pink:#f472b6;
    --radius:14px;
    --font-num:'Space Grotesk','Inter',-apple-system,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;
  }`,
    css: `
  /* ===== 霓虹主题覆盖 ===== */
  body{background:
    radial-gradient(1000px 540px at 80% -10%, rgba(168,85,247,.22), transparent 60%),
    radial-gradient(900px 520px at -10% 30%, rgba(34,211,238,.14), transparent 58%),
    radial-gradient(800px 500px at 50% 115%, rgba(236,72,153,.13), transparent 62%),
    #05060c}
  ::selection{background:rgba(168,85,247,.45)}
  /* 扫描线 + 星点 */
  body::after{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
    background:
      radial-gradient(1.5px 1.5px at 12% 22%, rgba(255,255,255,.5), transparent 55%),
      radial-gradient(1.2px 1.2px at 68% 14%, rgba(255,255,255,.4), transparent 55%),
      radial-gradient(1.6px 1.6px at 35% 68%, rgba(255,255,255,.35), transparent 55%),
      radial-gradient(1.2px 1.2px at 82% 55%, rgba(255,255,255,.4), transparent 55%),
      radial-gradient(1.4px 1.4px at 22% 88%, rgba(255,255,255,.3), transparent 55%),
      radial-gradient(1.3px 1.3px at 55% 38%, rgba(255,255,255,.35), transparent 55%),
      repeating-linear-gradient(0deg, rgba(255,255,255,.018) 0 1px, transparent 1px 4px)}
  .bg-grid{background-image:linear-gradient(rgba(168,85,247,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,.08) 1px,transparent 1px);background-size:44px 44px}
  .orb{opacity:.5}
  .orb.o1{background:rgba(168,85,247,.5)}
  .orb.o2{background:rgba(34,211,238,.32)}
  .orb.o3{background:rgba(236,72,153,.4)}
  #progressBar{background:linear-gradient(90deg,#a855f7,#22d3ee,#f472b6);box-shadow:0 0 14px rgba(168,85,247,.9);height:3px}
  .container{max-width:1400px;padding:28px 24px 44px}

  .login-overlay{background:radial-gradient(800px 460px at 50% -10%,rgba(168,85,247,.3),transparent 60%),#05060c}
  .login-box{background:rgba(10,13,26,.9);border:1px solid rgba(168,85,247,.35);border-radius:20px;
    box-shadow:0 0 44px rgba(168,85,247,.18),0 24px 70px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06)}
  .login-box::before{background:linear-gradient(135deg,rgba(168,85,247,.8),transparent 40%,transparent 60%,rgba(34,211,238,.75))}
  .login-logo{background:linear-gradient(135deg,#a855f7,#22d3ee);box-shadow:0 10px 32px rgba(168,85,247,.55)}
  .login-input{background:rgba(8,10,22,.8);border-color:rgba(168,85,247,.25);color:var(--text)}
  .login-input:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.18)}
  .login-btn{background:linear-gradient(92deg,#a855f7,#d946ef 45%,#22d3ee);box-shadow:0 10px 28px rgba(168,85,247,.5)}
  .login-btn:hover{background-position:100% 0}

  .logo-badge{background:linear-gradient(135deg,#a855f7,#22d3ee);box-shadow:0 10px 32px rgba(168,85,247,.5)}
  .gradient-text{background:linear-gradient(92deg,#c084fc,#22d3ee 45%,#f472b6 80%)}
  .header-left h1{text-shadow:0 0 24px rgba(168,85,247,.35)}
  .pill{background:rgba(10,13,26,.8);border-color:rgba(168,85,247,.22)}
  .refresh-btn{background:rgba(10,13,26,.8);border-color:rgba(168,85,247,.28);color:#e0e7ff}
  .refresh-btn:hover{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.16),0 0 20px rgba(34,211,238,.2)}

  .metric-card{background:var(--card);border:1px solid var(--border);
    box-shadow:0 0 26px rgba(168,85,247,.07),0 10px 30px rgba(0,0,0,.4)}
  .metric-card:hover{transform:translateY(-4px);border-color:var(--border-strong);
    box-shadow:0 0 34px rgba(34,211,238,.18),0 18px 44px rgba(0,0,0,.5)}
  .metric-card::after{background:radial-gradient(320px 120px at 80% -20%,rgba(192,132,252,.12),transparent 70%)}
  .metric-value{text-shadow:0 0 18px rgba(168,85,247,.4)}
  .m-indigo .metric-ico{background:rgba(168,85,247,.16);color:#c084fc}
  .m-indigo .metric-value{color:#d8b4fe;text-shadow:0 0 18px rgba(168,85,247,.5)}
  .m-green .metric-ico{background:rgba(52,211,153,.14);color:#34d399}
  .m-green .metric-value{color:#6ee7b7}
  .m-cyan .metric-ico{background:rgba(34,211,238,.14);color:#22d3ee}
  .m-cyan .metric-value{color:#67e8f9}
  .m-yellow .metric-ico{background:rgba(251,191,36,.13);color:#fbbf24}
  .m-yellow .metric-value{color:#fcd34d}
  .m-purple .metric-ico{background:rgba(192,132,252,.16);color:#c084fc}
  .m-purple .metric-value{color:#d8b4fe}
  .m-red .metric-ico{background:rgba(251,113,133,.14);color:#fb7185}
  .m-red .metric-value{color:#fda4af}
  .m-indigo{box-shadow:inset 0 2px 0 rgba(168,85,247,.6),0 0 26px rgba(168,85,247,.07)}
  .m-green{box-shadow:inset 0 2px 0 rgba(52,211,153,.6),0 0 26px rgba(168,85,247,.07)}
  .m-cyan{box-shadow:inset 0 2px 0 rgba(34,211,238,.6),0 0 26px rgba(168,85,247,.07)}
  .m-yellow{box-shadow:inset 0 2px 0 rgba(251,191,36,.6),0 0 26px rgba(168,85,247,.07)}
  .m-purple{box-shadow:inset 0 2px 0 rgba(192,132,252,.6),0 0 26px rgba(168,85,247,.07)}
  .m-red{box-shadow:inset 0 2px 0 rgba(251,113,133,.6),0 0 26px rgba(168,85,247,.07)}

  .chart-card,.table-section{background:var(--card);border:1px solid var(--border);box-shadow:0 0 26px rgba(168,85,247,.07),0 10px 30px rgba(0,0,0,.4)}
  .chart-card:hover{border-color:rgba(168,85,247,.4)}
  .chart-center .cc-val{color:#34d399;text-shadow:0 0 18px rgba(52,211,153,.6)}
  thead th{background:rgba(8,10,22,.97);color:#8f93b8;border-bottom:1px solid rgba(168,85,247,.16)}
  tbody tr{border-bottom:1px solid rgba(168,85,247,.07)}
  tbody tr:hover{background:rgba(168,85,247,.10)}
  .progress-fill{background:linear-gradient(90deg,#a855f7,#22d3ee)}
  .filter-btn{background:rgba(8,10,22,.75);border-color:rgba(168,85,247,.22);color:#8f93b8}
  .filter-btn:hover{border-color:#22d3ee;color:#e0e7ff}
  .filter-btn.active{background:linear-gradient(92deg,rgba(168,85,247,.9),rgba(34,211,238,.85));color:#05060c;font-weight:700;box-shadow:0 0 20px rgba(168,85,247,.45)}
  .search-input{background:rgba(8,10,22,.75);border-color:rgba(168,85,247,.22);color:var(--text)}
  .search-input:focus{border-color:#22d3ee;box-shadow:0 0 0 3px rgba(34,211,238,.16)}
  footer{border-top-color:rgba(168,85,247,.14)}
  .toast{background:rgba(10,13,26,.96);border-color:rgba(168,85,247,.3);box-shadow:0 0 30px rgba(168,85,247,.15),0 16px 44px rgba(0,0,0,.5)}`,

    jsReplace: [
      ['#8b96a8', '#8f93b8'],
      ['rgba(148,163,184,.10)', 'rgba(168,85,247,.13)'],
      ['#0d1424', '#0a0d1a'],
      ['#a78bfa', '#c084fc'],
      ['#c4b5fd', '#e9d5ff'],
      ['#cbd5e1', '#c4b5fd'],
    ],
    htmlReplace: [
      ['<title>GOFO AI 提效看板</title>', '<title>GOFO AI 提效看板</title>'],
      ['<div class="subtitle">飞书多维表数据驱动 · 自动实时同步</div>', '<div class="subtitle">飞书多维表数据驱动 · 自动实时同步</div>'],
    ],
  },

  // ============ C. 鎏金 · 商务蓝金 ============
  gold: {
    name: '商务蓝金',
    root: `:root{
    --bg:#0a1428; --bg2:#0d1a33;
    --card:rgba(255,255,255,.045); --card-hover:rgba(255,255,255,.075);
    --border:rgba(148,180,230,.14); --border-strong:rgba(212,175,55,.4);
    --text:#e8eef8; --dim:#8ea3c0;
    --indigo:#3b82f6; --cyan:#38bdf8; --green:#34d399; --yellow:#fbbf24; --red:#f87171;
    --purple:#8b5cf6; --orange:#fb923c; --pink:#ec4899;
    --gold:#d4af37; --gold-light:#e8c766;
    --radius:10px;
    --font-num:'Space Grotesk','Inter',-apple-system,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;
  }`,
    css: `
  /* ===== 商务蓝金主题覆盖 ===== */
  body{background:
    linear-gradient(180deg, #0d1a33 0%, #0a1428 34%, #0a1428 100%);
    color:var(--text)}
  ::selection{background:rgba(59,130,246,.4)}
  .bg-grid{background-image:linear-gradient(rgba(148,180,230,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(148,180,230,.045) 1px,transparent 1px);background-size:52px 52px;
    -webkit-mask-image:radial-gradient(ellipse 85% 60% at 50% 0%,#000 20%,transparent 80%)}
  .orb{opacity:.28}
  .orb.o1{background:rgba(59,130,246,.5);top:-160px;right:-80px}
  .orb.o2{background:rgba(212,175,55,.20);bottom:-140px;left:-100px}
  .orb.o3{display:none}
  #progressBar{background:linear-gradient(90deg,#3b82f6,#d4af37);box-shadow:0 0 12px rgba(212,175,55,.55);height:2px}
  .container{max-width:1360px;padding:26px 24px 44px}

  /* 顶栏金线 */
  .header{position:relative;margin:4px 0 26px;padding-bottom:18px;border-bottom:1px solid rgba(212,175,55,.22)}
  .header::after{content:'';position:absolute;left:0;bottom:-1px;width:120px;height:2px;background:linear-gradient(90deg,#d4af37,transparent)}

  .login-overlay{background:radial-gradient(800px 460px at 50% -10%,rgba(59,130,246,.18),transparent 60%),#0a1428}
  .login-box{background:rgba(13,26,51,.94);border:1px solid rgba(148,180,230,.18);border-radius:14px;
    box-shadow:0 24px 70px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.05)}
  .login-box::before{background:linear-gradient(135deg,rgba(212,175,55,.7),transparent 40%,transparent 60%,rgba(59,130,246,.6))}
  .login-logo{background:linear-gradient(135deg,#d4af37,#3b82f6);box-shadow:0 10px 30px rgba(212,175,55,.35)}
  .login-input{background:rgba(10,20,40,.7);border-color:rgba(148,180,230,.18);color:var(--text)}
  .login-input:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.15)}
  .login-btn{background:linear-gradient(92deg,#d4af37,#c9a227 55%,#3b82f6);box-shadow:0 10px 26px rgba(212,175,55,.3)}

  .logo-badge{background:linear-gradient(135deg,#d4af37,#3b82f6);box-shadow:0 10px 30px rgba(59,130,246,.35)}
  .gradient-text{background:linear-gradient(92deg,#e8c766,#d4af37 40%,#60a5fa 85%);animation:none}
  .pill{background:rgba(255,255,255,.05);border-color:rgba(148,180,230,.14)}
  .refresh-btn{background:rgba(255,255,255,.06);border-color:rgba(148,180,230,.18);color:#e8eef8}
  .refresh-btn:hover{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.14)}

  .metrics{grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:22px}
  .metric-card{padding:16px 16px 14px;border-radius:var(--radius);
    background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
    border:1px solid rgba(148,180,230,.14);box-shadow:0 6px 20px rgba(0,0,0,.3)}
  .metric-card:hover{transform:translateY(-2px);border-color:rgba(212,175,55,.35)}
  .metric-top{margin-bottom:8px}
  .metric-ico{width:30px;height:30px;border-radius:8px;font-size:15px}
  .metric-value{font-size:24px;letter-spacing:-.4px}
  .metric-value .unit{font-size:11px}
  .metric-label{font-size:11.5px;margin-top:3px}
  .bar-tip{top:12px;right:12px}
  .m-indigo .metric-ico{background:rgba(59,130,246,.15);color:#60a5fa}
  .m-indigo .metric-value{color:#93c5fd}
  .m-green .metric-ico{background:rgba(52,211,153,.13);color:#34d399}
  .m-green .metric-value{color:#6ee7b7}
  .m-cyan .metric-ico{background:rgba(56,189,248,.13);color:#38bdf8}
  .m-cyan .metric-value{color:#7dd3fc}
  .m-yellow .metric-ico{background:rgba(212,175,55,.15);color:#e8c766}
  .m-yellow .metric-value{color:#f0d97a}
  .m-purple .metric-ico{background:rgba(139,92,246,.15);color:#a78bfa}
  .m-purple .metric-value{color:#c4b5fd}
  .m-red .metric-ico{background:rgba(248,113,113,.13);color:#f87171}
  .m-red .metric-value{color:#fca5a5}
  .m-indigo,.m-green,.m-cyan,.m-yellow,.m-purple,.m-red{box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 6px 20px rgba(0,0,0,.3)}

  .chart-card,.table-section{background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));
    border:1px solid rgba(148,180,230,.14);border-radius:var(--radius);box-shadow:0 6px 20px rgba(0,0,0,.3)}
  .chart-card{padding:20px 22px}
  .chart-title{font-size:14px;letter-spacing:.2px}
  .chart-center .cc-val{color:#e8c766;text-shadow:0 0 18px rgba(212,175,55,.4)}
  thead th{background:rgba(13,26,51,.97);color:#8ea3c0;border-bottom:1px solid rgba(148,180,230,.14);font-size:11px;letter-spacing:.6px}
  tbody td{padding:9px 16px}
  tbody tr{border-bottom:1px solid rgba(148,180,230,.06)}
  tbody tr:hover{background:rgba(59,130,246,.08)}
  .progress-fill{background:linear-gradient(90deg,#3b82f6,#d4af37)}
  .filter-btn{background:rgba(10,20,40,.7);border-color:rgba(148,180,230,.16);color:#8ea3c0;font-size:12px}
  .filter-btn:hover{border-color:#d4af37;color:#e8eef8}
  .filter-btn.active{background:linear-gradient(92deg,rgba(212,175,55,.85),rgba(59,130,246,.85));color:#fff;box-shadow:0 6px 16px rgba(212,175,55,.25)}
  .search-input{background:rgba(10,20,40,.7);border-color:rgba(148,180,230,.16);color:var(--text);font-size:12px}
  .search-input:focus{border-color:#d4af37;box-shadow:0 0 0 3px rgba(212,175,55,.14)}
  footer{border-top-color:rgba(148,180,230,.12)}
  .toast{background:rgba(13,26,51,.96);border-color:rgba(212,175,55,.3);box-shadow:0 16px 44px rgba(0,0,0,.5)}
  .count-badge{background:rgba(212,175,55,.16);color:#f0d97a}
  .link{color:#93c5fd}
  @media(max-width:1100px){.metrics{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:640px){.metrics{grid-template-columns:repeat(2,1fr)}}`,

    jsReplace: [
      ['#8b96a8', '#8ea3c0'],
      ['rgba(148,163,184,.10)', 'rgba(148,180,230,.11)'],
      ['#0d1424', '#0a1428'],
      ['#a78bfa', '#d4af37'],
      ['#c4b5fd', '#f0d97a'],
      ['#cbd5e1', '#c9d6ea'],
    ],
    htmlReplace: [
      ['<title>GOFO AI 提效看板</title>', '<title>GOFO AI 提效看板</title>'],
      ['<div class="subtitle">飞书多维表数据驱动 · 自动实时同步</div>', '<div class="subtitle">飞书多维表数据驱动 · 商务蓝金</div>'],
    ],
  }
};

// ---------- 构建 ----------
for (const [key, t] of Object.entries(themes)) {
  let html = src;
  // 1. 替换 :root 变量块
  html = html.replace(/:root\{[\s\S]*?\}/, t.root);
  // 2. 在 </style> 前插入覆盖 CSS
  html = html.replace('</style>', t.css + '\n</style>');
  // 3. JS 硬编码色替换
  for (const [from, to] of t.jsReplace) html = html.replaceAll(from, to);
  // 4. HTML 文本替换
  for (const [from, to] of t.htmlReplace) html = html.replace(from, to);
  // 5. 注入数据
  html = html.replaceAll('__EMBEDDED_DATA_PLACEHOLDER__', dataJson);
  html = html.replaceAll('__LOGIN_HASH__', hash);
  html = html.replaceAll('__BUILD_TIMESTAMP__', now);

  const out = `preview-${key}.html`;
  fs.writeFileSync(out, html);
  console.log(out, '->', html.length, 'bytes');
}

// ---------- 应用选中主题到正式模板 ----------
// 用法: node build-styles.js --apply=neon  (写入 index.template.html, 不注入数据)
const applyKey = process.argv[2] && process.argv[2].startsWith('--apply=') ? process.argv[2].split('=')[1] : null;
if (applyKey && themes[applyKey]) {
  const t = themes[applyKey];
  let html = src;
  html = html.replace(/:root\{[\s\S]*?\}/, t.root);
  html = html.replace('</style>', t.css + '\n</style>');
  for (const [from, to] of t.jsReplace) html = html.replaceAll(from, to);
  // 正式模板: 标题保持简洁, 仅更新副标题 (统一为中性文案, 不再标注主题名)
  html = html.replace(
    '<div class="subtitle">飞书多维表数据驱动 · GSAP 动效 · 自动实时同步</div>',
    '<div class="subtitle">飞书多维表数据驱动 · 自动实时同步</div>'
  );
  html = html.replace(
    '<div class="subtitle">飞书多维表数据驱动 · 自动实时同步</div>',
    '<div class="subtitle">飞书多维表数据驱动 · 自动实时同步</div>'
  );
  fs.writeFileSync('index.template.html', html);
  console.log('APPLIED:', t.name, '-> index.template.html (' + html.length + ' bytes)');
} else if (applyKey) {
  console.log('Unknown theme:', applyKey, '| available:', Object.keys(themes).join(', '));
}
console.log('hash(gofo2025):', hash);
