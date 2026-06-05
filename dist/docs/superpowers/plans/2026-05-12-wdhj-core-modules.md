# WDHJ 核心模块实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现图片工具（拼图/裁剪/压缩/转换）和PDF工具（转换/拆分/压缩）两个核心模块。

**Architecture:** 每个模块是单个JS文件，导出一个对象，通过 `render(container, subTool)` 方法渲染。子工具通过tab切换。复用现有common.js中的Utils、Toast、Loading、Lightbox、FileUpload、SelectionManager、batchDownload等工具。

**Tech Stack:** 纯JavaScript，Canvas API，pdf-lib，PDF.js，JSZip，FileSaver

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `js/image-tools.js` | 创建 | 图片工具模块（拼图/裁剪/压缩/转换） |
| `js/pdf-tools.js` | 创建 | PDF工具模块（转换/拆分/压缩） |

## 依赖关系

```
common.js (已有)
  ├── Utils
  ├── Toast
  ├── Loading
  ├── Lightbox
  ├── FileUpload
  ├── SelectionManager
  └── batchDownload

image-tools.js (新建)
  └── ImageTools 对象

pdf-tools.js (新建)
  └── PDFTools 对象

app.js (已有，无需修改)
  └── 路由调用 ImageTools.render() / PDFTools.render()
```

---

## Task 1: 图片工具模块 — 框架与拼图工具

**Files:**
- Create: `js/image-tools.js`

### Step 1: 创建模块壳与tab导航

创建 `js/image-tools.js`，实现模块壳、tab切换、拼图工具的完整功能。

