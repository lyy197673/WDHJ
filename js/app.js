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

        // Exit animation (skip on first load)
        if (!isFirst) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(6px) scale(0.99)';
            await new Promise(r => setTimeout(r, 120));
        }

        // Clear and scroll
        content.innerHTML = '';
        content.scrollTop = 0;
        window.scrollTo(0, 0);
        content.style.transform = '';

        switch (section) {
            case 'image':
                ImageTools.render(content, sub || 'collage');
                break;
            case 'pdf':
                PDFTools.render(content, sub || 'convert');
                break;
            case 'ppt':
                PPTTools.render(content, sub || 'split');
                break;
            case 'stamp':
                StampTools.render(content, sub || '');
                break;
            case 'word':
                WordTools.render(content, sub || 'img2word');
                break;
            case 'doubao':
                DoubaoWatermark.render(content);
                break;

            default:
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
                content.style.opacity = '1';
            });
        }
    }
};

// Start app
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
