// ===== Homepage Module =====

const Homepage = {
    _getDefaultHero() {
        return {
            title: '文档工具箱',
            desc: '纯本地浏览器处理文档，隐私安全，快速便捷。无广告、全免费，上传不限速、下载不卡顿',
            badges: [
                { icon: '🔒', text: '本地处理' },
                { icon: '⚡', text: '高效快捷' },
                { icon: '🎯', text: '极速构建' },
                { icon: '📱', text: '多端适配' },
            ]
        };
    },

    _getDefaultTools() {
        return [
            { id: 'image', icon: '🖼️', iconClass: 'image', title: '图片工具', desc: '拼图 · 裁剪 · 压缩 · 转换 · 像素调整 · 水印添加', route: '#/image' },
            { id: 'pdf', icon: '📄', iconClass: 'pdf', title: 'PDF工具', desc: '转换 · 拆分 · 合并 · 压缩', route: '#/pdf' },
            { id: 'ppt', icon: '📊', iconClass: 'ppt', title: 'PPT工具', desc: '拆分 · 转换 · 压缩', route: '#/ppt' },
            { id: 'stamp', icon: '🔏', iconClass: 'stamp', title: '盖章工具', desc: '自定义印章 · 图片/PDF盖章 · 混合模式 · 批量导出', route: '#/stamp' },
            { id: 'beads', icon: '🧶', iconClass: 'beads', title: '拼豆图纸', desc: '图片转拼豆 · Artkal色板 · 自由绘制 · 高清导出', route: '#/beads' },
            { id: 'word', icon: '📝', iconClass: 'word', title: 'Word工具', desc: '图片转Word · Word转图片 · 转PDF', route: '#/word' },
            { id: 'fbx-viewer', icon: '🧊', iconClass: 'fbx', title: 'FBX查看器', desc: '3D模型预览 · 部件编辑 · 动画播放 · 截图导出', route: '#/fbx-viewer' },
        ];
    },

    _getDefaultSites() {
        return {
            title: '推荐网站',
            subtitle: '一些站长在用的宝藏网站，纯免费，放心使用',
            categories: (typeof SITE_LINKS !== 'undefined') ? SITE_LINKS : []
        };
    },

    _loadHero() {
        if (typeof HOMEPAGE_DATA !== 'undefined' && HOMEPAGE_DATA.hero) return HOMEPAGE_DATA.hero;
        try {
            const raw = localStorage.getItem('editor_hero');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return this._getDefaultHero();
    },

    _loadTools() {
        if (typeof HOMEPAGE_DATA !== 'undefined' && HOMEPAGE_DATA.tools) return HOMEPAGE_DATA.tools;
        try {
            const raw = localStorage.getItem('editor_tools');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return this._getDefaultTools();
    },

    _loadSites() {
        if (typeof HOMEPAGE_DATA !== 'undefined' && HOMEPAGE_DATA.hero) {
            const defaultSites = this._getDefaultSites();
            return {
                title: defaultSites.title,
                subtitle: defaultSites.subtitle,
                categories: (typeof SITE_LINKS !== 'undefined') ? SITE_LINKS : defaultSites.categories
            };
        }
        try {
            const raw = localStorage.getItem('editor_sites');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return this._getDefaultSites();
    },

    _loadAnnounce() {
        return null;
    },

    render(container) {
        const hero = this._loadHero();
        const tools = this._loadTools();
        const sites = this._loadSites();

        const badgesHtml = hero.badges.map(b =>
            `<span class="badge">${b.icon} ${b.text}</span>`
        ).join('');

        container.innerHTML = `
            <div class="homepage-hero">
                <h2>${hero.title}</h2>
                <p>${hero.desc}</p>
                <div class="homepage-badges">${badgesHtml}</div>
            </div>
            <div class="tool-grid" id="tool-grid"></div>
            <div id="site-links-section"></div>
        `;

        const grid = document.getElementById('tool-grid');
        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.onclick = () => { window.location.hash = tool.route.slice(1); };
            card.innerHTML = `
                <div class="tool-card-icon ${tool.iconClass}">${tool.icon}</div>
                <h3>${tool.title}</h3>
                <p>${tool.desc}</p>
                <div class="tool-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
            `;
            grid.appendChild(card);
        });

        // Render recommended sites
        if (sites.categories && sites.categories.length) {
            this._renderSiteLinks(document.getElementById('site-links-section'), sites);
        }
    },

    _renderSiteLinks(container, sites) {
        let html = `<div class="site-links-section"><h3 class="site-links-title">${sites.title}</h3><p class="site-links-subtitle">${sites.subtitle}</p>`;

        sites.categories.forEach(group => {
            html += `
                <div class="site-links-group">
                    <h4 class="site-links-group-title">${group.icon} ${group.category}</h4>
                    <div class="site-links-grid">
            `;
            group.items.forEach(item => {
                html += `
                    <a class="site-link-card" href="${item.url}" target="_blank" rel="noopener noreferrer">
                        <div class="site-link-tooltip">${item.desc}</div>
                        <span class="site-link-icon">${item.icon || '🔗'}</span>
                        <div class="site-link-info">
                            <span class="site-link-name">${item.name}</span>
                            <span class="site-link-desc">${item.desc}</span>
                        </div>
                        <svg class="site-link-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </a>
                `;
            });
            html += '</div></div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }
};
