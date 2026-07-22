let wheel = null;
let wheelData = null;
let coins = 0;
let gems = 0;
let pollTimer = null;

const spinBtn = document.getElementById('spinBtn');
const resetBtn = document.getElementById('resetBtn');
const resultBanner = document.getElementById('resultBanner');
const resultText = document.getElementById('resultText');
const resultEmoji = document.getElementById('resultEmoji');
const resultClose = document.getElementById('resultClose');
const wheelGlow = document.getElementById('wheelGlow');
const confettiCanvas = document.getElementById('confettiCanvas');
const pointer = document.getElementById('pointer');
const coinCountEl = document.getElementById('coinCount');
const gemCountEl = document.getElementById('gemCount');
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DEFAULT_SPIN_CONFIG = {
  items: [
    { label: 'Yay!', color: '#FF69B4', emoji: '🎊' },
    { label: 'Yes!', color: '#38B6FF', emoji: '✨' }
  ],
  spinDuration: 5000,
  minSpins: 5,
  maxSpins: 10
};

function bumpCounter(el) {
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

function addCoins(n) {
  coins += n;
  if (coinCountEl) { coinCountEl.textContent = coins; bumpCounter(coinCountEl); }
}

function addGems(n) {
  gems += n;
  if (gemCountEl) { gemCountEl.textContent = gems; bumpCounter(gemCountEl); }
}

const spinMessages = [
  "Spin the wheel!", "Give it a whirl!", "Let's gooo!",
  "You got this!", "Spin spin spin!", "Fortune awaits!",
  "Big prize incoming!", "Trust your luck!", "Here we go!"
];

const idleMessages = [
  "Good luck!", "Let's go!", "Wheee!", "So exciting!",
  "Try your luck!", "What'll you get?", "Fingers crossed!",
  "Ready to win?", "Go go go!"
];

function createStars() {
  const container = document.getElementById('stars');
  const count = 50 + Math.floor(Math.random() * 40);
  const colors = ['#ffffff', '#ff1493', '#00d4ff', '#ffd700', '#00ff88', '#da70d6'];
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = 1 + Math.random() * 4;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.background = colors[Math.floor(Math.random() * colors.length)];
    star.style.setProperty('--dur', (0.5 + Math.random() * 3) + 's');
    star.style.setProperty('--delay', (Math.random() * 4) + 's');
    container.appendChild(star);
  }
}

function createShootingStars() {
  const container = document.getElementById('shootingStars');
  const colors = ['#ffffff', '#00d4ff', '#ffd700', '#ff69b4', '#00ff88'];

  function spawnStar() {
    const star = document.createElement('div');
    star.className = 'shooting-star';
    star.style.left = (10 + Math.random() * 80) + '%';
    star.style.top = (5 + Math.random() * 40) + '%';
    star.style.setProperty('--angle', (-50 + Math.random() * 30) + 'deg');
    star.style.setProperty('--len', (60 + Math.random() * 120) + 'px');
    star.style.setProperty('--travel', (400 + Math.random() * 500) + 'px');
    star.style.setProperty('--shoot-dur', (0.5 + Math.random() * 0.7) + 's');
    star.style.setProperty('--star-color', colors[Math.floor(Math.random() * colors.length)]);
    container.appendChild(star);

    const dur = parseFloat(star.style.getPropertyValue('--shoot-dur')) * 1000 + 200;
    setTimeout(() => star.remove(), dur);
  }

  setInterval(() => {
    if (Math.random() < 0.4) spawnStar();
  }, 1200);

  setTimeout(() => { spawnStar(); spawnStar(); }, 500);
  setTimeout(spawnStar, 2500);
}

function rotateMascots() {
  const speeches = document.querySelectorAll('.mascot-speech');
  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  setInterval(() => {
    speeches.forEach(el => {
      el.textContent = pickRandom(idleMessages);
    });
  }, 6000);

  if (spinBtn) {
    spinBtn.addEventListener('click', () => {
      speeches.forEach(el => {
        el.textContent = pickRandom(spinMessages);
      });
    });
  }
}

// ===== Data layer: load wheel config from Supabase and poll for edits =====
async function fetchSpinConfig() {
  try {
    const cfg = await loadConfigRow('spin_config');
    if (cfg && Array.isArray(cfg.items) && cfg.items.length >= 2) return cfg;
  } catch (e) {
    console.warn('[spin] config load failed, using default:', e.message);
  }
  return DEFAULT_SPIN_CONFIG;
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (wheel && wheel.isSpinning) return;
    try {
      const next = await fetchSpinConfig();
      wheelData = next;
      if (wheel) wheel.setItems(next.items);
    } catch (e) { /* keep last known config */ }
  }, 5000);
}

async function loadWheel() {
  wheelData = await fetchSpinConfig();
  wheel = new SpinWheel('wheelCanvas', {
    items: wheelData.items,
    hubColor: '#ff1493',
    hubColorLight: '#ff69b4',
    pointerEl: pointer,
    onSpinEnd: onSpinEnd
  });
  startPolling();
}

function onSpinEnd(winner) {
  wheelGlow.classList.remove('active');
  wheel.resetPointer();
  addCoins(10);
  addGems(1);
  resultEmoji.textContent = winner.emoji || '🎉';
  resultText.textContent = winner.label;
  resultBanner.classList.remove('hidden');
  resultBanner.style.animation = 'none';
  resultBanner.offsetHeight;
  resultBanner.style.animation = '';
  if (!reducedMotion) launchConfetti();
  spinBtn.disabled = false;

  // Record the result to Supabase (fire-and-forget; never block the UI).
  const wedgeIndex = wheel ? wheel.getWinnerIndex() : null;
  insertResult('normal_spin_results', {
    prize: winner.label || '',
    emoji: winner.emoji || '',
    wedge_index: wedgeIndex
  }).catch(e => console.warn('[spin] result log failed:', e.message));
}

spinBtn.addEventListener('click', () => {
  if (wheel.isSpinning) return;
  resultBanner.classList.add('hidden');
  wheelGlow.classList.add('active');
  spinBtn.disabled = true;
  wheel.spin(
    wheelData.spinDuration || 5000,
    wheelData.minSpins || 5,
    wheelData.maxSpins || 10
  );
});

resultClose.addEventListener('click', () => {
  resultBanner.classList.add('hidden');
});

resultBanner.addEventListener('click', (e) => {
  if (e.target === resultBanner) resultBanner.classList.add('hidden');
});

resetBtn.addEventListener('click', async () => {
  if (wheel.isSpinning) return;
  wheel.rotation = 0;
  wheel.draw();
  resultBanner.classList.add('hidden');
});

function launchConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#ff6b9d', '#ffd93d', '#6bfff1', '#c084fc', '#34d399', '#fb923c', '#f472b6', '#60a5fa'];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * confettiCanvas.width,
      y: -20 - Math.random() * 200,
      w: 6 + Math.random() * 6,
      h: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      gravity: 0.05 + Math.random() * 0.05,
      opacity: 1
    });
  }

  let frame = 0;
  function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    pieces.forEach(p => {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      if (frame > 60) p.opacity -= 0.01;
      if (p.opacity <= 0) return;
      alive = true;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    frame++;
    if (alive) requestAnimationFrame(animateConfetti);
    else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
  animateConfetti();
}

window.addEventListener('resize', () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});

createStars();
createShootingStars();
rotateMascots();
loadWheel();
