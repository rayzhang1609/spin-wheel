// Shared background layer initializer — two light types on an evenly-spaced grid:
//  Type A: soft fading bokeh circles (opacity fades in/out on staggered loops)
//  Type B: small, sharp, bright sparkle points (always-on, subtle twinkle, no fade-to-zero)
// Lights are laid out on a uniform row/column grid (with small organic jitter)
// so the field reads as a structured marquee wall matching the portrait screen,
// not a random scatter.
(function () {
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BOKEH_COLORS = [
    'rgba(123,79,224,0.75)',   // purple
    'rgba(233,30,140,0.65)',   // pink
    'rgba(66,165,245,0.6)',    // blue
    'rgba(179,136,255,0.65)',  // light purple
    'rgba(255,107,157,0.6)'    // light pink
  ];

  const SPARKLE_COLORS = [
    '#FFD700', // gold
    '#E91E8C', // magenta/pink
    '#42A5F5', // blue
    '#B388FF', // light purple
    '#FFFFFF'  // white hot
  ];

  const MARQUEE_COLORS = [
    '#FFD700', // gold
    '#E91E8C', // magenta
    '#42A5F5'  // blue
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }

  // Grid geometry — evenly spaced rows/cols across a portrait-ish inset area.
  const COLS = 6;
  const ROWS = 9;
  const INSET_X = 6;   // % inset from left/right
  const INSET_Y = 4;   // % inset from top/bottom
  const JITTER = 12;   // px jitter around each grid point (organic, not robotic)
  const stepX = (100 - INSET_X * 2) / (COLS - 1);
  const stepY = (100 - INSET_Y * 2) / (ROWS - 1);

  // Type A — soft fading bokeh circle
  function makeBokeh(container, leftPct, topPct) {
    const orb = document.createElement('div');
    orb.className = 'bokeh-orb';
    const size = rand(28, 115);
    orb.style.width = size + 'px';
    orb.style.height = size + 'px';
    orb.style.left = leftPct + '%';
    orb.style.top = topPct + '%';
    orb.style.marginLeft = rand(-JITTER, JITTER) + 'px';
    orb.style.marginTop = rand(-JITTER, JITTER) + 'px';
    const color = BOKEH_COLORS[Math.floor(Math.random() * BOKEH_COLORS.length)];
    orb.style.background = 'radial-gradient(circle, ' + color + ' 0%, transparent 70%)';
    if (!reducedMotion) {
      orb.style.animationDelay = (Math.random() * 4) + 's';
      orb.style.animationDuration = rand(2.5, 4) + 's';
    } else {
      orb.style.animation = 'none';
      orb.style.opacity = '0.6';
    }
    container.appendChild(orb);
  }

  // Type B — steady bright sparkle point
  function makeSparkle(container, leftPct, topPct) {
    const dot = document.createElement('span');
    dot.className = 'sparkle-point';
    const size = rand(3, 7);
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    dot.style.left = leftPct + '%';
    dot.style.top = topPct + '%';
    dot.style.marginLeft = rand(-JITTER, JITTER) + 'px';
    dot.style.marginTop = rand(-JITTER, JITTER) + 'px';
    const color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];
    dot.style.color = color;
    dot.style.background = 'radial-gradient(circle, #ffffff 0%, ' + color + ' 55%, ' + color + ' 100%)';
    if (!reducedMotion) {
      dot.style.animationDelay = (Math.random() * 4) + 's';
      dot.style.animationDuration = rand(2.8, 4.5) + 's';
    } else {
      dot.style.animation = 'none';
      dot.style.opacity = '0.85';
    }
    container.appendChild(dot);
  }

  // Build the grid: one light per grid point. Type B (sparkle) placed at every
  // 3rd point on a diagonal pattern ((r+c) % 3 === 0) so steady points are
  // evenly mixed among the fading circles; the rest are Type A bokeh.
  function createGridLights() {
    const container = document.getElementById('bokehLayer');
    if (!container) return;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const leftPct = INSET_X + c * stepX;
        const topPct = INSET_Y + r * stepY;
        const isSparkle = ((r + c) % 3) === 0;
        if (isSparkle) makeSparkle(container, leftPct, topPct);
        else makeBokeh(container, leftPct, topPct);
      }
    }
  }

  function createMarqueeBulbs() {
    const rows = document.querySelectorAll('.marquee-row');
    if (!rows.length) return;

    rows.forEach(function (row) {
      const isColumn = row.classList.contains('marquee-row-column');
      const count = isColumn ? 4 : 9;
      for (let i = 0; i < count; i++) {
        const bulb = document.createElement('span');
        bulb.className = 'marquee-bulb';
        bulb.style.color = MARQUEE_COLORS[i % MARQUEE_COLORS.length];
        bulb.style.background = MARQUEE_COLORS[i % MARQUEE_COLORS.length];
        if (!reducedMotion) {
          bulb.style.animationDelay = (Math.random() * 3) + 's';
          bulb.style.animationDuration = rand(2, 3.5) + 's';
        } else {
          bulb.style.animation = 'none';
          bulb.style.opacity = '0.6';
        }
        row.appendChild(bulb);
      }
    });
  }

  function init() {
    createGridLights();
    createMarqueeBulbs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
