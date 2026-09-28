# 📝 Markdown 博客框架

一个**纯静态**、支持 Markdown 的博客框架,零构建、无需 CI,直接部署到 GitHub Pages。

## ✨ 特性

- 用 Markdown 写文章,浏览器实时渲染(marked + highlight.js)
- 现代卡片式首页,响应式布局
- 明暗主题一键切换(记忆偏好)
- 文章搜索 + 标签筛选
- 代码块自动高亮
- 零依赖构建,`push` 即上线

## 📁 目录结构

```
blog/
├── index.html      # 首页(文章列表)
├── post.html       # 文章阅读页
├── about.html      # 关于页(个人 profile)
├── app.js          # 首页 + 文章页 + 关于页逻辑
├── style.css       # 全部样式(含明暗主题)
├── config.js       # 站点配置(标题/作者/页脚/profile)
├── posts.json      # 文章清单(元信息)
├── posts/          # 存放 Markdown 文章
│   ├── welcome.md
│   └── markdown-guide.md
├── .nojekyll       # 禁用 GitHub Jekyll 处理
└── README.md
```

## ✍️ 写一篇新文章

**第 1 步**:在 `posts/` 下新建 `.md` 文件,例如 `my-post.md`。

**第 2 步**:在 `posts.json` 里加一条记录:

```json
{
  "slug": "my-post",
  "title": "我的新文章",
  "date": "2026-09-28",
  "excerpt": "首页卡片上显示的摘要。",
    "tags": ["随笔"],
    "cover": "",
    "pinned": false
}
```

> `slug` 必须与文件名(不含 `.md`)一致。
>
> **封面图 `cover`**:填图片地址(网络地址或本地 `images/xxx.jpg`),首页卡片和文章顶部都会展示,并自动套上做旧滤镜。留空则首页显示"标题首字"报纸风占位、文章页不显示封面。
>
> **置顶 `pinned`**:设为 `true` 则文章置顶,排在列表最前,并显示「📌 置顶」标记 + 酒红边框强调。可同时置顶多篇(多篇置顶之间仍按日期倒序)。不需要置顶时设为 `false` 或删掉该字段。

保存刷新即可看到。

## ⚙️ 自定义站点

编辑 `config.js` 修改标题、副标题、作者、页脚等。

## 👤 个人 Profile(关于页)

点报头右上角「关于」进入,内容在 `config.js` 的 `profile` 里配置:

```js
profile: {
  avatar: "images/avatar.jpg",   // 头像(留空显示名字首字占位)
  name: "你的名字",
  tagline: "一句话简介",
  bio: "详细介绍,支持 **Markdown**,用 \\n 换行",
  links: [
    { label: "GitHub", url: "https://github.com/xxx" },
    { label: "Email",  url: "mailto:you@example.com" },
    { label: "微博",   url: "" },  // url 留空会自动隐藏
  ],
},
```

## 🖼️ 设置背景图片

在 `config.js` 里配置:

```js
// 网络图片
background: "https://example.com/bg.jpg",
// 或本地图片(把图放进 images/ 目录)
background: "images/bg.jpg",

backgroundOverlay: 0.85, // 遮罩浓度 0~1,越大背景越淡、文字越清晰
backgroundFixed: true,   // 背景是否固定不随滚动
```

- 浅色主题自动铺白色遮罩,深色主题铺黑色遮罩,保证文字可读
- 开启背景后文章卡片会变成半透明毛玻璃效果
- `background` 留空即恢复纯色背景

## 🚀 部署到 GitHub Pages

1. 新建仓库(若想用 `用户名.github.io` 的地址,仓库名就取 `用户名.github.io`)。
2. 把本目录所有文件推送上去:

   ```bash
   git init
   git add .
   git commit -m "init blog"
   git branch -M main
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

3. 在仓库 **Settings → Pages** 中,Source 选择 `main` 分支、`/ (root)` 目录,保存。
4. 稍等片刻,访问 `https://你的用户名.github.io/仓库名/`(或 `https://你的用户名.github.io/`)。

## 💻 本地预览

由于用到 `fetch` 加载文件,不能直接双击打开 `index.html`,需要起一个本地服务器:

```bash
# Python 3
python -m http.server 8000

# 或 Node
npx serve
```

然后浏览器打开 http://localhost:8000

## 📦 依赖

Markdown 渲染与代码高亮通过 CDN 引入(marked、highlight.js),无需安装任何东西。若需完全离线,可把这两个库下载到本地并改 `post.html` 的引用路径。
