/**
 * Leadership: renders the Digital Nexus event log from portfolio-data.js.
 */
(function initLeadership() {
  const events = (window.PortfolioData && window.PortfolioData.leadershipEvents) || [];
  const log = document.getElementById('leadership-timeline');
  if (!log || !events.length) return;

  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  events.forEach((ev) => {
    const row = document.createElement('li');
    row.className = 'log-row';
    row.dataset.reveal = 'log'; // entrance handled by js/scroll-fx.js
    row.innerHTML = `
      <span class="log-year">${ev.year ? escape(ev.year) : ''}</span>
      <h4 class="log-name">${escape(ev.name)}</h4>
      <span class="log-role">${escape(ev.role)}</span>
      <p class="log-desc">${escape(ev.desc)}</p>`;
    log.appendChild(row);
  });
})();
