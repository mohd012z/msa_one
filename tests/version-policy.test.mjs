import assert from 'node:assert/strict';

await import('../www/app-manifest.js');
await import('../www/premium-config.js');
await import('../www/version-policy.js');

const U=globalThis.MSAUpdatePolicy;
assert.equal(U.compare('47.0.0','47.0.0'),0);
assert.equal(U.compare('47.1.0','47.0.9'),1);
assert.equal(U.compare('46.9.9','47.0.0'),-1);

let r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'47.0.0',
  minSupportedVersion:'46.0.0'
},'47.0.0');
assert.equal(r.blocked,false);
assert.equal(r.state,'current');

r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'47.0.0',
  minSupportedVersion:'47.0.0'
},'46.5.0');
assert.equal(r.blocked,true);
assert.equal(r.reason,'below-minimum');

r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'47.0.0',
  minSupportedVersion:'46.0.0',
  forceUpdate:true
},'46.5.0');
assert.equal(r.blocked,true);
assert.equal(r.reason,'force-update');

r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'47.0.0',
  minSupportedVersion:'46.0.0',
  forceUpdate:false
},'46.5.0');
assert.equal(r.blocked,false);
assert.equal(r.reason,'update-available');

r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'47.0.0',
  minSupportedVersion:'46.0.0',
  requireExactVersion:true
},'46.9.0');
assert.equal(r.blocked,true);
assert.equal(r.reason,'exact-version-required');

assert.equal(U.validPolicy({appId:'wrong.app',latestVersion:'47.0.0'}),false);
assert.equal(U.diagnostics().enabled,false);
assert.equal(U.diagnostics().enforce,false);

const disabled=await U.check();
assert.equal(disabled.state,'disabled');
assert.equal(disabled.blocked,false);

console.log('force-update policy prepared-but-disabled contract passed');
