import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/storage-engine.js','utf8');
const security=fs.readFileSync('www/security-engine.js','utf8');
for(const api of ['MSAStorage','indexedDB','bootstrap','mirror','snapshot','downloadBackup','importBackup']) assert.ok(js.includes(api),'missing storage capability '+api);
for(const key of ['msaOneProjectsV1','msaOneProjectsBackupV1','msaOneProjectsLastGoodV1','msaPdfReadinessV1','msaOnePlannerV1','msaOneProfileV1','msaHelperV1','msaPerformanceV1','msaLibraryStateV2','msaUserLibraryV1']) assert.ok(js.includes(key),'missing mirrored key '+key);
assert.ok(js.includes('application/json'),'workspace backup must be JSON');
assert.ok(js.includes('parseBackupText'),'restore must use central security validation');
assert.ok(js.includes('24*1024*1024'),'restore must reject oversized backup files');
assert.ok(security.includes("data.app&&data.app!=='MSA One'"),'central backup validator must reject another app backup');
assert.ok(js.includes('input.oncancel'),'restore picker must cleanly handle cancel');
assert.ok(!js.includes('setTimeout(()=>input.remove(),1000)'),'restore picker must not be removed on a fixed timer');
assert.ok(js.includes('const locals=new Map()'),'storage bootstrap must batch local values');
assert.ok(js.includes("d.transaction(STORE,'readwrite')"),'storage bootstrap must batch IndexedDB writes');
assert.ok(js.includes('MSAProjects?.invalidate'),'storage bootstrap must invalidate project cache after restore');
assert.ok(js.includes('localUsable'),'storage bootstrap must validate project payload before mirroring it to IndexedDB');
assert.ok(js.includes('MSAProjects?.recover'),'storage bootstrap must invoke project recovery after IndexedDB restore');
console.log('IndexedDB and backup storage contract passed');
