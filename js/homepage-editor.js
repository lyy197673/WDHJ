// ===== Homepage Editor =====

(function () {
    'use strict';

    // ---- Built-in Icons ----
    const ICON_LIST = [
        '📁','📂','📄','📊','📈','📉','📋','📌','📎','🔖',
        '🖼️','🎨','🖌️','📷','🎬','🎵','🎤','🎧','🎮','🎲',
        '💻','🖥️','⌨️','🖱️','🖨️','💿','💾','📀','📱','📲',
        '🔧','🔨','⚙️','🔩','🔗','🔑','🔒','🔓','🛡️','🏷️',
        '⭐','🌟','✨','💫','🔥','💡','🎯','🎲','🏆','🎪',
        '🌍','🌐','🗺️','📍','🏠','🏢','🏗️','🏭','🏥','🏫',
        '📦','📫','📮','🗳️','✅','❌','⭕','❓','❗','💭',
        '🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','❤️',
        '📦','🎁','🎉','🎊','🎈','🎀','🏷️','🛒','💰','💳',
        '🔤','🔠','🔡','🔢','🔣','🆎','🆑','🆘','⏰','⏳',
        '🆕','🆙','🆒','🆓','ℹ️','⚠️','🚫','💲','📶','🔌',
        '❄️','☀️','🌤️','🌈','⚡','💧','🌊','🔥','☁️','🌙',
        '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
        '👍','👎','👋','🤝','🙏','💪','👏','🙌','🤝','✋',
        '📅','📆','🗓️','📇','📈','📉','📊','🔍','🔎','🔭',
        '✈️','🚗','🚀','🛸','🚲','🚂','🏠','🏢','🏥','🏦',
    ];

    let _iconPickerCounter = 0;
    function createIconPicker(currentIcon, onSelect) {
        const id = 'icon-picker-' + (++_iconPickerCounter);
        const wrap = document.createElement('span');
        wrap.className = 'icon-picker-wrap';
        wrap.innerHTML = `
            <button class="icon-picker-btn" title="选择图标">${currentIcon || '📁'}</button>
            <div class="icon-picker-dropdown" id="${id}">
                <input type="text" class="icon-picker-search" placeholder="搜索图标...">
                <div class="icon-picker-grid"></div>
            </div>
        `;

        const btn = wrap.querySelector('.icon-picker-btn');
        const dropdown = wrap.querySelector('.icon-picker-dropdown');
        const grid = wrap.querySelector('.icon-picker-grid');
        const search = wrap.querySelector('.icon-picker-search');

        function renderGrid(filter) {
            grid.innerHTML = '';
            const f = (filter || '').toLowerCase();
            ICON_LIST.forEach(icon => {
                if (f && !icon.includes(f)) return;
                const item = document.createElement('button');
                item.className = 'icon-picker-item' + (icon === currentIcon ? ' selected' : '');
                item.textContent = icon;
                item.onclick = (e) => {
                    e.stopPropagation();
                    currentIcon = icon;
                    btn.textContent = icon;
                    grid.querySelectorAll('.icon-picker-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    dropdown.classList.remove('open');
                    onSelect(icon);
                };
                grid.appendChild(item);
            });
        }

        renderGrid('');

        search.oninput = () => renderGrid(search.value);

        btn.onclick = (e) => {
            e.stopPropagation();
            const wasOpen = dropdown.classList.contains('open');
            document.querySelectorAll('.icon-picker-dropdown').forEach(d => d.classList.remove('open'));
            if (!wasOpen) {
                const rect = btn.getBoundingClientRect();
                let top = rect.bottom + 6;
                let left = rect.left;
                if (left + 320 > window.innerWidth) left = window.innerWidth - 330;
                if (left < 10) left = 10;
                if (top + 260 > window.innerHeight) top = rect.top - 266;
                dropdown.style.top = top + 'px';
                dropdown.style.left = left + 'px';
                dropdown.classList.add('open');
                search.value = '';
                renderGrid('');
                search.focus();
            }
        };

        document.addEventListener('click', () => dropdown.classList.remove('open'));

        return wrap;
    }

    // ---- Default Changelog Data ----
    function getDefaultChangelog() {
        return {
            version: 'v2.1',
            date: '2026年6月11日',
            sections: [
                {
                    icon: '🆕', title: '新增功能', type: 'new',
                    items: [
                        { title: '盖章工具', desc: '支持导入自定义印章图片，在图片或 PDF 上自由放置印章。支持拖拽移动、旋转缩放、6 种混合模式（正片叠底、叠加等）、透明度调节，PDF 支持多页批量盖章，导出前可自定义文件名。' },
                        { title: '推荐网站', desc: '首页新增「推荐网站」板块，收录实用工具、AI 工具、设计资源、开发资源等常用站点，方便快速访问。' },
                    ]
                },
                {
                    icon: '🔧', title: '问题修复', type: 'fix',
                    items: [
                        { title: '盖章工具印章拖拽失效', desc: '修复了从印章库拖拽印章到画布时被全局拖放覆盖层拦截的问题，现在拖放放置正常工作。' },
                        { title: '印章库刷新丢失', desc: '修复了导入的印章在页面刷新后消失的问题，印章现在通过 localStorage 持久化存储，刷新不丢失。' },
                    ]
                },
                {
                    icon: '⚡', title: '优化改进', type: 'improve',
                    items: [
                        { title: '画布缩放体验', desc: '画布缩放改为 CSS Transform 架构，保留原始分辨率。支持鼠标滚轮以光标为中心缩放、工具栏一键适应窗口/1:1 重置、空白区域拖拽平移。' },
                        { title: '导出格式自由选择', desc: '无论底图是图片还是 PDF，导出时均可自由选择 PNG / JPG / PDF 三种格式，不再受限于输入类型。' },
                    ]
                }
            ]
        };
    }

    // ---- Data ----
    let changelogData = getDefaultChangelog();

    let heroData = {
        title: '文档工具箱',
        desc: '纯本地浏览器处理文档，隐私安全，快速便捷。无广告、全免费，上传不限速、下载不卡顿',
        badges: [
            { icon: '🔒', text: '本地处理' },
            { icon: '⚡', text: '高效快捷' },
            { icon: '🎯', text: '极速构建' },
            { icon: '📱', text: '多端适配' },
        ]
    };

    let toolsData = [
        { id: 'image', icon: '🖼️', iconClass: 'image', title: '图片工具', desc: '拼图 · 裁剪 · 压缩 · 转换 · 像素调整 · 水印添加', route: '#/image' },
        { id: 'pdf', icon: '📄', iconClass: 'pdf', title: 'PDF工具', desc: '转换 · 拆分 · 合并 · 压缩', route: '#/pdf' },
        { id: 'ppt', icon: '📊', iconClass: 'ppt', title: 'PPT工具', desc: '拆分 · 转换 · 压缩', route: '#/ppt' },
        { id: 'stamp', icon: '🔏', iconClass: 'stamp', title: '盖章工具', desc: '自定义印章 · 图片/PDF盖章 · 混合模式 · 批量导出', route: '#/stamp' },
        { id: 'fbx-viewer', icon: '🧊', iconClass: 'fbx', title: 'FBX查看器', desc: '3D模型预览 · 部件编辑 · 动画播放 · 截图导出', route: '#/fbx-viewer' },
    ];

    let sitesData = {
        title: '推荐网站',
        subtitle: '一些站长在用的宝藏网站，纯免费，放心使用',
        categories: (typeof SITE_LINKS !== 'undefined') ? JSON.parse(JSON.stringify(SITE_LINKS)) : []
    };

    // Track which cards are open across re-renders
    const _openCards = new Set();
    function _getCardId(prefix, idx) { return prefix + '_' + idx; }
    function _restoreOpenState(container, prefix) {
        container.querySelectorAll('.editor-card').forEach((card, i) => {
            if (_openCards.has(_getCardId(prefix, i))) {
                card.querySelector('.editor-card-body')?.classList.add('open');
            }
        });
    }
    function _bindToggleSave(card, prefix, idx) {
        const header = card.querySelector('.editor-card-header');
        if (!header) return;
        header.addEventListener('click', () => {
            const id = _getCardId(prefix, idx);
            if (card.querySelector('.editor-card-body')?.classList.contains('open')) {
                _openCards.add(id);
            } else {
                _openCards.delete(id);
            }
        });
    }

    // ---- Server Status ----
    let _serverConnected = false;
    let _disconnectOverlay = null;

    function setStatus(state, text) {
        const bar = document.getElementById('editor-status-bar');
        const label = document.getElementById('editor-status-text');
        if (!bar) return;
        bar.className = 'editor-status-bar ' + state;
        label.textContent = text;
    }

    function showDisconnectOverlay() {
        if (_disconnectOverlay) return;
        _disconnectOverlay = document.createElement('div');
        _disconnectOverlay.className = 'editor-disconnect-overlay';
        _disconnectOverlay.innerHTML = `
            <div class="editor-disconnect-card">
                <div class="editor-disconnect-icon">⚠️</div>
                <div class="editor-disconnect-title">服务器未连接</div>
                <div class="editor-disconnect-desc">请先启动保存服务器，编辑器才能正常保存文件。</div>
                <div class="editor-disconnect-cmd">
                    <code>node save-server.js</code>
                </div>
                <div class="editor-disconnect-hint">启动后将自动检测并关闭此提示</div>
                <div class="editor-disconnect-spinner"></div>
            </div>
        `;
        document.body.appendChild(_disconnectOverlay);
    }

    function hideDisconnectOverlay() {
        if (_disconnectOverlay) {
            _disconnectOverlay.classList.add('hiding');
            setTimeout(() => {
                _disconnectOverlay?.remove();
                _disconnectOverlay = null;
            }, 400);
        }
    }

    function checkServerConnection() {
        fetch('/editor.html', { method: 'HEAD', cache: 'no-store' }).then(r => {
            if (!_serverConnected) {
                _serverConnected = true;
                setStatus('connected', '服务器已连接');
                hideDisconnectOverlay();
            }
        }).catch(() => {
            if (_serverConnected) {
                _serverConnected = false;
                setStatus('disconnected', '服务器未运行');
                showDisconnectOverlay();
            } else if (document.getElementById('editor-status-text')?.textContent === '检查中...') {
                setStatus('disconnected', '服务器未运行');
                showDisconnectOverlay();
            }
        });
    }

    // ---- Init ----
    document.addEventListener('DOMContentLoaded', () => {
        loadFromStorage();
        renderChangelog();
        renderHero();
        renderTools();
        renderSites();
        bindNav();
        bindSaveBtn();
        checkServerConnection();
        setInterval(checkServerConnection, 8000);
    });

    // ---- Persistence ----
    function saveToStorage() {
        localStorage.setItem('editor_changelog', JSON.stringify(changelogData));
        localStorage.setItem('editor_hero', JSON.stringify(heroData));
        localStorage.setItem('editor_tools', JSON.stringify(toolsData));
        localStorage.setItem('editor_sites', JSON.stringify(sitesData));
    }

    function saveToServer() {
        const siteLinksContent = `// 推荐网站数据 — 由编辑器维护
// 格式: [{ category: '分类名', icon: '🎨', items: [{ name: '站名', desc: '描述', url: 'https://...', icon: '🔗' }] }]
const SITE_LINKS = ${JSON.stringify(sitesData.categories, null, 4)};
`;
        const homepageDataContent = `// 首页数据 — 由编辑器导出，请勿手动编辑
const HOMEPAGE_DATA = {
    hero: ${JSON.stringify(heroData, null, 4)},
    tools: ${JSON.stringify(toolsData, null, 4)},
    changelog: ${JSON.stringify(changelogData, null, 4)}
};
`;
        return Promise.all([
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: 'js/site-links.js', content: siteLinksContent })
            }),
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: 'js/homepage-data.js', content: homepageDataContent })
            })
        ]).then(([r1, r2]) => r1.ok && r2.ok).catch(() => false);
    }

    function loadFromStorage() {
        try {
            const c = localStorage.getItem('editor_changelog');
            if (c) changelogData = JSON.parse(c);
            const h = localStorage.getItem('editor_hero');
            if (h) heroData = JSON.parse(h);
            const t = localStorage.getItem('editor_tools');
            if (t) toolsData = JSON.parse(t);
            const s = localStorage.getItem('editor_sites');
            if (s) sitesData = JSON.parse(s);
        } catch (e) { /* ignore */ }
    }

    // ---- Navigation ----
    function bindNav() {
        document.querySelectorAll('.editor-nav-item').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.editor-nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const section = btn.dataset.section;
                document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
                document.querySelector(`.editor-section[data-section="${section}"]`).classList.add('active');
            };
        });
    }

    // ---- Save Button ----
    function bindSaveBtn() {
        document.getElementById('editor-save-btn').onclick = async () => {
            if (!_serverConnected) {
                showDisconnectOverlay();
                return;
            }
            autoGenVersionDate();
            saveToStorage();
            setStatus('saving', '保存中...');
            const ok = await saveToServer();
            if (ok) {
                setStatus('connected', '服务器已连接');
                showToast('保存成功，文件已更新，可直接提交到 GitHub');
            } else {
                setStatus('disconnected', '服务器未运行');
                showDisconnectOverlay();
                showToast('保存失败，服务器异常');
            }
        };
    }

    function autoGenVersionDate() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        changelogData.version = `v${month}.${day}.${hours}`;

        const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
        changelogData.date = `${now.getFullYear()}年${monthNames[now.getMonth()]}${now.getDate()}日`;

        const versionInput = document.getElementById('changelog-version');
        const dateInput = document.getElementById('changelog-date');
        if (versionInput) versionInput.value = changelogData.version;
        if (dateInput) dateInput.value = changelogData.date;
    }

    // ---- Changelog Editor ----
    function renderChangelog() {
        document.getElementById('changelog-version').value = changelogData.version;
        document.getElementById('changelog-date').value = changelogData.date;

        document.getElementById('changelog-version').oninput = (e) => { changelogData.version = e.target.value; };
        document.getElementById('changelog-date').oninput = (e) => { changelogData.date = e.target.value; };

        renderChangelogSections();

        document.getElementById('changelog-section-add').onclick = () => {
            changelogData.sections.push({
                icon: '📌',
                title: '新分类',
                type: 'new',
                items: []
            });
            renderChangelogSections();
        };
    }

    function renderChangelogSections() {
        const list = document.getElementById('changelog-sections-list');
        list.innerHTML = '';
        changelogData.sections.forEach((sec, si) => {
            const card = createChangelogSectionCard(sec, si);
            _bindToggleSave(card, 'cl', si);
            list.appendChild(card);
        });
        _restoreOpenState(list, 'cl');
    }

    function createChangelogSectionCard(sec, si) {
        const card = document.createElement('div');
        card.className = 'editor-card';

        // Build items container
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'editor-changelog-items';

        const itemsLabel = document.createElement('label');
        itemsLabel.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;';
        itemsLabel.innerHTML = '日志条目 <button class="btn btn-xs changelog-item-add">+ 添加条目</button>';
        itemsDiv.appendChild(itemsLabel);

        sec.items.forEach((item, ii) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'editor-changelog-item';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'editor-changelog-item-header';

            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.value = item.title;
            titleInput.placeholder = '标题';
            titleInput.className = 'editor-changelog-item-title';
            titleInput.oninput = () => { changelogData.sections[si].items[ii].title = titleInput.value; };

            const delBtn = document.createElement('button');
            delBtn.className = 'editor-card-btn delete changelog-item-del';
            delBtn.title = '删除';
            delBtn.innerHTML = '&times;';
            delBtn.onclick = () => { changelogData.sections[si].items.splice(ii, 1); renderChangelogSections(); };

            headerDiv.appendChild(titleInput);
            headerDiv.appendChild(delBtn);

            const descArea = document.createElement('textarea');
            descArea.placeholder = '描述...';
            descArea.rows = 2;
            descArea.className = 'editor-changelog-item-desc';
            descArea.value = item.desc;
            descArea.oninput = () => { changelogData.sections[si].items[ii].desc = descArea.value; };

            itemDiv.appendChild(headerDiv);
            itemDiv.appendChild(descArea);
            itemsDiv.appendChild(itemDiv);
        });

        const titleSpan = document.createElement('span');
        titleSpan.className = 'editor-card-title';
        titleSpan.textContent = sec.icon + ' ' + sec.title;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'editor-card-actions';
        actionsDiv.innerHTML = `
            <button class="editor-card-btn delete" title="删除分类">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
        `;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'editor-card-header';
        const dragSpan = document.createElement('span');
        dragSpan.className = 'editor-card-drag';
        dragSpan.textContent = '⠿';
        headerDiv.appendChild(dragSpan);
        headerDiv.appendChild(titleSpan);
        headerDiv.appendChild(actionsDiv);

        // Drag only from handle
        dragSpan.addEventListener('mousedown', () => { card.draggable = true; });
        card.addEventListener('dragend', () => { card.draggable = false; });

        headerDiv.addEventListener('click', (e) => {
            if (e.target.closest('.editor-card-btn')) return;
            bodyDiv.classList.toggle('open');
        });

        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'editor-card-body';

        // Icon + title row
        const iconRow = document.createElement('div');
        iconRow.className = 'editor-card-row';
        const iconLabel = document.createElement('div');
        iconLabel.innerHTML = '<label>图标</label>';
        const iconPicker = createIconPicker(sec.icon, (icon) => {
            changelogData.sections[si].icon = icon;
            titleSpan.textContent = icon + ' ' + changelogData.sections[si].title;
        });
        iconLabel.appendChild(iconPicker);
        const titleLabel = document.createElement('div');
        titleLabel.innerHTML = `<label>分类标题</label><input type="text" value="${sec.title}" data-field="title">`;
        iconRow.appendChild(iconLabel);
        iconRow.appendChild(titleLabel);

        // Type row
        const typeRow = document.createElement('div');
        typeRow.className = 'editor-card-row';
        const typeSelect = document.createElement('select');
        typeSelect.style.cssText = 'width:100%;padding:8px 10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font-size:13px;';
        ['new', 'fix', 'improve'].forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val === 'new' ? '新 (new)' : val === 'fix' ? '修复 (fix)' : '优化 (improve)';
            if (sec.type === val) opt.selected = true;
            typeSelect.appendChild(opt);
        });
        typeSelect.onchange = () => { changelogData.sections[si].type = typeSelect.value; };
        const typeLabel = document.createElement('div');
        typeLabel.innerHTML = '<label>类型</label>';
        typeLabel.appendChild(typeSelect);
        const typeEmpty = document.createElement('div');
        typeRow.appendChild(typeLabel);
        typeRow.appendChild(typeEmpty);

        bodyDiv.appendChild(iconRow);
        bodyDiv.appendChild(typeRow);
        bodyDiv.appendChild(itemsDiv);

        card.appendChild(headerDiv);
        card.appendChild(bodyDiv);

        // Delete section
        actionsDiv.querySelector('.delete').onclick = () => { changelogData.sections.splice(si, 1); renderChangelogSections(); };

        // Title field edit
        titleLabel.querySelector('input').oninput = (e) => {
            changelogData.sections[si].title = e.target.value;
            titleSpan.textContent = changelogData.sections[si].icon + ' ' + e.target.value;
        };

        // Add item button
        itemsLabel.querySelector('.changelog-item-add').onclick = () => {
            changelogData.sections[si].items.push({ title: '新条目', desc: '条目描述' });
            renderChangelogSections();
        };

        // Drag
        card.addEventListener('dragstart', (e) => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', si); });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
        card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('drag-over'); });
        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
        card.addEventListener('drop', (e) => {
            e.preventDefault(); card.classList.remove('drag-over');
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
            if (fromIdx !== si) {
                const item = changelogData.sections.splice(fromIdx, 1)[0];
                changelogData.sections.splice(si, 0, item);
                renderChangelogSections();
            }
        });

        return card;
    }

    // ---- Hero Editor ----
    function renderHero() {
        document.getElementById('hero-title').value = heroData.title;
        document.getElementById('hero-desc').value = heroData.desc;

        document.getElementById('hero-title').oninput = (e) => { heroData.title = e.target.value; };
        document.getElementById('hero-desc').oninput = (e) => { heroData.desc = e.target.value; };

        renderHeroBadges();

        document.getElementById('hero-badge-add').onclick = () => {
            heroData.badges.push({ icon: '✨', text: '新徽章' });
            renderHeroBadges();
        };
    }

    function renderHeroBadges() {
        const container = document.getElementById('hero-badges');
        container.innerHTML = '';
        heroData.badges.forEach((b, i) => {
            const tag = document.createElement('span');
            tag.className = 'editor-tag';

            const picker = createIconPicker(b.icon, (icon) => {
                heroData.badges[i].icon = icon;
            });

            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = b.text;
            textInput.style.cssText = 'width:80px;border:none;background:none;font-size:13px;padding:0;color:var(--text);';
            textInput.oninput = () => { heroData.badges[i].text = textInput.value; };

            const removeBtn = document.createElement('button');
            removeBtn.className = 'editor-tag-remove';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = () => { heroData.badges.splice(i, 1); renderHeroBadges(); };

            tag.appendChild(picker);
            tag.appendChild(textInput);
            tag.appendChild(removeBtn);
            container.appendChild(tag);
        });
    }

    // ---- Tools Editor ----
    function renderTools() {
        const list = document.getElementById('tools-list');
        list.innerHTML = '';
        toolsData.forEach((tool, i) => {
            const card = createToolCard(tool, i);
            _bindToggleSave(card, 'tool', i);
            list.appendChild(card);
        });
        _restoreOpenState(list, 'tool');

        document.getElementById('tool-add-btn').onclick = () => {
            toolsData.push({
                id: 'new-tool-' + Date.now(),
                icon: '🔧',
                iconClass: '',
                title: '新工具',
                desc: '工具描述',
                route: '#/new'
            });
            renderTools();
        };
    }

    function createToolCard(tool, index) {
        const card = document.createElement('div');
        card.className = 'editor-card';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'editor-card-title';
        titleSpan.textContent = tool.icon + ' ' + tool.title;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'editor-card-actions';
        actionsDiv.innerHTML = `
            <button class="editor-card-btn delete" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
        `;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'editor-card-header';
        const dragSpan = document.createElement('span');
        dragSpan.className = 'editor-card-drag';
        dragSpan.textContent = '⠿';
        headerDiv.appendChild(dragSpan);
        headerDiv.appendChild(titleSpan);
        headerDiv.appendChild(actionsDiv);

        // Drag only from handle
        dragSpan.addEventListener('mousedown', () => { card.draggable = true; });
        card.addEventListener('dragend', () => { card.draggable = false; });

        // Click header to toggle
        headerDiv.addEventListener('click', (e) => {
            if (e.target.closest('.editor-card-btn')) return;
            bodyDiv.classList.toggle('open');
        });

        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'editor-card-body';

        // Icon picker row
        const iconRow = document.createElement('div');
        iconRow.className = 'editor-card-row';
        const iconLabel = document.createElement('div');
        iconLabel.innerHTML = '<label>图标</label>';
        const iconPicker = createIconPicker(tool.icon, (icon) => {
            tool.icon = icon;
            titleSpan.textContent = tool.icon + ' ' + tool.title;
        });
        iconLabel.appendChild(iconPicker);
        const classField = document.createElement('div');
        classField.innerHTML = `<label>图标类名</label><input type="text" value="${tool.iconClass}" data-field="iconClass">`;
        iconRow.appendChild(iconLabel);
        iconRow.appendChild(classField);

        // Title & route row
        const titleRow = document.createElement('div');
        titleRow.className = 'editor-card-row';
        titleRow.innerHTML = `
            <div><label>标题</label><input type="text" value="${tool.title}" data-field="title"></div>
            <div><label>路由</label><input type="text" value="${tool.route}" data-field="route"></div>
        `;

        // Desc row
        const descRow = document.createElement('div');
        descRow.className = 'editor-card-row full';
        descRow.innerHTML = `<div><label>描述</label><input type="text" value="${tool.desc}" data-field="desc"></div>`;

        bodyDiv.appendChild(iconRow);
        bodyDiv.appendChild(titleRow);
        bodyDiv.appendChild(descRow);

        card.appendChild(headerDiv);
        card.appendChild(bodyDiv);

        // Delete
        actionsDiv.querySelector('.delete').onclick = () => { toolsData.splice(index, 1); renderTools(); };

        // Field edits
        bodyDiv.querySelectorAll('input').forEach(inp => {
            inp.oninput = () => {
                toolsData[index][inp.dataset.field] = inp.value;
                if (inp.dataset.field === 'title') {
                    titleSpan.textContent = toolsData[index].icon + ' ' + inp.value;
                }
            };
        });

        // Drag
        card.addEventListener('dragstart', (e) => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', index); });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
        card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('drag-over'); });
        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
        card.addEventListener('drop', (e) => {
            e.preventDefault(); card.classList.remove('drag-over');
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
            if (fromIdx !== index) {
                const item = toolsData.splice(fromIdx, 1)[0];
                toolsData.splice(index, 0, item);
                renderTools();
            }
        });

        return card;
    }

    // ---- Sites Editor ----
    function renderSites() {
        document.getElementById('sites-title').value = sitesData.title;
        document.getElementById('sites-subtitle').value = sitesData.subtitle;

        document.getElementById('sites-title').oninput = (e) => { sitesData.title = e.target.value; };
        document.getElementById('sites-subtitle').oninput = (e) => { sitesData.subtitle = e.target.value; };

        renderSiteCategories();

        document.getElementById('site-cat-add-btn').onclick = () => {
            sitesData.categories.push({ category: '新分类', icon: '📁', items: [] });
            renderSiteCategories();
        };
    }

    function renderSiteCategories() {
        const list = document.getElementById('sites-list');
        list.innerHTML = '';
        sitesData.categories.forEach((cat, ci) => {
            const card = createSiteCategoryCard(cat, ci);
            _bindToggleSave(card, 'site', ci);
            list.appendChild(card);
        });
        _restoreOpenState(list, 'site');
    }

    function createSiteCategoryCard(cat, catIdx) {
        const card = document.createElement('div');
        card.className = 'editor-card';

        let itemsHtml = '';
        cat.items.forEach((item, ii) => {
            itemsHtml += `
                <div class="editor-site-item">
                    <span class="site-item-icon">
                        <span class="site-item-icon-btn" data-ii="${ii}" title="选择图标" style="cursor:pointer;font-size:16px;">${item.icon || '🔗'}</span>
                    </span>
                    <input type="text" class="site-item-name" value="${item.name}" placeholder="站名" data-field="name" data-ii="${ii}">
                    <input type="text" class="site-item-desc" value="${item.desc}" placeholder="描述" data-field="desc" data-ii="${ii}">
                    <input type="text" class="site-item-url" value="${item.url}" placeholder="https://..." data-field="url" data-ii="${ii}">
                    <button class="editor-card-btn delete site-item-del" data-ii="${ii}" title="删除">&times;</button>
                </div>
            `;
        });

        const titleSpan = document.createElement('span');
        titleSpan.className = 'editor-card-title';
        titleSpan.textContent = cat.icon + ' ' + cat.category;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'editor-card-actions';
        actionsDiv.innerHTML = `
            <button class="editor-card-btn delete" title="删除分类">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
        `;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'editor-card-header';
        const dragSpan = document.createElement('span');
        dragSpan.className = 'editor-card-drag';
        dragSpan.textContent = '⠿';
        headerDiv.appendChild(dragSpan);
        headerDiv.appendChild(titleSpan);
        headerDiv.appendChild(actionsDiv);

        // Drag only from handle
        dragSpan.addEventListener('mousedown', () => { card.draggable = true; });
        card.addEventListener('dragend', () => { card.draggable = false; });

        headerDiv.addEventListener('click', (e) => {
            if (e.target.closest('.editor-card-btn')) return;
            bodyDiv.classList.toggle('open');
        });

        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'editor-card-body';

        // Category icon + name row
        const catRow = document.createElement('div');
        catRow.className = 'editor-card-row';
        const catIconLabel = document.createElement('div');
        catIconLabel.innerHTML = '<label>分类图标</label>';
        const catIconPicker = createIconPicker(cat.icon, (icon) => {
            sitesData.categories[catIdx].icon = icon;
            titleSpan.textContent = icon + ' ' + sitesData.categories[catIdx].category;
        });
        catIconLabel.appendChild(catIconPicker);
        const catNameLabel = document.createElement('div');
        catNameLabel.innerHTML = `<label>分类名称</label><input type="text" value="${cat.category}" data-field="category">`;
        catRow.appendChild(catIconLabel);
        catRow.appendChild(catNameLabel);

        // Items container
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'editor-site-items';
        itemsDiv.innerHTML = `
            <label style="font-size:12px;font-weight:600;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;">
                站点列表
                <button class="btn btn-xs site-item-add">+ 添加站点</button>
            </label>
            ${itemsHtml}
        `;

        bodyDiv.appendChild(catRow);
        bodyDiv.appendChild(itemsDiv);

        card.appendChild(headerDiv);
        card.appendChild(bodyDiv);

        // Delete category
        actionsDiv.querySelector('.delete').onclick = () => { sitesData.categories.splice(catIdx, 1); renderSiteCategories(); };

        // Category name edit
        catNameLabel.querySelector('input').oninput = (e) => {
            sitesData.categories[catIdx].category = e.target.value;
            titleSpan.textContent = sitesData.categories[catIdx].icon + ' ' + e.target.value;
        };

        // Site item field edits
        bodyDiv.querySelectorAll('.site-item-name, .site-item-desc, .site-item-url').forEach(inp => {
            inp.oninput = () => { sitesData.categories[catIdx].items[inp.dataset.ii][inp.dataset.field] = inp.value; };
        });

        // Site item icon pickers
        bodyDiv.querySelectorAll('.site-item-icon-btn').forEach(btn => {
            const ii = parseInt(btn.dataset.ii);
            const picker = createIconPicker(sitesData.categories[catIdx].items[ii].icon, (icon) => {
                sitesData.categories[catIdx].items[ii].icon = icon;
                btn.textContent = icon;
            });
            btn.replaceWith(picker);
        });

        // Delete site item
        bodyDiv.querySelectorAll('.site-item-del').forEach(btn => {
            btn.onclick = () => { sitesData.categories[catIdx].items.splice(parseInt(btn.dataset.ii), 1); renderSiteCategories(); };
        });

        // Add site item
        bodyDiv.querySelector('.site-item-add').onclick = () => {
            sitesData.categories[catIdx].items.push({ name: '新站点', desc: '站点描述', url: 'https://', icon: '🔗' });
            renderSiteCategories();
        };

        // Drag
        card.addEventListener('dragstart', (e) => { card.classList.add('dragging'); e.dataTransfer.setData('text/plain', catIdx); });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
        card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('drag-over'); });
        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
        card.addEventListener('drop', (e) => {
            e.preventDefault(); card.classList.remove('drag-over');
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
            if (fromIdx !== catIdx) {
                const item = sitesData.categories.splice(fromIdx, 1)[0];
                sitesData.categories.splice(catIdx, 0, item);
                renderSiteCategories();
            }
        });

        return card;
    }

    // ---- Toast ----
    function showToast(msg) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);animation:editorFadeIn 0.2s ease;';

        const popup = document.createElement('div');
        popup.style.cssText = 'background:var(--bg-card-solid);border:1px solid var(--border);border-radius:16px;padding:28px 36px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4);animation:editorPopIn 0.3s cubic-bezier(0.34,1.56,0.64,1);';

        const icon = document.createElement('div');
        icon.style.cssText = 'width:52px;height:52px;border-radius:50%;background:var(--success);color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:24px;';
        icon.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';

        const text = document.createElement('div');
        text.style.cssText = 'font-size:15px;font-weight:600;color:var(--text);';
        text.textContent = msg;

        popup.appendChild(icon);
        popup.appendChild(text);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.animation = 'editorFadeOut 0.25s ease forwards';
            popup.style.animation = 'editorPopOut 0.25s ease forwards';
            setTimeout(() => overlay.remove(), 300);
        }, 1500);
    }

})();
