import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/storage-engine.js','utf8');
for(const api of ['MSAStorage','indexedDB','bootstrap','mirror','snapshot','downloadBackup','importBackup']) assert.ok(js.includes(api),'missing storage capability '+api);
for(const key of ['msaOneProjectsV1','msaOnePlannerV1','msaOneProfileV1','msaHelperV1','msaPerformanceV1']) assert.ok(js.includes(key),'missing mirrored key '+key);
assert.ok(js.includes('application/json'),'workspace backup must be JSON');
assert.ok(js.includes('Invalid backup structure'),'restore must validate backup structure');
assert.ok(js.includes("data.app&&data.app!=='MSA One'"),'restore must reject another app backup');
assert.ok(js.includes('input.oncancel'),'restore picker must cleanly handle cancel');
assert.ok(!js.includes('setTimeout(()=>input.remove(),1000)'),'restore picker must not be removed on a fixed timer');
console.log('IndexedDB and backup storage contract passed');
