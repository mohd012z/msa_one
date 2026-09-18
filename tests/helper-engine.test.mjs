import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../www/core-library.js');
await import('../www/helper-engine.js');

const H=globalThis.MSAHelper;
assert.ok(H,'MSAHelper must be registered');

for(const id of ['home','files','create','document','spreadsheet','presentation','pdf','html','ai','me','library','planner']){
  assert.ok(H.contexts[id],'missing helper context '+id);
  assert.ok(H.contexts[id].title,'helper context needs a title '+id);
  assert.ok(H.contexts[id].intro,'helper context needs an introduction '+id);
  assert.ok(Array.isArray(H.contexts[id].examples),'helper context needs examples '+id);
  assert.ok(Array.isArray(H.contexts[id].trouble),'helper context needs troubleshooting '+id);
}
for(const api of ['open','close','complete','showMe','notify','error','success','refresh','mount']){
  assert.equal(typeof H[api],'function','missing helper API '+api);
}

const source=fs.readFileSync('www/helper-engine.js','utf8');
for(const feature of ['data-helper-fab','data-helper-sheet','data-show-index','helper-highlight','welcomeSeen','msaHelperV1','Autosaved locally','Troubleshoot']){
  assert.ok(source.includes(feature),'missing helper feature '+feature);
}

console.log('Friendly Helper context and API contract passed');
