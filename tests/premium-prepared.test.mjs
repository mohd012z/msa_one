import assert from 'node:assert/strict';

const store=new Map();
globalThis.localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k)
};

await import('../www/premium-config.js');
await import('../www/entitlement-engine.js');
await import('../www/premium-ui.js');

const C=globalThis.MSAPremiumConfig;
const E=globalThis.MSAEntitlement;
const UI=globalThis.MSAPremiumUI;

assert.ok(C.prepared,'Premium must be prepared');
assert.equal(C.active,false,'Premium must NOT be active');
assert.equal(C.billing.enabled,false,'Google Play Billing must NOT be active');
assert.equal(C.updatePolicy.enabled,false,'remote update policy must NOT be active');
assert.equal(C.updatePolicy.enforce,false,'force-update enforcement must NOT be active');
assert.equal(C.billing.libraryVersion,'9.1.0');

assert.equal(E.can('document'),true,'free capabilities must remain available');
assert.equal(E.can('advanced-ai'),false,'Premium capability must remain locked');
assert.equal(E.status().status,'prepared-not-active');
assert.equal(E.diagnostics().active,false);
assert.equal(E.diagnostics().billingEnabled,false);

const ignored=E.applyVerified({
  verified:true,status:'active',plan:'premium',capabilities:['advanced-ai']
});
assert.equal(ignored.active,false,'verified payload cannot activate Premium while config is inactive');
assert.equal(E.can('advanced-ai'),false,'inactive config must override cached Premium data');

assert.equal(typeof E.verifyPurchase,'function');
assert.equal(typeof E.restore,'function');
assert.equal(typeof UI.purchase,'function');
assert.equal(typeof UI.restore,'function');
assert.equal(typeof UI.showLocked,'function');

console.log('Premium prepared-but-inactive contract passed');
