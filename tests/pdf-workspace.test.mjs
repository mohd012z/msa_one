import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/pdf-workspace.js';assert.ok(fs.existsSync(p),'missing PDF Workspace '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSAPDFWorkspace','importPDF','openPDF','closePDF','nextPage','previousPage','goToPage','zoomIn','zoomOut','setZoom','metadata','persist','restore'])assert.ok(s.includes(k),'missing PDF Workspace '+k);
for(const k of ['MSAProjectStore','MSARagaConverter','pdf','PREVIEW'])assert.ok(s.includes(k),'missing PDF Workspace integration '+k);
for(const k of ['page','pageCount','zoom','fileName','fileSize','lastOpened'])assert.ok(s.includes(k),'missing PDF Workspace state '+k);
for(const k of ['OCR','UNAVAILABLE','extraction','editing'])assert.ok(s.includes(k),'missing PDF capability truth '+k);
assert.ok(!s.includes('innerHTML=input'),'PDF Workspace must not inject imported content as HTML');
console.log('PDF Workspace contract passed');