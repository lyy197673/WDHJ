// ===== PPT Tools Module =====
// Sub-tools: split (拆分), convert (转换), compress (压缩)

const PPTTools = {

    render(container, subTool) {
        const sub = subTool || 'split';

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>PPT工具</h2>
                    <p>拆分 · 转换 · 压缩 — 纯本地处理，隐私安全</p>
                </div>
                <div class="tool-tabs" id="ppt-tabs">
                    <button class="tool-tab${sub === 'split' ? ' active' : ''}" data-sub="split">拆分</button>
                    <button class="tool-tab${sub === 'convert' ? ' active' : ''}" data-sub="convert">转换</button>
                    <button class="tool-tab${sub === 'compress' ? ' active' : ''}" data-sub="compress">压缩</button>
                </div>
                <div id="ppt-content"></div>
            </div>
        `;

        const tabs = container.querySelectorAll('.tool-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                window.location.hash = '/ppt/' + tab.dataset.sub;
            };
        });

        const content = container.querySelector('#ppt-content');
        switch (sub) {
            case 'convert': this.renderConvert(content); break;
            case 'compress': this.renderCompress(content); break;
            default: this.renderSplit(content); break;
        }
    },

    // =============================================
    // Sub-tool 1: 拆分 (Split PPTX)
    // =============================================
    renderSplit(container) {
        const state = {
            file: null,
            fileName: '',
            pptxArrayBuffer: null,
            totalPages: 0,
            pages: [],            // { id, pageNum, thumbUrl }
            activeMode: 'single', // 'single' | 'extract' | 'group'
            groups: [],           // { id, startPage, endPage, name }
            results: []           // { name, blob } for download
        };

        container.innerHTML = `
            <div id="split-upload"></div>
            <div id="split-info" class="stats-row hidden">
                <div class="stat-card">
                    <div class="stat-value" id="split-stat-pages">0</div>
                    <div class="stat-label">总页数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="split-stat-size">0 B</div>
                    <div class="stat-label">文件大小</div>
                </div>
            </div>
            <div id="split-pages" class="file-list hidden">
                <div class="file-list-header">
                    <span id="split-page-count">共 0 页</span>
                </div>
                <div class="pdf-page-grid" id="split-grid"></div>
            </div>
            <div id="split-modes" class="hidden">
                <div class="tool-tabs" id="split-mode-tabs">
                    <button class="tool-tab active" data-mode="single">拆分为单独页面</button>
                    <button class="tool-tab" data-mode="extract">提取指定页面</button>
                    <button class="tool-tab" data-mode="group">分组拆分</button>
                </div>
                <div id="split-mode-content"></div>
            </div>
            <div id="split-results" class="file-list hidden">
                <div class="file-list-header">
                    <span id="split-result-count">拆分结果</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="split-res-select-all">全选</button>
                        <button class="btn btn-sm" id="split-res-invert">反选</button>
                        <button class="btn btn-primary btn-sm" id="split-res-dl-selected">下载选中 (ZIP)</button>
                    </div>
                </div>
                <div class="file-list-view" id="split-result-list"></div>
            </div>
            <div id="split-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="split-result-info"></span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="split-execute">执行拆分</button>
                </div>
            </div>
        `;

        const el = {
            upload: container.querySelector('#split-upload'),
            info: container.querySelector('#split-info'),
            statPages: container.querySelector('#split-stat-pages'),
            statSize: container.querySelector('#split-stat-size'),
            pagesSection: container.querySelector('#split-pages'),
            pageCount: container.querySelector('#split-page-count'),
            grid: container.querySelector('#split-grid'),
            modesSection: container.querySelector('#split-modes'),
            modeTabs: container.querySelector('#split-mode-tabs'),
            modeContent: container.querySelector('#split-mode-content'),
            resultsSection: container.querySelector('#split-results'),
            resultList: container.querySelector('#split-result-list'),
            resultCount: container.querySelector('#split-result-count'),
            btnResSelectAll: container.querySelector('#split-res-select-all'),
            btnResInvert: container.querySelector('#split-res-invert'),
            btnResDlSelected: container.querySelector('#split-res-dl-selected'),
            actions: container.querySelector('#split-actions'),
            resultInfo: container.querySelector('#split-result-info'),
            btnExecute: container.querySelector('#split-execute')
        };

        // ---- Helpers ----
        function parsePageRange(str, maxPages) {
            const indices = [];
            const parts = str.split(',');
            for (const part of parts) {
                const trimmed = part.trim();
                if (!trimmed) continue;
                if (trimmed.includes('-')) {
                    const [startStr, endStr] = trimmed.split('-');
                    let start = parseInt(startStr, 10);
                    let end = parseInt(endStr, 10);
                    if (isNaN(start) || isNaN(end)) continue;
                    start = Utils.clamp(start, 1, maxPages);
                    end = Utils.clamp(end, 1, maxPages);
                    if (start > end) { const tmp = start; start = end; end = tmp; }
                    for (let i = start; i <= end; i++) {
                        if (!indices.includes(i - 1)) indices.push(i - 1);
                    }
                } else {
                    const num = parseInt(trimmed, 10);
                    if (!isNaN(num) && num >= 1 && num <= maxPages) {
                        if (!indices.includes(num - 1)) indices.push(num - 1);
                    }
                }
            }
            return indices.sort((a, b) => a - b);
        }

        function showSections(hasFile) {
            el.info.classList.toggle('hidden', !hasFile);
            el.pagesSection.classList.toggle('hidden', !hasFile);
            el.modesSection.classList.toggle('hidden', !hasFile);
            el.actions.classList.toggle('hidden', !hasFile);
        }

        function updateResultInfo() {
            if (state.results.length > 0) {
                el.resultInfo.textContent = `已生成 ${state.results.length} 个文件`;
            } else {
                el.resultInfo.textContent = '';
            }
        }

        // ---- Results selection state ----
        const resultSelection = new Set();

        // ---- Render split results list with checkboxes and download buttons ----
        function renderSplitResults() {
            if (state.results.length === 0) {
                el.resultsSection.classList.add('hidden');
                return;
            }

            el.resultsSection.classList.remove('hidden');
            el.resultCount.textContent = `已生成 ${state.results.length} 个文件`;
            el.resultList.innerHTML = '';

            if (resultSelection.size === 0) {
                state.results.forEach((item, idx) => resultSelection.add(idx));
            }

            state.results.forEach((item, idx) => {
                const checked = resultSelection.has(idx);
                const row = document.createElement('div');
                row.className = 'file-list-row' + (checked ? ' selected' : '');
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${checked ? 'checked' : ''}>
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${item.name}</div>
                        <div class="file-list-row-meta">${Utils.formatSize(item.blob.size)}</div>
                    </div>
                    <button class="btn btn-sm btn-primary result-dl-btn">下载</button>
                `;
                row.querySelector('.file-cb').onchange = () => {
                    if (resultSelection.has(idx)) {
                        resultSelection.delete(idx);
                        row.classList.remove('selected');
                    } else {
                        resultSelection.add(idx);
                        row.classList.add('selected');
                    }
                };
                row.querySelector('.result-dl-btn').onclick = () => {
                    Utils.downloadBlob(item.blob, item.name);
                };
                el.resultList.appendChild(row);
            });
        }

        // ---- Result selection buttons ----
        el.btnResSelectAll.onclick = () => {
            state.results.forEach((item, idx) => resultSelection.add(idx));
            renderSplitResults();
        };

        el.btnResInvert.onclick = () => {
            const newSet = new Set();
            state.results.forEach((item, idx) => {
                if (!resultSelection.has(idx)) newSet.add(idx);
            });
            resultSelection.clear();
            newSet.forEach(id => resultSelection.add(id));
            renderSplitResults();
        };

        el.btnResDlSelected.onclick = async () => {
            const selected = state.results.filter((item, idx) => resultSelection.has(idx));
            if (selected.length === 0) {
                Toast.warning('请先勾选要下载的文件');
                return;
            }
            await batchDownload(selected);
        };

        // ---- Render slide thumbnails ----
        function renderPageGrid() {
            el.grid.innerHTML = '';
            state.pages.forEach(page => {
                const div = document.createElement('div');
                div.className = 'pdf-page-item';
                div.dataset.pageNum = page.pageNum;

                const img = document.createElement('img');
                img.src = page.thumbUrl;
                img.style.width = '100%';
                img.style.display = 'block';
                img.style.cursor = 'pointer';
                img.onclick = (e) => {
                    e.stopPropagation();
                    const images = state.pages.map(p => p.thumbUrl);
                    const idx = state.pages.findIndex(p => p.id === page.id);
                    Lightbox.open(images, idx);
                };

                const pageNum = document.createElement('div');
                pageNum.className = 'page-num';
                pageNum.textContent = `第 ${page.pageNum} 页`;

                div.appendChild(img);
                div.appendChild(pageNum);
                el.grid.appendChild(div);
            });
            el.pageCount.textContent = `共 ${state.totalPages} 页`;
        }

        // ---- Create a thumbnail for a slide (text-based placeholder) ----
        function createSlideThumb(slideNum, text) {
            const w = 280, h = 200;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            // White slide background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            // Border
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
            // Slide icon
            ctx.fillStyle = '#e5e7eb';
            ctx.fillRect(w / 2 - 24, 40, 48, 36);
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(w / 2 - 24, 40, 48, 36);
            // Small triangle (play icon) inside
            ctx.fillStyle = '#9ca3af';
            ctx.beginPath();
            ctx.moveTo(w / 2 - 8, 52);
            ctx.lineTo(w / 2 + 12, 60);
            ctx.lineTo(w / 2 - 8, 68);
            ctx.closePath();
            ctx.fill();
            // Text preview
            if (text) {
                ctx.font = '12px sans-serif';
                ctx.fillStyle = '#4b5563';
                ctx.textAlign = 'center';
                const lines = [];
                for (let pos = 0; pos < text.length && lines.length < 3; pos += 22) {
                    const line = text.slice(pos, pos + 22);
                    lines.push(line.length < 22 ? line : line + '...');
                    if (lines.length >= 3) break;
                }
                lines.forEach((line, idx) => {
                    ctx.fillText(line, w / 2, 100 + idx * 18);
                });
            }
            // Bottom bar with slide number
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, h - 30, w, 30);
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h - 30);
            ctx.lineTo(w, h - 30);
            ctx.stroke();
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`幻灯片 ${slideNum}`, w / 2, h - 12);
            return canvas.toDataURL('image/png');
        }

        // ---- Mode rendering ----
        const MODE_ORDER = ['single', 'extract', 'group'];
        function renderModeContent() {
            state.results = [];
            el.resultsSection.classList.add('hidden');
            updateResultInfo();

            switchTabContent(el.modeContent, MODE_ORDER.indexOf(state.activeMode), () => {
                if (state.activeMode === 'single') {
                    renderSingleMode();
                } else if (state.activeMode === 'extract') {
                    renderExtractMode();
                } else if (state.activeMode === 'group') {
                    renderGroupMode();
                }
            });
        }

        function renderSingleMode() {
            el.modeContent.innerHTML = `
                <div class="controls-panel" style="margin-top:12px">
                    <p style="color:var(--text-secondary);margin:0">将 PPT 的每一页拆分为独立的 PPTX 文件。共会产生 ${state.totalPages} 个文件。</p>
                </div>
            `;
        }

        function renderExtractMode() {
            el.modeContent.innerHTML = `
                <div class="controls-panel" style="margin-top:12px">
                    <div class="control-group">
                        <label>页面范围</label>
                        <input type="text" id="split-extract-range" placeholder="例如: 1-5,8,10-12" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:14px;background:var(--bg);color:var(--text)">
                        <p style="color:var(--text-secondary);font-size:12px;margin:4px 0 0">输入页码范围，用逗号分隔。例如: 1-5,8,10-12</p>
                    </div>
                </div>
            `;
        }

        function renderGroupMode() {
            el.modeContent.innerHTML = `
                <div class="controls-panel" style="margin-top:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                        <span style="color:var(--text-secondary)">创建分组，每组生成一个 PPTX 文件</span>
                        <button class="btn btn-sm btn-primary" id="split-add-group">创建分组</button>
                    </div>
                    <div class="split-groups" id="split-groups-list"></div>
                </div>
            `;

            container.querySelector('#split-add-group').onclick = () => {
                state.groups.push({
                    id: Utils.uid(),
                    startPage: 1,
                    endPage: state.totalPages,
                    name: ''
                });
                renderGroupsList();
            };

            renderGroupsList();
        }

        function renderGroupsList() {
            const list = container.querySelector('#split-groups-list');
            if (!list) return;
            list.innerHTML = '';

            if (state.groups.length === 0) {
                list.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:16px">暂无分组，点击"创建分组"添加</p>';
                return;
            }

            state.groups.forEach((group, idx) => {
                const item = document.createElement('div');
                item.className = 'split-group-item';
                item.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;background:var(--bg)';
                item.innerHTML = `
                    <span style="font-weight:600;min-width:50px">分组 ${idx + 1}</span>
                    <input type="number" class="split-group-start" min="1" max="${state.totalPages}" value="${group.startPage}" style="width:70px;padding:6px 8px;border:1px solid var(--border);border-radius:4px;font-size:13px;background:var(--bg);color:var(--text);text-align:center" title="起始页">
                    <span>-</span>
                    <input type="number" class="split-group-end" min="1" max="${state.totalPages}" value="${group.endPage}" style="width:70px;padding:6px 8px;border:1px solid var(--border);border-radius:4px;font-size:13px;background:var(--bg);color:var(--text);text-align:center" title="结束页">
                    <input type="text" class="split-group-name" value="${group.name}" placeholder="分组名称" style="flex:1;padding:6px 8px;border:1px solid var(--border);border-radius:4px;font-size:13px;background:var(--bg);color:var(--text)" title="分组名称">
                    <button class="btn btn-sm btn-danger split-group-delete" title="删除">删除</button>
                `;

                const startInput = item.querySelector('.split-group-start');
                const endInput = item.querySelector('.split-group-end');
                const nameInput = item.querySelector('.split-group-name');
                const deleteBtn = item.querySelector('.split-group-delete');

                startInput.onchange = () => {
                    group.startPage = Utils.clamp(parseInt(startInput.value, 10) || 1, 1, state.totalPages);
                    startInput.value = group.startPage;
                };
                endInput.onchange = () => {
                    group.endPage = Utils.clamp(parseInt(endInput.value, 10) || 1, 1, state.totalPages);
                    endInput.value = group.endPage;
                };
                nameInput.oninput = () => {
                    group.name = nameInput.value;
                };
                deleteBtn.onclick = () => {
                    state.groups = state.groups.filter(g => g.id !== group.id);
                    renderGroupsList();
                };

                list.appendChild(item);
            });
        }

        // ---- Tab mode switching ----
        function initModeTabs() {
            const tabs = el.modeTabs.querySelectorAll('.tool-tab');
            tabs.forEach(tab => {
                tab.onclick = () => {
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    state.activeMode = tab.dataset.mode;
                    renderModeContent();
                };
            });
        }

        // ---- Upload ----
        FileUpload.createUploadArea(el.upload, {
            accept: '.pptx',
            multiple: false,
            hint: '支持单个 PPTX 文件',
            onFiles: async (files) => {
                const file = files.find(f => f.name.toLowerCase().endsWith('.pptx'));
                if (!file) {
                    Toast.warning('请选择 PPTX 文件');
                    return;
                }

                if (typeof JSZip === 'undefined') {
                    Toast.error('JSZip 库未加载，请检查网络连接');
                    return;
                }

                Loading.show('正在加载 PPT...');

                try {
                    state.file = file;
                    state.fileName = file.name;
                    state.pages = [];
                    state.groups = [];
                    state.results = [];
                    resultSelection.clear();
                    el.resultsSection.classList.add('hidden');

                    const arrayBuffer = await Utils.readAsArrayBuffer(file);
                    state.pptxArrayBuffer = arrayBuffer;

                    const zip = await JSZip.loadAsync(arrayBuffer);

                    // Find all slide XML files
                    const slideFiles = [];
                    zip.forEach((path, entry) => {
                        if (/^ppt\/slides\/slide\d+\.xml$/.test(path) && !entry.dir) {
                            slideFiles.push({ path, entry });
                        }
                    });

                    slideFiles.sort((a, b) => {
                        const numA = parseInt(a.path.match(/slide(\d+)\.xml/)[1]);
                        const numB = parseInt(b.path.match(/slide(\d+)\.xml/)[1]);
                        return numA - numB;
                    });

                    state.totalPages = slideFiles.length;

                    for (let i = 0; i < slideFiles.length; i++) {
                        Loading.progress(Math.round((i + 1) / slideFiles.length * 80));
                        Loading.setText(`正在渲染第 ${i + 1} 页幻灯片...`);

                        const { entry } = slideFiles[i];
                        const xml = await entry.async('string');
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(xml, 'application/xml');
                        const textNodes = doc.querySelectorAll('a\\:t, t');
                        const texts = [];
                        textNodes.forEach(node => {
                            const t = node.textContent.trim();
                            if (t) texts.push(t);
                        });
                        const slideText = texts.join(' ');
                        const thumbUrl = createSlideThumb(i + 1, slideText);

                        state.pages.push({
                            id: Utils.uid(),
                            pageNum: i + 1,
                            thumbUrl: thumbUrl
                        });
                    }

                    Loading.hide();

                    renderPageGrid();
                    showSections(true);
                    initModeTabs();
                    renderModeContent();

                    el.statPages.textContent = state.totalPages;
                    el.statSize.textContent = Utils.formatSize(file.size);

                    Toast.success(`已加载 PPT，共 ${state.totalPages} 页`);
                } catch (err) {
                    Loading.hide();
                    console.error('Failed to load PPT:', err);
                    Toast.error('PPT 加载失败: ' + err.message);
                }
            }
        });

        // ---- Create PPTX with specific slides ----
        async function createPptxWithSlides(indices) {
            const zip = await JSZip.loadAsync(state.pptxArrayBuffer);

            // 1. Parse presentation.xml.rels: map rId -> slide number
            const presRelsXml = await zip.file('ppt/_rels/presentation.xml.rels').async('string');
            const ridToSlideNum = {};
            const relsRe = /\bId="(rId\d+)"[^>]*Target="slides[\/]slide(\d+)\.xml"/gi;
            let m;
            while ((m = relsRe.exec(presRelsXml)) !== null) {
                ridToSlideNum[m[1]] = parseInt(m[2], 10);
            }

            // 2. Parse presentation.xml: extract sldId entries (namespace-agnostic)
            const presXml = await zip.file('ppt/presentation.xml').async('string');
            const sldIdRe = /<\w*?:?sldId\b[^>]*?\br:id="(rId\d+)"[^>]*?\/>/gi;
            const origEntries = [];
            while ((m = sldIdRe.exec(presXml)) !== null) {
                const rid = m[1];
                const slideNum = ridToSlideNum[rid];
                if (slideNum) {
                    origEntries.push({ rId: rid, slideNum });
                }
            }

            // 3. Remove unwanted slide files
            const keepSet = new Set(indices);
            for (let i = 0; i < origEntries.length; i++) {
                if (!keepSet.has(i)) {
                    const num = origEntries[i].slideNum;
                    zip.remove(`ppt/slides/slide${num}.xml`);
                    zip.remove(`ppt/slides/_rels/slide${num}.xml.rels`);
                }
            }

            // 4. Rebuild presentation.xml: replace entire sldIdLst block
            const keptEntries = indices.map(i => origEntries[i]).filter(Boolean);
            const newSldIdXml = keptEntries.map((e, idx) =>
                `<p:sldId id="${256 + idx}" r:id="${e.rId}"/>`
            ).join('');
            const blockRe = /<\w*?:?sldIdLst\b[^>]*>[\s\S]*?<\/\w*?:?sldIdLst\s*>/;
            const newPresXml = presXml.replace(blockRe,
                `<p:sldIdLst>${newSldIdXml}</p:sldIdLst>`
            );
            zip.file('ppt/presentation.xml', newPresXml);

            // 5. Generate new PPTX
            return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
        }

        // ---- Execute split ----
        el.btnExecute.onclick = async () => {
            if (!state.pptxArrayBuffer) {
                Toast.warning('请先上传 PPT 文件');
                return;
            }

            Loading.show('正在拆分 PPT...');

            try {
                const baseName = Utils.getBaseName(state.fileName) || 'PPT';
                const results = [];

                if (state.activeMode === 'single') {
                    for (let i = 0; i < state.totalPages; i++) {
                        Loading.progress(Math.round((i + 1) / state.totalPages * 100));
                        Loading.setText(`正在拆分第 ${i + 1} 页...`);

                        const blob = await createPptxWithSlides([i]);
                        results.push({
                            name: `${baseName}_第${i + 1}页.pptx`,
                            blob: blob
                        });
                    }
                } else if (state.activeMode === 'extract') {
                    const rangeInput = container.querySelector('#split-extract-range');
                    if (!rangeInput || !rangeInput.value.trim()) {
                        Loading.hide();
                        Toast.warning('请输入页面范围');
                        return;
                    }

                    const indices = parsePageRange(rangeInput.value.trim(), state.totalPages);
                    if (indices.length === 0) {
                        Loading.hide();
                        Toast.warning('未解析到有效的页面范围');
                        return;
                    }

                    Loading.setText('正在提取页面...');

                    const blob = await createPptxWithSlides(indices);

                    const rangeStr = rangeInput.value.trim().replace(/\s+/g, '');
                    results.push({
                        name: `${baseName}_${rangeStr}.pptx`,
                        blob: blob
                    });
                } else if (state.activeMode === 'group') {
                    if (state.groups.length === 0) {
                        Loading.hide();
                        Toast.warning('请先创建至少一个分组');
                        return;
                    }

                    for (let g = 0; g < state.groups.length; g++) {
                        const group = state.groups[g];
                        Loading.progress(Math.round((g + 1) / state.groups.length * 100));
                        Loading.setText(`正在拆分分组 ${g + 1}...`);

                        const startIdx = Utils.clamp(group.startPage, 1, state.totalPages) - 1;
                        const endIdx = Utils.clamp(group.endPage, 1, state.totalPages) - 1;
                        const lo = Math.min(startIdx, endIdx);
                        const hi = Math.max(startIdx, endIdx);

                        const pageIndices = [];
                        for (let i = lo; i <= hi; i++) {
                            pageIndices.push(i);
                        }

                        if (pageIndices.length === 0) continue;

                        const blob = await createPptxWithSlides(pageIndices);

                        const groupName = group.name ? `_${group.name}` : '';
                        results.push({
                            name: `${baseName}${groupName}.pptx`,
                            blob: blob
                        });
                    }
                }

                Loading.hide();

                if (results.length === 0) {
                    Toast.warning('未生成任何文件');
                    return;
                }

                state.results = results;
                renderSplitResults();
                updateResultInfo();
                Toast.success(`拆分完成，共生成 ${results.length} 个文件`);
            } catch (err) {
                Loading.hide();
                console.error('Split failed:', err);
                Toast.error('拆分失败: ' + err.message);
            }
        };
    },

    // =============================================
    // Sub-tool 2: 转换 (Image to PPT)
    // =============================================
    renderConvert(container) {
        const state = {
            files: [],        // { id, file, name, size, thumb, dataUrl, img }
            layout: 'fit',
            size: '16:9',
            resultBlob: null,
            resultName: ''
        };

        container.innerHTML = `
            <div id="convert-upload"></div>
            <div id="convert-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="convert-count">已添加 0 张图片</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="convert-select-all">全选</button>
                        <button class="btn btn-sm" id="convert-invert">反选</button>
                        <button class="btn btn-sm" id="convert-clear">清空</button>
                    </div>
                </div>
                <div class="file-grid" id="convert-grid"></div>
            </div>
            <div id="convert-controls" class="controls-panel hidden">
                <h4>PPT设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>幻灯片布局</label>
                        <div class="layout-options" id="convert-layouts">
                            <div class="layout-option active" data-layout="fit">适应 (Fit)</div>
                            <div class="layout-option" data-layout="fill">填充 (Fill)</div>
                            <div class="layout-option" data-layout="center">居中 (Center)</div>
                        </div>
                    </div>
                    <div class="control-group">
                        <label>幻灯片尺寸</label>
                        <div class="layout-options" id="convert-sizes">
                            <div class="layout-option active" data-size="16:9">16:9 宽屏</div>
                            <div class="layout-option" data-size="4:3">4:3 标准</div>
                        </div>
                    </div>
                </div>
                <div class="control-group" style="margin-top:8px">
                    <p style="font-size:13px;color:var(--text-secondary);margin:0">
                        <strong>适应</strong>：图片等比缩放，完整显示在幻灯片内（可能有留白）<br>
                        <strong>填充</strong>：图片等比缩放填满幻灯片，超出部分裁剪<br>
                        <strong>居中</strong>：图片保持原始大小，居中放置
                    </p>
                </div>
            </div>
            <div id="convert-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="convert-action-info"></span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="convert-generate">生成PPT</button>
                </div>
            </div>
            <div id="convert-result" class="file-list hidden">
                <div class="file-list-header">
                    <span>生成结果</span>
                </div>
                <div class="file-list-view" id="convert-result-list"></div>
            </div>
        `;

        const el = {
            upload: container.querySelector('#convert-upload'),
            filesSection: container.querySelector('#convert-files'),
            grid: container.querySelector('#convert-grid'),
            count: container.querySelector('#convert-count'),
            controls: container.querySelector('#convert-controls'),
            layoutOptions: container.querySelector('#convert-layouts'),
            sizeOptions: container.querySelector('#convert-sizes'),
            actions: container.querySelector('#convert-actions'),
            actionInfo: container.querySelector('#convert-action-info'),
            btnGenerate: container.querySelector('#convert-generate'),
            resultSection: container.querySelector('#convert-result'),
            resultList: container.querySelector('#convert-result-list')
        };

        FileUpload.createUploadArea(el.upload, {
            accept: 'image/*',
            multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式，每张图片生成一页幻灯片',
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
                        state.files.push({ id, file, name: file.name, size: file.size, thumb, dataUrl, img });
                    } catch (e) {
                        console.error('Failed to load image:', file.name, e);
                    }
                    Loading.progress(Math.round((i + 1) / imageFiles.length * 100));
                }
                Loading.hide();

                renderFileGrid();
                Toast.success(`已添加 ${imageFiles.length} 张图片`);
            }
        });

        function renderFileGrid() {
            if (state.files.length === 0) {
                el.filesSection.classList.add('hidden');
                el.controls.classList.add('hidden');
                el.actions.classList.add('hidden');
                return;
            }

            el.filesSection.classList.remove('hidden');
            el.controls.classList.remove('hidden');
            el.actions.classList.remove('hidden');

            el.grid.innerHTML = '';
            state.files.forEach((item) => {
                const div = document.createElement('div');
                div.className = 'file-item sortable-item';
                div.dataset.id = item.id;
                div.draggable = true;
                div.innerHTML = `
                    <button class="file-item-remove" title="删除">&times;</button>
                    <img class="file-item-thumb" src="${item.thumb}" alt="${item.name}">
                    <div class="file-item-name" title="${item.name}">${item.name}</div>
                    <div class="file-item-size">${Utils.formatSize(item.size)}</div>
                `;

                div.querySelector('.file-item-remove').onclick = (e) => {
                    e.stopPropagation();
                    state.files = state.files.filter(f => f.id !== item.id);
                    renderFileGrid();
                };

                el.grid.appendChild(div);
            });

            Utils.makeSortable(el.grid, () => {
                const ids = Array.from(el.grid.children).map(child => child.dataset.id);
                state.files.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            });

            updateCount();
        }

        function updateCount() {
            el.count.textContent = `已添加 ${state.files.length} 张图片`;
            el.actionInfo.textContent = `共 ${state.files.length} 张图片，将生成 ${state.files.length} 页幻灯片`;
        }

        container.querySelector('#convert-select-all').onclick = () => {
            Toast.info('所有图片都会生成到PPT中');
        };

        container.querySelector('#convert-invert').onclick = () => {
            Toast.info('所有图片都会生成到PPT中');
        };

        container.querySelector('#convert-clear').onclick = () => {
            state.files = [];
            state.resultBlob = null;
            state.resultName = '';
            renderFileGrid();
            el.resultSection.classList.add('hidden');
            el.resultList.innerHTML = '';
        };

        el.layoutOptions.querySelectorAll('.layout-option').forEach(opt => {
            opt.onclick = () => {
                el.layoutOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.layout = opt.dataset.layout;
            };
        });

        el.sizeOptions.querySelectorAll('.layout-option').forEach(opt => {
            opt.onclick = () => {
                el.sizeOptions.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.size = opt.dataset.size;
            };
        });

        el.btnGenerate.onclick = async () => {
            if (state.files.length === 0) {
                Toast.warning('请先上传图片');
                return;
            }

            if (typeof PptxGenJS === 'undefined') {
                Toast.error('PptxGenJS 库未加载，请检查网络连接');
                return;
            }

            Loading.show('正在生成PPT...');

            try {
                const pptx = new PptxGenJS();

                if (state.size === '16:9') {
                    pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
                    pptx.layout = 'WIDE';
                } else {
                    pptx.defineLayout({ name: 'STANDARD', width: 10, height: 7.5 });
                    pptx.layout = 'STANDARD';
                }

                const slideW = state.size === '16:9' ? 13.33 : 10;
                const slideH = 7.5;

                for (let i = 0; i < state.files.length; i++) {
                    const item = state.files[i];
                    Loading.progress(Math.round((i + 1) / state.files.length * 80));
                    Loading.setText(`正在处理 ${item.name} (${i + 1}/${state.files.length})...`);

                    const slide = pptx.addSlide();
                    const imgW = item.img.naturalWidth;
                    const imgH = item.img.naturalHeight;
                    const imgRatio = imgW / imgH;
                    const slideRatio = slideW / slideH;

                    if (state.layout === 'fit') {
                        let w, h, x, y;
                        if (imgRatio > slideRatio) {
                            w = slideW;
                            h = slideW / imgRatio;
                            x = 0;
                            y = (slideH - h) / 2;
                        } else {
                            h = slideH;
                            w = slideH * imgRatio;
                            x = (slideW - w) / 2;
                            y = 0;
                        }
                        slide.addImage({ data: item.dataUrl, x, y, w, h });
                    } else if (state.layout === 'fill') {
                        let w, h, x, y;
                        if (imgRatio > slideRatio) {
                            h = slideH;
                            w = slideH * imgRatio;
                            x = (slideW - w) / 2;
                            y = 0;
                        } else {
                            w = slideW;
                            h = slideW / imgRatio;
                            x = 0;
                            y = (slideH - h) / 2;
                        }
                        slide.addImage({ data: item.dataUrl, x, y, w, h });
                    } else {
                        const maxW = slideW * 0.8;
                        const maxH = slideH * 0.8;
                        let w = imgW / 96;
                        let h = imgH / 96;
                        if (w > maxW || h > maxH) {
                            const scale = Math.min(maxW / w, maxH / h);
                            w *= scale;
                            h *= scale;
                        }
                        const x = (slideW - w) / 2;
                        const y = (slideH - h) / 2;
                        slide.addImage({ data: item.dataUrl, x, y, w, h });
                    }
                }

                Loading.setText('正在导出PPT文件...');
                Loading.progress(90);

                const blob = await pptx.write({ outputType: 'blob' });
                state.resultBlob = blob;
                state.resultName = `图片演示_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.pptx`;

                Loading.progress(100);
                Loading.hide();

                renderConvertResult();
                Toast.success(`PPT已生成，共 ${state.files.length} 页`);

            } catch (err) {
                Loading.hide();
                console.error('PPT generation failed:', err);
                Toast.error('PPT生成失败: ' + (err.message || '未知错误'));
            }
        };

        function renderConvertResult() {
            if (!state.resultBlob) {
                el.resultSection.classList.add('hidden');
                return;
            }

            el.resultSection.classList.remove('hidden');
            el.resultList.innerHTML = '';

            const row = document.createElement('div');
            row.className = 'file-list-row';
            row.innerHTML = `
                <div class="file-list-row-info">
                    <div class="file-list-row-name">${state.resultName}</div>
                    <div class="file-list-row-meta">
                        <span>PPTX</span>
                        <span>${state.files.length} 页</span>
                        <span>${Utils.formatSize(state.resultBlob.size)}</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary" id="convert-dl-btn">下载</button>
            `;

            row.querySelector('#convert-dl-btn').onclick = () => {
                Utils.downloadBlob(state.resultBlob, state.resultName);
            };

            el.resultList.appendChild(row);
        }
    },

    // =============================================
    // Sub-tool 3: 压缩 (Compress PPTX)
    // =============================================
    renderCompress(container) {
        const state = {
            file: null,
            fileName: '',
            fileSize: 0,
            quality: 70,
            format: 'jpeg',
            resultBlob: null,
            resultSize: 0,
            resultName: ''
        };

        container.innerHTML = `
            <div id="compress-upload"></div>
            <div id="compress-file-info" class="hidden">
                <div class="stats-row" id="compress-stats"></div>
            </div>
            <div id="compress-controls" class="controls-panel hidden">
                <h4>压缩设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>图片质量：<strong id="compress-quality-val">70%</strong></label>
                        <input type="range" id="compress-quality" min="10" max="100" value="70" step="5"
                            style="width:100%">
                        <p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0">
                            质量越低，文件越小，图片清晰度越差
                        </p>
                    </div>
                    <div class="control-group">
                        <label>输出格式</label>
                        <div class="layout-options" id="compress-formats">
                            <div class="layout-option active" data-format="jpeg">JPEG (推荐)</div>
                            <div class="layout-option" data-format="png">PNG</div>
                            <div class="layout-option" data-format="webp">WebP</div>
                        </div>
                        <p style="font-size:12px;color:var(--text-secondary);margin:4px 0 0">
                            注意：此操作会降低嵌入图片质量。文本和矢量内容不受影响。
                        </p>
                    </div>
                </div>
            </div>
            <div id="compress-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="compress-action-info"></span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="compress-start">开始压缩</button>
                </div>
            </div>
            <div id="compress-result" class="file-list hidden">
                <div class="file-list-header">
                    <span>压缩结果</span>
                </div>
                <div class="file-list-view" id="compress-result-list"></div>
            </div>
        `;

        const el = {
            upload: container.querySelector('#compress-upload'),
            fileInfo: container.querySelector('#compress-file-info'),
            stats: container.querySelector('#compress-stats'),
            controls: container.querySelector('#compress-controls'),
            quality: container.querySelector('#compress-quality'),
            qualityVal: container.querySelector('#compress-quality-val'),
            formats: container.querySelector('#compress-formats'),
            actions: container.querySelector('#compress-actions'),
            actionInfo: container.querySelector('#compress-action-info'),
            btnStart: container.querySelector('#compress-start'),
            result: container.querySelector('#compress-result'),
            resultList: container.querySelector('#compress-result-list')
        };

        FileUpload.createUploadArea(el.upload, {
            accept: '.pptx',
            multiple: false,
            hint: '上传 .pptx 文件，压缩其中嵌入的图片以减小文件体积',
            onFiles: async (files) => {
                const file = files[0];
                if (!file) return;
                if (!file.name.toLowerCase().endsWith('.pptx')) {
                    Toast.warning('请选择 .pptx 格式的文件');
                    return;
                }

                if (typeof JSZip === 'undefined') {
                    Toast.error('JSZip 库未加载，请检查网络连接');
                    return;
                }

                state.file = file;
                state.fileName = file.name;
                state.fileSize = file.size;
                state.resultBlob = null;
                state.resultSize = 0;
                state.resultName = '';

                showFileInfo();
                el.result.classList.add('hidden');
                el.resultList.innerHTML = '';
            }
        });

        function showFileInfo() {
            el.fileInfo.classList.remove('hidden');
            el.controls.classList.remove('hidden');
            el.actions.classList.remove('hidden');

            el.stats.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${Utils.getBaseName(state.fileName)}</div>
                    <div class="stat-label">文件名</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Utils.formatSize(state.fileSize)}</div>
                    <div class="stat-label">文件大小</div>
                </div>
            `;

            el.actionInfo.textContent = `准备压缩：${state.fileName}（${Utils.formatSize(state.fileSize)}）`;
        }

        // Quality slider
        el.quality.oninput = () => {
            state.quality = parseInt(el.quality.value);
            el.qualityVal.textContent = state.quality + '%';
        };

        // Format selection
        el.formats.querySelectorAll('.layout-option').forEach(opt => {
            opt.onclick = () => {
                el.formats.querySelectorAll('.layout-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.format = opt.dataset.format;
            };
        });

        // Start compression
        el.btnStart.onclick = async () => {
            if (!state.file) {
                Toast.warning('请先上传PPT文件');
                return;
            }

            Loading.show('正在压缩PPT...');

            try {
                const arrayBuffer = await Utils.readAsArrayBuffer(state.file);
                const zip = await JSZip.loadAsync(arrayBuffer);

                // Find all media files
                const mediaEntries = [];
                zip.forEach((path, entry) => {
                    if (path.startsWith('ppt/media/') && !entry.dir) {
                        mediaEntries.push({ path, entry });
                    }
                });

                if (mediaEntries.length === 0) {
                    Loading.hide();
                    Toast.warning('该PPT文件中没有找到嵌入的图片');
                    return;
                }

                const mimeType = state.format === 'png' ? 'image/png'
                    : state.format === 'webp' ? 'image/webp'
                    : 'image/jpeg';

                const quality = state.quality / 100;

                for (let i = 0; i < mediaEntries.length; i++) {
                    const { path, entry } = mediaEntries[i];
                    Loading.progress(Math.round((i + 1) / mediaEntries.length * 80));
                    Loading.setText(`正在压缩图片 (${i + 1}/${mediaEntries.length})...`);

                    try {
                        const blob = await entry.async('blob');
                        const url = URL.createObjectURL(blob);
                        const img = await Utils.loadImage(url);
                        URL.revokeObjectURL(url);

                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        const newBlob = await new Promise((resolve, reject) => {
                            canvas.toBlob(b => {
                                if (b) resolve(b);
                                else reject(new Error('canvas.toBlob failed'));
                            }, mimeType, quality);
                        });

                        // Determine new file extension
                        const ext = state.format === 'png' ? '.png'
                            : state.format === 'webp' ? '.webp'
                            : '.jpg';

                        const baseName = path.substring(0, path.lastIndexOf('.'));
                        const newPath = baseName + ext;

                        // Remove old entry and add new one
                        zip.remove(path);
                        zip.file(newPath, newBlob);
                    } catch (imgErr) {
                        console.warn('Failed to compress image:', path, imgErr);
                        // Keep original if compression fails
                    }
                }

                Loading.setText('正在生成压缩后的PPT...');
                Loading.progress(90);

                const newBlob = await zip.generateAsync({ type: 'blob' });
                state.resultBlob = newBlob;
                state.resultSize = newBlob.size;
                state.resultName = Utils.getBaseName(state.fileName) + '_compressed.pptx';

                Loading.progress(100);
                Loading.hide();

                renderCompressResult();
                const ratio = ((1 - state.resultSize / state.fileSize) * 100).toFixed(1);
                Toast.success(`压缩完成，体积减小 ${ratio}%`);

            } catch (err) {
                Loading.hide();
                console.error('PPT compress failed:', err);
                Toast.error('压缩失败: ' + (err.message || '未知错误'));
            }
        };

        function renderCompressResult() {
            if (!state.resultBlob) {
                el.result.classList.add('hidden');
                return;
            }

            el.result.classList.remove('hidden');
            el.resultList.innerHTML = '';

            const ratio = ((1 - state.resultSize / state.fileSize) * 100).toFixed(1);
            const saved = state.fileSize - state.resultSize;

            const row = document.createElement('div');
            row.className = 'file-list-row';
            row.innerHTML = `
                <div class="file-list-row-info">
                    <div class="file-list-row-name">${state.resultName}</div>
                    <div class="file-list-row-meta">
                        <span>原始：${Utils.formatSize(state.fileSize)}</span>
                        <span>压缩后：${Utils.formatSize(state.resultSize)}</span>
                        <span>减小 ${ratio}%（节省 ${Utils.formatSize(Math.max(0, saved))}）</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary" id="compress-dl-btn">下载</button>
            `;

            row.querySelector('#compress-dl-btn').onclick = () => {
                Utils.downloadBlob(state.resultBlob, state.resultName);
            };

            el.resultList.appendChild(row);
        }
    }
};
