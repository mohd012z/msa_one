(()=> {
  const KEY='msaPerformanceV1';
  let mounted=false,refreshHz=0,readerOn=false;
  const defaults={mode:'auto',fontScale:1,iconScale:1,lineHeight:1.55};

  function load(){
    try{return {...defaults,...JSON.parse((typeof localStorage!=='undefined'&&localStorage.getItem(KEY))||'{}')}}catch{return {...defaults}}
  }
  function save(next){
    const value={...load(),...next},raw=JSON.stringify(value);
    try{if(typeof localStorage!=='undefined')localStorage.setItem(KEY,raw)}catch{}
    globalThis.MSAStorage?.mirror(KEY,raw);
    apply(value);return value;
  }
  function device(){
    const nav=typeof navigator!=='undefined'?navigator:{},cores=Number(nav.hardwareConcurrency||0),memory=Number(nav.deviceMemory||0),dpr=Number(globalThis.devicePixelRatio||1);
    const vv=typeof window!=='undefined'?window.visualViewport:null;
    return {cores,memory,dpr,width:Math.round(vv?.width||globalThis.innerWidth||0),height:Math.round(vv?.height||globalThis.innerHeight||0),refreshHz};
  }
  function autoProfile(){
    const d=device();
    if((d.memory&&d.memory<=2)||(d.cores&&d.cores<=2))return'low';
    if((d.memory&&d.memory<=4)||(d.cores&&d.cores<=4))return'balanced';
    return'smooth';
  }
  function profile(p=load()){
    if(p.mode==='battery')return'low';
    if(p.mode==='smooth')return'smooth';
    return autoProfile();
  }
  function apply(p=load()){
    if(typeof document==='undefined')return;
    const root=document.documentElement,body=document.body;if(!root||!body)return;
    const f=Math.max(.85,Math.min(1.45,Number(p.fontScale)||1));
    const i=Math.max(.85,Math.min(1.35,Number(p.iconScale)||1));
    const line=Math.max(1.35,Math.min(1.9,Number(p.lineHeight)||1.55));
    root.style.setProperty('--msa-font-scale',String(f));
    root.style.setProperty('--msa-icon-scale',String(i));
    root.style.setProperty('--msa-reader-line',String(line));
    body.dataset.perfProfile=profile(p);
    body.dataset.refreshClass=refreshHz>=100?'120':refreshHz>=80?'90':'60';
    document.querySelectorAll('[data-perf-mode]').forEach(b=>b.classList.toggle('on',b.dataset.perfMode===p.mode));
    updateControls(p);
  }
  function scheduleFrame(fn){
    let args,pending=false;
    return(...a)=>{args=a;if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fn?.(...args)})};
  }
  function rafThrottle(fn){
    let pending=false,lastArgs;
    return(...args)=>{lastArgs=args;if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fn(...lastArgs)})};
  }
  function idle(fn,timeout=700){
    if('requestIdleCallback'in window)return requestIdleCallback(()=>fn(),{timeout});
    return setTimeout(fn,Math.min(timeout,80));
  }
  function cancelIdle(id){
    if('cancelIdleCallback'in window)cancelIdleCallback(id);else clearTimeout(id);
  }
  function yieldUI(){
    return new Promise(resolve=>requestAnimationFrame(()=>resolve()));
  }
  async function chunk(items,worker,{budget=8,every=1}={}){
    let start=performance.now();
    for(let i=0;i<items.length;i++){
      await worker(items[i],i);
      if(i%every===0&&performance.now()-start>=budget){await yieldUI();start=performance.now()}
    }
  }
  async function withBusy(label,fn){
    const token=showBusy(label);
    await yieldUI();
    try{return await fn(progress=>updateBusy(progress))}
    finally{hideBusy(token)}
  }
  function showBusy(label='Working…'){
    let box=document.querySelector('[data-perf-busy]');
    if(!box){box=document.createElement('div');box.className='perf-busy';box.setAttribute('data-perf-busy','');box.innerHTML='<div class="perf-spinner"></div><div><b data-perf-busy-title></b><small data-perf-busy-detail>Preparing…</small></div>';document.body.appendChild(box)}
    box.querySelector('[data-perf-busy-title]').textContent=label;box.querySelector('[data-perf-busy-detail]').textContent='Preparing…';box.classList.add('on');
    return Date.now();
  }
  function updateBusy(text){const e=document.querySelector('[data-perf-busy-detail]');if(e)e.textContent=String(text||'Working…')}
  function hideBusy(){document.querySelector('[data-perf-busy]')?.classList.remove('on')}

  const viewportUpdate=rafThrottle(()=>{
    const vv=window.visualViewport,w=Math.max(240,Math.round(vv?.width||innerWidth||screen.width||360)),h=Math.max(240,Math.round(vv?.height||innerHeight||screen.height||640));
    const root=document.documentElement;
    root.style.setProperty('--msa-vw',(w/100)+'px');
    root.style.setProperty('--msa-vh',(h/100)+'px');
    root.style.setProperty('--msa-viewport-width',w+'px');
    root.style.setProperty('--msa-viewport-height',h+'px');
    document.body?.classList.toggle('msa-portrait',h>=w);
    document.body?.classList.toggle('msa-landscape',h<w);
    updateControls(load());
  });

  function measureRefresh(){
    if(document.hidden)return;
    const samples=[];let last=0,count=0;
    const step=t=>{
      if(last){const dt=t-last;if(dt>3&&dt<40)samples.push(dt)}
      last=t;count++;
      if(count<48)return requestAnimationFrame(step);
      samples.sort((a,b)=>a-b);
      const mid=samples.length? samples[Math.floor(samples.length/2)]:16.67;
      refreshHz=Math.max(30,Math.min(240,Math.round(1000/mid)));
      apply(load());
    };
    requestAnimationFrame(step);
  }

  function setMode(mode){if(!['auto','smooth','battery'].includes(mode))mode='auto';return save({mode})}
  function setFontScale(v){return save({fontScale:Math.max(.85,Math.min(1.45,Number(v)||1))})}
  function setIconScale(v){return save({iconScale:Math.max(.85,Math.min(1.35,Number(v)||1))})}
  function setLineHeight(v){return save({lineHeight:Math.max(1.35,Math.min(1.9,Number(v)||1.55))})}

  function setReadOnly(on){
    document.querySelectorAll('[data-doc]').forEach(el=>{if(on){el.dataset.readerEditable=el.getAttribute('contenteditable')||'';el.setAttribute('contenteditable','false')}else if('readerEditable'in el.dataset){el.setAttribute('contenteditable',el.dataset.readerEditable||'true');delete el.dataset.readerEditable}});
    document.querySelectorAll('[data-pdf-text],[data-code],[data-slide-title],[data-slide-body],[data-cell]').forEach(el=>{if(on){el.dataset.readerReadonly=String(!!el.readOnly);el.readOnly=true}else if('readerReadonly'in el.dataset){el.readOnly=el.dataset.readerReadonly==='true';delete el.dataset.readerReadonly}});
  }
  function toggleReading(force){
    readerOn=typeof force==='boolean'?force:!readerOn;
    document.body?.classList.toggle('msa-reading',readerOn);setReadOnly(readerOn);renderReaderBar();
    return readerOn;
  }
  function renderReaderBar(){
    let bar=document.querySelector('[data-reader-bar]');
    if(!readerOn){bar?.remove();return}
    const p=load();
    if(!bar){bar=document.createElement('div');bar.className='reader-bar';bar.setAttribute('data-reader-bar','');bar.innerHTML='<button data-read-font-down aria-label="Smaller text">A−</button><b>Reading View</b><button data-read-font-up aria-label="Larger text">A＋</button><button data-read-icon-down aria-label="Smaller icons">◉−</button><button data-read-icon-up aria-label="Larger icons">◉＋</button><button data-read-close>Done</button>';document.body.appendChild(bar);bar.querySelector('[data-read-font-down]').onclick=()=>setFontScale(load().fontScale-.08);bar.querySelector('[data-read-font-up]').onclick=()=>setFontScale(load().fontScale+.08);bar.querySelector('[data-read-icon-down]').onclick=()=>setIconScale(load().iconScale-.08);bar.querySelector('[data-read-icon-up]').onclick=()=>setIconScale(load().iconScale+.08);bar.querySelector('[data-read-close]').onclick=()=>toggleReading(false)}
    bar.querySelector('b').textContent='Reading View · '+Math.round(p.fontScale*100)+'%';
  }

  function mountControls(){
    const me=document.querySelector('#me .wrap');if(!me||me.querySelector('[data-performance-center]'))return;
    const p=load(),d=device(),section=document.createElement('section');section.className='card performance-center';section.setAttribute('data-performance-center','');
    section.innerHTML='<div class="perf-head"><div><span class="studio-kicker">DISPLAY & PERFORMANCE</span><h2>Smoothness & Reading</h2><p class="muted">Adaptive display, frame-synced motion and reading controls.</p></div><span class="perf-chip" data-perf-summary>Auto</span></div><div class="perf-label">PERFORMANCE MODE</div><div class="perf-modes"><button data-perf-mode="auto">Auto</button><button data-perf-mode="smooth">Smooth</button><button data-perf-mode="battery">Battery</button></div><div class="perf-read-row"><button data-reading-toggle><span>Aa</span><div><b>Reading View</b><small>Focus text · hide distractions</small></div><strong>›</strong></button></div><div class="perf-scale"><label>Text size <b data-font-value></b></label><input data-font-range type="range" min="85" max="145" step="5"><label>Icon size <b data-icon-value></b></label><input data-icon-range type="range" min="85" max="135" step="5"><label>Reading spacing <b data-line-value></b></label><input data-line-range type="range" min="135" max="190" step="5"></div><div class="perf-device" data-perf-device></div>';
    me.appendChild(section);
    section.querySelectorAll('[data-perf-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.perfMode));
    section.querySelector('[data-reading-toggle]').onclick=()=>toggleReading();
    section.querySelector('[data-font-range]').oninput=e=>setFontScale(+e.target.value/100);
    section.querySelector('[data-icon-range]').oninput=e=>setIconScale(+e.target.value/100);
    section.querySelector('[data-line-range]').oninput=e=>setLineHeight(+e.target.value/100);
    apply(p);updateControls(p,d);
  }
  function updateControls(p=load(),d=device()){
    const section=document.querySelector('[data-performance-center]');if(!section)return;
    const f=section.querySelector('[data-font-range]'),i=section.querySelector('[data-icon-range]'),l=section.querySelector('[data-line-range]');
    if(f)f.value=Math.round(p.fontScale*100);if(i)i.value=Math.round(p.iconScale*100);if(l)l.value=Math.round(p.lineHeight*100);
    const fv=section.querySelector('[data-font-value]'),iv=section.querySelector('[data-icon-value]'),lv=section.querySelector('[data-line-value]');
    if(fv)fv.textContent=Math.round(p.fontScale*100)+'%';if(iv)iv.textContent=Math.round(p.iconScale*100)+'%';if(lv)lv.textContent=Math.round(p.lineHeight*100)+'%';
    const summary=section.querySelector('[data-perf-summary]');if(summary)summary.textContent=(p.mode==='auto'?'Auto → ':p.mode==='smooth'?'Smooth · ':'Battery · ')+profile(p);
    const dev=section.querySelector('[data-perf-device]');if(dev)dev.textContent=(d.refreshHz?d.refreshHz+' Hz estimated · ':'')+(d.cores?d.cores+' CPU threads · ':'')+(d.memory?d.memory+' GB memory hint · ':'')+'DPR '+d.dpr.toFixed(2)+' · '+d.width+'×'+d.height+' CSS px';
    renderReaderBar();
  }

  function mount(){
    viewportUpdate();apply(load());mountControls();
    if(mounted)return;mounted=true;
    window.visualViewport?.addEventListener('resize',viewportUpdate,{passive:true});
    window.visualViewport?.addEventListener('scroll',viewportUpdate,{passive:true});
    window.addEventListener('resize',viewportUpdate,{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(viewportUpdate,80),{passive:true});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)measureRefresh()});
    idle(measureRefresh,400);
    setTimeout(mountControls,700);
  }

  globalThis.MSAPerformance={load,save,device,profile,apply,scheduleFrame,rafThrottle,idle,cancelIdle,yieldUI,chunk,withBusy,showBusy,updateBusy,hideBusy,setMode,setFontScale,setIconScale,setLineHeight,toggleReading,mount};
  if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',mount);setTimeout(mount,350)}
})();