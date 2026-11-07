/**
 * Halftone Nebula WebGL2 Background Shader
 * Procedural FBM noise, Bayer dithering, interactive mouse tracking lamp, and auto-drift.
 */
(function initNebula() {
  'use strict';
  var canvas = document.getElementById('nebula-bg');
  if (!canvas) return;
  var gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.style.display = 'none'; return; }

  var VERT = '#version 300 es\nvoid main(){\nvec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));\ngl_Position=vec4(p*2.0-1.0,0.0,1.0);}';

  var FRAG = '#version 300 es\nprecision highp float;\n' +
  'uniform vec2 uRes;uniform float uDpr;uniform float uTime;\n' +
  'uniform vec2 uPointer;uniform float uPointerOn;uniform vec2 uLook;\n' +
  'out vec4 frag;\n' +
  'float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}\n' +
  'float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash12(i),b=hash12(i+vec2(1,0)),c=hash12(i+vec2(0,1)),d=hash12(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}\n' +
  'float fbm(vec2 p){float s=0.0,a=0.5;mat2 r=mat2(0.8,-0.6,0.6,0.8);for(int i=0;i<5;i++){s+=a*vnoise(p);p=r*p*2.03+17.1;a*=0.5;}return s/0.96875;}\n' +
  'float bayer4(vec2 c){vec2 m=mod(c,4.0);int i=int(m.x)+int(m.y)*4;int b[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);return(float(b[i])+0.5)/16.0;}\n' +
  'vec3 ramp(float d){\n' +
  '  vec3 c=mix(vec3(0.020,0.012,0.035),vec3(0.086,0.102,0.220),smoothstep(0.0,0.22,d));\n' +
  '  c=mix(c,vec3(0.361,0.051,0.192),smoothstep(0.18,0.44,d));\n' +
  '  c=mix(c,vec3(0.753,0.071,0.271),smoothstep(0.42,0.72,d));\n' +
  '  return mix(c,vec3(1.0,0.122,0.353),smoothstep(0.7,0.96,d));}\n' +
  'void main(){\n' +
  '  vec2 resCss=uRes/uDpr;\n' +
  '  vec2 css=gl_FragCoord.xy/uDpr;\n' +
  '  float px=6.0;\n' +
  '  vec2 cell=floor(css/px);\n' +
  '  vec2 cellC=(cell+0.5)*px;\n' +
  '  vec2 f=fract(css/px)-0.5;\n' +
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
  '  float d=smoothstep(0.54,0.54+0.5,raw);\n' +
  '  d=clamp(d+lamp*0.55*0.45,0.0,1.0);\n' +
  '  float hz=smoothstep(0.25,0.75,n+river*0.25)*0.8;\n' +
  '  float tone=fbm(p*0.45+vec2(11,-3)+t*0.2);\n' +
  '  vec3 hazeCol=mix(vec3(0.086,0.102,0.220),vec3(0.231,0.086,0.275),smoothstep(0.38,0.62,tone));\n' +
  '  float L=7.0;\n' +
  '  float dq=clamp(floor(d*L+dith)/L,0.0,1.0);\n' +
  '  float hq=floor(hz*3.0+dith)/3.0;\n' +
  '  vec3 bg=mix(vec3(0.020,0.012,0.035),hazeCol,hq*0.7);\n' +
  '  bg=mix(bg,ramp(dq*0.7)*0.42,smoothstep(0.0,0.3,dq));\n' +
  '  float r=mix(0.12,0.56,sqrt(dq));\n' +
  '  float dotMask=step(length(f),r);\n' +
  '  vec3 dotCol=dq<0.01?mix(vec3(0.020,0.012,0.035),hazeCol,0.35+hq*0.5):ramp(min(dq+0.1,1.0));\n' +
  '  vec3 col=mix(bg,dotCol,dotMask);\n' +
  '  for(int l=0;l<3;l++){\n' +
  '    float fl=float(l);float depth=0.3+fl*0.4;\n' +
  '    float gpx=px*(l==2?2.0:1.0);\n' +
  '    vec2 sp=css+vec2(0,0);\n' +
  '    vec2 id=floor(sp/gpx);\n' +
  '    vec2 fr=fract(sp/gpx)-0.5;\n' +
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
  '  vec2 pc=vec2(0.26,0.36)*resCss; float R=0.075*minSide;\n' +
  '  vec2 dc=cellC-pc;\n' +
  '  if(length(dc)<R){\n' +
  '    vec2 n2=dc/R; float z=sqrt(max(1.0-dot(n2,n2),0.0));\n' +
  '    float lit=clamp(dot(vec3(n2,z),normalize(vec3(-0.45,0.55,0.7))),0.0,1.0);\n' +
  '    float surf=fbm(vec2(n2.x*1.4+uTime*0.015,n2.y*4.2)*1.6+9.0);\n' +
  '    float pd=clamp(lit*1.05-smoothstep(0.55,0.75,surf)*0.45*(1.0-lit*0.5)+0.05,0.0,1.0);\n' +
  '    float pq=floor(pd*L+dith)/L;\n' +
  '    vec3 pbg=mix(mix(vec3(0.020,0.012,0.035),vec3(0.361,0.051,0.192),0.35),vec3(0.361,0.051,0.192),pq);\n' +
  '    float pr=mix(0.2,0.62,sqrt(pq));\n' +
  '    vec3 pdot=ramp(min(pq*0.85+0.25,1.0));\n' +
  '    col=mix(pbg,pdot,step(length(f),pr));\n' +
  '  }\n' +
  '  vec2 vu=gl_FragCoord.xy/uRes-0.5;\n' +
  '  col*=1.0-0.5*smoothstep(0.35,0.95,length(vu*vec2(uRes.x/uRes.y,1.0)*1.1));\n' +
  '  col+=(hash12(floor(css)+fract(uTime)*91.0)-0.5)*0.035;\n' +
  '  frag=vec4(max(col,vec3(0)),1.0);\n' +
  '}';

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('nebula shader:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.style.display = 'none'; return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('nebula link:', gl.getProgramInfoLog(prog));
    canvas.style.display = 'none'; return;
  }

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uDpr = gl.getUniformLocation(prog, 'uDpr');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uPointer = gl.getUniformLocation(prog, 'uPointer');
  var uPointerOn = gl.getUniformLocation(prog, 'uPointerOn');
  var uLook = gl.getUniformLocation(prog, 'uLook');

  var vao = gl.createVertexArray();
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  var w = 1, h = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  resize();
  window.addEventListener('resize', resize);

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

    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uDpr, dpr);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uPointer, lampX * w, lampY * h);
    gl.uniform1f(uPointerOn, lampOn);
    gl.uniform2f(uLook, lookX, lookY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

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
