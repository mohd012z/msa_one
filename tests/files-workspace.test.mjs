import fs from 'node:fs';import assert from 'node:assert/strict';
const js=fs.readFileSync('www/files-workspace.js','utf8');
for(const x of ['msaOneProjectsV1','renderFiles','openProject','renameProject','duplicateProject','deleteProject','files-search']) assert.ok(js.includes(x),'missing '+x);
assert.ok(js.includes('MSAStudio.open'),'saved drafts must reopen in Create Studio');
console.log('files workspace contract passed');