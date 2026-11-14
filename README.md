# Sai Divesh Reddy Karri — Portfolio

A responsive single-page portfolio built with HTML, one hand-written stylesheet (`css/pass.css`), and vanilla JavaScript, bundled with Vite. The design is an all-access event pass: a draggable 3D pass in the hero and four track colours (VLSI blue, Crew orange, Freelance gold, Media green) that lead into each side of the work, plus a Projects section for personal builds. See `DESIGN.md` for the design system.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

No build step is needed to view the page: any static server (for example VS Code's Live Server, or `python3 -m http.server 5500`) works directly on the project folder.

## Build and deploy

```bash
npm run build
```

This bundles the page into `dist/`, and copies and minifies `js/` and `assets/` alongside it. `dist/` is not committed; let the host build it:

| Host | Build command | Output directory |
| --- | --- | --- |
| Vercel / Netlify / Cloudflare Pages | `npm run build` | `dist` |

To run Lighthouse against the production output, run `npm run preview` and audit http://localhost:4173 rather than the dev server.

Once the site has a domain, add `og:url` and an `og:image` (absolute URLs) to the link-preview tags in `index.html`.

## Project structure

```text
divesh-portfolio/
├── index.html               # page markup
├── PRODUCT.md / DESIGN.md   # product truth and design system
├── vite.config.mjs          # build: copies + minifies js/ and assets/ into dist/
├── css/
│   └── pass.css                 # the whole stylesheet: tokens, layout, components
├── js/
│   ├── data/portfolio-data.js   # VLSI/embedded projects (with waveforms and photos) and the event log
│   ├── ui.js                    # mobile drawer, back-to-top, active track in the nav strip
│   ├── scroll-fx.js             # the signal trace: GSAP intro, scrubbed trace, VLSI pin, batched entrances
│   ├── explore.js               # the four track bands (Explore paths): punch, nudge the pass, scroll
│   ├── projects.js              # VLSI project stubs + write-up dialog
│   ├── leadership.js            # Digital Nexus event log
│   ├── video.js                 # reels and films: lazy posters, hover preview, one with sound at a time
│   ├── pass-loader.js           # imports three.js r170 (ES module) for the pass, then runs lanyard.js
│   └── lanyard.js               # 3D access pass on a lanyard (React + three.js from CDN)
├── assets/
│   ├── portrait.jpg             # pass portrait (used by the 3D pass and the static fallback)
│   ├── fonts/                   # self-hosted Barlow, Barlow Condensed, JetBrains Mono (woff2)
│   ├── freelance/               # client films + posters (Freelancing section)
│   ├── projects/                # personal project films + posters (Projects section)
│   ├── vlsi/                    # UART and ALU simulation waveforms
│   ├── embedded/                # build photos: robotic arm, smart radar
│   ├── leadership/              # event photos and the Creovate award
│   ├── favicon.svg
│   ├── resume-rtl-design.pdf
│   └── resume-graphic-design.pdf
└── source-videos/               # full-resolution video masters (git-ignored, not deployed)
```

### Adding a film

Put the master in `source-videos/`, then make a 720p web copy and a poster next to the others:

```bash
ffmpeg -i source-videos/name.mp4 -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow -crf 26 \
  -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart assets/projects/name.mp4
ffmpeg -ss 5 -i source-videos/name.mp4 -frames:v 1 -vf "scale='min(1280,iw)':-2" -q:v 4 assets/projects/name.jpg
```

Photos: strip metadata (phone photos can carry GPS) with `ffmpeg -i in.jpg -map_metadata -1 -q:v 3 out.jpg`.


## Performance notes

- The only WebGL on the page is the 3D pass. `index.html` loads React and ReactDOM (SRI-pinned) without blocking first paint, then `js/pass-loader.js` imports three.js r170 as an ES module (preloaded with an SRI hash), exposes it as `window.THREE`, and runs `js/lanyard.js`. Nothing is downloaded when the visitor has Save-Data on or the browser cannot create a WebGL context; a static HTML pass shows until the 3D pass is ready and stays if WebGL or the CDN is unavailable.
- The pass sways for a few seconds after it wakes (intro, drag, track punch, scrolling back into view), then its render loop rests. It also stops while off-screen; shaders compile with `renderer.compileAsync`.
- Fonts are self-hosted woff2 (latin subset), the two first-paint faces are preloaded.
- Videos never autoplay. Posters load as the video zone approaches; a video file loads only on hover preview or play.
- The build uses relative URLs (`base: './'`), so `dist/` works from the domain root or a subfolder, and the static-file copy step follows `--outDir`.

## Notes

- Video delivery from Cloudinary is capped to the displayed dimensions. Freelance and project films are self-hosted 720p copies (see "Adding a film").
- Motion respects reduced-motion preferences (no entrances, no pass intro or swing, no hover previews, no rail draw).
- Scroll motion: `js/scroll-fx.js` (GSAP 3.13, ScrollTrigger, DrawSVG, SplitText from jsDelivr, SRI-pinned, loaded by an inline script that skips them under Save-Data). One master timeline draws the signal trace; tune `TIP`, `PIN`, `SCRUB` and `BRANCH` at the top of the file and the trace colours in `css/pass.css` (`.trace`). Without GSAP the trace is drawn statically and nothing is hidden.
- Verify all project descriptions, internship dates, contact details, and social links before publishing.
