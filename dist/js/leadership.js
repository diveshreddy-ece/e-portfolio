(function(){let e=window.PortfolioData?window.PortfolioData.leadershipEvents:typeof leadershipEvents<`u`?leadershipEvents:[],t=window.PortfolioData?window.PortfolioData.journey:typeof journey<`u`?journey:[],n=document.getElementById(`leadership-timeline`);n&&Array.isArray(e)&&e.forEach((e,t)=>{let r=document.createElement(`div`);r.className=`relative reveal`,r.style.transitionDelay=t*.05+`s`,r.innerHTML=`
        <div class="absolute -left-8 sm:-left-10 top-1 w-4 h-4 rounded-full bg-lead-500 border-4 border-white ring-1 ring-lead-200"></div>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          ${e.year?`<span class="text-xs font-mono font-semibold text-lead-500">${e.year}</span>`:``}
          <h3 class="font-bold text-navy-900">${e.name}</h3>
          <span class="text-xs font-mono text-slate-400">${e.role}</span>
        </div>
        <p class="text-sm text-slate-600 mt-1 max-w-xl">${e.desc}</p>`,n.appendChild(r)});let r=document.getElementById(`journey-list`);r&&Array.isArray(t)&&t.forEach((e,t)=>{let n=document.createElement(`li`);n.className=`reveal flex items-center gap-4`,n.style.transitionDelay=t*.04+`s`,n.innerHTML=`
        <span class="w-8 h-8 shrink-0 rounded-full bg-navy-900 text-white text-xs font-mono font-semibold flex items-center justify-center">${t+1}</span>
        <span class="font-medium text-slate-700">${e}</span>`,r.appendChild(n)})})();