import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/file-import-center-v2.js';assert.ok(fs.existsSync(p),'missing File Import Center v2 '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSAFileImportCenter','importFiles','importFolder','validateFile','detectDuplicate','routeFile','importHistory','recover','progress','cancelImport','getStatus'])assert.ok(s.includes(k),'missing import center '+k);
for(const k of ['MSAFilesWorkspace','MSARuntimeIntegration','MSARagaConverter','MSADocumentIR','MSAPDFWorkspace','MSASmartHTML'])assert.ok(s.includes(k),'missing import integration '+k);
for(const k of ['pdf','docx','xlsx','pptx','csv','html','txt','image','AVAILABLE','PREVIEW','LATER','UNAVAILABLE'])assert.ok(s.includes(k),'missing import type/capability '+k);
for(const k of ['size','name','lastModified','duplicate','rejected','completed','cancelled','localStorage'])assert.ok(s.includes(k),'missing import safety/history '+k);
assert.ok(!s.includes('eval('),'import center must not use eval');assert.ok(!s.includes('new Function'),'import center must not use new Function');
console.log('File Import Center v2 contract passed');