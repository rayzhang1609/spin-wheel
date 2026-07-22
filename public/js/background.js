// Shared background layer initializer — mid-distance star field.
// Called automatically on page load. Does NOT touch the existing far-star
// or shooting-star systems (those are still handled by each page's own JS).
(function () {
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createMidStars() {
    const container = document.getElementById('starsMid');
    if (!container) return;
    const count = 25 + Math.floor(Math.random() * 15);
    const colors = ['#ffffff', '#ffffff', '#ffffff', '#00d4ff', '#ffd700', '#da70d6'];

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star-mid';
      const size = 2 + Math.random() * 3;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.background = colors[Math.floor(Math.random() * colors.length)];
      star.style.setProperty('--twk-dur', (1.5 + Math.random() * 2.5) + 's');

      if (!reducedMotion) {
        const dx = (Math.random() - 0.5) * 40;
        const dy = (Math.random() - 0.5) * 30;
        const dur = 20 + Math.random() * 25;
        star.style.setProperty('--dx', dx + 'px');
        star.style.setProperty('--dy', dy + 'px');
        star.style.setProperty('--drift-dur', dur + 's');
      } else {
        star.style.animation = 'starMidTwinkle ' + (2 + Math.random() * 2) + 's ease-in-out infinite alternate';
      }

      container.appendChild(star);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createMidStars);
  } else {
    createMidStars();
  }
})();
