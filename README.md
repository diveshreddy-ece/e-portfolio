# Divesh Reddy — Portfolio

A responsive single-page portfolio built with HTML, generated Tailwind CSS, and vanilla JavaScript, bundled with Vite.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

The generated Tailwind stylesheet (`css/tailwind.generated.css`) is checked in, so any static server (for example VS Code's Live Server, or `python3 -m http.server 5500`) also works without a build step. After changing Tailwind classes or the theme, run `npm run build:css`.

## Build and deploy

```bash
npm run build
```

This regenerates the Tailwind CSS, bundles the page into `dist/`, and copies and minifies `js/` and `assets/` alongside it. `dist/` is not committed; let the host build it:

| Host | Build command | Output directory |
| --- | --- | --- |
| Vercel / Netlify / Cloudflare Pages | `npm run build` | `dist` |

To run Lighthouse against the production output, run `npm run preview` and audit http://localhost:4173 rather than the dev server.

Once the site has a domain, add `og:url` and an `og:image` (absolute URLs) to the link-preview tags in `index.html`.

## Project structure

```text
divesh-portfolio/
├── index.html               # page markup
├── vite.config.mjs          # build: copies + minifies js/ and assets/ into dist/
├── tailwind.config.cjs      # theme colours (navy, vlsi, lead, vid, ink, line, surface)
├── css/
│   ├── tailwind.css             # Tailwind entry
│   ├── tailwind.generated.css   # generated, checked in
│   ├── nebula-theme.css         # dark nebula theme overrides
│   └── base / typography / components / cursor / explore / lanyard / event-gallery .css
├── js/
│   ├── data/portfolio-data.js   # projects, leadership timeline, event gallery content
│   ├── ui.js                    # navbar, scroll progress, reveal, active nav link
│   ├── projects.js              # VLSI project cards + modal
│   ├── leadership.js, event-gallery.js, video.js, explore.js
│   ├── nebula-bg.js             # WebGL halftone background
│   ├── lanyard.js               # 3D lanyard (React + three.js from CDN)
│   └── robot.js, cursor.js, hero-proximity.js
└── assets/
    ├── favicon.svg
    ├── resume-rtl-design.pdf
    └── resume-graphic-design.pdf
```

## Colour classes

The site is dark-only. Use the theme tokens rather than Tailwind's default light palette:

- Text: `text-white`, `text-ink-bright`, `text-ink-soft`, `text-ink-muted`, `text-ink-faint`
- Borders: `border-line`
- Panels: `bg-surface`, `bg-surface-raised`

## Performance notes

- `js/nebula-bg.js` renders in two passes: the FBM noise field is evaluated once per 6px halftone cell into a small offscreen texture, then a cheap per-pixel pass draws the dots, stars, vignette and grain. Output matches the original single-pass shader (kept as an automatic fallback). Shaders compile in the background via `KHR_parallel_shader_compile`.
- The Spline robot's render loop is paused while its section is off-screen and resumed when it returns (`js/robot.js`).
- React, ReactDOM, three.js and `js/lanyard.js` are injected as ordered `async=false` scripts so they no longer block first paint or `DOMContentLoaded`; the lanyard compiles its shaders with `renderer.compileAsync`.
- The custom cursor moves with `transform`, sleeps when settled, and caches section bounds. Hero letter positions are cached in document coordinates. Scroll-driven UI updates are batched per animation frame.
- Avoid adding Tailwind class names (e.g. "rounded") to comments in `js/`: Tailwind scans those files and would generate the class.

## Notes

- Cloudinary videos and matching poster frames are loaded as they approach the viewport; video delivery is capped to the displayed dimensions.
- The Spline viewer loads from a CDN as its section approaches the viewport.
- Motion respects reduced-motion preferences.
- Verify all project descriptions, internship dates, contact details, and social links before publishing.
