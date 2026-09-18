import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/office-engine.js','utf8');

for(const api of ['MSAOffice','docx','xlsx','csv','pptx','pdf','download']) assert.ok(js.includes(api),'missing Office API '+api);
for(const signature of ['0x04034b50','0x02014b50','0x06054b50']) assert.ok(js.includes(signature),'missing ZIP signature '+signature);
for(const mime of ['wordprocessingml','spreadsheetml','presentationml']) assert.ok(js.includes(mime),'missing OOXML package '+mime);
assert.ok(js.includes('%PDF-1.4'),'PDF writer must emit a PDF header');
assert.ok(js.includes('crc32'),'OOXML ZIP writer must calculate CRC32');

for(const rich of ['htmlToWord','wordRun','wordTable','<w:b/>','<w:i/>','<w:u w:val="single"/>']) assert.ok(js.includes(rich),'DOCX rich formatting missing '+rich);
assert.ok(js.includes('<f>'),'XLSX formulas must be written as formula cells');
assert.ok(js.includes('fullCalcOnLoad'),'XLSX must request formula recalculation');
for(const multi of ['xlsxSheetXml','cleanSheetName','sheet1.xml','worksheets/sheet']) assert.ok(js.includes(multi),'multi-sheet XLSX support missing '+multi);
for(const media of ['dataUrlAsset','ppt/media/','relationships/image','image/png','image/jpeg']) assert.ok(js.includes(media),'PPTX image support missing '+media);
for(const layout of ['image-right','image-full']) assert.ok(js.includes(layout),'PPTX layout missing '+layout);

console.log('rich offline Office engine contract passed');
