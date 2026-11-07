/**
 * Lazy video loading and playback for the portfolio gallery.
 */
document.addEventListener('DOMContentLoaded', () => {
  const videos = [...document.querySelectorAll('.portfolio-hover-video, .portfolio-featured-video')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const visibleVideos = new Set();

  function loadVideo(video) {
    if (!video.src && video.dataset.src) {
      if (video.dataset.poster) video.poster = video.dataset.poster;
      video.src = video.dataset.src;
      video.load();
    }
  }

  function playVideo(video) {
    if (document.hidden) return;
    video.play().catch((error) => {
      if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
        console.warn('Unable to play portfolio video:', error);
      }
    });
  }

  videos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'none';

    const wrap = video.closest('.hover-video-wrap, .featured-hover-video');
    const hint = wrap?.querySelector('.sound-hint, .featured-sound-hint');
    if (hint) hint.textContent = '🔇 Select video to enable sound';

    if (reducedMotion) return;

    if (wrap) {
      wrap.addEventListener('click', () => {
        loadVideo(video);
        video.muted = !video.muted;
        video.defaultMuted = video.muted;
        if (hint) hint.textContent = video.muted ? '🔇 Select video to enable sound' : '🔊 Sound on · Select to mute';
        playVideo(video);
      });
      wrap.addEventListener('mouseenter', () => { video.style.transform = 'scale(1.025)'; });
      wrap.addEventListener('mouseleave', () => { video.style.transform = 'scale(1)'; });
    }
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target: video, isIntersecting }) => {
        if (isIntersecting) {
          visibleVideos.add(video);
          loadVideo(video);
          playVideo(video);
        } else {
          visibleVideos.delete(video);
          video.pause();
        }
      });
    }, { threshold: 0.2 });

    videos.forEach((video) => observer.observe(video));
  } else if (!reducedMotion) {
    videos.forEach((video) => {
      loadVideo(video);
      playVideo(video);
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      videos.forEach((video) => video.pause());
    } else {
      visibleVideos.forEach(playVideo);
    }
  });
});
