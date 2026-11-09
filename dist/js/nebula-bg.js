(function(){"use strict";var e=document.getElementById(`nebula-bg`);if(!e)return;var t=e.getContext(`webgl2`,{antialias:!1,alpha:!1,depth:!1,powerPreference:`high-performance`});if(!t){e.style.display=`none`;return}var n=`#version 300 es
void main(){
vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`,r=`#version 300 es
precision highp float;
uniform vec2 uRes;uniform float uDpr;uniform float uTime;
uniform vec2 uPointer;uniform float uPointerOn;uniform vec2 uLook;
out vec4 frag;
float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash12(i),b=hash12(i+vec2(1,0)),c=hash12(i+vec2(0,1)),d=hash12(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float s=0.0,a=0.5;mat2 r=mat2(0.8,-0.6,0.6,0.8);for(int i=0;i<5;i++){s+=a*vnoise(p);p=r*p*2.03+17.1;a*=0.5;}return s/0.96875;}
float bayer4(vec2 c){vec2 m=mod(c,4.0);int i=int(m.x)+int(m.y)*4;int b[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);return(float(b[i])+0.5)/16.0;}
vec3 ramp(float d){
  vec3 c=mix(vec3(0.020,0.012,0.035),vec3(0.086,0.102,0.220),smoothstep(0.0,0.22,d));
  c=mix(c,vec3(0.361,0.051,0.192),smoothstep(0.18,0.44,d));
  c=mix(c,vec3(0.753,0.071,0.271),smoothstep(0.42,0.72,d));
  return mix(c,vec3(1.0,0.122,0.353),smoothstep(0.7,0.96,d));}
void main(){
  vec2 resCss=uRes/uDpr;
  vec2 css=gl_FragCoord.xy/uDpr;
  float px=6.0;
  vec2 cell=floor(css/px);
  vec2 cellC=(cell+0.5)*px;
  vec2 f=fract(css/px)-0.5;
  float dith=bayer4(cell);
  float minSide=min(resCss.x,resCss.y);
  vec2 uv=(cellC-0.5*resCss)/minSide;
  vec2 look=uLook*0.05;
  vec2 toP=cellC-uPointer;
  float lamp=exp(-dot(toP,toP)/(170.0*170.0))*uPointerOn;
  vec2 p=uv*1.7+look;
  p+=toP/minSide*lamp*0.3*1.7;
  float t=uTime*0.035;
  vec2 q=vec2(fbm(p+vec2(0,t*0.7)),fbm(p+vec2(5.2,1.3)-t*0.5));
  float n=fbm(p+1.5*q+vec2(t*0.4,-t*0.25));
  vec2 dir=vec2(cos(1.05),sin(1.05));
  float along=dot(uv,dir);
  float across=dot(uv,vec2(-dir.y,dir.x))-0.42-0.22*sin(along*2.3+t*3.0)-(q.x-0.5)*0.35;
  float river=exp(-across*across/(0.34*0.34));
  float raw=n+river*0.5*0.5+(0.5-0.5)*0.5;
  float d=smoothstep(0.54,0.54+0.5,raw);
  d=clamp(d+lamp*0.55*0.45,0.0,1.0);
  float hz=smoothstep(0.25,0.75,n+river*0.25)*0.8;
  float tone=fbm(p*0.45+vec2(11,-3)+t*0.2);
  vec3 hazeCol=mix(vec3(0.086,0.102,0.220),vec3(0.231,0.086,0.275),smoothstep(0.38,0.62,tone));
  float L=7.0;
  float dq=clamp(floor(d*L+dith)/L,0.0,1.0);
  float hq=floor(hz*3.0+dith)/3.0;
  vec3 bg=mix(vec3(0.020,0.012,0.035),hazeCol,hq*0.7);
  bg=mix(bg,ramp(dq*0.7)*0.42,smoothstep(0.0,0.3,dq));
  float r=mix(0.12,0.56,sqrt(dq));
  float dotMask=step(length(f),r);
  vec3 dotCol=dq<0.01?mix(vec3(0.020,0.012,0.035),hazeCol,0.35+hq*0.5):ramp(min(dq+0.1,1.0));
  vec3 col=mix(bg,dotCol,dotMask);
  for(int l=0;l<3;l++){
    float fl=float(l);float depth=0.3+fl*0.4;
    float gpx=px*(l==2?2.0:1.0);
    vec2 sp=css+vec2(0,0);
    vec2 id=floor(sp/gpx);
    vec2 fr=fract(sp/gpx)-0.5;
    float prob=l==0?0.009:l==1?0.014:0.01;
    float h=hash12(id+fl*71.3);
    if(h>1.0-prob){
      float h2=hash12(id*1.7+3.1+fl);
      float tw=0.45+0.55*(0.5+0.5*sin(uTime*1.4*(0.6+h2*2.5)+h2*40.0));
      float rad=l==2?0.42:0.26+h2*0.22;
      float m=step(length(fr),rad);
      vec3 sc=(l==0||h2>0.82)?vec3(0.965,0.886,0.910):vec3(1.0,0.122,0.353);
      col=mix(col,sc,m*tw*(1.0-d*0.55));
    }
  }
  vec2 pc=vec2(0.26,0.36)*resCss; float R=0.075*minSide;
  vec2 dc=cellC-pc;
  if(length(dc)<R){
    vec2 n2=dc/R; float z=sqrt(max(1.0-dot(n2,n2),0.0));
    float lit=clamp(dot(vec3(n2,z),normalize(vec3(-0.45,0.55,0.7))),0.0,1.0);
    float surf=fbm(vec2(n2.x*1.4+uTime*0.015,n2.y*4.2)*1.6+9.0);
    float pd=clamp(lit*1.05-smoothstep(0.55,0.75,surf)*0.45*(1.0-lit*0.5)+0.05,0.0,1.0);
    float pq=floor(pd*L+dith)/L;
    vec3 pbg=mix(mix(vec3(0.020,0.012,0.035),vec3(0.361,0.051,0.192),0.35),vec3(0.361,0.051,0.192),pq);
    float pr=mix(0.2,0.62,sqrt(pq));
    vec3 pdot=ramp(min(pq*0.85+0.25,1.0));
    col=mix(pbg,pdot,step(length(f),pr));
  }
  vec2 vu=gl_FragCoord.xy/uRes-0.5;
  col*=1.0-0.5*smoothstep(0.35,0.95,length(vu*vec2(uRes.x/uRes.y,1.0)*1.1));
  col+=(hash12(floor(css)+fract(uTime)*91.0)-0.5)*0.035;
  frag=vec4(max(col,vec3(0)),1.0);
}`;function i(e,n){var r=t.createShader(e);return t.shaderSource(r,n),t.compileShader(r),t.getShaderParameter(r,t.COMPILE_STATUS)?r:(console.error(`nebula shader:`,t.getShaderInfoLog(r)),t.deleteShader(r),null)}var a=i(t.VERTEX_SHADER,n),o=i(t.FRAGMENT_SHADER,r);if(!a||!o){e.style.display=`none`;return}var s=t.createProgram();if(t.attachShader(s,a),t.attachShader(s,o),t.linkProgram(s),t.deleteShader(a),t.deleteShader(o),!t.getProgramParameter(s,t.LINK_STATUS)){console.error(`nebula link:`,t.getProgramInfoLog(s)),e.style.display=`none`;return}var c=t.getUniformLocation(s,`uRes`),l=t.getUniformLocation(s,`uDpr`),u=t.getUniformLocation(s,`uTime`),d=t.getUniformLocation(s,`uPointer`),f=t.getUniformLocation(s,`uPointerOn`),p=t.getUniformLocation(s,`uLook`),m=t.createVertexArray(),h=Math.min(window.devicePixelRatio||1,1.5),g=1,_=1;function v(){h=Math.min(window.devicePixelRatio||1,1.5),g=window.innerWidth,_=window.innerHeight,e.width=Math.floor(g*h),e.height=Math.floor(_*h)}v(),window.addEventListener(`resize`,v);var y=performance.now(),b=g*.5,x=_*.5,S=.5,C=.5,w=0,T=0,E=0,D=!1,O=-1e9;function k(e){var t=.5+.32*Math.sin(e*.21)+.1*Math.sin(e*.077+1.3),n=.5+.26*Math.cos(e*.17)+.12*Math.cos(e*.053+4.2);return[Math.min(Math.max(t,.05),.95),Math.min(Math.max(n,.05),.95)]}window.addEventListener(`pointermove`,function(e){b=e.clientX,x=_-e.clientY,D=!0,O=performance.now()/1e3},{passive:!0}),window.addEventListener(`pointerleave`,function(){D=!1});var A=0;function j(){var n=performance.now(),r=(n-y)/1e3,i=.016,a=!D||n/1e3-O>5,o=k(r*.6),v=a?o[0]*g:b,M=a?o[1]*_:x,N=1-Math.exp(-i*(a?1.5:7));S+=(v/g-S)*N,C+=(M/_-C)*N,w+=((v/g-.5)*2-w)*N,T+=((M/_-.5)*2-T)*N,E+=((a?.55:1)-E)*(1-Math.exp(-i*3)),t.useProgram(s),t.bindVertexArray(m),t.viewport(0,0,e.width,e.height),t.uniform2f(c,e.width,e.height),t.uniform1f(l,h),t.uniform1f(u,r),t.uniform2f(d,S*g,C*_),t.uniform1f(f,E),t.uniform2f(p,w,T),t.drawArrays(t.TRIANGLES,0,3),A=requestAnimationFrame(j)}new IntersectionObserver(function(e){e.some(function(e){return e.isIntersecting})?A||=requestAnimationFrame(j):(cancelAnimationFrame(A),A=0)}).observe(e),A=requestAnimationFrame(j),e.addEventListener(`webglcontextlost`,function(e){e.preventDefault(),cancelAnimationFrame(A),A=0})})();