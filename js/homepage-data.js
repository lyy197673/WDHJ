// 首页数据 — 由编辑器导出，请勿手动编辑
const HOMEPAGE_DATA = {
    hero: {
    "title": "实用小工具",
    "desc": "纯本地浏览器处理文档，隐私安全，快速便捷。无广告、全免费，上传不限速、下载不卡顿",
    "badges": [
        {
            "icon": "🔒",
            "text": "本地处理"
        },
        {
            "icon": "⚡",
            "text": "高效快捷"
        },
        {
            "icon": "🎯",
            "text": "极速构建"
        },
        {
            "icon": "📱",
            "text": "多端适配"
        }
    ]
},
    tools: [
    {
        "id": "image",
        "icon": "🖼️",
        "iconClass": "image",
        "title": "图片工具",
        "desc": "拼图 · 裁剪 · 压缩 · 转换 · 像素调整 · 水印添加",
        "route": "#/image"
    },
    {
        "id": "pdf",
        "icon": "📄",
        "iconClass": "pdf",
        "title": "PDF工具",
        "desc": "转换 · 拆分 · 合并 · 压缩",
        "route": "#/pdf"
    },
    {
        "id": "ppt",
        "icon": "📊",
        "iconClass": "ppt",
        "title": "PPT工具",
        "desc": "拆分 · 转换 · 压缩",
        "route": "#/ppt"
    },
    {
        "id": "stamp",
        "icon": "🔏",
        "iconClass": "stamp",
        "title": "盖章工具",
        "desc": "自定义印章 · 图片/PDF盖章 · 混合模式 · 批量导出",
        "route": "#/stamp"
    },
    {
        "id": "fbx-viewer",
        "icon": "🧊",
        "iconClass": "fbx",
        "title": "FBX查看器",
        "desc": "3D模型预览 · 部件编辑 · 动画播放 · 截图导出",
        "route": "#/fbx-viewer"
    }
],
    changelog: {
    "version": "v06.11.23",
    "date": "2026年6月11日",
    "sections": [
        {
            "icon": "✨",
            "title": "新增功能",
            "type": "new",
            "items": [
                {
                    "title": "盖章工具",
                    "desc": "支持导入自定义印章图片，在图片或 PDF 上自由放置印章。支持拖拽移动、旋转缩放、6 种混合模式（正片叠底、叠加等）、透明度调节，PDF 支持多页批量盖章，导出前可自定义文件名。"
                },
                {
                    "title": "推荐网站",
                    "desc": "首页新增「推荐网站」板块，收录了一些站长平时常用的小网站，纯免费"
                }
            ]
        },
        {
            "icon": "🔧",
            "title": "问题修复",
            "type": "fix",
            "items": [
                {
                    "title": "bug",
                    "desc": "修复了一些已知问题"
                }
            ]
        }
    ]
}
};
