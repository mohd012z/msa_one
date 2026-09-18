(()=> {
  const KEY='msaEntitlementV1';
  const PREMIUM=new Set(globalThis.MSAPremiumConfig?.product?.capabilities||[]);
  const FREE=new Set([
    'document','spreadsheet','presentation','pdf','html','files','storage','planner',
    'media','voice-routing','ui-basic','helper','performance','library'
  ]);

  function config(){return globalThis.MSAPremiumConfig||{active:false,billing:{enabled:false},product:{capabilities:[]}}}
  function parse(raw,fallback){try{return JSON.parse(raw)}catch{return fallback}}
  function cached(){
    try{return parse(localStorage.getItem(KEY)||'',null)}catch{return null}
  }
  function saveCache(value){
    try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}
    return value;
  }
  function inactiveState(){
    return {
      prepared:!!config().prepared,
      active:false,
      plan:'free',
      status:'prepared-not-active',
      source:'local-config',
      verified:false,
      capabilities:[...FREE],
      checkedAt:new Date().toISOString()
    };
  }
  function normalize(payload){
    const caps=Array.isArray(payload?.capabilities)?payload.capabilities.filter(x=>typeof x==='string'):[];
    return {
      prepared:true,
      active:true,
      plan:payload?.plan||'premium',
      status:payload?.status||'inactive',
      source:payload?.source||'backend',
      verified:payload?.verified===true,
      capabilities:[...new Set([...FREE,...caps])],
      verifiedAt:payload?.verifiedAt||new Date().toISOString(),
      expiresAt:payload?.expiresAt||null,
      checkedAt:new Date().toISOString()
    };
  }
  function validPremium(state){
    if(!config().active||!config().billing?.enabled)return false;
    if(!state?.verified||state.status!=='active')return false;
    if(state.expiresAt&&Date.parse(state.expiresAt)<=Date.now())return false;
    return true;
  }
  function status(){
    if(!config().active)return inactiveState();
    const state=cached();
    if(!validPremium(state))return {
      prepared:true,active:true,plan:'free',status:state?.status||'unverified',
      source:state?.source||'cache',verified:false,capabilities:[...FREE],
      checkedAt:new Date().toISOString(),expiresAt:state?.expiresAt||null
    };
    return state;
  }
  function isPremiumCapability(cap){return PREMIUM.has(cap)}
  function can(cap){
    if(FREE.has(cap))return true;
    if(!isPremiumCapability(cap))return true;
    const s=status();
    return validPremium(s)&&s.capabilities.includes(cap);
  }
  function requireCapability(cap){
    if(can(cap))return {allowed:true,capability:cap,status:status()};
    return {allowed:false,capability:cap,status:status(),reason:config().active?'premium-required':'premium-not-active'};
  }
  function guard(cap,onAllowed,onDenied){
    const result=requireCapability(cap);
    if(result.allowed)return typeof onAllowed==='function'?onAllowed(result):result;
    if(typeof onDenied==='function')return onDenied(result);
    globalThis.MSAPremiumUI?.showLocked?.(cap,result.reason);
    return result;
  }
  function applyVerified(payload){
    if(!config().active)return inactiveState();
    if(payload?.verified!==true)throw new Error('Entitlement payload is not verified');
    const state=normalize(payload);
    saveCache(state);
    globalThis.dispatchEvent?.(new CustomEvent('msa:entitlement',{detail:state}));
    return state;
  }
  async function backendJSON(url,options={}){
    if(!/^https:\/\//i.test(url))throw new Error('Premium backend URL must use HTTPS');
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),7000);
    try{
      const r=await fetch(url,{cache:'no-store',credentials:'omit',...options,signal:ctrl.signal,headers:{'content-type':'application/json',...(options.headers||{})}});
      if(!r.ok)throw new Error('Premium backend returned '+r.status);
      return await r.json();
    }finally{clearTimeout(timer)}
  }
  async function refresh(){
    const c=config();
    if(!c.active||!c.billing?.enabled)return inactiveState();
    if(!c.billing.entitlementUrl)throw new Error('Entitlement endpoint is not configured');
    const payload=await backendJSON(c.billing.entitlementUrl);
    return applyVerified(payload);
  }
  function bridge(){
    return globalThis.Capacitor?.Plugins?.[config().billing?.bridge||'MSABilling']||null;
  }
  async function verifyPurchase(purchase){
    const c=config();
    if(!c.active||!c.billing?.enabled)return inactiveState();
    if(!purchase?.purchaseToken)throw new Error('Purchase token is missing');
    if(!c.billing.verifyUrl)throw new Error('Purchase verification endpoint is not configured');
    const payload=await backendJSON(c.billing.verifyUrl,{method:'POST',body:JSON.stringify({
      purchaseToken:purchase.purchaseToken,
      productId:purchase.productId||c.product.id,
      packageName:'com.msa.one.displayfit37'
    })});
    return applyVerified(payload);
  }
  async function restore(){
    const c=config();
    if(!c.active||!c.billing?.enabled)return inactiveState();
    const b=bridge();if(!b?.restore)throw new Error('Native billing bridge is unavailable');
    const purchase=await b.restore();
    if(!purchase?.purchaseToken)throw new Error('No restorable Premium purchase was returned');
    return verifyPurchase({purchaseToken:purchase.purchaseToken,productId:c.product.id});
  }
  function clearCache(){try{localStorage.removeItem(KEY)}catch{}}
  function diagnostics(){
    const c=config(),s=status();
    return {
      prepared:!!c.prepared,
      active:!!c.active,
      billingEnabled:!!c.billing?.enabled,
      provider:c.billing?.provider||null,
      productId:c.product?.id||null,
      state:s.status,
      verified:s.verified,
      premiumCapabilities:[...PREMIUM]
    };
  }

  globalThis.MSAEntitlement={FREE,PREMIUM,status,can,isPremiumCapability,require:requireCapability,guard,applyVerified,verifyPurchase,refresh,restore,clearCache,diagnostics};
})();