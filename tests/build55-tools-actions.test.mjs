import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../www/tools-catalog.js?build55-tools');
await import('../www/action-registry.js?build55-actions');
const tools=globalThis.MSAToolsCatalog;
const registry=globalThis.MSAActionRegistry;
const allowed=new Set(['Available','Limited','Planned','Requires file','Desktop companion']);
assert.ok(Array.isArray(tools)&&tools.length,'tools catalog must load');
for(const tool of tools) assert.ok(allowed.has(tool.state),`${tool.id} must have a truthful capability state`);
assert.equal(tools.find(x=>x.id==='compress')?.state,'Planned','File Compressor must not appear available without an engine');
const scanAssist=tools.find(x=>x.id==='ocr');
assert.equal(scanAssist?.state,'Limited');
assert.ok(!/OCR Reader/i.test(scanAssist?.name||''),'scanned-document helper must not claim a real OCR reader');
assert.ok(/no built-in OCR|text layer|scanned/i.test(scanAssist?.desc||''),'limited scan helper must explain the boundary');

assert.ok(registry?.list?.length>=15,'action registry must remain meaningful');
for(const item of registry.list){
 assert.ok(item.id&&item.label&&item.area&&item.impl&&item.state,'registry entries must use Build 55 shape');
 assert.ok(allowed.has(item.state),`${item.id} has invalid state`);
 assert.equal(typeof item.destructive,'boolean',`${item.id} must declare destructive metadata`);
}

const drawer=fs.readFileSync('www/drawer.js','utf8');
for(const stale of ['QR / Import','Plug-in / Library Management','Update Center','Security Center','OCR Center']) assert.ok(!drawer.includes(stale),`drawer must remove misleading label: ${stale}`);
for(const label of ['Library','Update Status','Security Status','Scanned Document Assistant']) assert.ok(drawer.includes(label),`drawer must expose truthful label: ${label}`);
const center=fs.readFileSync('www/tools-center.js','utf8');
assert.ok(!center.includes("t.name+' is prepared in Tools Center.'"),'Available cards must not fall through to a generic prepared message');
assert.ok(center.includes("state==='Planned'")||center.includes("state === 'Planned'"),'planned tools must be gated before routing');

console.log('Build 55 tools/action truth contract passed');
