// ANC 演示声音：合成发动机噪声。ANC 开启时，200Hz 以下的低频阶次噪声被大幅压低，
// 高频成分只轻微衰减（与 ANC 实际适用的 20-200Hz 频段一致）。仅为示意，非实录。
(() => {
  const btn = document.getElementById('ancSound');
  const sw = document.getElementById('ancSwitch'), rpm = document.getElementById('ancRpm');
  if (!btn || !sw || !rpm) return;
  let ac, osc, osc2, lowG, highG, master, started = false;

  const build = () => {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    // 发动机 2 阶：基频 = rpm/60*2
    osc = ac.createOscillator(); osc.type = 'sawtooth';
    osc2 = ac.createOscillator(); osc2.type = 'square';
    const g2 = ac.createGain(); g2.gain.value = .35;
    // 白噪声（进气/路噪）
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const ng = ac.createGain(); ng.gain.value = .18;
    const mix = ac.createGain();
    osc.connect(mix); osc2.connect(g2).connect(mix); noise.connect(ng).connect(mix);

    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 200;
    const hlp = ac.createBiquadFilter(); hlp.type = 'lowpass'; hlp.frequency.value = 1800;
    lowG = ac.createGain(); highG = ac.createGain();
    master = ac.createGain(); master.gain.value = 0;
    mix.connect(lp).connect(lowG).connect(master);
    mix.connect(hp).connect(hlp).connect(highG).connect(master);
    master.connect(ac.destination);
    setFreq(true); setAnc(true);
    osc.start(); osc2.start(); noise.start();
  };
  const setFreq = now => {
    const f = Number(rpm.value) / 30;
    osc.frequency.setTargetAtTime(f, ac.currentTime, now ? 0 : .08);
    osc2.frequency.setTargetAtTime(f * 1.5, ac.currentTime, now ? 0 : .08);
  };
  const setAnc = now => {
    const on = sw.checked, t = now ? 0 : .35;
    lowG.gain.setTargetAtTime(on ? .04 : 1, ac.currentTime, t);
    highG.gain.setTargetAtTime(on ? .45 : 1, ac.currentTime, t);
  };

  btn.addEventListener('click', async () => {
    if (!ac) build();
    if (!started) {
      await ac.resume();
      master.gain.setTargetAtTime(.22, ac.currentTime, .15);
      started = true;
    } else {
      master.gain.setTargetAtTime(0, ac.currentTime, .1);
      started = false;
    }
    btn.setAttribute('aria-pressed', started);
    btn.textContent = started ? '🔊 关闭声音' : '🔈 播放声音';
    btn.classList.toggle('on', started);
  });
  rpm.addEventListener('input', () => { if (ac) setFreq(false); });
  sw.addEventListener('change', () => { if (ac) setAnc(false); });
  // 页面切到后台时静音
  document.addEventListener('visibilitychange', () => {
    if (ac && started) master.gain.setTargetAtTime(document.hidden ? 0 : .22, ac.currentTime, .1);
  });
})();
