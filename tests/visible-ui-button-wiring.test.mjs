import fs from 'node:fs';import assert from 'node:assert/strict';const s=fs.readFileSync('www/index.html','utf8'),w=fs.readFileSync('.github/workflows/build-apk.yml','utf8');
for(const a of ['document','spreadsheet','presentation','pdf','smart-html','files','create','ai','me','converter','planner'])assert.ok(s.includes('data-msa-action="'+a+'"'),'visible UI missing real action '+a);
assert.ok(s.includes('id="msaImportInput"'),'missing real file input');assert.ok(s.includes('data-msa-action="import"'),'missing import action');
for(const x of ['ui-action-controller-v2.js','MSAUIActionController'])assert.ok(w.includes(x),'APK workflow missing UI controller '+x);
assert.ok((w.match(/MSAUIActionController/g)||[]).length>=2,'UI controller not verified in web + Android');
assert.ok(!/<button class="tile"(?![^>]*data-msa-action)[^>]*>/g.test(s),'decorative tile button remains without action');
console.log('Visible UI button wiring contract passed');