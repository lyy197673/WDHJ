// ===== PDF Tools Module =====

const PDFTools = {
    // Main entry: render tab bar + delegate to sub-tool
    render(container, subTool) {
        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>PDF工具</h2>
                    <p>转换、拆分、合并、压缩 — 纯本地处理，隐私安全</p>
                </div>
                <div class="tool-tabs" id="pdf-tabs">
                    <button class="tool-tab${subTool === 'convert' ? ' active' : ''}" data-sub="convert">转换</button>
                    <button class="tool-tab${subTool === 'split' ? ' active' : ''}" data-sub="split">拆分</button>
                    <button class="tool-tab${subTool === 'merge' ? ' active' : ''}" data-sub="merge">合并</button>
                    <button class="tool-tab${subTool === 'compress' ? ' active' : ''}" data-sub="compress">压缩</button>
                </div>
                <div id="pdf-content"></div>
            </div>
        `;

        // Tab click handlers
        const tabs = container.querySelectorAll('.tool-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                window.location.hash = '/pdf/' + tab.dataset.sub;
            };
        });

        // Render sub-tool content
        const content = container.querySelector('#pdf-content');
        switch (subTool) {
            case 'convert':
                this.renderConvert(content);
                break;
            case 'split':
                this.renderSplit(content);
                break;
            case 'merge':
                this.renderMerge(content);
                break;
            case 'compress':
                this.renderCompress(content);
                break;
            default:
                this.renderConvert(content);
        }
    },

    // =============================================
    // Convert Tool (secondary tab bar)
    // =============================================
    renderConvert(container) {
        container.innerHTML = `
            <div class="tool-tabs" id="pdf-convert-tabs">
                <button class="tool-tab active" data-sub="pdf2img">PDF转图片</button>
                <button class="tool-tab" data-sub="img2pdf">图片转PDF</button>
                <button class="tool-tab" data-sub="office2pdf">Office转PDF</button>
            </div>
            <div id="pdf-convert-content"></div>
        `;

        const tabs = container.querySelectorAll('.tool-tab');
        const content = container.querySelector('#pdf-convert-content');

        const TAB_ORDER = ['pdf2img', 'img2pdf', 'office2pdf'];
        const renderSub = (sub) => {
            tabs.forEach(t => t.classList.toggle('active', t.dataset.sub === sub));
            const idx = TAB_ORDER.indexOf(sub);
            switchTabContent(content, idx, (c) => {
                switch (sub) {
                    case 'pdf2img': this._renderPdf2Img(c); break;
                    case 'img2pdf': this._renderImg2Pdf(c); break;
                    case 'office2pdf': this._renderOffice2Pdf(c); break;
                    default: this._renderPdf2Img(c);
                }
            });
        };

        tabs.forEach(tab => {
            tab.onclick = () => renderSub(tab.dataset.sub);
        });

        // Default
        renderSub('pdf2img');
    },

    // =============================================
    // Split Tool
    // =============================================
    renderSplit(container) {
        const state = {
            pdfFile: null,
            pdfName: '',
            pdfArrayBuffer: null,
            pdfDoc: null,         // PDF.js doc for thumbnails
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

        // Set PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

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

            // Init all selected
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

        // ---- Render page thumbnails ----
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
                    <p style="color:var(--text-secondary);margin:0">将 PDF 的每一页拆分为独立的 PDF 文件。共会产生 ${state.totalPages} 个文件。</p>
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
                        <span style="color:var(--text-secondary)">创建分组，每组生成一个 PDF 文件</span>
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

                // Bind events
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
            accept: '.pdf',
            multiple: false,
            hint: '支持单个 PDF 文件',
            onFiles: async (files) => {
                const file = files.find(f => f.name.toLowerCase().endsWith('.pdf'));
                if (!file) {
                    Toast.warning('请选择 PDF 文件');
                    return;
                }

                Loading.show('正在加载 PDF...');

                try {
                    state.pdfFile = file;
                    state.pdfName = file.name;
                    state.pages = [];
                    state.groups = [];
                    state.results = [];
                    resultSelection.clear();
                    el.resultsSection.classList.add('hidden');

                    const arrayBuffer = await Utils.readAsArrayBuffer(file);
                    state.pdfArrayBuffer = arrayBuffer;

                    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                    state.pdfDoc = pdfDoc;
                    state.totalPages = pdfDoc.numPages;

                    for (let i = 1; i <= state.totalPages; i++) {
                        Loading.progress(Math.round(i / state.totalPages * 80));
                        Loading.setText(`正在渲染第 ${i} 页缩略图...`);

                        const page = await pdfDoc.getPage(i);
                        const viewport = page.getViewport({ scale: 0.3 });

                        const thumbCanvas = document.createElement('canvas');
                        thumbCanvas.width = viewport.width;
                        thumbCanvas.height = viewport.height;
                        const ctx = thumbCanvas.getContext('2d');
                        await page.render({ canvasContext: ctx, viewport }).promise;

                        const thumbUrl = thumbCanvas.toDataURL('image/png');

                        state.pages.push({
                            id: Utils.uid(),
                            pageNum: i,
                            thumbUrl: thumbUrl
                        });
                    }

                    Loading.hide();

                    // Update UI
                    renderPageGrid();
                    showSections(true);
                    initModeTabs();
                    renderModeContent();

                    el.statPages.textContent = state.totalPages;
                    el.statSize.textContent = Utils.formatSize(file.size);

                    Toast.success(`已加载 PDF，共 ${state.totalPages} 页`);
                } catch (err) {
                    Loading.hide();
                    console.error('Failed to load PDF:', err);
                    Toast.error('PDF 加载失败: ' + err.message);
                }
            }
        });

        // ---- Execute split ----
        el.btnExecute.onclick = async () => {
            if (!state.pdfArrayBuffer) {
                Toast.warning('请先上传 PDF 文件');
                return;
            }

            Loading.show('正在拆分 PDF...');

            try {
                const pdfDoc = await PDFLib.PDFDocument.load(state.pdfArrayBuffer);
                const baseName = Utils.getBaseName(state.pdfName) || 'PDF';
                const results = [];

                if (state.activeMode === 'single') {
                    // Single pages mode: each page becomes a separate PDF
                    for (let i = 0; i < state.totalPages; i++) {
                        Loading.progress(Math.round((i + 1) / state.totalPages * 100));
                        Loading.setText(`正在拆分第 ${i + 1} 页...`);

                        const newDoc = await PDFLib.PDFDocument.create();
                        const copiedPages = await newDoc.copyPages(pdfDoc, [i]);
                        newDoc.addPage(copiedPages[0]);
                        const pdfBytes = await newDoc.save();
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                        results.push({
                            name: `${baseName}_第${i + 1}页.pdf`,
                            blob: blob
                        });
                    }
                } else if (state.activeMode === 'extract') {
                    // Extract pages mode
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

                    const newDoc = await PDFLib.PDFDocument.create();
                    const copiedPages = await newDoc.copyPages(pdfDoc, indices);
                    for (const page of copiedPages) {
                        newDoc.addPage(page);
                    }
                    const pdfBytes = await newDoc.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                    const rangeStr = rangeInput.value.trim().replace(/\s+/g, '');
                    results.push({
                        name: `${baseName}_${rangeStr}.pdf`,
                        blob: blob
                    });
                } else if (state.activeMode === 'group') {
                    // Group split mode
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

                        const newDoc = await PDFLib.PDFDocument.create();
                        const copiedPages = await newDoc.copyPages(pdfDoc, pageIndices);
                        for (const page of copiedPages) {
                            newDoc.addPage(page);
                        }
                        const pdfBytes = await newDoc.save();
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                        const groupName = group.name ? `_${group.name}` : '';
                        results.push({
                            name: `${baseName}${groupName}.pdf`,
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
    // Merge Tool
    // =============================================
    renderMerge(container) {
        const state = {
            files: [],           // { id, file, name, size, arrayBuffer, pageCount, thumb }
            mergedBlob: null,
            mergedSize: 0
        };

        container.innerHTML = `
            <div id="merge-upload"></div>
            <div id="merge-info" class="stats-row hidden">
                <div class="stat-card">
                    <div class="stat-value" id="merge-stat-count">0</div>
                    <div class="stat-label">PDF 文件数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="merge-stat-pages">0</div>
                    <div class="stat-label">总页数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="merge-stat-size">0 B</div>
                    <div class="stat-label">总大小</div>
                </div>
            </div>
            <div id="merge-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="merge-count">已添加 0 个文件</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="merge-clear-all">清空全部</button>
                    </div>
                </div>
                <div class="merge-file-grid" id="merge-file-list"></div>
            </div>
            <div id="merge-result" class="file-list hidden">
                <div class="file-list-header">
                    <span>合并结果</span>
                </div>
                <div class="file-list-view" id="merge-result-list"></div>
            </div>
            <div id="merge-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="merge-action-info"></span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="merge-execute">合并 PDF</button>
                    <button class="btn btn-success hidden" id="merge-download">下载合并文件</button>
                </div>
            </div>
        `;

        const el = {
            upload: container.querySelector('#merge-upload'),
            info: container.querySelector('#merge-info'),
            statCount: container.querySelector('#merge-stat-count'),
            statPages: container.querySelector('#merge-stat-pages'),
            statSize: container.querySelector('#merge-stat-size'),
            filesSection: container.querySelector('#merge-files'),
            fileList: container.querySelector('#merge-file-list'),
            count: container.querySelector('#merge-count'),
            resultSection: container.querySelector('#merge-result'),
            resultList: container.querySelector('#merge-result-list'),
            actions: container.querySelector('#merge-actions'),
            actionInfo: container.querySelector('#merge-action-info'),
            btnExecute: container.querySelector('#merge-execute'),
            btnDownload: container.querySelector('#merge-download'),
            btnClearAll: container.querySelector('#merge-clear-all')
        };

        // Set PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

        // Block global drag overlay during internal reorder
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
            el.filesSection.addEventListener(evt, e => e.stopPropagation());
        });

        // Enable drag-to-reorder (once, on the container)
        let dragEl = null;
        el.fileList.addEventListener('dragstart', e => {
            const item = e.target.closest('.merge-file-item');
            if (!item) return;
            dragEl = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            document.getElementById('drag-overlay').classList.add('hidden');
        });
        el.fileList.addEventListener('dragend', () => {
            if (dragEl) {
                dragEl.classList.remove('dragging');
            }
            // Reorder state.files based on DOM order
            const ids = Array.from(el.fileList.children).map(c => c.dataset.id);
            const prevOrder = state.files.map(f => f.id);
            if (ids.join(',') !== prevOrder.join(',')) {
                state.files.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
                renderFileList();
                updateStats();
            }
            dragEl = null;
        });
        el.fileList.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target.closest('.merge-file-item');
            if (!target || target === dragEl) return;
            const rect = target.getBoundingClientRect();
            const mid = rect.left + rect.width / 2;
            if (e.clientX < mid) {
                el.fileList.insertBefore(dragEl, target);
            } else {
                el.fileList.insertBefore(dragEl, target.nextSibling);
            }
        });

        function updateStats() {
            const totalPages = state.files.reduce((sum, f) => sum + f.pageCount, 0);
            const totalSize = state.files.reduce((sum, f) => sum + f.size, 0);
            el.statCount.textContent = state.files.length;
            el.statPages.textContent = totalPages;
            el.statSize.textContent = Utils.formatSize(totalSize);
            el.count.textContent = `已添加 ${state.files.length} 个文件`;
            el.actionInfo.textContent = state.files.length > 0
                ? `共 ${state.files.length} 个文件，${totalPages} 页，拖拽调整顺序`
                : '';
        }

        function showSections(hasFiles) {
            el.info.classList.toggle('hidden', !hasFiles);
            el.filesSection.classList.toggle('hidden', !hasFiles);
            el.actions.classList.toggle('hidden', !hasFiles);
            el.resultSection.classList.toggle('hidden', !state.mergedBlob);
        }

        function renderFileList() {
            el.fileList.innerHTML = '';
            state.files.forEach((item, idx) => {
                const card = document.createElement('div');
                card.className = 'merge-file-item';
                card.draggable = true;
                card.dataset.id = item.id;
                card.innerHTML = `
                    <div class="merge-file-order">${idx + 1}</div>
                    <div class="merge-file-preview">
                        ${item.thumb
                            ? `<img src="${item.thumb}" alt="预览">`
                            : `<div class="merge-file-placeholder">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                               </div>`
                        }
                    </div>
                    <div class="merge-file-info">
                        <div class="merge-file-name" title="${item.name}">${item.name}</div>
                        <div class="merge-file-meta">${item.pageCount} 页 · ${Utils.formatSize(item.size)}</div>
                    </div>
                    <button class="merge-file-remove" title="移除">&times;</button>
                `;

                card.querySelector('.merge-file-remove').onclick = (e) => {
                    e.stopPropagation();
                    state.files = state.files.filter(f => f.id !== item.id);
                    renderFileList();
                    updateStats();
                    showSections(state.files.length > 0);
                };

                el.fileList.appendChild(card);
            });
        }

        function renderResult() {
            if (!state.mergedBlob) return;
            el.resultSection.classList.remove('hidden');
            el.resultList.innerHTML = '';
            const totalPages = state.files.reduce((s, f) => s + f.pageCount, 0);
            const baseName = state.files.length === 1 ? Utils.getBaseName(state.files[0].name) : '合并文档';
            const fileName = `${baseName}_merged.pdf`;
            const row = document.createElement('div');
            row.className = 'file-list-row selected';
            row.innerHTML = `
                <div class="file-list-row-info">
                    <div class="file-list-row-name">${fileName}</div>
                    <div class="file-list-row-meta">${Utils.formatSize(state.mergedSize)} · ${totalPages} 页</div>
                </div>
                <button class="btn btn-sm btn-primary" id="merge-result-dl">下载</button>
            `;
            row.querySelector('#merge-result-dl').onclick = () => {
                Utils.downloadBlob(state.mergedBlob, fileName);
            };
            el.resultList.appendChild(row);
        }

        // Clear all
        el.btnClearAll.onclick = () => {
            state.files = [];
            state.mergedBlob = null;
            state.mergedSize = 0;
            renderFileList();
            showSections(false);
            Toast.info('已清空所有文件');
        };

        // Upload
        FileUpload.createUploadArea(el.upload, {
            accept: '.pdf',
            multiple: true,
            hint: '支持多个 PDF 文件，拖拽排序合并顺序',
            onFiles: async (files) => {
                const pdfFiles = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
                if (pdfFiles.length === 0) {
                    Toast.warning('请选择 PDF 文件');
                    return;
                }

                Loading.show('正在加载 PDF...');

                for (let i = 0; i < pdfFiles.length; i++) {
                    const file = pdfFiles[i];
                    Loading.progress(Math.round((i + 1) / pdfFiles.length * 100));
                    Loading.setText(`正在加载 ${file.name}...`);

                    try {
                        const arrayBuffer = await Utils.readAsArrayBuffer(file);
                        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                        const pageCount = pdfDoc.numPages;

                        // Generate thumbnail from first page
                        let thumb = null;
                        try {
                            const page = await pdfDoc.getPage(1);
                            const viewport = page.getViewport({ scale: 0.3 });
                            const canvas = document.createElement('canvas');
                            canvas.width = viewport.width;
                            canvas.height = viewport.height;
                            const ctx = canvas.getContext('2d');
                            await page.render({ canvasContext: ctx, viewport }).promise;
                            thumb = canvas.toDataURL('image/jpeg', 0.7);
                        } catch (e) {
                            // thumb generation failed, continue without
                        }

                        state.files.push({
                            id: Utils.uid(),
                            file,
                            name: file.name,
                            size: file.size,
                            arrayBuffer,
                            pageCount,
                            thumb
                        });
                    } catch (e) {
                        console.warn('Failed to load PDF:', file.name, e);
                        Toast.warning(`${file.name} 加载失败，已跳过`);
                    }
                }

                Loading.hide();

                if (state.files.length === 0) {
                    Toast.warning('没有成功加载任何 PDF 文件');
                    return;
                }

                renderFileList();
                showSections(true);
                updateStats();
                Toast.success(`已添加 ${state.files.length} 个 PDF 文件`);
            }
        });

        // Merge
        el.btnExecute.onclick = async () => {
            if (state.files.length < 2) {
                Toast.warning('请至少添加 2 个 PDF 文件');
                return;
            }

            Loading.show('正在合并 PDF...');

            try {
                const mergedDoc = await PDFLib.PDFDocument.create();
                let totalPages = 0;

                for (let i = 0; i < state.files.length; i++) {
                    const file = state.files[i];
                    Loading.progress(Math.round((i + 1) / state.files.length * 100));
                    Loading.setText(`正在合并 ${file.name}...`);

                    const srcDoc = await PDFLib.PDFDocument.load(file.arrayBuffer);
                    const pageIndices = srcDoc.getPageIndices();
                    totalPages += pageIndices.length;
                    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
                    copiedPages.forEach(page => mergedDoc.addPage(page));
                }

                const pdfBytes = await mergedDoc.save();
                state.mergedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                state.mergedSize = state.mergedBlob.size;

                Loading.hide();

                renderResult();
                el.btnDownload.classList.remove('hidden');
                Toast.success(`合并完成，共 ${totalPages} 页`);
            } catch (err) {
                Loading.hide();
                console.error('Merge failed:', err);
                Toast.error('合并失败: ' + err.message);
            }
        };

        // Download
        el.btnDownload.onclick = () => {
            if (!state.mergedBlob) {
                Toast.warning('请先合并 PDF');
                return;
            }
            const baseName = '合并文档';
            Utils.downloadBlob(state.mergedBlob, `${baseName}_${new Date().toISOString().slice(0, 10)}.pdf`);
        };
    },

    // =============================================
    // Compress Tool
    // =============================================
    renderCompress(container) {
        const state = {
            pdfFile: null,
            pdfName: '',
            pdfArrayBuffer: null,
            totalPages: 0,
            originalSize: 0,
            compressedSize: 0,
            compressedBlob: null,
            preset: 'recommended',
            customQuality: 70
        };

        const presets = {
            extreme: { label: '极致压缩', quality: 30 },
            recommended: { label: '推荐', quality: 70 },
            high: { label: '高质量', quality: 90 }
        };

        container.innerHTML = `
            <div id="compress-upload"></div>
            <div id="compress-info" class="stats-row hidden">
                <div class="stat-card">
                    <div class="stat-value" id="compress-stat-name">--</div>
                    <div class="stat-label">文件名</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="compress-stat-pages">0</div>
                    <div class="stat-label">总页数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="compress-stat-size">0 B</div>
                    <div class="stat-label">原始大小</div>
                </div>
            </div>
            <div id="compress-controls" class="controls-panel hidden">
                <h4>压缩设置</h4>
                <div class="layout-options" id="compress-presets">
                    <button class="layout-option" data-preset="extreme">极致压缩</button>
                    <button class="layout-option active" data-preset="recommended">推荐</button>
                    <button class="layout-option" data-preset="high">高质量</button>
                </div>
                <div class="control-group">
                    <label>自定义质量: <span id="compress-quality-val">70</span>%</label>
                    <input type="range" id="compress-quality" min="10" max="100" value="70">
                </div>
                <p style="color:var(--text-secondary);font-size:13px;margin-top:8px">纯前端PDF压缩会将页面转为图片，文本将不可选中复制</p>
            </div>
            <div id="compress-comparison" class="hidden">
                <div class="comparison">
                    <div class="comparison-item">
                        <div class="size" id="compress-orig-size">--</div>
                        <div class="label">原始大小</div>
                    </div>
                    <div class="comparison-arrow">→</div>
                    <div class="comparison-item after">
                        <div class="size" id="compress-comp-size">--</div>
                        <div class="label">压缩后大小</div>
                    </div>
                </div>
                <div style="text-align:center;margin-top:8px">
                    <span id="compress-ratio" style="font-size:18px;font-weight:600;color:var(--success)">--</span>
                </div>
            </div>
            <div id="compress-actions" class="action-bar hidden">
                <div class="action-bar-left"></div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="compress-start">开始压缩</button>
                    <button class="btn btn-success hidden" id="compress-download">下载压缩文件</button>
                </div>
            </div>
        `;

        const el = {
            upload: container.querySelector('#compress-upload'),
            info: container.querySelector('#compress-info'),
            statName: container.querySelector('#compress-stat-name'),
            statPages: container.querySelector('#compress-stat-pages'),
            statSize: container.querySelector('#compress-stat-size'),
            controls: container.querySelector('#compress-controls'),
            presetsContainer: container.querySelector('#compress-presets'),
            qualitySlider: container.querySelector('#compress-quality'),
            qualityVal: container.querySelector('#compress-quality-val'),
            comparison: container.querySelector('#compress-comparison'),
            origSize: container.querySelector('#compress-orig-size'),
            compSize: container.querySelector('#compress-comp-size'),
            ratio: container.querySelector('#compress-ratio'),
            actions: container.querySelector('#compress-actions'),
            btnStart: container.querySelector('#compress-start'),
            btnDownload: container.querySelector('#compress-download')
        };

        // Set PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

        function getQuality() {
            return state.preset ? presets[state.preset].quality : state.customQuality;
        }

        function showSections(hasFile) {
            el.info.classList.toggle('hidden', !hasFile);
            el.controls.classList.toggle('hidden', !hasFile);
            el.actions.classList.toggle('hidden', !hasFile);
            el.comparison.classList.toggle('hidden', !state.compressedBlob);
        }

        function updatePresetButtons() {
            const buttons = el.presetsContainer.querySelectorAll('.layout-option');
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.preset === state.preset);
            });
        }

        function updateComparison() {
            if (state.compressedBlob) {
                el.origSize.textContent = Utils.formatSize(state.originalSize);
                el.compSize.textContent = Utils.formatSize(state.compressedSize);
                const ratio = ((1 - state.compressedSize / state.originalSize) * 100).toFixed(1);
                el.ratio.textContent = `节省 ${ratio}%`;
            } else {
                el.origSize.textContent = '--';
                el.compSize.textContent = '--';
                el.ratio.textContent = '--';
            }
        }

        // Preset buttons
        const presetButtons = el.presetsContainer.querySelectorAll('.layout-option');
        presetButtons.forEach(btn => {
            btn.onclick = () => {
                state.preset = btn.dataset.preset;
                state.customQuality = presets[state.preset].quality;
                el.qualitySlider.value = state.customQuality;
                el.qualityVal.textContent = state.customQuality;
                updatePresetButtons();
            };
        });

        // Quality slider
        el.qualitySlider.oninput = () => {
            state.customQuality = parseInt(el.qualitySlider.value, 10);
            el.qualityVal.textContent = state.customQuality;
            const matchedPreset = Object.keys(presets).find(k => presets[k].quality === state.customQuality);
            state.preset = matchedPreset || null;
            updatePresetButtons();
        };

        // Upload
        FileUpload.createUploadArea(el.upload, {
            accept: '.pdf',
            multiple: false,
            hint: '支持单个 PDF 文件',
            onFiles: async (files) => {
                const file = files.find(f => f.name.toLowerCase().endsWith('.pdf'));
                if (!file) {
                    Toast.warning('请选择 PDF 文件');
                    return;
                }

                try {
                    state.pdfFile = file;
                    state.pdfName = file.name;
                    state.originalSize = file.size;
                    state.compressedBlob = null;
                    state.compressedSize = 0;

                    const arrayBuffer = await Utils.readAsArrayBuffer(file);
                    state.pdfArrayBuffer = arrayBuffer;

                    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
                    state.totalPages = pdfDoc.numPages;

                    el.statName.textContent = file.name;
                    el.statPages.textContent = state.totalPages;
                    el.statSize.textContent = Utils.formatSize(file.size);
                    showSections(true);
                    updateComparison();

                    el.btnDownload.classList.add('hidden');
                    el.btnStart.disabled = false;

                    Toast.success(`已加载 PDF，共 ${state.totalPages} 页`);
                } catch (err) {
                    console.error('Failed to load PDF:', err);
                    Toast.error('PDF 加载失败: ' + err.message);
                }
            }
        });

        // Start compression
        el.btnStart.onclick = async () => {
            if (!state.pdfArrayBuffer) {
                Toast.warning('请先上传 PDF 文件');
                return;
            }

            const quality = getQuality() / 100;

            Loading.show('正在压缩 PDF...');

            try {
                const pdfDoc = await pdfjsLib.getDocument({ data: state.pdfArrayBuffer.slice(0) }).promise;
                const newPdf = await PDFLib.PDFDocument.create();

                for (let i = 1; i <= state.totalPages; i++) {
                    Loading.progress(Math.round(i / state.totalPages * 100));
                    Loading.setText(`正在处理第 ${i}/${state.totalPages} 页...`);

                    const page = await pdfDoc.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });

                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');

                    await page.render({ canvasContext: ctx, viewport }).promise;

                    const blob = await Utils.canvasToBlob(canvas, 'image/jpeg', quality);
                    const imgArrayBuffer = await blob.arrayBuffer();
                    const image = await newPdf.embedJpg(imgArrayBuffer);

                    const newPage = newPdf.addPage([viewport.width, viewport.height]);
                    newPage.drawImage(image, {
                        x: 0,
                        y: 0,
                        width: viewport.width,
                        height: viewport.height
                    });
                }

                const pdfBytes = await newPdf.save();
                state.compressedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
                state.compressedSize = state.compressedBlob.size;

                Loading.hide();

                updateComparison();
                el.comparison.classList.remove('hidden');
                el.btnDownload.classList.remove('hidden');

                const ratio = ((1 - state.compressedSize / state.originalSize) * 100).toFixed(1);
                Toast.success(`压缩完成，节省 ${ratio}%`);
            } catch (err) {
                Loading.hide();
                console.error('Failed to compress PDF:', err);
                Toast.error('PDF 压缩失败: ' + err.message);
            }
        };

        // Download
        el.btnDownload.onclick = () => {
            if (!state.compressedBlob) {
                Toast.warning('请先压缩 PDF');
                return;
            }
            const baseName = Utils.getBaseName(state.pdfName) || 'PDF';
            Utils.downloadBlob(state.compressedBlob, `${baseName}_compressed.pdf`);
        };
    },

    // =============================================
    // PDF to Images (sub-tool)
    // =============================================
    _renderPdf2Img(container) {
        const state = {
            pdfFile: null,
            pdfName: '',
            pdfDoc: null,
            pages: [],          // { id, pageNum, thumbCanvas, thumbUrl }
            format: 'image/png',
            quality: 92,
            convertedBlobs: [], // { pageNum, blob }
            totalFileSize: 0
        };

        const selection = new SelectionManager();

        container.innerHTML = `
            <div id="pdf2img-upload"></div>
            <div id="pdf2img-info" class="stats-row hidden">
                <div class="stat-card">
                    <div class="stat-value" id="pdf2img-stat-pages">0</div>
                    <div class="stat-label">总页数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="pdf2img-stat-size">0 B</div>
                    <div class="stat-label">文件大小</div>
                </div>
            </div>
            <div id="pdf2img-pages" class="file-list hidden">
                <div class="file-list-header">
                    <span id="pdf2img-count">已选择 0 页</span>
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
                            <option value="image/png">PNG</option>
                            <option value="image/jpeg">JPEG</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>输出质量: <span id="pdf2img-quality-val">92</span>%</label>
                        <input type="range" id="pdf2img-quality" min="10" max="100" value="92">
                    </div>
                </div>
            </div>
            <div id="pdf2img-results" class="file-list hidden">
                <div class="file-list-header">
                    <span id="pdf2img-result-count">转换结果</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="pdf2img-res-select-all">全选</button>
                        <button class="btn btn-sm" id="pdf2img-res-invert">反选</button>
                        <button class="btn btn-primary btn-sm" id="pdf2img-res-dl-selected">下载选中 (ZIP)</button>
                    </div>
                </div>
                <div class="file-list-view" id="pdf2img-result-list"></div>
            </div>
            <div id="pdf2img-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="pdf2img-action-info"></span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="pdf2img-convert">转换选中页面</button>
                </div>
            </div>
        `;

        // DOM references
        const el = {
            upload: container.querySelector('#pdf2img-upload'),
            info: container.querySelector('#pdf2img-info'),
            statPages: container.querySelector('#pdf2img-stat-pages'),
            statSize: container.querySelector('#pdf2img-stat-size'),
            pagesSection: container.querySelector('#pdf2img-pages'),
            grid: container.querySelector('#pdf2img-grid'),
            count: container.querySelector('#pdf2img-count'),
            controls: container.querySelector('#pdf2img-controls'),
            formatSelect: container.querySelector('#pdf2img-format'),
            qualitySlider: container.querySelector('#pdf2img-quality'),
            qualityVal: container.querySelector('#pdf2img-quality-val'),
            resultsSection: container.querySelector('#pdf2img-results'),
            resultList: container.querySelector('#pdf2img-result-list'),
            resultCount: container.querySelector('#pdf2img-result-count'),
            btnResSelectAll: container.querySelector('#pdf2img-res-select-all'),
            btnResInvert: container.querySelector('#pdf2img-res-invert'),
            btnResDlSelected: container.querySelector('#pdf2img-res-dl-selected'),
            actions: container.querySelector('#pdf2img-actions'),
            actionInfo: container.querySelector('#pdf2img-action-info'),
            btnConvert: container.querySelector('#pdf2img-convert'),
            btnSelectAll: container.querySelector('#pdf2img-select-all'),
            btnInvert: container.querySelector('#pdf2img-invert')
        };

        // Set PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

        // ---- UI helpers ----
        function updateCount() {
            el.count.textContent = `已选择 ${selection.count} / ${selection.total} 页`;
        }

        function updateActionInfo() {
            const converted = state.convertedBlobs.length;
            el.actionInfo.textContent = converted > 0
                ? `已转换 ${converted} 页`
                : '';
        }

        // ---- Results selection state ----
        const resultSelection = new Set();

        // ---- Render results list with checkboxes and download buttons ----
        function renderResultsList() {
            const extMap = { 'image/png': 'png', 'image/jpeg': 'jpg' };
            const ext = extMap[state.format] || 'png';
            const baseName = Utils.getBaseName(state.pdfName) || 'PDF';

            if (state.convertedBlobs.length === 0) {
                el.resultsSection.classList.add('hidden');
                return;
            }

            el.resultsSection.classList.remove('hidden');
            el.resultCount.textContent = `已转换 ${state.convertedBlobs.length} 页`;
            el.resultList.innerHTML = '';

            // Init all selected
            if (resultSelection.size === 0) {
                state.convertedBlobs.forEach((item, idx) => resultSelection.add(idx));
            }

            state.convertedBlobs.forEach((item, idx) => {
                const fileName = `${baseName}_第${item.pageNum}页.${ext}`;
                const checked = resultSelection.has(idx);
                const row = document.createElement('div');
                row.className = 'file-list-row' + (checked ? ' selected' : '');
                row.innerHTML = `
                    <input type="checkbox" class="file-cb" ${checked ? 'checked' : ''}>
                    <div class="file-list-row-info">
                        <div class="file-list-row-name">${fileName}</div>
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
                    Utils.downloadBlob(item.blob, fileName);
                };
                el.resultList.appendChild(row);
            });
        }

        // ---- Result selection buttons ----
        el.btnResSelectAll.onclick = () => {
            state.convertedBlobs.forEach((item, idx) => resultSelection.add(idx));
            renderResultsList();
        };

        el.btnResInvert.onclick = () => {
            const newSet = new Set();
            state.convertedBlobs.forEach((item, idx) => {
                if (!resultSelection.has(idx)) newSet.add(idx);
            });
            resultSelection.clear();
            newSet.forEach(id => resultSelection.add(id));
            renderResultsList();
        };

        el.btnResDlSelected.onclick = async () => {
            const extMap = { 'image/png': 'png', 'image/jpeg': 'jpg' };
            const ext = extMap[state.format] || 'png';
            const baseName = Utils.getBaseName(state.pdfName) || 'PDF';
            const selected = state.convertedBlobs.filter((item, idx) => resultSelection.has(idx));
            if (selected.length === 0) {
                Toast.warning('请先勾选要下载的文件');
                return;
            }
            const files = selected.map(item => ({
                name: `${baseName}_第${item.pageNum}页.${ext}`,
                blob: item.blob
            }));
            await batchDownload(files);
        };

        function showSections(hasFile) {
            el.info.classList.toggle('hidden', !hasFile);
            el.pagesSection.classList.toggle('hidden', !hasFile);
            el.controls.classList.toggle('hidden', !hasFile);
            el.actions.classList.toggle('hidden', !hasFile);
        }

        // ---- Render page grid ----
        function renderPageGrid() {
            el.grid.innerHTML = '';
            state.pages.forEach(page => {
                const div = document.createElement('div');
                div.className = 'pdf-page-item' + (selection.isSelected(page.id) ? ' selected' : '');
                div.dataset.id = page.id;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'file-item-checkbox';
                checkbox.checked = selection.isSelected(page.id);
                checkbox.onclick = (e) => {
                    e.stopPropagation();
                    selection.toggle(page.id);
                    renderPageGrid();
                };

                const canvas = document.createElement('canvas');
                canvas.width = page.thumbCanvas.width;
                canvas.height = page.thumbCanvas.height;
                canvas.getContext('2d').drawImage(page.thumbCanvas, 0, 0);

                const pageNum = document.createElement('div');
                pageNum.className = 'page-num';
                pageNum.textContent = `第 ${page.pageNum} 页`;

                div.appendChild(checkbox);
                div.appendChild(canvas);
                div.appendChild(pageNum);

                // Click canvas for lightbox preview
                canvas.onclick = (e) => {
                    e.stopPropagation();
                    const images = state.pages.map(p => p.thumbUrl);
                    const idx = state.pages.findIndex(p => p.id === page.id);
                    Lightbox.open(images, idx);
                };

                el.grid.appendChild(div);
            });
            updateCount();
        }

        // ---- Upload ----
        FileUpload.createUploadArea(el.upload, {
            accept: '.pdf',
            multiple: false,
            hint: '支持单个 PDF 文件',
            onFiles: async (files) => {
                const file = files.find(f => f.name.toLowerCase().endsWith('.pdf'));
                if (!file) {
                    Toast.warning('请选择 PDF 文件');
                    return;
                }

                Loading.show('正在加载 PDF...');

                try {
                    // Reset state
                    state.pdfFile = file;
                    state.pdfName = file.name;
                    state.totalFileSize = file.size;
                    state.pages = [];
                    state.convertedBlobs = [];
                    resultSelection.clear();
                    el.resultsSection.classList.add('hidden');

                    const arrayBuffer = await Utils.readAsArrayBuffer(file);
                    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    state.pdfDoc = pdfDoc;

                    const totalPages = pdfDoc.numPages;

                    for (let i = 1; i <= totalPages; i++) {
                        Loading.progress(Math.round(i / totalPages * 80));
                        Loading.setText(`正在渲染第 ${i} 页...`);

                        const page = await pdfDoc.getPage(i);
                        const viewport = page.getViewport({ scale: 0.5 });

                        const thumbCanvas = document.createElement('canvas');
                        thumbCanvas.width = viewport.width;
                        thumbCanvas.height = viewport.height;
                        const ctx = thumbCanvas.getContext('2d');

                        await page.render({ canvasContext: ctx, viewport }).promise;

                        const thumbUrl = thumbCanvas.toDataURL('image/png');

                        state.pages.push({
                            id: Utils.uid(),
                            pageNum: i,
                            thumbCanvas: thumbCanvas,
                            thumbUrl: thumbUrl
                        });
                    }

                    Loading.hide();

                    // Update UI
                    selection.setItems(state.pages);
                    renderPageGrid();
                    showSections(true);

                    el.statPages.textContent = totalPages;
                    el.statSize.textContent = Utils.formatSize(file.size);

                    Toast.success(`已加载 PDF，共 ${totalPages} 页`);
                } catch (err) {
                    Loading.hide();
                    console.error('Failed to load PDF:', err);
                    Toast.error('PDF 加载失败: ' + err.message);
                }
            }
        });

        // ---- Selection buttons ----
        el.btnSelectAll.onclick = () => {
            selection.selectAll();
            renderPageGrid();
        };

        el.btnInvert.onclick = () => {
            selection.invertSelection();
            renderPageGrid();
        };

        // ---- Quality slider ----
        el.qualitySlider.oninput = () => {
            el.qualityVal.textContent = el.qualitySlider.value;
        };

        // ---- Convert selected pages ----
        el.btnConvert.onclick = async () => {
            const selected = selection.getSelected();
            if (selected.length === 0) {
                Toast.warning('请先选择要转换的页面');
                return;
            }

            if (!state.pdfDoc) {
                Toast.warning('请先上传 PDF 文件');
                return;
            }

            state.format = el.formatSelect.value;
            state.quality = parseInt(el.qualitySlider.value) || 92;

            Loading.show('正在转换页面...');

            state.convertedBlobs = [];

            try {
                for (let i = 0; i < selected.length; i++) {
                    const pageItem = selected[i];
                    Loading.progress(Math.round((i + 1) / selected.length * 100));
                    Loading.setText(`正在渲染第 ${pageItem.pageNum} 页...`);

                    const page = await state.pdfDoc.getPage(pageItem.pageNum);
                    const viewport = page.getViewport({ scale: 2.0 });

                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');

                    await page.render({ canvasContext: ctx, viewport }).promise;

                    const mimeType = state.format;
                    const quality = state.quality / 100;
                    const blob = await Utils.canvasToBlob(canvas, mimeType, quality);

                    state.convertedBlobs.push({
                        pageNum: pageItem.pageNum,
                        blob: blob
                    });
                }

                Loading.hide();

                renderResultsList();
                updateActionInfo();
                Toast.success(`已转换 ${selected.length} 页`);
            } catch (err) {
                Loading.hide();
                console.error('Convert failed:', err);
                Toast.error('转换失败: ' + err.message);
            }
        };

    },

    // =============================================
    // Image to PDF
    // =============================================
    _renderImg2Pdf(container) {
        const PAGE_SIZES = {
            a4: { width: 595.28, height: 841.89 },
            letter: { width: 612, height: 792 }
        };

        const state = {
            files: [] // { id, file, name, size, thumb, arrayBuffer, ext }
        };

        container.innerHTML = `
            <div id="img2pdf-upload"></div>
            <div id="img2pdf-info" class="stats-row hidden">
                <div class="stat-card">
                    <div class="stat-value" id="img2pdf-stat-count">0</div>
                    <div class="stat-label">图片数量</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="img2pdf-stat-size">0 B</div>
                    <div class="stat-label">总大小</div>
                </div>
            </div>
            <div id="img2pdf-files" class="file-list hidden">
                <div class="file-list-header">
                    <span id="img2pdf-count">已添加 0 张图片</span>
                    <div class="file-list-actions">
                        <button class="btn btn-sm" id="img2pdf-clear">清空全部</button>
                    </div>
                </div>
                <div class="file-grid" id="img2pdf-grid"></div>
            </div>
            <div id="img2pdf-controls" class="controls-panel hidden">
                <h4>PDF 设置</h4>
                <div class="controls-grid">
                    <div class="control-group">
                        <label>页面大小</label>
                        <select id="img2pdf-page-size">
                            <option value="a4">A4 (210 x 297mm)</option>
                            <option value="letter">Letter (8.5 x 11in)</option>
                            <option value="auto">自适应图片</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>页面方向</label>
                        <select id="img2pdf-orientation">
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
                    <span id="img2pdf-action-info"></span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="img2pdf-generate">生成 PDF</button>
                </div>
            </div>
        `;

        // DOM references
        const el = {
            upload: container.querySelector('#img2pdf-upload'),
            info: container.querySelector('#img2pdf-info'),
            statCount: container.querySelector('#img2pdf-stat-count'),
            statSize: container.querySelector('#img2pdf-stat-size'),
            filesSection: container.querySelector('#img2pdf-files'),
            grid: container.querySelector('#img2pdf-grid'),
            count: container.querySelector('#img2pdf-count'),
            controls: container.querySelector('#img2pdf-controls'),
            pageSize: container.querySelector('#img2pdf-page-size'),
            orientation: container.querySelector('#img2pdf-orientation'),
            position: container.querySelector('#img2pdf-position'),
            actions: container.querySelector('#img2pdf-actions'),
            actionInfo: container.querySelector('#img2pdf-action-info'),
            btnGenerate: container.querySelector('#img2pdf-generate'),
            btnClear: container.querySelector('#img2pdf-clear')
        };

        // ---- UI helpers ----
        function updateStats() {
            const totalSize = state.files.reduce((sum, f) => sum + f.size, 0);
            el.statCount.textContent = state.files.length;
            el.statSize.textContent = Utils.formatSize(totalSize);
            el.count.textContent = `已添加 ${state.files.length} 张图片`;
            el.actionInfo.textContent = state.files.length > 0
                ? `共 ${state.files.length} 张图片，可拖拽排序`
                : '';
        }

        function showSections(hasFiles) {
            el.info.classList.toggle('hidden', !hasFiles);
            el.filesSection.classList.toggle('hidden', !hasFiles);
            el.controls.classList.toggle('hidden', !hasFiles);
            el.actions.classList.toggle('hidden', !hasFiles);
        }

        // ---- Render file grid ----
        function renderFileGrid() {
            el.grid.innerHTML = '';
            state.files.forEach(item => {
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
                    renderFileGrid();
                    updateStats();
                    showSections(state.files.length > 0);
                };

                el.grid.appendChild(div);
            });

            // Make grid sortable (drag-to-reorder)
            Utils.makeSortable(el.grid, () => {
                const ids = Array.from(el.grid.children).map(child => child.dataset.id);
                state.files.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
            });

            updateStats();
        }

        // ---- Upload Area ----
        FileUpload.createUploadArea(el.upload, {
            accept: 'image/*',
            multiple: true,
            hint: '支持 JPG、PNG、GIF、WebP 等图片格式，支持批量上传',
            onFiles: async (newFiles) => {
                const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
                if (imageFiles.length === 0) {
                    Toast.warning('请选择图片文件');
                    return;
                }

                Loading.show('正在加载图片...');
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    Loading.progress(Math.round((i + 1) / imageFiles.length * 100));
                    Loading.setText(`正在加载 ${file.name}...`);
                    try {
                        const thumb = await Utils.createThumbnail(file);
                        const arrayBuffer = await Utils.readAsArrayBuffer(file);
                        const ext = Utils.getExtension(file.name).toLowerCase();
                        state.files.push({
                            id: Utils.uid(),
                            file,
                            name: file.name,
                            size: file.size,
                            thumb,
                            arrayBuffer,
                            ext
                        });
                    } catch (e) {
                        console.warn('Failed to load image:', file.name, e);
                    }
                }
                Loading.hide();

                renderFileGrid();
                showSections(true);
                Toast.success(`已添加 ${imageFiles.length} 张图片`);
            }
        });

        // ---- Clear all ----
        el.btnClear.onclick = () => {
            state.files = [];
            renderFileGrid();
            showSections(false);
            Toast.info('已清空所有图片');
        };

        // ---- Generate PDF ----
        el.btnGenerate.onclick = async () => {
            if (state.files.length === 0) {
                Toast.warning('请先添加图片');
                return;
            }

            Loading.show('正在生成 PDF...');

            try {
                const pdfDoc = await PDFLib.PDFDocument.create();
                const pageSize = el.pageSize.value;
                const orientation = el.orientation.value;
                const position = el.position.value;

                for (let i = 0; i < state.files.length; i++) {
                    const item = state.files[i];
                    Loading.progress(Math.round((i + 1) / state.files.length * 100));
                    Loading.setText(`正在处理第 ${i + 1} 张图片...`);

                    // Embed image based on extension
                    let image;
                    const ext = item.ext;
                    if (ext === 'jpg' || ext === 'jpeg') {
                        image = await pdfDoc.embedJpg(item.arrayBuffer);
                    } else {
                        image = await pdfDoc.embedPng(item.arrayBuffer);
                    }

                    const imgWidth = image.width;
                    const imgHeight = image.height;

                    // Determine page dimensions
                    let pageWidth, pageHeight;
                    if (pageSize === 'auto') {
                        pageWidth = imgWidth;
                        pageHeight = imgHeight;
                    } else {
                        const size = PAGE_SIZES[pageSize];
                        if (orientation === 'landscape') {
                            pageWidth = size.height;
                            pageHeight = size.width;
                        } else {
                            pageWidth = size.width;
                            pageHeight = size.height;
                        }
                    }

                    const page = pdfDoc.addPage([pageWidth, pageHeight]);

                    // Calculate draw dimensions based on position setting
                    let drawW, drawH, drawX, drawY;

                    if (position === 'stretch') {
                        // Stretch to fill entire page
                        drawW = pageWidth;
                        drawH = pageHeight;
                        drawX = 0;
                        drawY = 0;
                    } else if (position === 'fit') {
                        // Scale to fit maintaining aspect ratio, centered
                        const scaleW = pageWidth / imgWidth;
                        const scaleH = pageHeight / imgHeight;
                        const scale = Math.min(scaleW, scaleH);
                        drawW = imgWidth * scale;
                        drawH = imgHeight * scale;
                        drawX = (pageWidth - drawW) / 2;
                        drawY = (pageHeight - drawH) / 2;
                    } else {
                        // Center: scale to fit within page, centered (same as fit for safety)
                        const scaleW = pageWidth / imgWidth;
                        const scaleH = pageHeight / imgHeight;
                        const scale = Math.min(scaleW, scaleH);
                        drawW = imgWidth * scale;
                        drawH = imgHeight * scale;
                        drawX = (pageWidth - drawW) / 2;
                        drawY = (pageHeight - drawH) / 2;
                    }

                    // pdf-lib coordinate system: origin at bottom-left
                    // drawY is from top, so convert: y = pageHeight - drawY - drawH
                    page.drawImage(image, {
                        x: drawX,
                        y: pageHeight - drawY - drawH,
                        width: drawW,
                        height: drawH
                    });
                }

                Loading.setText('正在保存 PDF...');
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                Loading.hide();

                const baseName = state.files.length === 1
                    ? Utils.getBaseName(state.files[0].name)
                    : '图片合集';
                const filename = `${baseName}_${new Date().toISOString().slice(0, 10)}.pdf`;
                Utils.downloadBlob(blob, filename);

                Toast.success(`PDF 生成完成，共 ${state.files.length} 页`);
            } catch (err) {
                Loading.hide();
                console.error('PDF generation failed:', err);
                Toast.error('PDF 生成失败: ' + err.message);
            }
        };
    },

    // =============================================
    // Office to PDF
    // =============================================
    _renderOffice2Pdf(container) {
        container.innerHTML = `
            <div id="office2pdf-upload"></div>
            <div id="office2pdf-info" class="info-box" style="margin-top:12px">
                <strong>提示：</strong>本工具为纯前端转换，适用于简单文档。
                Word 文档将提取文字内容生成 PDF，Excel 表格将以表格布局生成 PDF。
                复杂排版、图片、图表等可能无法完整保留，如需精确转换请使用桌面办公软件。
            </div>
            <div id="office2pdf-preview" class="hidden" style="margin-top:12px">
                <div id="office2pdf-file-info" class="file-info-bar"></div>
            </div>
            <div id="office2pdf-actions" class="action-bar hidden">
                <div class="action-bar-right">
                    <button class="btn btn-primary" id="office2pdf-generate">生成 PDF</button>
                </div>
            </div>
        `;

        const state = { file: null, arrayBuffer: null };

        const el = {
            upload: container.querySelector('#office2pdf-upload'),
            info: container.querySelector('#office2pdf-info'),
            preview: container.querySelector('#office2pdf-preview'),
            fileInfo: container.querySelector('#office2pdf-file-info'),
            actions: container.querySelector('#office2pdf-actions'),
            btnGenerate: container.querySelector('#office2pdf-generate')
        };

        function showSections(hasFile) {
            el.info.classList.toggle('hidden', hasFile);
            el.preview.classList.toggle('hidden', !hasFile);
            el.actions.classList.toggle('hidden', !hasFile);
        }

        function renderFileInfo() {
            if (!state.file) return;
            const ext = Utils.getExtension(state.file.name).toLowerCase();
            const icon = ext === 'docx' ? 'W' : 'X';
            const badge = ext === 'docx' ? 'Word' : 'Excel';
            el.fileInfo.innerHTML = `
                <div class="file-info-item">
                    <span class="file-info-icon">${icon}</span>
                    <span class="file-info-name" title="${state.file.name}">${state.file.name}</span>
                    <span class="file-info-size">${Utils.formatSize(state.file.size)}</span>
                    <span class="file-info-badge">${badge}</span>
                    <button class="file-item-remove" id="office2pdf-clear" title="移除">&times;</button>
                </div>
            `;
            container.querySelector('#office2pdf-clear').onclick = () => {
                state.file = null;
                state.arrayBuffer = null;
                showSections(false);
            };
        }

        // ---- Upload Area ----
        FileUpload.createUploadArea(el.upload, {
            accept: '.docx,.xlsx',
            multiple: false,
            hint: '支持 Word (.docx) 和 Excel (.xlsx) 文件',
            onFiles: async (files) => {
                if (files.length === 0) return;
                const file = files[0];
                const ext = Utils.getExtension(file.name).toLowerCase();
                if (ext !== 'docx' && ext !== 'xlsx') {
                    Toast.warning('请选择 .docx 或 .xlsx 文件');
                    return;
                }
                try {
                    state.file = file;
                    state.arrayBuffer = await Utils.readAsArrayBuffer(file);
                    renderFileInfo();
                    showSections(true);
                    Toast.success(`已加载 ${file.name}`);
                } catch (e) {
                    console.error('Failed to read file:', e);
                    Toast.error('文件读取失败: ' + e.message);
                }
            }
        });

        // ---- Generate PDF ----
        el.btnGenerate.onclick = async () => {
            if (!state.file || !state.arrayBuffer) {
                Toast.warning('请先选择文件');
                return;
            }

            const ext = Utils.getExtension(state.file.name).toLowerCase();
            Loading.show('正在转换...');

            try {
                let pdfBytes;

                if (ext === 'docx') {
                    pdfBytes = await this._convertDocxToPdf(state.arrayBuffer);
                } else if (ext === 'xlsx') {
                    pdfBytes = await this._convertXlsxToPdf(state.arrayBuffer);
                } else {
                    throw new Error('不支持的文件格式');
                }

                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                Loading.hide();

                const baseName = Utils.getBaseName(state.file.name);
                const filename = `${baseName}_${new Date().toISOString().slice(0, 10)}.pdf`;
                Utils.downloadBlob(blob, filename);
                Toast.success('PDF 生成完成');
            } catch (err) {
                Loading.hide();
                console.error('Office to PDF conversion failed:', err);
                Toast.error('转换失败: ' + (err.message || err));
            }
        };
    },

    // ---- HTML to structured lines helper ----
    _htmlToLines(html) {
        const lines = [];
        const container = document.createElement('div');
        container.innerHTML = html;

        const elements = container.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,div');

        elements.forEach(el => {
            const tag = el.tagName.toLowerCase();
            let text = el.textContent || '';
            if (!text.trim()) return;

            if (el.parentElement && el.parentElement !== container &&
                ['h1','h2','h3','h4','h5','h6','p','li','blockquote','pre'].includes(el.parentElement.tagName.toLowerCase())) {
                return;
            }

            let fontSize = 14;
            let bold = false;
            let indent = 0;
            let spaceAfter = 8;
            let color = '#000000';

            if (tag === 'h1') { fontSize = 24; bold = true; spaceAfter = 12; }
            else if (tag === 'h2') { fontSize = 20; bold = true; spaceAfter = 10; }
            else if (tag === 'h3') { fontSize = 17; bold = true; spaceAfter = 8; }
            else if (tag === 'h4') { fontSize = 15; bold = true; spaceAfter = 6; }
            else if (tag === 'h5' || tag === 'h6') { fontSize = 14; bold = true; spaceAfter = 6; }
            else if (tag === 'li') { indent = 16; }
            else if (tag === 'blockquote') { indent = 16; color = '#555555'; }
            else if (tag === 'pre') { fontSize = 13; }

            lines.push({ text, fontSize, bold, indent, spaceAfter, color, type: tag });
        });

        if (lines.length === 0) {
            const text = container.textContent || '';
            const paragraphs = text.split(/\n\s*\n/);
            paragraphs.forEach(p => {
                if (p.trim()) {
                    lines.push({ text: p.trim(), fontSize: 14, bold: false, indent: 0, spaceAfter: 8, color: '#000000', type: 'p' });
                }
            });
        }

        return lines;
    },

    // ---- Docx to PDF helper (Canvas-based, supports CJK) ----
    async _convertDocxToPdf(arrayBuffer) {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;
        const lines = this._htmlToLines(html);

        const PAGE_W = 595;
        const PAGE_H = 842;
        const MARGIN = 50;
        const DPI = 2;
        const canvasW = PAGE_W * DPI;
        const canvasH = PAGE_H * DPI;
        const contentW = PAGE_W - MARGIN * 2;
        const FONT_SIZE = 14;
        const fontStack = '"Microsoft YaHei","PingFang SC","Noto Sans SC","SimSun",sans-serif';

        const pdfDoc = await PDFLib.PDFDocument.create();
        let curY = MARGIN;

        let canvas = document.createElement('canvas');
        canvas.width = canvasW;
        canvas.height = canvasH;
        let ctx = canvas.getContext('2d');
        ctx.scale(DPI, DPI);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);

        function getTextWidth(text, fontSize, bold) {
            const tc = document.createElement('canvas');
            const tctx = tc.getContext('2d');
            tctx.font = `${bold ? 'bold ' : ''}${fontSize}px ${fontStack}`;
            return tctx.measureText(text).width;
        }

        function wrapText(text, maxWidth, fontSize, bold) {
            const chars = text.split('');
            const wrapped = [];
            let currentLine = '';
            for (const char of chars) {
                const testLine = currentLine + char;
                if (getTextWidth(testLine, fontSize, bold) > maxWidth && currentLine) {
                    wrapped.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) wrapped.push(currentLine);
            return wrapped;
        }

        async function flushPage() {
            const jpegBlob = await Utils.canvasToBlob(canvas, 'image/jpeg', 0.92);
            const imgBytes = await jpegBlob.arrayBuffer();
            const pdfImage = await pdfDoc.embedJpg(imgBytes);
            const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            page.drawImage(pdfImage, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
        }

        function newPageCanvas() {
            const c = document.createElement('canvas');
            c.width = canvasW;
            c.height = canvasH;
            const x = c.getContext('2d');
            x.scale(DPI, DPI);
            x.fillStyle = '#ffffff';
            x.fillRect(0, 0, PAGE_W, PAGE_H);
            return c;
        }

        for (let i = 0; i < lines.length; i++) {
            const item = lines[i];
            const fontSize = item.fontSize || FONT_SIZE;
            const bold = item.bold || false;
            const lineH = fontSize * 1.8;
            const indent = item.indent || 0;

            if (item.type === 'hr') {
                if (curY + 20 > PAGE_H - MARGIN) {
                    await flushPage();
                    canvas = newPageCanvas();
                    ctx = canvas.getContext('2d');
                    curY = MARGIN;
                }
                ctx.strokeStyle = '#cccccc';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(MARGIN, curY + 5);
                ctx.lineTo(PAGE_W - MARGIN, curY + 5);
                ctx.stroke();
                curY += 20;
                continue;
            }

            const wrappedLines = wrapText(item.text || '', contentW - indent, fontSize, bold);
            const totalH = wrappedLines.length * lineH;

            if (curY + totalH > PAGE_H - MARGIN && curY > MARGIN) {
                await flushPage();
                canvas = newPageCanvas();
                ctx = canvas.getContext('2d');
                curY = MARGIN;
            }

            ctx.fillStyle = item.color || '#000000';
            ctx.font = `${bold ? 'bold ' : ''}${fontSize}px ${fontStack}`;
            for (const wl of wrappedLines) {
                ctx.fillText(wl, MARGIN + indent, curY);
                curY += lineH;
            }

            if (item.spaceAfter) curY += item.spaceAfter;
        }

        await flushPage();
        return await pdfDoc.save();
    },

    // ---- Xlsx to PDF helper (Canvas-based, supports CJK) ----
    async _convertXlsxToPdf(arrayBuffer) {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (!data || data.length === 0) {
            throw new Error('工作表为空');
        }

        const PAGE_W = 842;   // A4 landscape
        const PAGE_H = 595;
        const MARGIN = 30;
        const DPI = 2;
        const fontSize = 10;
        const cellPadding = 6;
        const rowHeight = fontSize * 1.5 + cellPadding * 2;
        const usableW = PAGE_W - MARGIN * 2;
        const usableH = PAGE_H - MARGIN * 2;
        const rowsPerPage = Math.max(1, Math.floor(usableH / rowHeight));
        const numCols = Math.max(...data.map(row => row.length));

        // Measure column widths using canvas (supports CJK)
        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d');
        measureCtx.font = `${fontSize}px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif`;

        const colWidths = new Array(numCols).fill(0);
        for (let r = 0; r < data.length; r++) {
            for (let c = 0; c < numCols; c++) {
                const cell = data[r] && c < data[r].length ? data[r][c] : '';
                const text = String(cell == null ? '' : cell);
                const truncated = text.length > 30 ? text.substring(0, 30) + '...' : text;
                const w = measureCtx.measureText(truncated).width + cellPadding * 2;
                if (w > colWidths[c]) colWidths[c] = w;
            }
        }
        for (let c = 0; c < numCols; c++) colWidths[c] = Math.max(colWidths[c], 40);

        let totalColW = colWidths.reduce((a, b) => a + b, 0);
        if (totalColW > usableW) {
            const scale = usableW / totalColW;
            for (let c = 0; c < numCols; c++) colWidths[c] = colWidths[c] * scale;
        }

        const pdfDoc = await PDFLib.PDFDocument.create();
        const totalPages = Math.ceil(data.length / rowsPerPage);

        for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
            const canvas = document.createElement('canvas');
            canvas.width = PAGE_W * DPI;
            canvas.height = PAGE_H * DPI;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, PAGE_W * DPI, PAGE_H * DPI);
            ctx.scale(DPI, DPI);
            ctx.font = `${fontSize}px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif`;
            ctx.textBaseline = 'top';

            const startRow = pageIdx * rowsPerPage;
            const endRow = Math.min(startRow + rowsPerPage, data.length);

            for (let r = startRow; r < endRow; r++) {
                const row = data[r];
                const rowY = MARGIN + (r - startRow) * rowHeight;
                let x = MARGIN;
                for (let c = 0; c < numCols; c++) {
                    const cellW = colWidths[c];
                    if (r === 0) {
                        ctx.fillStyle = '#e0e0e0';
                        ctx.fillRect(x, rowY, cellW, rowHeight);
                    }
                    ctx.strokeStyle = '#999';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x, rowY, cellW, rowHeight);

                    const cellVal = row && c < row.length ? row[c] : '';
                    const text = String(cellVal == null ? '' : cellVal);
                    const maxTextW = cellW - cellPadding * 2;
                    let drawText = text;
                    while (drawText.length > 0 && measureCtx.measureText(drawText).width > maxTextW) {
                        drawText = drawText.substring(0, drawText.length - 1);
                    }
                    if (drawText.length < text.length && drawText.length > 3) {
                        drawText = drawText.substring(0, drawText.length - 3) + '...';
                    }
                    if (drawText.length > 0) {
                        ctx.fillStyle = r === 0 ? '#000' : '#333';
                        if (r === 0) ctx.font = `bold ${fontSize}px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif`;
                        else ctx.font = `${fontSize}px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif`;
                        ctx.fillText(drawText, x + cellPadding, rowY + cellPadding);
                    }
                    x += cellW;
                }
            }

            const jpegBlob = await Utils.canvasToBlob(canvas, 'image/jpeg', 0.92);
            const imgBytes = await jpegBlob.arrayBuffer();
            const pdfImage = await pdfDoc.embedJpg(imgBytes);
            const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
            page.drawImage(pdfImage, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
        }

        return await pdfDoc.save();
    }
};
