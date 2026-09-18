import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../www/office-engine.js');
await import('../www/import-engine.js');

const source=fs.readFileSync('www/import-engine.js','utf8');
for(const capability of ['DecompressionStream','word/document.xml','xl/sharedStrings.xml','ppt/presentation.xml','relationships','readFile']) {
  assert.ok(source.includes(capability),'missing Office import capability '+capability);
}

const zip=globalThis.MSAOffice.xlsx({sheets:[
  {name:'Data',rows:[['Item','Qty','Price','Total'],['A','2','10','=B2*C2']]},
  {name:'Summary',rows:[['Metric','Value'],['Count','1']]}
]});
const files=await globalThis.MSAImport.unzip(zip);
assert.ok(files['xl/workbook.xml'],'round-trip workbook XML missing');
assert.ok(files['xl/worksheets/sheet1.xml'],'first worksheet missing');
assert.ok(files['xl/worksheets/sheet2.xml'],'second worksheet missing');

const td=new TextDecoder();
const workbook=td.decode(files['xl/workbook.xml']);
const sheet1=td.decode(files['xl/worksheets/sheet1.xml']);
assert.ok(workbook.includes('name="Data"'),'first sheet name missing');
assert.ok(workbook.includes('name="Summary"'),'second sheet name missing');
assert.ok(sheet1.includes('<f>B2*C2</f>'),'formula cell missing from XLSX round trip');

console.log('OOXML ZIP and multi-sheet XLSX round-trip passed');
