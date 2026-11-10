/**
 * Custom Section-Aware Cursor
 * Provides smooth spring lerping, hover recognition, and adaptive glyph switching per section.
 *
 * Performance notes:
 * - Position is applied with a compositor-only `transform` (no left/top → no layout per frame).
 * - The rAF loop sleeps once the cursor has caught up with the pointer.
 * - Section bounds are cached in document coordinates and refreshed on resize /
 *   content-size changes, instead of calling getBoundingClientRect on every mousemove.
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
  let visible = false;
  let raf = 0;

  // Cached zone bounds (document coordinates).
  let zones = [];
  let zonesDirty = true;
  function measureZones() {
    const sx = window.scrollX, sy = window.scrollY;
    zones = zoneEls.map(z => {
      const r = z.getBoundingClientRect();
      return { id: z.id, left: r.left + sx, right: r.right + sx, top: r.top + sy, bottom: r.bottom + sy };
    });
    zonesDirty = false;
  }
  const invalidateZones = () => { zonesDirty = true; };
  window.addEventListener('resize', invalidateZones, { passive: true });
  if ('ResizeObserver' in window) {
    // Fires when lazily rendered content (projects, timeline, media) changes page height.
    const ro = new ResizeObserver(invalidateZones);
    ro.observe(document.body);
    zoneEls.forEach(z => ro.observe(z));
  }

  function zoneAt(x, y) {
    if (zonesDirty) measureZones();
    const dx = x + window.scrollX, dy = y + window.scrollY;
    for (const z of zones) {
      if (dx >= z.left && dx <= z.right && dy >= z.top && dy <= z.bottom) {
        return z.id;
      }
    }
    return 'default';
  }

  function updateMode() {
    const nextMode = zoneAt(mx, my);
    if (nextMode !== mode) {
      mode = nextMode;
      cursorEl.dataset.mode = mode;
    }
  }

  function apply() {
    // translate(-50%,-50%) from the stylesheet is preserved after the positional translate.
    cursorEl.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
  }

  function render() {
    cx += (mx - cx) * 0.2;
    cy += (my - cy) * 0.2;
    if (Math.abs(mx - cx) < 0.1 && Math.abs(my - cy) < 0.1) {
      cx = mx; cy = my;
      apply();
      raf = 0;
      return;
    }
    apply();
    raf = requestAnimationFrame(render);
  }

  function wake() {
    if (!raf) raf = requestAnimationFrame(render);
  }

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;

    if (!started) {
      cx = mx;
      cy = my;
      started = true;
      document.body.classList.add('custom-cursor-active');
    }

    if (!visible) {
      visible = true;
      cursorEl.classList.add('is-visible');
    }

    updateMode();

    const hoverTarget = e.target.closest('a, button, [role="button"], input, textarea, .cursor-pointer');
    cursorEl.classList.toggle('is-hover', !!hoverTarget);
    wake();
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    visible = false;
    cursorEl.classList.remove('is-visible');
  });
})();