```javascript
// ===== Image Tools Module =====

const ImageTools = {
    render(container, subTool) {
        const tabs = [
            { id: 'collage', label: '拼图' },
            { id: 'crop', label: '裁剪' },
            { id: 'compress', label: '压缩' },
            { id: 'convert', label: '转换' }
        ];

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>图片工具</h2>
                    <p>拼图 · 裁剪 · 压缩 · 转换，全部本地处理</p>
                </div>
                <div class="tool-tabs" id="image-tabs"></div>
                <div id="image-content"></div>
            </div>
        `;

        const tabsEl = document.getElementById('image-tabs');
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = `tool-tab${tab.id === subTool ? ' active' : ''}`;
            btn.textContent = tab.label;
            btn.onclick = () => {
                window.location.hash = `/image/${tab.id}`;
            };
            tabsEl.appendChild(btn);
        });

        const content = document.getElementById('image-content');
        switch (subTool) {
            case 'collage': this.renderCollage(content); break;
            case 'crop': this.renderCrop(content); break;
            case 'compress': this.renderCompress(content); break;
            case 'convert': this.renderConvert(content); break;
            default: this.renderCollage(content);
        }
    },

    // === 拼图工具 ===
    renderCollage(container) {
        const state = {
            files: [], // {id, file, thumbnail, selected}
            settings: {
                layout: 'horizontal',
                gridCols: 2,
                gridRows: 2,
                gap: 0,
                borderRadius: 0,
                bgColor: '#ffffff',
                quality: 0.92
            }
        };

        const selection = new SelectionManager();

        container.innerHTML = `
            <div id="collage-upload"></div>
            <div id="collage-files" class="file-list hidden"></div>
            <div id="collage-controls" class="controls-panel hidden">
                <h4>拼接设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>布局模式</label>
                        <div class="layout-options" id="collage-layout">
                            <div class="layout-option active" data-layout="horizontal">横向拼接</div>
                            <div class="layout-option" data-layout="vertical">竖向拼接</div>
                            <div class="layout-option" data-layout="grid">网格拼接</div>
                        </div>
                    </div>
                    <div class="control-group" id="collage-grid-size" style="display:none">
                        <label>网格大小</label>
                        <div style="display:flex;gap:8px;align-items:center">
                            <input type="number" id="collage-cols" value="2" min="1" max="10" style="width:60px">
                            <span>列 ×</span>
                            <input type="number" id="collage-rows" value="2" min="1" max="10" style="width:60px">
                            <span>行</span>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>间距: <span id="collage-gap-val">0</span>px</label>
                        <input type="range" id="collage-gap" min="0" max="50" value="0">
                    </div>
                    <div class="control-group">
                        <label>圆角: <span id="collage-radius-val">0</span>px</label>
                        <input type="range" id="collage-radius" min="0" max="30" value="0">
                    </div>
                    <div class="control-group">
                        <label>背景色</label>
                        <input type="color" id="collage-bg" value="#ffffff">
                    </div>
                    <div class="control-group">
                        <label>输出质量: <span id="collage-quality-val">92</span>%</label>
                        <input type="range" id="collage-quality" min="10" max="100" value="92">
                    </div>
                </div>
            </div>
            <div id="collage-preview" class="preview-area hidden">
                <h4>拼接预览</h4>
                <div class="preview-canvas-wrap">
                    <canvas id="collage-canvas"></canvas>
                </div>
            </div>
            <div id="collage-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="collage-count">已选 0 / 0</span>
                </div>
                <div class="action-bar-right">
                    <button class="btn" id="collage-select-all">全选</button>
                    <button class="btn" id="collage-invert">反选</button>
                    <button class="btn" id="collage-clear">清空</button>
                    <button class="btn btn-primary" id="collage-download">下载拼接图</button>
                    <button class="btn btn-success" id="collage-batch-download">批量下载原图</button>
                </div>
            </div>
        `;

        // Upload area
        FileUpload.createUploadArea(document.getElementById('collage-upload'), {
            accept: 'image/*',
            multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式',
            onFiles: (files) => this._collageAddFiles(files, state, selection)
        });

        // Layout options
        document.querySelectorAll('#collage-layout .layout-option').forEach(opt => {
            opt.onclick = () => {
                document.querySelectorAll('#collage-layout .layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.settings.layout = opt.dataset.layout;
                document.getElementById('collage-grid-size').style.display =
                    opt.dataset.layout === 'grid' ? '' : 'none';
                this._collageRenderPreview(state);
            };
        });

        // Controls
        const bindRange = (id, key, displayId) => {
            const el = document.getElementById(id);
            el.oninput = () => {
                state.settings[key] = parseInt(el.value);
                document.getElementById(displayId).textContent = el.value;
                this._collageRenderPreview(state);
            };
        };
        bindRange('collage-gap', 'gap', 'collage-gap-val');
        bindRange('collage-radius', 'borderRadius', 'collage-radius-val');
        bindRange('collage-quality', 'quality', 'collage-quality-val');

        document.getElementById('collage-bg').oninput = (e) => {
            state.settings.bgColor = e.target.value;
            this._collageRenderPreview(state);
        };

        document.getElementById('collage-cols').oninput = (e) => {
            state.settings.gridCols = parseInt(e.target.value) || 2;
            this._collageRenderPreview(state);
        };
        document.getElementById('collage-rows').oninput = (e) => {
            state.settings.gridRows = parseInt(e.target.value) || 2;
            this._collageRenderPreview(state);
        };

        // Selection actions
        document.getElementById('collage-select-all').onclick = () => {
            selection.selectAll();
            this._collageUpdateUI(state, selection);
        };
        document.getElementById('collage-invert').onclick = () => {
            selection.invertSelection();
            this._collageUpdateUI(state, selection);
        };
        document.getElementById('collage-clear').onclick = () => {
            state.files = [];
            selection.setItems([]);
            this._collageUpdateUI(state, selection);
        };

        // Download actions
        document.getElementById('collage-download').onclick = () => this._collageDownload(state);
        document.getElementById('collage-batch-download').onclick = () => this._collageBatchDownload(state, selection);

        selection.onChange = () => this._collageUpdateUI(state, selection);
    },

    async _collageAddFiles(files, state, selection) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            const thumbnail = await Utils.createThumbnail(file);
            state.files.push({
                id: Utils.uid(),
                file,
                thumbnail,
                selected: true
            });
        }
        selection.setItems(state.files);
        this._collageUpdateUI(state, selection);
    },

    _collageUpdateUI(state, selection) {
        const filesDiv = document.getElementById('collage-files');
        const controlsDiv = document.getElementById('collage-controls');
        const previewDiv = document.getElementById('collage-preview');
        const actionsDiv = document.getElementById('collage-actions');

        if (state.files.length === 0) {
            filesDiv.classList.add('hidden');
            controlsDiv.classList.add('hidden');
            previewDiv.classList.add('hidden');
            actionsDiv.classList.add('hidden');
            return;
        }

        filesDiv.classList.remove('hidden');
        controlsDiv.classList.remove('hidden');
        previewDiv.classList.remove('hidden');
        actionsDiv.classList.remove('hidden');

        // Update selection state from manager
        state.files.forEach(f => {
            f.selected = selection.isSelected(f.id);
        });

        // Render file grid
        filesDiv.innerHTML = `
            <div class="file-list-header">
                <span>已上传 ${state.files.length} 张图片</span>
            </div>
            <div class="file-grid" id="collage-file-grid"></div>
        `;

        const grid = document.getElementById('collage-file-grid');
        state.files.forEach((f, index) => {
            const item = document.createElement('div');
            item.className = `file-item${f.selected ? ' selected' : ''} sortable-item`;
            item.draggable = true;
            item.dataset.id = f.id;
            item.innerHTML = `
                <input type="checkbox" class="file-item-checkbox" ${f.selected ? 'checked' : ''}>
                <img class="file-item-thumb" src="${f.thumbnail}" alt="${f.file.name}">
                <div class="file-item-name">${f.file.name}</div>
                <div class="file-item-size">${Utils.formatSize(f.file.size)}</div>
                <button class="file-item-remove" title="移除">&times;</button>
            `;

            item.querySelector('.file-item-checkbox').onchange = (e) => {
                e.stopPropagation();
                selection.toggle(f.id);
                this._collageUpdateUI(state, selection);
            };

            item.querySelector('.file-item-remove').onclick = (e) => {
                e.stopPropagation();
                state.files = state.files.filter(sf => sf.id !== f.id);
                selection.setItems(state.files);
                this._collageUpdateUI(state, selection);
            };

            item.querySelector('.file-item-thumb').onclick = () => {
                const images = state.files.map(sf => sf.thumbnail);
                Lightbox.open(images, index);
            };

            grid.appendChild(item);
        });

        // Make sortable
        Utils.makeSortable(grid, () => {
            const newOrder = [];
            grid.querySelectorAll('.sortable-item').forEach(el => {
                const f = state.files.find(sf => sf.id === el.dataset.id);
                if (f) newOrder.push(f);
            });
            state.files = newOrder;
            this._collageRenderPreview(state);
        });

        // Update count
        document.getElementById('collage-count').textContent =
            `已选 ${selection.count} / ${selection.total}`;

        this._collageRenderPreview(state);
    },

    async _collageRenderPreview(state) {
        const selectedFiles = state.files.filter(f => f.selected);
        if (selectedFiles.length === 0) return;

        const canvas = document.getElementById('collage-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { layout, gridCols, gridRows, gap, borderRadius, bgColor, quality } = state.settings;

        // Load all images
        const images = await Promise.all(
            selectedFiles.map(f => Utils.readAsDataURL(f.file).then(Utils.loadImage))
        );

        if (layout === 'horizontal') {
            // Scale all to same height
            const targetHeight = Math.max(...images.map(i => i.naturalHeight));
            const scale = 1; // Use natural size
            let totalWidth = 0;
            images.forEach(img => {
                const ratio = targetHeight / img.naturalHeight;
                totalWidth += Math.round(img.naturalWidth * ratio) + gap;
            });
            totalWidth -= gap; // Remove last gap

            canvas.width = totalWidth;
            canvas.height = targetHeight;
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let x = 0;
            images.forEach(img => {
                const ratio = targetHeight / img.naturalHeight;
                const w = Math.round(img.naturalWidth * ratio);
                const h = targetHeight;
                if (borderRadius > 0) {
                    this._drawRoundedImage(ctx, img, x, 0, w, h, borderRadius);
                } else {
                    ctx.drawImage(img, x, 0, w, h);
                }
                x += w + gap;
            });
        } else if (layout === 'vertical') {
            // Scale all to same width
            const targetWidth = Math.max(...images.map(i => i.naturalWidth));
            let totalHeight = 0;
            images.forEach(img => {
                const ratio = targetWidth / img.naturalWidth;
                totalHeight += Math.round(img.naturalHeight * ratio) + gap;
            });
            totalHeight -= gap;

            canvas.width = targetWidth;
            canvas.height = totalHeight;
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            let y = 0;
            images.forEach(img => {
                const ratio = targetWidth / img.naturalWidth;
                const w = targetWidth;
                const h = Math.round(img.naturalHeight * ratio);
                if (borderRadius > 0) {
                    this._drawRoundedImage(ctx, img, 0, y, w, h, borderRadius);
                } else {
                    ctx.drawImage(img, 0, y, w, h);
                }
                y += h + gap;
            });
        } else {
            // Grid layout
            const cols = gridCols;
            const rows = gridRows;
            const cellWidth = Math.max(...images.map(i => i.naturalWidth));
            const cellHeight = Math.max(...images.map(i => i.naturalHeight));

            canvas.width = cols * cellWidth + (cols - 1) * gap;
            canvas.height = rows * cellHeight + (rows - 1) * gap;
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            images.forEach((img, idx) => {
                const col = idx % cols;
                const row = Math.floor(idx / cols);
                if (row >= rows) return;

                const x = col * (cellWidth + gap);
                const y = row * (cellHeight + gap);

                // Center image in cell
                const ratio = Math.min(cellWidth / img.naturalWidth, cellHeight / img.naturalHeight);
                const w = Math.round(img.naturalWidth * ratio);
                const h = Math.round(img.naturalHeight * ratio);
                const ox = x + Math.round((cellWidth - w) / 2);
                const oy = y + Math.round((cellHeight - h) / 2);

                if (borderRadius > 0) {
                    this._drawRoundedImage(ctx, img, ox, oy, w, h, borderRadius);
                } else {
                    ctx.drawImage(img, ox, oy, w, h);
                }
            });
        }
    },

    _drawRoundedImage(ctx, img, x, y, w, h, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, w, h);
        ctx.restore();
    },

    async _collageDownload(state) {
        const selectedFiles = state.files.filter(f => f.selected);
        if (selectedFiles.length === 0) {
            Toast.warning('请先选择图片');
            return;
        }
        const canvas = document.getElementById('collage-canvas');
        const quality = state.settings.quality / 100;
        const blob = await Utils.canvasToBlob(canvas, 'image/png', quality);
        Utils.downloadBlob(blob, `拼图_${Date.now()}.png`);
        Toast.success('拼接图下载完成');
    },

    async _collageBatchDownload(state, selection) {
        const selected = selection.getSelected();
        if (selected.length === 0) {
            Toast.warning('请先选择图片');
            return;
        }
        const files = selected.map(f => ({
            name: f.file.name,
            blob: f.file
        }));
        await batchDownload(files);
    },

    // === 裁剪工具占位 ===
    renderCrop(container) {
        // Task 2 实现
    },

    // === 压缩工具占位 ===
    renderCompress(container) {
        // Task 3 实现
    },

    // === 转换工具占位 ===
    renderConvert(container) {
        // Task 4 实现
    }
};
```

### Step 2: 验证模块壳与拼图工具

1. 用浏览器打开 `index.html`
2. 点击"图片工具"卡片，确认进入图片工具页面
3. 确认tab栏显示"拼图 | 裁剪 | 压缩 | 转换"
4. 确认"拼图"tab默认激活
5. 上传多张图片，确认缩略图网格展示
6. 切换布局模式，确认预览更新
7. 调整间距/圆角/背景色/质量，确认预览实时更新
8. 测试全选/反选/清空按钮
9. 测试拖拽排序
10. 测试下载拼接图
11. 测试批量下载原图

### Step 3: Commit

```bash
git add js/image-tools.js
git commit -m "feat: add image tools module with collage tool"
```

---

## Task 2: 图片裁剪工具

**Files:**
- Modify: `js/image-tools.js` — 实现 `renderCrop` 方法

### Step 1: 实现裁剪工具

在 `js/image-tools.js` 中，将 `renderCrop` 的占位实现替换为完整代码：

```javascript
renderCrop(container) {
    const state = {
        file: null,
        image: null,
        imageSrc: null,
        cropBox: { x: 0, y: 0, w: 200, h: 200 },
        aspectRatio: null, // null=自由
        rotation: 0,
        flipH: false,
        flipV: false,
        history: [],
        historyIndex: -1,
        dragging: false,
        dragType: null, // 'move', 'tl', 'tr', 'bl', 'br'
        dragStart: { x: 0, y: 0 },
        cropStart: { x: 0, y: 0, w: 0, h: 0 }
    };

    container.innerHTML = `
        <div id="crop-upload"></div>
        <div id="crop-workspace" class="hidden">
            <div class="controls-panel">
                <h4>裁剪设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>裁剪比例</label>
                        <div class="layout-options" id="crop-ratio">
                            <div class="layout-option active" data-ratio="free">自由</div>
                            <div class="layout-option" data-ratio="1:1">1:1</div>
                            <div class="layout-option" data-ratio="4:3">4:3</div>
                            <div class="layout-option" data-ratio="16:9">16:9</div>
                            <div class="layout-option" data-ratio="3:2">3:2</div>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>变换</label>
                        <div class="layout-options">
                            <button class="btn btn-sm" id="crop-rotate-left" title="左旋90°">↺ 90°</button>
                            <button class="btn btn-sm" id="crop-rotate-right" title="右旋90°">↻ 90°</button>
                            <button class="btn btn-sm" id="crop-rotate-180" title="旋转180°">180°</button>
                            <button class="btn btn-sm" id="crop-flip-h" title="水平翻转">⇔ 水平</button>
                            <button class="btn btn-sm" id="crop-flip-v" title="垂直翻转">⇕ 垂直</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="preview-area">
                <h4>裁剪区域 <small style="color:var(--text-muted);font-weight:normal">拖拽裁剪框调整位置和大小</small></h4>
                <div id="crop-container" class="crop-container"></div>
            </div>
            <div id="crop-preview-area" class="preview-area">
                <h4>裁剪预览</h4>
                <div class="preview-canvas-wrap">
                    <canvas id="crop-preview-canvas"></canvas>
                </div>
            </div>
            <div class="action-bar">
                <div class="action-bar-left">
                    <button class="btn" id="crop-undo" disabled>撤销</button>
                    <button class="btn" id="crop-redo" disabled>重做</button>
                    <button class="btn" id="crop-reset">重置</button>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="crop-download">下载裁剪图</button>
                </div>
            </div>
        </div>
    `;

    FileUpload.createUploadArea(document.getElementById('crop-upload'), {
        accept: 'image/*',
        multiple: false,
        hint: '上传单张图片进行裁剪',
        onFiles: async (files) => {
            if (files.length === 0) return;
            state.file = files[0];
            state.imageSrc = await Utils.readAsDataURL(state.file);
            state.image = await Utils.loadImage(state.imageSrc);
            state.rotation = 0;
            state.flipH = false;
            state.flipV = false;
            state.history = [];
            state.historyIndex = -1;

            // Init crop box to center 80%
            const imgW = state.image.naturalWidth;
            const imgH = state.image.naturalHeight;
            const margin = 0.1;
            state.cropBox = {
                x: Math.round(imgW * margin),
                y: Math.round(imgH * margin),
                w: Math.round(imgW * (1 - 2 * margin)),
                h: Math.round(imgH * (1 - 2 * margin))
            };

            document.getElementById('crop-upload').classList.add('hidden');
            document.getElementById('crop-workspace').classList.remove('hidden');

            this._cropSaveHistory(state);
            this._cropRender(state);
        }
    });

    // Ratio buttons
    document.querySelectorAll('#crop-ratio .layout-option').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('#crop-ratio .layout-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const ratio = opt.dataset.ratio;
            if (ratio === 'free') {
                state.aspectRatio = null;
            } else {
                const [w, h] = ratio.split(':').map(Number);
                state.aspectRatio = w / h;
                // Adjust crop box to match ratio
                this._cropApplyRatio(state);
            }
            this._cropRender(state);
        };
    });

    // Transform buttons
    document.getElementById('crop-rotate-left').onclick = () => {
        state.rotation = (state.rotation - 90 + 360) % 360;
        this._cropSaveHistory(state);
        this._cropRender(state);
    };
    document.getElementById('crop-rotate-right').onclick = () => {
        state.rotation = (state.rotation + 90) % 360;
        this._cropSaveHistory(state);
        this._cropRender(state);
    };
    document.getElementById('crop-rotate-180').onclick = () => {
        state.rotation = (state.rotation + 180) % 360;
        this._cropSaveHistory(state);
        this._cropRender(state);
    };
    document.getElementById('crop-flip-h').onclick = () => {
        state.flipH = !state.flipH;
        this._cropSaveHistory(state);
        this._cropRender(state);
    };
    document.getElementById('crop-flip-v').onclick = () => {
        state.flipV = !state.flipV;
        this._cropSaveHistory(state);
        this._cropRender(state);
    };

    // Undo/Redo
    document.getElementById('crop-undo').onclick = () => {
        if (state.historyIndex > 0) {
            state.historyIndex--;
            const snap = state.history[state.historyIndex];
            state.cropBox = { ...snap.cropBox };
            state.rotation = snap.rotation;
            state.flipH = snap.flipH;
            state.flipV = snap.flipV;
            this._cropRender(state);
            this._cropUpdateHistoryButtons(state);
        }
    };
    document.getElementById('crop-redo').onclick = () => {
        if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            const snap = state.history[state.historyIndex];
            state.cropBox = { ...snap.cropBox };
            state.rotation = snap.rotation;
            state.flipH = snap.flipH;
            state.flipV = snap.flipV;
            this._cropRender(state);
            this._cropUpdateHistoryButtons(state);
        }
    };
    document.getElementById('crop-reset').onclick = () => {
        const imgW = state.image.naturalWidth;
        const imgH = state.image.naturalHeight;
        const margin = 0.1;
        state.cropBox = {
            x: Math.round(imgW * margin),
            y: Math.round(imgH * margin),
            w: Math.round(imgW * (1 - 2 * margin)),
            h: Math.round(imgH * (1 - 2 * margin))
        };
        state.rotation = 0;
        state.flipH = false;
        state.flipV = false;
        this._cropSaveHistory(state);
        this._cropRender(state);
    };

    // Download
    document.getElementById('crop-download').onclick = () => this._cropDownload(state);
},

