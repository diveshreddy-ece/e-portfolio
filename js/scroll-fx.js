/**
 * One signal trace through the page (GSAP 3.13: ScrollTrigger, DrawSVGPlugin, SplitText).
 *
 * A thin line in the section's own colour starts beside the name in the hero and draws itself down
 * the left gutter as the visitor scrolls, branching into each section:
 *   hero        load intro (not scroll-driven): the name rises out of its lines, the copy settles,
 *               the stamp lands, the bands rise; then the trace draws in and its start node pulses.
 *   about       a branch reaches "Who I am".
 *   track bands the coloured bands are the signal widening into a track, so the line is absorbed
 *               there rather than drawn over them.
 *   vlsi        the line runs into the flow and becomes its rail; on desktop the flow pins for PIN px
 *               while the rail draws and each stage node fills.
 *   leadership  the line is the event log's progress line; each event's node fills as it passes.
 *   work        the line runs gold down the client cases.
 *   projects    the line runs neutral down the personal builds.
 *   video       the line draws a frame round the featured edit, which opens like a film gate.
 *   contact     the line ends at "Let's work together" in a final node.
 *
 * Architecture
 * - The trace geometry is measured from the real layout and rebuilt on every ScrollTrigger refresh
 *   (fonts, resize, load). Coordinates are relative to <main>.
 * - ONE master timeline holds every scroll-linked piece. Its time unit is "tip position" in px: the
 *   tween for something at y sits at time y, and labels mark each section. A single ScrollTrigger
 *   moves the playhead to the tip (scroll + TIP * viewport) through gsap.quickTo, which is the scrub.
 * - Small entrances that are not on the trace use ScrollTrigger.batch (once, capped per batch).
 * - gsap.matchMedia(): desktop (pin, branches, frame), mobile (left-edge line, no pin), and reduced
 *   motion (trace drawn, nothing hidden, no scrub, no pin). Switching any of them reverts cleanly.
 * - Progressive: hidden starting states are only ever set here. Without GSAP the trace is drawn
 *   statically and every element is visible.
 *
 * Tuning: TIP (where the tip leads), PIN (pin length), SCRUB (catch-up time), BRANCH (branch draw
 * length) below; trace colours and widths are in css/pass.css (".trace").
 */
