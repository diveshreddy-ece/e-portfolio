/**
 * Explore paths: the three track bands on the hero pass.
 * Choosing a track punches its band (a punched band stays punched, like a used pass),
 * nudges the 3D pass, and scrolls to that track's zone.
 */
document.addEventListener('DOMContentLoaded', () => {
  const tracks = document.querySelectorAll('.track[data-track]');
  const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)'); // read live

  const goTo = (hash) => {
    const target = document.querySelector(hash);
    if (!target) return false;
    target.scrollIntoView({ behavior: reducedMQ.matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', hash);
    // Move focus into the zone so keyboard and screen-reader users land where they chose.
    const heading = target.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
    return true;
  };

  tracks.forEach((track) => {
    track.addEventListener('click', (event) => {
      const hash = track.getAttribute('href');
      track.classList.add('is-punched');
      window.dispatchEvent(new CustomEvent('pass:nudge', { detail: { track: track.dataset.track } }));
      if (goTo(hash)) event.preventDefault();
    });
  });

  // Back-compat for any old links that call these helpers.
  window.scrollToSection = goTo;
  window.openExploreSection = goTo;
});
