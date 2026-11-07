/**
 * React Bits 3D Interactive Lanyard
 * Realistic physics lanyard simulation built with Three.js and React 18.
 */
const { useEffect, useRef } = window.React || {};
const THREE = window.THREE;
const CARD_SIZES = {
  portrait: [1.6, 2.25],
  landscape: [2.25, 1.6]
};
const ANCHORS = { left: 0.27, center: 0.5, right: 0.73 };
const THICKNESS = 0.018;
const BEVEL = 0.007;
const JOINTS = 4;
const NODE_WEIGHT = 1 / 0.05;
const MAX_STEP = 1 / 960;
const ITERATIONS = 2;
const SAMPLES = 72;
const FOV = 24;
const STRAP_WIDTH = 0.36;
const RING_RADIUS = 0.095;
const RING_TUBE = 0.0135;
const EYELET_RADIUS = 0.036;
const CLAMP_BODY = 0.15;
const FACE_WIDTH = 1024;

const FINISHES = {
  glossy: { roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, foil: 0, anisotropy: 0 },
  matte: { roughness: 0.85, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.6, foil: 0, anisotropy: 0 },
  holographic: { roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, foil: 1, anisotropy: 0 },
  metallic: { roughness: 0.36, metalness: 0.75, clearcoat: 0.5, clearcoatRoughness: 0.18, foil: 0, anisotropy: 0.7 }
};

const BAND_COLUMNS = [0, 0.07, 0.93, 1];
const BAND_BEND = [-0.95, -0.28, 0.28, 0.95];
const FLIP_SPIN = 9;

const FOIL_VERTEX_HEAD = `
varying vec2 vFoilUv;
varying vec3 vFoilX;
varying vec3 vFoilY;
`;

const FOIL_VERTEX_BODY = `
vFoilUv = uv;
vFoilX = normalize((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
vFoilY = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
`;

const FOIL_FRAGMENT_HEAD = `
uniform float foilStrength;
uniform float foilAspect;
uniform vec3 foilKey;
uniform vec3 foilFill;
uniform vec3 foilTop;
varying vec2 vFoilUv;
varying vec3 vFoilX;
varying vec3 vFoilY;

float foilHash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float foilBump(float t, float center, float width) {
  float x = (t - center) / width;
  return max(0.0, 1.0 - x * x);
}

vec3 foilSpectrum(float t) {
  return vec3(
    foilBump(t, 0.82, 0.32) + 0.4 * foilBump(t, 0.02, 0.12),
    foilBump(t, 0.5, 0.26),
    foilBump(t, 0.18, 0.24)
  );
}

vec3 foilGrating(float u, float spacing) {
  vec3 color = vec3(0.0);
  for (int m = 1; m <= 2; m++) {
    float order = float(m);
    float t = (spacing * abs(u) / order - 0.38) / 0.32;
    color += foilSpectrum(t) / order;
  }
  return color;
}

vec3 foilShard(vec2 p) {
  vec2 base = floor(p);
  float best = 9.0;
  float edge = 9.0;
  vec2 id = base;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = base + vec2(float(i), float(j));
      vec2 site = cell + vec2(foilHash(cell), foilHash(cell + 7.31)) * 0.9 + 0.05;
      float d = length(site - p);
      if (d < best) {
        edge = best;
        best = d;
        id = cell;
      } else if (d < edge) {
        edge = d;
      }
    }
  }
  return vec3(foilHash(id + 3.17), foilHash(id + 11.73), edge - best);
}
`;

const FOIL_FRAGMENT_BODY = `
if (foilStrength > 0.0) {
  vec3 foilView = normalize(vViewPosition);
  vec3 foilNormal = normalize(normal);
  vec2 foilP = vec2(vFoilUv.x, vFoilUv.y * foilAspect);
  vec3 shard = foilShard(foilP * 26.0);
  vec2 ray = foilP - vec2(-1.6, 2.6 * foilAspect);
  float angle = atan(ray.y, ray.x) + (shard.x - 0.5) * 0.16;
  vec3 grating = normalize(vFoilX * cos(angle) + vFoilY * sin(angle));
  float spacing = 1.7 * (0.95 + shard.y * 0.1);
  vec3 rainbow = foilGrating(dot(foilKey + foilView, grating), spacing);
  rainbow += 0.6 * foilGrating(dot(foilTop + foilView, grating), spacing);
  rainbow *= 0.8 + 0.2 * smoothstep(0.0, 0.04, shard.z);
  rainbow = max(rainbow - 0.35 * min(rainbow.r, min(rainbow.g, rainbow.b)), 0.0);
  vec2 grid = foilP * 64.0;
  vec2 cell = floor(grid);
  vec2 jitter = vec2(foilHash(cell + 1.7), foilHash(cell + 9.2));
  float flake = smoothstep(0.32, 0.06, length(fract(grid) - jitter * 0.6 - 0.2)) * step(0.45, foilHash(cell + 4.4));
  vec3 facet = normalize(foilNormal + (vFoilX * (jitter.x - 0.5) + vFoilY * (jitter.y - 0.5)) * 0.8);
  float glint = pow(max(dot(reflect(-foilKey, facet), foilView), 0.0), 28.0);
  glint += 0.7 * pow(max(dot(reflect(-foilTop, facet), foilView), 0.0), 28.0);
  float fine = 1.0 - smoothstep(0.35, 0.9, max(fwidth(grid.x), fwidth(grid.y)));
  vec3 sparkle = flake * glint * fine * (vec3(0.7) + foilGrating(dot(foilKey + foilView, grating) + jitter.x * 0.4, spacing));
  float ink = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float foil = foilStrength * (0.08 + 0.92 * smoothstep(0.04, 0.7, ink));
  float facing = clamp(dot(foilNormal, foilView), 0.0, 1.0);
  float tint = clamp(dot(rainbow, vec3(0.4)), 0.0, 1.0);
  outgoingLight = outgoingLight * (1.0 - foil * (0.3 + 0.32 * tint)) + (rainbow * 0.62 * (0.4 + 0.6 * facing) + sparkle * 1.6) * foil;
}
`;

const METALS = {
  silver: { color: '#d9dce2', roughness: 0.16 },
  gold: { color: '#e4b965', roughness: 0.2 },
  graphite: { color: '#4d4f55', roughness: 0.28 }
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;

const parseColor = (value, fallback) => {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return fallback;
    ctx.fillStyle = '#000000';
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (resolved.startsWith('#')) {
      const n = parseInt(resolved.slice(1), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const parts = resolved.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return fallback;
    return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
  } catch {
    return fallback;
  }
};

const luminance = rgb => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
const toCss = (rgb, alpha = 1) =>
  `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)}, ${alpha})`;

const seeded = start => {
  let state = start >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const traceRoundedRect = (path, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const k = r * 0.4477;
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.bezierCurveTo(x + width - k, y, x + width, y + k, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.bezierCurveTo(x + width, y + height - k, x + width - k, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.bezierCurveTo(x + k, y + height, x, y + height - k, x, y + height - r);
  path.lineTo(x, y + r);
  path.bezierCurveTo(x, y + k, x + k, y, x + r, y);
};

const loadImage = (cache, url) => {
  if (!url) return Promise.resolve(null);
  const cached = cache.get(url);
  if (cached) return cached;
  const promise = new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
  cache.set(url, promise);
  return promise;
};

const cardLayout = (orientation, cornerRadius) => {
  const [width, height] = CARD_SIZES[orientation] || CARD_SIZES.portrait;
  const radius = mix(0.03, Math.min(width, height) * 0.2, clamp(cornerRadius, 0, 1));
  const slot = { width: 0.34, height: 0.07, y: height / 2 - 0.13 };
  const ringY = height / 2 - 0.055;
  return { width, height, radius, slot, ringY, hangY: ringY + RING_RADIUS };
};

const buildCardGeometry = layout => {
  const { width, height, radius, slot } = layout;
  const outline = new THREE.Shape();
  traceRoundedRect(
    outline,
    -width / 2 + BEVEL,
    -height / 2 + BEVEL,
    width - BEVEL * 2,
    height - BEVEL * 2,
    Math.max(radius - BEVEL, 0.005)
  );
  const hole = new THREE.Path();
  traceRoundedRect(
    hole,
    -slot.width / 2 - BEVEL,
    slot.y - slot.height / 2 - BEVEL,
    slot.width + BEVEL * 2,
    slot.height + BEVEL * 2,
    slot.height / 2 + BEVEL
  );
  outline.holes.push(hole);
  const body = new THREE.ExtrudeGeometry(outline, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 5,
    curveSegments: 24
  });
  body.translate(0, 0, -THICKNESS / 2);
  const face = new THREE.ShapeGeometry(outline, 24);
  const position = face.getAttribute('position');
  const uv = face.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + width / 2) / width, (position.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return { body, face };
};

const buildClampGeometry = width => {
  const shape = new THREE.Shape();
  const w = width * 1.16;
  traceRoundedRect(shape, -w / 2 + 0.014, -CLAMP_BODY / 2 + 0.014, w - 0.028, CLAMP_BODY - 0.028, 0.024);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 6,
    curveSegments: 10
  });
  geometry.translate(0, 0, -0.01);
  return geometry;
};

const buildBandGeometry = count => {
  const columns = BAND_COLUMNS.length;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(count * columns * 3), 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(count * columns * 2), 2));
  const index = [];
  for (let i = 0; i < count - 1; i++) {
    for (let c = 0; c < columns - 1; c++) {
      const a = i * columns + c;
      index.push(a, a + columns, a + 1, a + 1, a + columns, a + columns + 1);
    }
  }
  geometry.setIndex(index);
  return geometry;
};

