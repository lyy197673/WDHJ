// ===== Particle Constellation Background =====
const Particles = {
    canvas: null,
    ctx: null,
    particles: [],
    mouse: { x: -9999, y: -9999 },
    mouseOnCard: false,
    animId: null,
    count: 75,
    connectDist: 150,
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
        this.bindEvents();
        this.loop();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    applyColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            this.particleColors = ['#6366f1', '#818cf8', '#22d3ee', '#a78bfa', '#38bdf8'];
            this.lineColor = [99, 102, 241];
            this.lineAlpha = 0.2;
            this.mouseHaloColor = 'rgba(99, 102, 241, 0.12)';
        } else {
            this.particleColors = ['#f59e0b', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];
            this.lineColor = [139, 92, 246];
            this.lineAlpha = 0.14;
            this.mouseHaloColor = 'rgba(139, 92, 246, 0.08)';
        }
    },

    spawn() {
        this.particles = [];
        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                angle: Math.random() * Math.PI * 2,
                speed: 0.06 + Math.random() * 0.1,
                phase: Math.random() * Math.PI * 2,
                wanderStrength: 0.0008 + Math.random() * 0.0015,
                r: Math.random() * 2.2 + 1,
                color: this.particleColors[Math.floor(Math.random() * this.particleColors.length)],
            });
        }
    },

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.spawn();
        });

        // Mouse tracking
        document.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            // Check if mouse is over a card
            this.mouseOnCard = !!e.target.closest('.tool-card');
        });

        document.addEventListener('mouseleave', () => {
            this.mouse.x = -9999;
            this.mouse.y = -9999;
        });

        // Theme changes
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
        this.update();
        this.draw();
    },

    update() {
        const { particles, mouse, canvas, time } = this;

        for (const p of particles) {
            // ---- Organic flow ----
            // Wander: angle drifts smoothly using sin/cos of time + phase
            p.angle += Math.sin(time * 1.3 + p.phase) * p.wanderStrength;
            // Keep angle bounded
            if (p.angle > Math.PI * 2) p.angle -= Math.PI * 2;
            if (p.angle < 0) p.angle += Math.PI * 2;

            // Base velocity from angle
            p.vx = Math.cos(p.angle) * p.speed;
            p.vy = Math.sin(p.angle) * p.speed;

            // Add global flow current (very slow drift)
            const flowX = Math.sin(time * 0.25 + p.y * 0.002) * 0.06;
            const flowY = Math.cos(time * 0.2 + p.x * 0.002) * 0.06;
            p.vx += flowX;
            p.vy += flowY;

            // ---- Mouse gathering (skip when over card) ----
            if (!this.mouseOnCard && mouse.x > -9000) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 300 && dist > 1) {
                    const t = 1 - dist / 300;
                    // Velocity pull
                    const pull = t * t * 0.12;
                    p.vx += (dx / dist) * pull;
                    p.vy += (dy / dist) * pull;
                    // Direct position nudge toward mouse
                    p.x += dx * t * 0.02;
                    p.y += dy * t * 0.02;
                }
            }

            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            const margin = 30;
            if (p.x < -margin) p.x = canvas.width + margin;
            if (p.x > canvas.width + margin) p.x = -margin;
            if (p.y < -margin) p.y = canvas.height + margin;
            if (p.y > canvas.height + margin) p.y = -margin;

            // Speed limit
            const spd = Math.hypot(p.vx, p.vy);
            if (spd > 1.5) {
                p.vx = (p.vx / spd) * 1.5;
                p.vy = (p.vy / spd) * 1.5;
            }
        }
    },

    draw() {
        const { ctx, canvas, particles, connectDist, mouse } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const [lr, lg, lb] = this.lineColor;
        // Brighter connections when mouse is nearby (and not on card)
        const mouseActive = !this.mouseOnCard && mouse.x > -9000;

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.hypot(dx, dy);
                if (dist < connectDist) {
                    let alpha = (1 - dist / connectDist) * this.lineAlpha;
                    // Boost connection brightness near mouse
                    if (mouseActive) {
                        const di = Math.hypot(mouse.x - particles[i].x, mouse.y - particles[i].y);
                        const dj = Math.hypot(mouse.x - particles[j].x, mouse.y - particles[j].y);
                        const nearMouse = 1 - Math.min(di, dj) / 300;
                        if (nearMouse > 0) alpha = Math.max(alpha, nearMouse * 0.5);
                    }
                    ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw particles with glow
        for (const p of particles) {
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
            glow.addColorStop(0, p.color + '99');
            glow.addColorStop(0.5, p.color + '22');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mouse halo (only when not on card)
        if (mouseActive) {
            const halo = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
            halo.addColorStop(0, this.mouseHaloColor);
            halo.addColorStop(1, 'transparent');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 160, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
