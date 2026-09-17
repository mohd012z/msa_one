import fs from 'node:fs';import assert from 'node:assert/strict';
const js=fs.readFileSync('www/planner.js','utf8'),css=fs.readFileSync('www/planner.css','utf8');
for(const k of ['Calendar','Diary','Daily Program','Plan','Note','msaOnePlannerV1','planner-grid','planner-agenda','planner-editor'])assert.ok(js.includes(k)||css.includes(k),'missing '+k);
for(const k of ['addEntry','saveEntry','deleteEntry','selectedDate','localStorage','planner-nav','addNavigationShortcut'])assert.ok(js.includes(k)||css.includes(k),'missing '+k);
for(const k of ['max-width:100%','min-width:0','overflow-x:hidden','touch-action:pan-y','max-height:calc(100%'])assert.ok(css.includes(k),'missing mobile viewport guard '+k);
console.log('planner contract passed');