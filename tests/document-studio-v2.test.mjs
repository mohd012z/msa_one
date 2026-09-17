import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/create-studio.js',s=fs.readFileSync(p,'utf8');
for(const k of ['MSADocumentIR','MSAKagaLibrary','documentToIR','documentFromIR','applyTemplate','insertHeading','insertParagraph','insertTable','undoDocument','redoDocument'])assert.ok(s.includes(k),'missing Document Studio v2 '+k);
for(const k of ['pagehide','visibilitychange','flushDraft','MSAProjectStore'])assert.ok(s.includes(k),'missing Document Studio recovery '+k);
assert.ok(s.includes('document-ir'),'Document Studio must persist IR identity');
assert.ok(s.includes('templateId'),'Document Studio must retain Kaga template provenance');
assert.ok(!s.includes("document.execCommand("),'Document Studio v2 must not rely on deprecated execCommand');
console.log('Document Studio v2 contract passed');