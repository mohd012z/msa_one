import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/planner.js','utf8');
const css=fs.readFileSync('www/planner.css','utf8');

for(const k of ['Calendar','Diary','Daily Program','Plan','Note','msaOnePlannerV1','planner-grid','planner-agenda','planner-editor']){
  assert.ok(js.includes(k)||css.includes(k),'missing '+k);
}
for(const k of ['addEntry','saveEntry','deleteEntry','selectedDate','localStorage','planner-nav','addNavigationShortcut']){
  assert.ok(js.includes(k)||css.includes(k),'missing '+k);
}
for(const k of ['max-width:100%','min-width:0','overflow-x:hidden','touch-action:pan-y','max-height:calc(100%']){
  assert.ok(css.includes(k),'missing mobile viewport guard '+k);
}

assert.ok(js.includes('MSAStorage?.mirror'),'Planner changes must mirror to durable storage');
assert.ok(js.includes('MSAHelper'),'Planner must use Friendly Helper feedback when available');
assert.ok(js.includes('Planner entry restored'),'Planner delete flow must support Undo');
assert.ok(js.includes("window.MSACore?.uid('cal')"),'Planner IDs should use shared Core SDK when available');
assert.ok(!js.includes("<select data-kind>${Object.keys(KINDS)"),'Planner must not contain the old malformed nested template string');

console.log('planner runtime regression contract passed');
