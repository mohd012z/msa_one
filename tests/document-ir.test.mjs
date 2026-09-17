import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/document-ir.js';assert.ok(fs.existsSync(p),'missing Universal MSA Document IR '+p);
const s=fs.readFileSync(p,'utf8');
for(const k of ['MSADocumentIR','schemaVersion','create','validate','normalize','clone','serialize','deserialize','document','spreadsheet','presentation','pdf'])assert.ok(s.includes(k),'missing Document IR capability '+k);
for(const k of ['id','kind','title','metadata','blocks','created','updated'])assert.ok(s.includes(k),'missing Document IR field '+k);
for(const k of ['heading','paragraph','table','sheet','slide','image','page'])assert.ok(s.includes(k),'missing Document IR block '+k);
assert.ok(s.includes('Unsupported IR kind'),'IR must reject unsupported kinds');
assert.ok(s.includes('Invalid Document IR'),'IR must reject malformed data');
console.log('Universal MSA Document IR contract passed');