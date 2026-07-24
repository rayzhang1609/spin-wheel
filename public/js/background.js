// Shared background layer initializer — two light types work together:
//  Type A: soft fading bokeh circles (opacity fades in/out on staggered loops)
//  Type B: small, sharp, bright sparkle points (always-on, subtle twinkle, no fade-to-zero)
// Together they evoke the lively marquee lighting of a real arcade cabinet.
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

  // Type A — soft fading bokeh circles (denser, smaller, brighter peaks)
  function createBokeh() {
    const container = document.getElementById('bokehLayer');
    if (!container) return;
    const count = 15 + Math.floor(Math.random() * 11); // 15–25

    for (let i = 0; i < count; i++) {
      const orb = document.createElement('div');
      orb.className = 'bokeh-orb';
      const size = rand(28, 115); // smaller, varied
      orb.style.width = size + 'px';
      orb.style.height = size + 'px';
      orb.style.left = (Math.random() * 100) + '%';
      orb.style.top = (Math.random() * 100) + '%';
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
  }

  // Type B — steady bright sparkle points (small, sharp, always-on, subtle twinkle)
  function createSparkles() {
    const container = document.getElementById('bokehLayer');
    if (!container) return;
    const count = 18 + Math.floor(Math.random() * 10); // 18–28

    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.className = 'sparkle-point';
      const size = rand(3, 7); // small, crisp
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.left = (Math.random() * 100) + '%';
      dot.style.top = (Math.random() * 100) + '%';
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
    createBokeh();
    createSparkles();
    createMarqueeBulbs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
