/**
 * Leadership & Journey Module
 * Renders the community leadership timeline and student journey milestone list.
 */
(function initLeadership() {
  const events = window.PortfolioData ? window.PortfolioData.leadershipEvents : (typeof leadershipEvents !== 'undefined' ? leadershipEvents : []);
  const journeyItems = window.PortfolioData ? window.PortfolioData.journey : (typeof journey !== 'undefined' ? journey : []);

  // Render leadership events timeline
  const timelineEl = document.getElementById('leadership-timeline');
  if (timelineEl && Array.isArray(events)) {
    events.forEach((ev, i) => {
      const item = document.createElement('div');
      item.className = 'relative reveal';
      item.style.transitionDelay = (i * 0.05) + 's';
      item.innerHTML = `
        <div class="absolute -left-8 sm:-left-10 top-1 w-4 h-4 rounded-full bg-lead-500 border-4 border-white ring-1 ring-lead-200"></div>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          ${ev.year ? `<span class="text-xs font-mono font-semibold text-lead-500">${ev.year}</span>` : ''}
          <h3 class="font-bold text-white">${ev.name}</h3>
          <span class="text-xs font-mono text-ink-faint">${ev.role}</span>
        </div>
        <p class="text-sm text-ink-muted mt-1 max-w-xl">${ev.desc}</p>`;
      timelineEl.appendChild(item);
    });
  }

  // Render journey milestones
  const journeyList = document.getElementById('journey-list');
  if (journeyList && Array.isArray(journeyItems)) {
    journeyItems.forEach((step, i) => {
      const li = document.createElement('li');
      li.className = 'reveal flex items-center gap-4';
      li.style.transitionDelay = (i * 0.04) + 's';
      li.innerHTML = `
        <span class="w-8 h-8 shrink-0 rounded-full bg-navy-900 text-white text-xs font-mono font-semibold flex items-center justify-center">${i + 1}</span>
        <span class="font-medium text-white">${step}</span>`;
      journeyList.appendChild(li);
    });
  }
})();
