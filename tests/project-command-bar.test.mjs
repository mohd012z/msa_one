import fs from 'node:fs';import assert from 'node:assert/strict';const h=fs.readFileSync('www/index.html','utf8'),c=fs.readFileSync('www/ui-action-controller-v2.js','utf8');
for(const a of ['new','open','save','save-as','undo','redo','rename-project','duplicate-project','delete-project'])assert.ok(h.includes('data-msa-action="'+a+'"')||c.includes("'"+a+"'"),'project command missing '+a);
for(const x of ['MSAProjectStore','undo','redo','duplicate','remove','rename'])assert.ok(c.includes(x),'project command integration missing '+x);
assert.ok(c.includes('confirm'),'project delete must confirm');assert.ok(c.includes('showModal')&&c.includes('showToast'),'project commands need feedback');
console.log('Project command bar contract passed');