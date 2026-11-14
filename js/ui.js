/**
 * Core UI: mobile drawer, back-to-top, and the active track in the pass strip.
 */
document.addEventListener('DOMContentLoaded', () => {
  const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)'); // read live
  const root = document.documentElement;

  /* ---------- Mobile drawer ---------- */
  const menuBtn = document.getElementById('menu-btn');
  const drawer = document.getElementById('mobile-menu');
  const openIcon = document.getElementById('menu-icon-open');
  const closeIcon = document.getElementById('menu-icon-close');

  const setDrawer = (open) => {
    if (!menuBtn || !drawer) return;
    drawer.classList.toggle('hidden', !open);
    openIcon?.classList.toggle('hidden', open);
    closeIcon?.classList.toggle('hidden', !open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  menuBtn?.addEventListener('click', () => setDrawer(drawer.classList.contains('hidden')));
  drawer?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setDrawer(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && !drawer.classList.contains('hidden')) {
      setDrawer(false);
      menuBtn?.focus();
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener?.('change', (e) => { if (e.matches) setDrawer(false); });

  /* ---------- Back to top ---------- */
  const backToTop = document.getElementById('back-to-top');
  let shown = false;
  let queued = false;
  const onScroll = () => {
    queued = false;
    const show = window.scrollY > 640;
    if (show !== shown && backToTop) {
      shown = show;
      backToTop.classList.toggle('is-shown', show);
    }
  };
  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMQ.matches ? 'auto' : 'smooth' });
    document.getElementById('home')?.focus?.({ preventScroll: true });
  });

  /* ---------- Active section: nav highlight + strip colour ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const zones = { vlsi: 'vlsi', leadership: 'crew', work: 'work', video: 'media' };
  const sections = ['home', 'about', 'vlsi', 'leadership', 'work', 'projects', 'video', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          const on = link.dataset.section === id;
          link.classList.toggle('active', on);
          if (on) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
        if (zones[id]) root.dataset.zone = zones[id];
        else delete root.dataset.zone;
      });
    }, { rootMargin: '-35% 0px -60% 0px', threshold: 0 });
    sections.forEach((s) => observer.observe(s));
  }

  // The VLSI flow rail is drawn by js/scroll-fx.js as part of the signal trace.
});
