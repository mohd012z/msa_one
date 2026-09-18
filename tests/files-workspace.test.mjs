import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/files-workspace.js','utf8');
const css=fs.readFileSync('www/files-workspace.css','utf8');

for(const x of ['msaOneProjectsV1','renderFiles','openProject','renameProject','duplicateProject','deleteProject','files-search']) assert.ok(js.includes(x),'missing '+x);
assert.ok(js.includes('MSAStudio.open'),'saved drafts must reopen in Create Studio');
for(const x of ['importOfficeFile','MSAImport.readFile','.docx,.xlsx,.pptx','data-open-office']) assert.ok(js.includes(x),'missing Files Office opener capability '+x);
assert.ok(css.includes('.files-hero-actions'),'Files Office opener must be styled');

console.log('files workspace Office opener contract passed');
