(()=>{
const S={soft:'18px',round:'26px',pill:'999px',compact:'9px',ios:'14px'};
const N={soft:'Soft',round:'Round',pill:'Pill',compact:'Compact',ios:'iOS'};
const E={gradient:'Gradient',glass:'Glass',glow:'Soft Glow',neon:'Neon Edge',minimal:'Minimal'};
function fitDisplay(){
 const sw=Math.max(240,Math.round(screen.width||window.innerWidth||0));
 const iw=Math.max(240,Math.round(window.innerWidth||sw));
 const vv=window.visualViewport?Math.max(240,Math.round(visualViewport.width||iw)):iw;
 const w=Math.max(240,Math.min(iw,vv));
 const h=Math.max(240,Math.round((window.visualViewport&&visualViewport.height)||window.innerHeight||screen.height||0));
 const dpr=window.devicePixelRatio||1;
 document.documentElement.style.setProperty('--msa-screen-width',w+'px');
 document.documentElement.dataset.displayWidth=String(w);
 document.documentElement.dataset.displayDpr=String(dpr);
 document.body?.classList.toggle('msa-portrait',h>=w);
 document.body?.classList.toggle('msa-landscape',h<w);
 let info=document.querySelector('[data-display-info]');
 if(!info){info=document.createElement('div');info.setAttribute('data-display-info','');info.className='display-info';const me=document.querySelector('#me .wrap');if(me)me.appendChild(info)}
 if(info)info.textContent='Display '+w+'×'+h+' CSS px · DPR '+Number(dpr).toFixed(2)+' · screen '+sw+' · viewport '+vv;
}
function refresh(){
 const shape=localStorage.getItem('msaButtonShape')||'soft';const effect=localStorage.getItem('msaButtonEffect')||'gradient';const intensity=localStorage.getItem('msaButtonIntensity')||'62';
 document.documentElement.style.setProperty('--button-radius',S[shape]||S.soft);document.documentElement.style.setProperty('--button-fx',effect);document.documentElement.style.setProperty('--button-intensity',intensity/100);document.body.dataset.buttonEffect=effect;
 document.querySelectorAll('[data-shape]').forEach(x=>x.classList.toggle('on',x.dataset.shape===shape));document.querySelectorAll('[data-effect]').forEach(x=>x.classList.toggle('on',x.dataset.effect===effect));const r=document.querySelector('.studio-range');if(r)r.value=intensity;const v=document.querySelector('.intensity-value');if(v)v.textContent=intensity+'%';fitDisplay();
}
function persist(k,v){localStorage.setItem(k,v);window.MSAStorage?.mirror(k,v);window.MSAHelper?.notify?.('Setting applied','success')}function setShape(k){persist('msaButtonShape',S[k]?k:'soft');refresh()}function setEffect(k){persist('msaButtonEffect',E[k]?k:'gradient');refresh()}function setIntensity(v){persist('msaButtonIntensity',String(v));refresh()}
function mount(){const me=document.querySelector('#me .wrap');if(!me)return;document.querySelector('.shape-settings')?.remove();if(document.querySelector('.button-studio'))return;const e=document.createElement('section');e.className='card button-studio';e.innerHTML='<div class="studio-head"><div><span class="studio-kicker">APPEARANCE</span><h2>Button Studio</h2><p class="muted">Shape + color effects with live preview.</p></div><span class="studio-spark">✦</span></div><button class="studio-preview"><span class="preview-dot">M</span><span>MSA One Button</span><b>›</b></button><div class="studio-label">SHAPE</div><div class="studio-shapes">'+Object.keys(S).map(k=>'<button class="shape-swatch" data-shape="'+k+'"><i></i><small>'+N[k]+'</small></button>').join('')+'</div><div class="studio-label">EFFECT</div><div class="effect-scroll">'+Object.keys(E).map(k=>'<button class="effect-chip" data-effect="'+k+'">'+E[k]+'</button>').join('')+'</div><div class="intensity-row"><span>Effect intensity</span><b class="intensity-value">62%</b></div><input class="studio-range" type="range" min="0" max="100" value="62" aria-label="Button effect intensity">';me.appendChild(e);e.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>setShape(b.dataset.shape));e.querySelectorAll('[data-effect]').forEach(b=>b.onclick=()=>setEffect(b.dataset.effect));e.querySelector('.studio-range').oninput=x=>setIntensity(x.target.value);refresh()}
window.MSASettingsV2={refresh,fitDisplay,setShape,setEffect,setIntensity,mount};
document.addEventListener('DOMContentLoaded',()=>{fitDisplay();refresh();mount()});window.addEventListener('resize',fitDisplay,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(fitDisplay,120),{passive:true});window.visualViewport?.addEventListener('resize',fitDisplay,{passive:true});setTimeout(()=>{fitDisplay();refresh();mount()},400);
})();