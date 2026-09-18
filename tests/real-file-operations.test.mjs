import fs from 'node:fs';import assert from 'node:assert/strict';const c=fs.readFileSync('www/ui-action-controller-v2.js','utf8'),h=fs.readFileSync('www/index.html','utf8');
for(const x of ['msaFileMenu','file-rename','file-export','file-remove','file-convert','file-ask-ai'])assert.ok(h.includes(x)||c.includes(x),'file operation missing '+x);
for(const x of ['rename','remove','export','convert','askAI'])assert.ok(c.toLowerCase().includes(x.toLowerCase()),'file controller operation missing '+x);
for(const x of ['MSAFilesWorkspace','MSARagaConversionMatrix','MSAAnwarLens'])assert.ok(c.includes(x),'file action integration missing '+x);
assert.ok(c.includes('confirm'),'destructive remove must confirm');assert.ok(c.includes('showModal'),'file operations need visible feedback');
console.log('Real file operations contract passed');