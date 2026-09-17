import fs from 'node:fs';import assert from 'node:assert/strict';
const js=fs.readFileSync('www/files-workspace.js','utf8');
for(const x of ['MSAProjectStore','renderFiles','openProject','renameProject','duplicateProject','deleteProject','files-search','msa:projects-changed']) assert.ok(js.includes(x),'missing '+x);
assert.ok(js.includes('MSAStudio.open'),'saved drafts must reopen in Create Studio');
assert.ok(!js.includes("localStorage.getItem('msaOneProjectsV1')"),'Files must not bypass the shared project store');
console.log('files workspace shared-store contract passed');