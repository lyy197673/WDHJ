# WDHJ 核心模块设计文档

## 概述

WDHJ 是一个纯前端本地文档处理Web应用。本次实现核心模块：**图片工具**和**PDF工具**。

### 范围

- 图片工具：拼图、裁剪、压缩、转换（4个子工具）
- PDF工具：转换、拆分、压缩（3个子工具）
- PPT/Word/Excel工具留待后续批次实现

### 技术栈

- 纯JavaScript，无框架
- CDN库：pdf-lib、PDF.js、JSZip、FileSaver、SheetJS、Mammoth.js、PptxGenJS
- SPA路由：hash-based（已有）

## 现有代码基础

已完成的部分：
- `index.html` — 主HTML，所有CDN库已加载
- `css/style.css` — 完整CSS框架，响应式设计
- `js/common.js` — 工具函数（Utils、Toast、Loading、Lightbox、FileUpload、SelectionManager、batchDownload、全局拖拽）
- `js/homepage.js` — 首页渲染
- `js/app.js` — SPA路由

待实现的文件：
- `js/image-tools.js`
- `js/pdf-tools.js`

## 架构决策

### 方案选择：单文件模块

每个模块一个JS文件，子工具在同一文件内通过tab切换。

理由：
- 子工具间共享文件管理、选择状态、预览逻辑
- 文件数量少，维护简单
- 沿用现有路由模式（`ImageTools.render(container, subTool)`）

## 图片工具模块 (image-tools.js)

### 模块接口

```javascript
const ImageTools = {
    render(container, subTool) {
        // 渲染tab栏：拼图 | 裁剪 | 压缩 | 转换
        // 根据subTool参数渲染对应子工具
    },
    renderCollage(container) { /* 拼图工具 */ },
    renderCrop(container) { /* 裁剪工具 */ },
    renderCompress(container) { /* 压缩工具 */ },
    renderConvert(container) { /* 转换工具 */ }
};
```

### 1.1 拼图工具 (Collage)

#### 数据模型
```javascript
{
    files: [{id, file, thumbnail, selected}],
    settings: {
        layout: 'horizontal' | 'vertical' | 'grid',
        gridCols: 2,        // 网格模式列数
        gridRows: 2,        // 网格模式行数
        gap: 0,             // 间距(px)
        borderRadius: 0,    // 圆角(px)
        bgColor: '#ffffff', // 背景色
        quality: 0.92       // 输出质量(0-1)
    }
}
```

#### UI布局
1. **上传区**：拖拽/点击上传多张图片
2. **文件网格**：缩略图网格展示，每项有复选框、删除按钮，点击放大预览
3. **控制面板**：
   - 布局模式选择（横向/竖向/网格，点击切换）
   - 网格模式：行列数输入
   - 间距滑块（0-50px）
   - 圆角滑块（0-30px）
   - 背景色选择器
   - 输出质量滑块（0-100%）
4. **预览区**：实时展示拼接效果（Canvas渲染）
5. **操作栏**：全选/反选/清空、下载拼接图、批量下载原图

#### 拼接算法
```
horizontal: 所有图片按比例缩放到相同高度，横向排列
vertical: 所有图片按比例缩放到相同宽度，纵向排列
grid: 按行列数分配位置，每格等大，图片居中绘制
```

#### 下载逻辑
- 下载拼接图：Canvas → Blob → downloadBlob
- 批量下载原图：选中文件 → JSZip打包 → batchDownload

### 1.2 裁剪工具 (Crop)

#### 数据模型
```javascript
{
    file: null,              // 单个文件
    image: null,             // Image对象
    cropBox: {x, y, w, h},  // 裁剪框坐标（相对图片）
    aspectRatio: null,       // null=自由, 1, 4/3, 16/9, 3/2
    rotation: 0,             // 0/90/180/270
    flipH: false,
    flipV: false,
    history: [],             // 操作历史栈
    historyIndex: -1         // 当前历史位置
}
```

#### UI布局
1. **上传区**：上传单张图片
2. **裁剪区**：
   - 大图显示，带可拖拽裁剪框
   - 裁剪框有4个角的resize handle
   - 拖拽裁剪框可移动位置
   - 拖拽角handle可调整大小
