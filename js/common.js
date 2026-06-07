// ===== Common Utilities =====

const Utils = {
    // Format file size
    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Generate unique ID
    uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // Read file as ArrayBuffer
    readAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    // Read file as DataURL
    readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Read file as Text
    readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },

    // Load image from src
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },

    // Download a blob
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Download a data URL
    downloadDataURL(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    // Get file extension
    getExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    },

    // Get base name without extension
    getBaseName(filename) {
        const parts = filename.split('.');
        parts.pop();
        return parts.join('.');
    },

    // Check if file is image
    isImage(file) {
        return file.type.startsWith('image/');
    },

    // Check if file is PDF
    isPDF(file) {
        return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    },

    // Validate file type
    validateFileType(file, allowedTypes) {
        const ext = this.getExtension(file.name);
        return allowedTypes.includes(ext) || allowedTypes.includes(file.type);
    },

    // Sleep helper
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Clamp value
    clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    },

    // Image to canvas
    imageToCanvas(img, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width || img.naturalWidth;
        canvas.height = height || img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas;
    },

    // Canvas to blob
    canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
        return new Promise(resolve => canvas.toBlob(resolve, type, quality));
    },

    // Create thumbnail from image file
    async createThumbnail(file, maxSize = 200) {
        const dataUrl = await this.readAsDataURL(file);
        const img = await this.loadImage(dataUrl);
        const ratio = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
        const w = Math.round(img.naturalWidth * ratio);
        const h = Math.round(img.naturalHeight * ratio);
        const canvas = this.imageToCanvas(img, w, h);
        return canvas.toDataURL('image/jpeg', 0.7);
    },

    // Sortable helper - make list draggable
    makeSortable(container, onReorder) {
        let dragEl = null;
        let placeholder = null;

        container.addEventListener('dragstart', e => {
            if (!e.target.closest('.sortable-item')) return;
            dragEl = e.target.closest('.sortable-item');
            dragEl.style.opacity = '0.4';
            e.dataTransfer.effectAllowed = 'move';
        });

        container.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target.closest('.sortable-item');
            if (target && target !== dragEl) {
                const rect = target.getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (e.clientY < mid) {
                    container.insertBefore(dragEl, target);
                } else {
                    container.insertBefore(dragEl, target.nextSibling);
                }
            }
        });

        container.addEventListener('dragend', e => {
            if (dragEl) {
                dragEl.style.opacity = '';
                dragEl = null;
                if (onReorder) onReorder();
            }
        });
    }
};

// ===== Toast System =====
const Toast = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = '0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error', 5000); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};

// ===== Loading Overlay =====
const Loading = {
    _el: null,

    show(text = '处理中...') {
        if (this._el) return;
        this._el = document.createElement('div');
        this._el.className = 'loading-overlay';
        this._el.innerHTML = `
            <div class="spinner"></div>
            <p style="font-size:14px;color:var(--text-secondary)">${text}</p>
            <div class="progress-bar" style="width:200px;display:none" id="loading-progress">
                <div class="progress-bar-fill" id="loading-progress-fill" style="width:0%"></div>
            </div>
        `;
        document.body.appendChild(this._el);
    },

    progress(percent) {
        const bar = document.getElementById('loading-progress');
        const fill = document.getElementById('loading-progress-fill');
        if (bar && fill) {
            bar.style.display = 'block';
            fill.style.width = percent + '%';
        }
    },

    setText(text) {
        if (this._el) {
            this._el.querySelector('p').textContent = text;
        }
    },

    hide() {
        if (this._el) {
            this._el.remove();
            this._el = null;
        }
    }
};

// ===== Lightbox =====
const Lightbox = {
    _images: [],
    _index: 0,

    init() {
        const lightbox = document.getElementById('lightbox');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');

        closeBtn.onclick = () => this.close();
        prevBtn.onclick = () => this.prev();
        nextBtn.onclick = () => this.next();

        lightbox.onclick = e => {
            if (e.target === lightbox) this.close();
        };

        document.addEventListener('keydown', e => {
            if (lightbox.classList.contains('hidden')) return;
            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });
    },

    open(images, index = 0) {
        this._images = images;
        this._index = index;
        this._render();
        document.getElementById('lightbox').classList.remove('hidden');
    },

    close() {
        document.getElementById('lightbox').classList.add('hidden');
    },

    prev() {
        this._index = (this._index - 1 + this._images.length) % this._images.length;
        this._render();
    },

    next() {
        this._index = (this._index + 1) % this._images.length;
        this._render();
    },

    _render() {
        const img = document.getElementById('lightbox-img');
        const counter = document.getElementById('lightbox-counter');
        img.src = this._images[this._index];
        counter.textContent = `${this._index + 1} / ${this._images.length}`;
    }
};