_cropApplyRatio(state) {
    if (!state.aspectRatio || !state.image) return;
    const { x, y, w, h } = state.cropBox;
    const cx = x + w / 2;
    const cy = y + h / 2;
    let newW = w;
    let newH = h;
    if (w / h > state.aspectRatio) {
        newW = Math.round(h * state.aspectRatio);
    } else {
        newH = Math.round(w / state.aspectRatio);
    }
    // Clamp to image bounds
    const imgW = state.image.naturalWidth;
    const imgH = state.image.naturalHeight;
    newW = Math.min(newW, imgW);
    newH = Math.min(newH, imgH);
    if (state.aspectRatio) {
        if (newW / newH > state.aspectRatio) {
            newW = Math.round(newH * state.aspectRatio);
        } else {
            newH = Math.round(newW / state.aspectRatio);
        }
    }
    let newX = Math.round(cx - newW / 2);
    let newY = Math.round(cy - newH / 2);
    newX = Utils.clamp(newX, 0, imgW - newW);
    newY = Utils.clamp(newY, 0, imgH - newH);
    state.cropBox = { x: newX, y: newY, w: newW, h: newH };
},

_cropSaveHistory(state) {
    // Remove future history
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push({
        cropBox: { ...state.cropBox },
        rotation: state.rotation,
        flipH: state.flipH,
        flipV: state.flipV
    });
    // Limit history
    if (state.history.length > 20) {
        state.history.shift();
    }
    state.historyIndex = state.history.length - 1;
    this._cropUpdateHistoryButtons(state);
},

_cropUpdateHistoryButtons(state) {
    document.getElementById('crop-undo').disabled = state.historyIndex <= 0;
    document.getElementById('crop-redo').disabled = state.historyIndex >= state.history.length - 1;
},

_cropRender(state) {
    const container = document.getElementById('crop-container');
    if (!container || !state.image) return;

    // Display image scaled to fit container
    const maxW = container.parentElement.clientWidth - 40;
    const imgW = state.image.naturalWidth;
    const imgH = state.image.naturalHeight;
    const scale = Math.min(maxW / imgW, 1);

    const displayW = Math.round(imgW * scale);
    const displayH = Math.round(imgH * scale);

    container.style.width = displayW + 'px';
    container.style.height = displayH + 'px';

    container.innerHTML = `
        <img src="${state.imageSrc}" style="width:${displayW}px;height:${displayH}px;display:block"
             draggable="false">
        <div class="crop-box" id="crop-box"
             style="left:${state.cropBox.x * scale}px;top:${state.cropBox.y * scale}px;width:${state.cropBox.w * scale}px;height:${state.cropBox.h * scale}px">
            <div class="crop-handle tl" data-handle="tl"></div>
            <div class="crop-handle tr" data-handle="tr"></div>
            <div class="crop-handle bl" data-handle="bl"></div>
            <div class="crop-handle br" data-handle="br"></div>
        </div>
    `;

    // Setup drag handlers
    this._cropSetupDrag(state, container, scale);
    this._cropUpdatePreview(state);
},

