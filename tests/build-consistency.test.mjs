import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cap=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const workflow=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
const manifest=fs.readFileSync('www/app-manifest.js','utf8');
const premium=fs.readFileSync('www/premium-config.js','utf8');
const shell=fs.readFileSync('www/app-shell.js','utf8');

assert.equal(pkg.version,'55.0.0','package version must match MSA One 55');
assert.equal(pkg.dependencies['@capacitor/android'],'7.4.3');
assert.equal(pkg.dependencies['@capacitor/core'],'7.4.3');
assert.equal(pkg.devDependencies['@capacitor/cli'],'7.4.3');
assert.equal(cap.appName,'MSA One 55');
assert.equal(cap.appId,'com.msa.one.displayfit37','Android app ID must stay stable for in-place upgrades');
assert.ok(manifest.includes("version:'55.0.0'"));
assert.ok(manifest.includes("buildId:'MSA-ONE-55'"));
assert.ok(shell.includes('MSA-ONE-55'),'active shell must update the runtime Build 55 marker even while dormant legacy markup remains in index.html');
assert.ok(premium.includes('active:false'),'Premium must remain inactive');
assert.ok(premium.includes("billing:{\n      enabled:false"),'Billing must remain disabled in normal APK');
assert.ok(premium.includes("updatePolicy:{\n      enabled:true"),'update policy support must remain enabled');
assert.ok(premium.includes('enforce:true'),'update policy evaluation must remain enabled');
assert.ok(premium.includes("libraryVersion:'9.1.0'"),'prepared Billing library version must not drift');

for(const asset of ['ui-system.css','icon-system.js','action-hub.js','library-shell-adapter.js']){
  assert.ok(shell.includes(asset)||workflow.includes(asset),'Build 55 asset must be bootstrapped/packaged: '+asset);
}
for(const asset of ['library.css','helper.css','performance.css','premium.css','app-manifest.js','core-library.js','storage-engine.js','security-engine.js','mobile-quality.js','native-file-bridge.js','office-mobile.js','workspace-v2.css','search-center.js','home-v2.js','files-v2.js','tools-center.js','ai-tools.js','create-v2.js','app-shell.js']){
  assert.ok(fs.existsSync('www/'+asset),'source asset must exist: '+asset);
}
for(const js of ['www/icon-system.js','www/action-hub.js','www/library-shell-adapter.js']) assert.ok(pkg.scripts['check:syntax'].includes(js),'new Build 55 JS must be syntax checked: '+js);

assert.ok(workflow.includes('versionCode 55'),'Android versionCode must match build');
assert.ok(workflow.includes('versionName "55.0"'),'Android versionName must match build');
assert.ok(workflow.includes('MSA-One-55-APK'),'artifact name must match build');
assert.ok(workflow.includes('npm test'),'workflow must run source contracts');
assert.ok(workflow.includes('./gradlew lintDebug'),'workflow must run Android lint');
assert.ok(workflow.includes('./gradlew assembleDebug'),'workflow must build debug APK');
assert.ok(workflow.indexOf('./gradlew lintDebug')<workflow.indexOf('./gradlew assembleDebug'),'lint must run before build');
for(const asset of ['ui-system.css','icon-system.js','action-hub.js','library-shell-adapter.js','MSAFileBridgePlugin.java','MSAPdfViewerActivity.java']) assert.ok(workflow.includes(asset),'workflow must verify packaged Build 55/native asset '+asset);
assert.ok(workflow.includes("! grep -q 'com.android.billingclient:billing'"),'normal APK must prove Billing dependency absent');
assert.ok(workflow.includes('android:usesCleartextTraffic="false"'),'cleartext must remain disabled');
assert.ok(workflow.includes('setAllowFileAccess(false)'),'WebView file access must remain disabled');
assert.ok(workflow.includes('MIXED_CONTENT_NEVER_ALLOW'),'mixed content must remain disabled');
assert.ok(workflow.includes('ACTION_OPEN_DOCUMENT_TREE'),'native folder picker must remain packaged');
assert.ok(workflow.includes('applySystemBarInsets'),'native safe-area bridge must remain packaged');
assert.ok(workflow.includes('cancel-in-progress: true'),'superseded APK builds should be canceled');
assert.ok(workflow.includes('pull_request:'),'pull requests must be validated before merge');

console.log('MSA One 55 UI consolidation build contract passed');
