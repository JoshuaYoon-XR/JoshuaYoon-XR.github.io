// ===== 公共工具 =====
const CFG = window.SITE_CONFIG || {};

// 应用站点配置到页面
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
function applyBackground() {
  if (!CFG.background) return;
  const url = CFG.background.replace(/"/g, '\\"');
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
  document.body.classList.add("has-bg");
}

// ===== 主题切换 =====
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

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) toggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

// 格式化日期
function formatDate(str) {
  if (!str) return "";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// HTML 转义
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

  try {
    const res = await fetch("posts.json?_=" + Date.now());
    if (!res.ok) throw new Error("无法加载 posts.json");
    posts = await res.json();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><p>😕 加载文章列表失败</p><p style="font-size:.85rem;margin-top:8px">请确认 posts.json 存在且格式正确</p></div>`;
    return;
  }

  // 置顶优先,其余按日期倒序
  posts.sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date) - new Date(a.date);
  });

  // 收集所有标签
  const allTags = [...new Set(posts.flatMap((p) => p.tags || []))];
  const tagBar = document.getElementById("tag-bar");
  let activeTag = "";

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

  const searchInput = document.getElementById("search-input");
  let keyword = "";
  searchInput.addEventListener("input", (e) => {
    keyword = e.target.value.trim().toLowerCase();
    render();
  });

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

  // 先从清单里拿元信息
  let meta = null;
  try {
    const res = await fetch("posts.json?_=" + Date.now());
    const posts = await res.json();
    meta = posts.find((p) => p.slug === slug);
  } catch (e) {
    /* 元信息可选,失败也继续尝试加载正文 */
  }

  // 加载 Markdown 正文
  let md = "";
  try {
    const res = await fetch(`posts/${encodeURIComponent(slug)}.md?_=` + Date.now());
    if (!res.ok) throw new Error("404");
    md = await res.text();
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p>😕 找不到这篇文章</p><p><a href="index.html">返回首页</a></p></div>`;
    return;
  }

  // 渲染
  const title = meta ? meta.title : slug;
  document.title = `${title} · ${CFG.title || "博客"}`;

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

  // 配置 marked
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

  // 用 marked 渲染,标题里若已有 h1 则不重复展示 header 标题
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

  // 应用代码高亮(兜底,防止 highlight 选项未生效)
  if (window.hljs) {
    document.querySelectorAll("#md-body pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  // 移除正文首个与标题重复的 h1,避免重复
  const firstH1 = container.querySelector("#md-body > h1:first-child");
  if (firstH1 && firstH1.textContent.trim() === title.trim()) {
    firstH1.remove();
  }
}

// ===== 关于页逻辑 =====
function initAbout() {
  applyConfig();
  initTheme();

  const container = document.getElementById("about-content");
  const p = CFG.profile || {};
  const name = p.name || CFG.author || "我";

  document.title = `关于 · ${CFG.title || "博客"}`;

  // 头像:有图用图,没有用名字首字占位
  const avatar = p.avatar
    ? `<div class="about-avatar"><img src="${escapeHtml(p.avatar)}" alt="${escapeHtml(name)}" /></div>`
    : `<div class="about-avatar about-avatar-empty"><span>${escapeHtml(name.charAt(0))}</span></div>`;

  // 社交链接:过滤掉空 url
  const links = (p.links || []).filter((l) => l && l.url);
  const linksHtml = links.length
    ? `<div class="about-links">
         ${links
           .map(
             (l) =>
               `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a>`
           )
           .join("")}
       </div>`
    : "";

  // 详细介绍:Markdown 渲染
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
