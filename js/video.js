/**
 * Video reels: posters load as the section nears the viewport; nothing autoplays.
 * - Pointer hover (fine pointers, motion allowed) previews a reel muted, but never while the page
 *   is scrolling: a reel that slides under a resting pointer waits for the pointer to move.
 * - The play button plays one reel with sound and pauses every other reel.
 */
document.addEventListener('DOMContentLoaded', () => {
  const reels = [...document.querySelectorAll('.reel')];
  if (!reels.length) return;
  const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)'); // read live
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let active = null; // reel playing with sound

  // Active scrolling: set by scroll input and scroll events, cleared 180ms after the last one.
  // Wheel, touch and scroll keys arrive before the frame scrolls, so a reel that the first step
  // brings under the pointer is already covered. No layout reads.
  let scrolling = false;
  let scrollTimer = 0;
  const markScrolling = () => {
    scrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { scrolling = false; }, 180);
  };
  const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
  window.addEventListener('scroll', markScrolling, { passive: true });
  window.addEventListener('wheel', markScrolling, { passive: true });
  window.addEventListener('touchmove', markScrolling, { passive: true });
  window.addEventListener('keydown', (e) => { if (SCROLL_KEYS.has(e.key)) markScrolling(); });

  const items = reels.map((reel) => {
    const video = reel.querySelector('video');
    const button = reel.querySelector('.reel-play');
    const title = reel.querySelector('.reel-title')?.textContent.trim() || reel.dataset.title || 'video';
    return { reel, video, button, title };
  }).filter((i) => i.video && i.button);

  const loadPoster = (item) => {
    if (!item.video.poster && item.video.dataset.poster) item.video.poster = item.video.dataset.poster;
  };
  const loadSource = (item) => {
    if (!item.video.getAttribute('src') && item.video.dataset.src) {
      loadPoster(item);
      item.video.src = item.video.dataset.src;
    }
  };
  const play = (item) => item.video.play().catch((error) => {
    // A rejected play (autoplay policy, decode or network error) must not leave the
    // reel showing a pause button or holding the "active" slot.
    if (active === item) stop(item);
    if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') console.warn('Unable to play video:', error);
  });
  const setState = (item, playing) => {
    item.reel.classList.toggle('is-playing', playing);
    item.button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${item.title}${playing ? '' : ' with sound'}`);
  };
  const stop = (item) => {
    item.video.pause();
    item.video.muted = true;
    setState(item, false);
    if (active === item) active = null;
  };

  // Posters: load when the video zone is near.
  if ('IntersectionObserver' in window) {
    const posterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const item = items.find((i) => i.reel === entry.target);
        if (item) loadPoster(item);
        posterObserver.unobserve(entry.target);
      });
    }, { rootMargin: '600px 0px' });
    items.forEach((i) => posterObserver.observe(i.reel));

    // A reel scrolled out of view stops.
    const viewObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) return;
        const item = items.find((i) => i.reel === entry.target);
        if (item && !item.video.paused) stop(item);
      });
    }, { threshold: 0 });
    items.forEach((i) => viewObserver.observe(i.reel));
  } else {
    items.forEach(loadPoster);
  }

  items.forEach((item) => {
    item.video.muted = true;

    // Keep the button state honest when playback stops from outside the page
    // (media keys, OS controls, end of a non-looping source, errors).
    item.video.addEventListener('pause', () => {
      if (active === item) { active = null; item.video.muted = true; setState(item, false); }
    });
    item.video.addEventListener('error', () => { if (active === item) stop(item); });

    item.button.addEventListener('click', () => {
      if (active === item && !item.video.paused) {
        stop(item);
        return;
      }
      items.forEach((other) => { if (other !== item && !other.video.paused) stop(other); });
      loadSource(item);
      item.video.muted = false;
      active = item;
      setState(item, true);
      play(item);
    });

    item.video.addEventListener('click', () => item.button.click());

    if (canHover) {
      const preview = () => {
        if (active || reducedMQ.matches || scrolling || !item.video.paused) return;
        loadSource(item);
        item.video.muted = true;
        play(item);
      };
      // A reel that slides under the pointer during a scroll is only armed; it previews once the
      // pointer actually moves after scrolling stops.
      let armed = false;
      item.reel.addEventListener('mouseenter', () => {
        // Decide one frame later, after that frame's scroll event (covers scrollbar drags too).
        requestAnimationFrame(() => {
          if (!item.reel.matches(':hover')) return;
          if (scrolling) armed = true;
          else preview();
        });
      });
      item.reel.addEventListener('mousemove', () => {
        if (!armed || scrolling) return;
        armed = false;
        preview();
      });
      item.reel.addEventListener('mouseleave', () => {
        armed = false;
        if (active !== item) item.video.pause();
      });
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) items.forEach((i) => { if (!i.video.paused) stop(i); });
  });
});
