/**
 * Core UI & Navigation Interactions
 * Handles navbar state transitions, scroll progress, reveal animations, and mobile drawer.
 */
document.addEventListener('DOMContentLoaded', () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile Menu Drawer ---------- */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const openIcon = document.getElementById('menu-icon-open');
  const closeIcon = document.getElementById('menu-icon-close');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      if (openIcon) openIcon.classList.toggle('hidden', !isOpen);
      if (closeIcon) closeIcon.classList.toggle('hidden', isOpen);
      menuBtn.setAttribute('aria-expanded', String(!isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        if (openIcon) openIcon.classList.remove('hidden');
        if (closeIcon) closeIcon.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Navbar Scroll Dynamics & Progress ---------- */
  const header = document.getElementById('site-header');
  const navInner = document.getElementById('nav-inner');
  const progress = document.getElementById('scroll-progress');
  const backToTop = document.getElementById('back-to-top');

  // Scroll work is batched into one rAF per frame; layout reads (scrollHeight)
  // are cached and refreshed only when the page size changes; DOM writes only
  // happen when a state actually flips.
  let maxScroll = 0;
  let lastShrink = null;
  let lastTop = null;
  let scrollQueued = false;
  const doc = document.documentElement;

  function measure() {
    maxScroll = doc.scrollHeight - doc.clientHeight;
  }

  function onScroll() {
    scrollQueued = false;
    const y = window.scrollY;
    const shrink = y > 40;

    if (shrink !== lastShrink) {
      lastShrink = shrink;
      if (header) header.classList.toggle('shadow-sm', shrink);
      if (navInner) navInner.style.height = shrink ? '64px' : '84px';
    }

    const pct = maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0;
    if (progress) progress.style.transform = `scaleX(${pct})`;

    const showTop = y > 480;
    if (backToTop && showTop !== lastTop) {
      lastTop = showTop;
      if (showTop) {
        backToTop.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-3');
      } else {
        backToTop.classList.add('opacity-0', 'pointer-events-none', 'translate-y-3');
      }
    }
  }

  function queueScroll() {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(onScroll);
    }
  }

  measure();
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); queueScroll(); }, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { measure(); queueScroll(); }).observe(document.body);
  }
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Active Navigation Observer ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const trackedSections = ['about', 'vlsi', 'leadership', 'video']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && trackedSections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === entry.target.id));
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

    trackedSections.forEach(s => navObserver.observe(s));
  }

  /* ---------- Reveal-on-Scroll Observer ---------- */
  if (reduced) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
  }

  /* ---------- VLSI Silicon Flow Line Animation ---------- */
  const flowLine = document.getElementById('flow-line');
  const flowContainer = document.getElementById('vlsi-flow');

  if (!reduced && flowLine && flowContainer && 'IntersectionObserver' in window) {
    const flowObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          flowLine.classList.add('draw');
          flowObserver.disconnect();
        }
      });
    }, { threshold: 0.4 });

    flowObserver.observe(flowContainer);
  } else if (flowLine) {
    flowLine.classList.add('draw');
  }
});
