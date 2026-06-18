const WordTools = {
    API_URL: 'https://liusangbay-wordtools.hf.space',

    render(container, subTool) {
        this.state = {
            ignoreTip: localStorage.getItem('word_ignoreTip') === 'true',
            results: [],
            converting: false
        };

        container.innerHTML = `
            <div class="tool-page">
                <div class="tool-page-header">
                    <h2>Word工具</h2>
                    <p>图片转Word · Word转图片 · 转PDF</p>
                </div>
                <div class="tool-tabs" id="word-tabs">
                    <button class="tool-tab active" data-sub="img2word">图片转Word</button>
                    <button class="tool-tab" data-sub="word2img">Word转图片</button>
                    <button class="tool-tab" data-sub="word2pdf">转PDF</button>
                </div>
                <div id="word-content"></div>
                <div id="word-download-panel" class="word-download-panel" style="display:none">
                    <div class="word-download-header">
                        <h4>转换结果</h4>
                        <div>
                            <button class="btn btn-sm" id="word-select-all">全选</button>
                            <button class="btn btn-sm" id="word-deselect-all">取消全选</button>
                            <button class="btn btn-primary btn-sm" id="word-download-selected">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                下载选中
                            </button>
                            <button class="btn btn-primary btn-sm" id="word-download-all">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                                打包下载 (ZIP)
                            </button>
                        </div>
                    </div>
                    <div class="word-download-list" id="word-download-list"></div>
                </div>
            </div>

            <div class="word-dialog-overlay" id="word-dialog-overlay" style="display:none">
                <div class="word-dialog">
                    <div class="word-dialog-icon">⚠️</div>
                    <div class="word-dialog-title">提示</div>
                    <div class="word-dialog-body">图片转Word只能识别文字，排版需要自己手动调整</div>
                    <div class="word-dialog-check">
                        <input type="checkbox" id="word-dialog-noagain">
                        <label for="word-dialog-noagain">不再提示</label>
                    </div>
                    <div class="word-dialog-btns">
                        <button class="btn btn-primary" id="word-dialog-ok">确定</button>
                    </div>
                </div>
            </div>
        `;

        this._bindEvents(container);
        this._showTab('img2word');
    },

    _bindEvents(container) {
        const tabs = container.querySelectorAll('.tool-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._showTab(tab.dataset.sub);
            };
        });

        document.getElementById('word-select-all').onclick = () => {
            document.querySelectorAll('#word-download-list .word-dl-cb').forEach(cb => cb.checked = true);
        };
        document.getElementById('word-deselect-all').onclick = () => {
            document.querySelectorAll('#word-download-list .word-dl-cb').forEach(cb => cb.checked = false);
        };
        document.getElementById('word-download-selected').onclick = () => this._downloadSelected();
        document.getElementById('word-download-all').onclick = () => this._downloadAllAsZip();
    },

    _showTab(sub) {
        const content = document.getElementById('word-content');
        document.getElementById('word-download-panel').style.display = 'none';
        this.state.results = [];

        if (sub === 'img2word') this._renderImg2Word(content);
        else if (sub === 'word2img') this._renderWord2Img(content);
        else if (sub === 'word2pdf') this._renderWord2Pdf(content);
    },

    _renderImg2Word(container) {
        container.innerHTML = `
            <div class="word-upload-area" id="word-img-upload">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <p>拖放图片到此处，或点击选择</p>
                <span>支持 PNG / JPG / GIF，可多选</span>
            </div>
            <input type="file" id="word-img-input" accept="image/*" multiple style="display:none">
            <div id="word-img-preview" class="word-preview-grid"></div>
            <div id="word-img-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="word-img-count"></span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-sm" id="word-img-clear">清空</button>
                    <button class="btn btn-primary" id="word-img-convert">开始转换</button>
                </div>
            </div>
        `;

        const state = { files: [] };
        const upload = document.getElementById('word-img-upload');
        const fileInput = document.getElementById('word-img-input');
        const preview = document.getElementById('word-img-preview');
        const actions = document.getElementById('word-img-actions');
        const countEl = document.getElementById('word-img-count');

        upload.onclick = () => fileInput.click();
        upload.ondragover = (e) => { e.preventDefault(); upload.classList.add('drag-over'); };
        upload.ondragleave = () => upload.classList.remove('drag-over');
        upload.ondrop = (e) => {
            e.preventDefault();
            upload.classList.remove('drag-over');
            const imgs = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
            if (imgs.length) addFiles(imgs);
        };
        fileInput.onchange = (e) => {
            if (e.target.files.length) addFiles([...e.target.files]);
            fileInput.value = '';
        };

        function addFiles(newFiles) {
            state.files.push(...newFiles);
            renderPreview();
        }

        function renderPreview() {
            if (state.files.length === 0) {
                preview.innerHTML = '';
                actions.classList.add('hidden');
                return;
            }
            actions.classList.remove('hidden');
            countEl.textContent = `已选择 ${state.files.length} 张图片`;
            preview.innerHTML = '';
            state.files.forEach((file, idx) => {
                const item = document.createElement('div');
                item.className = 'word-preview-item';
                item.innerHTML = `
                    <img src="${URL.createObjectURL(file)}" alt="${file.name}">
                    <button class="word-preview-remove" data-idx="${idx}" title="移除">&times;</button>
                    <span class="word-preview-name">${file.name}</span>
                `;
                preview.appendChild(item);
            });
            preview.querySelectorAll('.word-preview-remove').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    state.files.splice(parseInt(btn.dataset.idx), 1);
                    renderPreview();
                };
            });
        }

        document.getElementById('word-img-clear').onclick = () => {
            state.files = [];
            renderPreview();
        };

        document.getElementById('word-img-convert').onclick = async () => {
            if (state.files.length === 0 || this.state.converting) return;

            if (!this.state.ignoreTip) {
                this._showDialog(async () => {
                    await this._convertImg2Word(state.files);
                });
            } else {
                await this._convertImg2Word(state.files);
            }
        };
    },

    async _convertImg2Word(files) {
        this.state.converting = true;
        Loading.show('正在识别文字并生成Word...');
        try {
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));
            formData.append('layout', 'auto');

            const resp = await fetch(this.API_URL + '/api/convert_images_to_docx', {
                method: 'POST',
                body: formData,
            });

            if (!resp.ok) throw new Error(`服务器错误 (${resp.status})`);
            const result = await resp.json();
            Loading.hide();
            this.state.converting = false;

            if (result.error) {
                Toast.error(result.error);
                return;
            }

            this.state.results.push({
                name: result.filename || 'converted.docx',
                dataUrl: result.data_url,
                type: 'docx'
            });
            this._renderDownloadList();
            Toast.success('转换完成');
        } catch (err) {
            Loading.hide();
            this.state.converting = false;
            Toast.error('转换失败: ' + err.message);
        }
    },

    _renderWord2Img(container) {
        container.innerHTML = `
            <div class="word-upload-area" id="word2img-upload">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                <p>拖放Word文档到此处，或点击选择</p>
                <span>支持 .docx 格式</span>
            </div>
            <input type="file" id="word2img-input" accept=".docx" style="display:none">
            <div id="word2img-info" class="stats-row hidden">
                <div class="stat-card"><div class="stat-value" id="word2img-stat-name">-</div><div class="stat-label">文件名</div></div>
                <div class="stat-card"><div class="stat-value" id="word2img-stat-size">-</div><div class="stat-label">文件大小</div></div>
            </div>
            <div id="word2img-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <div class="control-group">
                        <label>输出格式</label>
                        <select id="word2img-format" class="word-select">
                            <option value="png">PNG</option>
                            <option value="jpg">JPG</option>
                        </select>
                    </div>
                    <div class="control-group" style="margin-left:12px">
                        <label>DPI</label>
                        <select id="word2img-dpi" class="word-select">
                            <option value="150">150 (标准)</option>
                            <option value="200">200 (高清)</option>
                            <option value="300" selected>300 (超清)</option>
                        </select>
                    </div>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-sm" id="word2img-reselect">重新选择</button>
                    <button class="btn btn-primary" id="word2img-convert">开始转换</button>
                </div>
            </div>
        `;

        const state = { file: null };
        const upload = document.getElementById('word2img-upload');
        const fileInput = document.getElementById('word2img-input');
        const info = document.getElementById('word2img-info');
        const actions = document.getElementById('word2img-actions');

        upload.onclick = () => fileInput.click();
        upload.ondragover = (e) => { e.preventDefault(); upload.classList.add('drag-over'); };
        upload.ondragleave = () => upload.classList.remove('drag-over');
        upload.ondrop = (e) => {
            e.preventDefault();
            upload.classList.remove('drag-over');
            const docx = [...e.dataTransfer.files].find(f => f.name.toLowerCase().endsWith('.docx'));
            if (docx) processFile(docx);
        };
        fileInput.onchange = (e) => {
            if (e.target.files.length) processFile(e.target.files[0]);
            fileInput.value = '';
        };

        function processFile(file) {
            state.file = file;
            upload.style.display = 'none';
            info.classList.remove('hidden');
            actions.classList.remove('hidden');
            document.getElementById('word2img-stat-name').textContent = file.name;
            document.getElementById('word2img-stat-size').textContent = Utils.formatSize(file.size);
        }

        document.getElementById('word2img-convert').onclick = async () => {
            if (!state.file || this.state.converting) return;
            this.state.converting = true;
            const format = document.getElementById('word2img-format').value;
            const dpi = document.getElementById('word2img-dpi').value;
            Loading.show('正在将Word转为图片...');
            try {
                const formData = new FormData();
                formData.append('file', state.file);
                formData.append('format', format);
                formData.append('dpi', dpi);

                const resp = await fetch(this.API_URL + '/api/convert_docx_to_images', { method: 'POST', body: formData });
                if (!resp.ok) throw new Error(`服务器错误 (${resp.status})`);
                const result = await resp.json();
                Loading.hide();
                this.state.converting = false;

                if (result.error) { Toast.error(result.error); return; }

                const baseName = Utils.getBaseName(state.file.name);
                if (result.images) {
                    result.images.forEach(img => {
                        this.state.results.push({ name: img.filename, dataUrl: img.dataUrl, type: 'image' });
                    });
                } else if (result.zip_url) {
                    this.state.results.push({ name: baseName + '_images.zip', dataUrl: result.zip_url, type: 'zip' });
                }
                this._renderDownloadList();
                Toast.success('转换完成');
            } catch (err) {
                Loading.hide();
                this.state.converting = false;
                Toast.error('转换失败: ' + err.message);
            }
        };

        document.getElementById('word2img-reselect').onclick = () => {
            state.file = null;
            upload.style.display = '';
            info.classList.add('hidden');
            actions.classList.add('hidden');
        };
    },

    _renderWord2Pdf(container) {
        container.innerHTML = `
            <div class="word-upload-area" id="word2pdf-upload">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                <p>拖放Word文档到此处，或点击选择</p>
                <span>支持 .docx 格式 · 精准保留排版</span>
            </div>
            <input type="file" id="word2pdf-input" accept=".docx" style="display:none">
            <div id="word2pdf-info" class="stats-row hidden">
                <div class="stat-card"><div class="stat-value" id="word2pdf-stat-name">-</div><div class="stat-label">文件名</div></div>
                <div class="stat-card"><div class="stat-value" id="word2pdf-stat-size">-</div><div class="stat-label">文件大小</div></div>
            </div>
            <div id="word2pdf-actions" class="action-bar hidden">
                <div class="action-bar-left">
                    <span id="word2pdf-status" style="color:var(--text-secondary)">准备就绪</span>
                </div>
                <div class="action-bar-right">
                    <button class="btn btn-sm" id="word2pdf-reselect">重新选择</button>
                    <button class="btn btn-primary" id="word2pdf-convert">开始转换</button>
                </div>
            </div>
        `;

        const state = { file: null };
        const upload = document.getElementById('word2pdf-upload');
        const fileInput = document.getElementById('word2pdf-input');
        const info = document.getElementById('word2pdf-info');
        const actions = document.getElementById('word2pdf-actions');

        upload.onclick = () => fileInput.click();
        upload.ondragover = (e) => { e.preventDefault(); upload.classList.add('drag-over'); };
        upload.ondragleave = () => upload.classList.remove('drag-over');
        upload.ondrop = (e) => {
            e.preventDefault();
            upload.classList.remove('drag-over');
            const docx = [...e.dataTransfer.files].find(f => f.name.toLowerCase().endsWith('.docx'));
            if (docx) processFile(docx);
        };
        fileInput.onchange = (e) => {
            if (e.target.files.length) processFile(e.target.files[0]);
            fileInput.value = '';
        };

        function processFile(file) {
            state.file = file;
            upload.style.display = 'none';
            info.classList.remove('hidden');
            actions.classList.remove('hidden');
            document.getElementById('word2pdf-stat-name').textContent = file.name;
            document.getElementById('word2pdf-stat-size').textContent = Utils.formatSize(file.size);
            document.getElementById('word2pdf-status').textContent = '准备就绪';
        }

        document.getElementById('word2pdf-convert').onclick = async () => {
            if (!state.file || this.state.converting) return;
            this.state.converting = true;
            document.getElementById('word2pdf-status').textContent = '正在转换...';
            Loading.show('正在将Word转为PDF...');
            try {
                const formData = new FormData();
                formData.append('file', state.file);

                const resp = await fetch(this.API_URL + '/api/convert_docx_to_pdf', { method: 'POST', body: formData });
                if (!resp.ok) throw new Error(`服务器错误 (${resp.status})`);
                const result = await resp.json();
                Loading.hide();
                this.state.converting = false;

                if (result.error) {
                    Toast.error(result.error);
                    document.getElementById('word2pdf-status').textContent = '转换失败';
                    return;
                }

                this.state.results.push({
                    name: result.filename || Utils.getBaseName(state.file.name) + '.pdf',
                    dataUrl: result.data_url,
                    type: 'pdf'
                });
                this._renderDownloadList();
                document.getElementById('word2pdf-status').textContent = '转换完成';
                Toast.success('转换完成');
            } catch (err) {
                Loading.hide();
                this.state.converting = false;
                document.getElementById('word2pdf-status').textContent = '转换失败';
                Toast.error('转换失败: ' + err.message);
            }
        };

        document.getElementById('word2pdf-reselect').onclick = () => {
            state.file = null;
            upload.style.display = '';
            info.classList.add('hidden');
            actions.classList.add('hidden');
        };
    },

    _showDialog(onConfirm) {
        const overlay = document.getElementById('word-dialog-overlay');
        const noagain = document.getElementById('word-dialog-noagain');
        overlay.style.display = 'flex';

        document.getElementById('word-dialog-ok').onclick = () => {
            if (noagain.checked) {
                this.state.ignoreTip = true;
                localStorage.setItem('word_ignoreTip', 'true');
            }
            overlay.style.display = 'none';
            onConfirm();
        };
    },

    _renderDownloadList() {
        const panel = document.getElementById('word-download-panel');
        const list = document.getElementById('word-download-list');
        panel.style.display = 'block';

        list.innerHTML = this.state.results.map((r, idx) => `
            <div class="word-dl-item">
                <input type="checkbox" class="word-dl-cb" data-idx="${idx}" checked>
                <div class="word-dl-info">
                    <span class="word-dl-name">${r.name}</span>
                    <span class="word-dl-type">${r.type.toUpperCase()}</span>
                </div>
                <button class="btn btn-sm word-dl-single" data-idx="${idx}">下载</button>
            </div>
        `).join('');

        list.querySelectorAll('.word-dl-single').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.idx);
                Utils.downloadDataURL(this.state.results[idx].dataUrl, this.state.results[idx].name);
            };
        });
    },

    _downloadSelected() {
        const checked = document.querySelectorAll('#word-download-list .word-dl-cb:checked');
        if (checked.length === 0) { Toast.warning('请至少选择一个文件'); return; }
        checked.forEach(cb => {
            const idx = parseInt(cb.dataset.idx);
            Utils.downloadDataURL(this.state.results[idx].dataUrl, this.state.results[idx].name);
        });
    },

    async _downloadAllAsZip() {
        if (this.state.results.length === 0) { Toast.warning('没有可下载的文件'); return; }
        Loading.show('正在打包...');
        try {
            const zip = new JSZip();
            for (const r of this.state.results) {
                const resp = await fetch(r.dataUrl);
                const blob = await resp.blob();
                zip.file(r.name, blob);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            Loading.hide();
            Utils.downloadBlob(content, 'word_results.zip');
            Toast.success('打包下载完成');
        } catch (err) {
            Loading.hide();
            Toast.error('打包失败: ' + err.message);
        }
    },
};