3. **比例预设**：自由 / 1:1 / 4:3 / 16:9 / 3:2
4. **变换操作**：旋转90°、旋转180°、旋转270°、水平翻转、垂直翻转
5. **操作栏**：撤销、重做、重置、下载

#### 裁剪框交互
- mousedown on crop-box：开始拖拽移动
- mousedown on handle：开始resize
- mousemove：更新cropBox
- mouseup：结束操作，压入历史栈

#### 裁剪执行
```
1. 创建目标尺寸的Canvas
2. 根据rotation/flipH/flipV应用变换
3. 从原图的cropBox区域绘制到Canvas
4. Canvas → Blob → 下载
```

### 1.3 压缩工具 (Compress)

#### 数据模型
```javascript
{
    files: [{
        id, file, thumbnail,
        originalSize, compressedSize, compressedBlob,
        selected, format, quality
    }],
    globalSettings: {
        quality: 80,           // 0-100
        format: 'jpeg',        // jpeg/png/webp
        maxWidth: null,        // 最大宽度（可选）
        maxHeight: null        // 最大高度（可选）
    }
}
```

#### UI布局
1. **上传区**：批量上传图片
2. **文件列表**：列表形式展示（缩略图、文件名、原大小、压缩后大小、格式）
3. **全局控制面板**：
   - 质量滑块（0-100%）
   - 输出格式选择（JPEG/PNG/WebP）
   - 最大尺寸输入（可选，保持宽高比）
   - "应用到全部"按钮
4. **统计区**：总原始大小 → 总压缩后大小，压缩率
5. **操作栏**：全选/反选/清空、下载全部（ZIP）

#### 压缩逻辑
```
1. 读取图片为Image对象
2. 如有maxWidth/maxHeight限制，计算缩放比例
3. 创建Canvas，绘制图片
4. canvas.toBlob(type, quality) 生成压缩后的Blob
5. 记录compressedSize，更新UI对比
```

### 1.4 转换工具 (Convert)

#### 数据模型
```javascript
{
    files: [{
        id, file, thumbnail, originalFormat,
        selected, outputFormat, quality, maxWidth, maxHeight,
        convertedBlob
    }],
    globalSettings: {
        outputFormat: 'png',
        quality: 0.92,
        maxWidth: null,
        maxHeight: null
    }
}
```

#### 格式支持
- 输入：jpg, jpeg, png, gif, bmp, webp, avif, heic
- 输出：jpg, png, webp, avif

#### UI布局
1. **上传区**：批量上传图片
2. **文件列表**：缩略图、文件名、原格式、大小
3. **全局控制面板**：输出格式、质量、尺寸调整、"应用到全部"
4. **操作栏**：全选/反选/清空、下载全部（ZIP）

## PDF工具模块 (pdf-tools.js)

### 模块接口

```javascript
const PDFTools = {
    render(container, subTool) {
        // 渲染tab栏：转换 | 拆分 | 压缩
        // 根据subTool参数渲染对应子工具
    },
    renderConvert(container) { /* 转换工具 */ },
    renderSplit(container) { /* 拆分工具 */ },
    renderCompress(container) { /* 压缩工具 */ }
};
```

### 2.1 转换工具 (Convert)

#### 子模式切换
通过二级tab切换：PDF转图片 | 图片转PDF | Office转PDF

#### PDF转图片
```javascript
{
    pdfFile: null,
    pdfDoc: null,          // PDF.js document
    pages: [{
        pageNum, canvas, thumbnail, selected
    }],
    settings: {
        format: 'png',     // png/jpg
        quality: 0.92      // 0-1
    }
}
```

流程：
1. 上传PDF → PDF.js加载 → 获取总页数
2. 逐页渲染为canvas（缩略图尺寸）→ 展示网格
3. 用户选择页面、设置格式/质量
4. 选中页面渲染为全尺寸canvas → toBlob → 下载

#### 图片转PDF
```javascript
{
    files: [{id, file, thumbnail}],
    settings: {
        pageSize: 'a4',        // a4/letter/auto
        orientation: 'portrait', // portrait/landscape
        imagePosition: 'center'  // center/stretch/fit
    }
}
```

流程：
1. 上传图片 → 列表展示，支持拖拽排序
2. 设置页面尺寸、方向、图片位置
3. 用pdf-lib创建PDF → 逐页添加图片
4. 下载生成的PDF

