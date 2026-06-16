// ===== Image Tools Module =====

const ImageTools = {
    // Main entry: render tab bar + delegate to sub-tool
    render(container, subTool) {
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>图片工具</h2>
                    <p>拼图、裁剪、压缩、格式转换 — 纯本地处理，隐私安全</p>
                </div>
                <div class="tool-tabs" id="image-tabs">
                    <button class="tool-tab${subTool === 'collage' ? ' active' : ''}" data-sub="collage">拼图</button>
                    <button class="tool-tab${subTool === 'crop' ? ' active' : ''}" data-sub="crop">裁剪</button>
                    <button class="tool-tab${subTool === 'compress' ? ' active' : ''}" data-sub="compress">压缩</button>
                    <button class="tool-tab${subTool === 'convert' ? ' active' : ''}" data-sub="convert">转换</button>
                    <button class="tool-tab${subTool === 'resize' ? ' active' : ''}" data-sub="resize">像素调整</button>
                    <button class="tool-tab${subTool === 'watermark' ? ' active' : ''}" data-sub="watermark">水印</button>
                </div>
                <div id="image-content"></div>
            </div>
        `;

        // Tab click handlers
        const tabs = container.querySelectorAll('.tool-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                window.location.hash = '/image/' + tab.dataset.sub;
            };
        });

        // Render sub-tool content
        const content = container.querySelector('#image-content');
        switch (subTool) {
            case 'collage':
                this.renderCollage(content);
                break;
            case 'crop':
                this.renderCrop(content);
                break;
            case 'compress':
                this.renderCompress(content);
                break;
            case 'convert':
                this.renderConvert(content);
                break;
            case 'resize':
                this.renderResize(content);
                break;
            case 'watermark':
                this.renderWatermark(content);
                break;
            default:
                this.renderCollage(content);
        }
    },

    // =============================================
    // Collage Tool
    // =============================================
    renderCollage(container) {
        // State for the collage tool
        const state = {
            files: [],          // { id, file, name, size, thumb, img }
            layout: 'horizontal', // 'horizontal' | 'vertical' | 'grid'
            gap: 10,
            borderRadius: 0,
            bgColor: '#ffffff',
            quality: 92,
            gridRows: 2,
            gridCols: 2
        };

        const selection = new SelectionManager();

        container.innerHTML = `
            <div id="collage-upload"></div>
            <div id="collage-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="collage-count">已选择 0 张图片</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="collage-select-all">全选</button>
                        <button class="btn btn-sm" id="collage-invert">反选</button>
                        <button class="btn btn-sm" id="collage-clear">清空</button>
                    </div>
                </div>
                <div class="file-grid" id="collage-grid"></div>
            </div>
            <div id="collage-controls" class="controls-panel hidden">
                <h4>拼图设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>布局方式</label>
                        <div class="layout-options" id="collage-layouts">
                            <div class="layout-option active" data-layout="horizontal">横向拼接</div>
                            <div class="layout-option" data-layout="vertical">纵向拼接</div>
                            <div class="layout-option" data-layout="grid">网格拼接</div>
                        </div>
                    </div>
                    <div class="control-group" id="collage-grid-size" style="display:none">
                        <label>网格大小</label>
                        <div style="display:flex;gap:8px;align-items:center">
                            <input type="number" id="collage-rows" min="1" max="10" value="2" style="width:60px">
                            <span>行 x</span>
                            <input type="number" id="collage-cols" min="1" max="10" value="2" style="width:60px">
                            <span>列</span>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>间距: <span id="collage-gap-val">10</span>px</label>
                        <input type="range" id="collage-gap" min="0" max="50" value="10">
                    </div>
                    <div class="control-group">
                        <label>圆角: <span id="collage-radius-val">0</span>px</label>
                        <input type="range" id="collage-radius" min="0" max="30" value="0">
                    </div>
                    <div class="control-group">
                        <label>背景颜色</label>
                        <input type="color" id="collage-bg" value="#ffffff">
                    </div>
                    <div class="control-group">
                        <label>输出质量: <span id="collage-quality-val">92</span>%</label>
                        <input type="range" id="collage-quality" min="10" max="100" value="92">
                    </div>
                </div>
            </div>
            <div id="collage-preview" class="preview-area hidden">
                <h4>预览</h4>
                <div class="preview-canvas-wrap">
                    <canvas id="collage-canvas"></canvas>
                </div>
            </div>
            <div id="collage-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="collage-action-info"></span>
                </div>
                <div class="action-bar-right">
                    <button class="btn" id="collage-download-orig">批量下载原图</button>
                    <button class="btn btn-primary" id="collage-download">下载拼图</button>
                </div>
            </div>
        `;

        // References to DOM elements
        const el = {
            upload: container.querySelector('#collage-upload'),
            filesSection: container.querySelector('#collage-files'),
            grid: container.querySelector('#collage-grid'),
            count: container.querySelector('#collage-count'),
            controls: container.querySelector('#collage-controls'),
            preview: container.querySelector('#collage-preview'),
            canvas: container.querySelector('#collage-canvas'),
            actions: container.querySelector('#collage-actions'),
            actionInfo: container.querySelector('#collage-action-info'),
            layoutOptions: container.querySelector('#collage-layouts'),
            gridSize: container.querySelector('#collage-grid-size'),
            rows: container.querySelector('#collage-rows'),
            cols: container.querySelector('#collage-cols'),
            gapSlider: container.querySelector('#collage-gap'),
            gapVal: container.querySelector('#collage-gap-val'),
            radiusSlider: container.querySelector('#collage-radius'),
            radiusVal: container.querySelector('#collage-radius-val'),
            bgPicker: container.querySelector('#collage-bg'),
            qualitySlider: container.querySelector('#collage-quality'),
            qualityVal: container.querySelector('#collage-quality-val')
        };

        // ---- Helper: draw image with rounded corners ----
        function _drawRoundedImage(ctx, img, x, y, w, h, radius) {
            if (radius <= 0) {
                ctx.drawImage(img, x, y, w, h);
                return;
            }
            const r = Math.min(radius, w / 2, h / 2);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.arcTo(x + w, y, x + w, y + r, r);
            ctx.lineTo(x + w, y + h - r);
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
            ctx.lineTo(x + r, y + h);
            ctx.arcTo(x, y + h, x, y + h - r, r);
            ctx.lineTo(x, y + r);
            ctx.arcTo(x, y, x + r, y, r);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, x, y, w, h);
            ctx.restore();
        }

        // ---- Upload Area ----
        FileUpload.createUploadArea(el.upload, {
            accept: 'image/*',
            multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式',
            onFiles: async (newFiles) => {
                const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
                if (imageFiles.length === 0) {
                    Toast.warning('请选择图片文件');
                    return;
                }

                Loading.show('正在加载图片...');
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    try {
                        const thumb = await Utils.createThumbnail(file);
                        const dataUrl = await Utils.readAsDataURL(file);
                        const img = await Utils.loadImage(dataUrl);
                        const id = Utils.uid();
                        state.files.push({ id, file, name: file.name, size: file.size, thumb, img });
                    } catch (e) {
                        console.error('Failed to load image:', file.name, e);
                    }
                    Loading.progress(Math.round((i + 1) / imageFiles.length * 100));
                }
                Loading.hide();

                selection.setItems(state.files);
                renderFileGrid();
                updatePreview();
                Toast.success(`已添加 ${imageFiles.length} 张图片`);
            }
        });

        // ---- File Grid Rendering ----
        function renderFileGrid() {
            if (state.files.length === 0) {
                el.filesSection.classList.add('hidden');
                el.controls.classList.add('hidden');
                el.preview.classList.add('hidden');
                el.actions.classList.add('hidden');
                return;
            }

            el.filesSection.classList.remove('hidden');
            el.controls.classList.remove('hidden');
            el.preview.classList.remove('hidden');
            el.actions.classList.remove('hidden');

            el.grid.innerHTML = '';
            state.files.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'file-item sortable-item' + (selection.isSelected(item.id) ? ' selected' : '');
                div.dataset.id = item.id;
                div.draggable = true;
                div.innerHTML = `
                    <input type="checkbox" class="file-item-checkbox" ${selection.isSelected(item.id) ? 'checked' : ''}>
                    <button class="file-item-remove" title="删除">&times;</button>
                    <img class="file-item-thumb" src="${item.thumb}" alt="${item.name}">
                    <div class="file-item-name" title="${item.name}">${item.name}</div>
                    <div class="file-item-size">${Utils.formatSize(item.size)}</div>
                `;

                // Checkbox toggle
                div.querySelector('.file-item-checkbox').onchange = (e) => {
                    e.stopPropagation();
                    selection.toggle(item.id);
                    renderFileGrid();
                    updatePreview();
                };

                // Click thumbnail for lightbox preview
                div.querySelector('.file-item-thumb').onclick = (e) => {
                    e.stopPropagation();
                    const images = state.files.map(f => f.thumb);
                    const idx = state.files.findIndex(f => f.id === item.id);
                    Lightbox.open(images, idx);
                };

                // Remove button
                div.querySelector('.file-item-remove').onclick = (e) => {
                    e.stopPropagation();
                    state.files = state.files.filter(f => f.id !== item.id);
                    selection.setItems(state.files);
                    renderFileGrid();
                    updatePreview();
                };

                el.grid.appendChild(div);
            });

            // Make grid sortable
            Utils.makeSortable(el.grid, () => {
                // Reorder state.files to match DOM order
                const ids = Array.from(el.grid.children).map(child => child.dataset.id);
                state.files.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
                updatePreview();
            });

            updateCount();
        }

        function updateCount() {
            el.count.textContent = `已选择 ${selection.count} / ${selection.total} 张图片`;
            el.actionInfo.textContent = `${selection.count} 张图片已选中`;
        }

        // ---- Selection Buttons ----
        container.querySelector('#collage-select-all').onclick = () => {
            selection.selectAll();
            renderFileGrid();
            updatePreview();
        };

        container.querySelector('#collage-invert').onclick = () => {
            selection.invertSelection();
            renderFileGrid();
            updatePreview();
        };

        container.querySelector('#collage-clear').onclick = () => {
            state.files = [];
            selection.setItems([]);
            renderFileGrid();
            updatePreview();
        };

        // ---- Layout Options ----
        el.layoutOptions.querySelectorAll('.layout-option').forEach(opt => {
            opt.onclick = () => {
                el.layoutOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.layout = opt.dataset.layout;

                // Show/hide grid size inputs
                if (state.layout === 'grid') {
                    el.gridSize.style.display = '';
                } else {
                    el.gridSize.style.display = 'none';
                }

                updatePreview();
            };
        });

        // ---- Control Handlers ----
        el.gapSlider.oninput = () => {
            state.gap = parseInt(el.gapSlider.value);
            el.gapVal.textContent = state.gap;
            updatePreview();
        };

        el.radiusSlider.oninput = () => {
            state.borderRadius = parseInt(el.radiusSlider.value);
            el.radiusVal.textContent = state.borderRadius;
            updatePreview();
        };

        el.bgPicker.oninput = () => {
            state.bgColor = el.bgPicker.value;
            updatePreview();
        };

        el.qualitySlider.oninput = () => {
            state.quality = parseInt(el.qualitySlider.value);
            el.qualityVal.textContent = state.quality;
        };

        el.rows.oninput = () => {
            state.gridRows = Math.max(1, parseInt(el.rows.value) || 1);
            updatePreview();
        };

        el.cols.oninput = () => {
            state.gridCols = Math.max(1, parseInt(el.cols.value) || 1);
            updatePreview();
        };

        // ---- Preview Rendering ----
        function updatePreview() {
            const selected = selection.getSelected();
            if (selected.length === 0) {
                el.canvas.width = 0;
                el.canvas.height = 0;
                return;
            }

            const images = selected.map(f => f.img);
            const gap = state.gap;
            const radius = state.borderRadius;
            const bgColor = state.bgColor;

            let canvasWidth, canvasHeight;
            const canvas = el.canvas;
            const ctx = canvas.getContext('2d');

            if (state.layout === 'horizontal') {
                // Scale all images to same height, arrange horizontally
                const targetHeight = Math.max(...images.map(img => img.naturalHeight));
                const scaledImages = images.map(img => {
                    const ratio = targetHeight / img.naturalHeight;
                    return { img, w: Math.round(img.naturalWidth * ratio), h: targetHeight };
                });
                canvasWidth = scaledImages.reduce((sum, s) => sum + s.w, 0) + gap * (scaledImages.length + 1);
                canvasHeight = targetHeight + gap * 2;
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                let x = gap;
                scaledImages.forEach(s => {
                    _drawRoundedImage(ctx, s.img, x, gap, s.w, s.h, radius);
                    x += s.w + gap;
                });

            } else if (state.layout === 'vertical') {
                // Scale all images to same width, arrange vertically
                const targetWidth = Math.max(...images.map(img => img.naturalWidth));
                const scaledImages = images.map(img => {
                    const ratio = targetWidth / img.naturalWidth;
                    return { img, w: targetWidth, h: Math.round(img.naturalHeight * ratio) };
                });
                canvasWidth = targetWidth + gap * 2;
                canvasHeight = scaledImages.reduce((sum, s) => sum + s.h, 0) + gap * (scaledImages.length + 1);
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                let y = gap;
                scaledImages.forEach(s => {
                    _drawRoundedImage(ctx, s.img, gap, y, s.w, s.h, radius);
                    y += s.h + gap;
                });

            } else if (state.layout === 'grid') {
                // Distribute into rows x cols grid, center each image in its cell
                const rows = state.gridRows;
                const cols = state.gridCols;

                // Determine cell size based on the largest image aspect ratio
                // We want cells that can contain each image at reasonable size
                const cellWidth = Math.max(...images.map(img => img.naturalWidth));
                const cellHeight = Math.max(...images.map(img => img.naturalHeight));

                canvasWidth = cols * cellWidth + (cols + 1) * gap;
                canvasHeight = rows * cellHeight + (rows + 1) * gap;
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                images.forEach((img, idx) => {
                    const row = Math.floor(idx / cols);
                    const col = idx % cols;
                    if (row >= rows) return; // skip overflow images

                    // Scale image to fit within cell
                    const scale = Math.min(cellWidth / img.naturalWidth, cellHeight / img.naturalHeight, 1);
                    const w = Math.round(img.naturalWidth * scale);
                    const h = Math.round(img.naturalHeight * scale);

                    // Center in cell
                    const cellX = gap + col * (cellWidth + gap);
                    const cellY = gap + row * (cellHeight + gap);
                    const x = cellX + Math.round((cellWidth - w) / 2);
                    const y = cellY + Math.round((cellHeight - h) / 2);

                    _drawRoundedImage(ctx, img, x, y, w, h, radius);
                });
            }
        }

        // ---- Download Collage ----
        container.querySelector('#collage-download').onclick = async () => {
            const selected = selection.getSelected();
            if (selected.length === 0) {
                Toast.warning('请先选择图片');
                return;
            }

            // Re-render at full quality
            updatePreview();

            const canvas = el.canvas;
            if (canvas.width === 0 || canvas.height === 0) {
                Toast.warning('画布为空，无法下载');
                return;
            }

            const mimeType = state.quality < 100 ? 'image/jpeg' : 'image/png';
            const quality = state.quality / 100;
            const blob = await Utils.canvasToBlob(canvas, mimeType, quality);
            const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
            Utils.downloadBlob(blob, `拼图_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.${ext}`);
            Toast.success('拼图已下载');
        };

        // ---- Batch Download Originals ----
        container.querySelector('#collage-download-orig').onclick = async () => {
            const selected = selection.getSelected();
            if (selected.length === 0) {
                Toast.warning('请先选择图片');
                return;
            }

            const files = selected.map(item => ({
                blob: item.file,
                name: item.name
            }));

            await batchDownload(files, `原图_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`);
        };

        // Initial preview (empty)
        updatePreview();
    },

    // =============================================
    // Crop Tool — Single / Batch
    // =============================================
    renderCrop(container) {
        const state = {
            files: [],
            mode: 'single',       // 'single' | 'batch'
            activeId: null,
            ratio: null,          // shared aspect ratio
            // Batch mode: crop stored as ratios (0-1) relative to each image
            cropRatioX: 0.1, cropRatioY: 0.1, cropRatioW: 0.8, cropRatioH: 0.8,
            rotation: 0, flipH: false, flipV: false,
            // Interaction (transient)
            dragging: false, resizing: false, resizeHandle: '',
            dragStart: { x: 0, y: 0 }, cropStart: { x: 0, y: 0, w: 0, h: 0 },
            _activeCv: null,
            previewCanvases: []   // batch: { id, canvas, img, item }
        };

        const MAX_HISTORY = 20;
        const selection = new SelectionManager();

        function getActive() {
            if (!state.activeId) return null;
            return state.files.find(f => f.id === state.activeId) || null;
        }

        // For batch mode: get crop box in canvas-pixel coords
        function cropBoxFor(cv) {
            return {
                x: state.cropRatioX * cv.width,
                y: state.cropRatioY * cv.height,
                w: state.cropRatioW * cv.width,
                h: state.cropRatioH * cv.height
            };
        }

        function setRatiosFromBox(box, cv) {
            state.cropRatioX = box.x / cv.width;
            state.cropRatioY = box.y / cv.height;
            state.cropRatioW = box.w / cv.width;
            state.cropRatioH = box.h / cv.height;
        }

        function clampRatios() {
            state.cropRatioW = Utils.clamp(state.cropRatioW, 0.02, 1);
            state.cropRatioH = Utils.clamp(state.cropRatioH, 0.02, 1);
            state.cropRatioX = Utils.clamp(state.cropRatioX, 0, 1 - state.cropRatioW);
            state.cropRatioY = Utils.clamp(state.cropRatioY, 0, 1 - state.cropRatioH);
        }

        // ---- Build DOM ----
        container.innerHTML = `
            <div id="crop-upload"></div>
            <div id="crop-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="crop-count">已选择 0 张图片</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="crop-select-all">全选</button>
                        <button class="btn btn-sm" id="crop-invert">反选</button>
                        <button class="btn btn-sm" id="crop-clear">清空</button>
                    </div>
                </div>
                <div class="file-list-view" id="crop-list"></div>
            </div>
            <div id="crop-workspace" class="hidden">
                <div class="controls-panel">
                    <h4>裁剪设置</h4>
                    <div class="controls-grid">
                        <div class="control-group">
                            <label>裁剪模式</label>
                            <div class="layout-options" id="crop-batch-mode">
                                <div class="layout-option active" data-mode="single">单张裁剪</div>
                                <div class="layout-option" data-mode="batch">批量裁剪</div>
                            </div>
                        </div>
                        <div class="control-group">
                            <label>比例预设</label>
                            <div class="layout-options" id="crop-ratios">
                                <div class="layout-option active" data-ratio="free">自由</div>
                                <div class="layout-option" data-ratio="1:1">1:1</div>
                                <div class="layout-option" data-ratio="4:3">4:3</div>
                                <div class="layout-option" data-ratio="16:9">16:9</div>
                                <div class="layout-option" data-ratio="3:2">3:2</div>
                            </div>
                        </div>
                        <div class="control-group">
                            <label>变换</label>
                            <div style="display:flex;gap:6px;flex-wrap:wrap">
                                <button class="btn btn-sm" id="crop-rotate-left">↺ 左旋90°</button>
                                <button class="btn btn-sm" id="crop-rotate-right">↻ 右旋90°</button>
                                <button class="btn btn-sm" id="crop-rotate-180">↕ 旋转180°</button>
                                <button class="btn btn-sm" id="crop-flip-h">⇔ 水平翻转</button>
                                <button class="btn btn-sm" id="crop-flip-v">⇕ 垂直翻转</button>
                            </div>
                        </div>
                        <div class="control-group" id="crop-undo-group">
                            <label>操作</label>
                            <div style="display:flex;gap:6px;flex-wrap:wrap">
                                <button class="btn btn-sm" id="crop-reset">重置</button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Single mode crop workspace -->
                <div id="crop-single-workspace">
                    <div class="preview-area">
                        <h4>裁剪区域 <span id="crop-size-info" style="font-weight:normal;font-size:12px;color:var(--text-secondary)"></span></h4>
                        <div class="crop-container" id="crop-container">
                            <img id="crop-image" src="" alt="crop source" draggable="false">
                            <div class="crop-box" id="crop-box">
                                <div class="crop-handle tl" data-handle="tl"></div>
                                <div class="crop-handle tr" data-handle="tr"></div>
                                <div class="crop-handle bl" data-handle="bl"></div>
                                <div class="crop-handle br" data-handle="br"></div>
                            </div>
                        </div>
                    </div>
                    <div class="preview-area">
                        <h4>预览</h4>
                        <div class="preview-canvas-wrap"><canvas id="crop-preview-canvas"></canvas></div>
                    </div>
                </div>
                <!-- Batch mode preview grid -->
                <div id="crop-batch-workspace" class="hidden">
                    <div class="preview-area">
                        <h4>批量预览 <span id="crop-batch-hint" style="font-weight:normal;font-size:12px;color:var(--text-secondary)">— 在任意图上拖拽裁剪框，所有图同步</span></h4>
                        <div id="crop-batch-grid" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center"></div>
                    </div>
                </div>
                <div class="action-bar">
                    <div class="action-bar-left"><span id="crop-info"></span></div>
                    <div class="action-bar-right">
                        <button class="btn" id="crop-download-orig">批量下载原图</button>
                        <button class="btn btn-primary" id="crop-process">开始处理</button>
                    </div>
                </div>
            </div>
            <div id="crop-results" class="file-list hidden">
                <div class="file-list-header">
                    <span id="crop-result-count">处理结果</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="crop-res-select-all">全选</button>
                        <button class="btn btn-sm" id="crop-res-invert">反选</button>
                        <button class="btn btn-primary btn-sm" id="crop-res-dl-selected">下载选中 (ZIP)</button>
                    </div>
                </div>
                <div class="file-list-view" id="crop-result-list"></div>
            </div>
        `;

        const el = {
            upload: container.querySelector('#crop-upload'),
            filesSection: container.querySelector('#crop-files'),
            list: container.querySelector('#crop-list'),
            count: container.querySelector('#crop-count'),
            workspace: container.querySelector('#crop-workspace'),
            batchModeOpts: container.querySelector('#crop-batch-mode'),
            cropContainer: container.querySelector('#crop-container'),
            cropImage: container.querySelector('#crop-image'),
            cropBox: container.querySelector('#crop-box'),
            previewCanvas: container.querySelector('#crop-preview-canvas'),
            sizeInfo: container.querySelector('#crop-size-info'),
            info: container.querySelector('#crop-info'),
            ratioOptions: container.querySelector('#crop-ratios'),
            btnReset: container.querySelector('#crop-reset'),
            btnRotateLeft: container.querySelector('#crop-rotate-left'),
            btnRotateRight: container.querySelector('#crop-rotate-right'),
            btnRotate180: container.querySelector('#crop-rotate-180'),
            btnFlipH: container.querySelector('#crop-flip-h'),
            btnFlipV: container.querySelector('#crop-flip-v'),
            btnProcess: container.querySelector('#crop-process'),
            results: container.querySelector('#crop-results'),
            resultList: container.querySelector('#crop-result-list'),
            resultCount: container.querySelector('#crop-result-count'),
            singleWorkspace: container.querySelector('#crop-single-workspace'),
            batchWorkspace: container.querySelector('#crop-batch-workspace'),
            batchGrid: container.querySelector('#crop-batch-grid')
        };

        function showSections() {
            const has = state.files.length > 0;
            el.filesSection.classList.toggle('hidden', !has);
            el.workspace.classList.toggle('hidden', !has);
        }

        function updateCount() {
            el.count.textContent = `已选择 ${selection.count} 张图片 (共 ${selection.total} 张)`;
        }

        // ---- Single mode: activate an image ----
        async function activateImage(item) {
            state.activeId = item.id;
            if (!item.img) { item.dataUrl = await Utils.readAsDataURL(item.file); item.img = await Utils.loadImage(item.dataUrl); }
            el.cropImage.src = item.dataUrl || '';
            el.cropImage.onload = () => {
                if (!item.cropBox) initSingleCropBox();
                else {
                    item.scaleX = item.img.naturalWidth / el.cropImage.clientWidth;
                    item.scaleY = item.img.naturalHeight / el.cropImage.clientHeight;
                }
                renderSingleCropBox(); updateSinglePreview(); updateSizeInfo();
                updateRatioUI();
            };
        }

        function initSingleCropBox() {
            const a = getActive(); if (!a) return;
            const dw = el.cropImage.clientWidth, dh = el.cropImage.clientHeight;
            a.scaleX = a.img.naturalWidth / dw; a.scaleY = a.img.naturalHeight / dh;
            const m = 0.1; let w = dw * (1 - 2 * m), h = dh * (1 - 2 * m);
            if (state.ratio) { const r = state.ratio; if (w / h > r) w = h * r; else h = w / r; }
            a.cropBox = { x: (dw - w) / 2, y: (dh - h) / 2, w, h };
            a.rotation = 0; a.flipH = false; a.flipV = false;
        }

        function renderSingleCropBox() {
            const a = getActive(); if (!a) return;
            const cb = a.cropBox;
            el.cropBox.style.left = cb.x + 'px'; el.cropBox.style.top = cb.y + 'px';
            el.cropBox.style.width = cb.w + 'px'; el.cropBox.style.height = cb.h + 'px';
        }

        function updateSizeInfo() {
            const a = getActive(); if (!a) return;
            const ow = Math.round(a.cropBox.w * a.scaleX), oh = Math.round(a.cropBox.h * a.scaleY);
            el.sizeInfo.textContent = `(${ow} × ${oh} px)`;
            el.info.textContent = `裁剪区域: ${ow} × ${oh} px`;
        }

        function updateSinglePreview() {
            const a = getActive(); if (!a) return;
            const cv = el.previewCanvas, ctx = cv.getContext('2d');
            const cb = a.cropBox;
            const sx = Math.round(cb.x * a.scaleX), sy = Math.round(cb.y * a.scaleY);
            const sw = Math.round(cb.w * a.scaleX), sh = Math.round(cb.h * a.scaleY);
            let ow = sw, oh = sh;
            if (a.rotation === 90 || a.rotation === 270) { ow = sh; oh = sw; }
            const sc = Math.min(400 / ow, 300 / oh, 1);
            cv.width = Math.round(ow * sc); cv.height = Math.round(oh * sc);
            ctx.save(); ctx.translate(cv.width / 2, cv.height / 2);
            ctx.rotate(a.rotation * Math.PI / 180);
            ctx.scale(a.flipH ? -1 : 1, a.flipV ? -1 : 1);
            let dw, dh;
            if (a.rotation === 90 || a.rotation === 270) { dw = Math.round(sh * sc); dh = Math.round(sw * sc); }
            else { dw = Math.round(sw * sc); dh = Math.round(sh * sc); }
            ctx.drawImage(a.img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
            ctx.restore();
        }

        function updateRatioUI() {
            el.ratioOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
            if (state.ratio) {
                const m = { '1': '1:1', '1.333': '4:3', '1.778': '16:9', '1.5': '3:2' };
                const k = m[state.ratio.toFixed(3)] || 'free';
                const btn = el.ratioOptions.querySelector(`[data-ratio="${k}"]`);
                (btn || el.ratioOptions.querySelector('[data-ratio="free"]')).classList.add('active');
            } else { el.ratioOptions.querySelector('[data-ratio="free"]').classList.add('active'); }
        }

        // ---- Batch mode: build preview grid ----
        async function buildBatchGrid() {
            el.batchGrid.innerHTML = '';
            state.previewCanvases = [];
            if (!state.files.length) return;
            const maxDim = Math.min(260, Math.floor((container.clientWidth - 48) / Math.max(1, Math.min(state.files.length, 2))));
            for (const item of state.files) {
                if (!item.img) { item.dataUrl = await Utils.readAsDataURL(item.file); item.img = await Utils.loadImage(item.dataUrl); }
                const wrap = document.createElement('div');
                wrap.style.cssText = 'position:relative;display:inline-block;line-height:0';
                const cv = document.createElement('canvas');
                cv.className = 'crop-batch-cv';
                cv.dataset.id = item.id;
                cv.style.cssText = 'cursor:default;border-radius:4px';
                const label = document.createElement('span');
                label.style.cssText = 'display:block;font-size:11px;color:var(--text-secondary);text-align:center;margin-top:2px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
                label.textContent = item.name;
                wrap.appendChild(cv); wrap.appendChild(label);
                el.batchGrid.appendChild(wrap);
                const sc = Math.min(maxDim / item.img.naturalWidth, maxDim / item.img.naturalHeight, 1);
                cv.width = Math.round(item.img.naturalWidth * sc); cv.height = Math.round(item.img.naturalHeight * sc);
                state.previewCanvases.push({ id: item.id, canvas: cv, img: item.img, item });
            }
            // Attach events
            state.previewCanvases.forEach(pc => {
                pc.canvas.addEventListener('mousedown', (e) => batchMouseDown(e, pc));
                pc.canvas.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) batchMouseDown({ preventDefault: () => e.preventDefault(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }, pc);
                }, { passive: false });
            });
            renderAllBatchCanvases();
        }

        function renderAllBatchCanvases() {
            state.previewCanvases.forEach(pc => {
                const cv = pc.canvas, ctx = cv.getContext('2d');
                ctx.clearRect(0, 0, cv.width, cv.height);
                ctx.drawImage(pc.img, 0, 0, cv.width, cv.height);
                // Draw crop overlay
                const box = cropBoxFor(cv);
                const hs = 6;
                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.45)';
                // Dim outside crop area (top, bottom, left, right)
                ctx.fillRect(0, 0, cv.width, box.y);
                ctx.fillRect(0, box.y + box.h, cv.width, cv.height - box.y - box.h);
                ctx.fillRect(0, box.y, box.x, box.h);
                ctx.fillRect(box.x + box.w, box.y, cv.width - box.x - box.w, box.h);
                // Dashed border
                ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
                ctx.setLineDash([5, 3]); ctx.strokeRect(box.x, box.y, box.w, box.h); ctx.setLineDash([]);
                // Handles
                ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]].forEach(([cx, cy]) => {
                    ctx.fillRect(cx - hs, cy - hs, hs * 2, hs * 2);
                    ctx.strokeRect(cx - hs, cy - hs, hs * 2, hs * 2);
                });
                ctx.restore();
            });
        }

        // Batch mode hit testing
        function batchHitHandle(cv, box, mx, my) {
            const hs = 12;
            const cs = [[box.x, box.y, 'tl'], [box.x + box.w, box.y, 'tr'], [box.x, box.y + box.h, 'bl'], [box.x + box.w, box.y + box.h, 'br']];
            for (const [cx, cy, h] of cs) { if (Math.abs(mx - cx) <= hs && Math.abs(my - cy) <= hs) return h; }
            return '';
        }

        function batchHitBox(box, mx, my) {
            return mx >= box.x && mx <= box.x + box.w && my >= box.y && my <= box.y + box.h;
        }

        function batchMouseDown(e, pc) {
            if (state.mode !== 'batch') return;
            const cv = pc.canvas;
            const rect = cv.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (cv.width / rect.width);
            const my = (e.clientY - rect.top) * (cv.height / rect.height);
            const box = cropBoxFor(cv);
            const h = batchHitHandle(cv, box, mx, my);
            if (h) {
                state.resizing = true; state.resizeHandle = h;
                state.dragStart = { x: mx, y: my };
                state.cropStart = { ...box };
                state._activeCv = cv;
                e.preventDefault(); return;
            }
            if (batchHitBox(box, mx, my)) {
                state.dragging = true;
                state.dragStart = { x: mx, y: my };
                state.cropStart = { ...box };
                state._activeCv = cv;
                e.preventDefault();
            }
        }

        function batchMouseMove(e) {
            if (state.mode !== 'batch') return;
            if (!state.dragging && !state.resizing) return;
            const cv = state._activeCv; if (!cv || !document.contains(cv)) return;
            const rect = cv.getBoundingClientRect();
            if (rect.width === 0) return;
            const mx = (e.clientX - rect.left) * (cv.width / rect.width);
            const my = (e.clientY - rect.top) * (cv.height / rect.height);
            const dx = mx - state.dragStart.x, dy = my - state.dragStart.y;
            const cw = cv.width, ch = cv.height, minSz = 20;
            const cs = state.cropStart;

            if (state.dragging) {
                let nx = cs.x + dx, ny = cs.y + dy;
                nx = Utils.clamp(nx, -cs.w / 2, cw - cs.w / 2);
                ny = Utils.clamp(ny, -cs.h / 2, ch - cs.h / 2);
                setRatiosFromBox({ x: nx, y: ny, w: cs.w, h: cs.h }, cv);
            } else if (state.resizing) {
                let nx = cs.x, ny = cs.y, nw = cs.w, nh = cs.h;
                const h = state.resizeHandle;
                if (state.ratio) {
                    if (h === 'br') { nw = Math.max(minSz, cs.w + dx); nh = nw / state.ratio; }
                    else if (h === 'bl') { nw = Math.max(minSz, cs.w - dx); nh = nw / state.ratio; nx = cs.x + cs.w - nw; }
                    else if (h === 'tr') { nw = Math.max(minSz, cs.w + dx); nh = nw / state.ratio; ny = cs.y + cs.h - nh; }
                    else if (h === 'tl') { nw = Math.max(minSz, cs.w - dx); nh = nw / state.ratio; nx = cs.x + cs.w - nw; ny = cs.y + cs.h - nh; }
                } else {
                    if (h === 'br') { nw = Math.max(minSz, cs.w + dx); nh = Math.max(minSz, cs.h + dy); }
                    else if (h === 'bl') { nw = Math.max(minSz, cs.w - dx); nh = Math.max(minSz, cs.h + dy); nx = cs.x + cs.w - nw; }
                    else if (h === 'tr') { nw = Math.max(minSz, cs.w + dx); nh = Math.max(minSz, cs.h - dy); ny = cs.y + cs.h - nh; }
                    else if (h === 'tl') { nw = Math.max(minSz, cs.w - dx); nh = Math.max(minSz, cs.h - dy); nx = cs.x + cs.w - nw; ny = cs.y + cs.h - nh; }
                }
                if (nx < 0) { nw += nx; nx = 0; } if (ny < 0) { nh += ny; ny = 0; }
                if (nx + nw > cw) nw = cw - nx; if (ny + nh > ch) nh = ch - ny;
                nw = Math.max(nw, minSz); nh = Math.max(nh, minSz);
                setRatiosFromBox({ x: nx, y: ny, w: nw, h: nh }, cv);
            }
            clampRatios();
            renderAllBatchCanvases();
        }

        function batchMouseUp() {
            if (state.mode !== 'batch') return;
            state.dragging = false; state.resizing = false; state._activeCv = null;
        }

        document.addEventListener('mousemove', batchMouseMove);
        document.addEventListener('mouseup', batchMouseUp);
        document.addEventListener('touchmove', (e) => {
            if (state.mode !== 'batch') return;
            if (!state.dragging && !state.resizing) return;
            if (e.touches.length === 1) batchMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        }, { passive: false });
        document.addEventListener('touchend', batchMouseUp);

        // ---- Single mode mouse interaction ----
        function singleMouseDown(e) {
            e.preventDefault();
            const a = getActive(); if (!a) return;
            const rect = el.cropContainer.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            const handle = e.target.closest('.crop-handle');
            if (handle) {
                state.resizing = true; state.resizeHandle = handle.dataset.handle;
                state.dragStart = { x: mx, y: my }; state.cropStart = { ...a.cropBox };
                return;
            }
            const cb = a.cropBox;
            if (mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h) {
                state.dragging = true; state.dragStart = { x: mx, y: my }; state.cropStart = { ...a.cropBox };
            }
        }

        function singleMouseMove(e) {
            if (state.mode !== 'single') return;
            if (!state.dragging && !state.resizing) return;
            e.preventDefault();
            const a = getActive(); if (!a) return;
            const rect = el.cropContainer.getBoundingClientRect();
            const mx = e.clientX - rect.left, my = e.clientY - rect.top;
            const dx = mx - state.dragStart.x, dy = my - state.dragStart.y;
            const dw = el.cropImage.clientWidth, dh = el.cropImage.clientHeight;
            if (state.dragging) {
                a.cropBox.x = Utils.clamp(state.cropStart.x + dx, 0, dw - a.cropBox.w);
                a.cropBox.y = Utils.clamp(state.cropStart.y + dy, 0, dh - a.cropBox.h);
            } else if (state.resizing) {
                const cs = state.cropStart, h = state.resizeHandle;
                let nx = cs.x, ny = cs.y, nw = cs.w, nh = cs.h;
                if (h === 'br') { nw = Math.max(20, cs.w + dx); nh = state.ratio ? nw / state.ratio : Math.max(20, cs.h + dy); }
                else if (h === 'bl') { nw = Math.max(20, cs.w - dx); nh = state.ratio ? nw / state.ratio : Math.max(20, cs.h + dy); nx = cs.x + cs.w - nw; }
                else if (h === 'tr') { nw = Math.max(20, cs.w + dx); nh = state.ratio ? nw / state.ratio : Math.max(20, cs.h - dy); ny = cs.y + cs.h - nh; }
                else if (h === 'tl') { nw = Math.max(20, cs.w - dx); nh = state.ratio ? nw / state.ratio : Math.max(20, cs.h - dy); nx = cs.x + cs.w - nw; ny = cs.y + cs.h - nh; }
                if (nx < 0) { nw += nx; nx = 0; } if (ny < 0) { nh += ny; ny = 0; }
                if (nx + nw > dw) nw = dw - nx; if (ny + nh > dh) nh = dh - ny;
                nw = Math.max(nw, 20); nh = Math.max(nh, 20);
                a.cropBox = { x: nx, y: ny, w: nw, h: nh };
            }
            renderSingleCropBox(); updateSinglePreview(); updateSizeInfo();
        }

        function singleMouseUp() {
            if (state.mode !== 'single') return;
            if (!state.dragging && !state.resizing) return;
            state.dragging = false; state.resizing = false;
            const a = getActive(); if (a) {
                a.scaleX = a.img.naturalWidth / el.cropImage.clientWidth;
                a.scaleY = a.img.naturalHeight / el.cropImage.clientHeight;
            }
        }

        el.cropContainer.addEventListener('mousedown', singleMouseDown);
        document.addEventListener('mousemove', singleMouseMove);
        document.addEventListener('mouseup', singleMouseUp);
        el.cropContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) singleMouseDown({ preventDefault: () => e.preventDefault(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target });
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (!state.dragging && !state.resizing) return;
            if (e.touches.length === 1) singleMouseMove({ preventDefault: () => e.preventDefault(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        }, { passive: false });
        document.addEventListener('touchend', singleMouseUp);

        // ---- File list ----
        function renderFileList() {
            el.list.innerHTML = '';
            state.files.forEach(item => {
                const isActive = state.activeId === item.id;
                const row = document.createElement('div');
                row.className = 'file-list-row' + (selection.isSelected(item.id) ? ' selected' : '') + (isActive ? ' preview-active' : '');
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${selection.isSelected(item.id) ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${item.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${item.name}${isActive ? ' <span style="font-size:11px;color:var(--warning)">✂</span>' : ''}</div>
                        <div class="file-list-row-meta">${Utils.formatSize(item.size)}</div>
                    </div>
                `;
                row.querySelector('.file-cb').addEventListener('change', () => {
                    selection.toggle(item.id); row.classList.toggle('selected', selection.isSelected(item.id));
                    row.querySelector('.file-cb').checked = selection.isSelected(item.id); updateCount();
                });
                row.addEventListener('click', (e) => {
                    if (e.target.closest('.file-cb')) return;
                    if (state.mode === 'single') { activateImage(item); renderFileList(); }
                });
                el.list.appendChild(row);
            });
            updateCount();
        }

        // ---- Upload ----
        FileUpload.createUploadArea(el.upload, {
            accept: 'image/*', multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式，支持批量上传',
            onFiles: async (newFiles) => {
                const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
                if (!imageFiles.length) { Toast.warning('请选择图片文件'); return; }
                Loading.show('正在加载图片...');
                for (let i = 0; i < imageFiles.length; i++) {
                    const f = imageFiles[i];
                    try {
                        const thumb = await Utils.createThumbnail(f);
                        state.files.push({ id: Utils.uid(), file: f, name: f.name, size: f.size, thumb, img: null, dataUrl: null, cropBox: null, rotation: 0, flipH: false, flipV: false, scaleX: 1, scaleY: 1 });
                    } catch (e) { console.error('Failed:', f.name, e); }
                    Loading.progress(Math.round((i + 1) / imageFiles.length * 100));
                }
                Loading.hide();
                selection.setItems(state.files); renderFileList(); showSections();
                if (state.mode === 'single' && state.files.length > 0) { activateImage(state.files[0]); renderFileList(); }
                else if (state.mode === 'batch') buildBatchGrid();
                Toast.success(`已添加 ${imageFiles.length} 张图片`);
            }
        });

        container.querySelector('#crop-select-all').onclick = () => { selection.selectAll(); renderFileList(); };
        container.querySelector('#crop-invert').onclick = () => { selection.invertSelection(); renderFileList(); };
        container.querySelector('#crop-clear').onclick = () => { state.files = []; selection.setItems([]); state.activeId = null; state.previewCanvases = []; el.batchGrid.innerHTML = ''; renderFileList(); showSections(); };

        // ---- Mode toggle ----
        el.batchModeOpts.querySelectorAll('.layout-option').forEach(opt => {
            opt.addEventListener('click', () => {
                el.batchModeOpts.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.mode = opt.dataset.mode;
                el.singleWorkspace.classList.toggle('hidden', state.mode !== 'single');
                el.batchWorkspace.classList.toggle('hidden', state.mode !== 'batch');
                if (state.mode === 'batch' && state.files.length > 0) buildBatchGrid();
                else if (state.mode === 'single' && state.files.length > 0 && !state.activeId) { activateImage(state.files[0]); renderFileList(); }
            });
        });

        // ---- Ratio presets ----
        el.ratioOptions.querySelectorAll('.layout-option').forEach(opt => {
            opt.onclick = () => {
                el.ratioOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                const val = opt.dataset.ratio;
                state.ratio = val === 'free' ? null : parseInt(val.split(':')[0]) / parseInt(val.split(':')[1]);
                if (state.mode === 'single') {
                    if (state.ratio) {
                        const a = getActive(); if (!a) return;
                        const cb = a.cropBox, dh = el.cropImage.clientHeight;
                        const nh = cb.w / state.ratio;
                        if (nh <= dh && cb.y + nh <= dh) cb.h = nh; else { cb.h = dh - cb.y; cb.w = cb.h * state.ratio; }
                        renderSingleCropBox(); updateSinglePreview(); updateSizeInfo();
                    }
                } else {
                    if (state.ratio) clampRatios();
                    renderAllBatchCanvases();
                }
            };
        });

        // ---- Transform buttons (apply to all) ----
        function applyRotation(delta) {
            if (state.mode === 'single') {
                const a = getActive(); if (!a) return;
                a.rotation = (a.rotation + delta + 360) % 360;
                updateSinglePreview();
            } else {
                state.rotation = (state.rotation + delta + 360) % 360;
                // Rotation applied to each image individually, stored in item.rotation
                state.files.forEach(f => { f.rotation = state.rotation; });
            }
        }

        el.btnRotateLeft.onclick = () => applyRotation(-90);
        el.btnRotateRight.onclick = () => applyRotation(90);
        el.btnRotate180.onclick = () => applyRotation(180);
        el.btnFlipH.onclick = () => {
            if (state.mode === 'single') { const a = getActive(); if (a) { a.flipH = !a.flipH; updateSinglePreview(); } }
            else { state.flipH = !state.flipH; state.files.forEach(f => f.flipH = state.flipH); }
        };
        el.btnFlipV.onclick = () => {
            if (state.mode === 'single') { const a = getActive(); if (a) { a.flipV = !a.flipV; updateSinglePreview(); } }
            else { state.flipV = !state.flipV; state.files.forEach(f => f.flipV = state.flipV); }
        };

        el.btnReset.onclick = () => {
            state.ratio = null; state.rotation = 0; state.flipH = false; state.flipV = false;
            state.cropRatioX = 0.1; state.cropRatioY = 0.1; state.cropRatioW = 0.8; state.cropRatioH = 0.8;
            el.ratioOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
            el.ratioOptions.querySelector('[data-ratio="free"]').classList.add('active');
            if (state.mode === 'single') { const a = getActive(); if (a) { a.rotation = 0; a.flipH = false; a.flipV = false; initSingleCropBox(); renderSingleCropBox(); updateSinglePreview(); updateSizeInfo(); } }
            else { state.files.forEach(f => { f.rotation = 0; f.flipH = false; f.flipV = false; }); renderAllBatchCanvases(); }
            Toast.info('已重置');
        };

        // ---- Crop image helper ----
        async function cropOneImage(item) {
            if (!item.img) { item.dataUrl = await Utils.readAsDataURL(item.file); item.img = await Utils.loadImage(item.dataUrl); }
            let sx, sy, sw, sh, rot, fh, fv;
            if (state.mode === 'single') {
                if (!item.cropBox) { item.cropBox = { x: 0, y: 0, w: item.img.naturalWidth, h: item.img.naturalHeight }; item.scaleX = 1; item.scaleY = 1; }
                const cb = item.cropBox;
                sx = Math.round(cb.x * (item.scaleX || 1)); sy = Math.round(cb.y * (item.scaleY || 1));
                sw = Math.round(cb.w * (item.scaleX || 1)); sh = Math.round(cb.h * (item.scaleY || 1));
                rot = item.rotation || 0; fh = item.flipH || false; fv = item.flipV || false;
            } else {
                const w = item.img.naturalWidth, h = item.img.naturalHeight;
                sx = Math.round(state.cropRatioX * w); sy = Math.round(state.cropRatioY * h);
                sw = Math.round(state.cropRatioW * w); sh = Math.round(state.cropRatioH * h);
                rot = state.rotation || 0; fh = state.flipH; fv = state.flipV;
            }
            let ow = sw, oh = sh;
            if (rot === 90 || rot === 270) { ow = sh; oh = sw; }
            const oc = document.createElement('canvas'); oc.width = ow; oc.height = oh;
            const ctx = oc.getContext('2d');
            ctx.save(); ctx.translate(ow / 2, oh / 2); ctx.rotate(rot * Math.PI / 180);
            ctx.scale(fh ? -1 : 1, fv ? -1 : 1);
            let dw, dh;
            if (rot === 90 || rot === 270) { dw = sh; dh = sw; } else { dw = sw; dh = sh; }
            ctx.drawImage(item.img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
            ctx.restore();
            return await Utils.canvasToBlob(oc, 'image/png');
        }

        state.cropResults = [];
        const cropResultSel = new Set();

        function renderCropResults() {
            el.results.classList.toggle('hidden', !state.cropResults.length);
            el.resultCount.textContent = `已处理 ${state.cropResults.length} 张图片`;
            el.resultList.innerHTML = '';
            state.cropResults.forEach(r => {
                const checked = cropResultSel.has(r.id);
                const row = document.createElement('div');
                row.className = 'file-list-row' + (checked ? ' selected' : '');
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${checked ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${r.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${r.name}</div>
                        <div class="file-list-row-meta">${Utils.formatSize(r.size)}</div>
                    </div>
                    <button class="btn btn-sm btn-primary result-dl-btn">下载</button>
                `;
                row.querySelector('.file-cb').onchange = () => {
                    if (cropResultSel.has(r.id)) cropResultSel.delete(r.id); else cropResultSel.add(r.id);
                    row.classList.toggle('selected', cropResultSel.has(r.id));
                };
                row.querySelector('.result-dl-btn').onclick = () => Utils.downloadBlob(r.blob, r.name);
                el.resultList.appendChild(row);
            });
        }

        // ---- Process ----
        el.btnProcess.addEventListener('click', async () => {
            const selected = selection.getSelected();
            if (!selected.length) { Toast.warning('请先选择图片'); return; }
            Loading.show('正在裁剪图片...');
            state.cropResults = [];
            for (let i = 0; i < selected.length; i++) {
                Loading.progress(Math.round((i + 1) / selected.length * 100));
                Loading.setText(`正在处理 ${selected[i].name}...`);
                try {
                    const blob = await cropOneImage(selected[i]);
                    if (blob) {
                        const thumb = await Utils.createThumbnail(new File([blob], selected[i].name, { type: 'image/png' }));
                        state.cropResults.push({ id: Utils.uid(), blob, name: `${Utils.getBaseName(selected[i].name)}_裁剪.png`, size: blob.size, thumb });
                    }
                } catch (err) { console.error('Failed:', selected[i].name, err); Toast.error(`处理失败: ${selected[i].name}`); }
            }
            Loading.hide();
            if (!state.cropResults.length) { Toast.warning('没有成功处理的图片'); return; }
            cropResultSel.clear(); state.cropResults.forEach(r => cropResultSel.add(r.id));
            renderCropResults();
            Toast.success(`已处理 ${state.cropResults.length} 张图片`);
        });

        container.querySelector('#crop-res-select-all').onclick = () => { state.cropResults.forEach(r => cropResultSel.add(r.id)); renderCropResults(); };
        container.querySelector('#crop-res-invert').onclick = () => { const s = new Set(state.cropResults.filter(r => !cropResultSel.has(r.id)).map(r => r.id)); cropResultSel.clear(); s.forEach(id => cropResultSel.add(id)); renderCropResults(); };
        container.querySelector('#crop-res-dl-selected').onclick = async () => {
            const selected = state.cropResults.filter(r => cropResultSel.has(r.id));
            if (!selected.length) { Toast.warning('请先勾选要下载的文件'); return; }
            await batchDownload(selected.map(r => ({ blob: r.blob, name: r.name })), `裁剪图片_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`);
        };

        container.querySelector('#crop-download-orig').onclick = async () => {
            const selected = selection.getSelected();
            if (!selected.length) { Toast.warning('请先选择图片'); return; }
            await batchDownload(selected.map(i => ({ blob: i.file, name: i.name })), `原图_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`);
        };
    },
    // Compress Tool
    // =============================================
    renderCompress(container) {
        const state = {
            files: [],       // { id, file, name, size, thumb, compressedBlob, compressedSize }
            quality: 80,
            format: 'image/jpeg',
            maxWidth: 0,     // 0 = no limit
            maxHeight: 0
        };

        const selection = new SelectionManager();

        // ---- Build DOM ----
        container.innerHTML = `
            <div id="compress-upload"></div>
            <div id="compress-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="compress-count">已选择 0 张图片</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="compress-select-all">全选</button>
                        <button class="btn btn-sm" id="compress-invert">反选</button>
                        <button class="btn btn-sm" id="compress-clear">清空</button>
                    </div>
                </div>
                <div class="file-list-view" id="compress-list"></div>
            </div>
            <div id="compress-controls" class="controls-panel hidden">
                <h4>压缩设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>输出质量: <span id="compress-quality-val">80</span>%</label>
                        <input type="range" id="compress-quality" min="1" max="100" value="80">
                    </div>
                    <div class="control-group">
                        <label>输出格式</label>
                        <select id="compress-format">
                            <option value="image/jpeg">JPEG</option>
                            <option value="image/png">PNG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>最大宽度 (px, 0=不限)</label>
                        <input type="number" id="compress-max-w" min="0" value="0" style="width:100%">
                    </div>
                    <div class="control-group">
                        <label>最大高度 (px, 0=不限)</label>
                        <input type="number" id="compress-max-h" min="0" value="0" style="width:100%">
                    </div>
                </div>
                <div style="margin-top:12px">
                    <button class="btn btn-primary" id="compress-apply">应用到选中图片</button>
                </div>
            </div>
            <div id="compress-stats" class="stats-row hidden">
                <div class="stat-card">
                    <div class="stat-value" id="compress-stat-orig">0 B</div>
                    <div class="stat-label">原始总大小</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="compress-stat-comp">0 B</div>
                    <div class="stat-label">压缩后总大小</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="compress-stat-ratio">--</div>
                    <div class="stat-label">压缩率</div>
                </div>
            </div>
            <div id="compress-results" class="file-list hidden">
                <div class="file-list-header">
                    <span id="compress-result-count">压缩结果</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="compress-res-select-all">全选</button>
                        <button class="btn btn-sm" id="compress-res-invert">反选</button>
                        <button class="btn btn-primary btn-sm" id="compress-res-dl-selected">下载选中 (ZIP)</button>
                    </div>
                </div>
                <div class="file-list-view" id="compress-result-list"></div>
            </div>
            <div id="compress-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="compress-action-info"></span>
                </div>
                <div class="action-bar-right">
                </div>
            </div>
        `;

        // ---- DOM references ----
        const el = {
            upload: container.querySelector('#compress-upload'),
            filesSection: container.querySelector('#compress-files'),
            list: container.querySelector('#compress-list'),
            count: container.querySelector('#compress-count'),
            controls: container.querySelector('#compress-controls'),
            qualitySlider: container.querySelector('#compress-quality'),
            qualityVal: container.querySelector('#compress-quality-val'),
            formatSelect: container.querySelector('#compress-format'),
            maxW: container.querySelector('#compress-max-w'),
            maxH: container.querySelector('#compress-max-h'),
            btnApply: container.querySelector('#compress-apply'),
            btnSelectAll: container.querySelector('#compress-select-all'),
            btnInvert: container.querySelector('#compress-invert'),
            btnClear: container.querySelector('#compress-clear'),
            stats: container.querySelector('#compress-stats'),
            statOrig: container.querySelector('#compress-stat-orig'),
            statComp: container.querySelector('#compress-stat-comp'),
            statRatio: container.querySelector('#compress-stat-ratio'),
            resultsSection: container.querySelector('#compress-results'),
            resultList: container.querySelector('#compress-result-list'),
            resultCount: container.querySelector('#compress-result-count'),
            btnResSelectAll: container.querySelector('#compress-res-select-all'),
            btnResInvert: container.querySelector('#compress-res-invert'),
            btnResDlSelected: container.querySelector('#compress-res-dl-selected'),
            actions: container.querySelector('#compress-actions'),
            actionInfo: container.querySelector('#compress-action-info')
        };

        // ---- UI update helpers ----
        function updateCount() {
            el.count.textContent = `已选择 ${selection.count} 张图片 (共 ${selection.total} 张)`;
        }

        function updateStats() {
            let totalOrig = 0;
            let totalComp = 0;
            let compCount = 0;
            state.files.forEach(f => {
                totalOrig += f.size;
                if (f.compressedBlob) {
                    totalComp += f.compressedSize;
                    compCount++;
                }
            });
            el.statOrig.textContent = Utils.formatSize(totalOrig);
            el.statComp.textContent = compCount > 0 ? Utils.formatSize(totalComp) : '--';
            if (compCount > 0 && totalOrig > 0) {
                const ratio = ((1 - totalComp / totalOrig) * 100).toFixed(1);
                el.statRatio.textContent = `节省 ${ratio}%`;
            } else {
                el.statRatio.textContent = '--';
            }
            el.actionInfo.textContent = compCount > 0
                ? `已压缩 ${compCount} / ${state.files.length} 张`
                : '';
        }

        function showSections() {
            const hasFiles = state.files.length > 0;
            el.filesSection.classList.toggle('hidden', !hasFiles);
            el.controls.classList.toggle('hidden', !hasFiles);
            el.stats.classList.toggle('hidden', !hasFiles);
            el.actions.classList.toggle('hidden', !hasFiles);
        }

        // ---- Results selection state ----
        const resultSelection = new Set();

        // ---- Render results list with checkboxes and download buttons ----
        function renderResults() {
            const compressed = state.files.filter(f => f.compressedBlob);
            if (compressed.length === 0) {
                el.resultsSection.classList.add('hidden');
                return;
            }

            el.resultsSection.classList.remove('hidden');
            el.resultCount.textContent = `已压缩 ${compressed.length} 张图片`;
            el.resultList.innerHTML = '';

            // Init all selected
            if (resultSelection.size === 0) {
                compressed.forEach(item => resultSelection.add(item.id));
            }

            const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
            const ext = extMap[state.format] || 'jpg';

            compressed.forEach(item => {
                const baseName = Utils.getBaseName(item.name);
                const fileName = `${baseName}_compressed.${ext}`;
                const ratio = ((1 - item.compressedSize / item.size) * 100).toFixed(1);
                const checked = resultSelection.has(item.id);
                const row = document.createElement('div');
                row.className = 'file-list-row' + (checked ? ' selected' : '');
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${checked ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${item.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${fileName}</div>
                        <div class="file-list-row-meta">${Utils.formatSize(item.size)} → ${Utils.formatSize(item.compressedSize)} (节省 ${ratio}%)</div>
                    </div>
                    <button class="btn btn-sm btn-primary result-dl-btn">下载</button>
                `;
                row.querySelector('.file-cb').onchange = () => {
                    if (resultSelection.has(item.id)) {
                        resultSelection.delete(item.id);
                        row.classList.remove('selected');
                    } else {
                        resultSelection.add(item.id);
                        row.classList.add('selected');
                    }
                };
                row.querySelector('.result-dl-btn').onclick = () => {
                    Utils.downloadBlob(item.compressedBlob, fileName);
                };
                el.resultList.appendChild(row);
            });
        }

        // ---- Result selection buttons ----
        el.btnResSelectAll.onclick = () => {
            const compressed = state.files.filter(f => f.compressedBlob);
            compressed.forEach(item => resultSelection.add(item.id));
            renderResults();
        };

        el.btnResInvert.onclick = () => {
            const compressed = state.files.filter(f => f.compressedBlob);
            const newSet = new Set();
            compressed.forEach(item => {
                if (!resultSelection.has(item.id)) newSet.add(item.id);
            });
            resultSelection.clear();
            newSet.forEach(id => resultSelection.add(id));
            renderResults();
        };

        el.btnResDlSelected.onclick = async () => {
            const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
            const ext = extMap[state.format] || 'jpg';
            const selected = state.files.filter(f => f.compressedBlob && resultSelection.has(f.id));
            if (selected.length === 0) {
                Toast.warning('请先勾选要下载的文件');
                return;
            }
            const files = selected.map(item => ({
                name: `${Utils.getBaseName(item.name)}_compressed.${ext}`,
                blob: item.compressedBlob
            }));
            await batchDownload(files);
        };

        // ---- Render file list ----
        function renderFileList() {
            el.list.innerHTML = '';
            state.files.forEach(item => {
                const row = document.createElement('div');
                row.className = 'file-list-row' + (selection.isSelected(item.id) ? ' selected' : '');
                row.dataset.id = item.id;

                const ext = Utils.getExtension(item.name).toUpperCase();
                const compSizeText = item.compressedBlob ? Utils.formatSize(item.compressedSize) : '--';
                const compRatioText = item.compressedBlob
                    ? `(-${((1 - item.compressedSize / item.size) * 100).toFixed(1)}%)`
                    : '';

                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${selection.isSelected(item.id) ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${item.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${item.name}</div>
                        <div class="file-list-row-meta">
                            <span>${ext}</span>
                            <span>原始: ${Utils.formatSize(item.size)}</span>
                            <span>压缩后: ${compSizeText} ${compRatioText}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm file-download-btn" title="下载" ${item.compressedBlob ? '' : 'disabled'}>&#8615;</button>
                `;

                // Checkbox toggle
                row.querySelector('.file-cb').addEventListener('change', () => {
                    selection.toggle(item.id);
                    row.classList.toggle('selected', selection.isSelected(item.id));
                    row.querySelector('.file-cb').checked = selection.isSelected(item.id);
                    updateCount();
                    updateStats();
                });

                // Row click (not on checkbox or button) also toggles
                row.addEventListener('click', (e) => {
                    if (e.target.closest('.file-cb') || e.target.closest('.file-download-btn')) return;
                    selection.toggle(item.id);
                    row.classList.toggle('selected', selection.isSelected(item.id));
                    row.querySelector('.file-cb').checked = selection.isSelected(item.id);
                    updateCount();
                    updateStats();
                });

                // Individual download
                row.querySelector('.file-download-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!item.compressedBlob) return;
                    const baseName = Utils.getBaseName(item.name);
                    const extMap = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
                    const ext = extMap[state.format] || 'jpg';
                    Utils.downloadBlob(item.compressedBlob, `${baseName}_compressed.${ext}`);
                });

                el.list.appendChild(row);
            });
            updateCount();
            updateStats();
        }

        // ---- Compress a single file item ----
        async function compressItem(item) {
            const dataUrl = await Utils.readAsDataURL(item.file);
            const img = await Utils.loadImage(dataUrl);

            let w = img.naturalWidth;
            let h = img.naturalHeight;

            // Apply max width/height constraints (maintain aspect ratio)
            if (state.maxWidth > 0 && w > state.maxWidth) {
                h = Math.round(h * (state.maxWidth / w));
                w = state.maxWidth;
            }
            if (state.maxHeight > 0 && h > state.maxHeight) {
                w = Math.round(w * (state.maxHeight / h));
                h = state.maxHeight;
            }

            const canvas = Utils.imageToCanvas(img, w, h);
            const blob = await Utils.canvasToBlob(canvas, state.format, state.quality / 100);
            item.compressedBlob = blob;
            item.compressedSize = blob.size;
        }

        // ---- Upload ----
        FileUpload.createUploadArea(el.upload, {
            accept: 'image/*',
            multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式，支持批量上传',
            onFiles: async (files) => {
                const imageFiles = files.filter(f => f.type.startsWith('image/'));
                if (imageFiles.length === 0) {
                    Toast.warning('请选择图片文件');
                    return;
                }

                Loading.show('正在加载图片...');
                for (let i = 0; i < imageFiles.length; i++) {
                    const f = imageFiles[i];
                    Loading.progress(Math.round((i + 1) / imageFiles.length * 100));
                    Loading.setText(`正在加载 ${f.name}...`);
                    try {
                        const thumb = await Utils.createThumbnail(f);
                        state.files.push({
                            id: Utils.uid(),
                            file: f,
                            name: f.name,
                            size: f.size,
                            thumb: thumb,
                            compressedBlob: null,
                            compressedSize: 0
                        });
                    } catch (err) {
                        console.warn('Failed to load', f.name, err);
                    }
                }
                Loading.hide();

                selection.setItems(state.files);
                renderFileList();
                showSections();
                el.resultsSection.classList.add('hidden');
                resultSelection.clear();
                Toast.success(`已添加 ${imageFiles.length} 张图片`);
            }
        });

        // ---- Apply compression ----
        el.btnApply.addEventListener('click', async () => {
            const selected = selection.getSelected();
            if (selected.length === 0) {
                Toast.warning('请先选择要压缩的图片');
                return;
            }

            // Read current controls
            state.quality = parseInt(el.qualitySlider.value) || 80;
            state.format = el.formatSelect.value;
            state.maxWidth = parseInt(el.maxW.value) || 0;
            state.maxHeight = parseInt(el.maxH.value) || 0;

            Loading.show('正在压缩图片...');
            for (let i = 0; i < selected.length; i++) {
                Loading.progress(Math.round((i + 1) / selected.length * 100));
                Loading.setText(`正在压缩 ${selected[i].name}...`);
                try {
                    await compressItem(selected[i]);
                } catch (err) {
                    console.error('Compress failed:', selected[i].name, err);
                    Toast.error(`压缩失败: ${selected[i].name}`);
                }
            }
            Loading.hide();

            renderFileList();
            renderResults();
            Toast.success(`已压缩 ${selected.length} 张图片`);
        });

        // ---- Quality slider live update ----
        el.qualitySlider.addEventListener('input', () => {
            el.qualityVal.textContent = el.qualitySlider.value;
        });

        // ---- Selection buttons ----
        el.btnSelectAll.addEventListener('click', () => {
            selection.selectAll();
            renderFileList();
        });
        el.btnInvert.addEventListener('click', () => {
            selection.invertSelection();
            renderFileList();
        });
        el.btnClear.addEventListener('click', () => {
            selection.deselectAll();
            renderFileList();
        });

    },

    // =============================================
    // Convert Tool
    // =============================================
    renderConvert(container) {
        const state = {
            files: [],       // { id, file, name, size, thumb, origFormat, convertedBlob, convertedSize, status }
            format: 'image/png',
            quality: 92,
            maxWidth: 0,     // 0 = no limit
            maxHeight: 0
        };

        const selection = new SelectionManager();

        // ---- Build DOM ----
        container.innerHTML = `
            <div id="convert-upload"></div>
            <div id="convert-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="convert-count">已选择 0 张图片</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="convert-select-all">全选</button>
                        <button class="btn btn-sm" id="convert-invert">反选</button>
                        <button class="btn btn-sm" id="convert-clear">清空</button>
                    </div>
                </div>
                <div class="file-list-view" id="convert-list"></div>
            </div>
            <div id="convert-controls" class="controls-panel hidden">
                <h4>转换设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>输出格式</label>
                        <select id="convert-format">
                            <option value="image/png">PNG</option>
                            <option value="image/jpeg">JPEG</option>
                            <option value="image/webp">WebP</option>
                            <option value="image/avif">AVIF</option>
                            <option value="image/x-icon">ICO (图标)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>输出质量: <span id="convert-quality-val">92</span>%</label>
                        <input type="range" id="convert-quality" min="10" max="100" value="92">
                    </div>
                    <div class="control-group hidden" id="convert-ico-sizes">
                        <label>ICO 包含尺寸 (多选)</label>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px">
                            <label style="display:flex;align-items:center;gap:4px;font-weight:normal;cursor:pointer">
                                <input type="checkbox" class="ico-size-cb" value="16" checked> 16×16
                            </label>
                            <label style="display:flex;align-items:center;gap:4px;font-weight:normal;cursor:pointer">
                                <input type="checkbox" class="ico-size-cb" value="32" checked> 32×32
                            </label>
                            <label style="display:flex;align-items:center;gap:4px;font-weight:normal;cursor:pointer">
                                <input type="checkbox" class="ico-size-cb" value="48" checked> 48×48
                            </label>
                            <label style="display:flex;align-items:center;gap:4px;font-weight:normal;cursor:pointer">
                                <input type="checkbox" class="ico-size-cb" value="64"> 64×64
                            </label>
                            <label style="display:flex;align-items:center;gap:4px;font-weight:normal;cursor:pointer">
                                <input type="checkbox" class="ico-size-cb" value="128"> 128×128
                            </label>
                            <label style="display:flex;align-items:center;gap:4px;font-weight:normal;cursor:pointer">
                                <input type="checkbox" class="ico-size-cb" value="256"> 256×256
                            </label>
                        </div>
                        <p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0">每个尺寸会生成一份 PNG 嵌入 ICO 文件中</p>
                    </div>
                    <div class="control-group">
                        <label>最大宽度 (px, 0=不限)</label>
                        <input type="number" id="convert-max-w" min="0" value="0" style="width:100%">
                    </div>
                    <div class="control-group">
                        <label>最大高度 (px, 0=不限)</label>
                        <input type="number" id="convert-max-h" min="0" value="0" style="width:100%">
                    </div>
                </div>
                <div style="margin-top:12px">
                    <button class="btn btn-primary" id="convert-apply">转换选中图片</button>
                </div>
            </div>
            <div id="convert-results" class="file-list hidden">
                <div class="file-list-header">
                    <span id="convert-result-count">转换结果</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="convert-res-select-all">全选</button>
                        <button class="btn btn-sm" id="convert-res-invert">反选</button>
                        <button class="btn btn-primary btn-sm" id="convert-res-dl-selected">下载选中 (ZIP)</button>
                    </div>
                </div>
                <div class="file-list-view" id="convert-result-list"></div>
            </div>
            <div id="convert-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="convert-action-info"></span>
                </div>
                <div class="action-bar-right">
                </div>
            </div>
        `;

        // ---- DOM references ----
        const el = {
            upload: container.querySelector('#convert-upload'),
            filesSection: container.querySelector('#convert-files'),
            list: container.querySelector('#convert-list'),
            count: container.querySelector('#convert-count'),
            controls: container.querySelector('#convert-controls'),
            formatSelect: container.querySelector('#convert-format'),
            icoSizesWrap: container.querySelector('#convert-ico-sizes'),
            qualitySlider: container.querySelector('#convert-quality'),
            qualityVal: container.querySelector('#convert-quality-val'),
            maxW: container.querySelector('#convert-max-w'),
            maxH: container.querySelector('#convert-max-h'),
            btnApply: container.querySelector('#convert-apply'),
            btnSelectAll: container.querySelector('#convert-select-all'),
            btnInvert: container.querySelector('#convert-invert'),
            btnClear: container.querySelector('#convert-clear'),
            resultsSection: container.querySelector('#convert-results'),
            resultList: container.querySelector('#convert-result-list'),
            resultCount: container.querySelector('#convert-result-count'),
            btnResSelectAll: container.querySelector('#convert-res-select-all'),
            btnResInvert: container.querySelector('#convert-res-invert'),
            btnResDlSelected: container.querySelector('#convert-res-dl-selected'),
            actions: container.querySelector('#convert-actions'),
            actionInfo: container.querySelector('#convert-action-info')
        };

        // ---- Helper: get MIME type label ----
        function getMimeLabel(mime) {
            const map = {
                'image/png': 'PNG',
                'image/jpeg': 'JPEG',
                'image/webp': 'WebP',
                'image/gif': 'GIF',
                'image/avif': 'AVIF',
                'image/bmp': 'BMP',
                'image/svg+xml': 'SVG',
                'image/x-icon': 'ICO'
            };
            return map[mime] || mime.split('/')[1]?.toUpperCase() || '未知';
        }

        // ---- UI update helpers ----
        function updateCount() {
            el.count.textContent = `已选择 ${selection.count} 张图片 (共 ${selection.total} 张)`;
        }

        function updateActionInfo() {
            const converted = state.files.filter(f => f.convertedBlob).length;
            el.actionInfo.textContent = converted > 0
                ? `已转换 ${converted} / ${state.files.length} 张`
                : '';
        }

        function showSections() {
            const hasFiles = state.files.length > 0;
            el.filesSection.classList.toggle('hidden', !hasFiles);
            el.controls.classList.toggle('hidden', !hasFiles);
            el.actions.classList.toggle('hidden', !hasFiles);
        }

        // ---- Helper: get output extension ----
        function getOutputExt() {
            const extMap = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif', 'image/x-icon': 'ico' };
            return extMap[state.format] || 'png';
        }

        // ---- Results selection state ----
        const resultSelection = new Set();

        // ---- Render results list with checkboxes and download buttons ----
        function renderResults() {
            const converted = state.files.filter(f => f.convertedBlob);
            if (converted.length === 0) {
                el.resultsSection.classList.add('hidden');
                return;
            }

            el.resultsSection.classList.remove('hidden');
            el.resultCount.textContent = `已转换 ${converted.length} 张图片`;
            el.resultList.innerHTML = '';

            // Init all selected
            if (resultSelection.size === 0) {
                converted.forEach(item => resultSelection.add(item.id));
            }

            const ext = getOutputExt();

            converted.forEach(item => {
                const baseName = Utils.getBaseName(item.name);
                const fileName = `${baseName}.${ext}`;
                const checked = resultSelection.has(item.id);
                const row = document.createElement('div');
                row.className = 'file-list-row' + (checked ? ' selected' : '');
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${checked ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${item.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${fileName}</div>
                        <div class="file-list-row-meta">${getMimeLabel(item.origFormat)} → ${ext.toUpperCase()} · ${Utils.formatSize(item.size)} → ${Utils.formatSize(item.convertedSize)}</div>
                    </div>
                    <button class="btn btn-sm btn-primary result-dl-btn">下载</button>
                `;
                row.querySelector('.file-cb').onchange = () => {
                    if (resultSelection.has(item.id)) {
                        resultSelection.delete(item.id);
                        row.classList.remove('selected');
                    } else {
                        resultSelection.add(item.id);
                        row.classList.add('selected');
                    }
                };
                row.querySelector('.result-dl-btn').onclick = () => {
                    Utils.downloadBlob(item.convertedBlob, fileName);
                };
                el.resultList.appendChild(row);
            });
        }

        // ---- Result selection buttons ----
        el.btnResSelectAll.onclick = () => {
            const converted = state.files.filter(f => f.convertedBlob);
            converted.forEach(item => resultSelection.add(item.id));
            renderResults();
        };

        el.btnResInvert.onclick = () => {
            const converted = state.files.filter(f => f.convertedBlob);
            const newSet = new Set();
            converted.forEach(item => {
                if (!resultSelection.has(item.id)) newSet.add(item.id);
            });
            resultSelection.clear();
            newSet.forEach(id => resultSelection.add(id));
            renderResults();
        };

        el.btnResDlSelected.onclick = async () => {
            const ext = getOutputExt();
            const selected = state.files.filter(f => f.convertedBlob && resultSelection.has(f.id));
            if (selected.length === 0) {
                Toast.warning('请先勾选要下载的文件');
                return;
            }
            const files = selected.map(item => ({
                name: `${Utils.getBaseName(item.name)}.${ext}`,
                blob: item.convertedBlob
            }));
            await batchDownload(files);
        };

        // ---- Render file list ----
        function renderFileList() {
            el.list.innerHTML = '';
            state.files.forEach(item => {
                const row = document.createElement('div');
                row.className = 'file-list-row' + (selection.isSelected(item.id) ? ' selected' : '');
                row.dataset.id = item.id;

                const origFormat = getMimeLabel(item.origFormat);
                const statusText = item.status === 'converting' ? '转换中...'
                    : item.status === 'done' ? `已转换 (${Utils.formatSize(item.convertedSize)})`
                    : item.status === 'error' ? '转换失败'
                    : '待转换';

                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${selection.isSelected(item.id) ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${item.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${item.name}</div>
                        <div class="file-list-row-meta">
                            <span>${origFormat}</span>
                            <span>原始: ${Utils.formatSize(item.size)}</span>
                            <span>${statusText}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm file-download-btn" title="下载" ${item.convertedBlob ? '' : 'disabled'}>&#8615;</button>
                `;

                // Checkbox toggle
                row.querySelector('.file-cb').addEventListener('change', () => {
                    selection.toggle(item.id);
                    row.classList.toggle('selected', selection.isSelected(item.id));
                    row.querySelector('.file-cb').checked = selection.isSelected(item.id);
                    updateCount();
                });

                // Row click (not on checkbox or button) also toggles
                row.addEventListener('click', (e) => {
                    if (e.target.closest('.file-cb') || e.target.closest('.file-download-btn')) return;
                    selection.toggle(item.id);
                    row.classList.toggle('selected', selection.isSelected(item.id));
                    row.querySelector('.file-cb').checked = selection.isSelected(item.id);
                    updateCount();
                });

                // Individual download
                row.querySelector('.file-download-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!item.convertedBlob) return;
                    const baseName = Utils.getBaseName(item.name);
                    const ext = getOutputExt();
                    Utils.downloadBlob(item.convertedBlob, `${baseName}.${ext}`);
                });

                el.list.appendChild(row);
            });
            updateCount();
            updateActionInfo();
        }

        // ---- Build ICO blob from multiple PNG sizes ----
        async function buildIcoBlob(img, sizes) {
            const pngDataArrays = [];
            for (const size of sizes) {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);
                const pngBlob = await Utils.canvasToBlob(canvas, 'image/png');
                const buf = await pngBlob.arrayBuffer();
                pngDataArrays.push(new Uint8Array(buf));
            }

            const headerSize = 6;
            const dirEntrySize = 16;
            const dataOffset = headerSize + dirEntrySize * pngDataArrays.length;

            let totalSize = dataOffset;
            for (const d of pngDataArrays) totalSize += d.length;

            const buf = new ArrayBuffer(totalSize);
            const view = new DataView(buf);
            const bytes = new Uint8Array(buf);

            // ICO header
            view.setUint16(0, 0, true);       // reserved
            view.setUint16(2, 1, true);       // type: 1 = ICO
            view.setUint16(4, pngDataArrays.length, true); // image count

            let offset = dataOffset;
            for (let i = 0; i < pngDataArrays.length; i++) {
                const pos = headerSize + i * dirEntrySize;
                const dim = sizes[i] >= 256 ? 0 : sizes[i];
                view.setUint8(pos, dim);           // width
                view.setUint8(pos + 1, dim);       // height
                view.setUint8(pos + 2, 0);         // color palette
                view.setUint8(pos + 3, 0);         // reserved
                view.setUint16(pos + 4, 1, true);  // color planes
                view.setUint16(pos + 6, 32, true); // bits per pixel
                view.setUint32(pos + 8, pngDataArrays[i].length, true); // data size
                view.setUint32(pos + 12, offset, true);                 // data offset
                bytes.set(pngDataArrays[i], offset);
                offset += pngDataArrays[i].length;
            }

            return new Blob([buf], { type: 'image/x-icon' });
        }

        // ---- Convert a single file item ----
        async function convertItem(item) {
            item.status = 'converting';
            renderFileList();

            const dataUrl = await Utils.readAsDataURL(item.file);
            const img = await Utils.loadImage(dataUrl);

            let blob;

            if (state.format === 'image/x-icon') {
                // ICO: build multi-size ICO from selected sizes
                const sizeCbs = container.querySelectorAll('.ico-size-cb:checked');
                const sizes = Array.from(sizeCbs).map(cb => parseInt(cb.value, 10)).sort((a, b) => a - b);
                if (sizes.length === 0) {
                    Toast.warning('请至少选择一个 ICO 尺寸');
                    item.status = 'error';
                    return;
                }
                blob = await buildIcoBlob(img, sizes);
            } else {
                let w = img.naturalWidth;
                let h = img.naturalHeight;

                // Apply max width/height constraints (maintain aspect ratio)
                if (state.maxWidth > 0 && w > state.maxWidth) {
                    h = Math.round(h * (state.maxWidth / w));
                    w = state.maxWidth;
                }
                if (state.maxHeight > 0 && h > state.maxHeight) {
                    w = Math.round(w * (state.maxHeight / h));
                    h = state.maxHeight;
                }

                const canvas = Utils.imageToCanvas(img, w, h);
                blob = await Utils.canvasToBlob(canvas, state.format, state.quality / 100);
            }

            item.convertedBlob = blob;
            item.convertedSize = blob.size;
            item.status = 'done';
        }

        // ---- Upload ----
        FileUpload.createUploadArea(el.upload, {
            accept: 'image/*',
            multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式，支持批量上传',
            onFiles: async (files) => {
                const imageFiles = files.filter(f => f.type.startsWith('image/'));
                if (imageFiles.length === 0) {
                    Toast.warning('请选择图片文件');
                    return;
                }

                Loading.show('正在加载图片...');
                for (let i = 0; i < imageFiles.length; i++) {
                    const f = imageFiles[i];
                    Loading.progress(Math.round((i + 1) / imageFiles.length * 100));
                    Loading.setText(`正在加载 ${f.name}...`);
                    try {
                        const thumb = await Utils.createThumbnail(f);
                        state.files.push({
                            id: Utils.uid(),
                            file: f,
                            name: f.name,
                            size: f.size,
                            thumb: thumb,
                            origFormat: f.type,
                            convertedBlob: null,
                            convertedSize: 0,
                            status: 'pending'
                        });
                    } catch (err) {
                        console.warn('Failed to load', f.name, err);
                    }
                }
                Loading.hide();

                selection.setItems(state.files);
                renderFileList();
                showSections();
                el.resultsSection.classList.add('hidden');
                resultSelection.clear();
                Toast.success(`已添加 ${imageFiles.length} 张图片`);
            }
        });

        // ---- Apply conversion ----
        el.btnApply.addEventListener('click', async () => {
            const selected = selection.getSelected();
            if (selected.length === 0) {
                Toast.warning('请先选择要转换的图片');
                return;
            }

            // Read current controls
            state.format = el.formatSelect.value;
            state.quality = parseInt(el.qualitySlider.value) || 92;
            state.maxWidth = parseInt(el.maxW.value) || 0;
            state.maxHeight = parseInt(el.maxH.value) || 0;

            Loading.show('正在转换图片...');
            for (let i = 0; i < selected.length; i++) {
                Loading.progress(Math.round((i + 1) / selected.length * 100));
                Loading.setText(`正在转换 ${selected[i].name}...`);
                try {
                    await convertItem(selected[i]);
                } catch (err) {
                    console.error('Convert failed:', selected[i].name, err);
                    selected[i].status = 'error';
                    Toast.error(`转换失败: ${selected[i].name}`);
                }
            }
            Loading.hide();

            renderFileList();
            renderResults();
            Toast.success(`已转换 ${selected.length} 张图片`);
        });

        // ---- Quality slider live update ----
        el.qualitySlider.addEventListener('input', () => {
            el.qualityVal.textContent = el.qualitySlider.value;
        });

        // ---- Format change: show/hide ICO sizes ----
        el.formatSelect.addEventListener('change', () => {
            el.icoSizesWrap.classList.toggle('hidden', el.formatSelect.value !== 'image/x-icon');
        });

        // ---- Selection buttons ----
        el.btnSelectAll.addEventListener('click', () => {
            selection.selectAll();
            renderFileList();
        });
        el.btnInvert.addEventListener('click', () => {
            selection.invertSelection();
            renderFileList();
        });
        el.btnClear.addEventListener('click', () => {
            selection.deselectAll();
            renderFileList();
        });

    },

    // =============================================
    // =============================================
    // Resize Tool — Single / Batch
    // =============================================
    renderResize(container) {
        const state = {
            files: [],
            mode: 'single',     // 'single' | 'batch'
            scaleMode: 'proportional',  // 'proportional' | 'free'
            keepRatio: true,
            targetWidth: 0,
            targetHeight: 0,
            format: 'image/png',
            quality: 92,
            activeId: null,
            previewCanvases: []   // batch mode: { id, canvas, img }
        };

        const selection = new SelectionManager();

        container.innerHTML = `
            <div id="resize-upload"></div>
            <div id="resize-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="resize-count">已选择 0 张图片</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="resize-select-all">全选</button>
                        <button class="btn btn-sm" id="resize-invert">反选</button>
                        <button class="btn btn-sm" id="resize-clear">清空</button>
                    </div>
                </div>
                <div class="file-list-view" id="resize-list"></div>
            </div>
            <div id="resize-controls" class="controls-panel hidden">
                <h4>像素调整设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>调整模式</label>
                        <div class="layout-options" id="resize-batch-mode">
                            <div class="layout-option active" data-mode="single">单张调整</div>
                            <div class="layout-option" data-mode="batch">批量调整</div>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>缩放模式</label>
                        <div class="layout-options" id="resize-mode-options">
                            <div class="layout-option active" data-mode="proportional">等比缩放</div>
                            <div class="layout-option" data-mode="free">自由缩放</div>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>宽度 (px)</label>
                        <input type="number" id="resize-width" min="1" max="10000" placeholder="输入宽度">
                    </div>
                    <div class="control-group">
                        <label>高度 (px)</label>
                        <input type="number" id="resize-height" min="1" max="10000" placeholder="输入高度">
                    </div>
                    <div class="control-group" id="resize-lock-group">
                        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                            <input type="checkbox" id="resize-lock-ratio" checked> 锁定宽高比
                        </label>
                    </div>
                    <div class="control-group">
                        <label>输出格式</label>
                        <select id="resize-format">
                            <option value="image/png">PNG</option>
                            <option value="image/jpeg">JPEG</option>
                            <option value="image/webp">WebP</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>输出质量: <span id="resize-quality-val">92</span>%</label>
                        <input type="range" id="resize-quality" min="10" max="100" value="92">
                    </div>
                </div>
                <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-sm" id="resize-preset-50">50%</button>
                    <button class="btn btn-sm" id="resize-preset-orig">原始</button>
                    <button class="btn btn-sm" id="resize-preset-1080">1080p</button>
                    <button class="btn btn-sm" id="resize-preset-720">720p</button>
                    <button class="btn btn-sm" id="resize-preset-square">方形</button>
                </div>
            </div>
            <div id="resize-preview" class="preview-area hidden">
                <h4>预览 <span style="font-weight:normal;font-size:12px;color:var(--text-secondary)" id="resize-preview-hint"></span></h4>
                <!-- Single mode -->
                <div id="resize-single-preview" class="preview-canvas-wrap">
                    <canvas id="resize-canvas"></canvas>
                    <div style="text-align:center;margin-top:4px;color:var(--text-secondary);font-size:13px">
                        <span id="resize-preview-name"></span><br>
                        调整后: <span id="resize-target-info">--</span>
                    </div>
                </div>
                <!-- Batch mode -->
                <div id="resize-batch-preview" class="hidden" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center"></div>
            </div>
            <div id="resize-actions" class="action-bar hidden">
                <div class="action-bar-left"><span id="resize-action-info"></span></div>
                <div class="action-bar-right">
                    <button class="btn" id="resize-download-orig">批量下载原图</button>
                    <button class="btn btn-primary" id="resize-process">开始处理</button>
                </div>
            </div>
            <div id="resize-results" class="file-list hidden">
                <div class="file-list-header">
                    <span id="resize-result-count">处理结果</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="resize-res-select-all">全选</button>
                        <button class="btn btn-sm" id="resize-res-invert">反选</button>
                        <button class="btn btn-primary btn-sm" id="resize-res-dl-selected">下载选中 (ZIP)</button>
                    </div>
                </div>
                <div class="file-list-view" id="resize-result-list"></div>
            </div>
        `;

        const el = {
            upload: container.querySelector('#resize-upload'),
            filesSection: container.querySelector('#resize-files'),
            list: container.querySelector('#resize-list'),
            count: container.querySelector('#resize-count'),
            controls: container.querySelector('#resize-controls'),
            batchModeOpts: container.querySelector('#resize-batch-mode'),
            modeOptions: container.querySelector('#resize-mode-options'),
            widthInput: container.querySelector('#resize-width'),
            heightInput: container.querySelector('#resize-height'),
            lockGroup: container.querySelector('#resize-lock-group'),
            lockRatio: container.querySelector('#resize-lock-ratio'),
            formatSelect: container.querySelector('#resize-format'),
            qualitySlider: container.querySelector('#resize-quality'),
            qualityVal: container.querySelector('#resize-quality-val'),
            preview: container.querySelector('#resize-preview'),
            previewHint: container.querySelector('#resize-preview-hint'),
            singlePreview: container.querySelector('#resize-single-preview'),
            canvas: container.querySelector('#resize-canvas'),
            previewName: container.querySelector('#resize-preview-name'),
            targetInfo: container.querySelector('#resize-target-info'),
            batchPreview: container.querySelector('#resize-batch-preview'),
            actions: container.querySelector('#resize-actions'),
            actionInfo: container.querySelector('#resize-action-info'),
            btnProcess: container.querySelector('#resize-process'),
            results: container.querySelector('#resize-results'),
            resultList: container.querySelector('#resize-result-list'),
            resultCount: container.querySelector('#resize-result-count')
        };

        function showSections() {
            const has = state.files.length > 0;
            el.filesSection.classList.toggle('hidden', !has);
            el.controls.classList.toggle('hidden', !has);
            el.preview.classList.toggle('hidden', !has);
            el.actions.classList.toggle('hidden', !has);
        }

        function updateCount() {
            el.count.textContent = `已选择 ${selection.count} 张图片 (共 ${selection.total} 张)`;
            el.actionInfo.textContent = `${selection.count} 张图片已选中`;
        }

        function getActive() {
            if (state.activeId) { const f = state.files.find(f => f.id === state.activeId); if (f) return f; }
            const sel = selection.getSelected();
            return sel.length > 0 ? sel[0] : (state.files.length > 0 ? state.files[0] : null);
        }

        function getTargetSize(item) {
            if (!item) return { w: 0, h: 0 };
            const tw = state.targetWidth || item.origWidth;
            const th = state.targetHeight || item.origHeight;
            if (state.scaleMode === 'proportional' || (state.scaleMode === 'free' && state.keepRatio)) {
                const aspect = item.origWidth / item.origHeight;
                const refAspect = getActive();
                if (refAspect && refAspect !== item) {
                    // Scale proportionally relative to active
                    const scaleFactor = Math.min(item.origWidth / refAspect.origWidth, item.origHeight / refAspect.origHeight);
                    return { w: Math.round(tw * scaleFactor), h: Math.round(th * scaleFactor) };
                }
            }
            return { w: tw, h: th };
        }

        function updateSinglePreview() {
            const active = getActive();
            if (!active) return;
            const { w, h } = getTargetSize(active);
            el.canvas.width = w; el.canvas.height = h;
            const ctx = el.canvas.getContext('2d');
            ctx.drawImage(active.img, 0, 0, w, h);
            el.targetInfo.textContent = `${w} × ${h} px`;
            el.previewName.textContent = active.name;
        }

        function updateTargetSize(fromWidth) {
            const active = getActive();
            if (!active) return;
            const aspect = active.origWidth / active.origHeight;
            if (state.scaleMode === 'free') {
                state.targetWidth = parseInt(el.widthInput.value) || active.origWidth;
                state.targetHeight = parseInt(el.heightInput.value) || active.origHeight;
                state.keepRatio = el.lockRatio.checked;
                if (state.keepRatio && fromWidth === 'width') { state.targetHeight = Math.round(state.targetWidth / aspect); el.heightInput.value = state.targetHeight; }
                else if (state.keepRatio && fromWidth === 'height') { state.targetWidth = Math.round(state.targetHeight * aspect); el.widthInput.value = state.targetWidth; }
            } else {
                if (fromWidth === 'width') { state.targetWidth = parseInt(el.widthInput.value) || active.origWidth; state.targetHeight = Math.round(state.targetWidth / aspect); el.heightInput.value = state.targetHeight; }
                else { state.targetHeight = parseInt(el.heightInput.value) || active.origHeight; state.targetWidth = Math.round(state.targetHeight * aspect); el.widthInput.value = state.targetWidth; }
            }
            refreshPreview();
        }

        function setInputs(item) {
            el.widthInput.value = state.targetWidth || item.origWidth;
            el.heightInput.value = state.targetHeight || item.origHeight;
            refreshPreview();
        }

        // ---- Batch preview grid ----
        async function buildBatchPreviews() {
            el.batchPreview.innerHTML = '';
            state.previewCanvases = [];
            if (state.files.length === 0) return;
            const maxDim = Math.min(240, Math.floor((container.clientWidth - 48) / Math.max(1, Math.min(state.files.length, 3))));
            for (const item of state.files) {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';
                const cv = document.createElement('canvas');
                cv.style.cssText = 'max-width:100%;border-radius:6px;border:2px solid var(--border)';
                const label = document.createElement('span');
                label.style.cssText = 'font-size:11px;color:var(--text-secondary);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
                wrap.appendChild(cv); wrap.appendChild(label);
                el.batchPreview.appendChild(wrap);
                const { w, h } = getTargetSize(item);
                const scale = Math.min(maxDim / w, maxDim / h, 1);
                cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
                const ctx = cv.getContext('2d');
                ctx.drawImage(item.img, 0, 0, cv.width, cv.height);
                label.textContent = `${item.name} (${w}×${h})`;
                state.previewCanvases.push({ id: item.id, canvas: cv, img: item.img, item });
            }
        }

        function refreshBatchPreviews() {
            state.previewCanvases.forEach(pc => {
                const { w, h } = getTargetSize(pc.item);
                const maxDim = 240;
                const scale = Math.min(maxDim / w, maxDim / h, 1);
                pc.canvas.width = Math.round(w * scale);
                pc.canvas.height = Math.round(h * scale);
                const ctx = pc.canvas.getContext('2d');
                ctx.drawImage(pc.img, 0, 0, pc.canvas.width, pc.canvas.height);
                const label = pc.canvas.parentElement.querySelector('span');
                if (label) label.textContent = `${pc.item.name} (${w}×${h})`;
            });
        }

        function refreshPreview() {
            if (state.mode === 'batch') {
                if (state.previewCanvases.length === 0) buildBatchPreviews().then(() => {});
                else refreshBatchPreviews();
            } else {
                updateSinglePreview();
            }
        }

        // ---- Render file list ----
        function renderFileList() {
            el.list.innerHTML = '';
            state.files.forEach(item => {
                const isActive = state.activeId === item.id;
                const row = document.createElement('div');
                row.className = 'file-list-row' + (selection.isSelected(item.id) ? ' selected' : '') + (isActive ? ' preview-active' : '');
                row.dataset.id = item.id;
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${selection.isSelected(item.id) ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${item.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${item.name}${isActive ? ' <span style="font-size:11px;color:var(--warning)">👁</span>' : ''}</div>
                        <div class="file-list-row-meta">${item.origWidth}×${item.origHeight} · ${Utils.formatSize(item.size)}</div>
                    </div>
                `;
                row.querySelector('.file-cb').addEventListener('change', () => {
                    selection.toggle(item.id); row.classList.toggle('selected', selection.isSelected(item.id));
                    row.querySelector('.file-cb').checked = selection.isSelected(item.id); updateCount();
                });
                row.addEventListener('click', (e) => {
                    if (e.target.closest('.file-cb')) return;
                    state.activeId = item.id;
                    state.targetWidth = item.origWidth; state.targetHeight = item.origHeight;
                    setInputs(item); renderFileList();
                });
                el.list.appendChild(row);
            });
            updateCount();
        }

        // ---- Upload ----
        FileUpload.createUploadArea(el.upload, {
            accept: 'image/*', multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式，支持批量上传',
            onFiles: async (newFiles) => {
                const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
                if (!imageFiles.length) { Toast.warning('请选择图片文件'); return; }
                Loading.show('正在加载图片...');
                for (let i = 0; i < imageFiles.length; i++) {
                    const f = imageFiles[i];
                    try {
                        const thumb = await Utils.createThumbnail(f);
                        const dataUrl = await Utils.readAsDataURL(f);
                        const img = await Utils.loadImage(dataUrl);
                        const item = { id: Utils.uid(), file: f, name: f.name, size: f.size, thumb, img, dataUrl, origWidth: img.naturalWidth, origHeight: img.naturalHeight };
                        state.files.push(item);
                        if (!state.activeId) { state.activeId = item.id; state.targetWidth = item.origWidth; state.targetHeight = item.origHeight; }
                    } catch (e) { console.error('Failed:', f.name, e); }
                    Loading.progress(Math.round((i + 1) / imageFiles.length * 100));
                }
                Loading.hide();
                selection.setItems(state.files); renderFileList(); showSections();
                setInputs(getActive());
                Toast.success(`已添加 ${imageFiles.length} 张图片`);
            }
        });

        // Selection buttons
        container.querySelector('#resize-select-all').onclick = () => { selection.selectAll(); renderFileList(); };
        container.querySelector('#resize-invert').onclick = () => { selection.invertSelection(); renderFileList(); };
        container.querySelector('#resize-clear').onclick = () => { state.files = []; selection.setItems([]); state.activeId = null; state.previewCanvases = []; el.batchPreview.innerHTML = ''; renderFileList(); showSections(); };

        // Batch mode toggle
        el.batchModeOpts.querySelectorAll('.layout-option').forEach(opt => {
            opt.addEventListener('click', () => {
                el.batchModeOpts.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.mode = opt.dataset.mode;
                el.singlePreview.classList.toggle('hidden', state.mode !== 'single');
                el.batchPreview.classList.toggle('hidden', state.mode !== 'batch');
                el.previewHint.textContent = state.mode === 'batch' ? '— 调整参数应用到所有图片' : '';
                if (state.mode === 'batch') buildBatchPreviews();
                else updateSinglePreview();
            });
        });

        // Scale mode toggle
        el.modeOptions.querySelectorAll('.layout-option').forEach(opt => {
            opt.addEventListener('click', () => {
                el.modeOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.scaleMode = opt.dataset.mode;
                if (state.scaleMode === 'proportional') { el.lockGroup.style.display = 'none'; el.heightInput.readOnly = true; el.heightInput.style.opacity = '0.6'; }
                else { el.lockGroup.style.display = 'block'; el.heightInput.readOnly = false; el.widthInput.style.opacity = '1'; el.heightInput.style.opacity = '1'; }
                const a = getActive(); if (a) { state.targetWidth = a.origWidth; state.targetHeight = a.origHeight; setInputs(a); }
            });
        });

        el.widthInput.addEventListener('input', () => updateTargetSize('width'));
        el.heightInput.addEventListener('input', () => updateTargetSize('height'));
        el.lockRatio.addEventListener('change', () => { if (el.lockRatio.checked) updateTargetSize('width'); });
        el.qualitySlider.addEventListener('input', () => { el.qualityVal.textContent = el.qualitySlider.value; });

        // Presets
        container.querySelector('#resize-preset-50').addEventListener('click', () => { const a = getActive(); if (!a) return; el.widthInput.value = Math.round(a.origWidth * 0.5); updateTargetSize('width'); });
        container.querySelector('#resize-preset-orig').addEventListener('click', () => { const a = getActive(); if (!a) return; el.widthInput.value = a.origWidth; updateTargetSize('width'); });
        container.querySelector('#resize-preset-1080').addEventListener('click', () => { const a = getActive(); if (!a) return; el.widthInput.value = 1920; updateTargetSize('width'); });
        container.querySelector('#resize-preset-720').addEventListener('click', () => { const a = getActive(); if (!a) return; el.widthInput.value = 1280; updateTargetSize('width'); });
        container.querySelector('#resize-preset-square').addEventListener('click', () => {
            const a = getActive(); if (!a) return;
            const side = Math.min(a.origWidth, a.origHeight);
            state.scaleMode = 'free';
            el.modeOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
            el.modeOptions.querySelector('[data-mode="free"]').classList.add('active');
            el.lockGroup.style.display = 'block'; el.heightInput.readOnly = false;
            el.widthInput.style.opacity = '1'; el.heightInput.style.opacity = '1';
            el.widthInput.value = side; el.heightInput.value = side;
            state.targetWidth = side; state.targetHeight = side;
            refreshPreview();
        });

        // ---- Resize helper ----
        async function resizeOneImage(item) {
            if (!item.img) { item.dataUrl = await Utils.readAsDataURL(item.file); item.img = await Utils.loadImage(item.dataUrl); }
            const format = el.formatSelect.value;
            const quality = parseInt(el.qualitySlider.value) / 100;
            const { w, h } = getTargetSize(item);
            const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
            cv.getContext('2d').drawImage(item.img, 0, 0, w, h);
            const name = `${Utils.getBaseName(item.name)}_${w}x${h}${({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' })[format] || '.png'}`;
            const blob = await Utils.canvasToBlob(cv, format, quality);
            return { blob, name };
        }

        state.resizeResults = [];
        const resizeResultSel = new Set();

        function renderResizeResults() {
            el.results.classList.toggle('hidden', !state.resizeResults.length);
            el.resultCount.textContent = `已处理 ${state.resizeResults.length} 张图片`;
            el.resultList.innerHTML = '';
            state.resizeResults.forEach(r => {
                const checked = resizeResultSel.has(r.id);
                const row = document.createElement('div');
                row.className = 'file-list-row' + (checked ? ' selected' : '');
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${checked ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${r.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${r.name}</div>
                        <div class="file-list-row-meta">${Utils.formatSize(r.size)}</div>
                    </div>
                    <button class="btn btn-sm btn-primary result-dl-btn">下载</button>
                `;
                row.querySelector('.file-cb').onchange = () => {
                    if (resizeResultSel.has(r.id)) resizeResultSel.delete(r.id); else resizeResultSel.add(r.id);
                    row.classList.toggle('selected', resizeResultSel.has(r.id));
                };
                row.querySelector('.result-dl-btn').onclick = () => Utils.downloadBlob(r.blob, r.name);
                el.resultList.appendChild(row);
            });
        }

        // ---- Process ----
        el.btnProcess.addEventListener('click', async () => {
            const selected = selection.getSelected();
            if (!selected.length) { Toast.warning('请先选择图片'); return; }
            Loading.show('正在调整尺寸...');
            state.resizeResults = [];
            for (let i = 0; i < selected.length; i++) {
                Loading.progress(Math.round((i + 1) / selected.length * 100));
                Loading.setText(`正在处理 ${selected[i].name}...`);
                try {
                    const { blob, name } = await resizeOneImage(selected[i]);
                    const thumb = await Utils.createThumbnail(new File([blob], name, { type: 'image/png' }));
                    state.resizeResults.push({ id: Utils.uid(), blob, name, size: blob.size, thumb });
                } catch (err) { console.error('Failed:', selected[i].name, err); Toast.error(`处理失败: ${selected[i].name}`); }
            }
            Loading.hide();
            if (!state.resizeResults.length) { Toast.warning('没有成功处理的图片'); return; }
            resizeResultSel.clear(); state.resizeResults.forEach(r => resizeResultSel.add(r.id));
            renderResizeResults();
            Toast.success(`已处理 ${state.resizeResults.length} 张图片`);
        });

        container.querySelector('#resize-res-select-all').onclick = () => { state.resizeResults.forEach(r => resizeResultSel.add(r.id)); renderResizeResults(); };
        container.querySelector('#resize-res-invert').onclick = () => { const s = new Set(state.resizeResults.filter(r => !resizeResultSel.has(r.id)).map(r => r.id)); resizeResultSel.clear(); s.forEach(id => resizeResultSel.add(id)); renderResizeResults(); };
        container.querySelector('#resize-res-dl-selected').onclick = async () => {
            const selected = state.resizeResults.filter(r => resizeResultSel.has(r.id));
            if (!selected.length) { Toast.warning('请先勾选要下载的文件'); return; }
            await batchDownload(selected.map(r => ({ blob: r.blob, name: r.name })), `像素调整_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`);
        };

        container.querySelector('#resize-download-orig').onclick = async () => {
            const selected = selection.getSelected();
            if (!selected.length) { Toast.warning('请先选择图片'); return; }
            await batchDownload(selected.map(i => ({ blob: i.file, name: i.name })), `原图_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`);
        };
    },
    // Watermark Tool
    // =============================================
    _wmAbortController: null,

    renderWatermark(container) {
        if (this._wmAbortController) { this._wmAbortController.abort(); }
        const wmAbort = new AbortController();
        this._wmAbortController = wmAbort;
        const signal = wmAbort.signal;

        const FONT_LIST = [
            'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
            'Courier New', 'Impact', 'Comic Sans MS', 'Trebuchet MS',
            '微软雅黑', '宋体', '黑体', '楷体', '仿宋', '思源黑体', '思源宋体'
        ];

        const state = {
            files: [],
            watermarkType: 'text',
            text: '', fontSize: 48, fontFamily: 'Arial', letterSpacing: 0,
            fontWeight: 'normal', textOpacity: 0.5, textColor: '#000000',
            watermarkImg: null, watermarkImgDataUrl: null, imageOpacity: 0.5,
            mode: 'single',
            // Ratios (0-1) relative to image dimensions — shared across all previews
            wmRatioX: 0.5, wmRatioY: 0.5, wmRatioW: 0.25, wmRatioH: 0.25,
            tileSpacing: 150, tileAngle: -30, tileScale: 0.12,
            dragging: false, resizing: false, resizeHandle: '',
            dragStart: { x: 0, y: 0 }, wmStartRatio: { x: 0.5, y: 0.5, w: 0.25, h: 0.25 },
            previewCanvases: []  // { id, canvas, img, naturalW, naturalH }
        };

        const selection = new SelectionManager();

        // ---- Build DOM ----
        container.innerHTML = `
            <div id="wm-upload"></div>
            <div id="wm-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="wm-count">已选择 0 张图片</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="wm-select-all">全选</button>
                        <button class="btn btn-sm" id="wm-invert">反选</button>
                        <button class="btn btn-sm" id="wm-clear">清空</button>
                    </div>
                </div>
                <div class="file-list-view" id="wm-list"></div>
            </div>
            <div id="wm-controls" class="controls-panel hidden">
                <h4>水印设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>水印类型</label>
                        <div class="layout-options" id="wm-type-options">
                            <div class="layout-option active" data-type="text">文字水印</div>
                            <div class="layout-option" data-type="image">图像水印</div>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>水印模式</label>
                        <div class="layout-options" id="wm-mode-options">
                            <div class="layout-option active" data-mode="single">单个水印</div>
                            <div class="layout-option" data-mode="tiled">全屏水印</div>
                        </div>
                    </div>
                </div>
                <div id="wm-text-settings">
                    <div class="controls-grid">
                        <div class="control-group">
                            <label>文字内容</label>
                            <input type="text" id="wm-text" placeholder="请输入水印文字" style="width:100%">
                        </div>
                        <div class="control-group">
                            <label>字体</label>
                            <select id="wm-font-family">${FONT_LIST.map(f => `<option value="${f}">${f}</option>`).join('')}</select>
                        </div>
                        <div class="control-group">
                            <label>字号: <span id="wm-font-size-val">48</span>px</label>
                            <input type="range" id="wm-font-size" min="5" max="300" value="48">
                        </div>
                        <div class="control-group">
                            <label>粗细</label>
                            <select id="wm-font-weight">
                                <option value="normal">正常</option><option value="bold">粗体</option>
                                <option value="lighter">细体</option><option value="900">特粗</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label>字间距: <span id="wm-letter-spacing-val">0</span>px</label>
                            <input type="range" id="wm-letter-spacing" min="0" max="100" value="0">
                        </div>
                        <div class="control-group">
                            <label>文字颜色</label>
                            <input type="color" id="wm-text-color" value="#000000">
                        </div>
                        <div class="control-group">
                            <label>文字透明度: <span id="wm-text-opacity-val">50</span>%</label>
                            <input type="range" id="wm-text-opacity" min="5" max="100" value="50">
                        </div>
                    </div>
                </div>
                <div id="wm-image-settings" class="hidden">
                    <div class="controls-grid">
                        <div class="control-group">
                            <label>水印图像</label>
                            <div id="wm-image-upload-area"></div>
                            <div id="wm-image-preview-wrap" class="hidden" style="margin-top:8px;text-align:center">
                                <img id="wm-image-preview" style="max-width:150px;max-height:150px;border:1px solid var(--border);border-radius:6px">
                                <button class="btn btn-sm" id="wm-image-remove" style="margin-top:4px">移除</button>
                            </div>
                        </div>
                        <div class="control-group">
                            <label>图像透明度: <span id="wm-image-opacity-val">50</span>%</label>
                            <input type="range" id="wm-image-opacity" min="5" max="100" value="50">
                        </div>
                    </div>
                </div>
                <div id="wm-single-settings">
                    <p style="font-size:12px;color:var(--text-secondary);margin:8px 0">提示：在预览画布上直接拖拽移动水印，拖拽四角手柄调整大小</p>
                </div>
                <div id="wm-tiled-settings" class="hidden">
                    <div class="controls-grid">
                        <div class="control-group">
                            <label>分布密度(间距): <span id="wm-tile-spacing-val">150</span>px</label>
                            <input type="range" id="wm-tile-spacing" min="40" max="500" value="150">
                        </div>
                        <div class="control-group">
                            <label>分布角度: <span id="wm-tile-angle-val">-30</span>°</label>
                            <input type="range" id="wm-tile-angle" min="-90" max="90" value="-30">
                        </div>
                        <div class="control-group">
                            <label>水印缩放: <span id="wm-tile-scale-val">12</span>%</label>
                            <input type="range" id="wm-tile-scale" min="5" max="80" value="12">
                        </div>
                    </div>
                </div>
            </div>
            <div id="wm-preview" class="preview-area hidden">
                <h4>预览 <span style="font-weight:normal;font-size:12px;color:var(--text-secondary)" id="wm-preview-hint"></span></h4>
                <div id="wm-preview-grid" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center"></div>
            </div>
            <div id="wm-actions" class="action-bar hidden">
                <div class="action-bar-left"><span id="wm-action-info"></span></div>
                <div class="action-bar-right">
                    <button class="btn" id="wm-download-orig">批量下载原图</button>
                    <button class="btn btn-primary" id="wm-process">开始处理</button>
                </div>
            </div>
            <div id="wm-results" class="file-list hidden">
                <div class="file-list-header">
                    <span id="wm-result-count">处理结果</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="wm-res-select-all">全选</button>
                        <button class="btn btn-sm" id="wm-res-invert">反选</button>
                        <button class="btn btn-primary btn-sm" id="wm-res-dl-selected">下载选中 (ZIP)</button>
                    </div>
                </div>
                <div class="file-list-view" id="wm-result-list"></div>
            </div>
        `;

        // DOM refs
        const el = {
            upload: container.querySelector('#wm-upload'),
            filesSection: container.querySelector('#wm-files'),
            list: container.querySelector('#wm-list'),
            count: container.querySelector('#wm-count'),
            controls: container.querySelector('#wm-controls'),
            typeOptions: container.querySelector('#wm-type-options'),
            modeOptions: container.querySelector('#wm-mode-options'),
            textSettings: container.querySelector('#wm-text-settings'),
            textInput: container.querySelector('#wm-text'),
            fontFamily: container.querySelector('#wm-font-family'),
            fontSizeSlider: container.querySelector('#wm-font-size'),
            fontSizeVal: container.querySelector('#wm-font-size-val'),
            fontWeight: container.querySelector('#wm-font-weight'),
            letterSpacingSlider: container.querySelector('#wm-letter-spacing'),
            letterSpacingVal: container.querySelector('#wm-letter-spacing-val'),
            textColor: container.querySelector('#wm-text-color'),
            textOpacitySlider: container.querySelector('#wm-text-opacity'),
            textOpacityVal: container.querySelector('#wm-text-opacity-val'),
            imageSettings: container.querySelector('#wm-image-settings'),
            imageUploadArea: container.querySelector('#wm-image-upload-area'),
            imagePreviewWrap: container.querySelector('#wm-image-preview-wrap'),
            imagePreview: container.querySelector('#wm-image-preview'),
            imageRemove: container.querySelector('#wm-image-remove'),
            imageOpacitySlider: container.querySelector('#wm-image-opacity'),
            imageOpacityVal: container.querySelector('#wm-image-opacity-val'),
            singleSettings: container.querySelector('#wm-single-settings'),
            tiledSettings: container.querySelector('#wm-tiled-settings'),
            tileSpacingSlider: container.querySelector('#wm-tile-spacing'),
            tileSpacingVal: container.querySelector('#wm-tile-spacing-val'),
            tileAngleSlider: container.querySelector('#wm-tile-angle'),
            tileAngleVal: container.querySelector('#wm-tile-angle-val'),
            tileScaleSlider: container.querySelector('#wm-tile-scale'),
            tileScaleVal: container.querySelector('#wm-tile-scale-val'),
            preview: container.querySelector('#wm-preview'),
            previewGrid: container.querySelector('#wm-preview-grid'),
            previewHint: container.querySelector('#wm-preview-hint'),
            actions: container.querySelector('#wm-actions'),
            actionInfo: container.querySelector('#wm-action-info'),
            results: container.querySelector('#wm-results'),
            resultList: container.querySelector('#wm-result-list'),
            resultCount: container.querySelector('#wm-result-count')
        };

        state.wmResults = [];
        const wmResultSel = new Set();

        function showSections() {
            const has = state.files.length > 0;
            el.filesSection.classList.toggle('hidden', !has);
            el.controls.classList.toggle('hidden', !has);
            el.preview.classList.toggle('hidden', !has);
            el.actions.classList.toggle('hidden', !has);
        }

        function updateCount() {
            el.count.textContent = `已选择 ${selection.count} 张图片 (共 ${selection.total} 张)`;
            el.actionInfo.textContent = `${selection.count} 张图片已选中`;
        }

        function updateHint() {
            el.previewHint.textContent = (state.mode === 'single' && state.files.length > 0)
                ? '— 在任意一张图上拖拽水印，所有图同步更新' : '';
        }

        // Get wm box in canvas-pixel coords for a given canvas
        // ---- Text dimension helpers ----
        function textLineHeight(fs) { return fs * 1.4; }

        function wrapTextLines(ctx, text, maxWidth, fs, fontWeight, fontFamily, letterSpacing) {
            if (!text) return [];
            ctx.save();
            ctx.font = `${fontWeight} ${fs}px "${fontFamily}", sans-serif`;
            const lines = [];
            let currentLine = '';
            for (const ch of [...text]) {
                const testLine = currentLine + ch;
                const tw = ctx.measureText(testLine).width + (testLine.length - 1) * letterSpacing;
                if (tw > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = ch;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);
            ctx.restore();
            return lines;
        }

        function wmBoxFor(cv) {
            const centerX = state.wmRatioX * cv.width;
            const centerY = state.wmRatioY * cv.height;
            if (state.watermarkType === 'text' && state.text) {
                const fs = Math.max(5, state.fontSize * (cv.width / 500));
                const ls = state.letterSpacing * (cv.width / 500);
                const ctx = cv.getContext('2d');
                ctx.save();
                ctx.font = `${state.fontWeight} ${fs}px "${state.fontFamily}", sans-serif`;
                const textW = ctx.measureText(state.text).width + ([...state.text].length - 1) * ls;
                ctx.restore();
                const padding = fs * 0.6;
                const boxW = textW + padding * 2;
                const boxH = fs * 1.4 + padding * 2;
                return {
                    x: centerX - boxW / 2,
                    y: centerY - boxH / 2,
                    w: boxW,
                    h: boxH,
                    _fs: fs, _lh: fs * 1.4, _padding: padding
                };
            }
            return {
                x: centerX - (state.wmRatioW * cv.width) / 2,
                y: centerY - (state.wmRatioH * cv.height) / 2,
                w: state.wmRatioW * cv.width,
                h: state.wmRatioH * cv.height
            };
        }

        function setRatiosFromBox(box, cv) {
            state.wmRatioX = (box.x + box.w / 2) / cv.width;
            state.wmRatioY = (box.y + box.h / 2) / cv.height;
            state.wmRatioW = box.w / cv.width;
            state.wmRatioH = box.h / cv.height;
        }

        function clampRatios() {
            state.wmRatioW = Utils.clamp(state.wmRatioW, 0.02, 1);
            state.wmRatioH = Utils.clamp(state.wmRatioH, 0.02, 1);
            state.wmRatioX = Utils.clamp(state.wmRatioX, 0.01, 0.99);
            state.wmRatioY = Utils.clamp(state.wmRatioY, 0.01, 0.99);
        }

        function syncFontSizeSlider() {
            el.fontSizeSlider.value = state.fontSize;
            el.fontSizeVal.textContent = state.fontSize;
        }

        // ---- Build preview canvases for all files ----
        async function buildPreviews() {
            el.previewGrid.innerHTML = '';
            state.previewCanvases = [];
            if (state.files.length === 0) return;

            const maxDim = Math.min(280, Math.floor((container.clientWidth - 48) / Math.max(1, Math.min(state.files.length, 3))));

            for (const item of state.files) {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px';

                const cv = document.createElement('canvas');
                cv.className = 'wm-preview-cv';
                cv.dataset.id = item.id;
                cv.style.cssText = 'max-width:100%;cursor:default;border-radius:6px;border:2px solid var(--border)';

                const label = document.createElement('span');
                label.style.cssText = 'font-size:11px;color:var(--text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
                label.textContent = item.name;

                wrap.appendChild(cv);
                wrap.appendChild(label);
                el.previewGrid.appendChild(wrap);

                // Load image
                const dataUrl = await Utils.readAsDataURL(item.file);
                const img = await Utils.loadImage(dataUrl);
                const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
                cv.width = Math.round(img.naturalWidth * scale);
                cv.height = Math.round(img.naturalHeight * scale);

                state.previewCanvases.push({ id: item.id, canvas: cv, img, naturalW: img.naturalWidth, naturalH: img.naturalHeight });
            }

            // Attach events to all canvases
            state.previewCanvases.forEach(pc => {
                pc.canvas.addEventListener('mousedown', (e) => canvasDown(e, pc), { signal });
                pc.canvas.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) canvasDown({ preventDefault: () => e.preventDefault(), clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }, pc);
                }, { passive: false, signal });
            });
        }

        // ---- Render all canvases ----
        function renderAllCanvases() {
            state.previewCanvases.forEach(pc => {
                const cv = pc.canvas;
                const ctx = cv.getContext('2d');
                ctx.clearRect(0, 0, cv.width, cv.height);
                ctx.drawImage(pc.img, 0, 0, cv.width, cv.height);

                const opacity = state.watermarkType === 'text' ? state.textOpacity : state.imageOpacity;
                const hasContent = state.watermarkType === 'text' ? !!state.text : !!state.watermarkImg;
                if (!hasContent) return;

                if (state.mode === 'single') {
                    const box = wmBoxFor(cv);
                    if (state.watermarkType === 'text') {
                        drawTextWmOnCanvas(ctx, box, opacity);
                    } else {
                        drawImageWmOnCanvas(ctx, box.x, box.y, box.w, box.h, opacity);
                    }
                    drawHandlesOnCanvas(ctx, box);
                } else {
                    drawTiledOnCanvasAll(ctx, cv.width, cv.height, opacity, Math.min(cv.width / pc.naturalW, cv.height / pc.naturalH));
                }
            });
        }

        function drawTextWmOnCanvas(ctx, box, opacity) {
            if (!state.text || !box._fs) return;
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = state.textColor;
            ctx.font = `${state.fontWeight} ${box._fs}px "${state.fontFamily}", sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const ls = state.letterSpacing * (ctx.canvas.width / 500);
            const chars = [...state.text];
            const cy = box.y + box.h / 2;
            if (ls > 0 && chars.length > 0) {
                const tw = chars.length * box._fs * 0.6 + (chars.length - 1) * ls;
                let px = box.x + box.w / 2 - tw / 2 + box._fs * 0.3;
                chars.forEach(ch => { ctx.fillText(ch, px, cy); px += box._fs * 0.6 + ls; });
            } else {
                ctx.fillText(state.text, box.x + box.w / 2, cy);
            }
            ctx.restore();
        }

        function drawImageWmOnCanvas(ctx, x, y, w, h, opacity) {
            if (!state.watermarkImg) return;
            const img = state.watermarkImg;
            const sc = Math.min(w / img.naturalWidth, h / img.naturalHeight, 1);
            const dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
            ctx.save(); ctx.globalAlpha = opacity;
            ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
            ctx.restore();
        }

        function drawHandlesOnCanvas(ctx, box) {
            const hs = 7;
            ctx.save();
            ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); ctx.strokeRect(box.x, box.y, box.w, box.h); ctx.setLineDash([]);
            ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
            [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]].forEach(([cx, cy]) => {
                ctx.fillRect(cx - hs, cy - hs, hs * 2, hs * 2);
                ctx.strokeRect(cx - hs, cy - hs, hs * 2, hs * 2);
            });
            ctx.restore();
        }

        function drawTiledOnCanvasAll(ctx, cw, ch, opacity, factor) {
            const spacing = state.tileSpacing * factor;
            const angle = state.tileAngle * Math.PI / 180;
            let wmW, wmH;
            if (state.watermarkType === 'text') {
                wmW = (state.fontSize * (state.text.length || 1) * 0.7 + state.letterSpacing * (state.text.length || 1)) * factor;
                wmH = state.fontSize * 1.5 * factor;
            } else if (state.watermarkImg) {
                wmW = state.watermarkImg.naturalWidth * state.tileScale * factor;
                wmH = state.watermarkImg.naturalHeight * state.tileScale * factor;
            } else return;

            const stepX = Math.max(spacing, wmW * 0.6), stepY = Math.max(spacing, wmH * 0.6);
            const cols = Math.ceil(cw / stepX) + 2, rows = Math.ceil(ch / stepY) + 2;
            ctx.save();
            for (let row = -1; row < rows; row++) {
                for (let col = -1; col < cols; col++) {
                    const cx = col * stepX + stepX / 2, cy = row * stepY + stepY / 2;
                    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.globalAlpha = opacity;
                    if (state.watermarkType === 'text') {
                        ctx.fillStyle = state.textColor;
                        const fs = Math.max(5, state.fontSize * factor);
                        ctx.font = `${state.fontWeight} ${fs}px "${state.fontFamily}", sans-serif`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        const ls = state.letterSpacing * factor;
                        if (ls > 0 && state.text.length > 0) {
                            const chars = [...state.text];
                            const tw = chars.length * fs * 0.6 + (chars.length - 1) * ls;
                            let px = -tw / 2 + fs * 0.3;
                            chars.forEach(ch => { ctx.fillText(ch, px, 0); px += fs * 0.6 + ls; });
                        } else { ctx.fillText(state.text, 0, 0); }
                    } else if (state.watermarkImg) {
                        ctx.drawImage(state.watermarkImg, -wmW / 2, -wmH / 2, wmW, wmH);
                    }
                    ctx.restore();
                }
            }
            ctx.restore();
        }

        // ---- Hit testing on a specific canvas ----
        function hitHandle(cv, box, mx, my) {
            const hs = 12;
            const corners = [
                { h: 'tl', x: box.x, y: box.y }, { h: 'tr', x: box.x + box.w, y: box.y },
                { h: 'bl', x: box.x, y: box.y + box.h }, { h: 'br', x: box.x + box.w, y: box.y + box.h }
            ];
            for (const c of corners) {
                if (Math.abs(mx - c.x) <= hs && Math.abs(my - c.y) <= hs) return c.h;
            }
            return '';
        }

        function hitBox(box, mx, my) {
            return mx >= box.x && mx <= box.x + box.w && my >= box.y && my <= box.y + box.h;
        }

        function canvasPos(e, cv) {
            const rect = cv.getBoundingClientRect();
            return { x: (e.clientX - rect.left) * (cv.width / rect.width), y: (e.clientY - rect.top) * (cv.height / rect.height) };
        }

        // ---- Interaction on any canvas ----
        function canvasDown(e, pc) {
            if (state.mode !== 'single') return;
            const cv = pc.canvas;
            const pos = canvasPos(e, cv);
            const box = wmBoxFor(cv);

            if (state.watermarkType !== 'text') {
                const handle = hitHandle(cv, box, pos.x, pos.y);
                if (handle) {
                    state.resizing = true; state.resizeHandle = handle;
                    state.dragStart = { x: pos.x, y: pos.y };
                    state.wmStartRatio = { x: state.wmRatioX, y: state.wmRatioY, w: state.wmRatioW, h: state.wmRatioH, fontSize: state.fontSize };
                    state._activeCanvas = cv;
                    state._startBoxW = box.w;
                    state._startBoxH = box.h;
                    cv.style.cursor = (handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize';
                    e.preventDefault(); return;
                }
            }
            if (hitBox(box, pos.x, pos.y)) {
                state.dragging = true;
                state.dragStart = { x: pos.x, y: pos.y };
                state.wmStartRatio = { x: state.wmRatioX, y: state.wmRatioY, w: state.wmRatioW, h: state.wmRatioH, fontSize: state.fontSize };
                state._activeCanvas = cv;
                state._startBoxW = box.w;
                state._startBoxH = box.h;
                cv.style.cursor = 'move';
                e.preventDefault();
            }
        }

        function canvasMove(e) {
            if (!state.dragging && !state.resizing) {
                if (state.mode === 'single') {
                    state.previewCanvases.forEach(pc => {
                        const pos = canvasPos(e, pc.canvas);
                        const box = wmBoxFor(pc.canvas);
                        if (state.watermarkType !== 'text') {
                            const handle = hitHandle(pc.canvas, box, pos.x, pos.y);
                            pc.canvas.style.cursor = handle ? ((handle === 'tl' || handle === 'br') ? 'nwse-resize' : 'nesw-resize')
                                : hitBox(box, pos.x, pos.y) ? 'move' : 'default';
                        } else {
                            pc.canvas.style.cursor = hitBox(box, pos.x, pos.y) ? 'move' : 'default';
                        }
                    });
                }
                return;
            }

            const cv = state._activeCanvas;
            if (!cv) return;
            const pos = canvasPos(e, cv);
            const dx = pos.x - state.dragStart.x;
            const dy = pos.y - state.dragStart.y;
            const cw = cv.width, ch = cv.height;
            const ws = state.wmStartRatio;

            if (state.dragging) {
                if (state.watermarkType === 'text') {
                    const startCenterX = ws.x * cw;
                    const startCenterY = ws.y * ch;
                    let nx = startCenterX + dx;
                    let ny = startCenterY + dy;
                    const curBox = wmBoxFor(cv);
                    nx = Utils.clamp(nx, curBox.w / 2, cw - curBox.w / 2);
                    ny = Utils.clamp(ny, curBox.h / 2, ch - curBox.h / 2);
                    state.wmRatioX = nx / cw;
                    state.wmRatioY = ny / ch;
                } else {
                    const startBox = {
                        x: ws.x * cw - (ws.w * cw) / 2,
                        y: ws.y * ch - (ws.h * ch) / 2,
                        w: ws.w * cw,
                        h: ws.h * ch
                    };
                    let nx = startBox.x + dx, ny = startBox.y + dy;
                    nx = Utils.clamp(nx, -startBox.w / 2, cw - startBox.w / 2);
                    ny = Utils.clamp(ny, -startBox.h / 2, ch - startBox.h / 2);
                    const newBox = { x: nx, y: ny, w: startBox.w, h: startBox.h };
                    setRatiosFromBox(newBox, cv);
                }
            } else if (state.resizing) {
                if (state.watermarkType === 'text') {
                    const startW = state._startBoxW;
                    const startH = state._startBoxH;
                    const h = state.resizeHandle;
                    let nw = startW, nh = startH;
                    if (h === 'br') { nw = Math.max(20, startW + dx); nh = Math.max(20, startH + dy); }
                    else if (h === 'bl') { nw = Math.max(20, startW - dx); nh = Math.max(20, startH + dy); }
                    else if (h === 'tr') { nw = Math.max(20, startW + dx); nh = Math.max(20, startH - dy); }
                    else if (h === 'tl') { nw = Math.max(20, startW - dx); nh = Math.max(20, startH - dy); }
                    const scale = Math.min(nw / startW, nh / startH);
                    state.wmRatioW = Utils.clamp(ws.w * scale, 0.02, 1);
                    state.fontSize = Math.max(5, Math.round(ws.fontSize * scale));
                    syncFontSizeSlider();
                } else {
                    const startBox = {
                        x: ws.x * cw - (ws.w * cw) / 2,
                        y: ws.y * ch - (ws.h * ch) / 2,
                        w: ws.w * cw,
                        h: ws.h * ch
                    };
                    const h = state.resizeHandle;
                    let nx = startBox.x, ny = startBox.y, nw = startBox.w, nh = startBox.h;
                    let aspect = null;
                    if (state.watermarkType === 'image' && state.watermarkImg) {
                        aspect = state.watermarkImg.naturalWidth / state.watermarkImg.naturalHeight;
                    }
                    const minSz = 20;
                    if (h === 'br') { nw = Math.max(minSz, startBox.w + dx); nh = aspect ? nw / aspect : Math.max(minSz, startBox.h + dy); }
                    else if (h === 'bl') { nw = Math.max(minSz, startBox.w - dx); nh = aspect ? nw / aspect : Math.max(minSz, startBox.h + dy); nx = startBox.x + startBox.w - nw; }
                    else if (h === 'tr') { nw = Math.max(minSz, startBox.w + dx); nh = aspect ? nw / aspect : Math.max(minSz, startBox.h - dy); ny = startBox.y + startBox.h - nh; }
                    else if (h === 'tl') { nw = Math.max(minSz, startBox.w - dx); nh = aspect ? nw / aspect : Math.max(minSz, startBox.h - dy); nx = startBox.x + startBox.w - nw; ny = startBox.y + startBox.h - nh; }
                    if (nx < 0) { nw += nx; nx = 0; } if (ny < 0) { nh += ny; ny = 0; }
                    if (nx + nw > cw) nw = cw - nx; if (ny + nh > ch) nh = ch - ny;
                    nw = Math.max(nw, minSz); nh = Math.max(nh, minSz);
                    const newBox = { x: nx, y: ny, w: nw, h: nh };
                    setRatiosFromBox(newBox, cv);
                }
            }

            clampRatios();
            renderAllCanvases();
        }

        function canvasUp() {
            if (state.dragging || state.resizing) {
                state.dragging = false; state.resizing = false;
                state._activeCanvas = null;
                state.previewCanvases.forEach(pc => pc.canvas.style.cursor = 'default');
            }
        }

        document.addEventListener('mousemove', canvasMove, { signal });
        document.addEventListener('mouseup', canvasUp, { signal });

        document.addEventListener('touchmove', (e) => {
            if (!state.dragging && !state.resizing) return;
            if (e.touches.length === 1) canvasMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        }, { passive: false, signal });

        document.addEventListener('touchend', canvasUp, { signal });

        // ---- Apply to full-resolution image ----
        async function applyWatermarkToImage(file) {
            const dataUrl = await Utils.readAsDataURL(file);
            const img = await Utils.loadImage(dataUrl);
            const oc = document.createElement('canvas');
            oc.width = img.naturalWidth; oc.height = img.naturalHeight;
            const ctx = oc.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const opacity = state.watermarkType === 'text' ? state.textOpacity : state.imageOpacity;

            if (state.mode === 'single') {
                if (state.watermarkType === 'text' && state.text) {
                    const fs = Math.max(5, state.fontSize * (oc.width / 500));
                    const ls = state.letterSpacing * (oc.width / 500);
                    const textW = ctx.measureText(state.text).width + ([...state.text].length - 1) * ls;
                    const padding = fs * 0.6;
                    const boxW = textW + padding * 2;
                    const boxH = fs * 1.4 + padding * 2;
                    const centerX = state.wmRatioX * oc.width;
                    const centerY = state.wmRatioY * oc.height;
                    const x = centerX - boxW / 2;
                    const y = centerY - boxH / 2;
                    ctx.save();
                    ctx.globalAlpha = opacity;
                    ctx.fillStyle = state.textColor;
                    ctx.font = `${state.fontWeight} ${fs}px "${state.fontFamily}", sans-serif`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const cy = y + boxH / 2;
                    const chars = [...state.text];
                    if (ls > 0 && chars.length > 0) {
                        const tw = chars.length * fs * 0.6 + (chars.length - 1) * ls;
                        let px = x + boxW / 2 - tw / 2 + fs * 0.3;
                        chars.forEach(ch => { ctx.fillText(ch, px, cy); px += fs * 0.6 + ls; });
                    } else {
                        ctx.fillText(state.text, x + boxW / 2, cy);
                    }
                    ctx.restore();
                } else {
                    const centerX = state.wmRatioX * oc.width;
                    const centerY = state.wmRatioY * oc.height;
                    const x = centerX - (state.wmRatioW * oc.width) / 2;
                    const y = centerY - (state.wmRatioH * oc.height) / 2;
                    const w = state.wmRatioW * oc.width;
                    const h = state.wmRatioH * oc.height;
                    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
                    ctx.translate(x, y);
                    drawImageWmOnCanvas(ctx, 0, 0, w, h, opacity);
                    ctx.restore();
                }
            } else {
                drawTiledOnCanvasAll(ctx, oc.width, oc.height, opacity, 1);
            }
            return await Utils.canvasToBlob(oc, 'image/png');
        }

        // ---- Main image upload ----
        FileUpload.createUploadArea(el.upload, {
            accept: 'image/*', multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式，支持批量上传',
            onFiles: async (newFiles) => {
                const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
                if (!imageFiles.length) { Toast.warning('请选择图片文件'); return; }
                Loading.show('正在加载图片...');
                for (let i = 0; i < imageFiles.length; i++) {
                    const f = imageFiles[i];
                    try {
                        const thumb = await Utils.createThumbnail(f);
                        state.files.push({ id: Utils.uid(), file: f, name: f.name, size: f.size, thumb });
                    } catch (e) { console.error('Failed:', f.name, e); }
                    Loading.progress(Math.round((i + 1) / imageFiles.length * 100));
                }
                Loading.hide();
                selection.setItems(state.files); renderFileList(); showSections(); buildPreviews().then(() => { updateHint(); renderAllCanvases(); });
                Toast.success(`已添加 ${imageFiles.length} 张图片`);
            }
        });

        // ---- Image watermark upload ----
        FileUpload.createUploadArea(el.imageUploadArea, {
            accept: 'image/*', multiple: false,
            hint: '选择水印图像（建议使用透明背景 PNG）',
            onFiles: async (files) => {
                const file = files.find(f => f.type.startsWith('image/'));
                if (!file) { Toast.warning('请选择图片文件'); return; }
                try {
                    const dataUrl = await Utils.readAsDataURL(file);
                    const img = await Utils.loadImage(dataUrl);
                    state.watermarkImg = img; state.watermarkImgDataUrl = dataUrl;
                    el.imagePreview.src = dataUrl; el.imagePreviewWrap.classList.remove('hidden');
                    el.imageUploadArea.style.display = 'none';
                    renderAllCanvases(); Toast.success('水印图像已加载');
                } catch (err) {
                    console.error('Watermark image load failed:', err);
                    Toast.error('水印图像加载失败，请检查文件是否有效');
                }
            }
        });

        el.imageRemove.onclick = () => {
            state.watermarkImg = null; state.watermarkImgDataUrl = null;
            el.imagePreviewWrap.classList.add('hidden'); el.imageUploadArea.style.display = '';
            renderAllCanvases();
        };

        // ---- File list ----
        function renderFileList() {
            el.list.innerHTML = '';
            state.files.forEach(item => {
                const row = document.createElement('div');
                row.className = 'file-list-row' + (selection.isSelected(item.id) ? ' selected' : '');
                row.dataset.id = item.id;
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${selection.isSelected(item.id) ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${item.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${item.name}</div>
                        <div class="file-list-row-meta">${Utils.formatSize(item.size)}</div>
                    </div>
                `;
                row.querySelector('.file-cb').addEventListener('change', () => {
                    selection.toggle(item.id); row.classList.toggle('selected', selection.isSelected(item.id));
                    row.querySelector('.file-cb').checked = selection.isSelected(item.id);
                    updateCount(); buildPreviews().then(() => { updateHint(); renderAllCanvases(); });
                });
                row.addEventListener('click', (e) => {
                    if (e.target.closest('.file-cb')) return;
                    selection.toggle(item.id); row.classList.toggle('selected', selection.isSelected(item.id));
                    row.querySelector('.file-cb').checked = selection.isSelected(item.id);
                    updateCount();
                });
                el.list.appendChild(row);
            });
            updateCount();
        }

        // ---- Buttons ----
        container.querySelector('#wm-select-all').onclick = () => { selection.selectAll(); renderFileList(); buildPreviews().then(() => { updateHint(); renderAllCanvases(); }); };
        container.querySelector('#wm-invert').onclick = () => { selection.invertSelection(); renderFileList(); buildPreviews().then(() => { updateHint(); renderAllCanvases(); }); };
        container.querySelector('#wm-clear').onclick = () => { state.files = []; selection.setItems([]); state.previewCanvases = []; el.previewGrid.innerHTML = ''; renderFileList(); showSections(); };

        el.typeOptions.querySelectorAll('.layout-option').forEach(opt => {
            opt.onclick = () => {
                el.typeOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.watermarkType = opt.dataset.type;
                el.textSettings.classList.toggle('hidden', state.watermarkType !== 'text');
                el.imageSettings.classList.toggle('hidden', state.watermarkType !== 'image');
                renderAllCanvases();
            };
        });

        el.modeOptions.querySelectorAll('.layout-option').forEach(opt => {
            opt.onclick = () => {
                el.modeOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.mode = opt.dataset.mode;
                el.singleSettings.classList.toggle('hidden', state.mode !== 'single');
                el.tiledSettings.classList.toggle('hidden', state.mode !== 'tiled');
                updateHint(); renderAllCanvases();
            };
        });

        el.textInput.oninput = () => { state.text = el.textInput.value; renderAllCanvases(); };
        el.fontFamily.onchange = () => { state.fontFamily = el.fontFamily.value; renderAllCanvases(); };
        el.fontSizeSlider.oninput = () => { state.fontSize = parseInt(el.fontSizeSlider.value); el.fontSizeVal.textContent = state.fontSize; renderAllCanvases(); };
        el.fontWeight.onchange = () => { state.fontWeight = el.fontWeight.value; renderAllCanvases(); };
        el.letterSpacingSlider.oninput = () => { state.letterSpacing = parseInt(el.letterSpacingSlider.value); el.letterSpacingVal.textContent = state.letterSpacing; renderAllCanvases(); };
        el.textColor.oninput = () => { state.textColor = el.textColor.value; renderAllCanvases(); };
        el.textOpacitySlider.oninput = () => { state.textOpacity = parseInt(el.textOpacitySlider.value) / 100; el.textOpacityVal.textContent = Math.round(state.textOpacity * 100); renderAllCanvases(); };
        el.imageOpacitySlider.oninput = () => { state.imageOpacity = parseInt(el.imageOpacitySlider.value) / 100; el.imageOpacityVal.textContent = Math.round(state.imageOpacity * 100); renderAllCanvases(); };
        el.tileSpacingSlider.oninput = () => { state.tileSpacing = parseInt(el.tileSpacingSlider.value); el.tileSpacingVal.textContent = state.tileSpacing; renderAllCanvases(); };
        el.tileAngleSlider.oninput = () => { state.tileAngle = parseInt(el.tileAngleSlider.value); el.tileAngleVal.textContent = state.tileAngle; renderAllCanvases(); };
        el.tileScaleSlider.oninput = () => { state.tileScale = parseInt(el.tileScaleSlider.value) / 100; el.tileScaleVal.textContent = Math.round(state.tileScale * 100); renderAllCanvases(); };

        window.addEventListener('resize', () => { if (state.previewCanvases.length) renderAllCanvases(); }, { signal });

        // ---- Process ----
        container.querySelector('#wm-process').onclick = async () => {
            const selected = selection.getSelected();
            if (!selected.length) { Toast.warning('请先选择图片'); return; }
            if (state.watermarkType === 'text' && !state.text) { Toast.warning('请输入水印文字'); return; }
            if (state.watermarkType === 'image' && !state.watermarkImg) { Toast.warning('请上传水印图像'); return; }
            Loading.show('正在添加水印...');
            state.wmResults = [];
            for (let i = 0; i < selected.length; i++) {
                Loading.progress(Math.round((i + 1) / selected.length * 100));
                Loading.setText(`正在处理 ${selected[i].name}...`);
                try {
                    const blob = await applyWatermarkToImage(selected[i].file);
                    if (blob) {
                        const thumb = await Utils.createThumbnail(new File([blob], selected[i].name, { type: 'image/png' }));
                        state.wmResults.push({ id: Utils.uid(), blob, name: `${Utils.getBaseName(selected[i].name)}_水印.png`, size: blob.size, thumb });
                    }
                } catch (err) { console.error('Failed:', selected[i].name, err); Toast.error(`处理失败: ${selected[i].name}`); }
            }
            Loading.hide();
            if (!state.wmResults.length) { Toast.warning('没有成功处理的图片'); return; }
            wmResultSel.clear(); state.wmResults.forEach(r => wmResultSel.add(r.id));
            renderWmResults();
            Toast.success(`已处理 ${state.wmResults.length} 张图片`);
        };

        function renderWmResults() {
            el.results.classList.toggle('hidden', !state.wmResults.length);
            el.resultCount.textContent = `已处理 ${state.wmResults.length} 张图片`;
            el.resultList.innerHTML = '';
            state.wmResults.forEach(r => {
                const checked = wmResultSel.has(r.id);
                const row = document.createElement('div');
                row.className = 'file-list-row' + (checked ? ' selected' : '');
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${checked ? 'checked' : ''}>
                    <img class="file-list-row-thumb" src="${r.thumb}" alt="">
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${r.name}</div>
                        <div class="file-list-row-meta">${Utils.formatSize(r.size)}</div>
                    </div>
                    <button class="btn btn-sm btn-primary result-dl-btn">下载</button>
                `;
                row.querySelector('.file-cb').onchange = () => {
                    if (wmResultSel.has(r.id)) wmResultSel.delete(r.id); else wmResultSel.add(r.id);
                    row.classList.toggle('selected', wmResultSel.has(r.id));
                };
                row.querySelector('.result-dl-btn').onclick = () => Utils.downloadBlob(r.blob, r.name);
                el.resultList.appendChild(row);
            });
        }

        container.querySelector('#wm-res-select-all').onclick = () => { state.wmResults.forEach(r => wmResultSel.add(r.id)); renderWmResults(); };
        container.querySelector('#wm-res-invert').onclick = () => { const s = new Set(state.wmResults.filter(r => !wmResultSel.has(r.id)).map(r => r.id)); wmResultSel.clear(); s.forEach(id => wmResultSel.add(id)); renderWmResults(); };
        container.querySelector('#wm-res-dl-selected').onclick = async () => {
            const selected = state.wmResults.filter(r => wmResultSel.has(r.id));
            if (!selected.length) { Toast.warning('请先勾选要下载的文件'); return; }
            await batchDownload(selected.map(r => ({ blob: r.blob, name: r.name })), `水印图片_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`);
        };

        container.querySelector('#wm-download-orig').onclick = async () => {
            const selected = selection.getSelected();
            if (!selected.length) { Toast.warning('请先选择图片'); return; }
            await batchDownload(selected.map(item => ({ blob: item.file, name: item.name })), `原图_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`);
        };

        renderAllCanvases();
    }
};
