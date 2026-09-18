const API='https://androidpublisher.googleapis.com/androidpublisher/v3';

function need(v,name){if(!v)throw new Error(name+' is required');return v}
export async function getSubscription({accessToken,packageName,purchaseToken}){
  need(accessToken,'accessToken');need(packageName,'packageName');need(purchaseToken,'purchaseToken');
  const url=API+'/applications/'+encodeURIComponent(packageName)+'/purchases/subscriptionsv2/tokens/'+encodeURIComponent(purchaseToken);
  const r=await fetch(url,{headers:{authorization:'Bearer '+accessToken,accept:'application/json'}});
  if(!r.ok)throw new Error('Google subscription verification failed: '+r.status+' '+await r.text());
  return r.json();
}
export function entitlementFromSubscription(subscription,{productId='msa_one_premium'}={}){
  const state=subscription?.subscriptionState;
  const entitled=new Set(['SUBSCRIPTION_STATE_ACTIVE','SUBSCRIPTION_STATE_IN_GRACE_PERIOD']).has(state);
  const line=(subscription?.lineItems||[]).find(x=>x.productId===productId)||subscription?.lineItems?.[0];
  const expiry=line?.expiryTime||null;
  return {
    verified:!!entitled,
    plan:entitled?'premium':'free',
    status:entitled?'active':String(state||'unknown').toLowerCase(),
    source:'google-play-server',
    expiresAt:expiry,
    productId:line?.productId||productId,
    acknowledgementState:subscription?.acknowledgementState||null,
    capabilities:entitled?[
      'advanced-ai','presenter','premium-templates','automation',
      'premium-ui-studio','premium-lens','cloud-sync','large-file-tools'
    ]:[]
  };
}
export async function acknowledgeSubscription({accessToken,packageName,subscriptionId,purchaseToken}){
  need(accessToken,'accessToken');need(packageName,'packageName');need(subscriptionId,'subscriptionId');need(purchaseToken,'purchaseToken');
  const url=API+'/applications/'+encodeURIComponent(packageName)+'/purchases/subscriptions/'+encodeURIComponent(subscriptionId)+'/tokens/'+encodeURIComponent(purchaseToken)+':acknowledge';
  const r=await fetch(url,{method:'POST',headers:{authorization:'Bearer '+accessToken,'content-type':'application/json'},body:'{}'});
  if(!r.ok)throw new Error('Google subscription acknowledgement failed: '+r.status+' '+await r.text());
  return true;
}
export async function verifyAndAcknowledge(args){
  const subscription=await getSubscription(args);
  const entitlement=entitlementFromSubscription(subscription,{productId:args.productId});
  if(!entitlement.verified)return {subscription,entitlement};
  if(subscription.acknowledgementState==='ACKNOWLEDGEMENT_STATE_PENDING'){
    await acknowledgeSubscription({...args,subscriptionId:entitlement.productId});
  }
  return {subscription,entitlement:{...entitlement,verifiedAt:new Date().toISOString()}};
}
