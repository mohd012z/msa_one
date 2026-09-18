(()=> {
  const ACTION_CAP={
    'advanced-ai':'advanced-ai',
    'presenter':'presenter',
    'templates':'premium-templates',
    'automation':'automation',
    'ui-studio':'premium-ui-studio',
    'premium-lens':'premium-lens'
  };

  function config(){return globalThis.MSAPremiumConfig||{active:false,billing:{enabled:false}}}
  function status(){return globalThis.MSAEntitlement?.status?.()||{active:false,status:'prepared-not-active',plan:'free'}}
  function capForAction(action){return ACTION_CAP[action]||null}
  function esc(s=''){return globalThis.MSACore?.escapeHTML?.(s)??String(s)}
  function render(){
    if(typeof document==='undefined')return;
    const page=document.querySelector('#premium .wrap');if(!page)return;
    let card=page.querySelector('[data-premium-status]');
    if(!card){
      card=document.createElement('section');card.className='premium-status-card';card.setAttribute('data-premium-status','');
      page.insertBefore(card,page.children[1]||null);
    }
    const c=config(),s=status(),update=globalThis.MSAUpdatePolicy?.diagnostics?.();
    card.innerHTML='<div class="premium-prep-head"><div><span class="premium-kicker">PREMIUM SYSTEM</span><h2>'+esc(c.active?'Premium':'Prepared · Not Active')+'</h2><p>'+esc(c.active?'Entitlement system is enabled.':'Billing, paid unlocks and force-update enforcement are prepared in code but intentionally disabled.')+'</p></div><span class="premium-state '+(c.active?'active':'prepared')+'">'+(c.active?'ACTIVE':'OFF')+'</span></div>'+
      '<div class="premium-prep-grid"><span><b>'+esc(c.billing?.provider||'google-play')+'</b> provider</span><span><b>'+esc(c.billing?.libraryVersion||'prepared')+'</b> billing library</span><span><b>'+esc(s.plan||'free')+'</b> current plan</span><span><b>'+(update?.enabled?'ON':'OFF')+'</b> update enforcement</span></div>'+
      '<div class="premium-prep-note">No purchase can start while <code>MSAPremiumConfig.active</code> and <code>billing.enabled</code> are false.</div>'+
      '<div class="premium-prep-actions"><button data-premium-diagnostics>Diagnostics</button><button data-premium-restore '+(!c.active?'disabled':'')+'>Restore purchases</button><button data-premium-manage '+(!c.active?'disabled':'')+'>Manage subscription</button></div><div class="premium-diagnostics" data-premium-diagnostics-panel hidden></div>';
    card.querySelector('[data-premium-diagnostics]').onclick=()=>toggleDiagnostics(card);
    card.querySelector('[data-premium-restore]').onclick=restore;
    card.querySelector('[data-premium-manage]').onclick=manage;
    decorateTiles();
  }
  function decorateTiles(){
    if(typeof document==='undefined')return;
    document.querySelectorAll('#premium [data-msa-action]').forEach(b=>{
      const cap=capForAction(b.dataset.msaAction);if(!cap)return;
      b.dataset.entitlement=cap;
      let badge=b.querySelector('.premium-lock-badge');
      if(!badge){badge=document.createElement('span');badge.className='premium-lock-badge';b.appendChild(badge)}
      badge.textContent=config().active?(globalThis.MSAEntitlement?.can?.(cap)?'UNLOCKED':'PREMIUM'):'PREPARED';
    });
  }
  function toggleDiagnostics(card){
    const panel=card.querySelector('[data-premium-diagnostics-panel]');panel.hidden=!panel.hidden;if(panel.hidden)return;
    const e=globalThis.MSAEntitlement?.diagnostics?.()||{},u=globalThis.MSAUpdatePolicy?.diagnostics?.()||{},m=globalThis.MSAAppManifest||{};
    panel.innerHTML='<pre>'+esc(JSON.stringify({app:{version:m.version,buildId:m.buildId},premium:e,updatePolicy:u},null,2))+'</pre>';
  }
  function showLocked(capability,reason='premium-required'){
    globalThis.show?.('premium');render();
    const msg=reason==='premium-not-active'
      ?'Premium is prepared but not activated in this build. No purchase will be started.'
      :'This feature requires an active, server-verified Premium entitlement.';
    globalThis.MSAHelper?.notify?.(msg,'info');
    return {allowed:false,capability,reason};
  }
  async function purchase(basePlan='monthly'){
    const c=config();
    if(!c.active||!c.billing?.enabled)return showLocked('premium','premium-not-active');
    const bridge=globalThis.Capacitor?.Plugins?.[c.billing.bridge||'MSABilling'];
    if(!bridge?.purchase)throw new Error('Native billing bridge is unavailable');
    const purchase=await bridge.purchase({productId:c.product.id,basePlan});
    return globalThis.MSAEntitlement?.verifyPurchase?.(purchase);
  }
  async function restore(){
    try{
      const result=await globalThis.MSAEntitlement?.restore?.();
      if(result?.active)globalThis.MSAHelper?.success?.('Premium purchase restored.');
      render();return result;
    }catch(e){globalThis.MSAHelper?.error?.('Restore failed: '+e.message)}
  }
  function manage(){
    const url=config().billing?.manageUrl;
    if(!config().active||!url)return showLocked('premium','premium-not-active');
    if(globalThis.MSASecurity?.safeExternalOpen)return globalThis.MSASecurity.safeExternalOpen(url,{hosts:['play.google.com']});
    globalThis.MSAHelper?.error?.('Subscription management URL was blocked by security policy.');
    return false;
  }
  function capture(e){
    const button=e.target.closest?.('#premium [data-msa-action]');if(!button)return;
    const cap=capForAction(button.dataset.msaAction);if(!cap)return;
    const result=globalThis.MSAEntitlement?.require?.(cap);
    if(result?.allowed)return;
    e.preventDefault();e.stopImmediatePropagation();showLocked(cap,result?.reason);
  }
  function mount(){
    render();
    if(typeof document!=='undefined')document.addEventListener('click',capture,true);
  }

  globalThis.MSAPremiumUI={ACTION_CAP,status,render,showLocked,purchase,restore,manage,mount};
  if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',mount);setTimeout(render,900)}
})();