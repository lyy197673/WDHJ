// ===== Homepage Module =====

const Homepage = {
    render(container) {
        container.innerHTML = `
            <div class="homepage-hero">
                <h2>文档工具箱</h2>
                <p>纯本地浏览器处理文档，隐私安全，快速便捷。无广告、全免费，上传不限速、下载不卡顿</p>
                <div class="homepage-badges">
                    <span class="badge">🔒 本地处理</span>
                    <span class="badge">⚡ 高效快捷</span>
                    <span class="badge">🎯 极速构建</span>
                    <span class="badge">📱 多端适配</span>
                </div>
            </div>
            <div class="tool-grid" id="tool-grid"></div>
        `;

        const grid = document.getElementById('tool-grid');
        const tools = [
            {
                id: 'image',
                icon: '🖼️',
                iconClass: 'image',
                title: '图片工具',
                desc: '拼图 · 裁剪 · 压缩 · 转换 · 像素调整 · 水印添加',
                route: '#/image'
            },
            {
                id: 'pdf',
                icon: '📄',
                iconClass: 'pdf',
                title: 'PDF工具',
                desc: '转换 · 拆分 · 合并 · 压缩',
                route: '#/pdf'
            },
            {
                id: 'ppt',
                icon: '📊',
                iconClass: 'ppt',
                title: 'PPT工具',
                desc: '拆分 · 转换 · 压缩',
                route: '#/ppt'
            },



        ];

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
    }
};