// ===== File Upload Helper =====
const FileUpload = {
    createUploadArea(container, options = {}) {
        const {
            accept = '*',
            multiple = true,
            onFiles = () => {},
            hint = '支持拖拽或点击上传'
        } = options;

        const area = document.createElement('div');
        area.className = 'upload-area';
        area.innerHTML = `
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>点击或拖拽文件到此处上传</p>
            <p class="upload-hint">${hint}</p>
        `;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.multiple = multiple;
        input.style.display = 'none';

        area.onclick = () => input.click();

        input.onchange = () => {
            if (input.files.length > 0) {
                onFiles(Array.from(input.files));
                input.value = '';
            }
        };

        area.addEventListener('dragover', e => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', e => {
            e.preventDefault();
            area.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                onFiles(files);
            }
        });

        container.appendChild(area);
        container.appendChild(input);

        return { area, input };
    }
};

// ===== Selection Manager =====
class SelectionManager {
    constructor() {
        this.items = [];
        this.selectedIds = new Set();
        this.onChange = null;
    }

    setItems(items) {
        this.items = items;
        this.selectedIds = new Set(items.map(i => i.id));
    }

    toggle(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        if (this.onChange) this.onChange();
    }

    selectAll() {
        this.selectedIds = new Set(this.items.map(i => i.id));
        if (this.onChange) this.onChange();
    }

    deselectAll() {
        this.selectedIds.clear();
        if (this.onChange) this.onChange();
    }

    invertSelection() {
        const newSet = new Set();
        this.items.forEach(i => {
            if (!this.selectedIds.has(i.id)) newSet.add(i.id);
        });
        this.selectedIds = newSet;
        if (this.onChange) this.onChange();
    }

    getSelected() {
        return this.items.filter(i => this.selectedIds.has(i.id));
    }

    isSelected(id) {
        return this.selectedIds.has(id);
    }

    get count() {
        return this.selectedIds.size;
    }

    get total() {
        return this.items.length;
    }
}

// ===== Batch Download Helper =====
async function batchDownload(files, zipName) {
    if (files.length === 0) {
        Toast.warning('没有可下载的文件');
        return;
    }

    if (files.length === 1) {
        Utils.downloadBlob(files[0].blob, files[0].name);
        Toast.success('下载完成');
        return;
    }

    Loading.show('正在打包下载...');
    const zip = new JSZip();

    files.forEach((f, i) => {
        zip.file(f.name, f.blob);
        Loading.progress(Math.round((i + 1) / files.length * 80));
    });

    Loading.setText('正在生成ZIP文件...');
    const blob = await zip.generateAsync({ type: 'blob' });
    Loading.hide();

    const name = zipName || `批量导出_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.zip`;
    Utils.downloadBlob(blob, name);
    Toast.success(`已打包下载 ${files.length} 个文件`);
}

// ===== Global Drag & Drop =====
function initGlobalDragDrop() {
    const overlay = document.getElementById('drag-overlay');
    let dragCounter = 0;

    document.addEventListener('dragenter', e => {
        e.preventDefault();
        dragCounter++;
        overlay.classList.remove('hidden');
    });

    document.addEventListener('dragleave', e => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            overlay.classList.add('hidden');
        }
    });

    document.addEventListener('dragover', e => {
        e.preventDefault();
    });

    document.addEventListener('drop', e => {
        e.preventDefault();
        dragCounter = 0;
        overlay.classList.add('hidden');
        // Global drop handled by individual upload areas
    });
}

