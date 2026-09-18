import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/pdf-intelligence-workspace-v2.js';assert.ok(fs.existsSync(p),'missing PDF Intelligence Workspace v2 '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSAPDFIntelligenceWorkspace','openPDF','closePDF','setPageCount','goToPage','nextPage','previousPage','setZoom','zoomIn','zoomOut','setPan','buildThumbnails','setPageReadiness','detectReadiness','documentStatus','saveState','recover','handoffToAnwar','handoffToRaga','getStatus'])assert.ok(s.includes(k),'missing PDF intelligence '+k);
for(const k of ['MSAPDFWorkspace','MSARagaConverter','MSAAnwarLens','MSARuntimeIntegration','MSAProjectStore'])assert.ok(s.includes(k),'missing PDF integration '+k);
for(const k of ['TEXT_READY','SCANNED','PARTIAL','UNKNOWN','OCR','PREVIEW','UNAVAILABLE','page','zoom','pan','thumbnails','localStorage'])assert.ok(s.includes(k),'missing PDF readiness/state '+k);
assert.ok(!s.includes('eval('),'PDF intelligence must not use eval');assert.ok(!s.includes('new Function'),'PDF intelligence must not use new Function');
console.log('PDF Intelligence Workspace v2 contract passed');