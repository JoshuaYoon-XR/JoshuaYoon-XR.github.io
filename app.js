// ===== 公共工具 =====
// 站点配置(来自 config.js 的 window.SITE_CONFIG),全脚本通过 CFG 读取
const CFG = window.SITE_CONFIG || {};

// 把 config.js 的标题/副标题/页脚等应用到 DOM,并触发背景图设置
function applyConfig() {
  const titleEl = document.getElementById("site-title");
  const subtitleEl = document.getElementById("site-subtitle");
  const footerEl = document.getElementById("site-footer");
  if (titleEl && CFG.title) titleEl.textContent = CFG.title;
  if (subtitleEl && CFG.subtitle) subtitleEl.textContent = CFG.subtitle;
  if (footerEl && CFG.footer) footerEl.textContent = CFG.footer;
  if (CFG.title) document.title = CFG.title;
  applyBackground();
}

// ===== 背景图片 =====
// 仅在 config.js 配了 background 时启用;否则保留 body 的纸张纹理
function applyBackground() {
  if (!CFG.background) return;
  // 转义引号,避免拼到 url("...") 里时截断字符串
  const url = CFG.background.replace(/"/g, '\\"');
  // 默认 fixed(滚动时背景不动),显式传 false 才改为 scroll
  const attach = CFG.backgroundFixed === false ? "scroll" : "fixed";

  let el = document.getElementById("bg-layer");
  if (!el) {
    el = document.createElement("div");
    el.id = "bg-layer";
    document.body.prepend(el);
  }
  el.style.backgroundImage = `url("${url}")`;
  el.style.backgroundAttachment = attach;

  // 遮罩透明度写入 CSS 变量,由 style.css 按主题取白/黑
  const overlay =
    typeof CFG.backgroundOverlay === "number" ? CFG.backgroundOverlay : 0.85;
  document.documentElement.style.setProperty("--bg-overlay", overlay);
  // body 切到透明背景,露出 #bg-layer;style.css 据此停用纸张纹理
  document.body.classList.add("has-bg");
}

// ===== 主题切换 =====
// 优先级:localStorage 保存值 > 系统偏好(prefers-color-scheme)
function initTheme() {
  const toggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  setTheme(theme);

  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      setTheme(current === "dark" ? "light" : "dark");
    });
  }
}

// 写入 data-theme 属性(style.css 据此切换变量)、持久化、更新按钮图标
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

