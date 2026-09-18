import fs from 'node:fs';import assert from 'node:assert/strict';const h=fs.readFileSync('www/index.html','utf8'),c=fs.readFileSync('www/ui-action-controller-v2.js','utf8');
for(const x of ['msaToast','msaModal','msaModalTitle','msaModalBody','msaModalClose'])assert.ok(h.includes('id="'+x+'"'),'missing feedback UI '+x);
for(const x of ['showToast','showModal','closeModal','focus','Escape'])assert.ok(c.includes(x),'feedback controller missing '+x);
for(const a of ['scan','image','voice','file-menu','profile','premium','converter','planner'])assert.ok(c.includes("'"+a+"'")||c.includes(a+':'),'feedback action absent '+a);
assert.ok(h.includes('role="dialog"'),'modal semantics missing');assert.ok(h.includes('aria-live="polite"'),'live feedback missing');
console.log('Action feedback and preview modal contract passed');