_cropSetupDrag(state, container, scale) {
    const cropBox = container.querySelector('#crop-box');
    if (!cropBox) return;

    const onMouseDown = (e) => {
        e.preventDefault();
        const handle = e.target.dataset.handle;
        if (handle) {
            state.dragType = handle;
        } else if (e.target === cropBox || e.target.closest('#crop-box')) {
            state.dragType = 'move';
        } else {
            return;
        }
        state.dragging = true;
        state.dragStart = { x: e.clientX, y: e.clientY };
        state.cropStart = { ...state.cropBox };

        const onMouseMove = (e) => {
            if (!state.dragging) return;
            const dx = (e.clientX - state.dragStart.x) / scale;
            const dy = (e.clientY - state.dragStart.y) / scale;
            const imgW = state.image.naturalWidth;
            const imgH = state.image.naturalHeight;
            const { x, y, w, h } = state.cropStart;

            if (state.dragType === 'move') {
                state.cropBox.x = Utils.clamp(x + dx, 0, imgW - w);
                state.cropBox.y = Utils.clamp(y + dy, 0, imgH - h);
            } else if (state.dragType === 'br') {
                state.cropBox.w = Utils.clamp(w + dx, 20, imgW - x);
                state.cropBox.h = Utils.clamp(h + dy, 20, imgH - y);
                if (state.aspectRatio) {
                    state.cropBox.h = state.cropBox.w / state.aspectRatio;
                }
            } else if (state.dragType === 'bl') {
                const newW = Utils.clamp(w - dx, 20, x + w);
                const newX = x + w - newW;
                state.cropBox.w = newW;
                state.cropBox.x = newX;
                state.cropBox.h = Utils.clamp(h + dy, 20, imgH - y);
                if (state.aspectRatio) {
                    state.cropBox.h = state.cropBox.w / state.aspectRatio;
                }
            } else if (state.dragType === 'tr') {
                state.cropBox.w = Utils.clamp(w + dx, 20, imgW - x);
                const newH = Utils.clamp(h - dy, 20, y + h);
                const newY = y + h - newH;
                state.cropBox.h = newH;
                state.cropBox.y = newY;
                if (state.aspectRatio) {
                    state.cropBox.w = state.cropBox.h * state.aspectRatio;
                }
            } else if (state.dragType === 'tl') {
                const newW = Utils.clamp(w - dx, 20, x + w);
                const newX = x + w - newW;
                const newH = Utils.clamp(h - dy, 20, y + h);
                const newY = y + h - newH;
                state.cropBox.w = newW;
                state.cropBox.x = newX;
                state.cropBox.h = newH;
                state.cropBox.y = newY;
                if (state.aspectRatio) {
                    state.cropBox.w = state.cropBox.h * state.aspectRatio;
                }
            }

            // Update display
            cropBox.style.left = state.cropBox.x * scale + 'px';
            cropBox.style.top = state.cropBox.y * scale + 'px';
            cropBox.style.width = state.cropBox.w * scale + 'px';
            cropBox.style.height = state.cropBox.h * scale + 'px';
            this._cropUpdatePreview(state);
        };

        const onMouseUp = () => {
            if (state.dragging) {
                state.dragging = false;
                state.dragType = null;
                this._cropSaveHistory(state);
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    cropBox.addEventListener('mousedown', onMouseDown);
},

_cropUpdatePreview(state) {
    const canvas = document.getElementById('crop-preview-canvas');
    if (!canvas || !state.image) return;

    const { x, y, w, h } = state.cropBox;
    const previewSize = 200;
    const ratio = Math.min(previewSize / w, previewSize / h);

    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);

    const ctx = canvas.getContext('2d');
    ctx.save();

    // Apply rotation and flip
    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (state.rotation === 90) ctx.rotate(Math.PI / 2);
    else if (state.rotation === 180) ctx.rotate(Math.PI);
    else if (state.rotation === 270) ctx.rotate(-Math.PI / 2);
    if (state.flipH) ctx.scale(-1, 1);
    if (state.flipV) ctx.scale(1, -1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(state.image, x, y, w, h, 0, 0, canvas.width, canvas.height);
    ctx.restore();
},

async _cropDownload(state) {
    if (!state.image) return;

    const { x, y, w, h } = state.cropBox;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w);
    canvas.height = Math.round(h);
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (state.rotation === 90) ctx.rotate(Math.PI / 2);
    else if (state.rotation === 180) ctx.rotate(Math.PI);
    else if (state.rotation === 270) ctx.rotate(-Math.PI / 2);
    if (state.flipH) ctx.scale(-1, 1);
    if (state.flipV) ctx.scale(1, -1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(state.image, x, y, w, h, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const blob = await Utils.canvasToBlob(canvas, 'image/png');
    const baseName = Utils.getBaseName(state.file.name);
    Utils.downloadBlob(blob, `${baseName}_裁剪.png`);
    Toast.success('裁剪图下载完成');
},
```

### Step 2: 验证裁剪工具

1. 切换到"裁剪"tab
2. 上传一张图片
3. 确认裁剪框显示在图片中央
4. 拖拽裁剪框移动位置
5. 拖拽四个角的handle调整大小
6. 切换裁剪比例（1:1, 4:3, 16:9），确认裁剪框自动调整
7. 测试旋转和翻转按钮
8. 测试撤销/重做
9. 确认预览区实时更新
10. 下载裁剪后的图片

### Step 3: Commit

```bash
git add js/image-tools.js
git commit -m "feat: add image crop tool with ratio presets and transforms"
```

---

## Task 3: 图片压缩工具

**Files:**
- Modify: `js/image-tools.js` — 实现 `renderCompress` 方法

### Step 1: 实现压缩工具

```javascript
renderCompress(container) {
    const state = {
        files: [], // {id, file, thumbnail, originalSize, compressedSize, compressedBlob, selected}
        settings: {
            quality: 80,
            format: 'jpeg',
            maxWidth: null,
            maxHeight: null
        }
    };

    const selection = new SelectionManager();

    container.innerHTML = `
        <div id="compress-upload"></div>
        <div id="compress-files" class="file-list hidden"></div>
        <div id="compress-controls" class="controls-panel hidden">
            <h4>压缩设置</h4>
            <div class="controls-grid">
                <div class="control-group">
                    <label>压缩质量: <span id="compress-quality-val">80</span>%</label>
                    <input type="range" id="compress-quality" min="1" max="100" value="80">
                </div>
                <div class="control-group">
                    <label>输出格式</label>
                    <select id="compress-format">
                        <option value="jpeg">JPEG</option>
                        <option value="png">PNG</option>
                        <option value="webp">WebP</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>最大宽度（可选）</label>
                    <input type="number" id="compress-max-w" placeholder="不限制" min="1">
                </div>
                <div class="control-group">
                    <label>最大高度（可选）</label>
                    <input type="number" id="compress-max-h" placeholder="不限制" min="1">
                </div>
            </div>
            <div style="margin-top:12px">
                <button class="btn btn-sm" id="compress-apply-all">应用到全部选中图片</button>
            </div>
        </div>
        <div id="compress-stats" class="stats-row hidden"></div>
        <div id="compress-actions" class="action-bar hidden">
            <div class="action-bar-left">
                <span id="compress-count">已选 0 / 0</span>
            </div>
            <div class="action-bar-right">
                <button class="btn" id="compress-select-all">全选</button>
                <button class="btn" id="compress-invert">反选</button>
                <button class="btn" id="compress-clear">清空</button>
                <button class="btn btn-primary" id="compress-download-all">下载全部（ZIP）</button>
            </div>
        </div>
    `;

    FileUpload.createUploadArea(document.getElementById('compress-upload'), {
        accept: 'image/*',
        multiple: true,
        hint: '支持批量上传图片进行压缩',
        onFiles: (files) => this._compressAddFiles(files, state, selection)
    });

    // Controls
    const qualityEl = document.getElementById('compress-quality');
    qualityEl.oninput = () => {
        state.settings.quality = parseInt(qualityEl.value);
        document.getElementById('compress-quality-val').textContent = qualityEl.value;
    };

    document.getElementById('compress-format').onchange = (e) => {
        state.settings.format = e.target.value;
    };

    document.getElementById('compress-apply-all').onclick = () => this._compressApplyAll(state, selection);

    // Selection actions
    document.getElementById('compress-select-all').onclick = () => {
        selection.selectAll();
        this._compressUpdateUI(state, selection);
    };
    document.getElementById('compress-invert').onclick = () => {
        selection.invertSelection();
        this._compressUpdateUI(state, selection);
    };
    document.getElementById('compress-clear').onclick = () => {
        state.files = [];
        selection.setItems([]);
        this._compressUpdateUI(state, selection);
    };

    document.getElementById('compress-download-all').onclick = () => this._compressDownloadAll(state, selection);

    selection.onChange = () => this._compressUpdateUI(state, selection);
},

async _compressAddFiles(files, state, selection) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const thumbnail = await Utils.createThumbnail(file);
        state.files.push({
            id: Utils.uid(),
            file,
            thumbnail,
            originalSize: file.size,
            compressedSize: null,
            compressedBlob: null,
            selected: true
        });
    }
    selection.setItems(state.files);
    this._compressUpdateUI(state, selection);
},

async _compressApplyAll(state, selection) {
    const selected = selection.getSelected();
    if (selected.length === 0) {
        Toast.warning('请先选择图片');
        return;
    }

    Loading.show('正在压缩...');
    const { quality, format, maxWidth, maxHeight } = state.settings;
    const mime = `image/${format}`;
    const q = quality / 100;

    for (let i = 0; i < selected.length; i++) {
        const f = selected[i];
        Loading.progress(Math.round((i + 1) / selected.length * 100));
        Loading.setText(`正在压缩 ${i + 1}/${selected.length}...`);

        const dataUrl = await Utils.readAsDataURL(f.file);
        const img = await Utils.loadImage(dataUrl);

        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (maxWidth && w > maxWidth) {
            h = Math.round(h * maxWidth / w);
            w = maxWidth;
        }
        if (maxHeight && h > maxHeight) {
            w = Math.round(w * maxHeight / h);
            h = maxHeight;
        }

        const canvas = Utils.imageToCanvas(img, w, h);
        f.compressedBlob = await Utils.canvasToBlob(canvas, mime, q);
        f.compressedSize = f.compressedBlob.size;
    }

    Loading.hide();
    Toast.success(`已压缩 ${selected.length} 张图片`);
    this._compressUpdateUI(state, selection);
},

_compressUpdateUI(state, selection) {
    const filesDiv = document.getElementById('compress-files');
    const controlsDiv = document.getElementById('compress-controls');
    const statsDiv = document.getElementById('compress-stats');
    const actionsDiv = document.getElementById('compress-actions');

    if (state.files.length === 0) {
        filesDiv.classList.add('hidden');
        controlsDiv.classList.add('hidden');
        statsDiv.classList.add('hidden');
        actionsDiv.classList.add('hidden');
        return;
    }

    filesDiv.classList.remove('hidden');
    controlsDiv.classList.remove('hidden');
    actionsDiv.classList.remove('hidden');

    state.files.forEach(f => {
        f.selected = selection.isSelected(f.id);
    });

    // Render file list
    filesDiv.innerHTML = `
        <div class="file-list-header">
            <span>已上传 ${state.files.length} 张图片</span>
        </div>
        <div class="file-list-view" id="compress-file-list"></div>
    `;

    const list = document.getElementById('compress-file-list');
    state.files.forEach(f => {
        const row = document.createElement('div');
        row.className = `file-list-row${f.selected ? ' selected' : ''}`;
        const sizeInfo = f.compressedSize
            ? `<span style="color:var(--success)">${Utils.formatSize(f.compressedSize)}</span> <span style="color:var(--text-muted)">(${Math.round((1 - f.compressedSize / f.originalSize) * 100)}% 减少)</span>`
            : '<span style="color:var(--text-muted)">未压缩</span>';
        row.innerHTML = `
            <input type="checkbox" class="file-item-checkbox" ${f.selected ? 'checked' : ''}>
            <img class="file-list-row-thumb" src="${f.thumbnail}" alt="${f.file.name}">
            <div class="file-list-row-info">
                <div class="file-list-row-name">${f.file.name}</div>
                <div class="file-list-row-meta">${Utils.formatSize(f.originalSize)} → ${sizeInfo}</div>
            </div>
            <button class="btn btn-sm" ${f.compressedBlob ? '' : 'disabled'}>下载</button>
            <button class="btn btn-sm btn-danger" title="移除">&times;</button>
        `;

        row.querySelector('.file-item-checkbox').onchange = () => {
            selection.toggle(f.id);
            this._compressUpdateUI(state, selection);
        };

        const downloadBtn = row.querySelectorAll('.btn')[0];
        if (f.compressedBlob) {
            downloadBtn.onclick = () => {
                const baseName = Utils.getBaseName(f.file.name);
                Utils.downloadBlob(f.compressedBlob, `${baseName}_compressed.${state.settings.format}`);
            };
        }

        row.querySelector('.btn-danger').onclick = () => {
            state.files = state.files.filter(sf => sf.id !== f.id);
            selection.setItems(state.files);
            this._compressUpdateUI(state, selection);
        };

        list.appendChild(row);
    });

    // Update count
    document.getElementById('compress-count').textContent =
        `已选 ${selection.count} / ${selection.total}`;

    // Update stats
    const compressedFiles = state.files.filter(f => f.compressedSize);
    if (compressedFiles.length > 0) {
        statsDiv.classList.remove('hidden');
        const totalOriginal = compressedFiles.reduce((s, f) => s + f.originalSize, 0);
        const totalCompressed = compressedFiles.reduce((s, f) => s + f.compressedSize, 0);
        const ratio = Math.round((1 - totalCompressed / totalOriginal) * 100);
        statsDiv.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${Utils.formatSize(totalOriginal)}</div>
                <div class="stat-label">原始总大小</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Utils.formatSize(totalCompressed)}</div>
                <div class="stat-label">压缩后总大小</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${ratio}%</div>
                <div class="stat-label">压缩率</div>
            </div>
        `;
    } else {
        statsDiv.classList.add('hidden');
    }
},

async _compressDownloadAll(state, selection) {
    const selected = selection.getSelected().filter(f => f.compressedBlob);
    if (selected.length === 0) {
        Toast.warning('没有已压缩的图片可下载');
        return;
    }
    const format = state.settings.format;
    const files = selected.map(f => ({
        name: `${Utils.getBaseName(f.file.name)}_compressed.${format}`,
        blob: f.compressedBlob
    }));
    await batchDownload(files);
},
```

### Step 2: 验证压缩工具

1. 切换到"压缩"tab
2. 批量上传多张图片
3. 调整压缩质量滑块
4. 选择输出格式
5. 点击"应用到全部选中图片"
6. 确认每张图片显示压缩前后大小对比
7. 确认底部统计区显示总大小和压缩率
8. 测试单个下载
9. 测试批量ZIP下载

### Step 3: Commit

```bash
git add js/image-tools.js
git commit -m "feat: add image compress tool with batch processing"
```

---

## Task 4: 图片转换工具

**Files:**
- Modify: `js/image-tools.js` — 实现 `renderConvert` 方法

### Step 1: 实现转换工具

```javascript
renderConvert(container) {
    const state = {
        files: [], // {id, file, thumbnail, originalFormat, selected, convertedBlob}
        settings: {
            outputFormat: 'png',
            quality: 92,
            maxWidth: null,
            maxHeight: null
        }
    };

    const selection = new SelectionManager();

    container.innerHTML = `
        <div id="convert-upload"></div>
        <div id="convert-files" class="file-list hidden"></div>
        <div id="convert-controls" class="controls-panel hidden">
            <h4>转换设置</h4>
            <div class="controls-grid">
                <div class="control-group">
                    <label>输出格式</label>
                    <select id="convert-format">
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WebP</option>
                        <option value="avif">AVIF</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>输出质量: <span id="convert-quality-val">92</span>%</label>
                    <input type="range" id="convert-quality" min="10" max="100" value="92">
                </div>
                <div class="control-group">
                    <label>最大宽度（可选）</label>
                    <input type="number" id="convert-max-w" placeholder="不限制" min="1">
                </div>
                <div class="control-group">
                    <label>最大高度（可选）</label>
                    <input type="number" id="convert-max-h" placeholder="不限制" min="1">
                </div>
            </div>
            <div style="margin-top:12px">
                <button class="btn btn-sm" id="convert-apply-all">转换全部选中图片</button>
            </div>
        </div>
        <div id="convert-actions" class="action-bar hidden">
            <div class="action-bar-left">
                <span id="convert-count">已选 0 / 0</span>
            </div>
            <div class="action-bar-right">
                <button class="btn" id="convert-select-all">全选</button>
                <button class="btn" id="convert-invert">反选</button>
                <button class="btn" id="convert-clear">清空</button>
                <button class="btn btn-primary" id="convert-download-all">下载全部（ZIP）</button>
            </div>
        </div>
    `;

    FileUpload.createUploadArea(document.getElementById('convert-upload'), {
        accept: 'image/*',
        multiple: true,
        hint: '支持 JPG、PNG、GIF、BMP、WebP、AVIF 等格式',
        onFiles: (files) => this._convertAddFiles(files, state, selection)
    });

    // Controls
    document.getElementById('convert-format').onchange = (e) => {
        state.settings.outputFormat = e.target.value;
    };

    const qualityEl = document.getElementById('convert-quality');
    qualityEl.oninput = () => {
        state.settings.quality = parseInt(qualityEl.value);
        document.getElementById('convert-quality-val').textContent = qualityEl.value;
    };

    document.getElementById('convert-apply-all').onclick = () => this._convertApplyAll(state, selection);

    // Selection actions
    document.getElementById('convert-select-all').onclick = () => {
        selection.selectAll();
        this._convertUpdateUI(state, selection);
    };
    document.getElementById('convert-invert').onclick = () => {
        selection.invertSelection();
        this._convertUpdateUI(state, selection);
    };
    document.getElementById('convert-clear').onclick = () => {
        state.files = [];
        selection.setItems([]);
        this._convertUpdateUI(state, selection);
    };

    document.getElementById('convert-download-all').onclick = () => this._convertDownloadAll(state, selection);

    selection.onChange = () => this._convertUpdateUI(state, selection);
},

async _convertAddFiles(files, state, selection) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const thumbnail = await Utils.createThumbnail(file);
        const ext = Utils.getExtension(file.name);
        state.files.push({
            id: Utils.uid(),
            file,
            thumbnail,
            originalFormat: ext.toUpperCase(),
            selected: true,
            convertedBlob: null
        });
    }
    selection.setItems(state.files);
    this._convertUpdateUI(state, selection);
},

async _convertApplyAll(state, selection) {
    const selected = selection.getSelected();
    if (selected.length === 0) {
        Toast.warning('请先选择图片');
        return;
    }

    Loading.show('正在转换...');
    const { outputFormat, quality, maxWidth, maxHeight } = state.settings;
    const mime = `image/${outputFormat}`;
    const q = quality / 100;

    for (let i = 0; i < selected.length; i++) {
        const f = selected[i];
        Loading.progress(Math.round((i + 1) / selected.length * 100));
        Loading.setText(`正在转换 ${i + 1}/${selected.length}...`);

        const dataUrl = await Utils.readAsDataURL(f.file);
        const img = await Utils.loadImage(dataUrl);

        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (maxWidth && w > maxWidth) {
            h = Math.round(h * maxWidth / w);
            w = maxWidth;
        }
        if (maxHeight && h > maxHeight) {
            w = Math.round(w * maxHeight / h);
            h = maxHeight;
        }

        const canvas = Utils.imageToCanvas(img, w, h);
        f.convertedBlob = await Utils.canvasToBlob(canvas, mime, q);
    }

    Loading.hide();
    Toast.success(`已转换 ${selected.length} 张图片`);
    this._convertUpdateUI(state, selection);
},

_convertUpdateUI(state, selection) {
    const filesDiv = document.getElementById('convert-files');
    const controlsDiv = document.getElementById('convert-controls');
    const actionsDiv = document.getElementById('convert-actions');

    if (state.files.length === 0) {
        filesDiv.classList.add('hidden');
        controlsDiv.classList.add('hidden');
        actionsDiv.classList.add('hidden');
        return;
    }

    filesDiv.classList.remove('hidden');
    controlsDiv.classList.remove('hidden');
    actionsDiv.classList.remove('hidden');

    state.files.forEach(f => {
        f.selected = selection.isSelected(f.id);
    });

    filesDiv.innerHTML = `
        <div class="file-list-header">
            <span>已上传 ${state.files.length} 张图片</span>
        </div>
        <div class="file-list-view" id="convert-file-list"></div>
    `;

    const list = document.getElementById('convert-file-list');
    state.files.forEach(f => {
        const row = document.createElement('div');
        row.className = `file-list-row${f.selected ? ' selected' : ''}`;
        const status = f.convertedBlob
            ? `<span style="color:var(--success)">已转换 (${Utils.formatSize(f.convertedBlob.size)})</span>`
            : '<span style="color:var(--text-muted)">未转换</span>';
        row.innerHTML = `
            <input type="checkbox" class="file-item-checkbox" ${f.selected ? 'checked' : ''}>
            <img class="file-list-row-thumb" src="${f.thumbnail}" alt="${f.file.name}">
            <div class="file-list-row-info">
                <div class="file-list-row-name">${f.file.name}</div>
                <div class="file-list-row-meta">${f.originalFormat} · ${Utils.formatSize(f.file.size)} → ${status}</div>
            </div>
            <button class="btn btn-sm" ${f.convertedBlob ? '' : 'disabled'}>下载</button>
            <button class="btn btn-sm btn-danger">&times;</button>
        `;

        row.querySelector('.file-item-checkbox').onchange = () => {
            selection.toggle(f.id);
            this._convertUpdateUI(state, selection);
        };

        const downloadBtn = row.querySelectorAll('.btn')[0];
        if (f.convertedBlob) {
            downloadBtn.onclick = () => {
                const baseName = Utils.getBaseName(f.file.name);
                Utils.downloadBlob(f.convertedBlob, `${baseName}.${state.settings.outputFormat}`);
            };
        }

        row.querySelector('.btn-danger').onclick = () => {
            state.files = state.files.filter(sf => sf.id !== f.id);
            selection.setItems(state.files);
            this._convertUpdateUI(state, selection);
        };

        list.appendChild(row);
    });

    document.getElementById('convert-count').textContent =
        `已选 ${selection.count} / ${selection.total}`;
},

async _convertDownloadAll(state, selection) {
    const selected = selection.getSelected().filter(f => f.convertedBlob);
    if (selected.length === 0) {
        Toast.warning('没有已转换的图片可下载');
        return;
    }
    const format = state.settings.outputFormat;
    const files = selected.map(f => ({
        name: `${Utils.getBaseName(f.file.name)}.${format}`,
        blob: f.convertedBlob
    }));
    await batchDownload(files);
},
```

### Step 2: 验证转换工具

1. 切换到"转换"tab
2. 批量上传不同格式的图片
3. 选择输出格式（PNG/JPEG/WebP/AVIF）
4. 调整质量
5. 点击"转换全部选中图片"
6. 确认每张图片显示转换状态
7. 测试单个下载和批量下载

### Step 3: Commit

```bash
git add js/image-tools.js
git commit -m "feat: add image convert tool with format and quality options"
```

---

## Task 5: PDF工具模块 — 框架与PDF转图片

**Files:**
- Create: `js/pdf-tools.js`

### Step 1: 创建PDF模块壳与PDF转图片功能

```javascript
// ===== PDF Tools Module =====

const PDFTools = {
    render(container, subTool) {
        const tabs = [
            { id: 'convert', label: '转换' },
            { id: 'split', label: '拆分' },
            { id: 'compress', label: '压缩' }
        ];

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>PDF工具</h2>
                    <p>转换 · 拆分 · 压缩，全部本地处理</p>
                </div>
                <div class="tool-tabs" id="pdf-tabs"></div>
                <div id="pdf-content"></div>
            </div>
        `;

        const tabsEl = document.getElementById('pdf-tabs');
        tabs.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = `tool-tab${tab.id === subTool ? ' active' : ''}`;
            btn.textContent = tab.label;
            btn.onclick = () => {
                window.location.hash = `/pdf/${tab.id}`;
            };
            tabsEl.appendChild(btn);
        });

        const content = document.getElementById('pdf-content');
        switch (subTool) {
            case 'convert': this.renderConvert(content); break;
            case 'split': this.renderSplit(content); break;
            case 'compress': this.renderCompress(content); break;
            default: this.renderConvert(content);
        }
    },

    // === 转换工具 ===
    renderConvert(container) {
        const subTabs = [
            { id: 'pdf2img', label: 'PDF转图片' },
            { id: 'img2pdf', label: '图片转PDF' },
            { id: 'office2pdf', label: 'Office转PDF' }
        ];

        container.innerHTML = `
            <div class="tool-tabs" id="pdf-convert-tabs" style="margin-bottom:16px"></div>
            <div id="pdf-convert-content"></div>
        `;

        const tabsEl = document.getElementById('pdf-convert-tabs');
        subTabs.forEach((tab, i) => {
            const btn = document.createElement('button');
            btn.className = `tool-tab${i === 0 ? ' active' : ''}`;
            btn.textContent = tab.label;
            btn.onclick = () => {
                tabsEl.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                this._renderPdfConvertSub(tab.id);
            };
            tabsEl.appendChild(btn);
        });

        this._renderPdfConvertSub('pdf2img');
    },

    _renderPdfConvertSub(subId) {
        const content = document.getElementById('pdf-convert-content');
        switch (subId) {
            case 'pdf2img': this._renderPdf2Img(content); break;
            case 'img2pdf': this._renderImg2Pdf(content); break;
            case 'office2pdf': this._renderOffice2Pdf(content); break;
        }
    },

    // --- PDF转图片 ---
    _renderPdf2Img(container) {
        const state = {
            pdfFile: null,
            pdfDoc: null,
            totalPages: 0,
            pages: [], // {pageNum, canvas, thumbnail, selected}
            settings: { format: 'png', quality: 0.92 }
        };

        const selection = new SelectionManager();

        container.innerHTML = `
            <div id="pdf2img-upload"></div>
            <div id="pdf2img-info" class="stats-row hidden"></div>
            <div id="pdf2img-pages" class="hidden">
                <div class="file-list-header">
                    <span id="pdf2img-page-count"></span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="pdf2img-select-all">全选</button>
                        <button class="btn btn-sm" id="pdf2img-invert">反选</button>
                    </div>
                </div>
                <div class="pdf-page-grid" id="pdf2img-grid"></div>
            </div>
            <div id="pdf2img-controls" class="controls-panel hidden">
                <h4>输出设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>输出格式</label>
                        <select id="pdf2img-format">
                            <option value="png">PNG</option>
                            <option value="jpeg">JPEG</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>输出质量: <span id="pdf2img-quality-val">92</span>%</label>
                        <input type="range" id="pdf2img-quality" min="10" max="100" value="92">
                    </div>
                </div>
            </div>
            <div id="pdf2img-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="pdf2img-count">已选 0 / 0</span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="pdf2img-convert">转换选中页面</button>
                    <button class="btn btn-success" id="pdf2img-download-all">下载全部（ZIP）</button>
                </div>
            </div>
        `;

        FileUpload.createUploadArea(document.getElementById('pdf2img-upload'), {
            accept: '.pdf',
            multiple: false,
            hint: '上传PDF文件',
            onFiles: async (files) => {
                if (files.length === 0) return;
                state.pdfFile = files[0];
                await this._pdf2imgLoad(state, selection);
            }
        });

        // Controls
        document.getElementById('pdf2img-format').onchange = (e) => {
            state.settings.format = e.target.value;
        };
        const qualityEl = document.getElementById('pdf2img-quality');
        qualityEl.oninput = () => {
            state.settings.quality = parseInt(qualityEl.value) / 100;
            document.getElementById('pdf2img-quality-val').textContent = qualityEl.value;
        };

        document.getElementById('pdf2img-select-all').onclick = () => {
            selection.selectAll();
            this._pdf2imgUpdateSelection(state, selection);
        };
        document.getElementById('pdf2img-invert').onclick = () => {
            selection.invertSelection();
            this._pdf2imgUpdateSelection(state, selection);
        };

        document.getElementById('pdf2img-convert').onclick = () => this._pdf2imgConvert(state, selection);
        document.getElementById('pdf2img-download-all').onclick = () => this._pdf2imgDownloadAll(state, selection);

        selection.onChange = () => this._pdf2imgUpdateSelection(state, selection);
    },

    async _pdf2imgLoad(state, selection) {
        Loading.show('正在加载PDF...');

        const arrayBuffer = await Utils.readAsArrayBuffer(state.pdfFile);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        state.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        state.totalPages = state.pdfDoc.numPages;

        // Show info
        const infoDiv = document.getElementById('pdf2img-info');
        infoDiv.classList.remove('hidden');
        infoDiv.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${state.totalPages}</div>
                <div class="stat-label">总页数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Utils.formatSize(state.pdfFile.size)}</div>
                <div class="stat-label">文件大小</div>
            </div>
        `;

        // Render pages
        state.pages = [];
        for (let i = 1; i <= state.totalPages; i++) {
            Loading.progress(Math.round(i / state.totalPages * 80));
            Loading.setText(`正在渲染第 ${i}/${state.totalPages} 页...`);

            const page = await state.pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            state.pages.push({
                pageNum: i,
                canvas,
                thumbnail: canvas.toDataURL('image/jpeg', 0.6),
                selected: true
            });
        }

        selection.setItems(state.pages);
        Loading.hide();

        document.getElementById('pdf2img-upload').classList.add('hidden');
        document.getElementById('pdf2img-pages').classList.remove('hidden');
        document.getElementById('pdf2img-controls').classList.remove('hidden');
        document.getElementById('pdf2img-actions').classList.remove('hidden');

        this._pdf2imgRenderGrid(state, selection);
    },

    _pdf2imgRenderGrid(state, selection) {
        const grid = document.getElementById('pdf2img-grid');
        grid.innerHTML = '';

        state.pages.forEach((p, idx) => {
            const item = document.createElement('div');
            item.className = `pdf-page-item${p.selected ? ' selected' : ''}`;
            item.innerHTML = `
                <input type="checkbox" class="file-item-checkbox" ${p.selected ? 'checked' : ''}>
                <img src="${p.thumbnail}" alt="Page ${p.pageNum}">
                <div class="page-num">第 ${p.pageNum} 页</div>
            `;

            item.querySelector('.file-item-checkbox').onchange = () => {
                selection.toggle(p.pageNum);
                this._pdf2imgUpdateSelection(state, selection);
            };

            item.querySelector('img').onclick = () => {
                const images = state.pages.map(pg => pg.thumbnail);
                Lightbox.open(images, idx);
            };

            grid.appendChild(item);
        });

        document.getElementById('pdf2img-page-count').textContent =
            `共 ${state.totalPages} 页`;
        document.getElementById('pdf2img-count').textContent =
            `已选 ${selection.count} / ${selection.total}`;
    },

    _pdf2imgUpdateSelection(state, selection) {
        state.pages.forEach(p => {
            p.selected = selection.isSelected(p.pageNum);
        });
        this._pdf2imgRenderGrid(state, selection);
    },

    async _pdf2imgConvert(state, selection) {
        const selected = selection.getSelected();
        if (selected.length === 0) {
            Toast.warning('请先选择页面');
            return;
        }

        Loading.show('正在转换...');
        const { format, quality } = state.settings;
        const mime = `image/${format}`;

        for (let i = 0; i < selected.length; i++) {
            const p = selected[i];
            Loading.progress(Math.round((i + 1) / selected.length * 100));

            // Render at full resolution
            const page = await state.pdfDoc.getPage(p.pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            p.convertedBlob = await Utils.canvasToBlob(canvas, mime, quality);
        }

        Loading.hide();
        Toast.success(`已转换 ${selected.length} 页`);
    },

    async _pdf2imgDownloadAll(state, selection) {
        const selected = selection.getSelected().filter(p => p.convertedBlob);
        if (selected.length === 0) {
            Toast.warning('请先转换页面');
            return;
        }

        const format = state.settings.format;
        const baseName = Utils.getBaseName(state.pdfFile.name);
        const files = selected.map(p => ({
            name: `${baseName}_第${p.pageNum}页.${format}`,
            blob: p.convertedBlob
        }));
        await batchDownload(files);
    },

    // --- 图片转PDF占位 ---
    _renderImg2Pdf(container) {
        // Task 6 实现
    },

    // --- Office转PDF占位 ---
    _renderOffice2Pdf(container) {
        // Task 7 实现
    },

    // === 拆分工具占位 ===
    renderSplit(container) {
        // Task 8 实现
    },

    // === 压缩工具占位 ===
    renderCompress(container) {
        // Task 9 实现
    }
};
```

