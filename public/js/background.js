// Shared background layer initializer — bokeh light orbs + arcade marquee bulbs.
// Soft out-of-focus light circles fade in/out on staggered loops across a
// violet atmosphere, evoking the marquee lights on a real arcade cabinet.
(function () {
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BOKEH_COLORS = [
    'rgba(123,79,224,0.7)',   // purple
    'rgba(233,30,140,0.6)',   // pink
    'rgba(66,165,245,0.5)',   // blue
    'rgba(179,136,255,0.6)',  // light purple
    'rgba(255,107,157,0.5)'   // light pink
  ];

  const MARQUEE_COLORS = [
    '#FFD700', // gold
    '#E91E8C', // magenta
    '#42A5F5'  // blue
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }

  function createBokeh() {
    const container = document.getElementById('bokehLayer');
    if (!container) return;
    const count = 12 + Math.floor(Math.random() * 6);

    for (let i = 0; i < count; i++) {
      const orb = document.createElement('div');
      orb.className = 'bokeh-orb';
      const size = rand(60, 200);
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

  function createMarqueeBulbs() {
    const rows = document.querySelectorAll('.marquee-row');
    if (!rows.length) return;

    rows.forEach(function (row) {
      const isColumn = row.classList.contains('marquee-row-column');
      const count = isColumn ? 4 : 9;
      for (let i = 0; i < count; i++) {
        const bulb = document.createElement('span');
        bulb.className = 'marquee-bulb';
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
    createMarqueeBulbs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
