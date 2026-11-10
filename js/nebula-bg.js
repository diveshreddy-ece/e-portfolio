/**
 * Halftone Nebula WebGL2 Background Shader
 * Procedural FBM noise, Bayer dithering, interactive mouse tracking lamp, and auto-drift.
 *
 * Performance note: every noise/colour term in this effect depends only on the
 * 6px halftone cell, not on the individual pixel. Rendering is therefore split
 * into two passes:
 *   1. "cell" pass  - evaluates the FBM field once per cell into a small
 *                     offscreen texture (~1/36 - 1/81 of the pixel count).
 *   2. "dot" pass   - per pixel, reads its cell and draws the halftone dot,
 *                     twinkling stars, vignette and film grain.
 * The maths is the same as the original single-pass shader (shared GLSL below),
 * which is kept as an automatic fallback if offscreen rendering is unavailable.
 */
(function initNebula() {
  'use strict';
  var canvas = document.getElementById('nebula-bg');
  if (!canvas) return;
  var gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.style.display = 'none'; return; }

  var PX = 6; // halftone cell size in CSS px (must match `px` in GLSL)

  var VERT = '#version 300 es\nvoid main(){\nvec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));\ngl_Position=vec4(p*2.0-1.0,0.0,1.0);}';

  var COMMON =
  'float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}\n' +
  'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash12(i),b=hash12(i+vec2(1,0)),c=hash12(i+vec2(0,1)),d=hash12(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}\n' +
  'float fbm(vec2 p){float s=0.0,a=0.5;mat2 r=mat2(0.8,-0.6,0.6,0.8);for(int i=0;i<5;i++){s+=a*vnoise(p);p=r*p*2.03+17.1;a*=0.5;}return s/0.96875;}\n' +
  'float bayer4(vec2 c){vec2 m=mod(c,4.0);int i=int(m.x)+int(m.y)*4;int b[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);return(float(b[i])+0.5)/16.0;}\n' +
  'vec3 ramp(float d){\n' +
  '  vec3 c=mix(vec3(0.020,0.012,0.035),vec3(0.086,0.102,0.220),smoothstep(0.0,0.22,d));\n' +
  '  c=mix(c,vec3(0.361,0.051,0.192),smoothstep(0.18,0.44,d));\n' +
  '  c=mix(c,vec3(0.753,0.071,0.271),smoothstep(0.42,0.72,d));\n' +
  '  return mix(c,vec3(1.0,0.122,0.353),smoothstep(0.7,0.96,d));}\n' +
  // rk = dither level 0..7 (+8 inside the planet); exact radius per level.
  'float dotRadius(float rk){return rk<7.5?mix(0.12,0.56,sqrt(rk/7.0)):mix(0.2,0.62,sqrt((rk-8.0)/7.0));}\n';

  // Per-cell field: everything that only depends on the halftone cell.
  var CELL_FIELD =
  'void cellField(vec2 cell,vec2 resCss,out vec3 bg,out vec3 dotCol,out float rk,out float d){\n' +
  '  float px=6.0;\n' +
  '  vec2 cellC=(cell+0.5)*px;\n' +
  '  float dith=bayer4(cell);\n' +
  '  float minSide=min(resCss.x,resCss.y);\n' +
  '  vec2 uv=(cellC-0.5*resCss)/minSide;\n' +
  '  vec2 look=uLook*0.05;\n' +
  '  vec2 toP=cellC-uPointer;\n' +
  '  float lamp=exp(-dot(toP,toP)/(170.0*170.0))*uPointerOn;\n' +
  '  vec2 p=uv*1.7+look;\n' +
  '  p+=toP/minSide*lamp*0.3*1.7;\n' +
  '  float t=uTime*0.035;\n' +
  '  vec2 q=vec2(fbm(p+vec2(0,t*0.7)),fbm(p+vec2(5.2,1.3)-t*0.5));\n' +
  '  float n=fbm(p+1.5*q+vec2(t*0.4,-t*0.25));\n' +
  '  vec2 dir=vec2(cos(1.05),sin(1.05));\n' +
  '  float along=dot(uv,dir);\n' +
  '  float across=dot(uv,vec2(-dir.y,dir.x))-0.42-0.22*sin(along*2.3+t*3.0)-(q.x-0.5)*0.35;\n' +
  '  float river=exp(-across*across/(0.34*0.34));\n' +
  '  float raw=n+river*0.5*0.5+(0.5-0.5)*0.5;\n' +
  '  d=smoothstep(0.54,0.54+0.5,raw);\n' +
  '  d=clamp(d+lamp*0.55*0.45,0.0,1.0);\n' +
  '  float hz=smoothstep(0.25,0.75,n+river*0.25)*0.8;\n' +
  '  float tone=fbm(p*0.45+vec2(11,-3)+t*0.2);\n' +
  '  vec3 hazeCol=mix(vec3(0.086,0.102,0.220),vec3(0.231,0.086,0.275),smoothstep(0.38,0.62,tone));\n' +
  '  float L=7.0;\n' +
  '  float dq=clamp(floor(d*L+dith)/L,0.0,1.0);\n' +
  '  float hq=floor(hz*3.0+dith)/3.0;\n' +
  '  bg=mix(vec3(0.020,0.012,0.035),hazeCol,hq*0.7);\n' +
  '  bg=mix(bg,ramp(dq*0.7)*0.42,smoothstep(0.0,0.3,dq));\n' +
  '  rk=dq*7.0;\n' +
  '  dotCol=dq<0.01?mix(vec3(0.020,0.012,0.035),hazeCol,0.35+hq*0.5):ramp(min(dq+0.1,1.0));\n' +
    '  vec2 pc=vec2(0.26,0.36)*resCss; float R=0.075*minSide;\n' +
  '  vec2 dc=cellC-pc;\n' +
  '  if(length(dc)<R){\n' +
  '    vec2 n2=dc/R; float z=sqrt(max(1.0-dot(n2,n2),0.0));\n' +
  '    float lit=clamp(dot(vec3(n2,z),normalize(vec3(-0.45,0.55,0.7))),0.0,1.0);\n' +
  '    float surf=fbm(vec2(n2.x*1.4+uTime*0.015,n2.y*4.2)*1.6+9.0);\n' +
  '    float pd=clamp(lit*1.05-smoothstep(0.55,0.75,surf)*0.45*(1.0-lit*0.5)+0.05,0.0,1.0);\n' +
  '    float pq=floor(pd*L+dith)/L;\n' +
  '    bg=mix(mix(vec3(0.020,0.012,0.035),vec3(0.361,0.051,0.192),0.35),vec3(0.361,0.051,0.192),pq);\n' +
  '    rk=8.0+pq*7.0;\n' +
  '    dotCol=ramp(min(pq*0.85+0.25,1.0));\n' +
    '  }\n' +
  '}\n';

  // Per-pixel shading: halftone dot, stars (hidden under the planet), vignette, grain.
  var PIXEL_SHADE =
  'vec3 shade(vec2 css,vec3 bg,vec3 dotCol,float rk,float d){\n' +
  '  float px=6.0;float r=dotRadius(rk);\n' +
  '  vec2 f=fract(css/px)-0.5;\n' +
  '  vec3 col=mix(bg,dotCol,step(length(f),r));\n' +
  '  if(rk<7.5){\n' +
  '  for(int l=0;l<3;l++){\n' +
  '    float fl=float(l);\n' +
  '    float gpx=px*(l==2?2.0:1.0);\n' +
  '    vec2 id=floor(css/gpx);\n' +
  '    vec2 fr=fract(css/gpx)-0.5;\n' +
  '    float prob=l==0?0.009:l==1?0.014:0.01;\n' +
  '    float h=hash12(id+fl*71.3);\n' +
  '    if(h>1.0-prob){\n' +
  '      float h2=hash12(id*1.7+3.1+fl);\n' +
  '      float tw=0.45+0.55*(0.5+0.5*sin(uTime*1.4*(0.6+h2*2.5)+h2*40.0));\n' +
  '      float rad=l==2?0.42:0.26+h2*0.22;\n' +
  '      float m=step(length(fr),rad);\n' +
  '      vec3 sc=(l==0||h2>0.82)?vec3(0.965,0.886,0.910):vec3(1.0,0.122,0.353);\n' +
  '      col=mix(col,sc,m*tw*(1.0-d*0.55));\n' +
  '    }\n' +
  '  }\n' +
  '  }\n' +
  '  vec2 vu=gl_FragCoord.xy/uRes-0.5;\n' +
  '  col*=1.0-0.5*smoothstep(0.35,0.95,length(vu*vec2(uRes.x/uRes.y,1.0)*1.1));\n' +
  '  col+=(hash12(floor(css)+fract(uTime)*91.0)-0.5)*0.035;\n' +
  '  return max(col,vec3(0));\n' +
  '}\n';

  var HEAD = '#version 300 es\nprecision highp float;\n';

  // Pass 1: one fragment per halftone cell, written to two RGBA8 targets.
  //   target0 = (bg.rgb, dither level index)   target1 = (dot colour.rgb, density)
  var FRAG_CELL = HEAD +
  'uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec2 uPointer;uniform float uPointerOn;uniform vec2 uLook;\n' +
  'layout(location=0) out vec4 o0;layout(location=1) out vec4 o1;\n' +
  COMMON + CELL_FIELD +
  'void main(){\n' +
  '  vec3 bg,dc;float rk,d;\n' +
  '  cellField(floor(gl_FragCoord.xy),uRes/uDpr,bg,dc,rk,d);\n' +
  '  o0=vec4(bg,rk/255.0);\n' +
  '  o1=vec4(dc,d);\n' +
  '}';

  // Pass 2: per pixel, look up the cell and shade.
  var FRAG_DOT = HEAD +
  'uniform vec2 uRes;uniform float uDpr;uniform float uTime;\n' +
  'uniform sampler2D uCell0;uniform sampler2D uCell1;\n' +
  'out vec4 frag;\n' +
  COMMON + PIXEL_SHADE +
  'void main(){\n' +
  '  vec2 css=gl_FragCoord.xy/uDpr;\n' +
  '  ivec2 c=min(ivec2(floor(css/6.0)),textureSize(uCell0,0)-1);\n' +
  '  vec4 a=texelFetch(uCell0,c,0);vec4 b=texelFetch(uCell1,c,0);\n' +
  '  frag=vec4(shade(css,a.rgb,b.rgb,floor(a.a*255.0+0.5),b.a),1.0);\n' +
  '}';

  // Fallback: original single-pass evaluation (identical output, higher cost).
  var FRAG_SINGLE = HEAD +
  'uniform vec2 uRes;uniform float uDpr;uniform float uTime;\n' +
  'uniform vec2 uPointer;uniform float uPointerOn;uniform vec2 uLook;\n' +
  'out vec4 frag;\n' +
  COMMON + CELL_FIELD + PIXEL_SHADE +
  'void main(){\n' +
  '  vec2 resCss=uRes/uDpr;vec2 css=gl_FragCoord.xy/uDpr;\n' +
  '  vec3 bg,dc;float rk,d;\n' +
  '  cellField(floor(css/6.0),resCss,bg,dc,rk,d);\n' +
  '  frag=vec4(shade(css,bg,dc,rk,d),1.0);\n' +
  '}';

  // Shader compile/link is started here, but its status is only queried once the
  // driver reports completion (KHR_parallel_shader_compile), so compilation no
  // longer blocks the main thread during page load. Without the extension this
  // behaves exactly like a normal synchronous compile.
  var parallel = gl.getExtension('KHR_parallel_shader_compile');

  function startProgram(fragSrc, names) {
    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VERT);
    gl.compileShader(vs);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragSrc);
    gl.compileShader(fs);
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    return { prog: p, vs: vs, fs: fs, names: names, u: null };
  }

  function programReady(p) {
    return !parallel || gl.getProgramParameter(p.prog, parallel.COMPLETION_STATUS_KHR);
  }

  function finishProgram(p) {
    var ok = gl.getProgramParameter(p.prog, gl.LINK_STATUS);
    if (!ok) {
      [p.vs, p.fs].forEach(function(sh) {
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error('nebula shader:', gl.getShaderInfoLog(sh));
      });
      console.error('nebula link:', gl.getProgramInfoLog(p.prog));
      gl.deleteProgram(p.prog);
    }
    gl.deleteShader(p.vs);
    gl.deleteShader(p.fs);
    if (!ok) return null;
    p.u = {};
    p.names.forEach(function(n) { p.u[n] = gl.getUniformLocation(p.prog, n); });
    return p;
  }

  var CELL_UNIFORMS = ['uRes', 'uDpr', 'uTime', 'uPointer', 'uPointerOn', 'uLook'];
  var DOT_UNIFORMS = ['uRes', 'uDpr', 'uTime', 'uCell0', 'uCell1'];
  var SINGLE_UNIFORMS = ['uRes', 'uDpr', 'uTime', 'uPointer', 'uPointerOn', 'uLook'];

  var cellProg = null, dotProg = null, singleProg = null;
  // 'pending' -> 'two-pass'; on any failure 'pending-single' -> 'single'; else 'failed'.
  var mode = 'pending';
  var pending = [startProgram(FRAG_CELL, CELL_UNIFORMS), startProgram(FRAG_DOT, DOT_UNIFORMS)];

  var vao = gl.createVertexArray();
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  var w = 1, h = 1;

  // Offscreen cell targets (pass 1).
  var fbo = null, cellTex = [null, null], cellW = 0, cellH = 0;

  function makeCellTarget(cw, ch) {
    if (!fbo) {
      fbo = gl.createFramebuffer();
      for (var i = 0; i < 2; i++) {
        cellTex[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, cellTex[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    }
    for (var j = 0; j < 2; j++) {
      gl.bindTexture(gl.TEXTURE_2D, cellTex[j]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, cw, ch, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cellTex[0], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, cellTex[1], 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    cellW = cw; cellH = ch;
    return ok;
  }

  function ensureCellTarget() {
    var cw = Math.floor(canvas.width / dpr / PX) + 1;
    var ch = Math.floor(canvas.height / dpr / PX) + 1;
    if (cw === cellW && ch === cellH) return true;
    return makeCellTarget(cw, ch);
  }

  function useFallback() {
    if (mode === 'single' || mode === 'pending-single' || mode === 'failed') return;
    cellProg = dotProg = null;
    pending = [startProgram(FRAG_SINGLE, SINGLE_UNIFORMS)];
    mode = 'pending-single';
  }

  // Returns true once a program set is linked and ready to draw.
  function setupReady() {
    if (mode === 'two-pass' || mode === 'single') return true;
    if (mode === 'failed' || !pending.every(programReady)) return false;
    var done = pending.map(finishProgram);
    pending = [];
    if (mode === 'pending') {
      if (done[0] && done[1]) {
        cellProg = done[0]; dotProg = done[1];
        mode = 'two-pass';
        if (ensureCellTarget()) return true;
      }
      done.forEach(function(p) { if (p) gl.deleteProgram(p.prog); });
      useFallback();
      return false;
    }
    if (done[0]) { singleProg = done[0]; mode = 'single'; return true; }
    mode = 'failed';
    canvas.style.display = 'none';
    return false;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    if (mode === 'two-pass' && !ensureCellTarget()) useFallback();
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  var t0 = performance.now();
  var ptrX = w * 0.5, ptrY = h * 0.5;
  var lampX = 0.5, lampY = 0.5;
  var lookX = 0, lookY = 0;
  var lampOn = 0;
  var inside = false;
  var lastTouch = -1e9;

  function driftPos(t) {
    var x = 0.5 + 0.32 * Math.sin(t * 0.21) + 0.1 * Math.sin(t * 0.077 + 1.3);
    var y = 0.5 + 0.26 * Math.cos(t * 0.17) + 0.12 * Math.cos(t * 0.053 + 4.2);
    return [Math.min(Math.max(x, 0.05), 0.95), Math.min(Math.max(y, 0.05), 0.95)];
  }

  window.addEventListener('pointermove', function(e) {
    ptrX = e.clientX;
    ptrY = h - e.clientY;
    inside = true;
    lastTouch = performance.now() / 1000;
  }, { passive: true });
  window.addEventListener('pointerleave', function() { inside = false; });

  var raf = 0;
  function frame() {
    if (!setupReady()) {
      raf = mode === 'failed' ? 0 : requestAnimationFrame(frame);
      return;
    }
    var now = performance.now();
    var t = (now - t0) / 1000;
    var dt = 0.016;

    var idle = !inside || now / 1000 - lastTouch > 5;
    var dp = driftPos(t * 0.6);
    var wantX = idle ? dp[0] * w : ptrX;
    var wantY = idle ? dp[1] * h : ptrY;
    var k = 1 - Math.exp(-dt * (idle ? 1.5 : 7));
    lampX += (wantX / w - lampX) * k;
    lampY += (wantY / h - lampY) * k;
    lookX += ((wantX / w - 0.5) * 2 - lookX) * k;
    lookY += ((wantY / h - 0.5) * 2 - lookY) * k;
    var onTarget = idle ? 0.55 : 1.0;
    lampOn += (onTarget - lampOn) * (1 - Math.exp(-dt * 3));

    gl.bindVertexArray(vao);
    if (mode === 'two-pass') {
      // Pass 1: noise field per cell.
      var cu = cellProg.u;
      gl.useProgram(cellProg.prog);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, cellW, cellH);
      gl.uniform2f(cu.uRes, canvas.width, canvas.height);
      gl.uniform1f(cu.uDpr, dpr);
      gl.uniform1f(cu.uTime, t);
      gl.uniform2f(cu.uPointer, lampX * w, lampY * h);
      gl.uniform1f(cu.uPointerOn, lampOn);
      gl.uniform2f(cu.uLook, lookX, lookY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // Pass 2: halftone dots per pixel.
      var du = dotProg.u;
      gl.useProgram(dotProg.prog);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, cellTex[0]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, cellTex[1]);
      gl.uniform1i(du.uCell0, 0);
      gl.uniform1i(du.uCell1, 1);
      gl.uniform2f(du.uRes, canvas.width, canvas.height);
      gl.uniform1f(du.uDpr, dpr);
      gl.uniform1f(du.uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      var su = singleProg.u;
      gl.useProgram(singleProg.prog);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(su.uRes, canvas.width, canvas.height);
      gl.uniform1f(su.uDpr, dpr);
      gl.uniform1f(su.uTime, t);
      gl.uniform2f(su.uPointer, lampX * w, lampY * h);
      gl.uniform1f(su.uPointerOn, lampOn);
      gl.uniform2f(su.uLook, lookX, lookY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    raf = requestAnimationFrame(frame);
  }

  var io = new IntersectionObserver(function(entries) {
    if (entries.some(function(e) { return e.isIntersecting; })) {
      if (!raf) raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf); raf = 0;
    }
  });
  io.observe(canvas);
  raf = requestAnimationFrame(frame);

  canvas.addEventListener('webglcontextlost', function(e) {
    e.preventDefault();
    cancelAnimationFrame(raf); raf = 0;
  });
})();
