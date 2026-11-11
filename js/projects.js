/**
 * VLSI & Digital Design Projects Module
 * Handles project card generation, interactive modal view, and keyboard traps.
 */
(function initProjects() {
  const data = window.PortfolioData ? window.PortfolioData.vlsiProjects : (typeof vlsiProjects !== 'undefined' ? vlsiProjects : []);
  const vlsiGrid = document.getElementById('vlsi-projects');
  const projectModal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close');

  if (!vlsiGrid || !projectModal) return;

  function openProjectModal(p) {
    const titleEl = document.getElementById('modal-title');
    const tagsEl = document.getElementById('modal-tags');
    const bodyEl = document.getElementById('modal-body');
    const linksEl = document.getElementById('modal-links');

    if (titleEl) titleEl.textContent = p.name;
    if (tagsEl) {
      tagsEl.innerHTML = p.tags.map(t =>
        `<span class="text-[10px] font-mono font-semibold text-vlsi-700 bg-vlsi-50 px-2 py-1 rounded-md border border-vlsi-100">${t}</span>`
      ).join('');
    }
    if (bodyEl) {
      bodyEl.innerHTML = `
        <div><h4 class="font-semibold text-white mb-1">Problem</h4><p>${p.problem}</p></div>
        <div><h4 class="font-semibold text-white mb-1">Architecture</h4><p>${p.architecture}</p></div>
        <div><h4 class="font-semibold text-white mb-1">Implementation</h4><p>${p.implementation}</p></div>
        <div><h4 class="font-semibold text-white mb-1">Verification</h4><p>${p.verification}</p></div>
        <div><h4 class="font-semibold text-white mb-1">What I learned</h4><p>${p.learning}</p></div>
        <p class="text-xs font-mono text-ink-faint pt-2 border-t border-line">Diagrams and waveform screenshots to be added.</p>`;
    }
    if (linksEl) {
      linksEl.innerHTML = `
        <a href="https://github.com/diveshreddy-ece" target="_blank" rel="noopener noreferrer" class="px-5 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold">GitHub</a>
        <button data-close class="px-5 py-2.5 rounded-full border border-line text-sm font-semibold text-white">Close</button>`;
    }

    document.body.classList.add('modal-open');
    projectModal.showModal();

    projectModal.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        projectModal.close();
        document.body.classList.remove('modal-open');
      });
    });
  }

  // Render project cards
  data.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'card glow-cyan p-6 flex flex-col justify-between reveal cursor-pointer';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${p.name} project details`);
    card.style.transitionDelay = (i * 0.05) + 's';
    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex flex-wrap gap-2">${p.tags.map(t => `<span class="text-[10px] font-mono font-semibold text-vlsi-700 bg-vlsi-50 px-2 py-1 rounded-md border border-vlsi-100">${t}</span>`).join('')}</div>
        <h3 class="font-bold text-white">${p.name}</h3>
        <p class="text-sm text-ink-muted leading-relaxed">${p.blurb}</p>
      </div>
      <div class="pt-4 mt-4 border-t border-line flex items-center justify-between text-xs font-semibold text-vlsi-600">
        <span class="font-mono text-ink-faint">View details</span><span>→</span>
      </div>`;

    card.addEventListener('click', () => openProjectModal(p));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProjectModal(p);
      }
    });

    vlsiGrid.appendChild(card);
  });

  // Modal dismiss events
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      projectModal.close();
      document.body.classList.remove('modal-open');
    });
  }

  projectModal.addEventListener('click', (e) => {
    if (e.target.id === 'project-modal') {
      projectModal.close();
      document.body.classList.remove('modal-open');
    }
  });

  projectModal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
  });

  window.openProjectModal = openProjectModal;
})();
