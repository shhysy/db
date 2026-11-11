const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

menuButton.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.querySelectorAll('.main-nav a').forEach(item => item.classList.remove('active'));
    link.classList.add('active');
  });
});

const backTop = document.querySelector('.back-top');
window.addEventListener('scroll', () => {
  backTop.classList.toggle('visible', window.scrollY > 450);
}, { passive: true });

backTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 滚动到不同内容区域时，自动更新导航高亮。
const sections = [...document.querySelectorAll('main section[id]')];
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const current = document.querySelector(`.main-nav a[href="#${entry.target.id}"]`);
    if (current) {
      document.querySelectorAll('.main-nav a').forEach(item => item.classList.remove('active'));
      current.classList.add('active');
    }
  });
}, { rootMargin: '-35% 0px -55% 0px' });
sections.forEach(section => observer.observe(section));

// 解决方案详情弹层：点击卡片“了解详情”查看完整内容，可上一篇/下一篇切换。
const solDetails = {
  'eVTOL 紧急救援领域解决方案': ['紧急救援应用领域（300kg级以上）：', ['海上、滩涂、山林区救援', '军用物资运输', '高空巡逻救援']]
};
const solCards = [...document.querySelectorAll('.solution-card')];
const solModal = document.createElement('div');
solModal.className = 'sol-modal';
solModal.innerHTML = '<div class="sol-dialog" role="dialog" aria-modal="true"><button class="sol-close" aria-label="关闭">×</button><div class="sol-body"></div></div>';
document.body.appendChild(solModal);
const solBody = solModal.querySelector('.sol-body');
let solIndex = 0;

function showSolution(i) {
  solIndex = (i + solCards.length) % solCards.length;
  const c = solCards[solIndex];
  const title = c.querySelector('h3').textContent;
  const extra = solDetails[title];
  const prev = solCards[(solIndex - 1 + solCards.length) % solCards.length].querySelector('h3').textContent;
  const next = solCards[(solIndex + 1) % solCards.length].querySelector('h3').textContent;
  solBody.innerHTML =
    `<h3></h3><span class="sol-kicker"></span><p class="sol-summary"></p><div class="sol-extra"></div>` +
    `<img alt=""><div class="sol-nav"><button data-d="-1"></button><button data-d="1"></button></div>`;
  solBody.querySelector('h3').textContent = title;
  solBody.querySelector('.sol-kicker').textContent = c.querySelector('.card-kicker').textContent;
  solBody.querySelector('.sol-summary').textContent = extra ? extra[0] : c.querySelector('p').textContent;
  if (extra) {
    const ul = document.createElement('ul');
    extra[1].forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    solBody.querySelector('.sol-extra').appendChild(ul);
  }
  const img = solBody.querySelector('img');
  img.src = c.querySelector('img').src;
  img.alt = title;
  const [bp, bn] = solBody.querySelectorAll('.sol-nav button');
  bp.textContent = '↑ 上一篇：' + prev;
  bn.textContent = '↓ 下一篇：' + next;
  solModal.classList.add('open');
}
const closeSolution = () => solModal.classList.remove('open');

solCards.forEach((card, i) => {
  card.querySelector('a').addEventListener('click', e => { e.preventDefault(); showSolution(i); });
});
solModal.addEventListener('click', e => {
  if (e.target === solModal || e.target.closest('.sol-close')) closeSolution();
  const b = e.target.closest('.sol-nav button');
  if (b) showSolution(solIndex + Number(b.dataset.d));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSolution(); });
