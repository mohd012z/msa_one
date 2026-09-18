(()=> {
  const KEY='msaVersionPolicyV1';

  function config(){return globalThis.MSAPremiumConfig?.updatePolicy||{enabled:false,enforce:false,failMode:'open'}}
  function current(){return globalThis.MSAAppManifest?.version||'0.0.0'}
  function parts(v){return String(v||'0').trim().replace(/^v/i,'').split(/[.+-]/).slice(0,4).map(x=>{const n=parseInt(x,10);return Number.isFinite(n)?n:0})}
  function compare(a,b){
    const A=parts(a),B=parts(b),n=Math.max(A.length,B.length,3);
    for(let i=0;i<n;i++){const d=(A[i]||0)-(B[i]||0);if(d)return d<0?-1:1}
    return 0;
  }
  function validPolicy(p){
    if(!p||typeof p!=='object')return false;
    if(p.appId&&p.appId!=='com.msa.one.displayfit37')return false;
    if(p.latestVersion&&!/^\d+(?:\.\d+){1,3}(?:[-+][\w.-]+)?$/.test(String(p.latestVersion)))return false;
    if(p.minSupportedVersion&&!/^\d+(?:\.\d+){1,3}(?:[-+][\w.-]+)?$/.test(String(p.minSupportedVersion)))return false;
    if(p.latestVersion&&p.minSupportedVersion&&compare(p.minSupportedVersion,p.latestVersion)>0)return false;
    if(p.storeUrl&&globalThis.MSASecurity&&!globalThis.MSASecurity.isHTTPS(p.storeUrl))return false;
    return true;
  }
  function evaluate(policy,version=current()){
    if(!validPolicy(policy))return {state:'invalid',blocked:false,currentVersion:version,reason:'invalid-policy'};
    const latest=policy.latestVersion||version,min=policy.minSupportedVersion||'0.0.0';
    const cmpLatest=compare(version,latest),cmpMin=compare(version,min);
    let blocked=false,reason='current';
    if(cmpMin<0){blocked=true;reason='below-minimum'}
    else if(policy.requireExactVersion===true&&compare(version,latest)!==0){blocked=true;reason='exact-version-required'}
    else if(policy.forceUpdate===true&&cmpLatest<0){blocked=true;reason='force-update'}
    else if(cmpLatest<0)reason='update-available';
    return {
      state:blocked?'blocked':reason,
      blocked,
      reason,
      currentVersion:version,
      latestVersion:latest,
      minSupportedVersion:min,
      forceUpdate:policy.forceUpdate===true,
      requireExactVersion:policy.requireExactVersion===true,
      title:policy.title||(blocked?'Update required':'Update available'),
      message:policy.message||'A newer MSA One version is available.',
      releaseNotes:Array.isArray(policy.releaseNotes)?policy.releaseNotes.slice(0,8).map(x=>String(x).slice(0,240)):[],
      publishedAt:policy.publishedAt||'',
      storeUrl:policy.storeUrl||config().storeUrl||'',
      checkedAt:new Date().toISOString()
    };
  }
  function cache(policy,result){
    const value={policy,result,savedAt:new Date().toISOString()};
    try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}
    return value;
  }
  function cached(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
  async function fetchPolicy(){
    const c=config();
    if(!c.policyUrl)throw new Error('Update policy endpoint is not configured');
    if(c.requireHttps!==false&&!/^https:\/\//i.test(c.policyUrl))throw new Error('Update policy endpoint must use HTTPS');
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),Math.max(1000,Number(c.timeoutMs)||5000));
    try{
      const r=await fetch(c.policyUrl,{cache:'no-store',credentials:'omit',signal:ctrl.signal,headers:{accept:'application/json'}});
      if(!r.ok)throw new Error('Update policy returned '+r.status);
      const p=await r.json();if(!validPolicy(p))throw new Error('Update policy is invalid');
      return p;
    }finally{clearTimeout(timer)}
  }
  function removeOverlay(){document.querySelector('[data-update-gate]')?.remove()}
  function openStore(url){
    if(!url)return false;
    if(globalThis.MSASecurity?.safeExternalOpen)return globalThis.MSASecurity.safeExternalOpen(url,{hosts:['play.google.com']});
    return false;
  }
  function showNotice(result){
    if(typeof document==='undefined'||result?.blocked||result?.reason!=='update-available')return result;
    document.querySelector('[data-update-notice]')?.remove();
    const box=document.createElement('section');box.className='update-notice';box.setAttribute('data-update-notice','');
    const notes=(result.releaseNotes||[]).map(x=>'<li>'+escapeHTML(x)+'</li>').join('');
    box.innerHTML='<div><b>'+escapeHTML(result.title||'Update available')+'</b><p>'+escapeHTML(result.message)+'</p><small>Installed '+escapeHTML(result.currentVersion)+' · Latest '+escapeHTML(result.latestVersion)+'</small>'+(notes?'<ul>'+notes+'</ul>':'')+'</div><div class="update-notice-actions"><button data-update-later>Later</button><button data-update-now>Update</button></div>';
    document.body.appendChild(box);
    box.querySelector('[data-update-later]').onclick=()=>box.remove();
    box.querySelector('[data-update-now]').onclick=()=>openStore(result.storeUrl);
    return result;
  }
  function showGate(result){
    if(typeof document==='undefined'||!result?.blocked)return result;
    removeOverlay();
    const gate=document.createElement('section');gate.className='update-gate';gate.setAttribute('data-update-gate','');
    gate.innerHTML='<div class="update-gate-card"><span class="update-gate-icon">↻</span><h1>'+escapeHTML(result.title||'Update required')+'</h1><p>'+escapeHTML(result.message)+'</p><div class="update-gate-version"><span>Installed <b>'+escapeHTML(result.currentVersion)+'</b></span><span>Required <b>'+escapeHTML(result.minSupportedVersion||result.latestVersion)+'</b></span></div><button data-update-now>Update MSA One</button><button data-update-retry>Check again</button><small>This screen appears only when update enforcement is explicitly activated.</small></div>';
    document.body.appendChild(gate);
    gate.querySelector('[data-update-now]').onclick=()=>openStore(result.storeUrl);
    gate.querySelector('[data-update-retry]').onclick=()=>check({show:true});
    return result;
  }
  function escapeHTML(s=''){return globalThis.MSACore?.escapeHTML?.(s)??String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  async function check(options={}){
    const c=config(),show=options.show!==false;
    if(!c.enabled)return {state:'disabled',blocked:false,currentVersion:current(),reason:'policy-disabled'};
    try{
      const policy=await fetchPolicy(),result=evaluate({...policy,requireExactVersion:policy.requireExactVersion??c.exactVersion},current());
      cache(policy,result);
      if(c.enforce&&result.blocked&&show)showGate(result);
      else if(!result.blocked){removeOverlay();if(show&&result.reason==='update-available')showNotice(result)}
      return {...result,enforced:!!c.enforce};
    }catch(e){
      const result={state:'error',blocked:c.failMode==='closed'&&c.enforce,currentVersion:current(),reason:'policy-error',error:String(e?.message||e),enforced:!!c.enforce};
      if(result.blocked&&show)showGate({...result,message:'MSA One could not verify the required app version.',storeUrl:c.storeUrl||''});
      return result;
    }
  }
  function diagnostics(){
    const c=config();
    return {prepared:true,enabled:!!c.enabled,enforce:!!c.enforce,checkOnLaunch:!!c.checkOnLaunch,failMode:c.failMode,currentVersion:current(),cached:cached()};
  }
  function mount(){
    const c=config();
    if(c.enabled&&c.checkOnLaunch){
      check({show:true});
      const ms=Math.max(15,Number(c.recheckMinutes)||360)*60000;
      setInterval(()=>check({show:true}),ms);
    }
  }

  globalThis.MSAUpdatePolicy={compare,validPolicy,evaluate,fetchPolicy,check,cached,diagnostics,showNotice,showGate,removeOverlay,openStore,mount};
  if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',mount);setTimeout(mount,1200)}
})();