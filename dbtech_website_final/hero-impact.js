// 首屏冲击力：标题逐字入场、鼠标聚光、底部声波
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const h1 = hero.querySelector('h1');
  if (h1 && !h1.dataset.split) {
    h1.dataset.split = '1';
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          [...n.textContent].forEach(c => {
     const s = document.createElement('span');
     s.className = 'ch'; s.style.setProperty('--i', i++); s.textContent = c;
     f.appendChild(s);
   });
          n.replaceWith(f);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(h1);
  }
  // 鼠标聚光
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--hx', (e.clientX - r.left) + 'px');
    hero.style.setProperty('--hy', (e.clientY - r.top) + 'px');
  });
  // 底部声波（两层 SVG 正弦，宽度 200% 无缝循环）
  const mk = (amp, len, color, w) => {
    let d = 'M0 45';
    for (let x = 0; x <= 2000; x += 10) d += ` L${x} ${45 + Math.sin(x / len * Math.PI * 2) * amp * (.6 + .4 * Math.sin(x / 400))}`;
    return `<svg viewBox="0 0 2000 90" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}"/></svg>`;
  };
  const wave = document.createElement('div');
  wave.className = 'hero-wave';
  wave.innerHTML = mk(26, 250, '#38b8e8', 2.5) + mk(18, 125, '#7a5cff', 2);
  hero.appendChild(wave);
})();