(function initScrollFx() {
  const TIP = 0.55;     // the tip of the trace sits at 55% of the viewport height
  const PIN = 360;      // px of scroll the VLSI flow stays pinned (desktop)
  const SCRUB = 0.45;   // seconds the trace takes to catch up with the scroll
  const BRANCH = 56;    // px of scroll a branch takes to draw
  const NS = 'http://www.w3.org/2000/svg';

  const root = document.documentElement;
  const main = document.getElementById('main');
  const svg = document.getElementById('trace');
  const pinSvg = document.getElementById('trace-pin');
  const pinBlock = document.getElementById('flow-pin');
  const flow = document.getElementById('vlsi-flow');
  if (!main || !svg) return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const css = getComputedStyle(root);
  const color = (name) => css.getPropertyValue(name).trim();
  const C = { ink: color('--ink'), stock: color('--stock'), vlsi: color('--vlsi'), crew: color('--crew'), work: color('--work'), media: color('--media'), muted: color('--on-ink-muted') };

  /* ---------- Geometry (plain JS, so the static trace works without GSAP) ---------- */
  const mainTop = () => main.getBoundingClientRect().top + window.scrollY;
  // Box of an element in <main> coordinates. Elements inside the pinned block are measured from
  // the pin spacer, so the result is the same whether or not the block is pinned right now.
  const box = (el) => {
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY - mainTop();
    return { top, bottom: top + r.height, left: r.left, right: r.right, width: r.width, height: r.height };
  };
  const pinSpacer = () => (pinBlock && pinBlock.parentElement.classList.contains('pin-spacer') ? pinBlock.parentElement : pinBlock);

  function measure(desktop, pinLength) {
    const hero = box($('#home'));
    const tracks = box($('.tracks'));
    const about = box($('#about'));
    const contentLeft = box($('#about-title')).left;
    const x = desktop ? Math.max(10, Math.round(contentLeft / 2)) : 6;
    const name = box($('.hero-name'));
    const startY = name.top + Math.min(36, name.height / 2);
    const body = (id) => box($(`#${id} .zone-body`));
    const contact = box($('#contact'));
    const cTitle = box($('#contact-title'));
    const endY = cTitle.top + Math.min(32, cTitle.height / 2);

    const segs = [
      { cls: 't-muted', y0: startY, y1: tracks.top, label: 'hero' },
      { cls: 't-muted', y0: tracks.bottom, y1: hero.bottom },
      { cls: 't-ink', y0: about.top, y1: about.bottom, label: 'about' },
      { cls: 't-vlsi', y0: body('vlsi').top, y1: body('vlsi').bottom, label: 'vlsi' },
      { cls: 't-crew', y0: body('leadership').top, y1: body('leadership').bottom, label: 'leadership' },
      ...($('#work .zone-body') ? [{ cls: 't-work', y0: body('work').top, y1: body('work').bottom, label: 'work' }] : []),
      ...($('#projects .zone-body') ? [{ cls: 't-muted', y0: body('projects').top, y1: body('projects').bottom, label: 'projects' }] : []),
      { cls: 't-media', y0: body('video').top, y1: body('video').bottom, label: 'video' },
      { cls: 't-stock', y0: contact.top, y1: endY, label: 'contact' },
    ].filter((s) => s.y1 - s.y0 > 1);

    const nodes = [{ cls: 't-muted', x, y: startY, size: 12, bg: C.ink, lit: C.stock, id: 'start' }];
    const branches = [];
    const aTitle = box($('#about-title'));
    const titleY = aTitle.top + Math.min(30, aTitle.height / 2);
    if (desktop) {
      branches.push({ cls: 't-ink', d: `M${x} ${titleY}H${aTitle.left - 14}`, y: titleY });
      branches.push({ cls: 't-stock', d: `M${x} ${endY}H${cTitle.left - 14}`, y: endY });
    }
    nodes.push({ cls: 't-ink', x: desktop ? aTitle.left - 14 : x, y: titleY, size: 10, bg: C.stock, lit: C.ink });
    const logLeft = $('.log') ? box($('.log')).left : x;
    $$('.log-row').forEach((row) => {
      const y = box(row).top + 30;
      nodes.push({ cls: 't-crew', x, y, size: 10, bg: C.stock, lit: C.crew });
      // Desktop: a short tick reaches each event from the progress line.
      if (desktop) branches.push({ cls: 't-crew', d: `M${x + 5} ${y}H${logLeft - 10}`, y });
    });
    nodes.push({ cls: 't-stock', x: desktop ? cTitle.left - 14 : x, y: endY, size: 14, bg: C.ink, lit: C.stock, id: 'end' });

    // Video: a frame drawn round the featured edit (desktop).
    let frame = null;
    const featured = $('.reel--featured .reel-frame');
    if (desktop && featured) {
      const f = box(featured);
      const o = 10;
      const L = f.left - o, T = f.top - o, R = f.right + o, B = f.bottom + o;
      branches.push({ cls: 't-media', d: `M${x} ${T}H${L}`, y: T - window.innerHeight * 0.35 });
      frame = { el: featured, caption: $('.reel--featured .reel-stub'), T, B, a: `M${L} ${T}H${R}V${B}`, b: `M${L} ${T}V${B}H${R}` };
    }

    // VLSI flow (in <main> coordinates for mobile; in pin-block coordinates for desktop).
    const flowBox = { top: 0, left: 0, height: 0, width: 0 };
    let pin = null;
    if (flow) {
      if (desktop && pinBlock && pinSvg) {
        const spacerTop = box(pinSpacer()).top;
        const wrap = flow.offsetParent; // .flow-pin .wrap
        const fTop = wrap.offsetTop + flow.offsetTop;
        const railY = fTop + 8 + 1.5;
        const railLeft = wrap.offsetLeft + flow.offsetLeft;
        pin = { top: spacerTop, height: pinBlock.offsetHeight, width: pinBlock.offsetWidth, railY, railLeft, railWidth: flow.offsetWidth, length: pinLength,
          nodes: $$('.flow-node', flow).map((n) => (n.closest('.flow-stage').offsetLeft) / flow.offsetWidth) };
      } else {
        const f = box(flow);
        Object.assign(flowBox, { top: f.top, height: f.height });
        flowBox.nodes = $$('.flow-node', flow).map((n) => box(n).top);
        // Phones and tablets: the edge line steps into the rail, the rail carries the signal through
        // the flow, and the line steps back out below it (no second line running alongside the rail).
        const railX = f.left + 8 + 1.5;
        const vi = segs.findIndex((sg) => sg.cls === 't-vlsi');
        if (vi !== -1) {
          const v = segs[vi];
          segs.splice(vi, 1, { ...v, y1: f.top }, { cls: 't-vlsi', y0: f.bottom, y1: v.y1 });
          branches.push({ cls: 't-vlsi', d: `M${x} ${f.top}H${railX}`, y: f.top - BRANCH });
          branches.push({ cls: 't-vlsi', d: `M${railX} ${f.bottom}H${x}`, y: f.bottom - BRANCH / 2 });
        }
      }
    }
    // offsetHeight, not scrollHeight: the latter includes the SVG's own previous (taller) height.
    return { x, width: main.clientWidth, height: main.offsetHeight, segs, nodes, branches, frame, pin, flowBox, startY, endY,
      labels: { hero: startY, about: about.top, vlsi: body('vlsi').top, flow: pin ? pin.top + pin.railY : flowBox.top, leadership: body('leadership').top, ...($('#work .zone-body') ? { work: body('work').top } : {}), ...($('#projects .zone-body') ? { projects: body('projects').top } : {}), video: body('video').top, contact: contact.top, end: endY } };
  }

  // Draw the measured trace into the SVGs. Returns the created elements.
  let pulseEl = null;
  function draw(g) {
    const make = (tag, attrs, parent) => {
      const el = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      parent.appendChild(el);
      return el;
    };
    svg.replaceChildren();
    svg.setAttribute('width', g.width);
    svg.setAttribute('height', g.height);
    const out = { segs: [], branches: [], nodes: [], frame: null, pin: null };
    g.segs.forEach((s) => out.segs.push({ ...s, el: make('path', { class: s.cls, d: `M${g.x} ${s.y0}V${s.y1}` }, svg) }));
    g.branches.forEach((b) => out.branches.push({ ...b, el: make('path', { class: b.cls, d: b.d }, svg) }));
    if (g.frame) {
      out.frame = { ...g.frame, pa: make('path', { class: 't-media', d: g.frame.a }, svg), pb: make('path', { class: 't-media', d: g.frame.b }, svg) };
    }
    g.nodes.forEach((n) => {
      const h = n.size / 2;
      const attrs = { class: `t-node ${n.cls}`, x: n.x - h, y: n.y - h, width: n.size, height: n.size, fill: n.lit };
      const el = make('rect', attrs, svg);
      const node = { ...n, el };
      if (n.id === 'start') {
        // One persistent pulse element, so a rebuild during the intro never orphans its tween.
        pulseEl = pulseEl || document.createElementNS(NS, 'rect');
        Object.entries({ class: `t-pulse ${n.cls}`, x: n.x - h, y: n.y - h, width: n.size, height: n.size }).forEach(([k, v]) => pulseEl.setAttribute(k, v));
        svg.appendChild(pulseEl);
        node.pulse = pulseEl;
      }
      out.nodes.push(node);
    });
    if (pinSvg) {
      pinSvg.replaceChildren();
      if (g.pin) {
        const p = g.pin;
        pinSvg.setAttribute('width', p.width);
        pinSvg.setAttribute('height', p.height);
        out.pin = {
          upper: make('path', { class: 't-vlsi', d: `M${g.x} 0V${p.railY}` }, pinSvg),
          lead: make('path', { class: 't-vlsi', d: `M${g.x} ${p.railY}H${p.railLeft}` }, pinSvg),
          lower: make('path', { class: 't-vlsi', d: `M${g.x} ${p.railY}V${p.height}` }, pinSvg),
        };
      }
    }
    return out;
  }

  /* ---------- Without GSAP: a static trace, nothing hidden ---------- */
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger || !window.DrawSVGPlugin) {
    const paint = () => draw(measure(window.matchMedia('(min-width: 861px)').matches, 0));
    paint();
    window.addEventListener('load', paint);
    window.addEventListener('resize', () => { clearTimeout(paint.t); paint.t = setTimeout(paint, 200); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, window.DrawSVGPlugin, ...(window.SplitText ? [window.SplitText] : []));
  ScrollTrigger.config({ ignoreMobileResize: true });
  const heroClaimed = root.classList.contains('hero-anim') && !root.classList.contains('hero-go');
  if (heroClaimed) root.classList.add('hero-fx'); // the CSS fallback entrance stands down
  let introDone = !heroClaimed;
  let introRunning = false;
  let introScroll = 0;
  let introTrace = null;

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 861px)', mobile: '(max-width: 860px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { desktop, reduce } = ctx.conditions;

    /* ----- Reduced motion: the trace fully drawn, nothing hidden, no scrub, no pin ----- */
    if (reduce) {
      // ScrollTrigger re-applies an inline `scroll-behavior: smooth` after each refresh when the page
      // was smooth at startup; clear it so the stylesheet's reduced-motion rule (instant) wins.
      const instant = () => root.style.removeProperty('scroll-behavior');
      const paint = () => { draw(measure(desktop, 0)); requestAnimationFrame(instant); };
      instant();
      paint();
      ScrollTrigger.addEventListener('refresh', paint);
      return () => { ScrollTrigger.removeEventListener('refresh', paint); svg.replaceChildren(); pinSvg?.replaceChildren(); };
    }

    /* ----- Pin (desktop): the flow holds while the trace becomes its rail ----- */
    const railOffset = () => {
      const wrap = flow.offsetParent;
      return wrap.offsetTop + flow.offsetTop + 9.5;
    };
    const pinST = desktop && pinBlock && flow ? ScrollTrigger.create({
      trigger: pinBlock,
      pin: true,
      start: () => `top+=${railOffset()} ${TIP * 100}%`,
      end: `+=${PIN}`,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    }) : null;

    /* ----- Entrances off the trace: batched, once ----- */
    const FROM = { title: { y: 28 }, rise: { y: 18 }, print: { x: -24 }, stub: { x: -16 }, chip: { scale: 0.9 }, card: { y: 18 }, log: { y: 14 }, frame: { scale: 0.96 } };
    const onTrace = desktop ? $('.reel--featured') : null;
    const pending = $$('[data-reveal]').filter((el) => el !== onTrace && el.getBoundingClientRect().top > window.innerHeight);
    pending.forEach((el) => {
      gsap.set(el, { opacity: 0, ...FROM[el.dataset.reveal] });
      el.classList.add('fx-pending');
    });
    const shown = (el) => el.classList.remove('fx-pending');
    const showNow = (els) => { gsap.killTweensOf(els); gsap.set(els, { opacity: 1, x: 0, y: 0, scale: 1 }); els.forEach(shown); };
    const enter = (els) => {
      const passed = els.filter((el) => el.getBoundingClientRect().bottom < 0); // carried past by a jump
      const live = els.filter((el) => !passed.includes(el));
      if (passed.length) showNow(passed);
      if (!live.length) return;
      const tl = gsap.timeline({ defaults: { duration: 0.7, ease: 'power3.out' } });
      live.forEach((el, i) => {
        tl.to(el, { opacity: 1, x: 0, y: 0, scale: 1, onStart: () => shown(el) }, i * 0.08);
        if (el.dataset.reveal === 'card') tl.from($('.pstub-tab', el), { scaleY: 0, transformOrigin: 'top', duration: 0.5 }, i * 0.08 + 0.18);
      });
    };
    ScrollTrigger.batch(pending, { start: 'top 88%', once: true, interval: 0.1, batchMax: desktop ? 6 : 4, onEnter: enter });
    const onFocus = (e) => {
      const el = e.target.closest?.('.fx-pending');
      if (el) showNow([el]);
      // Focus inside the featured edit opens its gate at once (the timeline no longer owns it).
      if (frameTween && e.target.closest?.('.reel--featured')) {
        const target = frameTween.targets()[0];
        master.remove(frameTween);
        frameTween.kill();
        frameTween = null;
        gsap.set(target, { clipPath: 'none' });
      }
    };
    document.addEventListener('focusin', onFocus);

    /* ----- The master timeline: everything on the trace, positioned by tip (px) ----- */
    let master = gsap.timeline({ paused: true });
    let frameTween = null;
    let geo = null;
    const tipNow = () => window.scrollY + window.innerHeight * TIP - mainTop();
    const proxy = { t: 0 };
    const render = () => master.time(Math.max(0, proxy.t));
    const toTip = gsap.quickTo(proxy, 't', { duration: SCRUB, ease: 'power3', onUpdate: render });

    function rebuild() {
      const pinLength = pinST ? pinST.end - pinST.start : 0;
      geo = measure(desktop, pinLength);
      const els = draw(geo);
      master.kill();
      master = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      Object.entries(geo.labels).forEach(([name, y]) => master.addLabel(name, Math.max(0, y)));
      const at = (y) => Math.max(0, y);

      els.segs.forEach((s) => master.fromTo(s.el, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: s.y1 - s.y0 }, at(s.y0)));
      els.branches.forEach((b) => master.fromTo(b.el, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: BRANCH }, at(b.y)));
      els.nodes.forEach((n) => master.fromTo(n.el, { attr: { fill: n.bg } }, { attr: { fill: n.lit }, duration: 14 }, at(n.y - 7)));

      if (els.frame) {
        const f = els.frame;
        // The gate is closed (a slit) until the reel enters, opens while its top rises from ~90% of the
        // viewport to the tip line, and the frame lines draw round it as it opens. Arriving by a nav
        // jump, the tip is already past the frame top, so the gate is open.
        const open = window.innerHeight * 0.35;
        master.fromTo([f.pa, f.pb], { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: open * 1.3 }, at(f.T - open));
        frameTween = gsap.fromTo(f.el, { clipPath: 'inset(48% 0% 48% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: open, ease: 'power2.inOut' });
        master.add(frameTween, at(f.T - open));
        if (f.caption) master.fromTo(f.caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 90 }, at(f.T - 40));
      }

      // VLSI flow: the line becomes the rail and each stage node fills as the rail reaches it.
      const nodesEls = $$('.flow-node', flow || document.createElement('i'));
      if (els.pin && geo.pin) {
        const p = geo.pin;
        const start = p.top + p.railY; // tip at the rail = pin start
        master.fromTo(els.pin.upper, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: p.railY }, at(p.top));
        master.fromTo(els.pin.lead, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: PIN * 0.16 }, at(start));
        const railStart = start + PIN * 0.14, railDur = PIN * 0.76;
        master.fromTo(flow, { '--rail': 0 }, { '--rail': 1, duration: railDur }, at(railStart));
        nodesEls.forEach((n, i) => master.fromTo(n, { backgroundColor: C.stock }, { backgroundColor: C.vlsi, duration: 10 }, at(railStart + (p.nodes[i] || 0) * railDur - 4)));
        master.fromTo(els.pin.lower, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: p.height - p.railY }, at(p.top + p.length + p.railY));
      } else if (flow && geo.flowBox.height) {
        const fb = geo.flowBox;
        master.fromTo(flow, { '--rail': 0 }, { '--rail': 1, duration: fb.height }, at(fb.top));
        nodesEls.forEach((n, i) => master.fromTo(n, { backgroundColor: C.stock }, { backgroundColor: C.vlsi, duration: 10 }, at(fb.nodes[i] - 4)));
      }
      master.set({}, {}, Math.max(geo.height, master.duration()) + 1);

      const startNode = els.nodes.find((n) => n.id === 'start');
      // During the intro the intro owns the playhead; otherwise it follows the tip.
      if (!introRunning) proxy.t = introDone ? tipNow() : geo.startY;
      render();
      if (!introDone) playIntro(startNode);
      window.__trace = { master, geo, seek: (label) => master.time(master.labels[label] ?? 0) };
    }

    /* ----- Hero intro (load, not scroll-driven), once per page load ----- */
    function playIntro(startNode) {
      introDone = true;
      introRunning = true;
      introScroll = window.scrollY;
      const items = { name: $('.hero-name'), line: $('.hero-line'), stamp: $('.stamp'), stubs: $$('.hero .stubs .stub'), tracks: $$('.track') };
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => { if (introRunning) { introRunning = false; toTip(tipNow()); } } });
      gsap.set([items.name, items.line, items.stamp, ...items.stubs, ...items.tracks], { opacity: 0 });
      let fontsReady = false;
      const go = () => {
        intro.addLabel('name', 0);
        // Split only with the real fonts in place (lines depend on them); otherwise a plain fade.
        if (window.SplitText && fontsReady) {
          gsap.set(items.name, { opacity: 1 });
          window.SplitText.create(items.name, { type: 'lines', mask: 'lines', autoSplit: true,
            onSplit: (self) => gsap.from(self.lines, { yPercent: 105, duration: 0.9, stagger: 0.09, ease: 'expo.out' }) });
          const words = window.SplitText.create(items.line, { type: 'words', aria: 'none' }); // a <p> may not carry aria-label; the words stay plain text
          intro.set(items.line, { opacity: 1 }, 0.15)
            .from(words.words, { opacity: 0, y: 8, duration: 0.6, stagger: 0.012, ease: 'power3.out' }, 0.15);
        } else {
          intro.to(items.name, { opacity: 1, duration: 0.6 }, 0).to(items.line, { opacity: 1, duration: 0.6 }, 0.15);
        }
        intro.addLabel('stamp', 0.35)
          .fromTo(items.stamp, { opacity: 0, scale: 1.35, rotation: -7 }, { opacity: 1, scale: 1, rotation: -1.5, duration: 0.55, ease: 'back.out(1.6)' }, 'stamp')
          .fromTo(items.stubs, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, 'stamp+=0.08')
          .addLabel('bands', 0.3)
          .fromTo(items.tracks, desktop ? { opacity: 1, yPercent: 100 } : { opacity: 0, y: 24 }, { opacity: 1, yPercent: 0, y: 0, duration: 0.75, stagger: 0.07, ease: 'expo.out' }, 'bands')
          .addLabel('trace', 0.7)
          // The trace draws in from its start node to the tip, then the node pulses twice.
          .add(introTrace = gsap.fromTo(proxy, { t: geo.startY }, { t: () => tipNow(), duration: 1.1, ease: 'power2.inOut', onUpdate: render, immediateRender: false }), 'trace')
          .fromTo(startNode.pulse, { opacity: 0.8, scale: 1 }, { opacity: 0, scale: 2.6, duration: 1, ease: 'power2.out', repeat: 1, repeatDelay: 0.2, immediateRender: false }, 'trace+=0.9');
      };
      const fonts = document.fonts ? document.fonts.ready.then(() => { fontsReady = document.fonts.status === 'loaded'; }) : Promise.resolve();
      Promise.race([fonts, new Promise((r) => setTimeout(r, 500))]).then(go, go);
    }

    // The playhead follows the tip. While the hero intro owns it, the first real scroll takes it back
    // (the intro's draw-in stops and the trace scrubs from wherever it was).
    const follow = () => {
      if (!introDone) return;
      if (introRunning) {
        if (Math.abs(window.scrollY - introScroll) < 4) return;
        introRunning = false;
        introTrace?.kill();
      }
      toTip(tipNow());
    };
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: follow });
    // Safety net: the browser can adjust the scroll after a refresh (fragment loads, scroll anchoring)
    // without an update; re-sync the playhead whenever scrolling settles.
    const resync = follow;
    ScrollTrigger.addEventListener('scrollEnd', resync);
    ScrollTrigger.addEventListener('refresh', rebuild);
    ScrollTrigger.refresh(); // first build (the 'refresh' event runs rebuild)
    const onPrint = () => { showNow(pending); master.progress(1); };
    window.addEventListener('beforeprint', onPrint);

    return () => {
      ScrollTrigger.removeEventListener('refresh', rebuild);
      ScrollTrigger.removeEventListener('scrollEnd', resync);
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('beforeprint', onPrint);
      master.revert();
      pending.forEach(shown);
      svg.replaceChildren();
      pinSvg?.replaceChildren();
      flow?.style.removeProperty('--rail');
    };
  });

  // Layout changes ScrollTrigger cannot see: web fonts. (Every image in <main> has fixed dimensions
  // or sits in an aspect-ratio frame, so late images never move the layout. Refreshing on image load
  // would also cancel a smooth anchor scroll in progress, since a refresh resets the scroll position.)
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  // A refresh while the page loads resets the scroll position, which can cancel the browser's smooth
  // scroll to a #fragment. Once loading and fonts have settled, land on the fragment if we are not there.
  let userScrolled = false; // once the visitor scrolls by hand, never move them
  const byHand = () => { userScrolled = true; };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((t) => window.addEventListener(t, byHand, { once: true, passive: true }));
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
  Promise.all([loaded, document.fonts ? document.fonts.ready : null]).then(() => requestAnimationFrame(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    if (!userScrolled && Math.abs(target.getBoundingClientRect().top - padding) > 8) target.scrollIntoView({ behavior: 'instant', block: 'start' });
  }));
})();
