# Divesh Reddy — Portfolio

A responsive single-page portfolio built with HTML, generated Tailwind CSS, and vanilla JavaScript.

## Run locally in VS Code

1. Extract/open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

You can also run a local server from this folder:

```bash
python3 -m http.server 5500
```

Then open http://localhost:5500.

The generated Tailwind stylesheet is checked in, so Live Server does not need a build step. After changing Tailwind classes or the theme, run `npm install` once and then `npm run build:css`.

For a production bundle, run `npm install` and `npm run build`. The build minifies and copies the standalone scripts and resume PDFs into `dist/`. To run Lighthouse against the production output, run `npm run preview` and audit http://localhost:4173 rather than the Vite development server. TypeScript checks for the separate UI components are available with `npm run typecheck`.

## Project structure

```text
divesh-portfolio/
├── index.html
├── tailwind.config.cjs
├── README.md
├── css/
│   └── tailwind.generated.css
└── assets/
    ├── resume-rtl-design.pdf
    └── resume-graphic-design.pdf
```

## Notes

- Cloudinary videos and matching poster frames are loaded as they approach the viewport; video delivery is capped to the displayed dimensions.
- The Spline viewer loads as its section approaches the viewport.
- Resume PDFs are stored locally in `assets/`.
- The design uses a dark engineering/creative visual direction with responsive layouts and motion that respects reduced-motion preferences.
- Verify all project descriptions, internship dates, contact details, and social links before publishing.
