import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
const script=fs.readFileSync('scripts/apply-android-security.mjs','utf8');
const network=fs.readFileSync('security-prep/android/network_security_config.xml','utf8');
const premiumActivation=fs.readFileSync('scripts/activate-premium-android.mjs','utf8');

assert.ok(html.includes('Content-Security-Policy'),'CSP meta must exist');
for(const directive of ["object-src 'none'","base-uri 'none'","form-action 'none'","upgrade-insecure-requests"]){
  assert.ok(html.includes(directive),'CSP missing '+directive);
}
assert.ok(html.indexOf('security-engine.js')>html.indexOf('core-library.js'),'Security engine must load after Core');
assert.ok(html.indexOf('security-engine.js')<html.indexOf('storage-engine.js'),'Security engine must load before storage restore');

for(const hardening of [
  'setAllowFileAccess(false)',
  'setAllowFileAccessFromFileURLs(false)',
  'setAllowUniversalAccessFromFileURLs(false)',
  'MIXED_CONTENT_NEVER_ALLOW',
  'setGeolocationEnabled(false)',
  'setSafeBrowsingEnabled(true)'
]) assert.ok(script.includes(hardening),'Android hardening missing '+hardening);

assert.ok(network.includes('cleartextTrafficPermitted="false"'));
assert.ok(script.includes("setApplicationAttribute(m,'usesCleartextTraffic','false')"));
assert.ok(script.includes("setApplicationAttribute(m,'allowBackup','false')"));
assert.ok(script.includes("setApplicationAttribute(m,'networkSecurityConfig','@xml/network_security_config')"));
assert.ok(workflow.includes('Apply Android security hardening'));
assert.ok(premiumActivation.includes('setAllowFileAccess(false)'),'Premium activation must require hardened MainActivity');

console.log('Android WebView/network security contract passed');