### Step 2: 验证PDF模块壳与PDF转图片

1. 点击"PDF工具"卡片，确认进入PDF工具页面
2. 确认tab栏显示"转换 | 拆分 | 压缩"
3. 确认"转换"tab下有二级tab："PDF转图片 | 图片转PDF | Office转PDF"
4. 上传PDF文件，确认页面缩略图网格展示
5. 测试全选/反选
6. 选择输出格式和质量
7. 点击"转换选中页面"
8. 测试批量下载

### Step 3: Commit

```bash
git add js/pdf-tools.js
git commit -m "feat: add PDF tools module with PDF to images conversion"
```

---

## Task 6: 图片转PDF

**Files:**
- Modify: `js/pdf-tools.js` — 实现 `_renderImg2Pdf` 方法

### Step 1: 实现图片转PDF

```javascript
_renderImg2Pdf(container) {
    const state = {
        files: [], // {id, file, thumbnail}
        settings: {
            pageSize: 'a4',
            orientation: 'portrait',
            imagePosition: 'center'
        }
    };

    container.innerHTML = `
        <div id="img2pdf-upload"></div>
        <div id="img2pdf-files" class="file-list hidden"></div>
        <div id="img2pdf-controls" class="controls-panel hidden">
            <h4>PDF设置</h4>
            <div class="controls-grid">
                <div class="control-group">
                    <label>页面尺寸</label>
                    <select id="img2pdf-size">
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="auto">自适应图片</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>方向</label>
                    <select id="img2pdf-orient">
                        <option value="portrait">纵向</option>
                        <option value="landscape">横向</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>图片位置</label>
                    <select id="img2pdf-position">
                        <option value="center">居中</option>
                        <option value="stretch">拉伸填充</option>
                        <option value="fit">适应页面</option>
                    </select>
                </div>
            </div>
        </div>
        <div id="img2pdf-actions" class="action-bar hidden">
            <div class="action-bar-left">
                <span id="img2pdf-count">0 张图片</span>
            </div>
            <div class="action-bar-right">
                <button class="btn" id="img2pdf-clear">清空</button>
                <button class="btn btn-primary" id="img2pdf-generate">生成PDF</button>
            </div>
        </div>
    `;

    FileUpload.createUploadArea(document.getElementById('img2pdf-upload'), {
        accept: 'image/*',
        multiple: true,
        hint: '上传多张图片，每张图片将成为PDF的一页',
        onFiles: async (files) => {
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;
                const thumbnail = await Utils.createThumbnail(file);
                state.files.push({ id: Utils.uid(), file, thumbnail });
            }
            this._img2pdfUpdateUI(state);
        }
    });

    document.getElementById('img2pdf-clear').onclick = () => {
        state.files = [];
        this._img2pdfUpdateUI(state);
    };

    document.getElementById('img2pdf-generate').onclick = () => this._img2pdfGenerate(state);
},

_img2pdfUpdateUI(state) {
    const filesDiv = document.getElementById('img2pdf-files');
    const controlsDiv = document.getElementById('img2pdf-controls');
    const actionsDiv = document.getElementById('img2pdf-actions');

    if (state.files.length === 0) {
        filesDiv.classList.add('hidden');
        controlsDiv.classList.add('hidden');
        actionsDiv.classList.add('hidden');
        return;
    }

    filesDiv.classList.remove('hidden');
    controlsDiv.classList.remove('hidden');
    actionsDiv.classList.remove('hidden');

    filesDiv.innerHTML = `
        <div class="file-list-header">
            <span>已上传 ${state.files.length} 张图片</span>
            <span style="font-size:12px;color:var(--text-muted)">拖拽可调整顺序</span>
        </div>
        <div class="file-grid" id="img2pdf-grid"></div>
    `;

    const grid = document.getElementById('img2pdf-grid');
    state.files.forEach((f, index) => {
        const item = document.createElement('div');
        item.className = 'file-item sortable-item';
        item.draggable = true;
        item.dataset.id = f.id;
        item.innerHTML = `
            <img class="file-item-thumb" src="${f.thumbnail}" alt="${f.file.name}">
            <div class="file-item-name">${f.file.name}</div>
            <div class="file-item-size">${Utils.formatSize(f.file.size)}</div>
            <button class="file-item-remove">&times;</button>
        `;

        item.querySelector('.file-item-remove').onclick = () => {
            state.files = state.files.filter(sf => sf.id !== f.id);
            this._img2pdfUpdateUI(state);
        };

        item.querySelector('.file-item-thumb').onclick = () => {
            const images = state.files.map(sf => sf.thumbnail);
            Lightbox.open(images, index);
        };

        grid.appendChild(item);
    });

    Utils.makeSortable(grid, () => {
        const newOrder = [];
        grid.querySelectorAll('.sortable-item').forEach(el => {
            const f = state.files.find(sf => sf.id === el.dataset.id);
            if (f) newOrder.push(f);
        });
        state.files = newOrder;
    });

    document.getElementById('img2pdf-count').textContent = `${state.files.length} 张图片`;
},

async _img2pdfGenerate(state) {
    if (state.files.length === 0) {
        Toast.warning('请先上传图片');
        return;
    }

    Loading.show('正在生成PDF...');

    const { pageSize, orientation, imagePosition } = state.settings;

    // Page sizes in points (72 dpi)
    const pageSizes = {
        a4: { w: 595.28, h: 841.89 },
        letter: { w: 612, h: 792 }
    };

    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 0; i < state.files.length; i++) {
        const f = state.files[i];
        Loading.progress(Math.round((i + 1) / state.files.length * 80));
        Loading.setText(`正在处理第 ${i + 1}/${state.files.length} 张...`);

        const arrayBuffer = await Utils.readAsArrayBuffer(f.file);
        let image;
        const ext = Utils.getExtension(f.file.name);
        if (ext === 'png') {
            image = await pdfDoc.embedPng(arrayBuffer);
        } else {
            image = await pdfDoc.embedJpg(arrayBuffer);
        }

        let pageW, pageH;
        if (pageSize === 'auto') {
            pageW = image.width;
            pageH = image.height;
        } else {
            const size = pageSizes[pageSize];
            if (orientation === 'landscape') {
                pageW = size.h;
                pageH = size.w;
            } else {
                pageW = size.w;
                pageH = size.h;
            }
        }

        const page = pdfDoc.addPage([pageW, pageH]);

        let drawW, drawH, drawX, drawY;
        if (imagePosition === 'stretch') {
            drawW = pageW;
            drawH = pageH;
            drawX = 0;
            drawY = 0;
        } else if (imagePosition === 'fit') {
            const ratio = Math.min(pageW / image.width, pageH / image.height);
            drawW = image.width * ratio;
            drawH = image.height * ratio;
            drawX = (pageW - drawW) / 2;
            drawY = (pageH - drawH) / 2;
        } else {
            // center - use image natural size, centered
            drawW = Math.min(image.width, pageW);
            drawH = Math.min(image.height, pageH);
            const scale = Math.min(drawW / image.width, drawH / image.height);
            drawW = image.width * scale;
            drawH = image.height * scale;
            drawX = (pageW - drawW) / 2;
            drawY = (pageH - drawH) / 2;
        }

        page.drawImage(image, { x: drawX, y: pageY(drawY, drawH, pageH), width: drawW, height: drawH });
    }

    Loading.setText('正在生成文件...');
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    Loading.hide();

    Utils.downloadBlob(blob, `合并_${Date.now()}.pdf`);
    Toast.success('PDF生成完成');
},
```

