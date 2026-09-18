import assert from 'node:assert/strict';
await import('../www/core-library.js');
await import('../www/library-engine.js');

const L=globalThis.MSALibrary;
assert.ok(L,'MSALibrary must be registered');

const ids=L.modules.map(x=>x.id);
for(const id of ['core','document','spreadsheet','presentation','pdf','html','files','storage','planner','media','voice','ui','helper']){
  assert.ok(ids.includes(id),'missing library module '+id);
}
assert.ok(L.templates.length>=16,'built-in template library must include at least 16 templates');

for(const type of ['document','spreadsheet','presentation','pdf','html']){
  assert.ok(L.templates.some(t=>t.type===type),'missing template type '+type);
}

const budget=L.template('sheet-budget');
assert.ok(budget,'budget template must exist');
const budgetContent=typeof budget.content==='function'?budget.content():budget.content;
const parsed=JSON.parse(budgetContent);
assert.ok(Array.isArray(parsed.sheets)&&parsed.sheets.length>=2,'budget template must be multi-sheet');

for(const mod of ['core','document','spreadsheet','presentation','pdf','html','files','storage','planner','media','voice','ui']){
  assert.ok(L.api(mod),'missing API group '+mod);
}
assert.equal(typeof L.call,'function','library gateway must expose call()');
assert.equal(typeof L.api('spreadsheet').formula,'function');
assert.equal(typeof L.api('storage').backup,'function');
assert.equal(typeof L.api('files').openOffice,'function');
assert.equal(typeof L.api('helper').open,'function');

const health=L.selfCheck();
assert.equal(health.offline,true);
assert.equal(health.total,L.modules.length);
assert.equal(health.templates,L.templates.length);

console.log('built-in function library contract passed');
