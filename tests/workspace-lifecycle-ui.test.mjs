import fs from 'node:fs';import assert from 'node:assert/strict';const s=fs.readFileSync('www/index.html','utf8'),c=fs.readFileSync('www/ui-action-controller-v2.js','utf8');
for(const a of ['save','recover','export'])assert.ok(s.includes('data-msa-action="'+a+'"'),'workspace lifecycle control missing '+a);
for(const x of ['msaWorkspaceBar','msaActionStatus','msaEditorHost'])assert.ok(s.includes('id="'+x+'"'),'missing workspace UI '+x);
for(const x of ['renderWorkspace','updateStatus','msa:action-success','msa:action-error'])assert.ok(c.includes(x),'controller missing lifecycle UI '+x);
for(const type of ['document','spreadsheet','presentation','pdf','html'])assert.ok(c.includes("current==='"+type+"'"),'lifecycle dispatch missing '+type);
assert.ok(s.includes('aria-live="polite"'),'action status must be accessible');
console.log('Workspace lifecycle UI contract passed');