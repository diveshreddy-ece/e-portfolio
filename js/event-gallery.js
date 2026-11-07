/**
 * Digital Nexus Event Showcase Carousel
 * Handles photo deck transitions, copy updates, and navigation controls.
 */
document.addEventListener('DOMContentLoaded', () => {
  const events = window.PortfolioData ? window.PortfolioData.eventGallery : (typeof eventGallery !== 'undefined' ? eventGallery : []);
  if (!events || !events.length) return;

  let active = 0;
  const card = document.getElementById('event-photo-active');
  const title = document.getElementById('event-title');
  const overlayTitle = document.getElementById('event-photo-title');
  const description = document.getElementById('event-description');
  const counter = document.getElementById('event-counter');
  const note = document.getElementById('event-gallery-note');
  const prevBtn = document.getElementById('event-prev');
  const nextBtn = document.getElementById('event-next');

  if (!card || !title) return;

  function render() {
    const item = events[active];
    card.classList.add('is-changing');

    window.setTimeout(() => {
      if (item.image) {
        card.innerHTML = `<img src="${item.image}" alt="${item.alt}" loading="lazy"><div class="event-photo-overlay"><span class="event-photo-kicker">COMMUNITY MOMENTS</span><strong id="event-photo-title">${item.name}</strong></div>`;
      } else {
        card.innerHTML = `<div class="event-photo-placeholder"><span>${String(active + 1).padStart(2, '0')}</span><small>COMMUNITY EVENT ARCHIVE</small></div><div class="event-photo-overlay"><span class="event-photo-kicker">COMMUNITY ARCHIVE</span><strong id="event-photo-title">${item.name}</strong></div>`;
      }

      title.textContent = item.name;
      if (overlayTitle) overlayTitle.textContent = item.name;
      if (description) description.textContent = item.desc;
      if (counter) counter.innerHTML = `0${active + 1} <span>/ 0${events.length}</span> · ${item.name.toUpperCase()}`;
      if (note) {
        note.textContent = item.real
          ? 'Event photograph from student community session.'
          : 'More event photos can be added to complete this gallery.';
      }
      card.classList.remove('is-changing');
    }, 140);
  }

  prevBtn?.addEventListener('click', () => {
    active = (active - 1 + events.length) % events.length;
    render();
  });

  nextBtn?.addEventListener('click', () => {
    active = (active + 1) % events.length;
    render();
  });

  // Keyboard navigation when gallery controls are focused
  card.setAttribute('tabindex', '0');
  card.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      active = (active - 1 + events.length) % events.length;
      render();
    } else if (e.key === 'ArrowRight') {
      active = (active + 1) % events.length;
      render();
    }
  });

  render();
});
