/**
 * Loads three.js (ES module build) for the 3D pass and exposes it as window.THREE,
 * then runs js/lanyard.js. Injected by index.html only after React and ReactDOM loaded.
 * The module URL is preloaded with an SRI hash by index.html, so this import reuses
 * that integrity-checked fetch. If the CDN fails, the import rejects and the static
 * pass simply stays in place.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

window.THREE = THREE;

const script = document.createElement('script');
script.src = new URL('./lanyard.js', import.meta.url).href;
document.body.appendChild(script);
