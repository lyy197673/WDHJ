// 推荐网站数据 — 由编辑器维护
// 格式: [{ category: '分类名', icon: '🎨', items: [{ name: '站名', desc: '描述', url: 'https://...', icon: '🔗' }] }]
const SITE_LINKS = [
    {
        category: '实用工具',
        icon: '📂',
        items: [
            { name: 'aix下载器', desc: '一键检测网页的图片、视频、文档，并且下载', url: 'https://aixdownloader.com/zh/', icon: '⬇️' },
            { name: 'Remove.bg', desc: 'AI 自动抠图，一键去除背景', url: 'https://www.remove.bg/zh', icon: '✂️' },
            { name: 'TinyPNG', desc: '在线压缩 PNG/JPG 图片，保持画质', url: 'https://tinypng.com/', icon: '🐼' },
            { name: 'DeepL', desc: '比 Google 翻译更准确的在线翻译工具', url: 'https://www.deepl.com/zh', icon: '🌍' },
        ]
    },
    {
        category: 'AI 工具',
        icon: '🤖',
        items: [
            { name: 'ChatGPT', desc: 'OpenAI 出品的 AI 对话助手，写代码/写作/问答', url: 'https://chat.openai.com/', icon: '💬' },
            { name: 'Claude', desc: 'Anthropic 出品，擅长长文分析与代码', url: 'https://claude.ai/', icon: '🧠' },
            { name: 'Midjourney', desc: 'AI 绘画，生成高质量艺术图片', url: 'https://www.midjourney.com/', icon: '🎨' },
            { name: '通义千问', desc: '阿里出品的 AI 大模型，中文能力强', url: 'https://tongyi.aliyun.com/', icon: '🔮' },
        ]
    },
    {
        category: '设计资源',
        icon: '🎨',
        items: [
            { name: 'Dribbble', desc: '设计师作品展示平台，灵感来源', url: 'https://dribbble.com/', icon: '🏀' },
            { name: 'Figma', desc: '在线协作 UI 设计工具，免费好用', url: 'https://www.figma.com/', icon: '🖌️' },
            { name: 'IconFont', desc: '阿里巴巴矢量图标库，海量免费图标', url: 'https://www.iconfont.cn/', icon: '🎯' },
            { name: 'Unsplash', desc: '高质量免费图片素材，商用无忧', url: 'https://unsplash.com/', icon: '📷' },
        ]
    },
    {
        category: '开发资源',
        icon: '💻',
        items: [
            { name: 'GitHub', desc: '全球最大的代码托管平台', url: 'https://github.com/', icon: '🐙' },
            { name: 'Stack Overflow', desc: '程序员问答社区，代码问题都能找到答案', url: 'https://stackoverflow.com/', icon: '📚' },
            { name: 'Can I Use', desc: '前端兼容性查询，一目了然', url: 'https://caniuse.com/', icon: '🌐' },
            { name: 'CodePen', desc: '前端在线编辑器，即时预览 HTML/CSS/JS', url: 'https://codepen.io/', icon: '✏️' },
        ]
    },
];

// Node.js CommonJS 兼容 (供 scripts/server.js require 使用)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SITE_LINKS;
}
