import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/storage-engine.js','utf8');
for(const api of ['MSAStorage','indexedDB','bootstrap','mirror','snapshot','downloadBackup','importBackup']) assert.ok(js.includes(api),'missing storage capability '+api);
for(const key of ['msaOneProjectsV1','msaOnePlannerV1','msaOneProfileV1']) assert.ok(js.includes(key),'missing mirrored key '+key);
assert.ok(js.includes('application/json'),'workspace backup must be JSON');
console.log('IndexedDB and backup storage contract passed');
