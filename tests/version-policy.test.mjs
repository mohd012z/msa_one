import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../www/app-manifest.js');
await import('../www/premium-config.js');
await import('../www/version-policy.js');

const U=globalThis.MSAUpdatePolicy;
assert.equal(U.compare('49.0.0','49.0.0'),0);
assert.equal(U.compare('49.1.0','49.0.9'),1);
assert.equal(U.compare('48.9.9','49.0.0'),-1);

let r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'49.0.0',
  minSupportedVersion:'48.0.0'
},'49.0.0');
assert.equal(r.blocked,false);
assert.equal(r.state,'current');

r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'49.0.0',
  minSupportedVersion:'49.0.0'
},'48.5.0');
assert.equal(r.blocked,true);
assert.equal(r.reason,'below-minimum');

r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'49.0.0',
  minSupportedVersion:'48.0.0',
  forceUpdate:true
},'48.5.0');
assert.equal(r.blocked,true);
assert.equal(r.reason,'force-update');

r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'49.0.0',
  minSupportedVersion:'48.0.0',
  forceUpdate:false
},'48.5.0');
assert.equal(r.blocked,false);
assert.equal(r.reason,'update-available');

r=U.evaluate({
  appId:'com.msa.one.displayfit37',
  latestVersion:'49.0.0',
  minSupportedVersion:'48.0.0',
  requireExactVersion:true
},'48.9.0');
assert.equal(r.blocked,true);
assert.equal(r.reason,'exact-version-required');

assert.equal(U.validPolicy({appId:'wrong.app',latestVersion:'49.0.0'}),false);
assert.equal(U.diagnostics().enabled,true);
assert.equal(U.diagnostics().enforce,true);
const source=fs.readFileSync('www/version-policy.js','utf8');
assert.ok(source.includes('if(mounted)return diagnostics()'),'update policy mount must be idempotent');
assert.ok(source.includes('let mounted=false'),'update policy must track mount state');

assert.equal(typeof U.showNotice,'function');
assert.equal(U.validPolicy({appId:'com.msa.one.displayfit37',latestVersion:'49.0.0',minSupportedVersion:'50.0.0'}),false);
console.log('version-aware force-update policy active contract passed');
