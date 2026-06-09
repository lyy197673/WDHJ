// 宝藏链接数据 — 由编辑器维护
// 格式: [{ category: '分类名', icon: '🎨', items: [{ name: '站名', desc: '描述', url: 'https://...', icon: '🔗' }] }]
const SITE_LINKS = [
    {
        "category": "实用工具",
        "icon": "📂",
        "items": [
            {
                "name": "aix下载器",
                "desc": "一键检测网页的图片、视频、文档，并且下载",
                "url": "https://aixdownloader.com/zh/",
                "icon": ""
            }
        ]
    }
];

// Node.js CommonJS 兼容 (供 scripts/server.js require 使用)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SITE_LINKS;
}
