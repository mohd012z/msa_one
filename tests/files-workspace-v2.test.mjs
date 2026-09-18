import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/files-workspace.js';assert.ok(fs.existsSync(p),'missing Files Workspace v2 '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSAFilesWorkspace','importFiles','exportFile','openFile','removeFile','renameFile','listFiles','recentFiles','metadata','persist','restore'])assert.ok(s.includes(k),'missing Files Workspace v2 '+k);
for(const k of ['MSAProjectStore','MSARagaConverter','MSAAgentRouter','handoff','fileType'])assert.ok(s.includes(k),'missing Files Workspace integration '+k);
for(const k of ['name','size','type','lastModified','created','updated','projectId'])assert.ok(s.includes(k),'missing Files metadata '+k);
for(const k of ['MAX_FILE_SIZE','ALLOWED_TYPES','UNSUPPORTED','safeName'])assert.ok(s.includes(k),'missing safe import boundary '+k);
assert.ok(!s.includes('innerHTML=file'),'Files Workspace must not inject file content as HTML');
console.log('Files Workspace v2 contract passed');