// ===== Stamp Tools Module =====

const StampTools = {
    state: null,

    render(container, subTool) {
        this.state = {
            stamps: [],
            baseType: null,
            baseImage: null,
            basePDFBytes: null,
            basePDFPages: [],
            currentPDFPage: 0,
            placedStamps: [],
            activeStampIdx: -1,
            displayScale: 1,
            panX: 0,
            panY: 0,
            exportFormat: 'png',
            exportQuality: 0.92,
            exportFilename: '',
            dragInfo: null,
            rotateInfo: null,
            isPanning: false,
            panStart: null,
            dropStampId: null,
            _keydownHandler: null,
        };

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>盖章工具</h2>
                    <p>导入印章图片，为图片或 PDF 添加印章，支持混合模式与批量盖章</p>
                    <button class="btn btn-sm stamp-help-btn" id="stamp-help-btn" title="使用说明">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        使用说明
                    </button>
                </div>
                <div class="stamp-layout">
                    <div class="stamp-sidebar">
                        <div class="stamp-section">
                            <h4>印章库</h4>
                            <div class="stamp-library" id="stamp-library">
                                <div class="stamp-lib-empty">点击下方按钮导入印章</div>
                            </div>
                            <button class="btn btn-sm btn-primary" id="stamp-add-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                                导入印章
                            </button>
                            <input type="file" id="stamp-file-input" accept="image/*" multiple style="display:none">
                        </div>
                        <div class="stamp-section">
                            <h4>底图</h4>
                            <div class="stamp-base-upload" id="stamp-base-upload">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
                                <p>点击或拖放上传底图</p>
                                <span>支持 PNG / JPG / PDF</span>
                            </div>
                            <input type="file" id="stamp-base-input" accept="image/*,.pdf" style="display:none">
                        </div>
                    </div>

                    <div class="stamp-canvas-wrap" id="stamp-canvas-wrap">
                        <div class="stamp-canvas-empty" id="stamp-canvas-empty">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M3 16l5-5 4 4 4-6 5 5"/></svg>
                            <p>请先上传底图</p>
                            <span style="font-size:12px;color:var(--text-muted)">支持拖放文件到此处</span>
                        </div>
                        <div class="stamp-canvas-viewport" id="stamp-canvas-viewport" style="display:none">
                            <canvas id="stamp-canvas"></canvas>
                        </div>
                        <div class="stamp-toolbar" id="stamp-toolbar" style="display:none">
                            <button class="btn btn-xs" id="stamp-zoom-fit" title="适应窗口">适应</button>
                            <button class="btn btn-xs" id="stamp-zoom-in" title="放大">+</button>
                            <span id="stamp-zoom-label" class="stamp-zoom-label">100%</span>
                            <button class="btn btn-xs" id="stamp-zoom-out" title="缩小">-</button>
                            <button class="btn btn-xs" id="stamp-zoom-reset" title="重置为100%">1:1</button>
                        </div>
                        <div class="stamp-pdf-nav hidden" id="stamp-pdf-nav">
                            <button class="btn btn-sm" id="stamp-pdf-prev">上一页</button>
                            <span id="stamp-pdf-page-info">1 / 1</span>
                            <button class="btn btn-sm" id="stamp-pdf-next">下一页</button>
                        </div>
                    </div>

                    <div class="stamp-controls" id="stamp-controls">
                        <div class="stamp-section">
                            <h4>印章设置</h4>
                            <div class="control-group">
                                <label>混合模式</label>
                                <select id="stamp-blend-mode">
                                    <option value="source-over">正常 (Normal)</option>
                                    <option value="multiply" selected>正片叠底 (Multiply)</option>
                                    <option value="darken">变暗 (Darken)</option>
                                    <option value="color-burn">颜色加深 (Color Burn)</option>
                                    <option value="hard-light">强光 (Hard Light)</option>
                                    <option value="overlay">叠加 (Overlay)</option>
                                </select>
                            </div>
                            <div class="control-group">
                                <label>透明度: <span id="stamp-opacity-val">100</span>%</label>
                                <input type="range" id="stamp-opacity" min="5" max="100" value="100">
                            </div>
                            <div class="control-group">
                                <label>印章大小: <span id="stamp-size-val">100</span>%</label>
                                <input type="range" id="stamp-size" min="10" max="500" value="100">
                            </div>
                            <div class="control-group">
                                <label>旋转角度: <span id="stamp-rotate-val">0</span>°</label>
                                <input type="range" id="stamp-rotate" min="-180" max="180" value="0">
                            </div>
                        </div>
                        <div class="stamp-section">
                            <h4>已放置印章</h4>
                            <div class="stamp-placed-list" id="stamp-placed-list">
                                <div class="stamp-placed-empty">拖拽印章到画布或双击放置</div>
                            </div>
                        </div>
                        <div class="stamp-section stamp-export-section">
                            <h4>导出</h4>
                            <div class="control-group">
                                <label>文件名</label>
                                <input type="text" id="stamp-export-name" placeholder="未命名盖章文件" class="stamp-filename-input">
                            </div>
                            <div class="control-group">
                                <label>格式</label>
                                <select id="stamp-export-format">
                                    <option value="png">PNG 图片</option>
                                    <option value="jpg">JPG 图片</option>
                                    <option value="pdf">PDF 文档</option>
                                </select>
                            </div>
                            <div class="control-group" id="stamp-quality-group">
                                <label>质量: <span id="stamp-quality-val">92</span>%</label>
                                <input type="range" id="stamp-quality" min="10" max="100" value="92">
                            </div>
                            <button class="btn btn-primary btn-block" id="stamp-export-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                导出文件
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading Overlay -->
            <div class="stamp-loading hidden" id="stamp-loading">
                <div class="stamp-loading-content">
                    <div class="spinner"></div>
                    <p class="stamp-loading-text" id="stamp-loading-text">正在加载...</p>
                    <div class="stamp-loading-bar-wrap">
                        <div class="stamp-loading-bar" id="stamp-loading-bar" style="width:0%"></div>
                    </div>
                </div>
            </div>

            <!-- Help Modal -->
            <div class="stamp-help-modal hidden" id="stamp-help-modal">
                <div class="stamp-help-backdrop"></div>
                <div class="stamp-help-dialog">
                    <h3>盖章工具使用说明</h3>
                    <div class="stamp-help-body">
                        <div class="stamp-help-step">
                            <span class="stamp-help-num">1</span>
                            <div>
                                <strong>导入印章</strong>
                                <p>点击「导入印章」按钮选择 PNG/JPG 印章图片，支持导入多个印章。导入后会自动保存，刷新不丢失。</p>
                            </div>
                        </div>
                        <div class="stamp-help-step">
                            <span class="stamp-help-num">2</span>
                            <div>
                                <strong>上传底图</strong>
                                <p>在左侧「底图」区域上传图片或 PDF 文件，也可直接拖放文件到画布区域。</p>
                            </div>
                        </div>
                        <div class="stamp-help-step">
                            <span class="stamp-help-num">3</span>
                            <div>
                                <strong>放置印章</strong>
                                <p>从印章库拖拽印章到画布，或双击印章缩略图放置到画布中央。</p>
                            </div>
                        </div>
                        <div class="stamp-help-step">
                            <span class="stamp-help-num">4</span>
                            <div>
                                <strong>调整印章</strong>
                                <p>拖拽移动位置，右侧滑块调节大小/旋转/透明度/混合模式。选中印章后按 Delete 可删除。</p>
                            </div>
                        </div>
                        <div class="stamp-help-step">
                            <span class="stamp-help-num">5</span>
                            <div>
                                <strong>缩放画布</strong>
                                <p>鼠标滚轮缩放，空白区域拖拽平移。底部工具栏可一键适应窗口或 1:1 显示。</p>
                            </div>
                        </div>
                        <div class="stamp-help-step">
                            <span class="stamp-help-num">6</span>
                            <div>
                                <strong>导出文件</strong>
                                <p>支持导出为 PNG / JPG / PDF 三种格式，底图为 PDF 时可在每页上盖章。填写自定义文件名后点击导出。</p>
                            </div>
                        </div>
                    </div>
                    <div class="stamp-help-footer">
                        <label class="stamp-help-check">
                            <input type="checkbox" id="stamp-help-dontshow">
                            <span>下次不再显示</span>
                        </label>
                        <button class="btn btn-primary btn-sm" id="stamp-help-close">我知道了</button>
                    </div>
                </div>
            </div>
        `;

        this._bindEvents(container);
        this._loadStampsFromStorage();
    },

    _bindEvents(container) {
        const s = this.state;

        // Stamp file input
        const stampInput = container.querySelector('#stamp-file-input');
        container.querySelector('#stamp-add-btn').onclick = () => stampInput.click();
        stampInput.onchange = (e) => this._loadStamps(e.target.files);

        // Base upload
        const baseUpload = container.querySelector('#stamp-base-upload');
        const baseInput = container.querySelector('#stamp-base-input');
        baseUpload.onclick = () => baseInput.click();
        baseUpload.ondragover = (e) => { e.preventDefault(); baseUpload.classList.add('drag-over'); };
        baseUpload.ondragleave = () => baseUpload.classList.remove('drag-over');
        baseUpload.ondrop = (e) => {
            e.preventDefault();
            baseUpload.classList.remove('drag-over');
            if (e.dataTransfer.files.length) this._loadBase(e.dataTransfer.files[0]);
        };
        baseInput.onchange = (e) => { if (e.target.files.length) this._loadBase(e.target.files[0]); };

        // PDF nav
        container.querySelector('#stamp-pdf-prev').onclick = () => this._pdfNav(-1);
        container.querySelector('#stamp-pdf-next').onclick = () => this._pdfNav(1);

        // Zoom controls
        container.querySelector('#stamp-zoom-in').onclick = () => this._zoomBy(1.25);
        container.querySelector('#stamp-zoom-out').onclick = () => this._zoomBy(0.8);
        container.querySelector('#stamp-zoom-reset').onclick = () => this._zoomTo(1);
        container.querySelector('#stamp-zoom-fit').onclick = () => this._fitToView();

        // Controls
        container.querySelector('#stamp-blend-mode').onchange = (e) => this._updateActiveStamp('blendMode', e.target.value);
        container.querySelector('#stamp-opacity').oninput = (e) => {
            container.querySelector('#stamp-opacity-val').textContent = e.target.value;
            this._updateActiveStamp('opacity', e.target.value / 100);
        };
        container.querySelector('#stamp-size').oninput = (e) => {
            container.querySelector('#stamp-size-val').textContent = e.target.value;
            this._updateActiveStamp('sizeRatio', e.target.value / 100);
        };
        container.querySelector('#stamp-rotate').oninput = (e) => {
            container.querySelector('#stamp-rotate-val').textContent = e.target.value;
            this._updateActiveStamp('rotation', e.target.value);
        };

        // Export
        container.querySelector('#stamp-export-format').onchange = (e) => {
            s.exportFormat = e.target.value;
            container.querySelector('#stamp-quality-group').style.display = e.target.value === 'jpg' ? '' : 'none';
        };
        container.querySelector('#stamp-quality').oninput = (e) => {
            container.querySelector('#stamp-quality-val').textContent = e.target.value;
            s.exportQuality = e.target.value / 100;
        };
        container.querySelector('#stamp-export-name').oninput = (e) => {
            s.exportFilename = e.target.value;
        };
        container.querySelector('#stamp-export-btn').onclick = () => this._export();

        // Canvas drop zone (accepts file drops and stamp drops)
        const viewport = container.querySelector('#stamp-canvas-viewport');
        viewport.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        viewport.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
        });
        viewport.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Check if it's a stamp drop (has stamp-id)
            const stampId = e.dataTransfer.getData('stamp-id');
            if (stampId) {
                const canvas = container.querySelector('#stamp-canvas');
                const rect = canvas.getBoundingClientRect();
                const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
                const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);
                this._placeStamp(stampId, canvasX, canvasY);
                return;
            }
            // Otherwise it's a file drop
            if (e.dataTransfer.files.length) {
                this._loadBase(e.dataTransfer.files[0]);
            }
        });

        // Help modal
        const helpBtn = container.querySelector('#stamp-help-btn');
        const helpModal = container.querySelector('#stamp-help-modal');
        const helpClose = container.querySelector('#stamp-help-close');
        const helpBackdrop = container.querySelector('.stamp-help-backdrop');
        const helpDontShow = container.querySelector('#stamp-help-dontshow');

        const closeHelp = () => {
            helpModal.classList.add('hidden');
            if (helpDontShow.checked) {
                localStorage.setItem('stamp_help_hidden', '1');
            }
        };

        if (helpBtn) {
            helpBtn.onclick = () => helpModal.classList.remove('hidden');
        }
        if (helpClose) helpClose.onclick = closeHelp;
        if (helpBackdrop) helpBackdrop.onclick = closeHelp;

        // Show help on first visit
        if (!localStorage.getItem('stamp_help_hidden')) {
            setTimeout(() => helpModal.classList.remove('hidden'), 500);
        }

        this._bindCanvasEvents(container);
    },

    _bindCanvasEvents(container) {
        const canvas = container.querySelector('#stamp-canvas');

        const getCanvasCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: (e.clientX - rect.left) * (canvas.width / rect.width),
                y: (e.clientY - rect.top) * (canvas.height / rect.height),
            };
        };

        canvas.addEventListener('mousedown', (e) => {
            const { x: sx, y: sy } = getCanvasCoords(e);

            // Check if clicked on a stamp
            let hitIdx = -1;
            for (let i = this.state.placedStamps.length - 1; i >= 0; i--) {
                if (this._hitTest(sx, sy, this.state.placedStamps[i])) {
                    hitIdx = i;
                    break;
                }
            }

            if (hitIdx >= 0) {
                this.state.activeStampIdx = hitIdx;
                this._syncControlsToStamp(hitIdx);
                this._refreshPlacedList();

                const ps = this.state.placedStamps[hitIdx];
                if (this._hitRotateHandle(sx, sy, ps)) {
                    this.state.rotateInfo = {
                        idx: hitIdx,
                        startAngle: Math.atan2(sy - (ps.y + ps.h / 2), sx - (ps.x + ps.w / 2)),
                        baseRotation: ps.rotation || 0,
                    };
                } else {
                    this.state.dragInfo = {
                        idx: hitIdx,
                        offsetX: sx - ps.x,
                        offsetY: sy - ps.y,
                    };
                }
            } else {
                this.state.activeStampIdx = -1;
                this._syncControlsToStamp(-1);
                this._refreshPlacedList();
                this.state.isPanning = true;
                this.state.panStart = { x: e.clientX - this.state.panX, y: e.clientY - this.state.panY };
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const { x: sx, y: sy } = getCanvasCoords(e);

            if (this.state.dragInfo) {
                const ps = this.state.placedStamps[this.state.dragInfo.idx];
                ps.x = sx - this.state.dragInfo.offsetX;
                ps.y = sy - this.state.dragInfo.offsetY;
                this._draw();
            } else if (this.state.rotateInfo) {
                const ri = this.state.rotateInfo;
                const ps = this.state.placedStamps[ri.idx];
                const cx = ps.x + ps.w / 2;
                const cy = ps.y + ps.h / 2;
                const angle = Math.atan2(sy - cy, sx - cx);
                let deg = ((angle - ri.startAngle) * 180 / Math.PI + ri.baseRotation) % 360;
                if (deg > 180) deg -= 360;
                if (deg < -180) deg += 360;
                ps.rotation = Math.round(deg);
                document.querySelector('#stamp-rotate').value = ps.rotation;
                document.querySelector('#stamp-rotate-val').textContent = ps.rotation;
                this._draw();
            } else if (this.state.isPanning && this.state.panStart) {
                this.state.panX = e.clientX - this.state.panStart.x;
                this.state.panY = e.clientY - this.state.panStart.y;
                this._updateTransform();
            } else {
                let hit = false;
                for (let i = this.state.placedStamps.length - 1; i >= 0; i--) {
                    const ps = this.state.placedStamps[i];
                    if (this._hitRotateHandle(sx, sy, ps)) {
                        canvas.style.cursor = 'grab';
                        hit = true;
                        break;
                    } else if (this._hitTest(sx, sy, ps)) {
                        canvas.style.cursor = 'move';
                        hit = true;
                        break;
                    }
                }
                if (!hit) canvas.style.cursor = 'crosshair';
            }
        });

        const endDrag = () => {
            this.state.dragInfo = null;
            this.state.rotateInfo = null;
            this.state.isPanning = false;
            this.state.panStart = null;
        };
        canvas.addEventListener('mouseup', endDrag);
        canvas.addEventListener('mouseleave', endDrag);

        // Delete key
        this.state._keydownHandler = (e) => {
            if (e.key === 'Delete' && this.state.activeStampIdx >= 0) {
                this.state.placedStamps.splice(this.state.activeStampIdx, 1);
                this.state.activeStampIdx = -1;
                this._refreshPlacedList();
                this._draw();
            }
        };
        document.addEventListener('keydown', this.state._keydownHandler);

        // Mouse wheel zoom (centered on cursor)
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const oldScale = this.state.displayScale;
            const newScale = Math.max(0.1, Math.min(10, oldScale * factor));

            // Adjust pan so zoom centers on cursor
            this.state.panX = mouseX - (mouseX - this.state.panX) * (newScale / oldScale);
            this.state.panY = mouseY - (mouseY - this.state.panY) * (newScale / oldScale);
            this.state.displayScale = newScale;

            this._updateTransform();
        }, { passive: false });

        // Double-click to place first stamp
        canvas.addEventListener('dblclick', (e) => {
            if (this.state.stamps.length === 0) return;
            const { x, y } = getCanvasCoords(e);
            this._placeStamp(this.state.stamps[0].id, x, y);
        });
    },

    _hitTest(mx, my, ps) {
        const cx = ps.x + ps.w / 2;
        const cy = ps.y + ps.h / 2;
        const rad = -(ps.rotation || 0) * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const dx = mx - cx;
        const dy = my - cy;
        const lx = dx * cos - dy * sin;
        const ly = dx * sin + dy * cos;
        return Math.abs(lx) <= ps.w / 2 && Math.abs(ly) <= ps.h / 2;
    },

    _hitRotateHandle(mx, my, ps) {
        const cx = ps.x + ps.w / 2;
        const cy = ps.y + ps.h / 2;
        const handleY = ps.y - 30;
        const dx = mx - cx;
        const dy = my - handleY;
        return Math.sqrt(dx * dx + dy * dy) < 14;
    },

    // ---- Stamp persistence (localStorage) ----
    _saveStampsToStorage() {
        try {
            const data = this.state.stamps.map(st => ({
                id: st.id,
                name: st.name,
                src: st.img.src,
            }));
            localStorage.setItem('stamp_tool_library', JSON.stringify(data));
        } catch (e) {
            // localStorage full or unavailable, silently ignore
        }
    },

    async _loadStampsFromStorage() {
        try {
            const raw = localStorage.getItem('stamp_tool_library');
            if (!raw) return;
            const data = JSON.parse(raw);
            for (const item of data) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                const loaded = await new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = item.src;
                });
                if (loaded) {
                    this.state.stamps.push({ id: item.id, img, name: item.name, thumb: img });
                }
            }
            this._refreshStampLibrary();
        } catch (e) {
            // ignore
        }
    },

    // ---- Load stamps from files ----
    async _loadStamps(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            const img = await this._readImage(file);
            const id = 'stamp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
            this.state.stamps.push({ id, img, name: file.name, thumb: img });
        }
        this._refreshStampLibrary();
        this._saveStampsToStorage();
    },

    _readImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // ---- Load base image/PDF ----
    async _loadBase(file) {
        const s = this.state;
        if (file.type === 'application/pdf') {
            s.baseType = 'pdf';
            this._showLoading('正在读取 PDF 文件...');
            s.basePDFBytes = await file.arrayBuffer();
            s.currentPDFPage = 0;
            await this._renderPDFPages();
            s.exportFilename = file.name.replace(/\.pdf$/i, '');
        } else if (file.type.startsWith('image/')) {
            s.baseType = 'image';
            this._showLoading('正在加载图片...');
            s.baseImage = await this._readImage(file);
            s.basePDFBytes = null;
            s.basePDFPages = [];
            s.exportFilename = file.name.replace(/\.[^.]+$/, '');
            this._hideLoading();
        } else {
            return;
        }
        document.querySelector('#stamp-export-name').value = s.exportFilename;
        document.querySelector('#stamp-canvas-empty').style.display = 'none';
        document.querySelector('#stamp-canvas-viewport').style.display = '';
        document.querySelector('#stamp-toolbar').style.display = '';

        const canvas = document.querySelector('#stamp-canvas');
        const bg = this._getCurrentBase();
        canvas.width = bg.width;
        canvas.height = bg.height;

        this.state.panX = 0;
        this.state.panY = 0;
        this.state.displayScale = 1;
        this._fitToView();
        this._draw();

        const pdfNav = document.querySelector('#stamp-pdf-nav');
        if (s.baseType === 'pdf') {
            pdfNav.classList.remove('hidden');
            this._updatePDFPageInfo();
        } else {
            pdfNav.classList.add('hidden');
        }
    },

    _showLoading(text) {
        const el = document.querySelector('#stamp-loading');
        const textEl = document.querySelector('#stamp-loading-text');
        const barEl = document.querySelector('#stamp-loading-bar');
        if (el) {
            el.classList.remove('hidden');
            if (textEl) textEl.textContent = text || '正在加载...';
            if (barEl) barEl.style.width = '0%';
        }
    },

    _updateLoading(text, percent) {
        const textEl = document.querySelector('#stamp-loading-text');
        const barEl = document.querySelector('#stamp-loading-bar');
        if (textEl && text) textEl.textContent = text;
        if (barEl && percent !== undefined) barEl.style.width = percent + '%';
    },

    _hideLoading() {
        const el = document.querySelector('#stamp-loading');
        if (el) el.classList.add('hidden');
    },

    async _renderPDFPages() {
        const s = this.state;
        if (!s.basePDFBytes) return;
        try {
            const pdf = await pdfjsLib.getDocument({ data: s.basePDFBytes.slice(0) }).promise;
            s.basePDFPages = [];
            const total = pdf.numPages;
            for (let i = 1; i <= total; i++) {
                this._updateLoading(`正在渲染第 ${i}/${total} 页...`, Math.round((i / total) * 90));
                const page = await pdf.getPage(i);
                const vp = page.getViewport({ scale: 2 });
                const c = document.createElement('canvas');
                c.width = vp.width;
                c.height = vp.height;
                const ctx = c.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: vp }).promise;
                const img = new Image();
                img.src = c.toDataURL('image/png');
                await new Promise(r => { img.onload = r; });
                s.basePDFPages.push(img);
            }
            this._updateLoading('加载完成', 100);
            setTimeout(() => this._hideLoading(), 300);
        } catch (err) {
            this._hideLoading();
            console.error('PDF render error:', err);
            Toast.show('PDF 渲染失败: ' + err.message, 'error');
        }
    },

    _getCurrentBase() {
        const s = this.state;
        if (s.baseType === 'image') return s.baseImage;
        if (s.baseType === 'pdf' && s.basePDFPages.length) return s.basePDFPages[s.currentPDFPage];
        return null;
    },

    // ---- Zoom / Pan ----
    _fitToView() {
        const wrap = document.querySelector('#stamp-canvas-wrap');
        const canvas = document.querySelector('#stamp-canvas');
        const bg = this._getCurrentBase();
        if (!bg || !wrap) return;

        const wrapW = wrap.clientWidth - 20;
        const wrapH = wrap.clientHeight - 70;
        const ratio = Math.min(wrapW / bg.width, wrapH / bg.height, 1);

        this.state.displayScale = ratio;
        this.state.panX = (wrap.clientWidth - bg.width * ratio) / 2;
        this.state.panY = (wrap.clientHeight - 50 - bg.height * ratio) / 2;
        this._updateTransform();
    },

    _zoomBy(factor) {
        const wrap = document.querySelector('#stamp-canvas-wrap');
        const cx = wrap.clientWidth / 2;
        const cy = (wrap.clientHeight - 50) / 2;
        const oldScale = this.state.displayScale;
        const newScale = Math.max(0.05, Math.min(10, oldScale * factor));
        this.state.panX = cx - (cx - this.state.panX) * (newScale / oldScale);
        this.state.panY = cy - (cy - this.state.panY) * (newScale / oldScale);
        this.state.displayScale = newScale;
        this._updateTransform();
    },

    _zoomTo(scale) {
        const wrap = document.querySelector('#stamp-canvas-wrap');
        const cx = wrap.clientWidth / 2;
        const cy = (wrap.clientHeight - 50) / 2;
        const oldScale = this.state.displayScale;
        this.state.panX = cx - (cx - this.state.panX) * (scale / oldScale);
        this.state.panY = cy - (cy - this.state.panY) * (scale / oldScale);
        this.state.displayScale = scale;
        this._updateTransform();
    },

    _updateTransform() {
        const canvas = document.querySelector('#stamp-canvas');
        if (!canvas) return;
        const s = this.state;
        canvas.style.transform = `translate(${s.panX}px, ${s.panY}px) scale(${s.displayScale})`;
        canvas.style.transformOrigin = '0 0';
        const label = document.querySelector('#stamp-zoom-label');
        if (label) label.textContent = Math.round(s.displayScale * 100) + '%';
    },

    // ---- Draw ----
    _draw() {
        const canvas = document.querySelector('#stamp-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = this.state;
        const bg = this._getCurrentBase();
        if (!bg) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Checkerboard background for transparency
        const size = 8;
        for (let y = 0; y < canvas.height; y += size) {
            for (let x = 0; x < canvas.width; x += size) {
                ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? '#2a2a2a' : '#222222';
                ctx.fillRect(x, y, size, size);
            }
        }

        // Draw base
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        // Draw placed stamps
        s.placedStamps.forEach((ps, idx) => {
            const stamp = s.stamps.find(st => st.id === ps.stampId);
            if (!stamp) return;

            ctx.save();
            const cx = ps.x + ps.w / 2;
            const cy = ps.y + ps.h / 2;
            ctx.translate(cx, cy);
            ctx.rotate((ps.rotation || 0) * Math.PI / 180);
            ctx.globalAlpha = ps.opacity;
            ctx.globalCompositeOperation = ps.blendMode || 'source-over';
            ctx.drawImage(stamp.img, -ps.w / 2, -ps.h / 2, ps.w, ps.h);
            ctx.restore();

            // Selection outline
            if (idx === s.activeStampIdx) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate((ps.rotation || 0) * Math.PI / 180);
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(-ps.w / 2 - 2, -ps.h / 2 - 2, ps.w + 4, ps.h + 4);
                ctx.setLineDash([]);

                // Rotation handle
                ctx.beginPath();
                ctx.arc(0, -ps.h / 2 - 28, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#6366f1';
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, -ps.h / 2 - 2);
                ctx.lineTo(0, -ps.h / 2 - 20);
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
            }
        });
    },

    _placeStamp(stampId, x, y) {
        const stamp = this.state.stamps.find(s => s.id === stampId);
        if (!stamp) return;

        const base = this._getCurrentBase();
        if (!base) return;

        const sizeRatio = parseInt(document.querySelector('#stamp-size')?.value || 100) / 100;
        const defaultSize = Math.min(base.width, base.height) * 0.15 * sizeRatio;

        this.state.placedStamps.push({
            id: 'placed_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            stampId,
            x: x - defaultSize / 2,
            y: y - defaultSize / 2,
            w: defaultSize,
            h: defaultSize,
            rotation: 0,
            blendMode: document.querySelector('#stamp-blend-mode')?.value || 'multiply',
            opacity: parseInt(document.querySelector('#stamp-opacity')?.value || 100) / 100,
            sizeRatio,
        });

        this.state.activeStampIdx = this.state.placedStamps.length - 1;
        this._refreshPlacedList();
        this._draw();
    },

    _updateActiveStamp(prop, value) {
        if (this.state.activeStampIdx < 0) return;
        const ps = this.state.placedStamps[this.state.activeStampIdx];
        if (prop === 'sizeRatio') {
            const base = this._getCurrentBase();
            if (base) {
                const defaultSize = Math.min(base.width, base.height) * 0.15 * value;
                const cx = ps.x + ps.w / 2;
                const cy = ps.y + ps.h / 2;
                ps.w = defaultSize;
                ps.h = defaultSize;
                ps.x = cx - defaultSize / 2;
                ps.y = cy - defaultSize / 2;
            }
        } else {
            ps[prop] = value;
        }
        this._draw();
    },

    _syncControlsToStamp(idx) {
        const ps = this.state.placedStamps[idx];
        if (!ps) return;
        const setVal = (id, val) => {
            const el = document.querySelector(id);
            if (el) el.value = val;
        };
        setVal('#stamp-blend-mode', ps.blendMode);
        setVal('#stamp-opacity', Math.round(ps.opacity * 100));
        document.querySelector('#stamp-opacity-val').textContent = Math.round(ps.opacity * 100);
        setVal('#stamp-rotate', ps.rotation || 0);
        document.querySelector('#stamp-rotate-val').textContent = ps.rotation || 0;
    },

    // ---- Stamp Library UI ----
    _refreshStampLibrary() {
        const lib = document.querySelector('#stamp-library');
        if (!lib) return;
        if (this.state.stamps.length === 0) {
            lib.innerHTML = '<div class="stamp-lib-empty">点击下方按钮导入印章</div>';
            return;
        }
        lib.innerHTML = '';
        this.state.stamps.forEach(st => {
            const div = document.createElement('div');
            div.className = 'stamp-lib-item';
            div.draggable = true;
            div.title = st.name + ' (拖拽到画布放置)';
            div.innerHTML = `<img src="${st.thumb.src}" alt="${st.name}"><span class="stamp-lib-name">${st.name}</span>`;

            // Drag start - set stamp ID
            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('stamp-id', st.id);
                e.dataTransfer.effectAllowed = 'copy';
                div.classList.add('stamp-dragging');
            });
            div.addEventListener('dragend', () => {
                div.classList.remove('stamp-dragging');
            });

            div.onclick = () => {
                document.querySelectorAll('.stamp-lib-item').forEach(i => i.classList.remove('selected'));
                div.classList.add('selected');
            };

            // Right-click to delete from library
            const delBtn = document.createElement('button');
            delBtn.className = 'stamp-lib-del';
            delBtn.innerHTML = '&times;';
            delBtn.title = '从库中移除';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                this.state.stamps = this.state.stamps.filter(s => s.id !== st.id);
                this._refreshStampLibrary();
                this._saveStampsToStorage();
            };
            div.appendChild(delBtn);
            lib.appendChild(div);
        });
    },

    _refreshPlacedList() {
        const list = document.querySelector('#stamp-placed-list');
        if (!list) return;
        if (this.state.placedStamps.length === 0) {
            list.innerHTML = '<div class="stamp-placed-empty">拖拽印章到画布或双击放置</div>';
            return;
        }
        list.innerHTML = '';
        this.state.placedStamps.forEach((ps, idx) => {
            const stamp = this.state.stamps.find(s => s.id === ps.stampId);
            const div = document.createElement('div');
            div.className = 'stamp-placed-item' + (idx === this.state.activeStampIdx ? ' active' : '');
            div.innerHTML = `
                <img src="${stamp?.thumb?.src || ''}" class="stamp-placed-thumb">
                <span class="stamp-placed-label">印章 ${idx + 1}</span>
                <button class="btn btn-xs stamp-placed-del" title="删除">&times;</button>
            `;
            div.onclick = () => {
                this.state.activeStampIdx = idx;
                this._syncControlsToStamp(idx);
                this._refreshPlacedList();
                this._draw();
            };
            div.querySelector('.stamp-placed-del').onclick = (e) => {
                e.stopPropagation();
                this.state.placedStamps.splice(idx, 1);
                if (this.state.activeStampIdx === idx) this.state.activeStampIdx = -1;
                else if (this.state.activeStampIdx > idx) this.state.activeStampIdx--;
                this._refreshPlacedList();
                this._draw();
            };
            list.appendChild(div);
        });
    },

    _pdfNav(delta) {
        const s = this.state;
        if (s.baseType !== 'pdf') return;
        const newPage = s.currentPDFPage + delta;
        if (newPage < 0 || newPage >= s.basePDFPages.length) return;
        s.currentPDFPage = newPage;

        const canvas = document.querySelector('#stamp-canvas');
        const bg = s.basePDFPages[s.currentPDFPage];
        canvas.width = bg.width;
        canvas.height = bg.height;

        this._fitToView();
        this._draw();
        this._updatePDFPageInfo();
    },

    _updatePDFPageInfo() {
        const info = document.querySelector('#stamp-pdf-page-info');
        if (info) {
            info.textContent = `${this.state.currentPDFPage + 1} / ${this.state.basePDFPages.length}`;
        }
    },

    // ---- Export ----
    async _export() {
        const s = this.state;
        const bg = this._getCurrentBase();
        if (!bg) {
            Toast.show('请先上传底图', 'warning');
            return;
        }
        Toast.show('正在导出...', 'info');
        try {
            if (s.exportFormat === 'pdf') {
                await this._exportAsPDF();
            } else {
                await this._exportAsImage();
            }
        } catch (err) {
            console.error('Export error:', err);
            Toast.show('导出失败: ' + err.message, 'error');
        }
    },

    async _exportAsImage() {
        const s = this.state;
        const bg = this._getCurrentBase();

        if (s.baseType === 'pdf') {
            // PDF → image: render current page with stamps
            const offscreen = document.createElement('canvas');
            offscreen.width = bg.width;
            offscreen.height = bg.height;
            const ctx = offscreen.getContext('2d');
            ctx.drawImage(bg, 0, 0);

            s.placedStamps.forEach(ps => {
                const stamp = s.stamps.find(st => st.id === ps.stampId);
                if (!stamp) return;
                ctx.save();
                ctx.translate(ps.x + ps.w / 2, ps.y + ps.h / 2);
                ctx.rotate((ps.rotation || 0) * Math.PI / 180);
                ctx.globalAlpha = ps.opacity;
                ctx.globalCompositeOperation = ps.blendMode || 'source-over';
                ctx.drawImage(stamp.img, -ps.w / 2, -ps.h / 2, ps.w, ps.h);
                ctx.restore();
            });

            const fmt = s.exportFormat;
            const mime = fmt === 'jpg' ? 'image/jpeg' : 'image/png';
            const ext = fmt === 'jpg' ? 'jpg' : 'png';
            const blob = await new Promise(r => offscreen.toBlob(r, mime, s.exportQuality));
            const pageNum = s.basePDFPages.length > 1 ? `_第${s.currentPDFPage + 1}页` : '';
            const filename = (s.exportFilename || '盖章文件') + pageNum + '.' + ext;
            saveAs(blob, filename);
            Toast.show('导出成功: ' + filename, 'success');
        } else {
            // Image → image
            const offscreen = document.createElement('canvas');
            offscreen.width = bg.width;
            offscreen.height = bg.height;
            const ctx = offscreen.getContext('2d');
            ctx.drawImage(bg, 0, 0);

            s.placedStamps.forEach(ps => {
                const stamp = s.stamps.find(st => st.id === ps.stampId);
                if (!stamp) return;
                ctx.save();
                ctx.translate(ps.x + ps.w / 2, ps.y + ps.h / 2);
                ctx.rotate((ps.rotation || 0) * Math.PI / 180);
                ctx.globalAlpha = ps.opacity;
                ctx.globalCompositeOperation = ps.blendMode || 'source-over';
                ctx.drawImage(stamp.img, -ps.w / 2, -ps.h / 2, ps.w, ps.h);
                ctx.restore();
            });

            const fmt = s.exportFormat;
            const mime = fmt === 'jpg' ? 'image/jpeg' : 'image/png';
            const ext = fmt === 'jpg' ? 'jpg' : 'png';
            const blob = await new Promise(r => offscreen.toBlob(r, mime, s.exportQuality));
            const filename = (s.exportFilename || '盖章文件') + '.' + ext;
            saveAs(blob, filename);
            Toast.show('导出成功: ' + filename, 'success');
        }
    },

    async _exportAsPDF() {
        const s = this.state;
        const bg = this._getCurrentBase();

        if (s.baseType === 'pdf' && s.basePDFBytes) {
            // PDF → PDF: stamp directly onto existing PDF
            const pdfDoc = await PDFLib.PDFDocument.load(s.basePDFBytes);
            const pages = pdfDoc.getPages();

            for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
                const page = pages[pageIdx];
                const { width, height } = page.getSize();
                const bgImg = s.basePDFPages[pageIdx];
                if (!bgImg) continue;

                const scaleX = width / bgImg.width;
                const scaleY = height / bgImg.height;

                for (const ps of s.placedStamps) {
                    const stamp = s.stamps.find(st => st.id === ps.stampId);
                    if (!stamp) continue;

                    const stampW = ps.w * scaleX;
                    const stampH = ps.h * scaleY;
                    const offC = document.createElement('canvas');
                    offC.width = Math.ceil(stampW);
                    offC.height = Math.ceil(stampH);
                    const offCtx = offC.getContext('2d');
                    offCtx.globalAlpha = ps.opacity;
                    offCtx.globalCompositeOperation = ps.blendMode || 'source-over';
                    if (ps.rotation) {
                        offCtx.translate(stampW / 2, stampH / 2);
                        offCtx.rotate(ps.rotation * Math.PI / 180);
                        offCtx.drawImage(stamp.img, -stampW / 2, -stampH / 2, stampW, stampH);
                    } else {
                        offCtx.drawImage(stamp.img, 0, 0, stampW, stampH);
                    }

                    const stampBlob = await new Promise(r => offC.toBlob(r, 'image/png'));
                    const stampBytes = await stampBlob.arrayBuffer();
                    const stampPDFImg = await pdfDoc.embedPng(stampBytes);

                    const posX = ps.x * scaleX;
                    const posY = height - (ps.y * scaleY) - stampH;

                    page.drawImage(stampPDFImg, {
                        x: posX,
                        y: posY,
                        width: stampW,
                        height: stampH,
                        rotate: PDFLib.degrees(ps.rotation || 0),
                        opacity: ps.opacity,
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const filename = (s.exportFilename || '盖章文件') + '.pdf';
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            saveAs(blob, filename);
            Toast.show('导出成功: ' + filename, 'success');
        } else {
            // Image → PDF: create new PDF with the image
            const pdfDoc = await PDFLib.PDFDocument.create();

            // Render image with stamps onto offscreen canvas
            const offscreen = document.createElement('canvas');
            offscreen.width = bg.width;
            offscreen.height = bg.height;
            const ctx = offscreen.getContext('2d');
            ctx.drawImage(bg, 0, 0);

            s.placedStamps.forEach(ps => {
                const stamp = s.stamps.find(st => st.id === ps.stampId);
                if (!stamp) return;
                ctx.save();
                ctx.translate(ps.x + ps.w / 2, ps.y + ps.h / 2);
                ctx.rotate((ps.rotation || 0) * Math.PI / 180);
                ctx.globalAlpha = ps.opacity;
                ctx.globalCompositeOperation = ps.blendMode || 'source-over';
                ctx.drawImage(stamp.img, -ps.w / 2, -ps.h / 2, ps.w, ps.h);
                ctx.restore();
            });

            const imgBlob = await new Promise(r => offscreen.toBlob(r, 'image/png'));
            const imgBytes = await imgBlob.arrayBuffer();
            const pdfImg = await pdfDoc.embedPng(imgBytes);

            const page = pdfDoc.addPage([bg.width, bg.height]);
            page.drawImage(pdfImg, {
                x: 0,
                y: 0,
                width: bg.width,
                height: bg.height,
            });

            const pdfBytes = await pdfDoc.save();
            const filename = (s.exportFilename || '盖章文件') + '.pdf';
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            saveAs(blob, filename);
            Toast.show('导出成功: ' + filename, 'success');
        }
    },
};
