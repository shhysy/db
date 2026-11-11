// 科技互动效果：粒子网络、数字滚动、卡片倾斜光斑、滚动渐显、进度条、ANC 演示
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. 滚动进度条
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const updateBar = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  };
  addEventListener('scroll', updateBar, { passive: true });
  updateBar();

  // 2. 首屏粒子网络（鼠标靠近时粒子被吸引并连线）
  const hero = document.querySelector('.hero');
  if (hero && !reduce) {
    const cv = document.createElement('canvas');
    cv.id = 'heroCanvas';
    hero.insertBefore(cv, hero.firstChild);
    const ctx = cv.getContext('2d');
    let W, H, pts = [], mouse = { x: -999, y: -999 }, visible = true;
    const resize = () => {
      const r = hero.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = W * d; cv.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.min(90, Math.round(W * H / 14000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5
      }));
    };
    resize();
    addEventListener('resize', resize);
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(hero);
    const LINK = 120, MR = 160;
    const frame = () => {
      requestAnimationFrame(frame);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.hypot(dx, dy);
        if (dist < MR) { p.vx += dx / dist * .02; p.vy += dy / dist * .02; }
        p.vx *= .99; p.vy *= .99;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.fillStyle = '#38b8e8aa';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.283); ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(56,184,232,${(1 - d / LINK) * .35})`;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
        const dm = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
        if (dm < MR) {
          ctx.strokeStyle = `rgba(122,92,255,${(1 - dm / MR) * .6})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    };
    frame();
  }

  // 3. 数字滚动
  document.querySelectorAll('.hero-stats strong').forEach(el => {
    const span = el.querySelector('span');
    const target = parseInt(el.firstChild.textContent, 10);
    if (isNaN(target)) return;
    const run = () => {
      if (reduce) { el.firstChild.textContent = target; return; }
      const t0 = performance.now(), dur = 1400;
      const step = t => {
        const k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
        el.firstChild.textContent = Math.round(target * e);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    el.firstChild.textContent = '0';
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { run(); o.disconnect(); } }).observe(el);
  });

  // 4. 卡片 3D 倾斜 + 跟随光斑
  document.querySelectorAll('.solution-card,.product-card,.tech-feature').forEach(c => {
    c.classList.add('tilt');
    if (reduce) return;
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
      c.style.transform = `perspective(800px) rotateY(${(x - .5) * 8}deg) rotateX(${(.5 - y) * 8}deg) translateY(-4px)`;
    });
    c.addEventListener('mouseleave', () => { c.style.transform = ''; });
  });

  // 5. 滚动渐显
  const targets = document.querySelectorAll('.section-heading,.about-copy,.about-photos figure,.solution-card,.product-card,.tech-copy,.tech-feature');
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('in'); io.unobserve(en.target);
      setTimeout(() => { en.target.style.transitionDelay = ''; }, 1200);
    }
  }), { threshold: .12 });
  targets.forEach((t, i) => { t.classList.add('reveal'); t.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(t); });
})();

// ANC 主动降噪演示：红色=噪声，蓝色=反相抗噪声，绿色=叠加后的残余噪声
(() => {
  const cv = document.getElementById('ancCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const sw = document.getElementById('ancSwitch'), rpm = document.getElementById('ancRpm');
  const rpmOut = document.getElementById('ancRpmOut'), dbOut = document.getElementById('ancDb');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, t = 0, atten = 0, visible = true;
  const fit = () => {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  fit(); addEventListener('resize', fit);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);

  // 发动机 2 阶噪声：频率 = 转速/60*2
  const noise = (x, tt, f) => Math.sin(x * f + tt * f * 2.2) + .45 * Math.sin(x * f * 2 + tt * f * 4.1);
  const draw = () => {
    requestAnimationFrame(draw);
    if (!visible) return;
    const rp = Number(rpm.value), f = 0.012 + (rp - 800) / 5200 * 0.03;
    rpmOut.textContent = rp;
    const target = sw.checked ? 0.94 : 0;           // 开启后抵消 94% 的幅度
    atten += (target - atten) * 0.06;
    t += reduce ? 0 : 0.6;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#0879c91c'; ctx.lineWidth = 1;
    for (let y = 0; y <= H; y += H / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const mid = H / 2, amp = H * 0.22;
    const line = (fn, color, w) => {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
      for (let x = 0; x <= W; x += 2) { const y = mid + fn(x) * amp; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    };
    ctx.globalAlpha = .75;
    line(x => noise(x, t * .02, f), '#ff6b6b', 1.6);
    ctx.globalAlpha = .35 + atten * .5;
    line(x => -noise(x, t * .02, f) * (atten > 0.02 ? 1 : 0), '#38b8e8', 1.6);
    ctx.globalAlpha = 1;
    line(x => noise(x, t * .02, f) * (1 - atten), '#18c4a0', 2.6);
    const db = 78 - atten * 22;                       // 示意：78 dB → 约 56 dB
    dbOut.textContent = db.toFixed(1);
  };
  draw();
})();
