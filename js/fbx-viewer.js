// ===== FBX Model Viewer =====
// Dynamically imports Three.js from CDN via importmap (works with file:/// protocol)
// Sets window.FBXViewer once dependencies are ready

window._fbxViewerReady = false;
window._fbxViewerPromise = (async function() {

const THREE = await import('three');
const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
const { TransformControls } = await import('three/addons/controls/TransformControls.js');
const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');

// ===== Helpers =====

function _createCheckerTexture(size, color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color1;
    ctx.fillRect(0, 0, size * 2, size * 2);
    ctx.fillStyle = color2;
    ctx.fillRect(0, 0, size, size);
    ctx.fillRect(size, size, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function _isMeshMaterial(mat) {
    return mat && (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial ||
        mat.isMeshLambertMaterial || mat.isMeshBasicMaterial ||
        mat.isMeshPhysicalMaterial || mat.isMeshToonMaterial);
}

// ===== FBXViewer =====

const FBXViewer = {

    // --- State ---
    _container: null,
    _viewport: null,
    _sidebar: null,
    _scene: null,
    _camera: null,
    _renderer: null,
    _controls: null,
    _clock: null,
    _mixer: null,
    _animationActions: [],
    _activeActionIdx: -1,
    _modelRoot: null,
    _modelList: [],
    _allMeshes: [],
    _originalMaterials: new Map(),
    _wireframeOverlays: new Map(),
    _selectedMesh: null,
    _gridHelper: null,
    _animId: null,
    _resizeObserver: null,
    _checkerTex: null,
    _fpsCounter: null,
    _onKeyDown: null,
    _treeData: null,
    _currentView: null,
    _transformControls: null,
    _transformMode: 'none', // none | translate | rotate | scale
    _justDragged: false,
    _originalTransforms: new Map(), // mesh -> {position, rotation, scale}
    _undoStack: [],
    _undoIndex: -1,

    _settings: {
        displayMode: 'solid',   // solid | wireframe | mixed
        background: 'white',    // white | gray | checker
        showGrid: true,
        autoRotate: false,
        wireframeColor: '#00ff00',
        ambientIntensity: 0.6,
        directionalIntensity: 0.8,
    },

    // ================================================================
    //  PUBLIC API
    // ================================================================

    render(container) {
        this.dispose();
        this._container = container;
        container.classList.add('fbx-viewer-container');
        // Prevent body scroll while viewer is active
        document.body.style.overflow = 'hidden';

        // --- Build Layout ---
        container.innerHTML = `
            <div class="fbx-layout">
                <div class="fbx-sidebar" id="fbx-sidebar">
                    <div class="fbx-sidebar-inner">
                        <!-- Upload -->
                        <div class="fbx-section" id="fbx-upload-section">
                            <div class="fbx-upload-area" id="fbx-upload">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <p>拖拽或点击上传FBX</p>
                            </div>
                            <input type="file" id="fbx-file-input" accept=".fbx" multiple style="display:none">
                        </div>

                        <!-- Model Info -->
                        <div class="fbx-section hidden" id="fbx-info-section">
                            <div class="fbx-section-title">📋 模型信息</div>
                            <div class="fbx-info-grid" id="fbx-info-grid"></div>
                        </div>

                        <!-- Hierarchy Tree -->
                        <div class="fbx-section hidden" id="fbx-hierarchy-section">
                            <div class="fbx-section-title">📦 部件层级 <span style="font-size:11px;color:var(--text-muted)">(点击选中)</span></div>
                            <div class="fbx-tree-actions">
                                <button class="btn btn-sm" id="fbx-tree-expand-all">展开全部</button>
                                <button class="btn btn-sm" id="fbx-tree-collapse-all">折叠全部</button>
                                <button class="btn btn-sm" id="fbx-tree-show-all">全部显示</button>
                                <button class="btn btn-sm" id="fbx-tree-hide-all">全部隐藏</button>
                            </div>
                            <div class="fbx-tree" id="fbx-hierarchy-tree"></div>
                        </div>

                        <!-- Property Editor -->
                        <div class="fbx-section hidden" id="fbx-property-section">
                            <div class="fbx-section-title">🎨 选中部件属性</div>
                            <div class="fbx-property-content" id="fbx-property-content">
                                <p style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px 0;">点击视口或部件列表中的部件</p>
                            </div>
                        </div>

                        <!-- Display Settings -->
                        <div class="fbx-section" id="fbx-display-section">
                            <div class="fbx-section-title">👁 显示模式</div>
                            <div class="fbx-mode-buttons" id="fbx-mode-btns">
                                <button class="fbx-mode-btn active" data-mode="solid">实体</button>
                                <button class="fbx-mode-btn" data-mode="wireframe">线框</button>
                                <button class="fbx-mode-btn" data-mode="mixed">实体+线框</button>
                            </div>
                        </div>

                        <div class="fbx-section" id="fbx-bg-section">
                            <div class="fbx-section-title">🖼 背景</div>
                            <div class="fbx-mode-buttons" id="fbx-bg-btns">
                                <button class="fbx-mode-btn active" data-bg="white">白色</button>
                                <button class="fbx-mode-btn" data-bg="gray">灰色</button>
                                <button class="fbx-mode-btn" data-bg="checker">棋盘格</button>
                            </div>
                        </div>

                        <div class="fbx-section" id="fbx-toggles-section">
                            <label class="fbx-toggle">
                                <input type="checkbox" id="fbx-toggle-grid" checked>
                                <span>参考网格</span>
                            </label>
                            <label class="fbx-toggle">
                                <input type="checkbox" id="fbx-toggle-autorot">
                                <span>自动旋转</span>
                            </label>
                        </div>

                        <!-- Animation -->
                        <div class="fbx-section hidden" id="fbx-anim-section">
                            <div class="fbx-section-title">▶ 动画控制</div>
                            <div class="fbx-anim-controls">
                                <div class="fbx-anim-buttons">
                                    <button class="btn btn-sm" id="fbx-anim-prev" title="上一个动画">⏮</button>
                                    <button class="btn btn-sm btn-primary" id="fbx-anim-play" title="播放/暂停">▶</button>
                                    <button class="btn btn-sm" id="fbx-anim-next" title="下一个动画">⏭</button>
                                    <button class="btn btn-sm" id="fbx-anim-stop" title="停止">⏹</button>
                                </div>
                                <div class="fbx-anim-info" id="fbx-anim-info">无动画</div>
                                <div class="control-group" style="margin-top:6px;">
                                    <label>速度</label>
                                    <input type="range" id="fbx-anim-speed" min="0.1" max="3" step="0.1" value="1">
                                    <span class="range-value" id="fbx-anim-speed-val">1.0x</span>
                                </div>
                                <div class="progress-bar" style="margin-top:8px;">
                                    <div class="progress-bar-fill" id="fbx-anim-progress" style="width:0%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Lighting -->
                        <div class="fbx-section" id="fbx-lighting-section">
                            <div class="fbx-section-title">💡 光照</div>
                            <div class="control-group">
                                <label>环境光 <span class="range-value" id="fbx-ambient-val">0.6</span></label>
                                <input type="range" id="fbx-ambient" min="0" max="2" step="0.05" value="0.6">
                            </div>
                            <div class="control-group">
                                <label>方向光 <span class="range-value" id="fbx-directional-val">0.8</span></label>
                                <input type="range" id="fbx-directional" min="0" max="3" step="0.05" value="0.8">
                            </div>
                            <div class="control-group">
                                <label>线框颜色</label>
                                <input type="color" id="fbx-wireframe-color" value="#00ff00">
                            </div>
                        </div>

                        <!-- Export -->
                        <div class="fbx-section" id="fbx-export-section">
                            <div class="fbx-section-title">📸 导出</div>
                            <button class="btn btn-primary" id="fbx-btn-screenshot" style="width:100%;margin-bottom:6px;">📷 截图当前视图</button>
                            <button class="btn btn-success" id="fbx-btn-whitebg" style="width:100%;">📸 导出白底图</button>
                        </div>
                    </div>
                </div>

                <!-- 3D Viewport -->
                <div class="fbx-viewport" id="fbx-viewport">
                    <div class="fbx-viewport-placeholder" id="fbx-placeholder">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.3">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                        <p>拖拽FBX文件到此处<br>或点击左侧上传</p>
                    </div>

                    <!-- View Angle & Transform Controls -->
                    <div class="fbx-view-ctrl" id="fbx-view-ctrl">
                        <div class="fbx-view-ctrl-presets">
                            <button class="fbx-view-btn" data-view="front" title="正视图 (前) [1]">正</button>
                            <button class="fbx-view-btn" data-view="back" title="背视图 (后) [2]">背</button>
                            <button class="fbx-view-btn" data-view="top" title="顶视图 (上) [3]">顶</button>
                            <button class="fbx-view-btn" data-view="bottom" title="底视图 (下) [4]">底</button>
                            <button class="fbx-view-btn" data-view="left" title="左视图 [5]">左</button>
                            <button class="fbx-view-btn" data-view="right" title="右视图 [6]">右</button>
                        </div>
                        <div class="fbx-view-ctrl-divider"></div>
                        <div class="fbx-transform-btns" id="fbx-transform-btns">
                            <button class="fbx-view-btn fbx-transform-btn active" data-transform="none" title="无变换 (自由视角)">🖐</button>
                            <button class="fbx-view-btn fbx-transform-btn" data-transform="translate" title="移动 [T]">↕</button>
                            <button class="fbx-view-btn fbx-transform-btn" data-transform="rotate" title="旋转 [R]">↻</button>
                            <button class="fbx-view-btn fbx-transform-btn" data-transform="scale" title="缩放 [S]">⤡</button>
                        </div>
                        <div class="fbx-view-ctrl-divider"></div>
                        <div class="fbx-view-ctrl-fine" id="fbx-view-fine">
                            <span class="fbx-view-fine-label">微调</span>
                            <button class="fbx-view-btn fbx-view-nudge" data-nudge="up" title="上旋">▲</button>
                            <button class="fbx-view-btn fbx-view-nudge" data-nudge="left" title="左旋">◀</button>
                            <button class="fbx-view-btn fbx-view-nudge" data-nudge="down" title="下旋">▼</button>
                            <button class="fbx-view-btn fbx-view-nudge" data-nudge="right" title="右旋">▶</button>
                            <button class="fbx-view-btn fbx-view-nudge" data-nudge="zoomin" title="放大">＋</button>
                            <button class="fbx-view-btn fbx-view-nudge" data-nudge="zoomout" title="缩小">－</button>
                        </div>
                    </div>

                    <div class="fbx-viewport-status" id="fbx-statusbar">
                        <span id="fbx-status-fps">FPS: --</span>
                        <span id="fbx-status-model">未加载模型</span>
                        <span id="fbx-status-tris">三角面: --</span>
                    </div>
                </div>
            </div>
        `;

        // --- Init Three.js ---
        try {
            this._initThree();
        } catch (e) {
            console.error('FBXViewer: Three.js init failed', e);
            this.dispose();
            container.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:12px;">
                    <p style="color:var(--danger);font-size:16px;">⚠ 3D 引擎初始化失败</p>
                    <p style="color:var(--text-muted);font-size:13px;">${e.message}</p>
                    <p style="color:var(--text-muted);font-size:12px;">请检查 Three.js 是否正确加载</p>
                </div>`;
            container.style.opacity = '1';
            return;
        }
        // --- Bind Events ---
        this._bindEvents();
        // --- Start render loop ---
        this._animate();
    },

    dispose() {
        if (this._animId) {
            cancelAnimationFrame(this._animId);
            this._animId = null;
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._mixer) {
            this._mixer.stopAllAction();
            this._mixer = null;
        }
        this._animationActions = [];
        this._activeActionIdx = -1;
        this._allMeshes = [];
        this._selectedMesh = null;
        this._modelRoot = null;
        this._modelList = [];
        this._wireframeOverlays.clear();
        this._originalMaterials.clear();
        this._originalTransforms.clear();
        this._undoStack = [];
        this._undoIndex = -1;

        if (this._transformControls) {
            this._transformControls.detach();
            this._transformControls.dispose();
            this._transformControls = null;
        }
        this._transformMode = 'none';
        if (this._renderer) {
            this._renderer.dispose();
            this._renderer = null;
        }
        if (this._controls) {
            this._controls.dispose();
            this._controls = null;
        }
        if (this._scene) {
            // Dispose geometries & materials
            this._scene.traverse(obj => {
                if (obj.geometry && obj.geometry !== this._gridHelper?.geometry) {
                    obj.geometry.dispose();
                }
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
            this._scene = null;
        }
        if (this._checkerTex) {
            this._checkerTex.dispose();
            this._checkerTex = null;
        }
        this._gridHelper = null;
        this._camera = null;
        this._viewport = null;
        this._sidebar = null;
        this._fpsCounter = null;
        this._treeData = null;

        // Remove keyboard listener
        if (this._onKeyDown) {
            document.removeEventListener('keydown', this._onKeyDown);
            this._onKeyDown = null;
        }

        if (this._container) {
            this._container.classList.remove('fbx-viewer-container');
            this._container.style.maxWidth = '';
            this._container.style.padding = '';
            this._container.style.margin = '';
            this._container.style.height = '';
            this._container.style.overflow = '';
            this._container = null;
        }
        // Restore body scroll
        document.body.style.overflow = '';
    },

    // ================================================================
    //  THREE.JS INIT
    // ================================================================

    _initThree() {
        const viewport = document.getElementById('fbx-viewport');
        if (!viewport) return;
        this._viewport = viewport;
        this._sidebar = document.getElementById('fbx-sidebar');

        const rect = viewport.getBoundingClientRect();
        const w = rect.width || 800;
        const h = rect.height || 600;

        // Renderer
        this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this._renderer.setSize(w, h, false);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this._renderer.outputColorSpace = THREE.SRGBColorSpace;
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.2;
        viewport.appendChild(this._renderer.domElement);

        // Scene
        this._scene = new THREE.Scene();

        // Camera
        this._camera = new THREE.PerspectiveCamera(50, w / Math.max(h, 1), 0.1, 1000);
        this._camera.position.set(5, 3, 8);
        this._camera.lookAt(0, 0, 0);

        // Controls
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.12;
        this._controls.target.set(0, 0, 0);
        this._controls.update();

        // Transform Controls
        this._transformControls = new TransformControls(this._camera, this._renderer.domElement);
        this._transformControls.setSize(0.8);
        this._transformControls.addEventListener('dragging-changed', (e) => {
            this._controls.enabled = !e.value;
            if (e.value) {
                // Start dragging — save undo state
                if (this._selectedMesh) {
                    this._pushUndoState();
                }
            } else {
                // Stop dragging — prevent click-through to canvas
                this._justDragged = true;
                setTimeout(() => { this._justDragged = false; }, 200);
            }
        });
        this._transformControls.addEventListener('objectChange', () => {
            // Update wireframe overlays when mesh is transformed
            if (this._selectedMesh) {
                this._updateWireframeOverlay(this._selectedMesh);
            }
        });
        this._scene.add(this._transformControls);

        // Clock
        this._clock = new THREE.Clock();

        // Lights
        this._setupLights();

        // Grid
        this._setupGrid();

        // Background
        this._updateBackground();

        // Resize observer
        this._resizeObserver = new ResizeObserver(() => this._onResize());
        this._resizeObserver.observe(viewport);
    },

    _setupLights() {
        const s = this._settings;

        // Ambient
        this._ambientLight = new THREE.AmbientLight(0xffffff, s.ambientIntensity);
        this._ambientLight.name = '_fbx_ambient';
        this._scene.add(this._ambientLight);

        // Directional (key)
        this._dirLight = new THREE.DirectionalLight(0xffffff, s.directionalIntensity);
        this._dirLight.name = '_fbx_directional';
        this._dirLight.position.set(5, 10, 7);
        this._dirLight.castShadow = true;
        this._dirLight.shadow.mapSize.set(1024, 1024);
        this._dirLight.shadow.camera.near = 0.5;
        this._dirLight.shadow.camera.far = 100;
        this._dirLight.shadow.camera.left = -15;
        this._dirLight.shadow.camera.right = 15;
        this._dirLight.shadow.camera.top = 15;
        this._dirLight.shadow.camera.bottom = -15;
        this._dirLight.shadow.bias = -0.0001;
        this._scene.add(this._dirLight);

        // Fill light (weaker, from opposite side)
        this._fillLight = new THREE.DirectionalLight(0x8899cc, s.directionalIntensity * 0.4);
        this._fillLight.name = '_fbx_fill';
        this._fillLight.position.set(-3, 2, -5);
        this._scene.add(this._fillLight);

        // Hemisphere
        this._hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, s.ambientIntensity * 0.5);
        this._hemiLight.name = '_fbx_hemi';
        this._scene.add(this._hemiLight);
    },

    _setupGrid() {
        if (this._gridHelper) {
            this._scene.remove(this._gridHelper);
            this._gridHelper.geometry.dispose();
            this._gridHelper.material.dispose();
        }
        const size = 20;
        const divs = 20;
        this._gridHelper = new THREE.GridHelper(size, divs, 0x888888, 0xcccccc);
        this._gridHelper.name = '_fbx_grid';
        this._gridHelper.visible = this._settings.showGrid;
        this._gridHelper.material.opacity = 0.3;
        this._gridHelper.material.transparent = true;
        this._scene.add(this._gridHelper);
    },

    _updateGridSize(modelSize) {
        // Adjust grid to model scale
        if (!this._gridHelper) return;
        const s = Math.max(modelSize, 2);
        const sRounded = Math.ceil(s / 2) * 2;
        this._scene.remove(this._gridHelper);
        this._gridHelper.geometry.dispose();
        this._gridHelper.material.dispose();
        this._gridHelper = new THREE.GridHelper(sRounded * 2, sRounded * 2, 0x888888, 0xcccccc);
        this._gridHelper.name = '_fbx_grid';
        this._gridHelper.visible = this._settings.showGrid;
        this._gridHelper.material.opacity = 0.3;
        this._gridHelper.material.transparent = true;
        this._gridHelper.renderOrder = 999;
        this._scene.add(this._gridHelper);
    },

    _updateBackground() {
        if (!this._scene) return;
        const bg = this._settings.background;

        // Remove old checker
        if (this._checkerTex) {
            this._checkerTex.dispose();
            this._checkerTex = null;
        }

        this._scene.background = null; // clear texture ref

        if (bg === 'white') {
            this._scene.background = new THREE.Color(0xffffff);
            this._scene.fog = null;
        } else if (bg === 'gray') {
            this._scene.background = new THREE.Color(0x444444);
            this._scene.fog = null;
        } else if (bg === 'checker') {
            this._checkerTex = _createCheckerTexture(64, '#cccccc', '#ffffff');
            this._scene.background = this._checkerTex;
            this._scene.fog = null;
        }
    },

    // ================================================================
    //  EVENT BINDING
    // ================================================================

    _bindEvents() {
        const viewport = this._viewport;
        if (!viewport) return;

        // --- Upload ---
        const uploadArea = document.getElementById('fbx-upload');
        const fileInput = document.getElementById('fbx-file-input');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());

            uploadArea.addEventListener('dragover', e => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', e => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    this._handleFiles(Array.from(e.dataTransfer.files));
                }
            });

            fileInput.addEventListener('change', () => {
                if (fileInput.files.length) {
                    this._handleFiles(Array.from(fileInput.files));
                    fileInput.value = '';
                }
            });
        }

        // Viewport drop
        viewport.addEventListener('dragover', e => { e.preventDefault(); });
        viewport.addEventListener('drop', e => {
            e.preventDefault();
            if (e.dataTransfer.files.length) {
                this._handleFiles(Array.from(e.dataTransfer.files));
            }
        });

        // Canvas click for selection
        this._renderer.domElement.addEventListener('click', e => this._onCanvasClick(e));

        // --- Sidebar controls ---
        // Display mode
        document.getElementById('fbx-mode-btns')?.addEventListener('click', e => {
            const btn = e.target.closest('.fbx-mode-btn');
            if (!btn) return;
            document.querySelectorAll('#fbx-mode-btns .fbx-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this._setDisplayMode(btn.dataset.mode);
        });

        // Background
        document.getElementById('fbx-bg-btns')?.addEventListener('click', e => {
            const btn = e.target.closest('.fbx-mode-btn');
            if (!btn) return;
            document.querySelectorAll('#fbx-bg-btns .fbx-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this._settings.background = btn.dataset.bg;
            this._updateBackground();
        });

        // Toggles
        document.getElementById('fbx-toggle-grid')?.addEventListener('change', e => {
            this._settings.showGrid = e.target.checked;
            if (this._gridHelper) this._gridHelper.visible = e.target.checked;
        });
        document.getElementById('fbx-toggle-autorot')?.addEventListener('change', e => {
            this._settings.autoRotate = e.target.checked;
            if (this._controls) this._controls.autoRotate = e.target.checked;
        });

        // Lighting
        document.getElementById('fbx-ambient')?.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            this._settings.ambientIntensity = v;
            document.getElementById('fbx-ambient-val').textContent = v.toFixed(2);
            if (this._ambientLight) this._ambientLight.intensity = v;
            if (this._hemiLight) this._hemiLight.intensity = v * 0.5;
        });
        document.getElementById('fbx-directional')?.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            this._settings.directionalIntensity = v;
            document.getElementById('fbx-directional-val').textContent = v.toFixed(2);
            if (this._dirLight) this._dirLight.intensity = v;
            if (this._fillLight) this._fillLight.intensity = v * 0.4;
        });
        document.getElementById('fbx-wireframe-color')?.addEventListener('input', e => {
            this._settings.wireframeColor = e.target.value;
            this._applyWireframeColor();
        });

        // Animation
        document.getElementById('fbx-anim-play')?.addEventListener('click', () => this._toggleAnimation());
        document.getElementById('fbx-anim-stop')?.addEventListener('click', () => this._stopAnimation());
        document.getElementById('fbx-anim-prev')?.addEventListener('click', () => this._prevAnimation());
        document.getElementById('fbx-anim-next')?.addEventListener('click', () => this._nextAnimation());
        document.getElementById('fbx-anim-speed')?.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            document.getElementById('fbx-anim-speed-val').textContent = v.toFixed(1) + 'x';
            if (this._activeAction) this._activeAction.timeScale = v;
        });

        // Export
        document.getElementById('fbx-btn-screenshot')?.addEventListener('click', () => this._captureScreenshot(false));
        document.getElementById('fbx-btn-whitebg')?.addEventListener('click', () => this._captureScreenshot(true));

        // Hierarchy tree actions
        document.getElementById('fbx-tree-expand-all')?.addEventListener('click', () => this._treeExpandAll());
        document.getElementById('fbx-tree-collapse-all')?.addEventListener('click', () => this._treeCollapseAll());
        document.getElementById('fbx-tree-show-all')?.addEventListener('click', () => this._treeShowAll());
        document.getElementById('fbx-tree-hide-all')?.addEventListener('click', () => this._treeHideAll());

        // Tree clicks (delegated)
        document.getElementById('fbx-hierarchy-tree')?.addEventListener('click', e => {
            const node = e.target.closest('.fbx-tree-node');
            if (!node) return;
            const toggle = e.target.closest('.fbx-tree-toggle');
            const visibility = e.target.closest('.fbx-tree-vis');
            if (toggle) {
                this._treeToggleExpand(node.dataset.nodeId);
                return;
            }
            if (visibility) {
                this._treeToggleVisibility(node.dataset.nodeId);
                return;
            }
            // Select mesh
            this._treeSelectNode(node.dataset.nodeId);
        });

        // Keyboard
        document.addEventListener('keydown', this._onKeyDown = (e) => {
            if (!this._container || this._container.innerHTML === '') return;
            // Skip shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Home') { e.preventDefault(); this._resetCamera(); }
            if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this._focusSelected(); }
            if (e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                if (this._selectedMesh) this._toggleVisibility(this._selectedMesh);
            }
            if (e.key === 'Escape') { e.preventDefault(); this._deselectAll(); }
            if (e.key === 'Delete') { e.preventDefault(); this._duplicateSelectedPart(); }
            // View presets with number keys
            if (e.key === '1') this._setView('front');
            if (e.key === '2') this._setView('back');
            if (e.key === '3') this._setView('top');
            if (e.key === '4') this._setView('bottom');
            if (e.key === '5') this._setView('left');
            if (e.key === '6') this._setView('right');
            // Transform modes (Blender-style)
            if (e.key === 't' || e.key === 'T') { e.preventDefault(); this._setTransformMode('translate'); }
            if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this._setTransformMode('rotate'); }
            if (e.key === 's' || e.key === 'S') { e.preventDefault(); this._setTransformMode('scale'); }
            if (e.key === 'x' || e.key === 'X') { e.preventDefault(); this._setTransformMode('none'); }
            if (e.key === 'z' && e.ctrlKey) { e.preventDefault(); this._undoTransform(); }
        });

        // --- View Controls ---
        document.querySelectorAll('.fbx-view-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', () => this._setView(btn.dataset.view));
        });
        document.querySelectorAll('.fbx-view-btn[data-nudge]').forEach(btn => {
            btn.addEventListener('click', () => this._nudgeView(btn.dataset.nudge));
        });

        // --- Transform Controls ---
        document.querySelectorAll('.fbx-transform-btn[data-transform]').forEach(btn => {
            btn.addEventListener('click', () => this._setTransformMode(btn.dataset.transform));
        });
    },

    // ================================================================
    //  FILE HANDLING
    // ================================================================

    async _handleFiles(files) {
        const fbxFiles = files.filter(f => f.name.toLowerCase().endsWith('.fbx'));
        if (!fbxFiles.length) {
            Toast.warning('请选择FBX格式的文件');
            return;
        }

        for (const file of fbxFiles) {
            await this._loadModel(file);
        }
        Toast.success(`已加载 ${fbxFiles.length} 个模型`);
    },

    async _loadModel(file) {
        Loading.show(`加载中: ${file.name}...`);
        const loader = new FBXLoader();

        try {
            const arrayBuffer = await Utils.readAsArrayBuffer(file);
            const group = loader.parse(arrayBuffer, '');

            // Hide placeholder
            const placeholder = document.getElementById('fbx-placeholder');
            if (placeholder) placeholder.style.display = 'none';

            // If no model loaded yet, use this one
            if (!this._modelRoot) {
                this._modelRoot = group;
                this._scene.add(group);
            } else {
                // Multi-model: offset new models
                this._modelList.push(group);
                const offset = this._modelList.length * 3;
                group.position.x += offset;
                this._scene.add(group);
            }

            // Collect meshes
            this._allMeshes = [];
            this._originalMaterials.clear();
            this._wireframeOverlays.clear();

            const collectMeshes = (obj) => {
                if (obj.isMesh && obj.geometry) {
                    this._allMeshes.push(obj);
                    this._saveOriginalMaterial(obj);
                }
                if (obj.children) {
                    obj.children.forEach(c => collectMeshes(c));
                }
            };
            if (this._modelRoot) collectMeshes(this._modelRoot);
            this._modelList.forEach(m => collectMeshes(m));

            // Enable shadows & save original transforms
            this._originalTransforms.clear();
            this._allMeshes.forEach(m => {
                m.castShadow = true;
                m.receiveShadow = true;
                this._saveOriginalTransform(m);
            });

            // Compute bounding box & fit camera
            const box = new THREE.Box3();
            this._allMeshes.forEach(m => {
                m.updateWorldMatrix(true, false);
                box.expandByObject(m);
            });
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            if (maxDim > 0 && isFinite(maxDim)) {
                this._controls.target.copy(center);
                const dist = maxDim * 2.2;
                this._camera.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist * 0.6);
                this._controls.update();
                this._updateGridSize(maxDim);
            }

            // Animations
            this._setupAnimations(group);

            // Update UI
            this._updateModelInfo(file.name);
            this._buildHierarchyTree();
            this._showSections(true);

            Loading.hide();
        } catch (err) {
            Loading.hide();
            console.error('FBX load error:', err);
            Toast.error('FBX加载失败: ' + (err.message || '未知错误'));
        }
    },

    _saveOriginalMaterial(mesh) {
        if (!mesh.material || !_isMeshMaterial(mesh.material)) return;
        const mat = mesh.material;
        this._originalMaterials.set(mesh, {
            color: mat.color ? mat.color.getHex() : 0xcccccc,
            roughness: mat.roughness ?? 0.5,
            metalness: mat.metalness ?? 0,
            opacity: mat.opacity ?? 1,
            wireframe: mat.wireframe ?? false,
        });
    },

    // ================================================================
    //  ANIMATION
    // ================================================================

    _setupAnimations(group) {
        this._mixer = new THREE.AnimationMixer(group);
        this._animationActions = [];
        this._activeActionIdx = -1;
        this._activeAction = null;

        if (group.animations && group.animations.length > 0) {
            group.animations.forEach((clip, i) => {
                const action = this._mixer.clipAction(clip);
                action.setLoop(THREE.LoopRepeat);
                action.clampWhenFinished = false;
                this._animationActions.push(action);
            });

            document.getElementById('fbx-anim-section').classList.remove('hidden');
            this._updateAnimInfo();
        } else {
            document.getElementById('fbx-anim-section').classList.add('hidden');
        }
    },

    _updateAnimInfo() {
        const el = document.getElementById('fbx-anim-info');
        if (!el) return;
        if (this._animationActions.length === 0) {
            el.textContent = '无动画';
            return;
        }
        const idx = Math.max(0, this._activeActionIdx);
        const clip = this._animationActions[idx]?.getClip();
        if (clip) {
            el.textContent = `动画 ${idx + 1}/${this._animationActions.length}: ${clip.name} (${clip.duration.toFixed(1)}s)`;
        }
    },

    _playAnimation(idx) {
        if (!this._animationActions.length) return;
        idx = (idx !== undefined) ? idx : Math.max(0, this._activeActionIdx);
        if (idx < 0) idx = 0;
        if (idx >= this._animationActions.length) return;

        // Stop current
        if (this._activeAction) {
            this._activeAction.stop();
        }

        this._activeActionIdx = idx;
        this._activeAction = this._animationActions[idx];
        this._activeAction.reset().play();

        const btn = document.getElementById('fbx-anim-play');
        if (btn) btn.textContent = '⏸';
        this._updateAnimInfo();
    },

    _toggleAnimation() {
        if (!this._animationActions.length) return;
        if (this._activeAction && this._activeAction.isRunning()) {
            this._activeAction.paused = true;
            document.getElementById('fbx-anim-play').textContent = '▶';
        } else if (this._activeAction) {
            this._activeAction.paused = false;
            document.getElementById('fbx-anim-play').textContent = '⏸';
        } else {
            this._playAnimation(0);
        }
    },

    _stopAnimation() {
        if (this._activeAction) {
            this._activeAction.stop();
            this._activeAction = null;
            this._activeActionIdx = -1;
        }
        document.getElementById('fbx-anim-play').textContent = '▶';
        document.getElementById('fbx-anim-progress').style.width = '0%';
    },

    _prevAnimation() {
        if (!this._animationActions.length) return;
        let idx = this._activeActionIdx - 1;
        if (idx < 0) idx = this._animationActions.length - 1;
        this._playAnimation(idx);
    },

    _nextAnimation() {
        if (!this._animationActions.length) return;
        let idx = this._activeActionIdx + 1;
        if (idx >= this._animationActions.length) idx = 0;
        this._playAnimation(idx);
    },

    // ================================================================
    //  DISPLAY MODE
    // ================================================================

    _setDisplayMode(mode) {
        this._settings.displayMode = mode;
        this._clearWireframeOverlays();

        const wireframeOn = (mode === 'wireframe');
        const mixedOn = (mode === 'mixed');

        this._allMeshes.forEach(mesh => {
            const mat = mesh.material;
            if (!_isMeshMaterial(mat)) return;

            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => {
                    m.wireframe = wireframeOn;
                    m.opacity = wireframeOn ? 1 : (this._originalMaterials.get(mesh)?.opacity ?? 1);
                    m.transparent = !wireframeOn && (this._originalMaterials.get(mesh)?.opacity ?? 1) < 1;
                    m.needsUpdate = true;
                });
            } else {
                mat.wireframe = wireframeOn;
                mat.opacity = wireframeOn ? 1 : (this._originalMaterials.get(mesh)?.opacity ?? 1);
                mat.transparent = !wireframeOn && (this._originalMaterials.get(mesh)?.opacity ?? 1) < 1;
                mat.needsUpdate = true;
            }

            if (mixedOn && mesh.geometry) {
                const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 30);
                const wireColor = new THREE.Color(this._settings.wireframeColor);
                const lineMat = new THREE.LineBasicMaterial({
                    color: wireColor,
                    depthTest: true,
                    depthWrite: false,
                    transparent: true,
                    opacity: 0.6,
                });
                const wireframe = new THREE.LineSegments(edgesGeo, lineMat);
                wireframe.renderOrder = 1;
                mesh.add(wireframe);
                this._wireframeOverlays.set(mesh, wireframe);
            }
        });
    },

    _clearWireframeOverlays() {
        this._wireframeOverlays.forEach((wireframe, mesh) => {
            mesh.remove(wireframe);
            if (wireframe.geometry) wireframe.geometry.dispose();
            if (wireframe.material) wireframe.material.dispose();
        });
        this._wireframeOverlays.clear();
    },

    _applyWireframeColor() {
        const color = new THREE.Color(this._settings.wireframeColor);
        this._wireframeOverlays.forEach(wireframe => {
            if (wireframe.material) wireframe.material.color.copy(color);
        });
    },

    // ================================================================
    //  SELECTION
    // ================================================================

    _onCanvasClick(event) {
        // Skip if just finished a transform drag (prevents gizmo jumping to wrong mesh)
        if (this._justDragged) return;
        if (!this._renderer || !this._camera || !this._allMeshes.length) return;

        const rect = this._renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this._camera);

        const intersects = raycaster.intersectObjects(this._allMeshes, false);
        if (intersects.length > 0) {
            this._selectMesh(intersects[0].object);
        } else {
            this._deselectAll();
        }
    },

    _selectMesh(mesh) {
        if (this._selectedMesh === mesh) return;
        this._deselectAll();

        this._selectedMesh = mesh;

        // Highlight: increase emissive
        if (_isMeshMaterial(mesh.material)) {
            const mat = mesh.material;
            if (mat.emissive) {
                mat._fbxSavedEmissive = mat.emissive.getHex();
                mat._fbxSavedEmissiveIntensity = mat.emissiveIntensity ?? 0;
            }
            mat.emissive = mat.emissive || new THREE.Color();
            mat.emissive.set(0x444444);
            mat.emissiveIntensity = 0.5;
        }

        // Attach transform controls if mode is active
        if (this._transformMode !== 'none' && this._transformControls) {
            this._transformControls.visible = true;
            this._transformControls.attach(mesh);
        }

        // Update property panel
        this._updatePropertyPanel();
        // Highlight tree node
        this._highlightTreeNode(mesh);
    },

    _deselectAll() {
        if (this._selectedMesh) {
            const mat = this._selectedMesh.material;
            if (_isMeshMaterial(mat) && mat.emissive) {
                if (mat._fbxSavedEmissive !== undefined) {
                    mat.emissive.set(mat._fbxSavedEmissive);
                    mat.emissiveIntensity = mat._fbxSavedEmissiveIntensity;
                } else {
                    mat.emissive.set(0x000000);
                    mat.emissiveIntensity = 0;
                }
            }
            this._selectedMesh = null;
        }

        // Detach transform controls
        if (this._transformControls) {
            this._transformControls.detach();
        }

        // Clear tree highlight
        document.querySelectorAll('.fbx-tree-node.active').forEach(n => n.classList.remove('active'));
        // Reset property panel
        this._updatePropertyPanel();
    },

    _focusSelected() {
        if (!this._selectedMesh || !this._controls) return;
        const box = new THREE.Box3().setFromObject(this._selectedMesh);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const d = Math.max(size.x, size.y, size.z) * 3;
        this._controls.target.copy(center);
        this._controls.update();
    },

    _resetCamera() {
        if (!this._controls || !this._allMeshes.length) return;
        const box = new THREE.Box3();
        this._allMeshes.forEach(m => {
            m.updateWorldMatrix(true, false);
            box.expandByObject(m);
        });
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this._controls.target.copy(center);
        const dist = maxDim * 2.2;
        this._camera.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist * 0.6);
        this._controls.update();
    },

    // ================================================================
    //  PROPERTY PANEL
    // ================================================================

    _updatePropertyPanel() {
        const panel = document.getElementById('fbx-property-content');
        if (!panel) return;
        const section = document.getElementById('fbx-property-section');
        const mesh = this._selectedMesh;

        if (!mesh) {
            panel.innerHTML = '<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px 0;">点击视口或部件列表中的部件</p>';
            return;
        }

        const mat = mesh.material;
        if (!_isMeshMaterial(mat)) {
            panel.innerHTML = '<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px 0;">此部件材质不支持编辑</p>';
            return;
        }

        const color = '#' + (mat.color ? mat.color.getHex().toString(16).padStart(6, '0') : 'cccccc');
        const roughness = mat.roughness ?? 0.5;
        const metalness = mat.metalness ?? 0;
        const opacity = mat.opacity ?? 1;

        panel.innerHTML = `
            <div class="fbx-prop-name">${this._getMeshDisplayName(mesh)}</div>
            <div class="control-group">
                <label>颜色</label>
                <div style="display:flex;align-items:center;gap:8px;">
                    <input type="color" id="fbx-prop-color" value="${color}" style="flex:1;height:32px;">
                    <span style="font-size:11px;color:var(--text-muted);">${color.toUpperCase()}</span>
                </div>
            </div>
            <div class="control-group">
                <label>粗糙度 <span class="range-value" id="fbx-rough-val">${roughness.toFixed(2)}</span></label>
                <input type="range" id="fbx-prop-roughness" min="0" max="1" step="0.01" value="${roughness}">
            </div>
            <div class="control-group">
                <label>金属感 <span class="range-value" id="fbx-metal-val">${metalness.toFixed(2)}</span></label>
                <input type="range" id="fbx-prop-metalness" min="0" max="1" step="0.01" value="${metalness}">
            </div>
            <div class="control-group">
                <label>透明度 <span class="range-value" id="fbx-opacity-val">${opacity.toFixed(2)}</span></label>
                <input type="range" id="fbx-prop-opacity" min="0.05" max="1" step="0.05" value="${opacity}">
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                <button class="btn btn-sm" id="fbx-prop-hide">${mesh.visible ? '隐藏此部件' : '显示此部件'}</button>
                <button class="btn btn-sm" id="fbx-prop-reset-mat">重置材质</button>
                <button class="btn btn-sm" id="fbx-prop-reset-xform" title="恢复位置/旋转/缩放到初始状态">↩ 复位变换</button>
                <button class="btn btn-sm" id="fbx-prop-duplicate" title="复制此部件 [Delete键]">📋 复制</button>
                <button class="btn btn-sm btn-primary" id="fbx-prop-sync" title="将当前材质属性同步到所有原始材质相同的部件">🔄 同步同材质</button>
            </div>
        `;

        // Bind property events
        document.getElementById('fbx-prop-color')?.addEventListener('input', e => {
            if (!mat.color) return;
            this._ensureUniqueMaterial(mesh);
            mesh.material.color.set(e.target.value);
        });
        document.getElementById('fbx-prop-roughness')?.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            document.getElementById('fbx-rough-val').textContent = v.toFixed(2);
            this._ensureUniqueMaterial(mesh);
            mesh.material.roughness = v;
        });
        document.getElementById('fbx-prop-metalness')?.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            document.getElementById('fbx-metal-val').textContent = v.toFixed(2);
            this._ensureUniqueMaterial(mesh);
            mesh.material.metalness = v;
        });
        document.getElementById('fbx-prop-opacity')?.addEventListener('input', e => {
            const v = parseFloat(e.target.value);
            document.getElementById('fbx-opacity-val').textContent = v.toFixed(2);
            this._ensureUniqueMaterial(mesh);
            mesh.material.opacity = v;
            mesh.material.transparent = v < 1;
            mesh.material.needsUpdate = true;
        });
        document.getElementById('fbx-prop-hide')?.addEventListener('click', () => {
            this._toggleVisibility(mesh);
            this._updatePropertyPanel();
            this._buildHierarchyTree();
        });
        document.getElementById('fbx-prop-reset-mat')?.addEventListener('click', () => {
            this._resetMaterial(mesh);
            this._updatePropertyPanel();
        });
        document.getElementById('fbx-prop-reset-xform')?.addEventListener('click', () => {
            this._resetTransform(mesh);
            this._updatePropertyPanel();
        });
        document.getElementById('fbx-prop-sync')?.addEventListener('click', () => {
            const count = this._syncToSameMaterial(mesh);
            Toast.success(`已同步到 ${count} 个相同材质的部件`);
            this._updatePropertyPanel();
        });
        document.getElementById('fbx-prop-duplicate')?.addEventListener('click', () => {
            this._duplicateSelectedPart();
            this._updatePropertyPanel();
        });

        section.classList.remove('hidden');
    },

    _syncToSameMaterial(sourceMesh) {
        const orig = this._originalMaterials.get(sourceMesh);
        if (!orig) return 0;

        // Find all meshes whose original material matches the source mesh
        let synced = 0;
        this._allMeshes.forEach(mesh => {
            if (mesh === sourceMesh) return;
            if (!_isMeshMaterial(mesh.material)) return;

            const meshOrig = this._originalMaterials.get(mesh);
            if (!meshOrig) return;

            // Compare original properties to identify same-material-group meshes
            if (meshOrig.color !== orig.color) return;
            if (Math.abs((meshOrig.roughness ?? 0.5) - (orig.roughness ?? 0.5)) > 0.001) return;
            if (Math.abs((meshOrig.metalness ?? 0) - (orig.metalness ?? 0)) > 0.001) return;
            if (Math.abs((meshOrig.opacity ?? 1) - (orig.opacity ?? 1)) > 0.001) return;

            // Apply source mesh's CURRENT material properties
            const srcMat = sourceMesh.material;
            const dstMat = mesh.material;

            if (srcMat.color && dstMat.color) dstMat.color.copy(srcMat.color);
            if (dstMat.roughness !== undefined) dstMat.roughness = srcMat.roughness ?? dstMat.roughness;
            if (dstMat.metalness !== undefined) dstMat.metalness = srcMat.metalness ?? dstMat.metalness;
            if (dstMat.opacity !== undefined) {
                dstMat.opacity = srcMat.opacity ?? dstMat.opacity;
                dstMat.transparent = dstMat.opacity < 1;
            }
            dstMat.wireframe = srcMat.wireframe;
            dstMat.needsUpdate = true;
            synced++;
        });

        return synced;
    },

    _ensureUniqueMaterial(mesh) {
        // If this mesh shares material with others, clone it
        if (!mesh.material || !_isMeshMaterial(mesh.material)) return;
        // Check if any other mesh uses the same material instance
        const shared = this._allMeshes.some(m =>
            m !== mesh && (m.material === mesh.material ||
                (Array.isArray(m.material) && m.material.includes(mesh.material)))
        );
        if (shared) {
            mesh.material = mesh.material.clone();
        }
    },

    _resetMaterial(mesh) {
        if (!mesh || !_isMeshMaterial(mesh.material)) return;
        const orig = this._originalMaterials.get(mesh);
        if (!orig) return;
        const mat = mesh.material;
        if (mat.color) mat.color.setHex(orig.color);
        if (mat.roughness !== undefined) mat.roughness = orig.roughness;
        if (mat.metalness !== undefined) mat.metalness = orig.metalness;
        if (mat.opacity !== undefined) {
            mat.opacity = orig.opacity;
            mat.transparent = orig.opacity < 1;
        }
        mat.wireframe = orig.wireframe;
        mat.needsUpdate = true;
    },

    _toggleVisibility(mesh) {
        if (!mesh) return;
        mesh.visible = !mesh.visible;
        // Also update wireframe overlay
        const overlay = this._wireframeOverlays.get(mesh);
        if (overlay) overlay.visible = mesh.visible;
    },

    // ================================================================
    //  MODEL INFO
    // ================================================================

    _updateModelInfo(fileName) {
        let totalVerts = 0;
        let totalFaces = 0;
        this._allMeshes.forEach(m => {
            if (m.geometry) {
                const posAttr = m.geometry.getAttribute('position');
                if (posAttr) totalVerts += posAttr.count;
                if (m.geometry.index) {
                    totalFaces += m.geometry.index.count / 3;
                } else if (posAttr) {
                    totalFaces += posAttr.count / 3;
                }
            }
        });

        const matSet = new Set();
        this._allMeshes.forEach(m => {
            if (m.material) {
                if (Array.isArray(m.material)) {
                    m.material.forEach(mt => matSet.add(mt));
                } else {
                    matSet.add(m.material);
                }
            }
        });

        const animCount = this._animationActions.length;

        document.getElementById('fbx-info-grid').innerHTML = `
            <div class="fbx-info-item"><span class="fbx-info-val">${fileName}</span><span class="fbx-info-lbl">文件名</span></div>
            <div class="fbx-info-item"><span class="fbx-info-val">${totalVerts.toLocaleString()}</span><span class="fbx-info-lbl">顶点数</span></div>
            <div class="fbx-info-item"><span class="fbx-info-val">${Math.round(totalFaces).toLocaleString()}</span><span class="fbx-info-lbl">三角面</span></div>
            <div class="fbx-info-item"><span class="fbx-info-val">${this._allMeshes.length}</span><span class="fbx-info-lbl">部件数</span></div>
            <div class="fbx-info-item"><span class="fbx-info-val">${matSet.size}</span><span class="fbx-info-lbl">材质数</span></div>
            <div class="fbx-info-item"><span class="fbx-info-val">${animCount}</span><span class="fbx-info-lbl">动画数</span></div>
        `;

        document.getElementById('fbx-status-model').textContent = fileName;
        document.getElementById('fbx-status-tris').textContent = `三角面: ${Math.round(totalFaces).toLocaleString()}`;
    },

    _showSections(hasModel) {
        const sections = ['fbx-info-section', 'fbx-hierarchy-section', 'fbx-property-section', 'fbx-anim-section'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === 'fbx-anim-section') return; // handled by _setupAnimations
            el.classList.toggle('hidden', !hasModel);
        });
        // Show property section always but with placeholder
        if (hasModel) {
            document.getElementById('fbx-info-section').classList.remove('hidden');
            document.getElementById('fbx-hierarchy-section').classList.remove('hidden');
            document.getElementById('fbx-property-section').classList.remove('hidden');
        }
        // Show/hide placeholder
        const ph = document.getElementById('fbx-placeholder');
        if (ph) ph.style.display = hasModel ? 'none' : 'flex';
    },

    // ================================================================
    //  HIERARCHY TREE
    // ================================================================

    _buildHierarchyTree() {
        const treeEl = document.getElementById('fbx-hierarchy-tree');
        if (!treeEl) return;

        const buildNode = (obj, depth = 0) => {
            const node = { name: obj.name || obj.type || 'Unnamed', type: obj.type || 'Object', children: [] };
            node.meshRef = obj.isMesh ? obj : null;
            node.visible = obj.visible !== false;
            node.id = obj.uuid || THREE.MathUtils.generateUUID();

            if (obj.children) {
                obj.children.forEach(child => {
                    // Skip wireframe overlays and lights we added
                    if (child.name && child.name.startsWith('_fbx_')) return;
                    // Only include groups and meshes
                    if (child.isMesh || (child.children && child.children.length > 0)) {
                        node.children.push(buildNode(child, depth + 1));
                    }
                });
            }
            return node;
        };

        let roots = [];
        if (this._modelRoot) {
            // Build from scene children that are our models
            this._scene.children.forEach(child => {
                if (child.isLight || child.name?.startsWith('_fbx_') || child === this._gridHelper) return;
                if (child.isMesh || child.isGroup || child.isObject3D) {
                    roots.push(buildNode(child, 0));
                }
            });
        }

        const renderTree = (nodes, level = 0) => {
            let html = '';
            nodes.forEach(node => {
                const hasChildren = node.children && node.children.length > 0;
                const isMesh = !!node.meshRef;
                const isSelected = node.meshRef && this._selectedMesh === node.meshRef;
                const visIcon = node.visible ? '👁' : '👁‍🗨';
                const padLeft = level * 16;

                html += `<div class="fbx-tree-node ${isSelected ? 'active' : ''} ${!isMesh && !hasChildren ? 'leaf-empty' : ''}"
                    data-node-id="${node.id}" data-mesh-uuid="${node.meshRef?.uuid || ''}" style="padding-left:${padLeft}px">
                    <span class="fbx-tree-toggle">${hasChildren ? '▼' : isMesh ? '　' : '　'}</span>
                    <span class="fbx-tree-icon">${isMesh ? '🔷' : '📁'}</span>
                    <span class="fbx-tree-name ${!node.visible ? 'hidden-part' : ''}">${node.name}</span>
                    <span class="fbx-tree-vis">${visIcon}</span>
                </div>`;

                if (hasChildren) {
                    html += renderTree(node.children, level + 1);
                }
            });
            return html;
        };

        treeEl.innerHTML = renderTree(roots) || '<p style="font-size:12px;color:var(--text-muted);padding:8px;">无部件</p>';

        // Store tree data for later use
        this._treeData = roots;
    },

    _treeToggleExpand(nodeId) {
        // This is a simplified version — full expand/collapse would require
        // storing expanded state and rebuilding. For now, clicking toggle
        // on the tree node toggles expand in a simpler way.
        const node = document.querySelector(`.fbx-tree-node[data-node-id="${nodeId}"]`);
        if (!node) return;
        const toggle = node.querySelector('.fbx-tree-toggle');
        if (!toggle) return;
        const isExpanded = toggle.textContent === '▼';
        toggle.textContent = isExpanded ? '▶' : '▼';

        // Hide/show children (next siblings at deeper level)
        let next = node.nextElementSibling;
        while (next) {
            const nextPad = parseInt(next.style.paddingLeft) || 0;
            const myPad = parseInt(node.style.paddingLeft) || 0;
            if (nextPad <= myPad) break;
            next.style.display = isExpanded ? 'none' : '';
            next = next.nextElementSibling;
        }
    },

    _treeSelectNode(nodeId) {
        // Find the mesh by nodeId in tree data
        const findMesh = (nodes, id) => {
            for (const node of nodes) {
                if (node.id === id && node.meshRef) return node.meshRef;
                if (node.children) {
                    const found = findMesh(node.children, id);
                    if (found) return found;
                }
            }
            return null;
        };
        const mesh = findMesh(this._treeData || [], nodeId);
        if (mesh) {
            this._selectMesh(mesh);
        }
    },

    _highlightTreeNode(mesh) {
        document.querySelectorAll('.fbx-tree-node.active').forEach(n => n.classList.remove('active'));
        if (!mesh) return;
        const node = document.querySelector(`.fbx-tree-node[data-mesh-uuid="${mesh.uuid}"]`);
        if (node) {
            node.classList.add('active');
            node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    },

    _treeToggleVisibility(nodeId) {
        const findMesh = (nodes, id) => {
            for (const node of nodes) {
                if (node.id === id && node.meshRef) return node.meshRef;
                if (node.children) {
                    const found = findMesh(node.children, id);
                    if (found) return found;
                }
            }
            return null;
        };
        const mesh = findMesh(this._treeData || [], nodeId);
        if (mesh) {
            this._toggleVisibility(mesh);
            this._buildHierarchyTree();
            // Restore selection highlight
            if (this._selectedMesh) this._highlightTreeNode(this._selectedMesh);
        }
    },

    _treeExpandAll() {
        document.querySelectorAll('.fbx-tree-toggle').forEach(t => { t.textContent = '▼'; });
        document.querySelectorAll('.fbx-tree-node').forEach(n => { n.style.display = ''; });
    },

    _treeCollapseAll() {
        document.querySelectorAll('.fbx-tree-toggle').forEach(t => { t.textContent = '▶'; });
        document.querySelectorAll('.fbx-tree-node').forEach(n => {
            const pad = parseInt(n.style.paddingLeft) || 0;
            if (pad > 0) n.style.display = 'none';
        });
    },

    _treeShowAll() {
        this._allMeshes.forEach(m => { m.visible = true; });
        this._wireframeOverlays.forEach(w => { w.visible = true; });
        this._buildHierarchyTree();
        if (this._selectedMesh) this._highlightTreeNode(this._selectedMesh);
    },

    _treeHideAll() {
        this._allMeshes.forEach(m => { m.visible = false; });
        this._wireframeOverlays.forEach(w => { w.visible = false; });
        this._buildHierarchyTree();
    },

    _getMeshDisplayName(mesh) {
        let name = mesh.name || 'Unnamed';
        // Walk up to find meaningful names
        let parent = mesh.parent;
        while (parent && (!name || name === 'Unnamed' || name === '')) {
            if (parent.name && parent.name !== '') {
                name = parent.name + ' / ' + (mesh.name || 'part');
                break;
            }
            parent = parent.parent;
        }
        return name || '未命名部件';
    },

    // ================================================================
    //  VIEW CONTROLS
    // ================================================================

    _setView(viewName) {
        if (!this._controls || !this._allMeshes.length) return;

        const box = new THREE.Box3();
        this._allMeshes.forEach(m => {
            m.updateWorldMatrix(true, false);
            box.expandByObject(m);
        });
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const dist = Math.max(size.x, size.y, size.z) * 2.0;

        const pos = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);

        switch (viewName) {
            case 'front':
                pos.set(center.x, center.y, center.z + dist);
                up.set(0, 1, 0);
                break;
            case 'back':
                pos.set(center.x, center.y, center.z - dist);
                up.set(0, 1, 0);
                break;
            case 'top':
                pos.set(center.x, center.y + dist, center.z);
                up.set(0, 0, -1);
                break;
            case 'bottom':
                pos.set(center.x, center.y - dist, center.z);
                up.set(0, 0, 1);
                break;
            case 'left':
                pos.set(center.x - dist, center.y, center.z);
                up.set(0, 1, 0);
                break;
            case 'right':
                pos.set(center.x + dist, center.y, center.z);
                up.set(0, 1, 0);
                break;
        }

        // Animate to target
        this._camera.position.copy(pos);
        this._camera.up.copy(up);
        this._controls.target.copy(center);
        this._controls.update();

        // Highlight active button
        document.querySelectorAll('.fbx-view-btn[data-view]').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.fbx-view-btn[data-view="${viewName}"]`);
        if (btn) btn.classList.add('active');

        this._currentView = viewName;
    },

    _nudgeView(direction) {
        if (!this._camera || !this._controls || !this._allMeshes.length) return;

        const target = this._controls.target;
        const camPos = this._camera.position.clone();
        const offset = camPos.sub(target);
        const dist = offset.length() || 1;
        const dir = offset.normalize();
        const right = new THREE.Vector3().crossVectors(dir, this._camera.up).normalize();
        const upLocal = new THREE.Vector3().crossVectors(right, dir).normalize();

        const rotStep = Math.PI / 36; // 5 degrees
        const zoomStep = dist * 0.12;

        let newPos = this._camera.position.clone();

        switch (direction) {
            case 'up':
                newPos = target.clone().add(offset.clone().applyAxisAngle(right, rotStep));
                break;
            case 'down':
                newPos = target.clone().add(offset.clone().applyAxisAngle(right, -rotStep));
                break;
            case 'left':
                newPos = target.clone().add(offset.clone().applyAxisAngle(upLocal, -rotStep));
                break;
            case 'right':
                newPos = target.clone().add(offset.clone().applyAxisAngle(upLocal, rotStep));
                break;
            case 'zoomin':
                newPos = target.clone().add(dir.clone().multiplyScalar(Math.max(dist - zoomStep, 0.1)));
                break;
            case 'zoomout':
                newPos = target.clone().add(dir.clone().multiplyScalar(dist + zoomStep));
                break;
        }

        this._camera.position.copy(newPos);
        this._controls.update();
        // Clear view preset highlight when nudging
        this._currentView = null;
        document.querySelectorAll('.fbx-view-btn[data-view]').forEach(b => b.classList.remove('active'));
    },

    // ================================================================
    //  TRANSFORM CONTROLS
    // ================================================================

    _setTransformMode(mode) {
        this._transformMode = mode;
        const tc = this._transformControls;
        if (!tc) return;

        // Update button highlights
        document.querySelectorAll('.fbx-transform-btn').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`.fbx-transform-btn[data-transform="${mode}"]`);
        if (btn) btn.classList.add('active');

        if (mode === 'none') {
            tc.detach();
            tc.visible = false;
            return;
        }

        tc.setMode(mode);
        tc.visible = true;

        // Attach to selected mesh
        if (this._selectedMesh) {
            tc.attach(this._selectedMesh);
        } else {
            Toast.info('请先选中一个部件');
            tc.detach();
        }
    },

    _duplicateSelectedPart() {
        if (!this._selectedMesh) {
            Toast.info('请先选中要复制的部件');
            return;
        }

        const src = this._selectedMesh;
        // Clone geometry and material
        const newGeo = src.geometry.clone();
        const newMat = Array.isArray(src.material)
            ? src.material.map(m => m.clone())
            : src.material.clone();

        const newMesh = new THREE.Mesh(newGeo, newMat);
        newMesh.name = (src.name || 'part') + '_copy';
        newMesh.visible = true;
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;

        // Offset the copy slightly
        newMesh.position.copy(src.position).add(new THREE.Vector3(0.5, 0, 0));
        newMesh.rotation.copy(src.rotation);
        newMesh.scale.copy(src.scale);

        // Add to the same parent
        if (src.parent) {
            src.parent.add(newMesh);
        } else {
            this._scene.add(newMesh);
        }

        // Register in mesh lists
        this._allMeshes.push(newMesh);
        this._saveOriginalMaterial(newMesh);
        this._saveOriginalTransform(newMesh);

        // Update UI
        this._buildHierarchyTree();
        this._selectMesh(newMesh);
        Toast.success('部件已复制');

        // If transform mode is active, attach to new copy
        if (this._transformMode !== 'none' && this._transformControls) {
            this._transformControls.attach(newMesh);
        }
    },

    _saveOriginalTransform(mesh) {
        this._originalTransforms.set(mesh, {
            position: mesh.position.clone(),
            rotation: mesh.rotation.clone(),
            scale: mesh.scale.clone(),
        });
    },

    _pushUndoState() {
        if (!this._selectedMesh) return;
        // Trim future states if we undid then performed new action
        if (this._undoIndex < this._undoStack.length - 1) {
            this._undoStack = this._undoStack.slice(0, this._undoIndex + 1);
        }
        const mesh = this._selectedMesh;
        this._undoStack.push({
            mesh: mesh,
            position: mesh.position.clone(),
            rotation: mesh.rotation.clone(),
            scale: mesh.scale.clone(),
        });
        this._undoIndex = this._undoStack.length - 1;
        // Limit stack size
        if (this._undoStack.length > 50) {
            this._undoStack.shift();
            this._undoIndex--;
        }
    },

    _undoTransform() {
        if (this._undoIndex < 0 || !this._undoStack.length) {
            Toast.info('没有可撤销的操作');
            return;
        }
        const state = this._undoStack[this._undoIndex];
        const mesh = state.mesh;
        mesh.position.copy(state.position);
        mesh.rotation.copy(state.rotation);
        mesh.scale.copy(state.scale);
        this._undoIndex--;
        this._updateWireframeOverlay(mesh);
        Toast.info('已撤销');
    },

    _resetTransform(mesh) {
        if (!mesh) {
            mesh = this._selectedMesh;
        }
        if (!mesh) return;
        const orig = this._originalTransforms.get(mesh);
        if (!orig) {
            Toast.info('无原始变换数据');
            return;
        }
        // Save undo state before resetting
        this._pushUndoState();
        mesh.position.copy(orig.position);
        mesh.rotation.copy(orig.rotation);
        mesh.scale.copy(orig.scale);
        this._updateWireframeOverlay(mesh);
        Toast.success('已复位');
    },

    _updateWireframeOverlay(mesh) {
        const overlay = this._wireframeOverlays.get(mesh);
        if (overlay && mesh.geometry) {
            // Rebuild edges geometry with updated positions
            mesh.remove(overlay);
            if (overlay.geometry) overlay.geometry.dispose();
            if (overlay.material) overlay.material.dispose();

            const edgesGeo = new THREE.EdgesGeometry(mesh.geometry, 30);
            const wireColor = new THREE.Color(this._settings.wireframeColor);
            const lineMat = new THREE.LineBasicMaterial({
                color: wireColor,
                depthTest: true,
                depthWrite: false,
                transparent: true,
                opacity: 0.6,
            });
            const newOverlay = new THREE.LineSegments(edgesGeo, lineMat);
            newOverlay.renderOrder = 1;
            mesh.add(newOverlay);
            this._wireframeOverlays.set(mesh, newOverlay);
        }
    },

    // ================================================================
    //  SCREENSHOT
    // ================================================================

    _captureScreenshot(whiteBg) {
        if (!this._renderer || !this._allMeshes.length) {
            Toast.warning('请先加载模型');
            return;
        }

        const renderer = this._renderer;
        const scene = this._scene;

        // Save state
        const savedBg = scene.background;
        const savedFog = scene.fog;
        const savedClearAlpha = renderer.getClearAlpha();

        if (whiteBg) {
            scene.background = new THREE.Color(0xffffff);
            scene.fog = null;
        }
        renderer.setClearAlpha(1);

        // Render one frame
        renderer.render(scene, this._camera);

        // Capture
        const dataUrl = renderer.domElement.toDataURL('image/png');

        // Restore
        scene.background = savedBg;
        scene.fog = savedFog;
        renderer.setClearAlpha(savedClearAlpha);

        // Download
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const prefix = whiteBg ? '白底图' : '截图';
        Utils.downloadDataURL(dataUrl, `FBX_${prefix}_${timestamp}.png`);
        Toast.success(`${prefix}已导出`);
    },

    // ================================================================
    //  RESIZE
    // ================================================================

    _onResize() {
        if (!this._viewport || !this._renderer || !this._camera) return;
        const rect = this._viewport.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (w <= 0 || h <= 0) return;
        this._renderer.setSize(w, h, false);
        this._camera.aspect = w / Math.max(h, 1);
        this._camera.updateProjectionMatrix();
    },

    // ================================================================
    //  ANIMATION LOOP
    // ================================================================

    _animate() {
        this._animId = requestAnimationFrame(() => this._animate());

        if (!this._renderer || !this._scene || !this._camera) return;

        // Check if still in DOM
        if (!this._renderer.domElement.isConnected) return;

        const delta = this._clock ? Math.min(this._clock.getDelta(), 0.1) : 0.016;

        // Update mixer
        if (this._mixer) {
            this._mixer.update(delta);
            // Update progress bar
            if (this._activeAction && this._activeAction.isRunning()) {
                const clip = this._activeAction.getClip();
                const progress = (this._activeAction.time % clip.duration) / clip.duration;
                const bar = document.getElementById('fbx-anim-progress');
                if (bar) bar.style.width = (progress * 100) + '%';
            }
        }

        // Update controls
        if (this._controls) this._controls.update();

        // Render
        this._renderer.render(this._scene, this._camera);

        // FPS counter (update every 30 frames)
        if (!this._fpsCounter) this._fpsCounter = { frames: 0, lastTime: performance.now() };
        this._fpsCounter.frames++;
        const now = performance.now();
        if (now - this._fpsCounter.lastTime >= 1000) {
            const fps = Math.round(this._fpsCounter.frames / ((now - this._fpsCounter.lastTime) / 1000));
            const fpsEl = document.getElementById('fbx-status-fps');
            if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
            this._fpsCounter = { frames: 0, lastTime: now };
        }
    }
};

// ===== Export =====
window.FBXViewer = FBXViewer;
window._fbxViewerReady = true;

})().catch(err => {
    console.error('FBX Viewer: failed to load dependencies', err);
    window._fbxViewerError = err;
    window._fbxViewerReady = true;
});
