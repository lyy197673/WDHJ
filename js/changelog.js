// 更新日志数据 — 由编辑器维护
const CHANGELOG = {
    "version": "v2.0",
    "date": "2026年6月更新",
    "sections": [
        {
            "title": "新增",
            "icon": "🆕",
            "items": [
                {
                    "tag": "新",
                    "tagClass": "new",
                    "title": "网站推荐栏目",
                    "desc": "内置了刘桑经常用的一些宝藏网站，点击会自动跳转"
                }
            ]
        }
    ]
};

// Node.js CommonJS 兼容
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CHANGELOG;
}
