import fs from 'node:fs';import assert from 'node:assert/strict';const s=fs.readFileSync('www/ui-action-controller-v2.js','utf8'),h=fs.readFileSync('www/index.html','utf8');
for(const x of ['contenteditable','input','textarea','workspace-edit','autosave','debounce','dirty','beforeunload'])assert.ok(s.includes(x)||h.includes(x),'editor interaction missing '+x);
for(const x of ['download','Blob','URL.createObjectURL','a.download'])assert.ok(s.includes(x),'real export download missing '+x);
for(const a of ['workspace-edit','save','recover','export'])assert.ok(s.includes(a),'lifecycle action missing '+a);
assert.ok(h.includes('id="msaEditorHost"'),'editor host missing');assert.ok(h.includes('data-msa-action="save"'),'save UI missing');
console.log('Editor persistence export interaction contract passed');