(function(){"use strict";var e=document.getElementById(`nebula-bg`);if(!e)return;var t=e.getContext(`webgl2`,{antialias:!1,alpha:!1,depth:!1,powerPreference:`high-performance`});if(!t){e.style.display=`none`;return}var n=6,r=`#version 300 es
void main(){
vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`,i=`float hash12(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=hash12(i),b=hash12(i+vec2(1,0)),c=hash12(i+vec2(0,1)),d=hash12(i+vec2(1,1));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float s=0.0,a=0.5;mat2 r=mat2(0.8,-0.6,0.6,0.8);for(int i=0;i<5;i++){s+=a*vnoise(p);p=r*p*2.03+17.1;a*=0.5;}return s/0.96875;}
float bayer4(vec2 c){vec2 m=mod(c,4.0);int i=int(m.x)+int(m.y)*4;int b[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);return(float(b[i])+0.5)/16.0;}
vec3 ramp(float d){
  vec3 c=mix(vec3(0.020,0.012,0.035),vec3(0.086,0.102,0.220),smoothstep(0.0,0.22,d));
  c=mix(c,vec3(0.361,0.051,0.192),smoothstep(0.18,0.44,d));
  c=mix(c,vec3(0.753,0.071,0.271),smoothstep(0.42,0.72,d));
  return mix(c,vec3(1.0,0.122,0.353),smoothstep(0.7,0.96,d));}
float dotRadius(float rk){return rk<7.5?mix(0.12,0.56,sqrt(rk/7.0)):mix(0.2,0.62,sqrt((rk-8.0)/7.0));}
`,a=`void cellField(vec2 cell,vec2 resCss,out vec3 bg,out vec3 dotCol,out float rk,out float d){
  float px=6.0;
  vec2 cellC=(cell+0.5)*px;
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
  d=smoothstep(0.54,0.54+0.5,raw);
  d=clamp(d+lamp*0.55*0.45,0.0,1.0);
  float hz=smoothstep(0.25,0.75,n+river*0.25)*0.8;
  float tone=fbm(p*0.45+vec2(11,-3)+t*0.2);
  vec3 hazeCol=mix(vec3(0.086,0.102,0.220),vec3(0.231,0.086,0.275),smoothstep(0.38,0.62,tone));
  float L=7.0;
  float dq=clamp(floor(d*L+dith)/L,0.0,1.0);
  float hq=floor(hz*3.0+dith)/3.0;
  bg=mix(vec3(0.020,0.012,0.035),hazeCol,hq*0.7);
  bg=mix(bg,ramp(dq*0.7)*0.42,smoothstep(0.0,0.3,dq));
  rk=dq*7.0;
  dotCol=dq<0.01?mix(vec3(0.020,0.012,0.035),hazeCol,0.35+hq*0.5):ramp(min(dq+0.1,1.0));
  vec2 pc=vec2(0.26,0.36)*resCss; float R=0.075*minSide;
  vec2 dc=cellC-pc;
  if(length(dc)<R){
    vec2 n2=dc/R; float z=sqrt(max(1.0-dot(n2,n2),0.0));
    float lit=clamp(dot(vec3(n2,z),normalize(vec3(-0.45,0.55,0.7))),0.0,1.0);
    float surf=fbm(vec2(n2.x*1.4+uTime*0.015,n2.y*4.2)*1.6+9.0);
    float pd=clamp(lit*1.05-smoothstep(0.55,0.75,surf)*0.45*(1.0-lit*0.5)+0.05,0.0,1.0);
    float pq=floor(pd*L+dith)/L;
    bg=mix(mix(vec3(0.020,0.012,0.035),vec3(0.361,0.051,0.192),0.35),vec3(0.361,0.051,0.192),pq);
    rk=8.0+pq*7.0;
    dotCol=ramp(min(pq*0.85+0.25,1.0));
  }
}
`,o=`vec3 shade(vec2 css,vec3 bg,vec3 dotCol,float rk,float d){
  float px=6.0;float r=dotRadius(rk);
  vec2 f=fract(css/px)-0.5;
  vec3 col=mix(bg,dotCol,step(length(f),r));
  if(rk<7.5){
  for(int l=0;l<3;l++){
    float fl=float(l);
    float gpx=px*(l==2?2.0:1.0);
    vec2 id=floor(css/gpx);
    vec2 fr=fract(css/gpx)-0.5;
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
  }
  vec2 vu=gl_FragCoord.xy/uRes-0.5;
  col*=1.0-0.5*smoothstep(0.35,0.95,length(vu*vec2(uRes.x/uRes.y,1.0)*1.1));
  col+=(hash12(floor(css)+fract(uTime)*91.0)-0.5)*0.035;
  return max(col,vec3(0));
}
`,s=`#version 300 es
precision highp float;
`,c=s+`uniform vec2 uRes;uniform float uDpr;uniform float uTime;uniform vec2 uPointer;uniform float uPointerOn;uniform vec2 uLook;
layout(location=0) out vec4 o0;layout(location=1) out vec4 o1;
`+i+a+`void main(){
  vec3 bg,dc;float rk,d;
  cellField(floor(gl_FragCoord.xy),uRes/uDpr,bg,dc,rk,d);
  o0=vec4(bg,rk/255.0);
  o1=vec4(dc,d);
}`,l=s+`uniform vec2 uRes;uniform float uDpr;uniform float uTime;
uniform sampler2D uCell0;uniform sampler2D uCell1;
out vec4 frag;
`+i+o+`void main(){
  vec2 css=gl_FragCoord.xy/uDpr;
  ivec2 c=min(ivec2(floor(css/6.0)),textureSize(uCell0,0)-1);
  vec4 a=texelFetch(uCell0,c,0);vec4 b=texelFetch(uCell1,c,0);
  frag=vec4(shade(css,a.rgb,b.rgb,floor(a.a*255.0+0.5),b.a),1.0);
}`,u=s+`uniform vec2 uRes;uniform float uDpr;uniform float uTime;
uniform vec2 uPointer;uniform float uPointerOn;uniform vec2 uLook;
out vec4 frag;
`+i+a+o+`void main(){
  vec2 resCss=uRes/uDpr;vec2 css=gl_FragCoord.xy/uDpr;
  vec3 bg,dc;float rk,d;
  cellField(floor(css/6.0),resCss,bg,dc,rk,d);
  frag=vec4(shade(css,bg,dc,rk,d),1.0);
}`,d=t.getExtension(`KHR_parallel_shader_compile`);function f(e,n){var i=t.createShader(t.VERTEX_SHADER);t.shaderSource(i,r),t.compileShader(i);var a=t.createShader(t.FRAGMENT_SHADER);t.shaderSource(a,e),t.compileShader(a);var o=t.createProgram();return t.attachShader(o,i),t.attachShader(o,a),t.linkProgram(o),{prog:o,vs:i,fs:a,names:n,u:null}}function p(e){return!d||t.getProgramParameter(e.prog,d.COMPLETION_STATUS_KHR)}function m(e){var n=t.getProgramParameter(e.prog,t.LINK_STATUS);return n||([e.vs,e.fs].forEach(function(e){t.getShaderParameter(e,t.COMPILE_STATUS)||console.error(`nebula shader:`,t.getShaderInfoLog(e))}),console.error(`nebula link:`,t.getProgramInfoLog(e.prog)),t.deleteProgram(e.prog)),t.deleteShader(e.vs),t.deleteShader(e.fs),n?(e.u={},e.names.forEach(function(n){e.u[n]=t.getUniformLocation(e.prog,n)}),e):null}var h=[`uRes`,`uDpr`,`uTime`,`uPointer`,`uPointerOn`,`uLook`],g=[`uRes`,`uDpr`,`uTime`,`uCell0`,`uCell1`],_=[`uRes`,`uDpr`,`uTime`,`uPointer`,`uPointerOn`,`uLook`],v=null,y=null,b=null,x=`pending`,S=[f(c,h),f(l,g)],C=t.createVertexArray(),w=Math.min(window.devicePixelRatio||1,1.5),T=1,E=1,D=null,O=[null,null],k=0,A=0;function j(e,n){if(!D){D=t.createFramebuffer();for(var r=0;r<2;r++)O[r]=t.createTexture(),t.bindTexture(t.TEXTURE_2D,O[r]),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)}for(var i=0;i<2;i++)t.bindTexture(t.TEXTURE_2D,O[i]),t.texImage2D(t.TEXTURE_2D,0,t.RGBA8,e,n,0,t.RGBA,t.UNSIGNED_BYTE,null);t.bindTexture(t.TEXTURE_2D,null),t.bindFramebuffer(t.FRAMEBUFFER,D),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,O[0],0),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT1,t.TEXTURE_2D,O[1],0),t.drawBuffers([t.COLOR_ATTACHMENT0,t.COLOR_ATTACHMENT1]);var a=t.checkFramebufferStatus(t.FRAMEBUFFER)===t.FRAMEBUFFER_COMPLETE;return t.bindFramebuffer(t.FRAMEBUFFER,null),k=e,A=n,a}function M(){var t=Math.floor(e.width/w/n)+1,r=Math.floor(e.height/w/n)+1;return t===k&&r===A||j(t,r)}function N(){x!==`single`&&x!==`pending-single`&&x!==`failed`&&(v=y=null,S=[f(u,_)],x=`pending-single`)}function P(){if(x===`two-pass`||x===`single`)return!0;if(x===`failed`||!S.every(p))return!1;var n=S.map(m);return S=[],x===`pending`?n[0]&&n[1]&&(v=n[0],y=n[1],x=`two-pass`,M())?!0:(n.forEach(function(e){e&&t.deleteProgram(e.prog)}),N(),!1):n[0]?(b=n[0],x=`single`,!0):(x=`failed`,e.style.display=`none`,!1)}function F(){w=Math.min(window.devicePixelRatio||1,1.5),T=window.innerWidth,E=window.innerHeight,e.width=Math.floor(T*w),e.height=Math.floor(E*w),x===`two-pass`&&!M()&&N()}F(),window.addEventListener(`resize`,F,{passive:!0});var I=performance.now(),L=T*.5,R=E*.5,z=.5,B=.5,V=0,H=0,U=0,W=!1,G=-1e9;function K(e){var t=.5+.32*Math.sin(e*.21)+.1*Math.sin(e*.077+1.3),n=.5+.26*Math.cos(e*.17)+.12*Math.cos(e*.053+4.2);return[Math.min(Math.max(t,.05),.95),Math.min(Math.max(n,.05),.95)]}window.addEventListener(`pointermove`,function(e){L=e.clientX,R=E-e.clientY,W=!0,G=performance.now()/1e3},{passive:!0}),window.addEventListener(`pointerleave`,function(){W=!1});var q=0;function J(){if(!P())q=x===`failed`?0:requestAnimationFrame(J);else{var n=performance.now(),r=(n-I)/1e3,i=.016,a=!W||n/1e3-G>5,o=K(r*.6),s=a?o[0]*T:L,c=a?o[1]*E:R,l=1-Math.exp(-i*(a?1.5:7));if(z+=(s/T-z)*l,B+=(c/E-B)*l,V+=((s/T-.5)*2-V)*l,H+=((c/E-.5)*2-H)*l,U+=((a?.55:1)-U)*(1-Math.exp(-i*3)),t.bindVertexArray(C),x===`two-pass`){var u=v.u;t.useProgram(v.prog),t.bindFramebuffer(t.FRAMEBUFFER,D),t.viewport(0,0,k,A),t.uniform2f(u.uRes,e.width,e.height),t.uniform1f(u.uDpr,w),t.uniform1f(u.uTime,r),t.uniform2f(u.uPointer,z*T,B*E),t.uniform1f(u.uPointerOn,U),t.uniform2f(u.uLook,V,H),t.drawArrays(t.TRIANGLES,0,3),t.bindFramebuffer(t.FRAMEBUFFER,null);var d=y.u;t.useProgram(y.prog),t.viewport(0,0,e.width,e.height),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,O[0]),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,O[1]),t.uniform1i(d.uCell0,0),t.uniform1i(d.uCell1,1),t.uniform2f(d.uRes,e.width,e.height),t.uniform1f(d.uDpr,w),t.uniform1f(d.uTime,r),t.drawArrays(t.TRIANGLES,0,3)}else{var f=b.u;t.useProgram(b.prog),t.viewport(0,0,e.width,e.height),t.uniform2f(f.uRes,e.width,e.height),t.uniform1f(f.uDpr,w),t.uniform1f(f.uTime,r),t.uniform2f(f.uPointer,z*T,B*E),t.uniform1f(f.uPointerOn,U),t.uniform2f(f.uLook,V,H),t.drawArrays(t.TRIANGLES,0,3)}q=requestAnimationFrame(J)}}new IntersectionObserver(function(e){e.some(function(e){return e.isIntersecting})?q||=requestAnimationFrame(J):(cancelAnimationFrame(q),q=0)}).observe(e),q=requestAnimationFrame(J),e.addEventListener(`webglcontextlost`,function(e){e.preventDefault(),cancelAnimationFrame(q),q=0})})();