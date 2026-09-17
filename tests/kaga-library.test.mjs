import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/kaga-library.js';assert.ok(fs.existsSync(p),'missing Kaga Library '+p);
const s=fs.readFileSync(p,'utf8');
for(const k of ['MSAKagaLibrary','templateSchema','catalog','document','spreadsheet','presentation','search','preview','customize','apply','undo'])assert.ok(s.includes(k),'missing Kaga library capability '+k);
for(const k of ['id','family','title','version','blocks','provenance','license','status'])assert.ok(s.includes(k),'missing Kaga template schema '+k);
for(const k of ['AVAILABLE','PREVIEW','UNAVAILABLE'])assert.ok(s.includes(k),'missing Kaga capability truth '+k);
assert.ok(s.includes('MSAProjectStore'),'Kaga must apply through shared project storage');
assert.ok(s.includes('MSAAgentRouter'),'Kaga must respect agent authorization');
console.log('Kaga library foundation contract passed');