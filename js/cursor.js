/**
 * Custom Section-Aware Cursor
 * Provides smooth spring lerping, hover recognition, and adaptive glyph switching per section.
 */
(function initCustomCursor() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (reduced || !canHover) return;

  const cursorEl = document.getElementById('custom-cursor');
  if (!cursorEl) return;

  const zoneEls = ['vlsi', 'leadership', 'video']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  let mx = 0, my = 0, cx = 0, cy = 0;
  let mode = 'default';
  let started = false;

  function zoneAt(x, y) {
    for (const z of zoneEls) {
      const r = z.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return z.id;
      }
    }
    return 'default';
  }

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;

    if (!started) {
      cx = mx;
      cy = my;
      started = true;
    }

    document.body.classList.add('custom-cursor-active');
    cursorEl.classList.add('is-visible');

    const nextMode = zoneAt(mx, my);
    if (nextMode !== mode) {
      mode = nextMode;
      cursorEl.dataset.mode = mode;
    }

    const hoverTarget = e.target.closest('a, button, [role="button"], input, textarea, .cursor-pointer');
    cursorEl.classList.toggle('is-hover', !!hoverTarget);
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    cursorEl.classList.remove('is-visible');
  });

  function render() {
    cx += (mx - cx) * 0.2;
    cy += (my - cy) * 0.2;
    cursorEl.style.left = cx + 'px';
    cursorEl.style.top = cy + 'px';
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
