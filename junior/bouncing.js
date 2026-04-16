/**
 * bouncing.js
 * 在屏幕左右两侧显示 1.png ~ 10.png 共 10 张图片，
 * 缓缓移动、碰壁反弹、互相碰撞反弹，始终不重叠。
 * 图片尺寸随屏幕宽度自适应。
 */
(function () {
    const IMG_FILES = Array.from({ length: 10 }, (_, i) => `${i + 1}.png`);
    const SPEED  = 0.8;   // 像素/帧
    const PADDING = 4;    // 离边缘最小间距

    function imgSize() {
        const w = window.innerWidth;
        if (w >= 1024) return 72;
        if (w >= 768)  return 62;
        return 52;
    }

    const canvas = document.getElementById('bouncingCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let balls = [];
    let animStarted = false;

    const imageObjs = IMG_FILES.map(src => {
        const img = new Image();
        img.src = src;
        return { img, src };
    });

    // ===== 计算左右两侧可用区域 =====
    function getZones() {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const sz = imgSize();
        const minW = sz + PADDING * 2;

        const kbEl = document.getElementById('virtualKeyboard');
        const kbVisible = kbEl && kbEl.style.display !== 'none';

        if (kbVisible) {
            const r = kbEl.getBoundingClientRect();
            const leftW  = Math.max(r.left - PADDING, 0);
            const rightW = Math.max(W - r.right - PADDING, 0);
            // 只有两侧都有足够宽度时才用键盘旁边的区域
            if (leftW >= minW && rightW >= minW) {
                return [
                    { x: 0,              y: r.top, w: leftW,  h: r.height },
                    { x: r.right + PADDING, y: r.top, w: rightW, h: r.height },
                ];
            }
        }

        // 回退：屏幕左右两侧竖条（全高），宽度取屏幕16%但不小于minW
        const stripW = Math.max(Math.floor(W * 0.16), minW);
        return [
            { x: 0,          y: 0, w: stripW, h: H },
            { x: W - stripW, y: 0, w: stripW, h: H },
        ];
    }

    // ===== 初始化球（随机位置，避免重叠）=====
    function initBalls(zones) {
        const sz = imgSize();
        balls = [];
        const perZone = Math.ceil(imageObjs.length / 2);

        imageObjs.forEach((io, idx) => {
            const zoneIdx = idx < perZone ? 0 : 1;
            const zone = zones[zoneIdx];
            if (!zone || zone.w < sz + PADDING * 2 || zone.h < sz + PADDING * 2) return;

            let x, y, tries = 0;
            do {
                x = zone.x + PADDING + Math.random() * Math.max(zone.w - sz - PADDING * 2, 0);
                y = zone.y + PADDING + Math.random() * Math.max(zone.h - sz - PADDING * 2, 0);
                tries++;
            } while (tries < 60 && balls.some(b => {
                const cx1 = x + sz / 2, cy1 = y + sz / 2;
                const cx2 = b.x + b.sz / 2, cy2 = b.y + b.sz / 2;
                return Math.hypot(cx1 - cx2, cy1 - cy2) < sz;
            }));

            const angle = Math.random() * Math.PI * 2;
            balls.push({
                ...io,
                x, y,
                vx: Math.cos(angle) * SPEED,
                vy: Math.sin(angle) * SPEED,
                zoneIdx,
                sz,
            });
        });
    }

    // ===== 动画主循环 =====
    function tick() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const zones = getZones();
        const sz = imgSize();

        balls.forEach((b, i) => {
            b.sz = sz;
            const zone = zones[b.zoneIdx];
            if (!zone || zone.w < sz) return;

            b.x += b.vx;
            b.y += b.vy;

            const xMin = zone.x + PADDING;
            const xMax = zone.x + zone.w - sz - PADDING;
            const yMin = zone.y + PADDING;
            const yMax = zone.y + zone.h - sz - PADDING;
            if (b.x < xMin) { b.x = xMin; b.vx =  Math.abs(b.vx); }
            if (b.x > xMax) { b.x = xMax; b.vx = -Math.abs(b.vx); }
            if (b.y < yMin) { b.y = yMin; b.vy =  Math.abs(b.vy); }
            if (b.y > yMax) { b.y = yMax; b.vy = -Math.abs(b.vy); }

            // 同区域球碰撞
            for (let j = i + 1; j < balls.length; j++) {
                const b2 = balls[j];
                if (b2.zoneIdx !== b.zoneIdx) continue;
                const cx1 = b.x  + sz / 2, cy1 = b.y  + sz / 2;
                const cx2 = b2.x + sz / 2, cy2 = b2.y + sz / 2;
                const d = Math.hypot(cx2 - cx1, cy2 - cy1);
                if (d < sz && d > 0.01) {
                    const nx = (cx2 - cx1) / d, ny = (cy2 - cy1) / d;
                    const rel = (b.vx - b2.vx) * nx + (b.vy - b2.vy) * ny;
                    if (rel > 0) {
                        b.vx  -= rel * nx; b.vy  -= rel * ny;
                        b2.vx += rel * nx; b2.vy += rel * ny;
                        normSpeed(b); normSpeed(b2);
                        const push = (sz - d + 1) / 2;
                        b.x  -= nx * push; b.y  -= ny * push;
                        b2.x += nx * push; b2.y += ny * push;
                    }
                }
            }

            // 绘制（圆角剪裁 + 投影 + 半透明）
            if (b.img.complete && b.img.naturalWidth > 0) {
                const r = sz * 0.18;
                ctx.save();
                ctx.globalAlpha = 0.82;
                ctx.shadowColor = 'rgba(0,0,0,0.18)';
                ctx.shadowBlur  = 7;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(b.x, b.y, sz, sz, r);
                } else {
                    const x = b.x, y = b.y;
                    ctx.moveTo(x + r, y);
                    ctx.lineTo(x + sz - r, y);
                    ctx.quadraticCurveTo(x + sz, y, x + sz, y + r);
                    ctx.lineTo(x + sz, y + sz - r);
                    ctx.quadraticCurveTo(x + sz, y + sz, x + sz - r, y + sz);
                    ctx.lineTo(x + r, y + sz);
                    ctx.quadraticCurveTo(x, y + sz, x, y + sz - r);
                    ctx.lineTo(x, y + r);
                    ctx.quadraticCurveTo(x, y, x + r, y);
                }
                ctx.clip();
                ctx.drawImage(b.img, b.x, b.y, sz, sz);
                ctx.restore();
            }
        });

        requestAnimationFrame(tick);
    }

    function normSpeed(b) {
        const s = Math.hypot(b.vx, b.vy);
        if (s > 0.001) { b.vx = b.vx / s * SPEED; b.vy = b.vy / s * SPEED; }
    }

    // ===== 监听键盘显隐，重新布局 =====
    function watchKeyboard() {
        const kbEl = document.getElementById('virtualKeyboard');
        if (!kbEl) return;
        new MutationObserver(() => {
            setTimeout(() => initBalls(getZones()), 150);
        }).observe(kbEl, { attributes: true, attributeFilter: ['style'] });
    }

    // ===== 启动 =====
    function start() {
        watchKeyboard();
        window.addEventListener('resize', () => {
            setTimeout(() => initBalls(getZones()), 200);
        });

        function tryInit(attempt) {
            const zones = getZones();
            const sz = imgSize();
            const anyZoneOk = zones.some(z => z.w >= sz + PADDING * 2);
            if (anyZoneOk || attempt > 10) {
                initBalls(zones);
                if (!animStarted) { animStarted = true; tick(); }
            } else {
                setTimeout(() => tryInit(attempt + 1), 300);
            }
        }
        setTimeout(() => tryInit(0), 700);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
