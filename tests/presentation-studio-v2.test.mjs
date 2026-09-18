import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/create-studio.js',s=fs.readFileSync(p,'utf8');
for(const k of ['slidesToIR','slidesFromIR','applyPresentationTemplate','addSlide','removeSlide','duplicateSlide','moveSlide','setSlideLayout'])assert.ok(s.includes(k),'missing Presentation Studio v2 '+k);
for(const k of ['MSADocumentIR','MSAKagaLibrary','MSAProjectStore','presentation','slide-ir'])assert.ok(s.includes(k),'missing Presentation Studio integration '+k);
for(const k of ['title','body','layout'])assert.ok(s.includes(k),'missing presentation slide field '+k);
assert.ok(s.includes('exportPresentationHTML'),'Presentation Studio must expose export-ready structure');
console.log('Presentation Studio v2 contract passed');