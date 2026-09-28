// ===== 站点配置 =====
// 修改这里即可自定义你的博客信息
window.SITE_CONFIG = {
  title: "自语",
  subtitle: "记录技术与生活",
  author: "Your Name",
  // 你的 GitHub 用户名(用于页脚链接,可选)
  github: "your-username",
  // 每页显示的文章数量
  pageSize: 6,
  // 页脚文字
  footer: "© 2026 我的博客 · Powered by Markdown",
  // 文章首字是否放大(报纸风"首字下沉"),true 开启 / false 关闭
  dropCap: true,

  // ===== 背景图片(可选)=====
  // 留空则使用纸张纹理背景(老报纸风推荐留空)
  background: "",
  // 背景遮罩透明度 0~1,数值越大遮罩越浓、背景图越淡(保证文字清晰)
  // 浅色主题遮罩为米黄纸色,深色主题遮罩为暗褐色
  backgroundOverlay: 0.85,
  // 背景是否固定(滚动时不动)
  backgroundFixed: true,

  // ===== 个人 Profile(关于页)=====
  profile: {
    // 头像:网络地址或本地路径(如 "images/avatar.jpg"),留空则用名字首字占位
    avatar: "",
    // 名字
    name: "Joshua Yoon",
    // 一句话简介 / slogan
    tagline: "写字的人 · 记录技术与生活",
    // 详细介绍(支持 Markdown 语法,可用 \n 换行)
    bio: "你好,我是 **Your Name**。\n\n这里写你的自我介绍:你在做什么、喜欢什么、想在这个博客里分享什么。\n\n支持 Markdown,可以放列表、链接、**加粗**等。",
    // 社交链接:label 显示文字,url 地址(留空的会自动隐藏)
    links: [
      { label: "Email", url: "mailto:yxr0119@qq.com" },
    ],
  },
};
