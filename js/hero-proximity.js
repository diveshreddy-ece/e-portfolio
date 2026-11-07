/**
 * Hero Variable Proximity Typography
 * Animates font-variation-settings ('wght' and 'opsz') based on cursor distance from glyphs.
 */
(() => {
  const init = () => {
    const title = document.getElementById('hero-proximity-title');
    if (!title || title.dataset.proximityReady) return;
    title.dataset.proximityReady = 'true';
    const label = title.getAttribute('aria-label') || title.textContent.trim().replace(/\s+/g,' ');
    title.textContent = '';
    const frag = document.createDocumentFragment(), letters = [];
    const tokens = label.match(/\S+|\s+/g) || [];
    tokens.forEach(token => {
      if (/^\s+$/.test(token)) {
        const space = document.createElement('span');
        space.className = 'vp-space';
        space.textContent = token;
        frag.appendChild(space);
      } else {
        const word = document.createElement('span');
        word.className = 'vp-word';
        for (const ch of token) {
          const el = document.createElement('span');
          el.className = 'vp-letter';
          el.textContent = ch;
          el.setAttribute('aria-hidden', 'true');
          word.appendChild(el);
          letters.push(el);
        }
        frag.appendChild(word);
      }
    });
    if (!letters.length) {
      title.textContent = label;
      return;
    }
    title.appendChild(frag);
    title.dataset.proximityReady='true';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const pointer={x:-9999,y:-9999,active:false};
    const values=new Float32Array(letters.length);
    const centers=new Float32Array(letters.length * 2);
    let raf=0,last=0;
    const radius=175;
    const move=e=>{pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;queue();};
    const leave=()=>{pointer.active=false;queue();};
    function queue(){if(!raf)raf=requestAnimationFrame(frame);}
    function updateCenters(){
      for(let i=0;i<letters.length;i++){
        const r=letters[i].getBoundingClientRect();
        centers[i*2]=r.left+r.width/2;
        centers[i*2+1]=r.top+r.height/2;
      }
    }
    function frame(now){
      raf=0;const dt=last?Math.min(now-last,48):16;last=now;
      const ease=1-Math.exp(-dt/360);let active=false;
      for(let i=0;i<letters.length;i++){
        const el=letters[i];
        const d=pointer.active?Math.hypot(pointer.x-centers[i*2],pointer.y-centers[i*2+1]):Infinity;
        const t=Math.max(0,1-d/radius);
        const target=t*t*(3-2*t);
        values[i]+=(target-values[i])*ease;
        if(Math.abs(target-values[i])<.002)values[i]=target;
        const v=values[i];
        if(v===0){
          el.style.removeProperty('transform');
          el.style.removeProperty('color');
        }else{
          el.style.transform=`translateY(${-v*.045}em) scale(${1+v*.04})`;
          el.style.color=`color-mix(in srgb, var(--nebula-star) ${Math.round((1-v*.22)*100)}%, #ff7098)`;
        }
        if(v!==target)active=true;
      }
      if(active)raf=requestAnimationFrame(frame);else last=0;
    }
    updateCenters();
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerout',e=>{if(!e.relatedTarget)leave();},{passive:true});
    window.addEventListener('blur',leave);
    window.addEventListener('scroll',updateCenters,{passive:true});
    window.addEventListener('resize',updateCenters,{passive:true});
    document.fonts?.ready.then(updateCenters);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
