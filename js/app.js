// ===== App Router & Main Entry =====

const App = {
    currentRoute: null,

    init() {
        window.addEventListener('hashchange', () => this.route());
        this.route();

        // Back button
        document.getElementById('btn-back').onclick = () => {
            window.location.hash = '';
        };
    },

    _initialLoad: true,

    async route() {
        const hash = window.location.hash.slice(1) || '/';
        const content = document.getElementById('app-content');
        const backBtn = document.getElementById('btn-back');
        const title = document.getElementById('app-title');

        const parts = hash.split('/').filter(Boolean);
        const section = parts[0] || '';
        const sub = parts[1] || '';

        if (section) {
            backBtn.classList.remove('hidden');
        } else {
            backBtn.classList.add('hidden');
        }

        const isFirst = this._initialLoad;
        this._initialLoad = false;

        // Cleanup previous module
        if (!isFirst && this._currentSection === 'fbx-viewer' && typeof FBXViewer !== 'undefined') {
            FBXViewer.dispose();
        }
        this._currentSection = section;

        // Exit animation (skip on first load)
        if (!isFirst) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(6px) scale(0.99)';
            await new Promise(r => setTimeout(r, 80));
        }

        // Clear and scroll
        content.innerHTML = '';
        content.scrollTop = 0;
        window.scrollTo(0, 0);
        content.style.transform = '';

        switch (section) {
            case 'image':
                title.textContent = '图片工具';
                ImageTools.render(content, sub || 'collage');
                break;
            case 'pdf':
                title.textContent = 'PDF工具';
                PDFTools.render(content, sub || 'convert');
                break;
            case 'ppt':
                title.textContent = 'PPT工具';
                PPTTools.render(content, sub || 'split');
                break;
            case 'fbx-viewer':
                title.textContent = 'FBX模型查看器';
                await this._loadFBXViewer(content, sub || '');
                break;

            default:
                title.textContent = '刘桑出品';
                Homepage.render(content);
                break;
        }

        // Fade in
        if (isFirst) {
            // First load: cards have their own staggered animations
            content.style.opacity = '1';
        } else {
            // Subsequent: double rAF ensures exit state was painted before fade-in
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    content.style.opacity = '1';
                });
            });
        }
    },

    async _loadFBXViewer(content, sub) {
        // If dependencies are still loading (async import from CDN), wait for them
        if (!window._fbxViewerReady && window._fbxViewerPromise) {
            content.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;">
                    <div class="spinner"></div>
                    <p style="color:var(--text-secondary);font-size:14px;">正在加载 3D 引擎...</p>
                </div>
            `;
            content.style.opacity = '1';
            await window._fbxViewerPromise;
            // Clear loading indicator
            content.innerHTML = '';
        }

        if (window._fbxViewerError) {
            content.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;">
                    <p style="color:var(--danger);font-size:16px;">⚠ 3D 引擎加载失败</p>
                    <p style="color:var(--text-muted);font-size:13px;">${window._fbxViewerError.message || 'CDN 连接失败'}</p>
                    <button class="btn btn-sm" onclick="location.reload()">刷新重试</button>
                </div>
            `;
            content.style.opacity = '1';
            return;
        }

        try {
            FBXViewer.render(content, sub);
        } catch (err) {
            console.error('FBXViewer render error:', err);
            content.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;">
                    <p style="color:var(--danger);font-size:16px;">⚠ 渲染失败</p>
                    <p style="color:var(--text-muted);font-size:13px;">${err.message || '未知错误'}</p>
                    <button class="btn btn-sm" onclick="location.reload()">刷新重试</button>
                </div>
            `;
            content.style.opacity = '1';
        }
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