const buildEnvironment = renderer => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.035, 0.035, 0.04);
  const geometry = new THREE.PlaneGeometry(1, 1);
  const materials = [];
  const panel = (intensity, position, scale, rotation = 0) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(intensity, intensity, intensity),
      side: THREE.DoubleSide
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.scale.set(scale[0], scale[1], 1);
    mesh.lookAt(0, 0, 0);
    mesh.rotateZ(rotation);
    scene.add(mesh);
  };
  panel(2.6, [0, 4.5, 8], [9, 4]);
  panel(6, [-5.5, 0.5, 7], [0.9, 14]);
  panel(4, [5, -0.5, 8], [0.6, 14]);
  panel(3.5, [0, -1, 9], [24, 0.35], Math.PI / 3);
  panel(2.5, [1, 2.5, 9], [24, 0.2], Math.PI / 3);
  panel(1.4, [0, 6, -6], [12, 4]);
  panel(0.5, [0, -7, 1], [16, 6]);
  panel(0.9, [8, 0, -2], [4, 10]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  geometry.dispose();
  materials.forEach(material => material.dispose());
  return target;
};

const makeCanvasTexture = (canvas, anisotropy) => {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
};

const buildGrainTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const random = seeded(7);
  const field = Float32Array.from({ length: size * size }, () => random());
  const height = (x, y) => {
    let sum = 0;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) sum += field[((y + j + size) % size) * size + ((x + i + size) % size)];
    }
    return (sum / 9) * 1.6;
  };
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = height((x - 1 + size) % size, y) - height((x + 1) % size, y);
      const ny = height(x, (y - 1 + size) % size) - height(x, (y + 1) % size);
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7);
  return texture;
};

const buildWeaveTexture = () => {
  const size = 128;
  const threads = 8;
  const random = seeded(19);
  const fiber = Float32Array.from({ length: size * size }, () => random());
  const profile = f => Math.sqrt(Math.max(0, 1 - 4 * f * f));
  const height = (x, y) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    const u = (px / size) * threads;
    const v = (py / size) * threads;
    const cu = Math.floor(u);
    const cv = Math.floor(v);
    const fu = u - cu - 0.5;
    const fv = v - cv - 0.5;
    const lift = (cu + cv) % 2 === 0;
    const warp = profile(fu) * (0.55 + 0.45 * Math.cos(fv * Math.PI * (lift ? 1 : 0.6)));
    const weft = profile(fv) * (0.55 + 0.45 * Math.cos(fu * Math.PI * (lift ? 0.6 : 1)));
    return (lift ? Math.max(warp, weft * 0.7) : Math.max(weft, warp * 0.7)) + fiber[py * size + px] * 0.08;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (height(x - 1, y) - height(x + 1, y)) * 1.6;
      const ny = (height(x, y - 1) - height(x, y + 1)) * 1.6;
      const length = Math.hypot(nx, ny, 1);
      const i = (y * size + x) * 4;
      data[i] = ((nx / length) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / length) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
};

const drawFitted = (ctx, image, width, height, fit) => {
  const scale = (fit === 'contain' ? Math.min : Math.max)(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
};

const paintFace = (canvas, image, color, fit) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#f7f7f8';
  ctx.fillRect(0, 0, w, h);

  // Clean identity-card header, with the portrait filling the lower section.
  ctx.fillStyle = '#55565a';
  ctx.font = '500 38px Inter, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('@diveshreddy', w * 0.91, h * 0.115);

  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = '#6b7280';
  ctx.font = '700 150px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DR', w * 0.08, h * 0.19);
  ctx.restore();

  if (image) {
    ctx.save();
    ctx.filter = 'grayscale(1) contrast(1.06)';
    const top = h * 0.235;
    const targetH = h - top;
    const scale = Math.max(w / image.width, targetH / image.height);
    const iw = image.width * scale, ih = image.height * scale;
    ctx.drawImage(image, (w - iw) / 2, top + (targetH - ih) / 2, iw, ih);
    ctx.restore();
  }

  // Printed keyline belongs to the card texture, so it swings with the badge.
  const inset = Math.round(w * 0.012);
  const radius = Math.round(w * 0.045);
  const border = ctx.createLinearGradient(inset, inset, w - inset, h - inset);
  border.addColorStop(0, '#c01245');
  border.addColorStop(0.52, '#ff1f5a');
  border.addColorStop(1, '#ff7098');
  ctx.save();
  ctx.strokeStyle = border;
  ctx.lineWidth = Math.max(5, Math.round(w * 0.006));
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(inset, inset, w - inset * 2, h - inset * 2, radius);
  } else {
    traceRoundedRect(ctx, inset, inset, w - inset * 2, h - inset * 2, radius);
  }
  ctx.stroke();
  ctx.restore();
};

const paintStrap = (canvas, image, color) => {
  const across = 192;
  const along = image ? Math.max(64, Math.round((image.width / image.height) * across)) : across * 2;
  canvas.width = across;
  canvas.height = along;
  const ctx = canvas.getContext('2d');
  if (!ctx) return along / across;
  ctx.fillStyle = toCss(color);
  ctx.fillRect(0, 0, across, along);
  if (image) {
    ctx.save();
    ctx.translate(across, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(image, 0, 0, along, across);
    ctx.restore();
    return along / across;
  }
  const ink = luminance(color) > 0.5 ? [0, 0, 0] : [1, 1, 1];
  ctx.fillStyle = toCss(ink, 0.05);
  for (let y = 0; y < along; y += 4) ctx.fillRect(0, y, across, 1);
  ctx.fillStyle = toCss(ink, 0.2);
  for (let y = 0; y < along; y += 14) {
    ctx.fillRect(across * 0.075, y, 2, 8);
    ctx.fillRect(across * 0.925 - 2, y, 2, 8);
  }
  ctx.save();
  ctx.fillStyle = toCss([1, 1, 1], 0.95);
  ctx.font = '700 46px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DR', across / 2, along * 0.5);
  ctx.restore();
  return along / across;
};

const createSimulation = () => {
  const vectors = () => Array.from({ length: JOINTS + 1 }, () => new THREE.Vector3());
  return {
    nodes: vectors(),
    previous: vectors(),
    velocities: vectors(),
    lengths: new Float64Array(JOINTS),
    impulses: new Float64Array(JOINTS),
    rest: 1,
    anchor: new THREE.Vector3(),
    body: {
      position: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      previousQuaternion: new THREE.Quaternion(),
      angular: new THREE.Vector3(),
      mass: 1,
      inverseInertia: new THREE.Vector3(1, 1, 1),
      hang: new THREE.Vector3()
    },
    grab: null,
    turn: 0,
    twist: 0,
    twistRaw: 0,
    calm: 0
  };
};

const scratch = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  c: new THREE.Vector3(),
  d: new THREE.Vector3(),
  e: new THREE.Vector3(),
  f: new THREE.Vector3(),
  g: new THREE.Vector3(),
  pin: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  r: new THREE.Quaternion()
};

const applyInverseInertia = (body, vector, out) => {
  scratch.r.copy(body.quaternion).invert();
  out.copy(vector).applyQuaternion(scratch.r);
  out.set(out.x * body.inverseInertia.x, out.y * body.inverseInertia.y, out.z * body.inverseInertia.z);
  return out.applyQuaternion(body.quaternion);
};

const rotateBody = (q, w) => {
  const { x: qx, y: qy, z: qz, w: qw } = q;
  q.x += 0.5 * (w.x * qw + w.y * qz - w.z * qy);
  q.y += 0.5 * (w.y * qw + w.z * qx - w.x * qz);
  q.z += 0.5 * (w.z * qw + w.x * qy - w.y * qx);
  q.w += 0.5 * (-w.x * qx - w.y * qy - w.z * qz);
  q.normalize();
};

const bodyWeight = (body, r, normal) => {
  const rn = scratch.c.crossVectors(r, normal);
  return 1 / body.mass + rn.dot(applyInverseInertia(body, rn, scratch.d));
};

