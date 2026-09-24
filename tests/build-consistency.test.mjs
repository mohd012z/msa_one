import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cap=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const html=fs.readFileSync('www/index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
const manifest=fs.readFileSync('www/app-manifest.js','utf8');
const premium=fs.readFileSync('www/premium-config.js','utf8');

assert.equal(pkg.version,'54.0.0','package version must match MSA One 54');
assert.equal(pkg.dependencies['@capacitor/android'],'7.4.3','Capacitor Android must be pinned');
assert.equal(pkg.dependencies['@capacitor/core'],'7.4.3','Capacitor Core must be pinned');
assert.equal(pkg.devDependencies['@capacitor/cli'],'7.4.3','Capacitor CLI must be pinned');
assert.equal(cap.appName,'MSA One 54','Capacitor app name must match build');
assert.equal(cap.appId,'com.msa.one.displayfit37','Android app ID must remain stable for in-place upgrades');
assert.ok(manifest.includes("version:'54.0.0'"),'app manifest version must match package');
assert.ok(manifest.includes("buildId:'MSA-ONE-54'"),'app manifest build ID must match UI');
assert.ok(premium.includes('active:false'),'Premium must remain inactive in Build 54');
assert.ok(premium.includes("billing:{\n      enabled:false"),'Billing must remain disabled in Build 54');
assert.ok(premium.includes("updatePolicy:{\n      enabled:true"),'remote update policy must be active in Build 54');
assert.ok(premium.includes('enforce:true'),'force update must be active in Build 54');
assert.ok(premium.includes("libraryVersion:'9.1.0'"),'prepared billing version must be 9.1.0');

assert.ok(html.includes('data-build-id="MSA-ONE-54"'),'source UI build ID must match build');
for(const asset of ['library.css','helper.css','performance.css','premium.css','app-manifest.js','core-library.js','performance-engine.js','storage-engine.js','premium-config.js','entitlement-engine.js','version-policy.js','office-engine.js','import-engine.js','formula-engine.js','library-engine.js','library-updater.js','helper-engine.js','premium-ui.js','security-engine.js','mobile-quality.js','pdf-readiness.js','native-file-bridge.js','workspace-v2.css','tools-catalog.js','template-catalog.js','assistant-catalog.js','action-sheet.js','drawer.js','search-center.js','home-v2.js','files-v2.js','tools-center.js','template-center.js','ai-tools.js','companion-engine.js','create-v2.js','app-shell.js']){
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

assert.ok(workflow.includes('versionCode 54'),'Android versionCode must match build');
assert.ok(workflow.includes('versionName "54.0"'),'Android versionName must match build');
assert.ok(workflow.includes('MSA-One-54-APK'),'artifact name must match build');
for(const asset of ['app-manifest.js','core-library.js','library-engine.js','library-updater.js','library.css','helper-engine.js','helper.css','performance.css','performance-engine.js','premium.css','premium-config.js','entitlement-engine.js','version-policy.js','premium-ui.js','security-engine.js','mobile-quality.js','pdf-readiness.js','native-file-bridge.js','companion-engine.js']){
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
assert.ok(pkg.scripts['check:syntax'].includes('www/mobile-quality.js'),'Mobile quality diagnostics must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/pdf-readiness.js'),'PDF readiness must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/native-file-bridge.js'),'Native file bridge must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/app-shell.js'),'Workspace shell must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/search-center.js'),'Universal search must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/tools-center.js'),'Tools Center must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/template-center.js'),'Template Center must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/ai-tools.js'),'AI Tools browser must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/companion-engine.js'),'Companion workflow must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('scripts/apply-android-security.mjs'),'Android security script must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('scripts/activate-premium-android.mjs'),'Activation script must be syntax checked');
assert.ok(workflow.includes('cancel-in-progress: true'),'workflow must cancel superseded APK builds');
assert.ok(workflow.includes('pull_request:'),'workflow must validate pull requests before merge');
assert.ok(workflow.includes('./gradlew lintDebug'),'workflow must run Android lint before APK packaging');
assert.ok(workflow.indexOf('./gradlew lintDebug')<workflow.indexOf('./gradlew assembleDebug'),'Android lint must run before APK build');
assert.ok(workflow.includes("! grep -q 'com.android.billingclient:billing'"),'normal APK build must prove Billing dependency is absent');
assert.ok(workflow.includes('PremiumBillingPlugin.java'),'normal APK build must prove native Premium plugin is absent');
assert.ok(workflow.includes('Apply Android security hardening'),'workflow must apply Android hardening');
assert.ok(workflow.includes('android:usesCleartextTraffic="false"'),'workflow must verify cleartext is disabled');
assert.ok(workflow.includes('setAllowFileAccess(false)'),'workflow must verify WebView file access is disabled');
assert.ok(workflow.includes('MIXED_CONTENT_NEVER_ALLOW'),'workflow must verify mixed content is disabled');
assert.ok(workflow.includes('MSAFileBridgePlugin.java'),'workflow must package native file bridge');
assert.ok(workflow.includes('ACTION_OPEN_DOCUMENT_TREE'),'workflow must verify native folder picker');
assert.ok(workflow.includes('applySystemBarInsets'),'workflow must verify Android system-bar insets');
assert.ok(fs.readFileSync('scripts/activate-premium-android.mjs','utf8').includes("PREMIUM_ACTIVATE==='1'"),'native Premium activation must require explicit environment flag');
assert.ok(!workflow.includes('Package Calendar and adaptive display UI'),'workflow must not mutate source UI before packaging');
assert.ok(!workflow.includes('\\n          grep'),'workflow must not contain escaped newline commands');

console.log('MSA One 54 Safe UI consistency contract passed');
