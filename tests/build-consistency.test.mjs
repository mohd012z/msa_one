import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cap=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const html=fs.readFileSync('www/index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
const manifest=fs.readFileSync('www/app-manifest.js','utf8');

assert.equal(pkg.version,'46.0.0','package version must match MSA One 46');
assert.equal(pkg.dependencies['@capacitor/android'],'7.4.3','Capacitor Android must be pinned');
assert.equal(pkg.dependencies['@capacitor/core'],'7.4.3','Capacitor Core must be pinned');
assert.equal(pkg.devDependencies['@capacitor/cli'],'7.4.3','Capacitor CLI must be pinned');
assert.equal(cap.appName,'MSA One 46','Capacitor app name must match build');
assert.equal(cap.appId,'com.msa.one.displayfit37','Android app ID must remain stable for in-place upgrades');
assert.ok(manifest.includes("version:'46.0.0'"),'app manifest version must match package');
assert.ok(manifest.includes("buildId:'MSA-ONE-46'"),'app manifest build ID must match UI');

assert.ok(html.includes('data-build-id="MSA-ONE-46"'),'source UI build ID must match build');
for(const asset of ['library.css','helper.css','performance.css','app-manifest.js','core-library.js','performance-engine.js','storage-engine.js','office-engine.js','import-engine.js','formula-engine.js','library-engine.js','library-updater.js','helper-engine.js']){
  assert.ok(html.includes(asset),'source must load '+asset);
}
assert.ok(html.indexOf('core-library.js')<html.indexOf('office-engine.js'),'Core SDK must load before Office engine');
assert.ok(html.indexOf('helper-engine.js')>html.indexOf('library-engine.js'),'Helper must load after Library registry');
assert.ok(html.indexOf('performance-engine.js')>html.indexOf('core-library.js'),'Performance engine must load after Core SDK');

assert.ok(workflow.includes('versionCode 46'),'Android versionCode must match build');
assert.ok(workflow.includes('versionName "46.0"'),'Android versionName must match build');
assert.ok(workflow.includes('MSA-One-46-APK'),'artifact name must match build');
for(const asset of ['app-manifest.js','core-library.js','library-engine.js','library-updater.js','library.css','helper-engine.js','helper.css','performance.css','performance-engine.js']){
  assert.ok(workflow.includes(asset),'workflow must verify packaged UX asset '+asset);
}
assert.ok(pkg.scripts['check:syntax'].includes('www/helper-engine.js'),'Helper engine must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/performance-engine.js'),'Performance engine must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/app-manifest.js'),'App manifest must be syntax checked');
assert.ok(pkg.scripts['check:syntax'].includes('www/library-updater.js'),'Library updater must be syntax checked');
assert.ok(workflow.includes('cancel-in-progress: true'),'workflow must cancel superseded APK builds');
assert.ok(!workflow.includes('Package Calendar and adaptive display UI'),'workflow must not mutate source UI before packaging');
assert.ok(!workflow.includes('\\n          grep'),'workflow must not contain escaped newline commands');

console.log('MSA One 46 Library Auto-Sync consistency contract passed');