const pushBody = (body, r, impulse) => {
  body.position.addScaledVector(impulse, 1 / body.mass);
  rotateBody(body.quaternion, applyInverseInertia(body, scratch.e.crossVectors(r, impulse), scratch.f));
};

const solveSegment = (sim, i, h, physics) => {
  const { nodes, body } = sim;
  const a = nodes[i];
  const wa = i === 0 ? 0 : NODE_WEIGHT;
  const last = i === JOINTS - 1;
  const r = scratch.g;
  let b = nodes[i + 1];
  if (last) {
    r.copy(body.hang).applyQuaternion(body.quaternion);
    b = scratch.b.copy(body.position).add(r);
  }
  const delta = scratch.a.subVectors(b, a);
  const length = delta.length();
  const stretch = length - sim.rest;
  if (stretch <= 0 || length < 1e-9) return;
  const normal = delta.divideScalar(length);
  const wb = last ? bodyWeight(body, r, normal) : NODE_WEIGHT;
  const rate = (length - sim.lengths[i]) / h;
  const tension =
    physics.hold * Math.tanh((physics.stiffness * stretch) / physics.hold) +
    physics.spring * stretch +
    physics.bandDamping * Math.max(0, rate);
  const room = tension * h * h - sim.impulses[i];
  if (room <= 0) return;
  const lambda = Math.min(stretch / (wa + wb), room);
  sim.impulses[i] += lambda;
  if (wa) a.addScaledVector(normal, lambda * wa);
  if (last) pushBody(body, r, normal.multiplyScalar(-lambda));
  else b.addScaledVector(normal, -lambda * wb);
};

const solvePin = (body, grab, target) => {
  const r = scratch.g.copy(grab.local).applyQuaternion(body.quaternion);
  const delta = scratch.a.copy(target).sub(body.position).sub(r);
  const distance = delta.length();
  if (distance < 1e-9) return;
  const normal = delta.divideScalar(distance);
  const lambda = distance / bodyWeight(body, r, normal);
  pushBody(body, r, normal.multiplyScalar(lambda));
};

const placeHanging = (sim, layout, intro) => {
  const { nodes, previous, velocities, body, anchor } = sim;
  nodes[0].copy(anchor);
  for (let i = 1; i <= JOINTS; i++) {
    nodes[i].copy(nodes[i - 1]);
    if (intro) nodes[i].x += sim.rest;
    else nodes[i].y -= sim.rest;
  }
  body.quaternion.identity();
  if (intro) body.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  body.hang.set(0, layout.hangY, 0);
  const offset = scratch.a.copy(body.hang).applyQuaternion(body.quaternion);
  body.position.copy(nodes[JOINTS]).sub(offset);
  body.previous.copy(body.position);
  body.previousQuaternion.copy(body.quaternion);
  body.velocity.set(0, 0, 0);
  body.angular.set(0, 0, 0);
  for (let i = 0; i <= JOINTS; i++) {
    previous[i].copy(nodes[i]);
    velocities[i].set(0, 0, 0);
  }
  sim.lengths.fill(sim.rest);
  sim.turn = 0;
  sim.twist = 0;
  sim.twistRaw = 0;
  sim.calm = 0;
};

const configureSimulation = (sim, layout, length) => {
  sim.rest = length / JOINTS;
  const { width, height } = layout;
  const body = sim.body;
  const t = THICKNESS + BEVEL * 2;
  body.mass = 1;
  body.inverseInertia.set(
    12 / (height * height + t * t),
    12 / (width * width + t * t),
    12 / (width * width + height * height)
  );
  body.hang.set(0, layout.hangY, 0);
};

const stepSimulation = (sim, dt, physics, time) => {
  const steps = Math.max(1, Math.ceil(dt / MAX_STEP - 1e-6));
  const h = dt / steps;
  const { nodes, previous, velocities, body } = sim;
  const windX = physics.breeze * (Math.sin(time * 0.53) * 0.7 + Math.sin(time * 1.31 + 1.7) * 0.3) * 3;
  const windZ = physics.breeze * Math.sin(time * 0.37 + 0.6) * 2;
  const grab = sim.grab;
  const pin = scratch.pin;
  const nodeDrag = Math.exp(-physics.nodeDrag * h);
  const linearDrag = Math.exp(-physics.linearDrag * h);
  const angularDrag = Math.exp(-physics.angularDrag * h);

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i];
      v.y -= physics.gravity * h;
      v.x += windX * h;
      v.z += windZ * h;
      previous[i].copy(nodes[i]);
      nodes[i].addScaledVector(v, h);
    }

    body.previous.copy(body.position);
    body.previousQuaternion.copy(body.quaternion);
    const q = body.quaternion;
    if (grab) {
      const turn = scratch.q.copy(grab.rotation).multiply(scratch.r.copy(q).invert());
      if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
      const torque = scratch.a.set(turn.x, turn.y, turn.z).multiplyScalar(2 * physics.grip);
      torque.addScaledVector(body.angular, -physics.gripDamping);
      body.angular.addScaledVector(applyInverseInertia(body, torque, scratch.b), h);
    }
    const up = scratch.a.set(0, 1, 0).applyQuaternion(q);
    const front = scratch.b.set(-up.x * up.z, -up.y * up.z, 1 - up.z * up.z);
    if (front.lengthSq() > 1e-3) {
      const facing = scratch.d.set(0, 0, 1).applyQuaternion(q);
      const raw = Math.atan2(scratch.e.crossVectors(front, facing).dot(up), front.dot(facing));
      let turned = raw - sim.twistRaw;
      if (turned > Math.PI) turned -= Math.PI * 2;
      else if (turned < -Math.PI) turned += Math.PI * 2;
      sim.twist += turned;
      sim.twistRaw = raw;
    }
    if (!grab) {
      const spin = body.angular.dot(up);
      body.angular.addScaledVector(up, (physics.twist * (sim.turn - sim.twist) - physics.twistDamping * spin) * h);
    }
    body.velocity.y -= physics.gravity * h;
    body.velocity.x += windX * 0.35 * h;
    body.velocity.z += windZ * 0.35 * h;
    body.position.addScaledVector(body.velocity, h);
    rotateBody(body.quaternion, scratch.f.copy(body.angular).multiplyScalar(h));

    sim.impulses.fill(0);
    if (grab) pin.lerpVectors(grab.from, grab.target, (s + 1) / steps);
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      for (let i = 0; i < JOINTS; i++) solveSegment(sim, i, h, physics);
      if (grab) solvePin(body, grab, pin);
    }

    for (let i = 1; i < JOINTS; i++) {
      const v = velocities[i].subVectors(nodes[i], previous[i]).divideScalar(h).multiplyScalar(nodeDrag);
      v.multiplyScalar(1 / (1 + physics.nodeAir * v.length() * h));
    }
    body.velocity.subVectors(body.position, body.previous).divideScalar(h);
    const dq = scratch.q.copy(body.previousQuaternion).invert().premultiply(body.quaternion);
    body.angular.set(dq.x, dq.y, dq.z).multiplyScalar((2 / h) * (dq.w < 0 ? -1 : 1));

    const normal = scratch.a.set(0, 0, 1).applyQuaternion(body.quaternion);
    const across = body.velocity.dot(normal);
    const along = scratch.b.copy(body.velocity).addScaledVector(normal, -across);
    along.multiplyScalar(1 / (1 + physics.air * along.length() * h));
    body.velocity
      .copy(along)
      .addScaledVector(normal, across / (1 + physics.broadside * Math.abs(across) * h))
      .multiplyScalar(linearDrag);
    body.angular.multiplyScalar(angularDrag / (1 + physics.spinAir * body.angular.length() * h));
    if (body.velocity.lengthSq() > 3600) body.velocity.setLength(60);
    if (body.angular.lengthSq() > 1600) body.angular.setLength(40);

    nodes[JOINTS].copy(body.hang).applyQuaternion(body.quaternion).add(body.position);
    for (let i = 0; i < JOINTS; i++) sim.lengths[i] = nodes[i].distanceTo(nodes[i + 1]);
  }

  if (grab) grab.from.copy(grab.target);

  let energy = body.velocity.lengthSq() + body.angular.lengthSq() * 0.3;
  for (let i = 1; i < JOINTS; i++) energy += velocities[i].lengthSq() * 0.05;
  sim.calm = energy < 2e-4 ? sim.calm + dt : 0;
};


