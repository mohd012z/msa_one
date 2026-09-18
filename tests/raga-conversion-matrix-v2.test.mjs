import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/raga-conversion-matrix-v2.js';assert.ok(fs.existsSync(p),'missing Raga Conversion Matrix v2 '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSARagaConversionMatrix','getMatrix','getCapability','canConvert','planConversion','convert','validateResult','compareResult','repairResult','fallback','conversionReport','getStatus'])assert.ok(s.includes(k),'missing Raga Conversion Matrix v2 '+k);
for(const k of ['MSARagaConverter','MSADocumentIR','MSAFileImportCenter','MSAProjectStore','MSARuntimeIntegration','MSAAgentRouter'])assert.ok(s.includes(k),'missing Raga matrix integration '+k);
for(const k of ['html','csv','txt','pdf','docx','xlsx','pptx','AVAILABLE','PREVIEW','LATER','UNAVAILABLE','losses','warnings','fidelity','fallback'])assert.ok(s.includes(k),'missing Raga matrix capability '+k);
assert.ok(!s.includes('eval('),'Raga Conversion Matrix v2 must not use eval');assert.ok(!s.includes('new Function'),'Raga Conversion Matrix v2 must not use new Function');
console.log('Raga Conversion Matrix v2 contract passed');