注意：上面代码中 `pageY(drawY, drawH, pageH)` 需要修正。pdf-lib的坐标系原点在左下角，所以y坐标需要转换：

```javascript
// 修正：pdf-lib Y坐标从底部开始
page.drawImage(image, {
    x: drawX,
    y: pageH - drawY - drawH,  // 转换为bottom-left坐标系
    width: drawW,
    height: drawH
});
```

### Step 2: 验证图片转PDF

1. 切换到"图片转PDF"二级tab
2. 上传多张图片
3. 确认列表展示，支持拖拽排序
4. 设置页面尺寸、方向、图片位置
5. 点击"生成PDF"
6. 确认下载的PDF文件可正常打开，每页一张图片

### Step 3: Commit

```bash
git add js/pdf-tools.js
git commit -m "feat: add images to PDF conversion with page layout options"
```

---

## Task 7: Office转PDF（基础版）

**Files:**
- Modify: `js/pdf-tools.js` — 实现 `_renderOffice2Pdf` 方法

### Step 1: 实现Office转PDF

```javascript
_renderOffice2Pdf(container) {
    container.innerHTML = `
        <div class="upload-area" id="office2pdf-upload" style="cursor:default">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>Office转PDF</p>
            <p class="upload-hint">支持 Word (.docx)、Excel (.xlsx) 格式</p>
        </div>
        <div style="margin-top:16px;padding:16px;background:var(--info-bg);border-radius:var(--radius);border:1px solid #bfdbfe">
            <p style="font-size:13px;color:var(--text-secondary)">
                <strong>说明：</strong>纯前端Office转PDF能力有限。复杂排版、特殊字体、宏等内容可能无法完美转换。
                建议对于重要文档使用专业工具（如Microsoft Office）进行转换。
            </p>
        </div>
        <div id="office2pdf-result" class="hidden" style="margin-top:16px"></div>
    `;

    const uploadArea = document.getElementById('office2pdf-upload');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.docx,.xlsx';
    input.style.display = 'none';
    uploadArea.appendChild(input);
    uploadArea.onclick = () => input.click();

    input.onchange = async () => {
        if (input.files.length === 0) return;
        const file = input.files[0];
        input.value = '';

        const ext = Utils.getExtension(file.name);
        if (ext === 'docx') {
            await this._convertWordToPdf(file);
        } else if (ext === 'xlsx') {
            await this._convertExcelToPdf(file);
        } else {
            Toast.error('不支持的文件格式');
        }
    };
},

async _convertWordToPdf(file) {
    Loading.show('正在转换Word文档...');

    try {
        const arrayBuffer = await Utils.readAsArrayBuffer(file);
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        // Create PDF from HTML
        const pdfDoc = await PDFLib.PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]); // A4

        // Simple text extraction for PDF
        const text = html.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        const lines = text.split('\n');

        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const fontSize = 11;
        const lineHeight = 14;
        const margin = 50;
        const maxWidth = 595.28 - 2 * margin;
        let y = 841.89 - margin;

        for (const line of lines) {
            if (y < margin + lineHeight) break; // Simple: only first page
            const trimmed = line.trim();
            if (trimmed) {
                // Wrap long lines
                let displayLine = trimmed;
                while (displayLine.length > 0 && y >= margin + lineHeight) {
                    let chunk = displayLine;
                    // Estimate chars that fit
                    const charWidth = fontSize * 0.5;
                    const maxChars = Math.floor(maxWidth / charWidth);
                    if (chunk.length > maxChars) {
                        chunk = displayLine.slice(0, maxChars);
                        displayLine = displayLine.slice(maxChars);
                    } else {
                        displayLine = '';
                    }
                    page.drawText(chunk, {
                        x: margin,
                        y: y - fontSize,
                        size: fontSize,
                        font,
                        color: PDFLib.rgb(0, 0, 0)
                    });
                    y -= lineHeight;
                }
            } else {
                y -= lineHeight / 2;
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        Loading.hide();

        const baseName = Utils.getBaseName(file.name);
        Utils.downloadBlob(blob, `${baseName}.pdf`);
        Toast.success('转换完成');

    } catch (err) {
        Loading.hide();
        Toast.error('转换失败: ' + err.message);
    }
},

async _convertExcelToPdf(file) {
    Loading.show('正在转换Excel...');

    try {
        const arrayBuffer = await Utils.readAsArrayBuffer(file);
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const pdfDoc = await PDFLib.PDFDocument.create();
        const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape for tables
        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

        const margin = 30;
        const fontSize = 9;
        const cellPadding = 4;
        const lineHeight = fontSize + cellPadding * 2;
        let y = 595.28 - margin;

        // Calculate column widths
        const maxCols = Math.max(...data.map(r => r.length));
        const colWidth = Math.min((841.89 - 2 * margin) / maxCols, 120);

        for (let rowIdx = 0; rowIdx < data.length && y >= margin + lineHeight; rowIdx++) {
            const row = data[rowIdx] || [];
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
                const cell = String(row[colIdx] || '');
                const x = margin + colIdx * colWidth;
                const truncated = cell.length > 20 ? cell.slice(0, 18) + '..' : cell;

                page.drawText(truncated, {
                    x: x + cellPadding,
                    y: y - fontSize - cellPadding,
                    size: fontSize,
                    font,
                    color: PDFLib.rgb(0, 0, 0)
                });
            }
            y -= lineHeight;

            // Draw row line
            page.drawLine({
                start: { x: margin, y: y + lineHeight / 2 },
                end: { x: margin + maxCols * colWidth, y: y + lineHeight / 2 },
                thickness: 0.5,
                color: PDFLib.rgb(0.8, 0.8, 0.8)
            });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        Loading.hide();

        const baseName = Utils.getBaseName(file.name);
        Utils.downloadBlob(blob, `${baseName}.pdf`);
        Toast.success('转换完成（仅第一个工作表）');

    } catch (err) {
        Loading.hide();
        Toast.error('转换失败: ' + err.message);
    }
},
```

