// ===== Doubao Watermark Remover Module =====

const DoubaoWatermark = {
    RATIOS: {
        '1:1':   { orig: [2048, 2048], crop: [1809, 1809] },
        '2:3':   { orig: [1672, 2508], crop: [1534, 2302] },
        '3:4':   { orig: [1773, 2364], crop: [1604, 2137] },
        '4:3':   { orig: [2364, 1773], crop: [2086, 1564] },
        '9:16':  { orig: [1535, 2732], crop: [1436, 2550] },
        '16:9':  { orig: [2732, 1534], crop: [2409, 1353] },
    },

    render(container) {
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>豆包水印去除工具</h2>
                    <p>自动识别豆包生成图片比例，裁剪去除右下角水印 · 支持批量处理 · 支持无损放大</p>
                </div>

                <div id="dw-upload-area" class="upload-area">
                    <div class="upload-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                    </div>
                    <h3>拖放图片到此处，或点击选择</h3>
                    <p>支持 JPG、PNG、WebP 格式，可多选</p>
                    <input type="file" id="dw-file-input" multiple accept="image/*" style="display:none">
                </div>

                <div id="dw-file-list" class="hidden">
                    <div class="file-list-header">
                        <span id="dw-count">已选择 0 张图片</span>
                        <div class="file-list-actions">
                            <button class="btn btn-sm" id="dw-select-all">全选</button>
                            <button class="btn btn-sm" id="dw-invert">反选</button>
                            <button class="btn btn-sm" id="dw-clear">清空</button>
                        </div>
                    </div>
                    <div class="file-grid" id="dw-file-grid"></div>
                </div>

                <div id="dw-settings" class="controls-panel hidden">
                    <h4>导出设置</h4>
                    <div class="controls-grid">
                        <div class="control-group">
                            <label>输出格式</label>
                            <select id="dw-format">
                                <option value="image/png">PNG（无损）</option>
                                <option value="image/jpeg" selected>JPG</option>
                                <option value="image/webp">WebP</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label>输出质量: <span id="dw-quality-val">95</span>%</label>
                            <input type="range" id="dw-quality" min="10" max="100" value="95">
                        </div>
                        <div class="control-group" style="grid-column: span 2;">
                            <label>自定义导出尺寸（锁定比例，输入宽度自动计算高度）</label>
                            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                                <label style="display:flex;align-items:center;gap:6px;">
                                    <input type="checkbox" id="dw-custom-size">
                                    <span>启用自定义尺寸</span>
                                </label>
                            </div>
                            <div id="dw-custom-size-inputs" style="display:none;margin-top:8px;"></div>
                        </div>
                    </div>
                </div>

                <div id="dw-actions" class="action-bar hidden">
                    <div class="action-bar-left">
                        <span id="dw-action-info"></span>
                    </div>
                    <div class="action-bar-right">
                        <button class="btn btn-primary" id="dw-process">开始处理</button>
                    </div>
                </div>

                <div id="dw-download-section" class="hidden">
                    <div class="file-list-header">
                        <span id="dw-download-count">处理完成 0 张</span>
                        <div class="file-list-actions">
                            <button class="btn btn-sm" id="dw-download-select-all">全选</button>
                            <button class="btn btn-sm" id="dw-download-invert">反选</button>
                            <button class="btn btn-primary btn-sm" id="dw-download-zip">打包下载</button>
                        </div>
                    </div>
                    <div id="dw-download-list"></div>
                </div>

                <div id="dw-tips" style="margin-top:24px;padding:16px;background:var(--warning-bg);border:1px solid rgba(245,158,11,0.2);border-radius:var(--radius);color:var(--text-secondary);font-size:13px;line-height:1.6;">
                    <strong style="color:var(--warning);">⚠ 注意：</strong>
                    本工具并非使用高科技去除水印，纯粹是计算比例后把水印裁剪掉了，请注意图片的边缘是否有重要部分被裁掉！！！
                </div>
            </div>
        `;

        this._state = {
            files: [],
            results: [],
            idCounter: 0,
            customSizes: {},
        };

        this._bindEvents(container);
    },

    _bindEvents(container) {
        const uploadArea = container.querySelector('#dw-upload-area');
        const fileInput = container.querySelector('#dw-file-input');

        uploadArea.onclick = () => fileInput.click();
        fileInput.onchange = (e) => { this._handleFiles(e.target.files); e.target.value = ''; };

        uploadArea.ondragover = (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); };
        uploadArea.ondragleave = () => uploadArea.classList.remove('drag-over');
        uploadArea.ondrop = (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this._handleFiles(e.dataTransfer.files);
        };

        container.querySelector('#dw-select-all').onclick = () => this._toggleAll(true);
        container.querySelector('#dw-invert').onclick = () => this._invertSelection();
        container.querySelector('#dw-clear').onclick = () => this._clearFiles();

        const qualitySlider = container.querySelector('#dw-quality');
        const qualityVal = container.querySelector('#dw-quality-val');
        qualitySlider.oninput = () => { qualityVal.textContent = qualitySlider.value; };

        const customSizeCheck = container.querySelector('#dw-custom-size');
        const customSizeInputs = container.querySelector('#dw-custom-size-inputs');

        customSizeCheck.onchange = () => {
            customSizeInputs.style.display = customSizeCheck.checked ? 'block' : 'none';
            this._renderCustomSizeInputs();
        };

        container.querySelector('#dw-process').onclick = () => this._processAll();
        container.querySelector('#dw-download-select-all').onclick = () => this._toggleAllResults(true);
        container.querySelector('#dw-download-invert').onclick = () => this._invertResultSelection();
        container.querySelector('#dw-download-zip').onclick = () => this._downloadZip();
    },

    _handleFiles(fileList) {
        const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
        if (!files.length) return;

        let loadCount = 0;
        files.forEach(file => {
            const id = ++this._state.idCounter;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const ratio = this._detectRatio(img.width, img.height);
                    this._state.files.push({
                        id, file, name: file.name,
                        width: img.width, height: img.height,
                        ratio, img, thumb: e.target.result, selected: true,
                    });
                    loadCount++;
                    if (loadCount === files.length) {
                        this._updateUI();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    _detectRatio(w, h) {
        const standards = [
            { ratio: '1:1',  ow: 2048, oh: 2048 },
            { ratio: '2:3',  ow: 1672, oh: 2508 },
            { ratio: '3:4',  ow: 1773, oh: 2364 },
            { ratio: '4:3',  ow: 2364, oh: 1773 },
            { ratio: '9:16', ow: 1535, oh: 2732 },
            { ratio: '16:9', ow: 2732, oh: 1534 },
        ];

        // 第一轮：宽和高都在标准尺寸的5%内（精确匹配）
        for (const s of standards) {
            if (Math.abs(w - s.ow) / s.ow < 0.05 && Math.abs(h - s.oh) / s.oh < 0.05) {
                return s.ratio;
            }
        }

        // 第二轮：按宽高比匹配最接近的（最可靠）
        const aspect = w / h;
        let best = '1:1', bestDiff = Infinity;
        for (const s of standards) {
            const diff = Math.abs(aspect - s.ow / s.oh);
            if (diff < bestDiff) { bestDiff = diff; best = s.ratio; }
        }
        return best;
    },

    // 根据原图尺寸和目标比例，计算裁剪参数（从左上角裁剪，去掉右下角水印）
    _getCropParams(item) {
        const config = this.RATIOS[item.ratio];
        const [cw, ch] = config.crop;
        const [ow, oh] = config.orig;

        // 计算缩放比例，确保原图能覆盖裁剪区域
        const scaleX = item.width / ow;
        const scaleY = item.height / oh;
        const scale = Math.min(scaleX, scaleY);

        // 裁剪区域在原图中的实际大小
        const actualCropW = cw * scale;
        const actualCropH = ch * scale;

        // 从左上角开始裁剪（去掉右下角水印）
        return {
            srcX: 0,
            srcY: 0,
            srcW: actualCropW,
            srcH: actualCropH,
            targetW: cw,
            targetH: ch,
        };
    },

    _getUniqueRatios() {
        const ratios = new Set();
        this._state.files.filter(f => f.selected).forEach(f => ratios.add(f.ratio));
        return Array.from(ratios).sort();
    },

    _renderCustomSizeInputs() {
        const container = document.getElementById('app-content');
        const inputsDiv = container.querySelector('#dw-custom-size-inputs');
        const ratios = this._getUniqueRatios();

        if (!ratios.length) {
            inputsDiv.innerHTML = '<p style="font-size:13px;color:var(--text-muted);">请先上传图片</p>';
            return;
        }

        let html = '';
        ratios.forEach(ratio => {
            const config = this.RATIOS[ratio];
            const [cw, ch] = config.crop;
            const saved = this._state.customSizes[ratio];
            const defaultW = saved ? saved.w : cw;
            const defaultH = saved ? saved.h : ch;

            html += `
                <div class="dw-ratio-size-row" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">
                    <span style="min-width:50px;font-weight:500;">${ratio}</span>
                    <span>宽度:</span>
                    <input type="number" class="dw-ratio-width" data-ratio="${ratio}" min="1" value="${defaultW}" style="width:100px">
                    <span>px</span>
                    <span style="margin-left:8px;">高度:</span>
                    <input type="number" class="dw-ratio-height" data-ratio="${ratio}" min="1" value="${defaultH}" style="width:100px" readonly>
                    <span>px（自动计算）</span>
                </div>
            `;
        });
        html += '<p style="font-size:12px;color:var(--text-muted);margin-top:4px;">当输入分辨率高于原图时，将使用无损放大</p>';
        inputsDiv.innerHTML = html;

        inputsDiv.querySelectorAll('.dw-ratio-width').forEach(input => {
            input.oninput = () => {
                const ratio = input.dataset.ratio;
                const w = parseInt(input.value) || 0;
                const config = this.RATIOS[ratio];
                const [cw, ch] = config.crop;
                const h = w > 0 ? Math.round(ch * w / cw) : 0;
                inputsDiv.querySelector(`.dw-ratio-height[data-ratio="${ratio}"]`).value = h;
                this._state.customSizes[ratio] = { w, h };
            };
        });
    },

    _updateUI() {
        const container = document.getElementById('app-content');
        const fileList = container.querySelector('#dw-file-list');
        const settings = container.querySelector('#dw-settings');
        const actions = container.querySelector('#dw-actions');
        const hasFiles = this._state.files.length > 0;

        fileList.classList.toggle('hidden', !hasFiles);
        settings.classList.toggle('hidden', !hasFiles);
        actions.classList.toggle('hidden', !hasFiles);

        const selectedCount = this._state.files.filter(f => f.selected).length;
        container.querySelector('#dw-action-info').textContent = `已选择 ${selectedCount} 张图片`;

        this._renderFileList();
        if (container.querySelector('#dw-custom-size').checked) {
            this._renderCustomSizeInputs();
        }
    },

    _renderFileList() {
        const container = document.getElementById('app-content');
        const grid = container.querySelector('#dw-file-grid');
        const countEl = container.querySelector('#dw-count');

        countEl.textContent = `已选择 ${this._state.files.filter(f => f.selected).length} / ${this._state.files.length} 张图片`;

        grid.innerHTML = '';
        this._state.files.forEach(item => {
            const div = document.createElement('div');
            div.className = 'file-grid-item' + (item.selected ? ' selected' : '');
            div.innerHTML = `
                <div class="file-grid-thumb">
                    <img src="${item.thumb}" alt="${item.name}">
                    <div class="file-grid-check">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                </div>
                <div class="file-grid-info">
                    <span class="file-grid-name" title="${item.name}">${item.name}</span>
                    <span class="file-grid-meta">${item.width}×${item.height} · ${item.ratio}</span>
                </div>
            `;
            div.onclick = () => {
                item.selected = !item.selected;
                div.classList.toggle('selected', item.selected);
                this._updateUI();
            };
            grid.appendChild(div);
        });
    },

    _toggleAll(selectAll) {
        this._state.files.forEach(f => f.selected = selectAll);
        this._renderFileList();
        this._updateUI();
    },

    _invertSelection() {
        this._state.files.forEach(f => f.selected = !f.selected);
        this._renderFileList();
        this._updateUI();
    },

    _clearFiles() {
        this._state.files = [];
        this._state.results = [];
        this._state.customSizes = {};
        this._renderFileList();
        this._updateUI();
        this._renderDownloadList();
    },

    async _processAll() {
        const container = document.getElementById('app-content');
        const processBtn = container.querySelector('#dw-process');
        const selectedFiles = this._state.files.filter(f => f.selected);
        if (!selectedFiles.length) return;

        const format = container.querySelector('#dw-format').value;
        const quality = parseInt(container.querySelector('#dw-quality').value) / 100;
        const useCustomSize = container.querySelector('#dw-custom-size').checked;

        processBtn.disabled = true;
        processBtn.textContent = '处理中...';
        this._state.results = [];

        for (let i = 0; i < selectedFiles.length; i++) {
            const item = selectedFiles[i];
            processBtn.textContent = `处理中 ${i + 1}/${selectedFiles.length}...`;
            try {
                const customW = useCustomSize && this._state.customSizes[item.ratio]
                    ? this._state.customSizes[item.ratio].w : 0;
                const result = await this._processImage(item, format, quality, useCustomSize, customW);
                this._state.results.push(result);
            } catch (err) {
                console.error('处理失败:', item.name, err);
            }
        }

        processBtn.disabled = false;
        processBtn.textContent = '开始处理';
        this._renderDownloadList();
    },

    _processImage(item, format, quality, useCustomSize, customWidth) {
        return new Promise((resolve) => {
            const config = this.RATIOS[item.ratio];
            const [cw, ch] = config.crop;

            // 目标输出尺寸
            let targetW, targetH;
            if (useCustomSize && customWidth > 0) {
                targetW = customWidth;
                targetH = Math.round(ch * customWidth / cw);
            } else {
                targetW = cw;
                targetH = ch;
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');

            // 从图片中心点开始裁剪 cw × ch 大小的区域
            const srcX = (item.width - cw) / 2;
            const srcY = (item.height - ch) / 2;
            ctx.drawImage(item.img, srcX, srcY, cw, ch, 0, 0, targetW, targetH);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const baseName = item.name.replace(/\.[^.]+$/, '');
                const ext = format === 'image/png' ? '.png' : format === 'image/webp' ? '.webp' : '.jpg';
                resolve({
                    id: item.id, blob, url,
                    name: baseName + '_去水印' + ext,
                    originalName: item.name, ratio: item.ratio,
                    origSize: `${item.width}×${item.height}`,
                    newSize: `${targetW}×${targetH}`,
                    selected: true, thumb: url,
                });
            }, format, quality);
        });
    },

    _renderDownloadList() {
        const container = document.getElementById('app-content');
        const section = container.querySelector('#dw-download-section');
        const listDiv = container.querySelector('#dw-download-list');
        const countEl = container.querySelector('#dw-download-count');

        if (!this._state.results.length) {
            section.classList.add('hidden');
            return;
        }

        section.classList.remove('hidden');
        const selectedCount = this._state.results.filter(r => r.selected).length;
        countEl.textContent = `处理完成 ${selectedCount} / ${this._state.results.length} 张`;

        listDiv.innerHTML = '';
        this._state.results.forEach(item => {
            const div = document.createElement('div');
            div.className = 'dw-download-item' + (item.selected ? ' selected' : '');
            div.innerHTML = `
                <label class="dw-download-check">
                    <input type="checkbox" ${item.selected ? 'checked' : ''}>
                </label>
                <div class="dw-download-thumb" data-url="${item.url}">
                    <img src="${item.thumb}" alt="${item.name}">
                </div>
                <div class="dw-download-info">
                    <span class="dw-download-name">${item.name}</span>
                    <span class="dw-download-meta">${item.origSize} → ${item.newSize} · ${item.ratio}</span>
                </div>
                <button class="btn btn-sm dw-single-download">下载</button>
            `;
            const checkbox = div.querySelector('input[type="checkbox"]');
            checkbox.onchange = () => {
                item.selected = checkbox.checked;
                div.classList.toggle('selected', item.selected);
                countEl.textContent = `处理完成 ${this._state.results.filter(r => r.selected).length} / ${this._state.results.length} 张`;
            };
            const thumb = div.querySelector('.dw-download-thumb');
            thumb.onclick = () => this._showPreview(item.url);
            const dlBtn = div.querySelector('.dw-single-download');
            dlBtn.onclick = () => this._downloadSingle(item);
            listDiv.appendChild(div);
        });
    },

    _showPreview(url) {
        const existing = document.getElementById('dw-lightbox');
        if (existing) existing.remove();

        const lightbox = document.createElement('div');
        lightbox.id = 'dw-lightbox';
        lightbox.className = 'dw-lightbox';
        lightbox.innerHTML = `
            <div class="dw-lightbox-backdrop"></div>
            <div class="dw-lightbox-content">
                <img src="${url}" alt="preview">
            </div>
            <button class="dw-lightbox-close">&times;</button>
        `;
        document.body.appendChild(lightbox);

        const close = () => { lightbox.remove(); };
        lightbox.querySelector('.dw-lightbox-backdrop').onclick = close;
        lightbox.querySelector('.dw-lightbox-close').onclick = close;
        lightbox.onclick = (e) => { if (e.target === lightbox) close(); };
    },

    _toggleAllResults(selectAll) {
        this._state.results.forEach(r => r.selected = selectAll);
        this._renderDownloadList();
    },

    _invertResultSelection() {
        this._state.results.forEach(r => r.selected = !r.selected);
        this._renderDownloadList();
    },

    _downloadSingle(item) {
        const a = document.createElement('a');
        a.href = item.url;
        a.download = item.name;
        a.click();
    },

    async _downloadZip() {
        const selected = this._state.results.filter(r => r.selected);
        if (!selected.length) return;

        const zip = new JSZip();
        for (const item of selected) {
            const arrayBuffer = await item.blob.arrayBuffer();
            zip.file(item.name, arrayBuffer);
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = '豆包去水印_' + new Date().toISOString().slice(0, 10) + '.zip';
        a.click();
        URL.revokeObjectURL(a.href);
    },
};
