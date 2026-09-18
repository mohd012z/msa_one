import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/raga-converter.js';assert.ok(fs.existsSync(p),'missing Raga converter '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSARagaConverter','detectFormat','selectConverter','convert','validate','fidelityReport','fallback','htmlToIR','irToHTML','csvToIR','irToCSV'])assert.ok(s.includes(k),'missing Raga conversion engine '+k);
for(const k of ['AVAILABLE','PREVIEW','LATER','UNAVAILABLE'])assert.ok(s.includes(k),'missing Raga capability truth '+k);
for(const k of ['docx','xlsx','pptx','pdf'])assert.ok(s.toLowerCase().includes(k),'missing Raga adapter evaluation '+k);
for(const k of ['MSADocumentIR','MSAAgentRouter','raga'])assert.ok(s.includes(k),'missing Raga integration '+k);
assert.ok(s.includes('losses')&&s.includes('warnings'),'Raga fidelity report must disclose conversion loss/warnings');
console.log('Raga Universal Conversion Engine contract passed');