const Lanyard = ({
  frontImage,
  backImage,
  imageFit = 'cover',
  cardColor = '#ffffff',
  orientation = 'portrait',
  finish = 'glossy',
  cornerRadius = 0.3,
  size = 0.6,
  anchor = 'center',
  strapLength = 0.5,
  strapImage,
  strapColor = '#111111',
  strapWidth = 0.65,
  metal = 'silver',
  gravity = 1,
  damping = 0.5,
  elasticity = 0.5,
  breeze = 0.5,
  interactive = true,
  intro = true,
  className = '',
  style
}) => {
  const containerRef = useRef(null);
  const settingsRef = useRef(null);
  const applyRef = useRef(null);

  settingsRef.current = {
    frontImage,
    backImage,
    imageFit: imageFit === 'contain' ? 'contain' : 'cover',
    cardColor,
    orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
    finish,
    cornerRadius,
    size,
    anchor,
    strapLength,
    strapImage,
    strapColor,
    strapWidth,
    metal,
    gravity,
    damping,
    elasticity,
    breeze,
    interactive,
    intro
  };

  useEffect(() => {
    applyRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return undefined;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    const canvas = renderer.domElement;
    canvas.className = 'lanyard-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const scene = new THREE.Scene();
    const environment = buildEnvironment(renderer);
    scene.environment = environment.texture;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(-2.5, 4, 6);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.35);
    fillLight.position.set(3, -1, 4);
    scene.add(keyLight, fillLight);

    const imageCache = new Map();
    const images = { front: null, back: null, strap: null };
    const frontCanvas = document.createElement('canvas');
    const backCanvas = document.createElement('canvas');
    const strapCanvas = document.createElement('canvas');
    const frontTexture = makeCanvasTexture(frontCanvas, anisotropy);
    const backTexture = makeCanvasTexture(backCanvas, anisotropy);
    const strapTexture = makeCanvasTexture(strapCanvas, anisotropy);
    strapTexture.wrapS = THREE.ClampToEdgeWrapping;
    strapTexture.wrapT = THREE.RepeatWrapping;
    const grain = buildGrainTexture();
    const weave = buildWeaveTexture();
    const foilUniforms = {
      foilStrength: { value: 0 },
      foilAspect: { value: 1.4 },
      foilKey: { value: new THREE.Vector3() },
      foilFill: { value: new THREE.Vector3() },
      foilTop: { value: new THREE.Vector3() }
    };
    const injectFoil = shader => {
      Object.assign(shader.uniforms, foilUniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${FOIL_VERTEX_HEAD}`)
        .replace('#include <project_vertex>', `#include <project_vertex>\n${FOIL_VERTEX_BODY}`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${FOIL_FRAGMENT_HEAD}`)
        .replace('#include <opaque_fragment>', `${FOIL_FRAGMENT_BODY}\n#include <opaque_fragment>`);
    };

    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: frontTexture,
      normalMap: grain,
      normalScale: new THREE.Vector2(0.06, 0.06)
    });
    const backMaterial = new THREE.MeshPhysicalMaterial({
      map: backTexture,
      normalMap: grain,
      normalScale: new THREE.Vector2(0.06, 0.06)
    });
    frontMaterial.onBeforeCompile = injectFoil;
    backMaterial.onBeforeCompile = injectFoil;
    const edgeMaterial = new THREE.MeshPhysicalMaterial();
    const metalMaterial = new THREE.MeshStandardMaterial({ metalness: 1 });
    const bandMaterial = new THREE.MeshPhysicalMaterial({
      map: strapTexture,
      normalMap: weave,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.68,
      sheen: 1,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0.32, 0.32, 0.34),
      side: THREE.DoubleSide
    });

    const cardGroup = new THREE.Group();
    const bodyMesh = new THREE.Mesh(undefined, edgeMaterial);
    const frontMesh = new THREE.Mesh(undefined, frontMaterial);
    const backMesh = new THREE.Mesh(undefined, backMaterial);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RING_RADIUS, RING_TUBE, 18, 72), metalMaterial);
    ring.rotation.y = Math.PI / 2 - 0.7;
    cardGroup.add(bodyMesh, frontMesh, backMesh, ring);
    scene.add(cardGroup);

    const bandGeometry = buildBandGeometry(SAMPLES);
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.frustumCulled = false;
    scene.add(band);

    const clampGroup = new THREE.Group();
    const clampMesh = new THREE.Mesh(buildClampGeometry(STRAP_WIDTH), metalMaterial);
    clampMesh.position.y = EYELET_RADIUS + CLAMP_BODY / 2 - 0.004;
    const eyelet = new THREE.Mesh(new THREE.TorusGeometry(EYELET_RADIUS, 0.0105, 14, 40), metalMaterial);
    clampGroup.add(clampMesh, eyelet);
    scene.add(clampGroup);

    const sim = createSimulation();
    const controls = [];
    const mouth = new THREE.Vector3();
    const tuck = new THREE.Vector3();
    const curve = new THREE.CatmullRomCurve3(controls, false, 'centripetal');
    const view = { width: 1, height: 1 };
    let layout = cardLayout('portrait', 0.3);
    let applied = {};
    let strapScale = STRAP_WIDTH;
    let tileRatio = 2;
    let raf = 0;
    let last = performance.now();
    let time = 0;
    let visible = true;
    let alive = true;
    let placed = false;
    let hovering = false;
    let press = null;
    let imageToken = 0;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const paintFaces = () => {
      const s = settingsRef.current;
      const color = parseColor(s.cardColor, [1, 1, 1]);
      const width = FACE_WIDTH;
      const height = Math.round((FACE_WIDTH * layout.height) / layout.width);
      if (frontCanvas.width !== width || frontCanvas.height !== height) {
        frontCanvas.width = width;
        frontCanvas.height = height;
        backCanvas.width = width;
        backCanvas.height = height;
        frontTexture.dispose();
        backTexture.dispose();
      }
      paintFace(frontCanvas, images.front, color, s.imageFit);
      paintFace(backCanvas, images.back || images.front, color, s.imageFit);
      frontTexture.needsUpdate = true;
      backTexture.needsUpdate = true;
      start();
    };

    const repaintStrap = () => {
      const s = settingsRef.current;
      tileRatio = paintStrap(strapCanvas, images.strap, parseColor(s.strapColor, [0.07, 0.07, 0.07]));
      weave.repeat.set(2, 2 * tileRatio);
      strapTexture.dispose();
      strapTexture.needsUpdate = true;
      start();
    };

    const frameView = () => {
      const s = settingsRef.current;
      const aspect = view.width / view.height;
      let viewHeight = layout.height / clamp(s.size, 0.15, 0.9);
      const minimumWidth = layout.width / 0.72;
      if (viewHeight * aspect < minimumWidth) viewHeight = minimumWidth / aspect;
      const viewWidth = viewHeight * aspect;
      camera.aspect = aspect;
      camera.position.set(0, 0, viewHeight / 2 / Math.tan((FOV * Math.PI) / 360));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      foilUniforms.foilKey.value.set(-2.5, 4, 6).normalize().transformDirection(camera.matrixWorldInverse);
      foilUniforms.foilFill.value.set(3, -1, 4).normalize().transformDirection(camera.matrixWorldInverse);
      foilUniforms.foilTop.value.set(0.5, 4.5, 8).normalize().transformDirection(camera.matrixWorldInverse);
      const anchorX = ((ANCHORS[s.anchor] ?? 0.5) - 0.5) * viewWidth;
      const anchorY = viewHeight / 2 + 0.2;
      const cardTop = viewHeight / 2 - viewHeight * mix(0.12, 0.42, clamp(s.strapLength, 0, 1));
      const hangTop = cardTop + (layout.hangY - layout.height / 2);
      sim.anchor.set(anchorX, anchorY, 0);
      configureSimulation(sim, layout, anchorY - hangTop);
      sim.nodes[0].copy(sim.anchor);
      sim.previous[0].copy(sim.anchor);
    };

    const apply = () => {
      const s = settingsRef.current;
      const layoutKey = `${s.orientation}|${s.cornerRadius}`;
      if (layoutKey !== applied.layoutKey) {
        layout = cardLayout(s.orientation, s.cornerRadius);
        const geometry = buildCardGeometry(layout);
        bodyMesh.geometry.dispose();
        frontMesh.geometry.dispose();
        backMesh.geometry.dispose();
        bodyMesh.geometry = geometry.body;
        frontMesh.geometry = geometry.face;
        backMesh.geometry = geometry.face.clone();
        frontMesh.position.z = THICKNESS / 2 + BEVEL + 0.0006;
        backMesh.rotation.y = Math.PI;
        backMesh.position.z = -(THICKNESS / 2 + BEVEL + 0.0006);
        ring.position.set(0, layout.ringY, 0);
        applied.framingKey = '';
      }
      const framingKey = `${layoutKey}|${s.size}|${s.anchor}|${s.strapLength}|${view.width}|${view.height}`;
      if (framingKey !== applied.framingKey) {
        frameView();
        if (!placed) {
          placeHanging(sim, layout, s.intro && !reducedMotion);
          placed = true;
        } else if (layoutKey !== applied.layoutKey) {
          placeHanging(sim, layout, false);
        }
      }

      const imageKey = `${s.frontImage}|${s.backImage}|${s.strapImage}`;
      if (imageKey !== applied.imageKey) {
        const token = ++imageToken;
        Promise.all([
          loadImage(imageCache, s.frontImage),
          loadImage(imageCache, s.backImage),
          loadImage(imageCache, s.strapImage)
        ]).then(([front, back, strap]) => {
          if (!alive || token !== imageToken) return;
          images.front = front;
          images.back = back;
          images.strap = strap;
          if (front) container.classList.add('lanyard-ready');
          else container.classList.remove('lanyard-ready');
          paintFaces();
          repaintStrap();
        });
      }
      const faceKey = `${layoutKey}|${s.cardColor}|${s.imageFit}`;
      if (faceKey !== applied.faceKey) paintFaces();
      if (s.strapColor !== applied.strapColor) repaintStrap();

      const finish = FINISHES[s.finish] || FINISHES.glossy;
      const card = parseColor(s.cardColor, [1, 1, 1]);
      [frontMaterial, backMaterial].forEach(material => {
        material.roughness = finish.roughness;
        material.metalness = finish.metalness;
        material.clearcoat = finish.clearcoat;
        material.clearcoatRoughness = finish.clearcoatRoughness;
        material.anisotropy = finish.anisotropy;
      });
      foilUniforms.foilStrength.value = finish.foil;
      foilUniforms.foilAspect.value = layout.height / layout.width;
      edgeMaterial.color.set('#8bcfff');
      edgeMaterial.roughness = Math.min(finish.roughness, 0.35);
      edgeMaterial.metalness = finish.metalness;
      edgeMaterial.clearcoat = 1;
      edgeMaterial.clearcoatRoughness = 0.08;
      const metalLook = METALS[s.metal] || METALS.silver;
      metalMaterial.color.set(metalLook.color);
      metalMaterial.roughness = metalLook.roughness;
      strapScale = STRAP_WIDTH * clamp(s.strapWidth, 0.4, 2);
      if (strapScale !== applied.strapScale) {
        clampMesh.geometry.dispose();
        clampMesh.geometry = buildClampGeometry(strapScale);
      }
      canvas.style.touchAction = s.interactive ? 'pan-y' : 'auto';

      applied = { layoutKey, framingKey, imageKey, faceKey, strapColor: s.strapColor, strapScale };
      start();
    };

    const points = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
    const sides = Array.from({ length: SAMPLES }, () => new THREE.Vector3());
    const bends = BAND_BEND.map(angle => [Math.cos(angle), Math.sin(angle)]);
    const work = {
      tangent: new THREE.Vector3(),
      toCamera: new THREE.Vector3(),
      basis: new THREE.Matrix4(),
      up: new THREE.Vector3(),
      across: new THREE.Vector3(),
      facing: new THREE.Vector3(),
      end: new THREE.Vector3()
    };

    const updateBand = () => {
      const hang = sim.nodes[JOINTS];
      const reach = EYELET_RADIUS + CLAMP_BODY + 0.05;
      let guide = JOINTS - 1;
      while (guide > 0 && sim.nodes[guide].distanceTo(hang) < reach * 1.1) guide--;
      const axis = work.up.subVectors(sim.nodes[guide], hang);
      if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0).applyQuaternion(sim.body.quaternion);
      axis.normalize();
      mouth.copy(hang).addScaledVector(axis, reach);
      tuck.copy(hang).addScaledVector(axis, EYELET_RADIUS + CLAMP_BODY * 0.35);
      controls.length = 0;
      for (let i = 0; i <= guide; i++) controls.push(sim.nodes[i]);
      controls.push(mouth, tuck);
      curve.updateArcLengths();
      for (let i = 0; i < SAMPLES; i++) curve.getPointAt(i / (SAMPLES - 1), points[i]);
      const length = curve.getLength();
      const held = 1 - mouth.distanceTo(tuck) / Math.max(length, 0.001);
      const position = bandGeometry.getAttribute('position');
      const normal = bandGeometry.getAttribute('normal');
      const uv = bandGeometry.getAttribute('uv');
      const columns = BAND_COLUMNS.length;
      const restLength = sim.rest * JOINTS;
      const repeats = restLength / (strapScale * tileRatio);
      const width = strapScale / Math.pow(Math.max(1, length / Math.max(restLength, 0.001)), 0.35);
      const { tangent, toCamera, across, facing } = work;
      for (let i = 0; i < SAMPLES; i++) {
        tangent.subVectors(points[Math.min(SAMPLES - 1, i + 1)], points[Math.max(0, i - 1)]);
        if (tangent.lengthSq() < 1e-12) tangent.set(0, -1, 0);
        tangent.normalize();
        toCamera.subVectors(camera.position, points[i]).normalize();
        const side = sides[i].crossVectors(toCamera, tangent);
        if (side.lengthSq() < 1e-10) side.copy(i > 0 ? sides[i - 1] : scratch.a.set(1, 0, 0));
        side.normalize();
        if (i > 0 && side.dot(sides[i - 1]) < 0) side.negate();
        const angle = -sim.twist * Math.pow(Math.min(1, i / (SAMPLES - 1) / held), 1.3);
        facing.crossVectors(tangent, side);
        across.copy(side).multiplyScalar(Math.cos(angle)).addScaledVector(facing, Math.sin(angle));
        facing.crossVectors(tangent, across);
        const p = points[i];
        const v = (1 - i / (SAMPLES - 1)) * repeats;
        for (let c = 0; c < columns; c++) {
          const k = i * columns + c;
          const offset = (BAND_COLUMNS[c] - 0.5) * width;
          const [bendCos, bendSin] = bends[c];
          position.setXYZ(k, p.x + across.x * offset, p.y + across.y * offset, p.z + across.z * offset);
          normal.setXYZ(
            k,
            facing.x * bendCos + across.x * bendSin,
            facing.y * bendCos + across.y * bendSin,
            facing.z * bendCos + across.z * bendSin
          );
          uv.setXY(k, BAND_COLUMNS[c], v);
        }
      }
      work.end.copy(across);
      position.needsUpdate = true;
      normal.needsUpdate = true;
      uv.needsUpdate = true;

      across.copy(work.end).addScaledVector(axis, -work.end.dot(axis)).normalize();
      facing.crossVectors(across, axis).normalize();
      work.basis.makeBasis(across, axis, facing);
      clampGroup.quaternion.setFromRotationMatrix(work.basis);
      clampGroup.position.copy(hang);
    };

    const render = () => {
      cardGroup.position.copy(sim.body.position);
      cardGroup.quaternion.copy(sim.body.quaternion);
      updateBand();
      renderer.render(scene, camera);
    };

    const physics = () => {
      const s = settingsRef.current;
      const gravity = 40 * clamp(s.gravity, 0, 3);
      const weight = Math.max(gravity, 20);
      const springy = clamp(s.elasticity, 0, 1);
      const settle = clamp(s.damping, 0, 1);
      return {
        gravity,
        hold: weight * mix(2.2, 5.5, springy),
        stiffness: weight * 10 * JOINTS,
        spring: weight * mix(0.1, 0.4, springy) * JOINTS,
        bandDamping: weight * mix(0.3, 0.08, springy) * JOINTS,
        linearDrag: 0.25 * Math.pow(16, settle),
        angularDrag: 0.5 * Math.pow(12, settle),
        air: 0.15,
        broadside: 0.5,
        spinAir: 0.03,
        nodeDrag: 2,
        nodeAir: 0.2,
        twist: 30,
        twistDamping: 3,
        grip: 40,
        gripDamping: 6,
        breeze: reducedMotion ? 0 : clamp(s.breeze, 0, 1)
      };
    };

    const tick = now => {
      raf = 0;
      if (!alive) return;
      const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
      last = now;
      time += dt;
      const current = physics();
      stepSimulation(sim, dt, current, time);
      const body = sim.body;
      if (!Number.isFinite(body.position.x + body.position.y + body.position.z + body.quaternion.w)) {
        sim.grab = null;
        placeHanging(sim, layout, false);
      }
      render();
      const resting = sim.calm > 1.2 && !sim.grab && current.breeze === 0;
      if (visible && !resting) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !visible || !alive) return;
      sim.calm = 0;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const toPointer = event => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
    };

    const pickCard = () => {
      cardGroup.updateMatrixWorld();
      const hits = raycaster.intersectObjects([bodyMesh, frontMesh, backMesh], false);
      return hits[0] || null;
    };

    const setCursor = value => {
      if (canvas.style.cursor !== value) canvas.style.cursor = value;
    };

    const flip = point => {
      const body = sim.body;
      const up = scratch.a.set(0, 1, 0).applyQuaternion(body.quaternion);
      let direction = sim.turn > 0 ? -1 : 1;
      if (sim.turn === 0) {
        const away = scratch.c.subVectors(point, camera.position).normalize();
        direction = scratch.b.subVectors(point, body.position).cross(away).dot(up) < 0 ? -1 : 1;
      }
      sim.turn = sim.turn === 0 ? Math.PI * direction : 0;
      body.angular.addScaledVector(up, FLIP_SPIN * direction);
    };

    const onPointerDown = event => {
      if (!settingsRef.current.interactive || event.button > 0) return;
      toPointer(event);
      const hit = pickCard();
      if (!hit) return;
      sim.grab = {
        local: hit.point.clone().sub(sim.body.position).applyQuaternion(sim.body.quaternion.clone().invert()),
        rotation: sim.body.quaternion.clone(),
        reach: hit.distance,
        from: hit.point.clone(),
        target: hit.point.clone()
      };
      press = { x: event.clientX, y: event.clientY, time: performance.now(), point: hit.point.clone() };
      canvas.setPointerCapture?.(event.pointerId);
      setCursor('grabbing');
      event.preventDefault();
      start();
    };

    const onPointerMove = event => {
      if (!settingsRef.current.interactive) return;
      toPointer(event);
      if (sim.grab) {
        if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) press = null;
        raycaster.ray.at(sim.grab.reach, sim.grab.target);
        start();
        return;
      }
      if (event.pointerType === 'touch') return;
      hovering = !!pickCard();
      setCursor(hovering ? 'grab' : '');
    };

    const onPointerUp = event => {
      if (!sim.grab) return;
      sim.grab = null;
      if (press && event.type === 'pointerup' && performance.now() - press.time < 450) flip(press.point);
      press = null;
      canvas.releasePointerCapture?.(event.pointerId);
      setCursor(hovering && event.pointerType !== 'touch' ? 'grab' : '');
      start();
    };

    const onTouchStart = event => {
      if (!settingsRef.current.interactive || event.touches.length !== 1) return;
      toPointer(event.touches[0]);
      if (pickCard()) event.preventDefault();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('lostpointercapture', onPointerUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });

    const resize = () => {
      view.width = Math.max(1, container.clientWidth);
      view.height = Math.max(1, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(view.width, view.height, false);
      apply();
      render();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    intersectionObserver.observe(container);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    applyRef.current = apply;
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      applyRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('lostpointercapture', onPointerUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      [bodyMesh, frontMesh, backMesh, ring, clampMesh, eyelet, band].forEach(mesh => mesh.geometry?.dispose());
      [frontMaterial, backMaterial, edgeMaterial, metalMaterial, bandMaterial].forEach(material => material.dispose());
      [frontTexture, backTexture, strapTexture, grain, weave].forEach(texture => texture.dispose());
      environment.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return React.createElement(
    'div',
    { ref: containerRef, className: ('lanyard ' + className).trim(), style: style },
    React.createElement('img', { className: 'lanyard-fallback', src: frontImage, alt: 'Portrait of Divesh Reddy' })
  );
};



const lanyardPortrait = 'data:image/jpeg;base64,/9j/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCATYBNgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD06iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiikyKAFoppcAZJqrc6hDAhZmAxQBcorm5vFdqmQrZIrHn8csjkJ0+goA7yivP18eS55VfyFWYfHSswDoooA7eisK28SWs0YYuozVuPWLaTo6/nQBpUVQ/tSDONy/nT01GF2wrA0AXKKYJVIzmlDqehoAdRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRSFgKAFpGYKMk1UvNRt7SMtLIox2ritb8YFw0drjGeuaAOuvdYtrUHe4z9a5m/wDGIjlIiwR9a4e71O4uXJdifxqm8m4fMaAOxufGszoQoA/Gudvdeublm3SNg9s1kkc8GjYuetAE5u3z941G0248mmmMGmtGg5zzQA4jJ4akYuvvVV2ZTkGpYLgnhhQBciupkGAxFTx6hcA8SN+dVPMVuM01vu/KaANQ6ncdRKc/WrNpr9zCw+fNc2WZepNOBbGQaAO7h8XT4A4NXrTxK7Sq2flJ5rzmKVw2c1bivmhPPQ0wParHUI7mMEMKvhga8g0zxG9rIOfl+tdPaeMEYqrYGfegDuaKy7PVoLhFw65PvWkrqw4NIB1FFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUjEKMmgBajlmSNcscVnahrNvaI25hkVwGveLZ52aOBmVc9jQB3N74htLdTiQEisC78Xgo3lEAivP5Li4lyZJDzTQQi8mgDV1LWbi9cmSQ4rLLH61GZMmkMoJAFADX3c4OKi2OT1qV+TgGkyF4FADQmPvGnblUVE7nOBTAjuevFAEkk3HAqBpGqbyieOwpywBjk9KYFRslcnrUsKfJRcABgBRFLtkwelICQr3pUY9KlZflz2NRIMSYNADJiOh4NJGcfKelWZYRIPeoDCy8H86AHqOeKJF3D6UiZHFP70ARrkLUsUxXvzUbZT6VFkk5zxQB0OnaxNbOpD8Cux07xWhA8xu1eZIcjg05ZpEb7xFAHsI8T2+M5qWPxJbN/F+leTW91Jjlz+dXLW+eN8k7h6GgD1y01OG4+61XwwI4rzGx1IDBRip9M11Wj62s58tzyKYHS0UyORXGQafSAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArE8Q6mtnatzgkcVqXVwkMZZmAwK8x8WayLmfy4zlR3FAGVq2oyXEjfOefesrvk8mo3lLOcU1mwuTQBMXA5qNznkn8KjVj1I57U0nHLdaAEZm3e1KhO8HtQuJG5qUgKMAUANLfMcUz5mbjinH6YoYgDrQA/C96N4xgcVWZ/eljBY0wLajgDNNnnWMbV60wNjIHaoBGWyxoAiYs7ZNIoO6pxGT1FP8sBSaAHRShRhulSsgPIqouCp+tSRysnB6UAWELKeTUikE4IFRq6vTXypyppASNGAcjionBXrT1mB4PWlYhlxTAgfOz1qCMHJqzgrwelRsmMkUgAfKam2+YPeolYMArcEVJGcHFAAm6NsGrGcrkHBqIP8ANyMipHHGV6UASRTsO5rX0u7aNjISeBXPucDcKfDdsFwDxQB6d4d1trhirk9fWuvRty5rxnSNT+zzqexPNeoaNqSXMC/MM0wNiigciikAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVDcTrDGWY4p00qxIWY4riPE+vbQ0cTn8KAKvifxAz7oYG+tcJczF3OTn1p8108krFiTmqzDMbnuaAI4Mu7HtVsRbgMim2UWF5q221BzQBSmwnSqrZzz1q1MQWzVNmw2TQBIrBOTSfaTmmKVbqanWFGFACAmQZU1GwY1OsYjPFKcBuaAK6Rng45q4IwkWe5pgxuBFSb1b5SaYDIoshmNSLF8lTKV+ztt7VCkwMY56UABRV+tQ3BATbT5JMksegqlJIZJOelACDhTSq24UgU545FOWPFACDerZU8VZV94560xYzinhAOppANON2DUyrx1zTSEoBAHFAD2GRSBQRzQGwMUpbigCJ4u4pBn+L86k38c0mARxQAinaeelSiQD6VF14pV9DQBJJGrp8pqv5TJ3qQMRUqEMuGoAjt3IcAnrXX6Fqz2ZUM3y5rkTHt+YVMsrjHzcUAe16ZqMd5EpVhnFaNee+ELvaVUyZzXfxsGUGgB9FFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUE4FFUtTu1tbZ3Y4wKAMbxVqi2tsVVvmPvXmNxO1xKzu3Bq9r+qte3bZPyisUyDOaAE2fOT2FIu0BgacGyDUEzY6UASxS7XxninyylmAHes9HPmZNaVpHu+dqAIJIzVWVCMZ71pyr1NZs5O/2FMCLGDViJgo96Y0eUDioyzK2e1IC6XyPu0gXcOlMjcsOtS4bHBoAYDtGMUwqc8HrUvPelCh+O9ADoDttpFJ5qkGZFIq4g2gqahmUE0AQguV9aQpkelOWMg8Gp1Hy4agCBFwetWQoIpphU8g05E2tycUABA6ZwaRlK/SpJIwec5qCUvHgjkUALtz0NNywbGKRZQ3UYNLu96AHqxPan9qh30hcnpTAex9aaGAPWk5PBpQgUc8mkA/eKN3NRncTjHFGDnC9O5oAlPWpFGFqsX52irB4QYoAY77cg9DQjb0wDzUMp5Ge9SRxBCCTQM1dIvpLRw2Twa9T0DVkvLdTnnHPNePb63vDeqm0uQpbCn1oA9hByKWqmn3SXECsrA5FW6BBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAGuT8aXG2wcBscV1UjBUJPpXmfjjUgzmJWoA4eaUsxJPeot+aYxYsTT48Z9TQBYQEgU24TaAO5qZMKM96UIHO40wKGwBhmtGKTCAdqqyR/MSKQSEcGgC1LJxgdTVSdOM0qMWlJPQU+5P7qgCCF8Daehpsi7TkdKI1O4CpJ0IIUUgEhwTVtemKqohBB9KfLuQh1JxQBK4IFRBj9DSCbf3pC4pgOEh70hZT1qMsKYWFICXd6VHJLjgdajZzjimA5agCdZW29aeJT3qMDilH0pgTCU44PFEjgpzUIz2ofO2kAwctxU3lFuelVgDu4qdZCBimA/yuKekQUZ701Zc0ebmgCQKM5pxUdahV8mpFy5y3ApAB2imtyOKV1BpOPXFAEZUL061Yj5GTUOFzy1SoygdaAIWQtLuPQdKmYbgCKOGPHSgccUAIoboRSJLtk4OMU9W9apSHDHB70AeseC9S863CM/IrtlORmvF/CF+1veorEhWIr2K0kEkKsPSgCeiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiio5pVjjLMcAUAZmuaglpbPk9j3rx/W7prudnrovGGrm5ujDE3yj0rj5STmgCAIccmnphBnvTSaaT2oAniYs2TVgt2FVUbaKcrFjQBO2NhrPdz5lXJGATFU2+/kUASB8ECrEw3bFqmv+tH1q6pDS59KAEjj/eE9hQy7pM09nA6UzfTAcAAaCM8GhmGwN3piyeooAryRFWytNbIHIq0cHkGmsMjpSAqZFMJ5qw0ftTAgzRcdiMKTTkTBwal8vvSgetArCcgYApQeKRh6U3HUUAKXxTQ5Y4pNvNSKtA7DSm08UznNWSuRmmgZoCxFgkU4Rj1qQClGAaBCqFUcDJp6k/xH8KaTxzTC460APmfYnvVdSW696Uv5rAVKIyCKYDRDkZBoEZB5qwvuKUr3pARghaOhyT1oZaiyxfk0DLGKpOh804q+CCAD1qFUzITQBd0gMLmPHXIr2nRs/Ykz1xXlPh2z8++THYivXLCPy7dR7UAWqKKKBBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAB6Vx/jPVXtYfJjOGauvbpXCeM7YtIJSM4oA4eZGEbTTE7m6VQTDMa19QI8lSe44rJGFOaAK0qgEmmAjtUlwoJyKiHFAD81IHxUGcU5fmOKAFdtx9qapzxQ/BIpIutAxwHP0qVWwCTUTHDcUrE7KBAZMtU6pkc1VQEHOK0LdRtyeTSbGkQt0A9KQjrj0qyYepxUBUqcjpRcbRCM4zUit60DaTThHzntQAuA3A61H5eH6VJDxLkjip5ApfIpDsR+X8uaiKc1qRQBoScVSkjIYrSTG0VyvNMZeOKlGckGlxVEFcJuGamWPinRrhs9qnMRwGUcUmykiDyziozEy9BWiihkx3oWPDYYcGlcdjPjUseaGTBrTNqM5UVXlg5ouFiky8VC0bHjNWJI2V8UgHODVXIsQDEQ4605JXzk0sseelRAEGncRcSUHrTi64qqpNKQ56CgB7yDsaSMkmmhTn5hUyAbeKAHA96kTB5pmMKKenGfSgDrPBaBrrd716hEMIK828Dp85PvXpUf3BQA6iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACsPxFZ/aLUhRk1uU2RA64IoA8f1SzMCsWzhRXN5JY16V42tVjtyUXqDXmxGAfegBpGahddpq7Gg4zVe5A3YFAFcY71JGRuyKjIpUGKAFlI3HFNTinMM80RoWbFIY4DPNB+9ipCMcVJbW5kfJ4ApXHYVLfLCr0UQQdKaFCygCtCNN2Kls0SKxjJXpUkVmPKYEc1djtyxyRU/lcYAqLlcpzdxZMDlRUCI+4K+a6r7OG4YU06fGeq1SkJwMiK3XZUUibXwK0Lm28o4jY/So4bGV23MDRcLDoQ3lYAqvPFySa0mUxptxioBCZDluBSuNoyGhJycVXyUJBrduI0VccCqIspJmyBgVSkQ4lONtxwKvQNjCsOKcmmunIBqeOHHDrQ5DUWKYFYZU4NNKAHBqz5AAyrU6OEE561NyrEKxErweaabVgNx5NXQo3cDpU4UEdKVx2OcuYmDZxVJuGrpLqFWPSsi7tDyVq0yGikcFahwBUmGDbSOaV4ip5qrmbQxcDk1J5oxxSCPK1CUwcGncViTeC1PB7VGoCipFIpgOZvnFTggrxUHGRSwtiRlNAjuvA6Nnd2zXoyfdFcB4IGYxx3r0BegoAWiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDm/FtmbiyYjqAa8mmiK3BQ9jXtusRmSykAGTivHdQiaG9k3jnNAFGT5eRVFiWkNW5X3vtFVmXDmgBO/NIBzmlYEGpUXd2oGhETd2qWKNt20CpoIhnpV6KMRjdjmobLSM6WEhwoHNaFvaSFBjgVNBaGSTewrUjQIuMVDkaKJQjsBjJ61oW9sEAGKnjTjpVpEBUcVFy0iFYQOlPEWTmp1SpFjpDKxgBHSonif7oNaYQYo8oZzigDMjsBnc4yanMAA4FXvLpDHmmBmPbBxyKgaz7DpWuY8dqYYs0AY405N2SM1ZjtABjFXxFTxH7UXCxTW3X0prWaNztrREftSiOkMzBYoe1MbT1xxkVrGIdqCnHSmIyFtQoxSNEV6VpGLnpTGi4oAynhz1FV5LcHtWw0PtUDw+1NEs5+5sQeQKqNbEjHWukeHjpVOW3HUDBqrktGA0Lxn7vFVZgwOSK6B4z3FULuAMDtHSqTIlEysEsKm2EYpu3DjNWMA1ZmRMCMGlAO8OO9SFc8Uttggq3UGmI9B8D4MI9a7xelcn4OtFSyR1FdaKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKK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7gZcgVv+DrRvtW/BxWyMGekwj92KkpsYwgFOqiQooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKbJ9w06oppFCHmgDyvxsuNSz61iWv3hW/wCNADe5rBtx8wxSkOJuRfcFS1DD90VYA5Fc7OlDkTilbgVIgyKR1oGU55Ni8dao+dHCTJKct2FWbokZwMmsO5inlfkcVcURJs0DqUty2yEe1UNTW4iI3seas6cjW7AsK0NRhS8tgV+8KtNIhps56FlCEOu4nuTUk0dtLGCg2sBzzQ1jOTjbUiadPuAIwO9VdEcrLlnpJmsBKpIeqpa4tZNsikgHrW/Fci3tlijTOB1qncCSbP7sc1LsWkxLURXS/KQG9KsCJomxVC3tLiKYOuBWtkyYz1rNmiLEBxitGJ+KoRLjFXYhWZoifdmmseKeo4qOQGgZSuuVqmINwzV2UbhioCCBgU0yWjJvnWAbVGWNUoLWS5kzIcCtW4sRLJvZsGmC329HNapmTRBqmmIljmMZIrnlzFypIautK5QqXJHpVNtMgdiSKrmJcDDW5JjZZOSa2tJtlNqTJ0PrQNJgDDANaEdooQDJx6UOYKmc7qVukcuYT+VMtJpFIVxkV0clhCQciqy2MYbAHFS5FKFiezb5RV5eagggCAACrargVkzRELDmmS/6s1Mw5qKX/VmmhMxJh8xrt/BYVoN3euLkALmt3w5qK2IKuTyelb3MGrnpQ6UVgxa9G+ODWxb3CzoGU000yXFomooopiCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKRzhTQBn6hfrbjGea5271afcdpOKo+KdReG7wOeapWl/Fcrjo3oaylJm8YK2pT1tmvSGwd3esqJCjgEV07RI47Vk31tsmDL0NClcHC2xPCOBVpR0qGAfKKsLUMtE8S5FSmIN2pkXFWBUlFSS1Q9qz7i02nIWt3bxUTwhhzTuKxghVXqKUlMYzitGWzB6Cqslg2eKdwsVwyqOopjzZNTGwf1pyaee9O4rFXzGJwoqzDHI/Jq3FZKvWrSQ9lFFwsUxDxjvUixY7VdEIUVGwxUtlJDUXFW4hUCDAqeKpKJscU1hxUoGRTWpiKciVCYw3arbYNR4waQym8WeCKry2rYyprW2ButI0OOlUmS0YLJKnUUgcjqDW00QPUVE1uh/hFO4WM1ZKlWU1b+yp6CnLboD0qbhYqgM9TR2/cirSxgdBUoX2ouOxAIgO1BWrG2o2WgRTcYNQyDKGrUoqBhlTTRLMmKFprggdK1YbRV6jmorJdsr8VoBWbhaG2EUitcXSWi8nn0re8NambgAE9a5C/gfzjuJNaHhuUx3QT3qouzHON0elqcilqK3OYgfapa3OQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqG6fZCx9qmqrf/8AHs30oBHmniSTzrw/Wqem2jSS5GQBVrV0/wBNJPrVzTIwkRbHWuds7EtBgZon2tTbgiRKnvI9yb16iqIcnikhMlj4UVYSq8Z4qdOtNiRbiGasLUENWkGahli44o21KBSlaLAQFfamGMelWtgxSFKBlIx+1AjPYVb8sUu0DtVCIEh7mpAgFPHSg0CIZOBVcjJqeU1BmpZSCp4hUIHNWYhihATAYFManimOKYiA8GkNK1MJ5pDHoeanUAiqyEGrCA00Jg0YqNohU5pOtFgRX8qk8nmrW2gJRYLkAjpduKnCil2UWC5XK1C4xVxkqCROKAKbjNQSDAqywxUEooRLK0J2ymti0Qqm5u9YXmCO4rYt7gsoGaYJFbVYQCGqHREH24H3rSvIxLbk+lUdHX/T1x60Ip7HoVt/qVqaorb/AFK1LXScQUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABUN0m+Jh7VNTZOUNAHmeux7b4fWrMGI4AKl8QQH7UDj+KoJDsiA9q5pHbHVFW9uCqnBrMt5y8hUnmrlwN/FVre1JnyKEKRdU4qaNuahb5TinxHmqZCNCE1dj6VRgPSr0fIqDQsL16VJjNImMU/pTJY0LSMtOLCm7qYDSBSUrGmM2KBiHrUbMBSPJUBbJpNhYSVyTgUzB71MiZ60roAKkojjHNW414qqjAGpxIAOKYifFIVyKYJQaesgxTFqVpFxUWMmrEzLUceCakoi2EHIqeKTsakIXFV3wpyKALW8GgGq4filWTmncVi2tOFV1kqVWp3E0ShRS7ajLccGnLJTEKVqGRfapWeonbikxopTpzmqklXZTmqUnekhMzZo2NwG7Vft2xipBGHgzjnNVnPltQVE1EbehX2qvoqkaiQR0NJZSFm5q5paf6ex/2qI7hLRHZwf6sVJTIf9WKfXUcQUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABSHpS0UAcr4jhHmA1z950Fddr0G6Ld6Vyt2uYwRWFRanVSehSjTccVbSIJ09KqQtiQZq/Kw2BgakplCfiQ02JsNin3POGFQDIcGq6Gb3NWBuKvRvgVlxPgCrSScdazZqtjSWSlaTIqksme9Lv96LjsWAxHelDioEIHehnC0XCxOz1DJJUDzgd6rmbe2BRcViVpCTxTS+DzTo1Bp0kW5KYCidQOtQy3qDgsPzrOu/NiJ64rMmQzHljTSE2bou0J4YfnU6TZHWuT+xyKdyOwrRtLiVAFlOfehxEpG8JqXz/AHrLNx70eeSDSsVct3F4sYJZsVQOuRq+FyaabX7RzISfakaxii6IM1SSJbZeg1ZZRVpZfN6ViJA7NwuBWzaJsQClYdy0F+Wo2BXmplNIRmk0O5EsuDzU6SgiqsqYyRUIlKnk0hmoHoEgzgVSSbPepBJRcLFvfUbvxUPmU1nyKQCSPgVXY7hmnSNmox0qkQyzCP3QFUL35ZMVct97AhRUEtq7TfP3oKQ6wyecVr6Wv+lD61SwlvFtH3jWtoUO9t5604LUmo/dOki+4KfSKMClrpOQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAztXQvbsB6VxpOyQxSj5W6V3tym+Ij2rj7+3AkKsOexrKouptSfQy5bYb8p0olhdY+KlZWjHWpUkDphhWNzcyI5N+6Nuopcc1Ynt0Vy68GoRVpmbRKlSq+KhU0+pZSLEb+9SeZzVZTTw1SWiZpCOlQSzH1oZsdapXMuKaQN2HyTknANSwVliXL4zV+3bjNVymfMaMZxU2/iqi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KACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAKeorugYe1ee3S7LlwfWvQ7tgcLnrXDawm2/bHeonsaU9yqp4p1IvSnCsDcbtz9aYy+tS4xRigCqyVEY+auMtMIp3CxVMVNMGe1XCtKEp3FYy5bb2qnJbGt9o81XkgB6UXFymEbc+lIIPatV4eaZ5XNPmFylJIOelXoLYYHFSRw89KuQx4xxRcdiOO329qsJF7VMEGKdjFJsdiIoBSBakIpAOakYqrUgX0pAtPBwKAFUYpe9IKcBSGIRUUgqY1G4oAtaM224we9M8aWZe0W7jHzR85FR2LFbxAO5rpb+3F1p8sJH3lIrpp7HNU3MDwf4hEiJbTt8wHBJruo3DqCDXhjtJp+oOoJDRsRXpnhbXUvrdUdgJFAyM1bIOpopFIIyKWkAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFVry6S1gaSRgAPWp3YKpJrz3xrrZLtbQucA84oA1tM1JtSvpn3ZROBWfrq4ugfUVH4EBa2kc9SateIoykqNjg1M9i6e5loOKdUaGpRXOdIGm45p+KMetIBpx3prD0px9qZmgBuKcKTNL0piFNNwKKM0ARvGM5qPygTVoAG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FFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAyRwiFieBXl/jnW/PmaCJvlU44Ndn4r1EWWmSkNhiMCvF724eed3Y5yaYELMSc04e1RipQKBCinZoApDQACnDpTacOlAETjD5qVKZKOh9Keh4FMB30pabmlzQApoFJmjNAC0UgpcUALQKSloAcKO9IKByaAF70HpSg0GgBv4UvajtSgcUAIRxUUfEn1qY4xUL8MDQBNzRSg5FIaACkNLSGgApKWlAxQAUGijrQAhopfrScUAGKbS0GgBBSik5oHWgBwpaQUvNAHZ+BJceZHnvXcJXnfgiTF+yetehpQBKBS4oFLSGMIpV4NOxSYpiBhkVERipe1MYUDG0Z4oqtfzi3s5ZScBVoEefeNL43WqmEHKxcfjXPhPUVPdzG4vZZTzuYmmFuKAGHAqFyWO1TSuSTinRKF5NAD4EEY5602VjTg3OTTG5oAryU+AkfSmuD1oiJBoA1NNuja30c4PIPNes2konto5V6MoNeOqQceteheDNR+0WZtnb54+n0oA6eiilFABSiilFAxDTCKkNMIoEMNQyVOahcUAebeMVxrBPqKw66LxsuNUU/7Nc4KAF60hp2cUhwaAE+lFHFHegAoFFAoAWk70UooAKM0UUAFLSGl7UAApKX2o/CgBkv3aZGOKWY4FKnIoAdR2pKUUAOAo4pKXPFAAabSmkoAKOgpD1oNAC9RTaCaKAE+tNPWlzSHrQAGijrSUAGcVFIeKeaik6UgFhHFSk0yLgU80wGmkpSKbQA9TUgNQg09TQBL1FIRmkBpQaAImXBrvvh3dbWaFm964VlyM1veCpSmsooPBoA9nU5UGlqOA5iX6VJUjCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigApGOBS1HMcRn6UAebfEW/BlECt0HNednLGui8ZTNJrMoJ4BxWDGmaYgValAo24FHQUALTCeaUmmmgAp69KZSimAsn3aSM8Up6UxDg4oAlooFLQACiil7UAHajmigUALkmjvQDR3oAUUq5pKUGgBe9Gc9aM+9FABSikzQeTQAHpUcg4qQ0jgEUAEZyop2OajiPJHpUpoAT1pDSkUnegBeoox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';
const lanyardRootEl = document.getElementById('lanyard-root');
if (lanyardRootEl && window.ReactDOM && window.React && window.THREE) {
  const root = ReactDOM.createRoot(lanyardRootEl);
  root.render(
    React.createElement(Lanyard, {
      frontImage: lanyardPortrait,
      backImage: lanyardPortrait,
      imageFit: 'cover',
      cardColor: '#f7f7f8',
      orientation: 'portrait',
      finish: 'matte',
      cornerRadius: 0.24,
      size: 0.82,
      anchor: 'center',
      strapLength: 0.32,
      strapColor: '#111114',
      strapWidth: 0.82,
      metal: 'silver',
      gravity: 0.9,
      damping: 0.58,
      elasticity: 0.42,
      breeze: 0.12,
      interactive: true,
      intro: true,
      style: { width: '100%', height: '100%' }
    })
  );
}
