import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const cap=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const html=fs.readFileSync('www/index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/build-apk.yml','utf8');

assert.equal(pkg.version,'39.0.0','package version must match MSA One 39');
assert.equal(pkg.dependencies['@capacitor/android'],'7.4.3','Capacitor Android must be pinned');
assert.equal(pkg.dependencies['@capacitor/core'],'7.4.3','Capacitor Core must be pinned');
assert.equal(pkg.devDependencies['@capacitor/cli'],'7.4.3','Capacitor CLI must be pinned');
assert.equal(cap.appName,'MSA One 39','Capacitor app name must match build');
assert.equal(cap.appId,'com.msa.one.displayfit37','Android app ID must remain stable for in-place upgrades');
assert.ok(html.includes('data-build-id="MSA-ONE-39"'),'source UI build ID must match build');
assert.ok(html.includes('storage-engine.js'),'source must load durable storage');
assert.ok(html.includes('office-engine.js'),'source must load offline Office engine');
assert.ok(workflow.includes('versionCode 39'),'Android versionCode must match build');
assert.ok(workflow.includes('versionName "39.0"'),'Android versionName must match build');
assert.ok(workflow.includes('MSA-One-39-APK'),'artifact name must match build');
assert.ok(!workflow.includes('Package Calendar and adaptive display UI'),'workflow must not mutate source UI before packaging');
assert.ok(!workflow.includes('\\n          grep'),'workflow must not contain escaped newline commands');

console.log('MSA One 39 build consistency contract passed');