// ===== Smooth Tab Content Switch =====
// Slides content left or right depending on tab direction, then cleans up.
// Pass the new tab index (0-based) so we know which way to slide.
function switchTabContent(container, newIndex, renderFn, duration = 220) {
    if (typeof container === 'string') container = document.querySelector(container);
    if (!container) return;

    const oldIndex = parseInt(container.dataset.tabIndex) || 0;
    container.dataset.tabIndex = newIndex;

    // Direction: moving to higher index → slide LEFT (new comes from right)
    const dir = newIndex > oldIndex ? 1 : -1;

    // Ensure container is positioned
    const prevPos = container.style.position;
    const prevOverflow = container.style.overflow;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // ---- Exit panel: wrap current children ----
    const exitPanel = document.createElement('div');
    exitPanel.style.cssText = 'position:relative;width:100%;';
    while (container.firstChild) {
        exitPanel.appendChild(container.firstChild);
    }
    container.appendChild(exitPanel);

    // ---- Enter panel: rendered off-screen ----
    const enterPanel = document.createElement('div');
    enterPanel.style.cssText = `
        position:absolute;top:0;left:0;width:100%;height:100%;
        transform:translateX(${dir * 100}%);
    `;
    container.appendChild(enterPanel);
    renderFn(enterPanel);

    // ---- Animate ----
    const easing = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
    exitPanel.style.transition = `transform ${duration}ms ${easing}`;
    enterPanel.style.transition = `transform ${duration}ms ${easing}`;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            exitPanel.style.transform = `translateX(${-dir * 40}%)`;
            exitPanel.style.opacity = '0';
            enterPanel.style.transform = 'translateX(0)';
        });
    });

    // ---- Cleanup ----
    setTimeout(() => {
        exitPanel.remove();
        // Unwrap enter panel children back into container
        while (enterPanel.firstChild) {
            container.appendChild(enterPanel.firstChild);
        }
        enterPanel.remove();
        container.style.position = prevPos;
        container.style.overflow = prevOverflow;
    }, duration + 60);
}

// ===== Theme Manager =====
const Theme = {
    _key: 'wdhj-theme',

    init() {
        const saved = localStorage.getItem(this._key) || 'dark';
        this.set(saved);
        this._setupToggle();
    },

    set(mode) {
        document.documentElement.setAttribute('data-theme', mode);
        localStorage.setItem(this._key, mode);
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        this.set(current === 'dark' ? 'light' : 'dark');
    },

    _setupToggle() {
        const btn = document.getElementById('btn-theme');
        if (!btn) return;
        btn.onclick = () => this.toggle();
        // Update icon on change
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            btn.innerHTML = isDark
                ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
                : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
            btn.title = isDark ? '切换到亮色模式' : '切换到暗色模式';
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }
};

// ===== Splash Screen / Changelog Modal =====
const SplashScreen = {
    _key: 'wdhj-splash-dismissed',
    _version: 'v2.0',  // bump this when there are new updates to show

    init() {
        // Check if user previously chose "don't show again" for this version
        const dismissed = localStorage.getItem(this._key);
        if (dismissed === this._version) {
            return; // User already dismissed this version
        }

        // Show splash after a short delay (let other UI settle)
        setTimeout(() => this._show(), 300);
    },

    _show() {
        const overlay = document.getElementById('splash-overlay');
        if (!overlay) return;

        overlay.classList.remove('hidden');

        // Close button handler
        const closeBtn = document.getElementById('splash-close-btn');
        const checkbox = document.getElementById('splash-dont-show');

        const close = () => {
            if (checkbox && checkbox.checked) {
                localStorage.setItem(this._key, this._version);
            }

            overlay.classList.add('closing');
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('closing');
            }, 250);
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }

        // Click backdrop to close
        const backdrop = overlay.querySelector('.splash-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', close);
        }

        // Escape key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
};

// ===== Footer Email Click Handler =====
function initFooterEmail() {
    const el = document.getElementById('footer-email');
    if (!el) return;

    const email = '3070646019@qq.com';
    const mailtoHref = `mailto:${email}?subject=${encodeURIComponent('文档工具合集-反馈')}`;

    el.addEventListener('click', (e) => {
        // Let the <a> tag handle the mailto: protocol
        const a = el.querySelector('a');
        if (!a) return;

        // Try to open mail client
        const opened = window.open(mailtoHref, '_self');

        // If mailto failed or was blocked, copy email to clipboard as fallback
        setTimeout(() => {
            if (document.hidden === false) {
                // mailto may have been blocked; copy to clipboard
                navigator.clipboard?.writeText(email).then(() => {
                    Toast.info('📋 邮箱地址已复制到剪贴板，请手动发送邮件');
                }).catch(() => {
                    Toast.info(`📧 请手动发送邮件至：${email}`);
                });
            }
        }, 800);
    });
}

// Initialize lightbox, global drag, theme, splash screen, email, and particles on load
document.addEventListener('DOMContentLoaded', () => {
    Lightbox.init();
    initGlobalDragDrop();
    Theme.init();
    SplashScreen.init();
    initFooterEmail();
    Particles.init();
});
