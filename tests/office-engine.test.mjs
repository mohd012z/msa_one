import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/office-engine.js','utf8');
for(const api of ['MSAOffice','docx','xlsx','csv','pptx','pdf','download']) assert.ok(js.includes(api),'missing Office API '+api);
for(const signature of ['0x04034b50','0x02014b50','0x06054b50']) assert.ok(js.includes(signature),'missing ZIP signature '+signature);
for(const mime of ['wordprocessingml','spreadsheetml','presentationml']) assert.ok(js.includes(mime),'missing OOXML package '+mime);
assert.ok(js.includes('%PDF-1.4'),'PDF writer must emit a PDF header');
assert.ok(js.includes('crc32'),'OOXML ZIP writer must calculate CRC32');
console.log('offline Office engine contract passed');
