import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cap=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const html=fs.readFileSync('www/index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
const manifest=fs.readFileSync('www/app-manifest.js','utf8');
const premium=fs.readFileSync('www/premium-config.js','utf8');

assert.equal(pkg.version,'49.0.0','package version must match MSA One 49');
assert.equal(pkg.dependencies['@capacitor/android'],'7.4.3','Capacitor Android must be pinned');
assert.equal(pkg.dependencies['@capacitor/core'],'7.4.3','Capacitor Core must be pinned');
assert.equal(pkg.devDependencies['@capacitor/cli'],'7.4.3','Capacitor CLI must be pinned');
assert.equal(cap.appName,'MSA One 49','Capacitor app name must match build');
assert.equal(cap.appId,'com.msa.one.displayfit37','Android app ID must remain stable for in-place upgrades');
assert.ok(manifest.includes("version:'49.0.0'"),'app manifest version must match package');
assert.ok(manifest.includes("buildId:'MSA-ONE-49'"),'app manifest build ID must match UI');
assert.ok(premium.includes('active:false'),'Premium must remain inactive in Build 48');
assert.ok(premium.includes('enabled:false'),'Billing/update policy must remain disabled in Build 48');
assert.ok(premium.includes('enforce:false'),'force update must remain disabled in Build 48');
assert.ok(premium.includes("libraryVersion:'9.1.0'"),'prepared billing version must be 9.1.0');

assert.ok(html.includes('data-build-id="MSA-ONE-49"'),'source UI build ID must match build');
for(const asset of ['library.css','helper.css','performance.css','premium.css','app-manifest.js','core-library.js','performance-engine.js','storage-engine.js','premium-config.js','entitlement-engine.js','version-policy.js','office-engine.js','import-engine.js','formula-engine.js','library-engine.js','library-updater.js','helper-engine.js','premium-ui.js','security-engine.js']){
  assert.ok(html.includes(asset),'source must load '+asset);
}
assert.ok(html.indexOf('core-library.js')<html.indexOf('office-engine.js'),'Core SDK must load before Office engine');
assert.ok(html.indexOf('helper-engine.js')>html.indexOf('library-engine.js'),'Helper must load after Library registry');
assert.ok(html.indexOf('performance-engine.js')>html.indexOf('core-library.js'),'Performance engine must load after Core SDK');
assert.ok(html.includes('Content-Security-Policy'),'source must include CSP');
assert.ok(html.includes("object-src 'none'"),'CSP must block object plugins');
assert.ok(html.includes("base-uri 'none'"),'CSP must block base-tag rewriting');
assert.ok(html.indexOf('security-engine.js')>html.indexOf('core-library.js'),'Security engine must load after Core SDK');
assert.ok(html.indexOf('security-engine.js')<html.indexOf('storage-engine.js'),'Security engine must load before storage restore');

assert.ok(workflow.includes('versionCode 49'),'Android versionCode must match build');
assert.ok(workflow.includes('versionName "49.0"'),'Android versionName must match build');
assert.ok(workflow.includes('MSA-One-49-APK'),'artifact name must match build');
for(const asset of ['app-manifest.js','core-library.js','library-engine.js','library-updater.js','library.css','helper-engine.js','helper.css','performance.css','performance-engine.js','premium.css','premium-config.js','entitlement-engine.js','version-policy.js','premium-ui.js','security-engine.js']){
  assert.ok(workflow.includes(asset),'workflow must verify packaged UX asset '+asset);
}
assert.ok(pkg.scripts['check:syntax'].includes('www/helper-engine.js'),'Helper engine must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/performance-engine.js'),'Performance engine must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/app-manifest.js'),'App manifest must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/library-updater.js'),'Library updater must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/premium-config.js'),'Premium config must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/entitlement-engine.js'),'Entitlement engine must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/version-policy.js'),'Version policy must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/premium-ui.js'),'Premium UI must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/security-engine.js'),'Security engine must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('scripts/apply-android-security.mjs'),'Android security script must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('scripts/activate-premium-android.mjs'),'Activation script must be syntax checked');
assert.ok(workflow.includes('cancel-in-progress: true'),'workflow must cancel superseded APK builds');
assert.ok(workflow.includes("! grep -q 'com.android.billingclient:billing'"),'normal APK build must prove Billing dependency is absent');
assert.ok(workflow.includes('PremiumBillingPlugin.java'),'normal APK build must prove native Premium plugin is absent');
assert.ok(workflow.includes('Apply Android security hardening'),'workflow must apply Android hardening');
assert.ok(workflow.includes('android:usesCleartextTraffic="false"'),'workflow must verify cleartext is disabled');
assert.ok(workflow.includes('setAllowFileAccess(false)'),'workflow must verify WebView file access is disabled');
assert.ok(workflow.includes('MIXED_CONTENT_NEVER_ALLOW'),'workflow must verify mixed content is disabled');
assert.ok(fs.readFileSync('scripts/activate-premium-android.mjs','utf8').includes("PREMIUM_ACTIVATE==='1'"),'native Premium activation must require explicit environment flag');
assert.ok(!workflow.includes('Package Calendar and adaptive display UI'),'workflow must not mutate source UI before packaging');
assert.ok(!workflow.includes('\\n          grep'),'workflow must not contain escaped newline commands');

console.log('MSA One 49 Secure Update consistency contract passed');
