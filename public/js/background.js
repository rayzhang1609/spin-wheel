// Shared background layer initializer — background lights on an evenly-spaced grid
// plus permanent bright side lights on the left and right edges.
//  Type A: visible glowing circles on a grid (fade in/out, staggered)
//  Type B: small steady sparkle points mixed into the grid (always-on twinkle)
//  Side lights: permanently bright points on far left/right edges (no fade)
// The grid forms a visible vertical rectangle behind the machine.
(function () {
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BOKEH_COLORS = [
    'rgba(123,79,224,0.8)',   // purple
    'rgba(233,30,140,0.7)',   // pink
    'rgba(66,165,245,0.7)',   // blue
    'rgba(179,136,255,0.7)',  // light purple
    'rgba(255,107,157,0.65)'  // light pink
  ];

  const SPARKLE_COLORS = [
    '#FFD700', // gold
    '#E91E8C', // magenta/pink
    '#42A5F5', // blue
    '#B388FF', // light purple
    '#FFFFFF'  // white hot
  ];

  const SIDE_COLORS = [
    '#FFD700', // gold
    '#E91E8C', // magenta
    '#42A5F5', // blue
    '#B388FF', // light purple
  ];

  const MARQUEE_COLORS = [
    '#FFD700', // gold
    '#E91E8C', // magenta
    '#42A5F5'  // blue
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }

  // Grid geometry — evenly spaced rows/cols across a portrait-ish inset area.
  // Denser grid: more lights, closer spacing, fewer empty gaps.
  const COLS = 8;
  const ROWS = 12;
  const INSET_X = 4;   // % inset from left/right
  const INSET_Y = 3;   // % inset from top/bottom
  const JITTER = 8;    // px jitter around each grid point (organic, not robotic)
  const stepX = (100 - INSET_X * 2) / (COLS - 1);
  const stepY = (100 - INSET_Y * 2) / (ROWS - 1);

  // Type A — visible glowing circle (fades in/out)
  function makeBokeh(container, leftPct, topPct) {
    const orb = document.createElement('div');
    orb.className = 'bokeh-orb';
    const size = rand(40, 90);
    orb.style.width = size + 'px';
    orb.style.height = size + 'px';
    orb.style.left = leftPct + '%';
    orb.style.top = topPct + '%';
    orb.style.marginLeft = rand(-JITTER, JITTER) + 'px';
    orb.style.marginTop = rand(-JITTER, JITTER) + 'px';
    const color = BOKEH_COLORS[Math.floor(Math.random() * BOKEH_COLORS.length)];
    orb.style.background = 'radial-gradient(circle, ' + color + ' 0%, transparent 65%)';
    if (!reducedMotion) {
      orb.style.animationDelay = (Math.random() * 12) + 's';
      orb.style.animationDuration = rand(2.5, 5.5) + 's';
    } else {
      orb.style.animation = 'none';
      orb.style.opacity = '0.5';
    }
    container.appendChild(orb);
  }

  // Type B — steady bright sparkle point (twinkle, no fade-to-zero)
  function makeSparkle(container, leftPct, topPct) {
    const dot = document.createElement('span');
    dot.className = 'sparkle-point';
    const size = rand(4, 8);
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

  // Build the grid: one light per grid point. Type B (sparkle) at every
  // 3rd point on a diagonal pattern; the rest are Type A bokeh.
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

  // Permanent side lights — always-bright points on far left and right edges,
  // scattered vertically. These stay lit regardless of the fade animation.
  function createSideLights() {
    const container = document.getElementById('bokehLayer');
    if (!container) return;
    const count = 10; // per side
    for (let i = 0; i < count; i++) {
      const topPct = 4 + (i / (count - 1)) * 92; // spread top to bottom
      // Left edge
      const leftLight = document.createElement('span');
      leftLight.className = 'side-light';
      const lSize = rand(5, 9);
      leftLight.style.width = lSize + 'px';
      leftLight.style.height = lSize + 'px';
      leftLight.style.left = '1.5%';
      leftLight.style.top = topPct + '%';
      leftLight.style.marginTop = rand(-8, 8) + 'px';
      const lColor = SIDE_COLORS[i % SIDE_COLORS.length];
      leftLight.style.color = lColor;
      leftLight.style.background = 'radial-gradient(circle, #ffffff 0%, ' + lColor + ' 50%, ' + lColor + ' 100%)';
      container.appendChild(leftLight);
      // Right edge
      const rightLight = document.createElement('span');
      rightLight.className = 'side-light';
      const rSize = rand(5, 9);
      rightLight.style.width = rSize + 'px';
      rightLight.style.height = rSize + 'px';
      rightLight.style.left = '98.5%';
      rightLight.style.top = topPct + '%';
      rightLight.style.marginTop = rand(-8, 8) + 'px';
      const rColor = SIDE_COLORS[(i + 2) % SIDE_COLORS.length];
      rightLight.style.color = rColor;
      rightLight.style.background = 'radial-gradient(circle, #ffffff 0%, ' + rColor + ' 50%, ' + rColor + ' 100%)';
      container.appendChild(rightLight);
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
    createSideLights();
    createMarqueeBulbs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