// ISO 日期字符串 → "YYYY年M月D日";解析失败则原样返回
function formatDate(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// 用 DOM 序列化做 HTML 转义,防止用户/文章内容里的 < > & 注入 HTML
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===== 首页逻辑 =====
async function initHome() {
  applyConfig();
  initTheme();

  const grid = document.getElementById("posts-grid");
  let posts = [];

  // 加载文章清单;每次带时间戳避免拿到缓存的旧清单
  try {
    const res = await fetch("posts.json?_=" + Date.now());
    if (!res.ok) throw new Error("无法加载 posts.json");
    posts = await res.json();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><p>😕 加载文章列表失败</p><p style="font-size:.85rem;margin-top:8px">请确认 posts.json 存在且格式正确</p></div>`;
    return;
  }

  // 过滤隐藏文章(hidden: true 的不在首页展示,但仍可直接访问)
  posts = posts.filter((p) => !p.hidden);

  // 置顶优先,其余按日期倒序
  posts.sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date) - new Date(a.date);
  });

  // 收集所有标签(去重),用于顶部栏目筛选条
  const allTags = [...new Set(posts.flatMap((p) => p.tags || []))];
  const tagBar = document.getElementById("tag-bar");
  let activeTag = "";

  // 渲染标签栏;"全部" + 各标签,点击切换 activeTag 并重渲染列表
  function renderTags() {
    const chips = [`<span class="tag-chip ${activeTag === "" ? "active" : ""}" data-tag="">全部</span>`];
    allTags.forEach((t) => {
      chips.push(
        `<span class="tag-chip ${activeTag === t ? "active" : ""}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`
      );
    });
    tagBar.innerHTML = chips.join("");
    tagBar.querySelectorAll(".tag-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        activeTag = chip.dataset.tag;
        renderTags();
        render();
      });
    });
  }

  // 搜索框:输入即筛(按标题/摘要,大小写无关)
  const searchInput = document.getElementById("search-input");
  let keyword = "";
  searchInput.addEventListener("input", (e) => {
    keyword = e.target.value.trim().toLowerCase();
    render();
  });

  // 当前标签 + 关键词下的最终列表渲染
  function render() {
    let list = posts;
    if (activeTag) list = list.filter((p) => (p.tags || []).includes(activeTag));
    if (keyword) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(keyword) ||
          (p.excerpt || "").toLowerCase().includes(keyword)
      );
    }

    if (list.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>🔍 没有找到匹配的文章</p></div>`;
      return;
    }

    grid.innerHTML = list.map(cardHtml).join("");
  }

  // 单张文章卡片 HTML
  // 封面:有 cover 用图,否则用标题首字占位;置顶卡片加角标
  function cardHtml(p) {
    const cover = p.cover
      ? `<div class="card-cover"><img src="${escapeHtml(p.cover)}" alt="${escapeHtml(p.title)}" loading="lazy" /></div>`
      : `<div class="card-cover card-cover-empty"><span>${escapeHtml((p.title || "").charAt(0))}</span></div>`;
    const tags = (p.tags || [])
      .map((t) => `<span class="card-tag">${escapeHtml(t)}</span>`)
      .join("");
    const pinBadge = p.pinned ? `<span class="pin-badge">📌 置顶</span>` : "";
    return `
      <article class="post-card${p.pinned ? " is-pinned" : ""}">
        <a href="post.html?slug=${encodeURIComponent(p.slug)}">
          ${cover}
          <div class="card-body">
            <div class="card-meta">${pinBadge}${formatDate(p.date)}</div>
            <h2 class="card-title">${escapeHtml(p.title)}</h2>
            <p class="card-excerpt">${escapeHtml(p.excerpt || "")}</p>
            <div class="card-tags">${tags}</div>
          </div>
        </a>
      </article>`;
  }

  renderTags();
  render();
}

// ===== 文章页逻辑 =====
// URL: post.html?slug=xxx → 加载 posts/xxx.md 渲染
async function initPost() {
  applyConfig();
  initTheme();

  const container = document.getElementById("article-content");
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");

  if (!slug) {
    container.innerHTML = `<div class="empty-state"><p>😕 缺少文章参数</p><p><a href="index.html">返回首页</a></p></div>`;
    return;
  }

  // 先从清单里拿元信息(日期/标签/封面);拿不到也不阻塞,正文仍可加载
  let meta = null;
  try {
    const res = await fetch("posts.json?_=" + Date.now());
    const posts = await res.json();
    meta = posts.find((p) => p.slug === slug);
  } catch (e) {
    /* 元信息可选,失败也继续尝试加载正文 */
  }

  // 加载 Markdown 正文(带时间戳防缓存)
  let md = "";
  try {
    const res = await fetch(`posts/${encodeURIComponent(slug)}.md?_=` + Date.now());
    if (!res.ok) throw new Error("404");
    md = await res.text();
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p>😕 找不到这篇文章</p><p><a href="index.html">返回首页</a></p></div>`;
    return;
  }

  // 标题:元信息优先,缺省用 slug兜底
  const title = meta ? meta.title : slug;
  document.title = `${title} · ${CFG.title || "博客"}`;

  // 日期 + 标签行(元信息缺失则整行不显示)
  const metaHtml = meta
    ? `<div class="article-meta">
         <span>${formatDate(meta.date)}</span>
         ${(meta.tags || [])
           .map((t) => `<span class="card-tag">${escapeHtml(t)}</span>`)
           .join("")}
       </div>`
    : "";

  // 文章顶部封面(有 cover 才显示)
  const coverHtml =
    meta && meta.cover
      ? `<figure class="article-cover">
           <img src="${escapeHtml(meta.cover)}" alt="${escapeHtml(title)}" />
         </figure>`
      : "";

  // 配置 marked:breaks=true(单换行也成段)、gfm=true(GFM 表格/删除线等)
  // highlight 钩子用 hljs 高亮代码块
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
      if (window.hljs) {
        try {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs.highlightAuto(code).value;
        } catch (e) {
          return code;
        }
      }
      return code;
    },
  });

  // 用 marked 渲染正文
  // dropCap 开关:config.js 的 dropCap !== false 时给正文容器加 drop-cap class
  // (style.css 据此触发首字下沉;改动这里要同步 style.css 的选择器)
  const bodyHtml = marked.parse(md);

  container.innerHTML = `
    <a href="index.html" class="back-link">← 返回首页</a>
    <div class="article-header">
      <h1>${escapeHtml(title)}</h1>
      ${metaHtml}
    </div>
    ${coverHtml}
    <div class="markdown-body${CFG.dropCap === false ? "" : " drop-cap"}" id="md-body">${bodyHtml}</div>
  `;

  // 应用代码高亮(兜底,防止 marked 的 highlight 选项未生效)
  if (window.hljs) {
    document.querySelectorAll("#md-body pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  // 移除正文首个与标题重复的 h1,避免重复
  // (Markdown 文件常以 # 标题 开头,而上面 article-header 已展示了 h1)
  const firstH1 = container.querySelector("#md-body > h1:first-child");
  if (firstH1 && firstH1.textContent.trim() === title.trim()) {
    firstH1.remove();
  }
}

// ===== 关于页逻辑 =====
// 内容全部来自 config.js 的 profile 配置,无独立数据源
function initAbout() {
  applyConfig();
  initTheme();

  const container = document.getElementById("about-content");
  const p = CFG.profile || {};
  // 名字缺省顺序:profile.name → 顶层 author → "我"
  const name = p.name || CFG.author || "我";

  document.title = `关于 · ${CFG.title || "博客"}`;

  // 头像:有图用图,没有用名字首字占位
  const avatar = p.avatar
    ? `<div class="about-avatar"><img src="${escapeHtml(p.avatar)}" alt="${escapeHtml(name)}" /></div>`
    : `<div class="about-avatar about-avatar-empty"><span>${escapeHtml(name.charAt(0))}</span></div>`;

  // 社交链接:过滤掉空 url;mailto: 项同时展示 label 和邮箱地址
  const links = (p.links || []).filter((l) => l && l.url);
  const linksHtml = links.length
    ? `<div class="about-links">
         ${links
           .map((l) => {
             const isMail = /^mailto:/i.test(l.url);
             const text = isMail ? `${l.label}: ${l.url.replace(/^mailto:/i, "")}` : l.label;
             return `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
           })
           .join("")}
       </div>`
    : "";

  // 详细介绍:支持 Markdown(bio 字段),marked 不可用时退化为纯文本
  let bioHtml = "";
  if (p.bio) {
    bioHtml = window.marked
      ? marked.parse(p.bio)
      : `<p>${escapeHtml(p.bio)}</p>`;
  }

  container.innerHTML = `
    <div class="about-header">
      ${avatar}
      <h1 class="about-name">${escapeHtml(name)}</h1>
      ${p.tagline ? `<p class="about-tagline">${escapeHtml(p.tagline)}</p>` : ""}
      ${linksHtml}
    </div>
    ${bioHtml ? `<div class="markdown-body about-bio">${bioHtml}</div>` : ""}
  `;
}