#### Office转PDF
- 说明：纯前端能力有限，提供基础转换
- Word → Mammoth.js转HTML → 嵌入PDF
- Excel → SheetJS转HTML表格 → 嵌入PDF
- PPT → 有限支持，提示用户可能有格式差异

### 2.2 拆分工具 (Split)

#### 数据模型
```javascript
{
    pdfFile: null,
    pdfDoc: null,
    totalPages: 0,
    pages: [{pageNum, canvas, thumbnail}],
    mode: 'single' | 'extract' | 'group',
    // single: 拆分为单独页面
    // extract: 提取指定页面范围
    // group: 分组拆分
    extractRange: '',      // "1-5,8,10-12"
    groups: [{
        id, startPage, endPage, name
    }]
}
```

#### UI布局
1. **上传区**：上传单个PDF
2. **页面网格**：缩略图展示所有页面，显示页码
3. **模式选择**：三个tab
4. **基础拆分**：
   - "拆分为单独页面"按钮
   - 页面范围输入框 + "提取"按钮
5. **分组拆分**：
   - "创建分组"按钮
   - 分组列表：每项显示起始页-结束页-名称，编辑/删除按钮
   - 命名规则：`{原文件名}_{起始页}-{结束页}_{分组名称}.pdf`
6. **操作栏**：执行拆分、批量下载（ZIP）

#### 拆分逻辑
```
single模式：
  for each page:
    new PDF = pdf-lib.create()
    new PDF.copyPages(pdfDoc, [pageNum])
    new PDF.addPage(copiedPage)
    下载/收集

extract模式：
  解析范围字符串 → 得到页码数组
  同上逻辑提取这些页面

group模式：
  for each group:
    提取startPage到endPage的页面
    命名为 {原文件名}_{start}-{end}_{name}.pdf
```

### 2.3 压缩工具 (Compress)

#### 数据模型
```javascript
{
    pdfFile: null,
    totalPages: 0,
    originalSize: 0,
    compressedSize: 0,
    compressedBlob: null,
    settings: {
        preset: 'recommended', // extreme/recommended/high
        imageQuality: 0.7      // 自定义图片质量
    }
}
```

#### 压缩预设
- 极致压缩：imageQuality=0.3，最大压缩
- 推荐：imageQuality=0.7，平衡
- 高质量：imageQuality=0.9，最小压缩

#### UI布局
1. **上传区**：上传单个PDF
2. **信息区**：文件名、总页数、原始大小
3. **预设选择**：三个预设按钮 + 自定义滑块
4. **对比区**：原始大小 → 压缩后大小
5. **操作栏**：下载压缩后的PDF

#### 压缩逻辑
```
纯前端PDF压缩的局限：
- pdf-lib不直接支持重新压缩已有PDF的图片流
- 实际方案：重新创建PDF，以较低质量重新嵌入图片页面

可行方案：
1. PDF.js渲染每页为canvas
2. canvas以低质量导出为JPEG blob
3. pdf-lib创建新PDF，每页添加压缩后的图片
4. 生成新的PDF文件

注意：这会将所有内容转为图片，丢失文本可选性
需在UI上提示用户这一限制
```

## 全局交互规范

### 文件选择
- 每个文件/页面项前方有复选框
- 提供全选、反选、清空选择按钮
- 显示选中数量/总数量

### 批量下载
- 单个下载：直接触发单文件下载
- 批量下载：JSZip打包，命名 `{原文件名}_批量导出_{日期时间}.zip`

### 进度与状态
- 大文件处理显示Loading overlay + 进度条
- 处理完成显示Toast提示

### 清除操作
- 每个文件项有删除按钮
- 操作栏有"清空全部"按钮

## 实现计划

### 第1批：图片工具模块 (image-tools.js)
1. 拼图工具 — 完整实现
2. 裁剪工具 — 完整实现
3. 压缩工具 — 完整实现
4. 转换工具 — 完整实现

### 第2批：PDF工具模块 (pdf-tools.js)
1. 转换工具 — PDF转图片、图片转PDF、Office转PDF
2. 拆分工具 — 基础拆分 + 分组拆分
3. 压缩工具 — 预设 + 自定义压缩

### 后续批次（不在本次范围）
- PPT工具模块 (ppt-tools.js)
- Word工具模块 (word-tools.js)
- Excel工具模块 (excel-tools.js)
