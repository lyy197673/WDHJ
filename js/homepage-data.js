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
        "id": "beads",
        "icon": "🧶",
        "iconClass": "beads",
        "title": "拼豆图纸",
        "desc": "图片转拼豆 · Artkal色板 · 自由绘制 · 高清导出",
        "route": "#/beads"
    },
    {
        "id": "word",
        "icon": "📝",
        "iconClass": "word",
        "title": "Word工具",
        "desc": "图片转Word · Word转图片 · 转PDF ",
        "route": "#/word"
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
    "version": "v06.18.14",
    "date": "2026年6月18日",
    "sections": [
        {
            "icon": "✨",
            "title": "新增功能",
            "type": "new",
            "items": [
                {
                    "title": "Word工具",
                    "desc": "支持图片转Word（EasyOCR文字识别）、Word转图片、Word转PDF，文件保持源文件名，转换完成后可在下载列表中手动下载或打包下载"
                }
            ]
        }
    ]
}
};