### Step 2: 验证Office转PDF

1. 切换到"Office转PDF"二级tab
2. 确认显示功能说明提示
3. 上传一个 .docx 文件，确认下载PDF
4. 上传一个 .xlsx 文件，确认下载PDF（表格形式）
5. 确认错误提示对不支持的格式友好

### Step 3: Commit

```bash
git add js/pdf-tools.js
git commit -m "feat: add basic Office to PDF conversion (Word/Excel)"
```

---

## Task 8: PDF拆分工具

**Files:**
- Modify: `js/pdf-tools.js` — 实现 `renderSplit` 方法

### Step 1: 实现PDF拆分工具

```javascript
renderSplit(container) {
    const state = {
        pdfFile: null,
        pdfBytes: null,
        pdfDoc: null,
        totalPages: 0,
        pages: [], // {pageNum, thumbnail}
        mode: 'single', // single, extract, group
        extractRange: '',
        groups: [] // {id, startPage, endPage, name}
    };

    container.innerHTML = `
        <div id="split-upload"></div>
        <div id="split-workspace" class="hidden">
            <div class="stats-row" id="split-info"></div>
            <div class="tool-tabs" id="split-mode-tabs" style="margin-bottom:16px">
                <button class="tool-tab active" data-mode="single">拆分为单独页面</button>
                <button class="tool-tab" data-mode="extract">提取指定页面</button>
                <button class="tool-tab" data-mode="group">分组拆分</button>
            </div>
            <div id="split-mode-content"></div>
            <div class="file-list-header" style="margin-top:16px">
                <span id="split-page-count"></span>
            </div>
            <div class="pdf-page-grid" id="split-grid"></div>
            <div class="action-bar" id="split-actions">
                <div class="action-bar-left"></div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="split-execute">执行拆分</button>
                    <button class="btn btn-success" id="split-download-all">下载全部（ZIP）</button>
                </div>
            </div>
        </div>
    `;

    FileUpload.createUploadArea(document.getElementById('split-upload'), {
        accept: '.pdf',
        multiple: false,
        hint: '上传PDF文件进行拆分',
        onFiles: async (files) => {
            if (files.length === 0) return;
            state.pdfFile = files[0];
            await this._splitLoad(state);
        }
    });

    // Mode tabs
    document.querySelectorAll('#split-mode-tabs .tool-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('#split-mode-tabs .tool-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.mode = tab.dataset.mode;
            this._splitRenderModeContent(state);
        };
    });

    document.getElementById('split-execute').onclick = () => this._splitExecute(state);
    document.getElementById('split-download-all').onclick = () => this._splitDownloadAll(state);
},

async _splitLoad(state) {
    Loading.show('正在加载PDF...');

    state.pdfBytes = await Utils.readAsArrayBuffer(state.pdfFile);
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    state.pdfDoc = await pdfjsLib.getDocument({ data: state.pdfBytes.slice(0) }).promise;
    state.totalPages = state.pdfDoc.numPages;

    // Render thumbnails
    state.pages = [];
    for (let i = 1; i <= state.totalPages; i++) {
        Loading.progress(Math.round(i / state.totalPages * 70));
        const page = await state.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        state.pages.push({
            pageNum: i,
            thumbnail: canvas.toDataURL('image/jpeg', 0.5)
        });
    }

    Loading.hide();

    document.getElementById('split-upload').classList.add('hidden');
    document.getElementById('split-workspace').classList.remove('hidden');

    document.getElementById('split-info').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${state.totalPages}</div>
            <div class="stat-label">总页数</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Utils.formatSize(state.pdfFile.size)}</div>
            <div class="stat-label">文件大小</div>
        </div>
    `;

    this._splitRenderGrid(state);
    this._splitRenderModeContent(state);
},

_splitRenderGrid(state) {
    const grid = document.getElementById('split-grid');
    grid.innerHTML = '';
    state.pages.forEach(p => {
        const item = document.createElement('div');
        item.className = 'pdf-page-item';
        item.innerHTML = `
            <img src="${p.thumbnail}" alt="Page ${p.pageNum}">
            <div class="page-num">第 ${p.pageNum} 页</div>
        `;
        item.querySelector('img').onclick = () => {
            const images = state.pages.map(pg => pg.thumbnail);
            Lightbox.open(images, p.pageNum - 1);
        };
        grid.appendChild(item);
    });
    document.getElementById('split-page-count').textContent = `共 ${state.totalPages} 页`;
},

_splitRenderModeContent(state) {
    const content = document.getElementById('split-mode-content');

    if (state.mode === 'single') {
        content.innerHTML = `
            <div style="padding:12px;background:var(--bg);border-radius:var(--radius);font-size:13px;color:var(--text-secondary)">
                将PDF的每一页拆分为独立的PDF文件，共生成 ${state.totalPages} 个文件。
            </div>
        `;
    } else if (state.mode === 'extract') {
        content.innerHTML = `
            <div class="controls-panel">
                <div class="control-group">
                    <label>页面范围（如：1-5,8,10-12）</label>
                    <div style="display:flex;gap:8px">
                        <input type="text" id="split-range" placeholder="例：1-5,8,10-12" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px">
                    </div>
                </div>
            </div>
        `;
        document.getElementById('split-range').oninput = (e) => {
            state.extractRange = e.target.value;
        };
    } else if (state.mode === 'group') {
        content.innerHTML = `
            <div class="controls-panel">
                <button class="btn btn-sm" id="split-add-group">+ 创建分组</button>
                <div id="split-groups" class="split-groups" style="margin-top:12px"></div>
            </div>
        `;
        document.getElementById('split-add-group').onclick = () => {
            state.groups.push({
                id: Utils.uid(),
                startPage: 1,
                endPage: state.totalPages,
                name: ''
            });
            this._splitRenderGroups(state);
        };
        this._splitRenderGroups(state);
    }
},

_splitRenderGroups(state) {
    const container = document.getElementById('split-groups');
    container.innerHTML = '';

    state.groups.forEach(g => {
        const item = document.createElement('div');
        item.className = 'split-group-item';
        item.innerHTML = `
            <input type="number" value="${g.startPage}" min="1" max="${state.totalPages}" data-field="startPage">
            <span>-</span>
            <input type="number" value="${g.endPage}" min="1" max="${state.totalPages}" data-field="endPage">
            <input type="text" value="${g.name}" placeholder="分组名称" data-field="name" style="flex:1">
            <button class="btn btn-sm btn-danger">&times;</button>
        `;

        item.querySelectorAll('input').forEach(input => {
            input.onchange = () => {
                const field = input.dataset.field;
                if (field === 'name') {
                    g.name = input.value;
                } else {
                    g[field] = parseInt(input.value) || 1;
                }
            };
        });

        item.querySelector('.btn-danger').onclick = () => {
            state.groups = state.groups.filter(gr => gr.id !== g.id);
            this._splitRenderGroups(state);
        };

        container.appendChild(item);
    });
},

