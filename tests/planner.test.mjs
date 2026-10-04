import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/planner.js','utf8');
const css=fs.readFileSync('www/planner.css','utf8');

for(const k of ['My Day','Diary','Daily Program','Plan','Note','msaOnePlannerV1','planner-grid','planner-agenda','planner-editor']){
  assert.ok(js.includes(k)||css.includes(k),'missing '+k);
}
for(const k of ['addEntry','saveEntry','deleteEntry','selectedDate','localStorage','registerPage','todaySummary']){
  assert.ok(js.includes(k)||css.includes(k),'missing '+k);
}
for(const k of ['max-width:900px','min-width:0','overflow-x:hidden','touch-action:pan-y','max-height:calc(100%']){
  assert.ok(css.includes(k),'missing mobile viewport guard '+k);
}
assert.ok(js.includes("id:'myday'"),'Planner must register as My Day');
assert.ok(!js.includes('planner-nav')&&!js.includes('addNavigationShortcut'),'Planner must not recreate legacy navigation');
assert.ok(js.includes('MSAAppShell'),'Planner navigation must use the central shell');
assert.ok(js.includes('MSAStorage?.mirror'),'Planner changes must mirror to durable storage');
assert.ok(js.includes('MSAHelper'),'Planner must use Friendly Helper feedback when available');
assert.ok(js.includes('Planner entry restored'),'Planner delete flow must support Undo');
assert.ok(js.includes("window.MSACore?.uid('cal')"),'Planner IDs should use shared Core SDK when available');
assert.ok(!js.includes("<select data-kind>${Object.keys(KINDS)"),'Planner must not contain the old malformed nested template string');
assert.ok(css.includes('var(--msa-touch-min,48px)'),'Planner must use Build 55 touch target token');

console.log('Build 55 planner runtime regression contract passed');
