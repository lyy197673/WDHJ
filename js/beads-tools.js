// ===== Beads (拼豆) Tools Module =====

const BeadsTools = {
    state: null,

    // =============================================
    // Artkal Color Data
    // =============================================
    COLORS: {
        S: [
            { id: 'S01', name: '白色', hex: '#FFFFFF' },
            { id: 'S02', name: '黑色', hex: '#1A1A1A' },
            { id: 'S03', name: '红色', hex: '#E4002B' },
            { id: 'S04', name: '深红', hex: '#B5191F' },
            { id: 'S05', name: '粉色', hex: '#F7CAC9' },
            { id: 'S06', name: '浅粉', hex: '#FADADD' },
            { id: 'S07', name: '玫红', hex: '#D4207C' },
            { id: 'S08', name: '橙红', hex: '#F9423A' },
            { id: 'S09', name: '橙色', hex: '#F58220' },
            { id: 'S10', name: '金色', hex: '#FFC72C' },
            { id: 'S11', name: '黄色', hex: '#FFED00' },
            { id: 'S12', name: '浅黄', hex: '#FFF4A3' },
            { id: 'S13', name: '草绿', hex: '#97D700' },
            { id: 'S14', name: '绿色', hex: '#009A44' },
            { id: 'S15', name: '深绿', hex: '#007A33' },
            { id: 'S16', name: '墨绿', hex: '#004818' },
            { id: 'S17', name: '青色', hex: '#009CA6' },
            { id: 'S18', name: '天蓝', hex: '#00A3E0' },
            { id: 'S19', name: '蓝色', hex: '#003DA5' },
            { id: 'S20', name: '深蓝', hex: '#002D72' },
            { id: 'S21', name: '藏蓝', hex: '#0C1E5C' },
            { id: 'S22', name: '紫色', hex: '#6F2DA8' },
            { id: 'S23', name: '浅紫', hex: '#C6A4D4' },
            { id: 'S24', name: '深紫', hex: '#3B006E' },
            { id: 'S25', name: '棕色', hex: '#6B3A2A' },
            { id: 'S26', name: '深棕', hex: '#3E1F0F' },
            { id: 'S27', name: '浅棕', hex: '#A0522D' },
            { id: 'S28', name: '肤色', hex: '#FFCC99' },
            { id: 'S29', name: '肉粉', hex: '#FFCBA4' },
            { id: 'S30', name: '灰色', hex: '#808080' },
            { id: 'S31', name: '浅灰', hex: '#BFBFBF' },
            { id: 'S32', name: '深灰', hex: '#404040' },
            { id: 'S33', name: '银色', hex: '#C0C0C0' },
            { id: 'S34', name: '荧光粉', hex: '#FF69B4' },
            { id: 'S35', name: '荧光绿', hex: '#39FF14' },
            { id: 'S36', name: '荧光橙', hex: '#FF5F1F' },
            { id: 'S37', name: '荧光黄', hex: '#CCFF00' },
            { id: 'S38', name: '珊瑚', hex: '#FF7F50' },
            { id: 'S39', name: '酒红', hex: '#722F37' },
            { id: 'S40', name: '土黄', hex: '#C49B3C' },
            { id: 'S41', name: '杏色', hex: '#FBCEB1' },
            { id: 'S42', name: '卡其', hex: '#C3B091' },
            { id: 'S43', name: '橄榄', hex: '#808000' },
            { id: 'S44', name: '薄荷', hex: '#98FF98' },
            { id: 'S45', name: '湖蓝', hex: '#30D5C8' },
            { id: 'S46', name: '靛蓝', hex: '#2E0854' },
            { id: 'S47', name: '丁香', hex: '#C8A2C8' },
            { id: 'S48', name: '栗色', hex: '#800000' },
            { id: 'S49', name: '驼色', hex: '#C19A6B' },
            { id: 'S50', name: '烟灰', hex: '#71797E' },
            { id: 'S51', name: '象牙', hex: '#FFFFF0' },
            { id: 'S52', name: '奶白', hex: '#FFFDD0' },
            { id: 'S53', name: '砖红', hex: '#CB4154' },
            { id: 'S54', name: '西瓜', hex: '#FD4659' },
            { id: 'S55', name: '桃红', hex: '#FF6188' },
            { id: 'S56', name: '薰衣草', hex: '#E6E6FA' },
            { id: 'S57', name: '钴蓝', hex: '#0047AB' },
            { id: 'S58', name: '海军蓝', hex: '#000080' },
            { id: 'S59', name: '松石绿', hex: '#40E0D0' },
            { id: 'S60', name: '苔绿', hex: '#4A5D23' },
            { id: 'S61', name: '柠黄', hex: '#FFF44F' },
            { id: 'S62', name: '暗橘', hex: '#FF8C00' },
            { id: 'S63', name: '藕粉', hex: '#EDD1D8' },
            { id: 'S64', name: '冰蓝', hex: '#A5F2F3' },
            { id: 'S65', name: '紫罗兰', hex: '#7F00FF' },
            { id: 'S66', name: '品蓝', hex: '#0000CD' },
            { id: 'S67', name: '湖绿', hex: '#3CB371' },
            { id: 'S68', name: '橄榄绿', hex: '#556B2F' },
            { id: 'S69', name: '暗黄', hex: '#DAA520' },
            { id: 'S70', name: '浅驼', hex: '#D2B48C' },
        ],
        R: [
            { id: 'R01', name: '白色', hex: '#FFFFFF' },
            { id: 'R02', name: '黑色', hex: '#1A1A1A' },
            { id: 'R03', name: '红色', hex: '#E4002B' },
            { id: 'R04', name: '深红', hex: '#B5191F' },
            { id: 'R05', name: '粉色', hex: '#F7CAC9' },
            { id: 'R06', name: '浅粉', hex: '#FADADD' },
            { id: 'R07', name: '玫红', hex: '#D4207C' },
            { id: 'R08', name: '橙红', hex: '#F9423A' },
            { id: 'R09', name: '橙色', hex: '#F58220' },
            { id: 'R10', name: '金色', hex: '#FFC72C' },
            { id: 'R11', name: '黄色', hex: '#FFED00' },
            { id: 'R12', name: '浅黄', hex: '#FFF4A3' },
            { id: 'R13', name: '草绿', hex: '#97D700' },
            { id: 'R14', name: '绿色', hex: '#009A44' },
            { id: 'R15', name: '深绿', hex: '#007A33' },
            { id: 'R16', name: '墨绿', hex: '#004818' },
            { id: 'R17', name: '青色', hex: '#009CA6' },
            { id: 'R18', name: '天蓝', hex: '#00A3E0' },
            { id: 'R19', name: '蓝色', hex: '#003DA5' },
            { id: 'R20', name: '深蓝', hex: '#002D72' },
            { id: 'R21', name: '藏蓝', hex: '#0C1E5C' },
            { id: 'R22', name: '紫色', hex: '#6F2DA8' },
            { id: 'R23', name: '浅紫', hex: '#C6A4D4' },
            { id: 'R24', name: '深紫', hex: '#3B006E' },
            { id: 'R25', name: '棕色', hex: '#6B3A2A' },
            { id: 'R26', name: '深棕', hex: '#3E1F0F' },
            { id: 'R27', name: '浅棕', hex: '#A0522D' },
            { id: 'R28', name: '肤色', hex: '#FFCC99' },
            { id: 'R29', name: '肉粉', hex: '#FFCBA4' },
            { id: 'R30', name: '灰色', hex: '#808080' },
            { id: 'R31', name: '浅灰', hex: '#BFBFBF' },
            { id: 'R32', name: '深灰', hex: '#404040' },
            { id: 'R33', name: '银色', hex: '#C0C0C0' },
            { id: 'R34', name: '荧光粉', hex: '#FF69B4' },
            { id: 'R35', name: '荧光绿', hex: '#39FF14' },
            { id: 'R36', name: '荧光橙', hex: '#FF5F1F' },
            { id: 'R37', name: '荧光黄', hex: '#CCFF00' },
            { id: 'R38', name: '珊瑚', hex: '#FF7F50' },
            { id: 'R39', name: '酒红', hex: '#722F37' },
            { id: 'R40', name: '土黄', hex: '#C49B3C' },
            { id: 'R41', name: '杏色', hex: '#FBCEB1' },
            { id: 'R42', name: '卡其', hex: '#C3B091' },
            { id: 'R43', name: '橄榄', hex: '#808000' },
            { id: 'R44', name: '薄荷', hex: '#98FF98' },
            { id: 'R45', name: '湖蓝', hex: '#30D5C8' },
            { id: 'R46', name: '靛蓝', hex: '#2E0854' },
            { id: 'R47', name: '丁香', hex: '#C8A2C8' },
            { id: 'R48', name: '栗色', hex: '#800000' },
            { id: 'R49', name: '驼色', hex: '#C19A6B' },
            { id: 'R50', name: '烟灰', hex: '#71797E' },
            { id: 'R51', name: '象牙', hex: '#FFFFF0' },
            { id: 'R52', name: '奶白', hex: '#FFFDD0' },
            { id: 'R53', name: '砖红', hex: '#CB4154' },
            { id: 'R54', name: '西瓜', hex: '#FD4659' },
            { id: 'R55', name: '桃红', hex: '#FF6188' },
            { id: 'R56', name: '薰衣草', hex: '#E6E6FA' },
            { id: 'R57', name: '钴蓝', hex: '#0047AB' },
            { id: 'R58', name: '海军蓝', hex: '#000080' },
            { id: 'R59', name: '松石绿', hex: '#40E0D0' },
            { id: 'R60', name: '苔绿', hex: '#4A5D23' },
        ],
    },

    // Symbol palette for symbol mode
    SYMBOLS: [
        '●','○','▲','△','■','□','◆','◇','★','☆',
        '⊕','⊗','⊙','◎','◉','▲','▼','◄','►','✦',
        '♥','♦','♣','♠','☯','✿','❀','✦','⚡','☀',
        '☁','☂','☃','★','☆','☯','✿','❀','⚡','☀',
        '+a','-a','+b','-b','+c','-c','+d','-d','+e','-e',
        '+f','-f','+g','-g','+h','-h','+i','-i','+j','-j',
        '①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩',
        '⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳',
        '⑴','⑵','⑶','⑷','⑸','⑹','⑺','⑻','⑼','⑽',
        'A','B','C','D','E','F','G','H','I','J',
        'K','L','M','N','O','P','Q','R','S','T',
        'U','V','W','X','Y','Z',
        'a','b','c','d','e','f','g','h','i','j',
        'k','l','m','n','o','p','q','r','s','t',
        'u','v','w','x','y','z',
        '1','2','3','4','5','6','7','8','9','0',
    ],

    // =============================================
    // Main Entry
    // =============================================
    render(container, subTool) {
        this.state = {
            mode: subTool || 'auto',
            series: 'S',
            cols: 29,
            rows: 29,
            // Auto mode
            sourceImage: null,
            quantized: null,
            gridData: null,
            // Manual mode
            baseImage: null,
            drawMode: 'pen',
            drawColor: 'S01',
            isDrawing: false,
            // Canvas
            displayScale: 1,
            panX: 0,
            panY: 0,
            isPanning: false,
            panStart: null,
            // Export
            exportMode: 'grid',
            exportFormat: 'png',
            // Undo
            undoStack: [],
            redoStack: [],
            // Grid display
            showNumbers: true,
            cellSize: 12,
            // Base image overlay
            baseOpacity: 0.3,
            // Color stats
            colorStats: null,
        };

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>拼豆图纸工具</h2>
                    <p>将图片转为拼豆图纸 · Artkal S/R系列 · 自由绘制 · 高清导出</p>
                </div>
                <div class="tool-tabs" id="beads-tabs">
                    <button class="tool-tab${this.state.mode === 'auto' ? ' active' : ''}" data-mode="auto">自动模式</button>
                    <button class="tool-tab${this.state.mode === 'manual' ? ' active' : ''}" data-mode="manual">手动绘制</button>
                </div>
                <div id="beads-content"></div>
            </div>
        `;

        const tabs = container.querySelectorAll('.tool-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.state.mode = tab.dataset.mode;
                this._renderMode();
            };
        });

        this._renderMode();
    },

    _renderMode() {
        const content = document.getElementById('beads-content');
        if (this.state) {
            this.state._canvasEventsBound = false;
            this.state._autoCanvasEventsBound = false;
        }
        if (this.state.mode === 'auto') {
            this._renderAutoMode(content);
        } else {
            this._renderManualMode(content);
        }
    },

    // =============================================
    // Auto Mode
    // =============================================
    _renderAutoMode(container) {
        container.innerHTML = `
            <div class="beads-layout">
                <div class="beads-sidebar">
                    <div class="stamp-section">
                        <h4>1. 选择系列</h4>
                        <div class="control-group">
                            <div class="beads-series-toggle">
                                <button class="btn btn-sm ${this.state.series === 'S' ? 'btn-primary' : ''}" id="beads-series-s">S系列 (小圆豆)</button>
                                <button class="btn btn-sm ${this.state.series === 'R' ? 'btn-primary' : ''}" id="beads-series-r">R系列 (大圆豆)</button>
                            </div>
                        </div>
                    </div>
                    <div class="stamp-section">
                        <h4>2. 网格尺寸</h4>
                        <div class="control-group">
                            <label>列数（宽）</label>
                            <input type="number" id="beads-cols" value="${this.state.cols}" min="1" max="500" class="beads-num-input">
                        </div>
                        <div class="control-group">
                            <label>行数（高）</label>
                            <input type="number" id="beads-rows" value="${this.state.rows}" min="1" max="500" class="beads-num-input">
                        </div>
                        <button class="btn btn-sm btn-primary" id="beads-apply-size">应用尺寸</button>
                        <div class="beads-quick-sizes">
                            <button class="btn btn-xs" data-w="29" data-h="29">29x29</button>
                            <button class="btn btn-xs" data-w="58" data-h="29">58x29</button>
                            <button class="btn btn-xs" data-w="58" data-h="58">58x58</button>
                            <button class="btn btn-xs" data-w="100" data-h="100">100x100</button>
                        </div>
                    </div>
                    <div class="stamp-section">
                        <h4>3. 上传图片</h4>
                        <div class="stamp-base-upload" id="beads-upload">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
                            <p>点击或拖放上传图片</p>
                            <span>PNG / JPG / GIF</span>
                        </div>
                        <input type="file" id="beads-file-input" accept="image/*" style="display:none">
                    </div>
                    <div class="stamp-section" id="beads-color-replace-section" style="display:none">
                        <h4>颜色替换</h4>
                        <div class="beads-replace-row">
                            <div class="control-group">
                                <label>替换前</label>
                                <div class="beads-color-selector" id="beads-replace-from-btn">
                                    <div class="beads-color-preview" id="beads-replace-from-preview"></div>
                                    <span id="beads-replace-from-label">点击选择</span>
                                </div>
                            </div>
                            <div class="control-group">
                                <label>替换为</label>
                                <div class="beads-color-selector" id="beads-replace-to-btn">
                                    <div class="beads-color-preview" id="beads-replace-to-preview"></div>
                                    <span id="beads-replace-to-label">点击选择</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-sm" id="beads-replace-btn">执行替换</button>
                    </div>
                </div>

                <div class="beads-canvas-wrap" id="beads-canvas-wrap">
                    <div class="beads-canvas-viewport" id="beads-viewport">
                        <canvas id="beads-canvas"></canvas>
                    </div>
                    <div class="stamp-toolbar" id="beads-toolbar">
                        <button class="btn btn-xs" id="beads-zoom-fit" title="适应窗口">适应</button>
                        <button class="btn btn-xs" id="beads-zoom-in" title="放大">+</button>
                        <span id="beads-zoom-label" class="stamp-zoom-label">100%</span>
                        <button class="btn btn-xs" id="beads-zoom-out" title="缩小">-</button>
                        <button class="btn btn-xs" id="beads-zoom-reset" title="重置为100%">1:1</button>
                    </div>
                    <div class="beads-shortcuts-bar">
                        <span><kbd>滚轮</kbd> 缩放</span>
                        <span><kbd>Alt+拖拽</kbd> 平移</span>
                        <span><kbd>Ctrl+V</kbd> 粘贴图片</span>
                    </div>
                    <button class="btn btn-primary beads-export-fab" id="beads-export-btn" disabled>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        导出图纸
                    </button>
                </div>

                <div class="beads-preview-panel" id="beads-preview-panel" style="display:none">
                    <h4>预览</h4>
                    <div class="beads-thumb-wrap">
                        <img id="beads-source-thumb" src="" alt="原图">
                    </div>
                    <div class="beads-stats" id="beads-stats"></div>
                </div>
            </div>

            <!-- Color Picker Modal -->
            <div class="beads-color-modal hidden" id="beads-color-modal">
                <div class="beads-color-modal-backdrop"></div>
                <div class="beads-color-modal-content">
                    <div class="beads-color-modal-header">
                        <h4 id="beads-color-modal-title">选择颜色</h4>
                        <button class="beads-color-modal-close" id="beads-color-modal-close">&times;</button>
                    </div>
                    <div class="beads-color-modal-body" id="beads-color-modal-body"></div>
                    <div class="beads-color-modal-footer">
                        <button class="btn btn-sm" id="beads-color-modal-cancel">取消</button>
                        <button class="btn btn-sm btn-primary" id="beads-color-modal-confirm">确定</button>
                    </div>
                </div>
            </div>
        `;

        this._bindAutoEvents(container);

        // Draw initial empty grid
        this._drawEmptyGrid();
    },

    _drawEmptyGrid() {
        const s = this.state;
        const canvas = document.getElementById('beads-canvas');
        if (!canvas) return;

        const w = s.cols;
        const h = s.rows;
        const cellSize = Math.max(6, Math.min(48, Math.floor(900 / Math.max(w, h))));
        s.cellSize = cellSize;
        const padding = 40;
        const gridW = w * cellSize;
        const gridH = h * cellSize;
        const totalW = gridW + padding * 2;
        const totalH = gridH + padding * 2;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = totalW * dpr;
        canvas.height = totalH * dpr;
        canvas.style.width = totalW + 'px';
        canvas.style.height = totalH + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, totalW, totalH);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalW, totalH);

        // Draw empty grid
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const px = padding + x * cellSize;
                const py = padding + y * cellSize;
                ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, cellSize, cellSize);
            }
        }

        // Row/column numbers
        if (cellSize >= 6) {
            ctx.fillStyle = '#555';
            ctx.font = `${Math.max(9, cellSize * 0.45)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let x = 0; x < w; x++) {
                ctx.fillText(x + 1, padding + x * cellSize + cellSize / 2, padding / 2);
            }
            ctx.textAlign = 'right';
            for (let y = 0; y < h; y++) {
                ctx.fillText(y + 1, padding / 2, padding + y * cellSize + cellSize / 2);
            }
        }

        s.displayScale = 1;
        s.panX = 0;
        s.panY = 0;
        this._updateZoomLabel();
        this._fitToView();

        if (!s._autoCanvasEventsBound) {
            this._bindCanvasEvents(false);
            s._autoCanvasEventsBound = true;
        }
    },

    _bindAutoEvents(container) {
        const s = this.state;

        // Series toggle
        document.getElementById('beads-series-s').onclick = () => {
            s.series = 'S';
            document.getElementById('beads-series-s').classList.add('btn-primary');
            document.getElementById('beads-series-r').classList.remove('btn-primary');
            if (s.sourceImage) this._reQuantize();
        };
        document.getElementById('beads-series-r').onclick = () => {
            s.series = 'R';
            document.getElementById('beads-series-r').classList.add('btn-primary');
            document.getElementById('beads-series-s').classList.remove('btn-primary');
            if (s.sourceImage) this._reQuantize();
        };

        // Quick sizes - just update inputs
        container.querySelectorAll('.beads-quick-sizes .btn').forEach(btn => {
            btn.onclick = () => {
                document.getElementById('beads-cols').value = btn.dataset.w;
                document.getElementById('beads-rows').value = btn.dataset.h;
            };
        });

        // Size inputs
        document.getElementById('beads-cols').onchange = (e) => {
            s.cols = Math.max(1, Math.min(500, parseInt(e.target.value) || 29));
            e.target.value = s.cols;
        };
        document.getElementById('beads-rows').onchange = (e) => {
            s.rows = Math.max(1, Math.min(500, parseInt(e.target.value) || 29));
            e.target.value = s.rows;
        };

        // Apply size button
        document.getElementById('beads-apply-size').onclick = () => {
            s.cols = parseInt(document.getElementById('beads-cols').value) || 29;
            s.rows = parseInt(document.getElementById('beads-rows').value) || 29;
            s.cols = Math.max(1, Math.min(500, s.cols));
            s.rows = Math.max(1, Math.min(500, s.rows));
            this._drawEmptyGrid();
            if (s.sourceImage) this._reQuantize();
        };

        // Upload
        const upload = document.getElementById('beads-upload');
        const fileInput = document.getElementById('beads-file-input');
        upload.onclick = () => fileInput.click();
        upload.ondragover = (e) => { e.preventDefault(); upload.classList.add('drag-over'); };
        upload.ondragleave = () => upload.classList.remove('drag-over');
        upload.ondrop = (e) => {
            e.preventDefault();
            upload.classList.remove('drag-over');
            if (e.dataTransfer.files.length) this._loadImage(e.dataTransfer.files[0]);
        };
        fileInput.onchange = (e) => {
            if (e.target.files.length) this._loadImage(e.target.files[0]);
        };

        // Paste from clipboard
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) this._loadImage(file);
                    break;
                }
            }
        });

        // Export
        document.getElementById('beads-export-btn').onclick = () => this._exportAuto();

        // Zoom buttons
        document.getElementById('beads-zoom-fit').onclick = () => this._fitToView();
        document.getElementById('beads-zoom-in').onclick = () => {
            s.displayScale = Math.min(20, s.displayScale * 1.2);
            this._updateTransform();
        };
        document.getElementById('beads-zoom-out').onclick = () => {
            s.displayScale = Math.max(0.05, s.displayScale / 1.2);
            this._updateTransform();
        };
        document.getElementById('beads-zoom-reset').onclick = () => {
            s.displayScale = 1;
            s.panX = 0;
            s.panY = 0;
            this._updateTransform();
        };
    },

    // =============================================
    // Image Loading & Quantization
    // =============================================
    async _loadImage(file) {
        if (!file.type.startsWith('image/')) return;
        const s = this.state;

        const img = await this._readImage(file);
        s.sourceImage = img;

        // Show thumbnail
        const thumb = document.getElementById('beads-source-thumb');
        if (thumb) {
            thumb.src = img.src;
            document.getElementById('beads-preview-panel').style.display = '';
        }

        this._showLoading('正在生成图纸...');
        await new Promise(r => setTimeout(r, 50));

        await this._reQuantize();

        this._hideLoading();
    },

    async _reQuantize() {
        const s = this.state;
        if (!s.sourceImage) return;

        const colors = this.COLORS[s.series];
        const w = s.cols;
        const h = s.rows;

        // Sample image to grid
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = w;
        tmpCanvas.height = h;
        const ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(s.sourceImage, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data;

        // Build color palette from Artkal
        const palette = colors.map(c => {
            const r = parseInt(c.hex.slice(1, 3), 16);
            const g = parseInt(c.hex.slice(3, 5), 16);
            const b = parseInt(c.hex.slice(5, 7), 16);
            return { ...c, r, g, b };
        });

        // Quantize each pixel to nearest Artkal color
        const grid = [];
        const usedColors = {};
        for (let y = 0; y < h; y++) {
            const row = [];
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const pr = pixels[idx];
                const pg = pixels[idx + 1];
                const pb = pixels[idx + 2];
                const closest = this._findClosestColor(pr, pg, pb, palette);
                row.push(closest.id);
                usedColors[closest.id] = (usedColors[closest.id] || 0) + 1;
            }
            grid.push(row);
        }

        s.gridData = grid;
        s.colorStats = usedColors;

        // Update color replace dropdowns
        this._updateColorReplaceUI(colors, usedColors);

        // Update stats
        this._updateStats(colors, usedColors);

        // Draw grid
        this._drawGrid();

        // Enable export
        document.getElementById('beads-export-btn').disabled = false;
    },

    _findClosestColor(r, g, b, palette) {
        let minDist = Infinity;
        let closest = palette[0];
        for (const c of palette) {
            const dr = r - c.r;
            const dg = g - c.g;
            const db = b - c.b;
            const dist = dr * dr + dg * dg + db * db;
            if (dist < minDist) {
                minDist = dist;
                closest = c;
            }
        }
        return closest;
    },

    _updateColorReplaceUI(colors, usedColors) {
        const section = document.getElementById('beads-color-replace-section');
        if (!section) return;

        // Store used colors for the picker
        this.state.usedColors = Object.keys(usedColors).sort();
        this.state.allColors = colors;
        this.state.replaceFromId = null;
        this.state.replaceToId = null;

        // Reset selections
        document.getElementById('beads-replace-from-preview').style.background = '';
        document.getElementById('beads-replace-from-label').textContent = '点击选择';
        document.getElementById('beads-replace-to-preview').style.background = '';
        document.getElementById('beads-replace-to-label').textContent = '点击选择';

        section.style.display = '';

        // Bind click events
        document.getElementById('beads-replace-from-btn').onclick = () => this._showColorPicker('from');
        document.getElementById('beads-replace-to-btn').onclick = () => this._showColorPicker('to');
        document.getElementById('beads-replace-btn').onclick = () => this._replaceColor();
    },

    _showColorPicker(type) {
        const s = this.state;
        const colors = s.allColors;
        const usedIds = type === 'from' ? s.usedColors : colors.map(c => c.id);

        const modal = document.getElementById('beads-color-modal');
        const body = document.getElementById('beads-color-modal-body');
        const title = document.getElementById('beads-color-modal-title');

        title.textContent = type === 'from' ? '选择要替换的颜色' : '选择替换后的颜色';

        // Build color grid
        body.innerHTML = usedIds.map(id => {
            const c = colors.find(x => x.id === id);
            if (!c) return '';
            const isSelected = type === 'from' ? s.replaceFromId === id : s.replaceToId === id;
            return `<div class="beads-color-modal-chip${isSelected ? ' selected' : ''}"
                         data-id="${id}"
                         style="background:${c.hex}"
                         title="${c.id} ${c.name}">
                        <span class="beads-color-modal-chip-id">${c.id}</span>
                    </div>`;
        }).join('');

        // Bind chip clicks
        body.querySelectorAll('.beads-color-modal-chip').forEach(chip => {
            chip.onclick = () => {
                body.querySelectorAll('.beads-color-modal-chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                this._colorPickerSelectedId = chip.dataset.id;
            };
        });

        modal.classList.remove('hidden');
        this._colorPickerType = type;
        this._colorPickerSelectedId = type === 'from' ? s.replaceFromId : s.replaceToId;

        // Bind modal buttons
        document.getElementById('beads-color-modal-close').onclick = () => modal.classList.add('hidden');
        document.getElementById('beads-color-modal-cancel').onclick = () => modal.classList.add('hidden');
        document.getElementById('beads-color-modal-confirm').onclick = () => {
            if (this._colorPickerSelectedId) {
                const color = colors.find(c => c.id === this._colorPickerSelectedId);
                if (type === 'from') {
                    s.replaceFromId = this._colorPickerSelectedId;
                    document.getElementById('beads-replace-from-preview').style.background = color.hex;
                    document.getElementById('beads-replace-from-label').textContent = `${color.id} ${color.name}`;
                } else {
                    s.replaceToId = this._colorPickerSelectedId;
                    document.getElementById('beads-replace-to-preview').style.background = color.hex;
                    document.getElementById('beads-replace-to-label').textContent = `${color.id} ${color.name}`;
                }
            }
            modal.classList.add('hidden');
        };

        // Click backdrop to close
        modal.querySelector('.beads-color-modal-backdrop').onclick = () => modal.classList.add('hidden');
    },

    _replaceColor() {
        const from = this.state.replaceFromId;
        const to = this.state.replaceToId;
        if (!from || !to || from === to) return;
        const grid = this.state.gridData;
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x] === from) grid[y][x] = to;
            }
        }
        this._rebuildStats();
        this._drawGrid();
    },

    _rebuildStats() {
        const s = this.state;
        const colors = this.COLORS[s.series];
        const stats = {};
        for (const row of s.gridData) {
            for (const id of row) {
                stats[id] = (stats[id] || 0) + 1;
            }
        }
        s.colorStats = stats;
        this._updateColorReplaceUI(colors, stats);
        this._updateStats(colors, stats);
    },

    _updateStats(colors, usedColors) {
        const el = document.getElementById('beads-stats');
        if (!el) return;
        const entries = Object.entries(usedColors).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((sum, [, c]) => sum + c, 0);

        let html = `<div class="beads-stats-header">共 ${total} 颗豆子 · ${entries.length} 种颜色</div>`;
        html += '<div class="beads-stats-list">';
        for (const [id, count] of entries) {
            const c = colors.find(x => x.id === id);
            if (!c) continue;
            html += `<div class="beads-stat-item">
                <span class="beads-stat-color" style="background:${c.hex}"></span>
                <span class="beads-stat-id">${c.id}</span>
                <span class="beads-stat-name">${c.name}</span>
                <span class="beads-stat-count">${count}</span>
            </div>`;
        }
        html += '</div>';
        el.innerHTML = html;
    },

    // =============================================
    // Canvas Drawing (Auto Mode)
    // =============================================
    _drawGrid() {
        const s = this.state;
        if (!s.gridData) return;

        const canvas = document.getElementById('beads-canvas');
        if (!canvas) return;

        const cellSize = Math.max(6, Math.min(48, Math.floor(900 / Math.max(s.cols, s.rows))));
        s.cellSize = cellSize;
        const colors = this.COLORS[s.series];
        const w = s.cols;
        const h = s.rows;
        const gridW = w * cellSize;
        const gridH = h * cellSize;
        const padding = 40;
        const totalW = gridW + padding * 2;
        const totalH = gridH + padding * 2;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = totalW * dpr;
        canvas.height = totalH * dpr;
        canvas.style.width = totalW + 'px';
        canvas.style.height = totalH + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, totalW, totalH);

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalW, totalH);

        // Grid
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const colorId = s.gridData[y][x];
                const color = colors.find(c => c.id === colorId);
                const px = padding + x * cellSize;
                const py = padding + y * cellSize;

                ctx.fillStyle = color ? color.hex : '#cccccc';
                ctx.fillRect(px, py, cellSize, cellSize);

                // Border
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, cellSize, cellSize);

                // Show symbol/text if cell is big enough
                if (cellSize >= 10 && colorId) {
                    ctx.fillStyle = this._textColorFor(color?.hex || '#cccccc');
                    ctx.font = `bold ${Math.max(7, cellSize * 0.45)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const shortId = colorId.replace(/^[SR]/, '');
                    ctx.fillText(shortId, px + cellSize / 2, py + cellSize / 2);
                }
            }
        }

        // Row/column numbers
        if (cellSize >= 6) {
            ctx.fillStyle = '#555';
            ctx.font = `${Math.max(9, cellSize * 0.45)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let x = 0; x < w; x++) {
                ctx.fillText(x + 1, padding + x * cellSize + cellSize / 2, padding / 2);
            }
            ctx.textAlign = 'right';
            for (let y = 0; y < h; y++) {
                ctx.fillText(y + 1, padding / 2, padding + y * cellSize + cellSize / 2);
            }
        }

        // Reset transform
        s.displayScale = 1;
        s.panX = 0;
        s.panY = 0;
        this._updateZoomLabel();
        this._fitToView();

        // Bind canvas events only once
        if (!s._autoCanvasEventsBound) {
            this._bindCanvasEvents(false);
            s._autoCanvasEventsBound = true;
        }
    },

    _textColorFor(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return lum > 0.5 ? '#000000' : '#FFFFFF';
    },

    // =============================================
    // Manual Mode
    // =============================================
    _renderManualMode(container) {
        container.innerHTML = `
            <div class="beads-layout">
                <div class="beads-sidebar">
                    <div class="stamp-section">
                        <h4>系列</h4>
                        <div class="beads-series-toggle">
                            <button class="btn btn-sm ${this.state.series === 'S' ? 'btn-primary' : ''}" id="beads-manual-series-s">S系列</button>
                            <button class="btn btn-sm ${this.state.series === 'R' ? 'btn-primary' : ''}" id="beads-manual-series-r">R系列</button>
                        </div>
                    </div>
                    <div class="stamp-section">
                        <h4>网格尺寸</h4>
                        <div class="control-group">
                            <label>列数</label>
                            <input type="number" id="beads-manual-cols" value="${this.state.cols}" min="1" max="500" class="beads-num-input">
                        </div>
                        <div class="control-group">
                            <label>行数</label>
                            <input type="number" id="beads-manual-rows" value="${this.state.rows}" min="1" max="500" class="beads-num-input">
                        </div>
                        <button class="btn btn-sm btn-primary" id="beads-manual-apply-size">应用尺寸</button>
                    </div>
                    <div class="stamp-section">
                        <h4>底图（可选）</h4>
                        <div class="stamp-base-upload beads-mini-upload" id="beads-manual-base-upload">
                            <p>点击或拖放上传底图</p>
                        </div>
                        <input type="file" id="beads-manual-base-input" accept="image/*" style="display:none">
                        <div class="control-group" id="beads-base-opacity-group" style="display:none">
                            <label>底图透明度: <span id="beads-base-opacity-val">30</span>%</label>
                            <input type="range" id="beads-base-opacity" min="5" max="100" value="30">
                        </div>
                    </div>
                    <div class="stamp-section">
                        <h4>画笔工具</h4>
                        <div class="beads-draw-tools">
                            <button class="btn btn-sm btn-primary beads-tool-btn" id="beads-tool-pen" data-tool="pen" title="画笔">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
                                <span class="beads-tool-label">画笔</span>
                            </button>
                            <button class="btn btn-sm beads-tool-btn" id="beads-tool-eraser" data-tool="eraser" title="橡皮擦">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.8 1.4c.8-.8 2-.8 2.8 0l5 5c.8.8.8 2 0 2.8L11 20"/></svg>
                                <span class="beads-tool-label">橡皮</span>
                            </button>
                            <button class="btn btn-sm beads-tool-btn" id="beads-tool-fill" data-tool="fill" title="填充">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 11V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h4"/><path d="M12 22l4-4-8-8 4-4-8-8"/></svg>
                                <span class="beads-tool-label">填充</span>
                            </button>
                            <button class="btn btn-sm beads-tool-btn" id="beads-undo-btn" title="撤销">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H8"/><path d="M7 6l-4 4 4 4"/></svg>
                                <span class="beads-tool-label">撤销</span>
                            </button>
                            <button class="btn btn-sm beads-tool-btn" id="beads-redo-btn" title="重做">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h5"/><path d="M17 6l4 4-4 4"/></svg>
                                <span class="beads-tool-label">重做</span>
                            </button>
                        </div>
                    </div>
                    <div class="stamp-section">
                        <h4>颜色选择</h4>
                        <div class="beads-color-palette" id="beads-color-palette"></div>
                    </div>
                </div>

                <div class="beads-canvas-wrap" id="beads-manual-canvas-wrap">
                    <div class="beads-canvas-viewport" id="beads-manual-viewport">
                        <canvas id="beads-manual-canvas"></canvas>
                    </div>
                    <div class="stamp-toolbar" id="beads-manual-toolbar">
                        <button class="btn btn-xs" id="beads-manual-zoom-fit" title="适应窗口">适应</button>
                        <button class="btn btn-xs" id="beads-manual-zoom-in" title="放大">+</button>
                        <span id="beads-manual-zoom-label" class="stamp-zoom-label">100%</span>
                        <button class="btn btn-xs" id="beads-manual-zoom-out" title="缩小">-</button>
                        <button class="btn btn-xs" id="beads-manual-zoom-reset" title="重置为100%">1:1</button>
                    </div>
                    <div class="beads-shortcuts-bar">
                        <span><kbd>滚轮</kbd> 缩放</span>
                        <span><kbd>Alt+拖拽</kbd> 平移</span>
                        <span><kbd>右键</kbd> 擦除</span>
                        <span><kbd>Ctrl+Z</kbd> 撤销</span>
                        <span><kbd>Ctrl+Y</kbd> 重做</span>
                    </div>
                    <button class="btn btn-primary beads-export-fab" id="beads-manual-export-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        导出图纸
                    </button>
                </div>

                <div class="beads-preview-panel" id="beads-manual-preview-panel">
                    <h4>颜色统计</h4>
                    <div class="beads-stats" id="beads-manual-stats"></div>
                </div>
            </div>
        `;

        this._bindManualEvents(container);
    },

    _bindManualEvents(container) {
        const s = this.state;

        // Init grid for manual mode
        s.gridData = [];
        for (let y = 0; y < s.rows; y++) {
            s.gridData.push(new Array(s.cols).fill(null));
        }

        // Series toggle
        document.getElementById('beads-manual-series-s').onclick = () => {
            s.series = 'S';
            document.getElementById('beads-manual-series-s').classList.add('btn-primary');
            document.getElementById('beads-manual-series-r').classList.remove('btn-primary');
            this._buildColorPalette();
        };
        document.getElementById('beads-manual-series-r').onclick = () => {
            s.series = 'R';
            document.getElementById('beads-manual-series-r').classList.add('btn-primary');
            document.getElementById('beads-manual-series-s').classList.remove('btn-primary');
            this._buildColorPalette();
        };

        // Apply size
        document.getElementById('beads-manual-apply-size').onclick = () => {
            s.cols = parseInt(document.getElementById('beads-manual-cols').value) || 29;
            s.rows = parseInt(document.getElementById('beads-manual-rows').value) || 29;
            s.cols = Math.max(1, Math.min(500, s.cols));
            s.rows = Math.max(1, Math.min(500, s.rows));
            s.gridData = [];
            for (let y = 0; y < s.rows; y++) {
                s.gridData.push(new Array(s.cols).fill(null));
            }
            s.undoStack = [];
            s.redoStack = [];
            this._drawManualGrid();
        };

        // Draw tools
        container.querySelectorAll('[data-tool]').forEach(btn => {
            btn.onclick = () => {
                container.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('btn-primary'));
                btn.classList.add('btn-primary');
                s.drawMode = btn.dataset.tool;
            };
        });

        // Undo / Redo
        document.getElementById('beads-undo-btn').onclick = () => this._undo();
        document.getElementById('beads-redo-btn').onclick = () => this._redo();

        // Base image
        const baseUpload = document.getElementById('beads-manual-base-upload');
        const baseInput = document.getElementById('beads-manual-base-input');
        baseUpload.onclick = () => baseInput.click();
        baseUpload.ondragover = (e) => { e.preventDefault(); baseUpload.classList.add('drag-over'); };
        baseUpload.ondragleave = () => baseUpload.classList.remove('drag-over');
        baseUpload.ondrop = (e) => {
            e.preventDefault();
            baseUpload.classList.remove('drag-over');
            if (e.dataTransfer.files.length) this._loadBaseImage(e.dataTransfer.files[0]);
        };
        baseInput.onchange = (e) => {
            if (e.target.files.length) this._loadBaseImage(e.target.files[0]);
        };

        // Base opacity
        document.getElementById('beads-base-opacity').oninput = (e) => {
            s.baseOpacity = parseInt(e.target.value) / 100;
            document.getElementById('beads-base-opacity-val').textContent = e.target.value;
            this._drawManualGrid();
        };

        // Export
        document.getElementById('beads-manual-export-btn').onclick = () => this._exportManual();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this._undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                this._redo();
            }
        });

        // Zoom buttons
        document.getElementById('beads-manual-zoom-fit').onclick = () => this._fitToView();
        document.getElementById('beads-manual-zoom-in').onclick = () => {
            s.displayScale = Math.min(20, s.displayScale * 1.2);
            this._updateTransform();
        };
        document.getElementById('beads-manual-zoom-out').onclick = () => {
            s.displayScale = Math.max(0.05, s.displayScale / 1.2);
            this._updateTransform();
        };
        document.getElementById('beads-manual-zoom-reset').onclick = () => {
            s.displayScale = 1;
            s.panX = 0;
            s.panY = 0;
            this._updateTransform();
        };

        // Build color palette
        this._buildColorPalette();

        // Initialize grid if cols/rows already set
        if (!s.gridData || s.gridData.length === 0) {
            s.gridData = [];
            for (let y = 0; y < s.rows; y++) {
                s.gridData.push(new Array(s.cols).fill(null));
            }
        }
        this._drawManualGrid();
    },

    _buildColorPalette() {
        const el = document.getElementById('beads-color-palette');
        if (!el) return;
        const colors = this.COLORS[this.state.series];
        el.innerHTML = colors.map(c =>
            `<div class="beads-color-chip${this.state.drawColor === c.id ? ' selected' : ''}"
                  data-id="${c.id}"
                  style="background:${c.hex}"
                  title="${c.id} ${c.name}">
            </div>`
        ).join('');

        el.querySelectorAll('.beads-color-chip').forEach(chip => {
            chip.onclick = () => {
                el.querySelectorAll('.beads-color-chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                this.state.drawColor = chip.dataset.id;
            };
        });
    },

    async _loadBaseImage(file) {
        if (!file.type.startsWith('image/')) return;
        const img = await this._readImage(file);
        this.state.baseImage = img;
        document.getElementById('beads-base-opacity-group').style.display = '';
        this._drawManualGrid();
    },

    // =============================================
    // Manual Grid Drawing & Interaction
    // =============================================
    _drawManualGrid(preserveZoom) {
        const s = this.state;
        if (!s.gridData) return;

        const canvas = document.getElementById('beads-manual-canvas');
        if (!canvas) return;

        // Save current zoom state before redraw
        const savedScale = s.displayScale;
        const savedPanX = s.panX;
        const savedPanY = s.panY;

        const colors = this.COLORS[s.series];
        const w = s.cols;
        const h = s.rows;
        const cellSize = Math.max(6, Math.min(48, Math.floor(900 / Math.max(w, h))));
        s.cellSize = cellSize;
        const padding = 40;
        const gridW = w * cellSize;
        const gridH = h * cellSize;
        const totalW = gridW + padding * 2;
        const totalH = gridH + padding * 2;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = totalW * dpr;
        canvas.height = totalH * dpr;
        canvas.style.width = totalW + 'px';
        canvas.style.height = totalH + 'px';

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, totalW, totalH);

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalW, totalH);

        // Base image
        if (s.baseImage) {
            ctx.globalAlpha = s.baseOpacity;
            ctx.drawImage(s.baseImage, padding, padding, gridW, gridH);
            ctx.globalAlpha = 1;
        }

        // Grid cells
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const colorId = s.gridData[y][x];
                const px = padding + x * cellSize;
                const py = padding + y * cellSize;

                if (colorId) {
                    const color = colors.find(c => c.id === colorId);
                    ctx.fillStyle = color ? color.hex : '#cccccc';
                    ctx.fillRect(px, py, cellSize, cellSize);
                }

                // Always draw grid lines
                ctx.strokeStyle = 'rgba(0,0,0,0.12)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, cellSize, cellSize);

                // Show ID if cell big enough
                if (cellSize >= 10 && colorId) {
                    const color = colors.find(c => c.id === colorId);
                    ctx.fillStyle = this._textColorFor(color?.hex || '#cccccc');
                    ctx.font = `bold ${Math.max(7, cellSize * 0.45)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(colorId.replace(/^[SR]/, ''), px + cellSize / 2, py + cellSize / 2);
                }
            }
        }

        // Row/column numbers
        if (cellSize >= 6) {
            ctx.fillStyle = '#555';
            ctx.font = `${Math.max(9, cellSize * 0.45)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let x = 0; x < w; x++) {
                ctx.fillText(x + 1, padding + x * cellSize + cellSize / 2, padding / 2);
            }
            ctx.textAlign = 'right';
            for (let y = 0; y < h; y++) {
                ctx.fillText(y + 1, padding / 2, padding + y * cellSize + cellSize / 2);
            }
        }

        // Restore or reset zoom
        if (preserveZoom) {
            s.displayScale = savedScale;
            s.panX = savedPanX;
            s.panY = savedPanY;
        } else {
            s.displayScale = 1;
            s.panX = 0;
            s.panY = 0;
            this._fitToView();
        }
        this._updateZoomLabel();
        this._updateTransform();

        // Bind canvas events only once
        if (!s._canvasEventsBound) {
            this._bindCanvasEvents(true);
            s._canvasEventsBound = true;
        }
    },

    _updateManualStats() {
        const s = this.state;
        const colors = this.COLORS[s.series];
        const stats = {};
        for (const row of s.gridData) {
            for (const id of row) {
                if (id) stats[id] = (stats[id] || 0) + 1;
            }
        }
        const el = document.getElementById('beads-manual-stats');
        if (!el) return;
        const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
        const total = entries.reduce((sum, [, c]) => sum + c, 0);
        const totalCells = s.cols * s.rows;
        const filled = total;
        const empty = totalCells - filled;

        let html = `<div class="beads-stats-header">已填充 ${filled}/${totalCells} 颗</div>`;
        if (entries.length > 0) {
            html += '<div class="beads-stats-list">';
            for (const [id, count] of entries) {
                const c = colors.find(x => x.id === id);
                if (!c) continue;
                html += `<div class="beads-stat-item">
                    <span class="beads-stat-color" style="background:${c.hex}"></span>
                    <span class="beads-stat-id">${c.id}</span>
                    <span class="beads-stat-name">${c.name}</span>
                    <span class="beads-stat-count">${count}</span>
                </div>`;
            }
            html += '</div>';
        }
        el.innerHTML = html;
    },

    // =============================================
    // Drawing Interaction
    // =============================================
    _getCanvasCoords(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const s = this.state;
        // The canvas is transformed with CSS translate + scale
        // getBoundingClientRect gives the transformed position
        // We need to map client coords back to original canvas coords
        const x = (e.clientX - rect.left) / s.displayScale;
        const y = (e.clientY - rect.top) / s.displayScale;
        return { x, y };
    },

    _screenToGrid(sx, sy, canvas) {
        const s = this.state;
        const padding = 30;
        const gx = Math.floor((sx - padding) / s.cellSize);
        const gy = Math.floor((sy - padding) / s.cellSize);
        if (gx < 0 || gx >= s.cols || gy < 0 || gy >= s.rows) return null;
        return { x: gx, y: gy };
    },

    _setCell(x, y, colorId) {
        const s = this.state;
        if (x < 0 || x >= s.cols || y < 0 || y >= s.rows) return;
        if (s.gridData[y][x] === colorId) return;
        s.gridData[y][x] = colorId;
    },

    _saveUndoState() {
        const s = this.state;
        s.undoStack.push(JSON.parse(JSON.stringify(s.gridData)));
        if (s.undoStack.length > 50) s.undoStack.shift();
        s.redoStack = [];
    },

    _undo() {
        const s = this.state;
        if (s.undoStack.length === 0) return;
        s.redoStack.push(JSON.parse(JSON.stringify(s.gridData)));
        s.gridData = s.undoStack.pop();
        this._drawManualGrid(true);
    },

    _redo() {
        const s = this.state;
        if (s.redoStack.length === 0) return;
        s.undoStack.push(JSON.parse(JSON.stringify(s.gridData)));
        s.gridData = s.redoStack.pop();
        this._drawManualGrid(true);
    },

    _floodFill(startX, startY, newColorId) {
        const s = this.state;
        const oldColorId = s.gridData[startY][startX];
        if (oldColorId === newColorId) return;

        const stack = [[startX, startY]];
        const visited = new Set();

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            if (x < 0 || x >= s.cols || y < 0 || y >= s.rows) continue;
            if (s.gridData[y][x] !== oldColorId) continue;

            visited.add(key);
            s.gridData[y][x] = newColorId;

            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    },

    _bindCanvasEvents(isManual) {
        const canvas = isManual
            ? document.getElementById('beads-manual-canvas')
            : document.getElementById('beads-canvas');
        if (!canvas) return;

        // Check if events already bound
        if (canvas._beadsEventsBound) return;
        canvas._beadsEventsBound = true;

        let isDragging = false;
        let didDraw = false;

        const onDown = (e) => {
            const coords = this._getCanvasCoords(e, canvas);
            const grid = this._screenToGrid(coords.x, coords.y, canvas);

            if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && e.shiftKey)) {
                // Middle click or Alt+click or Shift+click = pan
                this.state.isPanning = true;
                this.state.panStart = { x: e.clientX - this.state.panX, y: e.clientY - this.state.panY };
                canvas.style.cursor = 'grabbing';
                return;
            }

            if (!isManual || !grid) return;

            isDragging = true;
            didDraw = false;

            if (this.state.drawMode === 'fill') {
                this._saveUndoState();
                this._floodFill(grid.x, grid.y, this.state.drawColor);
                this._drawManualGrid(true);
                return;
            }

            this._saveUndoState();
            this._paintCell(grid.x, grid.y);
            didDraw = true;
        };

        const onMove = (e) => {
            if (this.state.isPanning && this.state.panStart) {
                this.state.panX = e.clientX - this.state.panStart.x;
                this.state.panY = e.clientY - this.state.panStart.y;
                this._updateTransform();
                return;
            }

            if (!isDragging || !isManual) return;
            const coords = this._getCanvasCoords(e, canvas);
            const grid = this._screenToGrid(coords.x, coords.y, canvas);
            if (grid) {
                this._paintCell(grid.x, grid.y);
                didDraw = true;
            }
        };

        const onUp = () => {
            this.state.isPanning = false;
            this.state.panStart = null;
            isDragging = false;
            canvas.style.cursor = '';
            if (didDraw && isManual) {
                this._updateManualStats();
            }
        };

        canvas.addEventListener('mousedown', onDown);
        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('mouseup', onUp);
        canvas.addEventListener('mouseleave', onUp);

        // Zoom - centered on cursor position relative to viewport
        const viewport = isManual
            ? document.getElementById('beads-manual-viewport')
            : document.getElementById('beads-viewport');
        const zoomTarget = viewport || canvas;

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = zoomTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const oldScale = this.state.displayScale;
            const newScale = Math.max(0.1, Math.min(20, oldScale * factor));

            // Adjust pan so zoom centers on cursor
            this.state.panX = mouseX - (mouseX - this.state.panX) * (newScale / oldScale);
            this.state.panY = mouseY - (mouseY - this.state.panY) * (newScale / oldScale);
            this.state.displayScale = newScale;

            this._updateTransform();
        }, { passive: false });

        // Right click = eraser shortcut
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!isManual) return;
            const coords = this._getCanvasCoords(e, canvas);
            const grid = this._screenToGrid(coords.x, coords.y, canvas);
            if (grid) {
                if (!this._erasing) {
                    this._saveUndoState();
                    this._erasing = true;
                }
                this._setCell(grid.x, grid.y, null);
                this._drawManualGrid(true);
            }
        });

        document.addEventListener('mouseup', () => { this._erasing = false; });
    },

    _paintCell(x, y) {
        if (this.state.drawMode === 'pen') {
            this._setCell(x, y, this.state.drawColor);
            this._drawManualGrid(true);
        } else if (this.state.drawMode === 'eraser') {
            this._setCell(x, y, null);
            this._drawManualGrid(true);
        }
    },

    // =============================================
    // Zoom / Pan Utilities
    // =============================================
    _updateTransform() {
        const canvas = document.getElementById('beads-canvas') || document.getElementById('beads-manual-canvas');
        if (canvas) {
            // Use transform on the canvas element itself
            // The canvas already has its own width/height via CSS (set in _drawGrid/_drawManualGrid)
            canvas.style.transform = `translate(${this.state.panX}px, ${this.state.panY}px) scale(${this.state.displayScale})`;
            canvas.style.transformOrigin = '0 0';
        }
        this._updateZoomLabel();
    },

    _updateZoomLabel() {
        const label = document.getElementById('beads-zoom-label') || document.getElementById('beads-manual-zoom-label');
        if (label) {
            label.textContent = Math.round(this.state.displayScale * 100) + '%';
        }
    },

    _fitToView() {
        const viewport = document.getElementById('beads-viewport') || document.getElementById('beads-manual-viewport');
        const canvas = document.getElementById('beads-canvas') || document.getElementById('beads-manual-canvas');
        if (!viewport || !canvas) return;

        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        // Use the CSS size (logical size), not the canvas buffer size
        const cw = parseInt(canvas.style.width) || canvas.width;
        const ch = parseInt(canvas.style.height) || canvas.height;
        if (cw === 0 || ch === 0) return;

        const scale = Math.min(vw / cw, vh / ch, 1) * 0.9;
        this.state.displayScale = scale;
        this.state.panX = (vw - cw * scale) / 2;
        this.state.panY = (vh - ch * scale) / 2;
        this._updateTransform();
    },

    _showLoading(text) {
        let overlay = document.getElementById('beads-loading');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'beads-loading';
            overlay.className = 'stamp-loading';
            overlay.innerHTML = '<div class="stamp-loading-content"><div class="spinner"></div><p></p></div>';
            document.querySelector('.beads-canvas-wrap')?.appendChild(overlay);
        }
        overlay.querySelector('p').textContent = text || '处理中...';
        overlay.classList.remove('hidden');
    },

    _hideLoading() {
        const overlay = document.getElementById('beads-loading');
        if (overlay) overlay.classList.add('hidden');
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

    // =============================================
    // Export
    // =============================================
    _exportAuto() {
        const s = this.state;
        if (!s.gridData) return;
        const colors = this.COLORS[s.series];
        this._exportFull(s.gridData, s.cols, s.rows, colors, 'png');
    },

    _exportManual() {
        const s = this.state;
        if (!s.gridData) return;
        const colors = this.COLORS[s.series];
        this._exportFull(s.gridData, s.cols, s.rows, colors, 'png');
    },

    _doExport(gridData, cols, rows, colors, mode, format) {
        if (mode === 'full') {
            this._exportFull(gridData, cols, rows, colors, format);
        } else {
            this._exportSimple(gridData, cols, rows, colors, mode, format);
        }
    },

    _exportSimple(gridData, cols, rows, colors, mode, format) {
        const cellSize = 30;
        const padding = 60;
        const titleHeight = 50;
        const gridW = cols * cellSize;
        const gridH = rows * cellSize;

        const canvas = document.createElement('canvas');
        canvas.width = gridW + padding * 2;
        canvas.height = gridH + padding * 2 + titleHeight;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`拼豆图纸 (${cols}x${rows}) - Artkal ${this.state.series}系列`, padding, 30);

        // Grid offset by title height
        const gridOffsetY = titleHeight;

        // Grid
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const colorId = gridData[y][x];
                const px = padding + x * cellSize;
                const py = gridOffsetY + padding + y * cellSize;

                if (colorId) {
                    const color = colors.find(c => c.id === colorId);
                    ctx.fillStyle = color ? color.hex : '#eeeeee';
                    ctx.fillRect(px, py, cellSize, cellSize);
                }

                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, cellSize, cellSize);

                if (colorId) {
                    if (mode === 'symbol') {
                        const colorIdx = colors.findIndex(c => c.id === colorId);
                        const sym = this.SYMBOLS[colorIdx % this.SYMBOLS.length];
                        ctx.fillStyle = this._textColorFor(colors.find(c => c.id === colorId)?.hex || '#ccc');
                        ctx.font = `${Math.max(8, cellSize * 0.5)}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(sym, px + cellSize / 2, py + cellSize / 2);
                    } else {
                        ctx.fillStyle = this._textColorFor(colors.find(c => c.id === colorId)?.hex || '#ccc');
                        ctx.font = `bold ${Math.max(7, cellSize * 0.45)}px sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(colorId, px + cellSize / 2, py + cellSize / 2);
                    }
                }
            }
        }

        // Row/column numbers
        ctx.fillStyle = '#666';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let x = 0; x < cols; x++) {
            ctx.fillText(x + 1, padding + x * cellSize + cellSize / 2, gridOffsetY + padding / 2);
        }
        ctx.textAlign = 'right';
        for (let y = 0; y < rows; y++) {
            ctx.fillText(y + 1, padding / 2, gridOffsetY + padding + y * cellSize + cellSize / 2);
        }

        this._downloadCanvas(canvas, `beads_${cols}x${rows}`, format);
    },

    _exportFull(gridData, cols, rows, colors, format) {
        const cellSize = 24;
        const padding = 60;
        const titleHeight = 50;
        const gridW = cols * cellSize;
        const gridH = rows * cellSize;

        // Color stats
        const stats = {};
        for (const row of gridData) {
            for (const id of row) {
                if (id) stats[id] = (stats[id] || 0) + 1;
            }
        }
        const statEntries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
        const total = statEntries.reduce((sum, [, c]) => sum + c, 0);

        // Stats table dimensions
        const colCount = 3;
        const statRows = Math.ceil(statEntries.length / colCount);
        const statRowH = 20;
        const statTableH = statRows * statRowH + 40;

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(gridW + padding * 2, 600);
        canvas.height = gridH + padding * 2 + titleHeight + statTableH + 40;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`拼豆图纸 (${cols}x${rows}) · Artkal ${this.state.series}系列 · 共${total}颗`, padding, 30);

        // Grid offset by title height
        const gridOffsetY = titleHeight;

        // Grid
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const colorId = gridData[y][x];
                const px = padding + x * cellSize;
                const py = gridOffsetY + padding + y * cellSize;

                if (colorId) {
                    const color = colors.find(c => c.id === colorId);
                    ctx.fillStyle = color ? color.hex : '#eeeeee';
                    ctx.fillRect(px, py, cellSize, cellSize);
                }

                ctx.strokeStyle = 'rgba(0,0,0,0.18)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(px, py, cellSize, cellSize);

                if (colorId) {
                    const color = colors.find(c => c.id === colorId);
                    ctx.fillStyle = this._textColorFor(color?.hex || '#ccc');
                    ctx.font = `${Math.max(7, cellSize * 0.4)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const shortId = colorId.replace(/^[SR]/, '');
                    ctx.fillText(shortId, px + cellSize / 2, py + cellSize / 2);
                }
            }
        }

        // Row/column numbers
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let x = 0; x < cols; x++) {
            ctx.fillText(x + 1, padding + x * cellSize + cellSize / 2, gridOffsetY + padding / 2);
        }
        ctx.textAlign = 'right';
        for (let y = 0; y < rows; y++) {
            ctx.fillText(y + 1, padding / 2, gridOffsetY + padding + y * cellSize + cellSize / 2);
        }

        // Color statistics table
        const tableY = gridOffsetY + padding + gridH + 30;
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('颜色统计', padding, tableY);

        const colWidth = (canvas.width - padding * 2) / colCount;
        statEntries.forEach(([id, count], i) => {
            const col = i % colCount;
            const row = Math.floor(i / colCount);
            const x = padding + col * colWidth;
            const y = tableY + 20 + row * statRowH;

            const color = colors.find(c => c.id === id);
            if (!color) return;

            // Color swatch
            ctx.fillStyle = color.hex;
            ctx.fillRect(x, y - 6, 14, 14);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y - 6, 14, 14);

            // Text
            ctx.fillStyle = '#333';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${color.id} ${color.name}: ${count}颗`, x + 20, y + 1);
        });

        this._downloadCanvas(canvas, `beads_full_${cols}x${rows}`, format);
    },

    _downloadCanvas(canvas, filename, format) {
        if (format === 'pdf') {
            // Use jsPDF-like approach: export as high-res PNG then embed in PDF
            // Since we don't have jsPDF loaded, we'll create a multi-page PDF manually
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const imgW = canvas.width;
            const imgH = canvas.height;

            // Create PDF using raw PDF construction
            const pdfBytes = this._createPdfFromImage(dataUrl, imgW, imgH, filename);
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename + '.pdf';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename + '.png';
                a.click();
                URL.revokeObjectURL(url);
            }, 'image/png', 1.0);
        }
    },

    _createPdfFromImage(dataUrl, imgW, imgH, filename) {
        // Minimal PDF with single image
        // This is a simplified PDF generator
        const base64 = dataUrl.split(',')[1];
        const imgBytes = atob(base64);
        const imgBytesLen = imgBytes.length;

        // A4 at 72 DPI
        const pageW = 595;
        const pageH = 842;
        const margin = 36;
        const maxW = pageW - margin * 2;
        const maxH = pageH - margin * 2;
        const scale = Math.min(maxW / imgW, maxH / imgH, 1);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = margin + (maxW - drawW) / 2;
        const drawY = pageH - margin - (maxH - drawH) / 2 - drawH;

        // Build PDF objects
        const objects = [];
        let objNum = 1;

        // Obj 1: Catalog
        objects.push(`${objNum} 0 obj\n<< /Type /Catalog /Pages ${objNum + 1} 0 R >>\nendobj`);
        objNum++;

        // Obj 2: Pages
        objects.push(`${objNum} 0 obj\n<< /Type /Pages /Kids [${objNum + 1} 0 R] /Count 1 >>\nendobj`);
        objNum++;

        // Obj 3: Page
        const pageObjNum = objNum;
        objects.push(`${objNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${objNum + 1} 0 R /Resources << /XObject << /Img ${objNum + 2} 0 R >> >> >>\nendobj`);
        objNum++;

        // Obj 4: Content stream
        const stream = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm\n/Img Do\nQ`;
        objects.push(`${objNum} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`);
        objNum++;

        // Obj 5: Image XObject
        objects.push(`${objNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytesLen} >>\nstream\n`);
        const imgObjNum = objNum;
        objNum++;

        // Build PDF
        let pdf = '%PDF-1.4\n';
        const offsets = [];

        // Write text objects
        for (let i = 0; i < 4; i++) {
            offsets.push(pdf.length);
            pdf += objects[i] + '\n';
        }

        // Write image object header
        offsets.push(pdf.length);
        pdf += `${imgObjNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytesLen} >>\nstream\n`;

        // Insert image bytes
        const beforeStream = pdf.length;
        let binary = '';
        for (let i = 0; i < imgBytesLen; i++) {
            binary += String.fromCharCode(imgBytes.charCodeAt(i));
        }
        pdf += binary;
        pdf += '\nendstream\nendobj\n';

        // Cross-reference table
        const xrefOffset = pdf.length;
        pdf += 'xref\n';
        pdf += `0 ${objNum}\n`;
        pdf += '0000000000 65535 f \n';
        for (let i = 0; i < offsets.length; i++) {
            pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
        }

        pdf += 'trailer\n';
        pdf += `<< /Size ${objNum} /Root 1 0 R >>\n`;
        pdf += 'startxref\n';
        pdf += xrefOffset + '\n';
        pdf += '%%EOF';

        // Convert to Uint8Array
        const encoder = new TextEncoder();
        return encoder.encode(pdf);
    },
};
