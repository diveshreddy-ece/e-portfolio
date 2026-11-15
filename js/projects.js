/**
 * VLSI projects: renders each project as a credential stub (digital design first, then
 * embedded builds) and opens its write-up in the project sheet dialog.
 */
(function initProjects() {
  const data = (window.PortfolioData && window.PortfolioData.vlsiProjects) || [];
  const digitalGrid = document.getElementById('vlsi-digital');
  const embeddedGrid = document.getElementById('vlsi-embedded');
  const modal = document.getElementById('project-modal');
  if (!digitalGrid || !embeddedGrid || !modal || !data.length) return;

  const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isEmbedded = (p) => p.tags.includes('Arduino');
  // Most advanced digital work first; embedded builds after.
  const digitalOrder = ['UART Transmitter & Receiver', 'Traffic Light Controller', '4-bit ALU'];
  const rank = (p) => { const i = digitalOrder.indexOf(p.name); return i === -1 ? digitalOrder.length : i; };
  const digital = data.filter((p) => !isEmbedded(p))
    .sort((a, b) => rank(a) - rank(b));
  const embedded = data.filter(isEmbedded);

  const tagList = (tags) => tags.map((t) => `<span class="tag">${escape(t)}</span>`).join('');

  // A project's visual evidence: simulation waveforms (RTL) or build photos (hardware).
  const mediaOf = (p) => {
    if (p.waveforms && p.waveforms.length) return { items: p.waveforms, one: 'Simulation waveform', many: 'Simulation waveforms', fit: 'contain' };
    if (p.photos && p.photos.length) return { items: p.photos, one: 'Build photo', many: 'Build photos', fit: 'cover' };
    return null;
  };

  // Cards show a small copy (thumb) when one exists; the write-up keeps the full-size original.
  const cardImage = (item) => item.thumb || item;

  let lastTrigger = null;

  function closeModal() {
    if (modal.open) modal.close();
  }

  function openProjectModal(p, trigger) {
    lastTrigger = trigger || document.activeElement;
    document.getElementById('modal-id').textContent = isEmbedded(p) ? 'Embedded build' : 'Digital design';
    document.getElementById('modal-title').textContent = p.name;
    document.getElementById('modal-tags').innerHTML = tagList(p.tags);
    const section = (label, text) => `<div><h4>${label}</h4><p>${escape(text)}</p></div>`;
    document.getElementById('modal-body').innerHTML =
      section('Problem', p.problem) +
      section('Architecture', p.architecture) +
      section('Implementation', p.implementation) +
      section('Verification', p.verification) +
      section('What I learned', p.learning) +
      (mediaOf(p)
        ? `<div><h4>${mediaOf(p).items.length > 1 ? mediaOf(p).many : mediaOf(p).one}</h4><div class="sheet-figures">${mediaOf(p).items.map((w) =>
            `<figure class="sheet-figure"><a href="${escape(w.src)}" target="_blank" rel="noopener"><img src="${escape(w.src)}" width="${w.width}" height="${w.height}" alt="${escape(w.alt)}" loading="lazy" decoding="async"></a><figcaption>${escape(w.caption)}</figcaption></figure>`).join('')}</div></div>`
        : `<div class="gap-slot gap-slot--compact"><span class="gap-label">Not yet published</span><p>Diagrams and waveform screenshots for this project.</p></div>`);
    document.getElementById('modal-links').innerHTML =
      (p.repo
        ? `<a href="${escape(p.repo)}" target="_blank" rel="noopener noreferrer" class="btn btn--solid">View code on GitHub</a>`
        : `<a href="https://github.com/diveshreddy-ece" target="_blank" rel="noopener noreferrer" class="btn btn--solid">GitHub profile</a>`) +
      `<button type="button" class="btn" data-close>Close</button>`;
    modal.querySelector('[data-close]').addEventListener('click', closeModal);
    document.body.classList.add('modal-open');
    modal.showModal();
  }

  function render(list, grid, kind) {
    list.forEach((p) => {
      const card = document.createElement('button');
      card.type = 'button';
      const media = mediaOf(p);
      card.className = `pstub pstub--${kind}${media ? ` pstub--wave pstub--${media.fit}` : ''}`;
      card.setAttribute('aria-haspopup', 'dialog');
      card.dataset.reveal = 'card'; // entrance handled by js/scroll-fx.js
      card.innerHTML = `
        <span class="pstub-tab" aria-hidden="true"></span>
        <span class="pstub-body">${media ? `
          <span class="pstub-wave"><img${media.items[0].focus ? ` style="object-position:${escape(media.items[0].focus)}"` : ''} src="${escape(cardImage(media.items[0]).src)}" width="${cardImage(media.items[0]).width}" height="${cardImage(media.items[0]).height}" alt="" loading="lazy" decoding="async"><span class="pstub-wave-label">${media.items.length > 1 ? `${media.many} · ${media.items.length}` : media.one}</span></span>` : ''}
          <span class="pstub-name">${escape(p.name)}</span>
          <span class="pstub-blurb">${escape(p.blurb)}</span>
          <span class="tags">${tagList(p.tags)}</span>
          <span class="pstub-more">${p.waveforms ? 'Read the write-up and waveforms' : p.photos ? 'Read the write-up and see the build' : 'Read the write-up'}<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>
        </span>`;
      card.addEventListener('click', () => openProjectModal(p, card));
      grid.appendChild(card);
    });
  }

  render(digital, digitalGrid, 'digital');
  render(embedded, embeddedGrid, 'embedded');

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    lastTrigger?.focus?.();
  });

  window.openProjectModal = openProjectModal;
})();
