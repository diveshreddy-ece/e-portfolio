/**
 * Client testimonials: fills each [data-testimonial] slot from PortfolioData.testimonials.
 * A slot with no quote stays hidden for visitors. With ?drafts in the URL it shows a clearly
 * labelled placeholder instead, so the layout can be reviewed before a real quote arrives.
 * Quotes are never written here: they come only from the data file, verbatim from the client.
 */
(function initTestimonials() {
  const data = (window.PortfolioData && window.PortfolioData.testimonials) || {};
  const drafts = new URLSearchParams(window.location.search).has('drafts');
  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  document.querySelectorAll('[data-testimonial]').forEach((slot) => {
    const t = data[slot.dataset.testimonial];
    if (t && t.quote) {
      slot.className = 'case-quote';
      slot.innerHTML = `<blockquote><p>${escape(t.quote)}</p></blockquote>` +
        `<figcaption><span class="case-quote-name">${escape(t.name || '')}</span>${t.role ? `<span class="case-quote-role">${escape(t.role)}</span>` : ''}</figcaption>`;
      slot.hidden = false;
    } else if (drafts) {
      slot.className = 'gap-slot gap-slot--ink gap-slot--compact case-quote-draft';
      slot.innerHTML = `<span class="gap-label">Draft · not published</span><p>Testimonial slot for ${escape(slot.dataset.client || slot.dataset.testimonial)}. Add the client's exact words to js/data/portfolio-data.js.</p>`;
      slot.hidden = false;
    }
  });
})();