async _splitExecute(state) {
    const pdfLibDoc = await PDFLib.PDFDocument.load(state.pdfBytes);
    const baseName = Utils.getBaseName(state.pdfFile.name);
    const results = []; // {name, blob}

    Loading.show('正在拆分...');

    if (state.mode === 'single') {
        for (let i = 0; i < state.totalPages; i++) {
            Loading.progress(Math.round((i + 1) / state.totalPages * 100));
            const newDoc = await PDFLib.PDFDocument.create();
            const [page] = await newDoc.copyPages(pdfLibDoc, [i]);
            newDoc.addPage(page);
            const bytes = await newDoc.save();
            results.push({
                name: `${baseName}_第${i + 1}页.pdf`,
                blob: new Blob([bytes], { type: 'application/pdf' })
            });
        }
    } else if (state.mode === 'extract') {
        const pageIndices = this._parsePageRange(state.extractRange, state.totalPages);
        if (pageIndices.length === 0) {
            Loading.hide();
            Toast.warning('请输入有效的页面范围');
            return;
        }
        const newDoc = await PDFLib.PDFDocument.create();
        const copiedPages = await newDoc.copyPages(pdfLibDoc, pageIndices);
        copiedPages.forEach(p => newDoc.addPage(p));
        const bytes = await newDoc.save();
        results.push({
            name: `${baseName}_提取_${state.extractRange.replace(/,/g, '_')}.pdf`,
            blob: new Blob([bytes], { type: 'application/pdf' })
        });
    } else if (state.mode === 'group') {
        if (state.groups.length === 0) {
            Loading.hide();
            Toast.warning('请先创建分组');
            return;
        }
        for (let i = 0; i < state.groups.length; i++) {
            const g = state.groups[i];
            Loading.progress(Math.round((i + 1) / state.groups.length * 100));
            const start = Math.max(1, g.startPage) - 1;
            const end = Math.min(state.totalPages, g.endPage) - 1;
            const indices = [];
            for (let j = start; j <= end; j++) indices.push(j);

            const newDoc = await PDFLib.PDFDocument.create();
            const copiedPages = await newDoc.copyPages(pdfLibDoc, indices);
            copiedPages.forEach(p => newDoc.addPage(p));
            const bytes = await newDoc.save();

            const groupSuffix = g.name ? `_${g.name}` : '';
            results.push({
                name: `${baseName}_${g.startPage}-${g.endPage}${groupSuffix}.pdf`,
                blob: new Blob([bytes], { type: 'application/pdf' })
            });
        }
    }

    Loading.hide();
    state._splitResults = results;
    Toast.success(`拆分完成，共 ${results.length} 个文件`);
},

_parsePageRange(rangeStr, maxPage) {
    const indices = [];
    const parts = rangeStr.split(',');
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(Number);
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.max(1, start); i <= Math.min(maxPage, end); i++) {
                    indices.push(i - 1);
                }
            }
        } else {
            const num = parseInt(trimmed);
            if (!isNaN(num) && num >= 1 && num <= maxPage) {
                indices.push(num - 1);
            }
        }
    }
    return [...new Set(indices)];
},

async _splitDownloadAll(state) {
    if (!state._splitResults || state._splitResults.length === 0) {
        Toast.warning('请先执行拆分');
        return;
    }
    await batchDownload(state._splitResults);
},
```

### Step 2: 验证PDF拆分工具

1. 切换到"拆分"tab
2. 上传PDF文件，确认页面缩略图展示
3. 测试"拆分为单独页面"模式
4. 测试"提取指定页面"模式（输入范围如1-3,5）
5. 测试"分组拆分"模式（创建分组，设置起止页和名称）
6. 测试批量下载

### Step 3: Commit

```bash
git add js/pdf-tools.js
git commit -m "feat: add PDF split tool with single/extract/group modes"
```

---

## Task 9: PDF压缩工具

**Files:**
- Modify: `js/pdf-tools.js` — 实现 `renderCompress` 方法

### Step 1: 实现PDF压缩工具

```javascript
renderCompress(container) {
    const state = {
        pdfFile: null,
        pdfBytes: null,
        totalPages: 0,
        originalSize: 0,
        compressedBlob: null,
        compressedSize: 0,
        settings: {
            preset: 'recommended',
            imageQuality: 0.7
        }
    };

    container.innerHTML = `
        <div id="compress-pdf-upload"></div>
        <div id="compress-pdf-workspace" class="hidden">
            <div class="stats-row" id="compress-pdf-info"></div>
            <div class="controls-panel">
                <h4>压缩设置</h4>
                <div class="layout-options" id="compress-pdf-presets" style="margin-bottom:16px">
                    <div class="layout-option" data-preset="extreme">极致压缩</div>
                    <div class="layout-option active" data-preset="recommended">推荐</div>
                    <div class="layout-option" data-preset="high">高质量</div>
                </div>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>图片质量: <span id="compress-pdf-quality-val">70</span>%</label>
                        <input type="range" id="compress-pdf-quality" min="10" max="100" value="70">
                    </div>
                </div>
                <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
                    注意：纯前端PDF压缩会将页面转为图片，文本将不可选中复制。
                </div>
            </div>
            <div id="compress-pdf-comparison" class="comparison hidden" style="justify-content:center;padding:20px"></div>
            <div class="action-bar">
                <div class="action-bar-left"></div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="compress-pdf-execute">开始压缩</button>
                    <button class="btn btn-success" id="compress-pdf-download" disabled>下载压缩文件</button>
                </div>
            </div>
        </div>
    `;

    FileUpload.createUploadArea(document.getElementById('compress-pdf-upload'), {
        accept: '.pdf',
        multiple: false,
        hint: '上传PDF文件进行压缩',
        onFiles: async (files) => {
            if (files.length === 0) return;
            state.pdfFile = files[0];
            state.pdfBytes = await Utils.readAsArrayBuffer(state.pdfFile);
            state.originalSize = state.pdfFile.size;

            // Get page count
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
            const doc = await pdfjsLib.getDocument({ data: state.pdfBytes.slice(0) }).promise;
            state.totalPages = doc.numPages;

            document.getElementById('compress-pdf-upload').classList.add('hidden');
            document.getElementById('compress-pdf-workspace').classList.remove('hidden');

            document.getElementById('compress-pdf-info').innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${state.totalPages}</div>
                    <div class="stat-label">总页数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Utils.formatSize(state.originalSize)}</div>
                    <div class="stat-label">原始大小</div>
                </div>
            `;
        }
    });

    // Presets
    const presets = {
        extreme: { quality: 30 },
        recommended: { quality: 70 },
        high: { quality: 90 }
    };

    document.querySelectorAll('#compress-pdf-presets .layout-option').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('#compress-pdf-presets .layout-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const preset = opt.dataset.preset;
            state.settings.preset = preset;
            state.settings.imageQuality = presets[preset].quality;
            document.getElementById('compress-pdf-quality').value = state.settings.imageQuality;
            document.getElementById('compress-pdf-quality-val').textContent = state.settings.imageQuality;
        };
    });

    const qualityEl = document.getElementById('compress-pdf-quality');
    qualityEl.oninput = () => {
        state.settings.imageQuality = parseInt(qualityEl.value);
        document.getElementById('compress-pdf-quality-val').textContent = qualityEl.value;
    };

    document.getElementById('compress-pdf-execute').onclick = () => this._compressPdfExecute(state);
    document.getElementById('compress-pdf-download').onclick = () => {
        if (state.compressedBlob) {
            const baseName = Utils.getBaseName(state.pdfFile.name);
            Utils.downloadBlob(state.compressedBlob, `${baseName}_compressed.pdf`);
        }
    };
},

async _compressPdfExecute(state) {
    Loading.show('正在压缩PDF...');
    const quality = state.settings.imageQuality / 100;

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    const pdfDoc = await pdfjsLib.getDocument({ data: state.pdfBytes.slice(0) }).promise;

    const newPdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 1; i <= state.totalPages; i++) {
        Loading.progress(Math.round(i / state.totalPages * 90));
        Loading.setText(`正在压缩第 ${i}/${state.totalPages} 页...`);

        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await Utils.canvasToBlob(canvas, 'image/jpeg', quality);
        const arrayBuffer = await Utils.readAsArrayBuffer(blob);
        const image = await newPdfDoc.embedJpg(arrayBuffer);

        const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(image, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height
        });
    }

    Loading.setText('正在生成文件...');
    const pdfBytes = await newPdfDoc.save();
    state.compressedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    state.compressedSize = state.compressedBlob.size;

    Loading.hide();

    // Show comparison
    const compDiv = document.getElementById('compress-pdf-comparison');
    compDiv.classList.remove('hidden');
    const ratio = Math.round((1 - state.compressedSize / state.originalSize) * 100);
    compDiv.innerHTML = `
        <div class="comparison-item">
            <div class="size">${Utils.formatSize(state.originalSize)}</div>
            <div class="label">原始大小</div>
        </div>
        <div class="comparison-arrow">→</div>
        <div class="comparison-item after">
            <div class="size">${Utils.formatSize(state.compressedSize)}</div>
            <div class="label">压缩后 (${ratio}% 减少)</div>
        </div>
    `;

    document.getElementById('compress-pdf-download').disabled = false;
    Toast.success('PDF压缩完成');
},
```

### Step 2: 验证PDF压缩工具

1. 切换到"压缩"tab
2. 上传PDF文件
3. 确认显示页数和文件大小
4. 切换压缩预设（极致/推荐/高质量）
5. 调整图片质量滑块
6. 点击"开始压缩"
7. 确认显示压缩前后大小对比
8. 下载压缩后的PDF

### Step 3: Commit

```bash
git add js/pdf-tools.js
git commit -m "feat: add PDF compress tool with presets and quality control"
```

---

## 验收清单

完成所有Task后，按以下清单逐项验收：

- [ ] 首页显示5个工具卡片，点击可正常跳转
- [ ] 图片工具tab切换正常（拼图/裁剪/压缩/转换）
- [ ] 拼图工具：上传、预览、布局切换、参数调整、下载均正常
- [ ] 裁剪工具：上传、裁剪框拖拽、比例预设、旋转翻转、撤销重做、下载均正常
- [ ] 压缩工具：批量上传、压缩参数、大小对比、下载均正常
- [ ] 转换工具：批量上传、格式选择、转换、下载均正常
- [ ] PDF工具tab切换正常（转换/拆分/压缩）
- [ ] PDF转图片：上传、页面渲染、选择、转换、下载均正常
- [ ] 图片转PDF：上传、排序、页面设置、生成PDF均正常
- [ ] Office转PDF：Word/Excel基础转换正常
- [ ] PDF拆分：三种模式（单独/提取/分组）均正常
- [ ] PDF压缩：预设切换、质量调整、压缩对比、下载均正常
- [ ] 全局拖拽上传正常
- [ ] Lightbox图片预览正常
- [ ] 响应式布局在移动端正常
- [ ] 所有处理在本地完成，无网络请求（除CDN库加载）
