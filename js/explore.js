/**
 * Explore Me Interaction Controller
 * Coordinates the 3D category folder dialog and smooth scrolling to chosen sections.
 */
document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('explore-me-trigger');
  const dialog = document.getElementById('explore-me-dialog');
  const close = document.getElementById('explore-me-close');

  const openExploreDialog = () => {
    if (!dialog) return;
    document.body.classList.add('explore-dialog-active');
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute('open', '');
  };

  const dismissExploreDialog = () => {
    if (!dialog) return;
    document.body.classList.remove('explore-dialog-active');
    if (dialog.close) dialog.close();
    else dialog.removeAttribute('open');
  };

  trigger?.addEventListener('click', openExploreDialog);
  close?.addEventListener('click', dismissExploreDialog);
  dialog?.addEventListener('click', e => {
    if (e.target === dialog) dismissExploreDialog();
  });
  dialog?.addEventListener('close', () => {
    document.body.classList.remove('explore-dialog-active');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && dialog?.open) dismissExploreDialog();
  });

  window.scrollToSection = function(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    // Trigger reveal on elements inside target section
    target.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));

    // Trigger silicon flow line draw animation if VLSI
    const flowLine = document.getElementById('flow-line');
    if (flowLine && targetSelector === '#vlsi') {
      flowLine.classList.add('draw');
    }

    target.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', targetSelector);
  };

  // Backwards compatibility alias
  window.openExploreSection = window.scrollToSection;

  dialog?.querySelectorAll('.explore-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      const target = choice.dataset.target;
      dismissExploreDialog();
      window.scrollToSection(target);
    });
  });

  // Global smooth scrolling for all anchor links
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      window.scrollToSection(hash);
    }
  });

  // Handle URL hash on page load
  if (location.hash && document.querySelector(location.hash)) {
    setTimeout(() => {
      window.scrollToSection(location.hash);
    }, 150);
  }
});
