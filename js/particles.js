// ===== Particle Constellation Background =====
const Particles = {
    canvas: null,
    ctx: null,
    particles: [],
    orbs: [],
    mouse: { x: -9999, y: -9999, px: -9999, py: -9999 },
    mouseOnCard: false,
    animId: null,
    time: 0,

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particles-canvas';
        this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
        document.body.prepend(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.applyColors();
        this.spawn();
        this.spawnOrbs();
        this.bindEvents();
        this.loop();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    applyColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        this.isDark = isDark;
        if (isDark) {
            this.particleColors = ['#c084fc', '#818cf8', '#22d3ee', '#f0abfc', '#38bdf8', '#a78bfa', '#f472b6'];
            this.lineColor = [168, 132, 252];
            this.lineAlpha = 0.25;
            this.orbColors = ['rgba(139,92,246,0.06)', 'rgba(34,211,238,0.05)', 'rgba(244,114,182,0.04)'];
            this.mouseHaloColor = 'rgba(168, 132, 252, 0.10)';
            this.mouseHaloMid = 'rgba(168, 132, 252, 0.04)';
            this.glowOuter = 'aa';
            this.glowInner = '33';
            this.tendrilAlpha = 0.45;
            this.lineSat = 80;
            this.lineLit = 72;
        } else {
            this.particleColors = ['#818cf8', '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fbbf24'];
            this.lineColor = [99, 102, 241];
            this.lineAlpha = 0.12;
            this.orbColors = ['rgba(99,102,241,0.035)', 'rgba(52,211,153,0.03)', 'rgba(244,114,182,0.025)'];
            this.mouseHaloColor = 'rgba(99, 102, 241, 0.06)';
            this.mouseHaloMid = 'rgba(99, 102, 241, 0.02)';
            this.glowOuter = '66';
            this.glowInner = '22';
            this.tendrilAlpha = 0.30;
            this.lineSat = 65;
            this.lineLit = 68;
        }
    },

    spawn() {
        this.particles = [];
        const count = Math.min(140, Math.floor((this.canvas.width * this.canvas.height) / 12000));
        for (let i = 0; i < count; i++) {
            this.particles.push(this._makeParticle());
        }
    },

    _makeParticle(x, y) {
        return {
            x: x !== undefined ? x : Math.random() * this.canvas.width,
            y: y !== undefined ? y : Math.random() * this.canvas.height,
            angle: Math.random() * Math.PI * 2,
            speed: 0.04 + Math.random() * 0.12,
            phase: Math.random() * Math.PI * 2,
            wanderStrength: 0.0006 + Math.random() * 0.002,
            r: Math.random() * 2.5 + 0.8,
            color: this.particleColors[Math.floor(Math.random() * this.particleColors.length)],
            hueShift: Math.random() * 0.3,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.5 + Math.random() * 2,
        };
    },

    spawnOrbs() {
        this.orbs = [];
        for (let i = 0; i < 3; i++) {
            this.orbs.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15,
                r: 80 + Math.random() * 120,
                color: this.orbColors[i % this.orbColors.length],
                phase: Math.random() * Math.PI * 2,
            });
        }
    },

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.spawn();
            this.spawnOrbs();
        });

        document.addEventListener('mousemove', e => {
            this.mouse.px = this.mouse.x;
            this.mouse.py = this.mouse.y;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouseOnCard = !!e.target.closest('.tool-card');
        });

        document.addEventListener('mouseleave', () => {
            this.mouse.x = -9999;
            this.mouse.y = -9999;
        });

        const observer = new MutationObserver(() => {
            this.applyColors();
            for (const p of this.particles) {
                p.color = this.particleColors[Math.floor(Math.random() * this.particleColors.length)];
            }
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    },

    loop() {
        this.animId = requestAnimationFrame(() => this.loop());
        this.time += 0.016;
        this.updateOrbs();
        this.update();
        this.draw();
    },

    updateOrbs() {
        const { canvas, time } = this;
        for (const o of this.orbs) {
            o.x += o.vx + Math.sin(time * 0.3 + o.phase) * 0.2;
            o.y += o.vy + Math.cos(time * 0.25 + o.phase) * 0.2;
            if (o.x < -o.r) o.x = canvas.width + o.r;
            if (o.x > canvas.width + o.r) o.x = -o.r;
            if (o.y < -o.r) o.y = canvas.height + o.r;
            if (o.y > canvas.height + o.r) o.y = -o.r;
        }
    },

    update() {
        const { particles, mouse, canvas, time } = this;

        for (const p of particles) {
            p.angle += Math.sin(time * 1.3 + p.phase) * p.wanderStrength;
            if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;
            if (p.angle < 0) p.angle += Math.PI * 2;

            p.vx = Math.cos(p.angle) * p.speed;
            p.vy = Math.sin(p.angle) * p.speed;

            const flowX = Math.sin(time * 0.2 + p.y * 0.003) * 0.08;
            const flowY = Math.cos(time * 0.18 + p.x * 0.003) * 0.08;
            p.vx += flowX;
            p.vy += flowY;

            if (!this.mouseOnCard && mouse.x > -9000) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 280 && dist > 1) {
                    const t = 1 - dist / 280;
                    const pull = t * t * 0.15;
                    p.vx += (dx / dist) * pull;
                    p.vy += (dy / dist) * pull;
                    p.x += dx * t * 0.025;
                    p.y += dy * t * 0.025;
                }
                // Spin around mouse when close
                if (dist < 180 && dist > 10) {
                    const spin = 0.003 * (1 - dist / 180);
                    p.vx += -dy * spin;
                    p.vy += dx * spin;
                }
            }

            p.x += p.vx;
            p.y += p.vy;

            const margin = 30;
            if (p.x < -margin) p.x = canvas.width + margin;
            if (p.x > canvas.width + margin) p.x = -margin;
            if (p.y < -margin) p.y = canvas.height + margin;
            if (p.y > canvas.height + margin) p.y = -margin;

            const spd = Math.hypot(p.vx, p.vy);
            if (spd > 1.8) {
                p.vx = (p.vx / spd) * 1.8;
                p.vy = (p.vy / spd) * 1.8;
            }
        }
    },

    draw() {
        const { ctx, canvas, particles, mouse } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const [lr, lg, lb] = this.lineColor;
        const mouseActive = !this.mouseOnCard && mouse.x > -9000;
        const time = this.time;

        // ---- Background orbs (bokeh) ----
        for (const o of this.orbs) {
            const pulse = 1 + Math.sin(time * 0.5 + o.phase) * 0.3;
            const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * pulse);
            g.addColorStop(0, o.color);
            g.addColorStop(1, 'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r * pulse, 0, Math.PI * 2);
            ctx.fill();
        }

        // ---- Mouse energy tendrils ----
        if (mouseActive) {
            const nearParticles = [];
            for (const p of particles) {
                const d = Math.hypot(mouse.x - p.x, mouse.y - p.y);
                if (d < 220) nearParticles.push({ p, d });
            }
            nearParticles.sort((a, b) => a.d - b.d);
            const top = nearParticles.slice(0, 12);
            for (const { p, d } of top) {
                const t = 1 - d / 220;
                const alpha = t * t * this.tendrilAlpha;
                const mx = (mouse.x + p.x) / 2 + Math.sin(time * 3 + p.phase) * 20 * t;
                const my = (mouse.y + p.y) / 2 + Math.cos(time * 2.5 + p.phase) * 20 * t;
                ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha})`;
                ctx.lineWidth = t * 2;
                ctx.beginPath();
                ctx.moveTo(mouse.x, mouse.y);
                ctx.quadraticCurveTo(mx, my, p.x, p.y);
                ctx.stroke();
            }
        }

        // ---- Constellation lines ----
        const connectDist = 140;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist < connectDist) {
                    let alpha = (1 - dist / connectDist) * this.lineAlpha;
                    if (mouseActive) {
                        const di = Math.hypot(mouse.x - particles[i].x, mouse.y - particles[i].y);
                        const dj = Math.hypot(mouse.x - particles[j].x, mouse.y - particles[j].y);
                        const nearMouse = 1 - Math.min(di, dj) / 280;
                        if (nearMouse > 0) alpha = Math.max(alpha, nearMouse * 0.55);
                    }
                    const hue = ((time * 20 + i * 3) % 360) | 0;
                    ctx.strokeStyle = `hsla(${hue}, ${this.lineSat}%, ${this.lineLit}%, ${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // ---- Particles with pulsing glow ----
        for (const p of particles) {
            const pulse = 1 + Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.4;
            const glowR = p.r * 5 * pulse;

            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
            glow.addColorStop(0, p.color + this.glowOuter);
            glow.addColorStop(0.3, p.color + this.glowInner);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
            ctx.fill();
        }

        // ---- Mouse halo ----
        if (mouseActive) {
            const haloPulse = 1 + Math.sin(time * 2) * 0.15;
            const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180 * haloPulse);
            halo.addColorStop(0, this.mouseHaloColor);
            halo.addColorStop(0.5, this.mouseHaloMid);
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 180 * haloPulse, 0, Math.PI * 2);
            ctx.fill();

            // Mouse cursor core glow
            const core = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 16);
            core.addColorStop(0, this.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(99,102,241,0.18)');
            core.addColorStop(1, 'transparent');
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
