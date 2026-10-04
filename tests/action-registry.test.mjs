import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
assert.ok(html.includes('action-registry.js'),'index must load action-registry.js');
await import('../www/action-registry.js?build55-registry');
const R=globalThis.MSAActionRegistry;
assert.ok(R,'action registry must register globally');
assert.equal(typeof R.audit,'function');
assert.equal(typeof R.find,'function');
assert.ok(R.list.length>=20,'Build 55 registry must cover primary app actions');
const allowed=new Set(['Available','Limited','Planned','Requires file','Desktop companion']);
const ids=new Set();
for(const entry of R.list){
  assert.ok(entry.id&&entry.label&&entry.area&&entry.selector&&entry.impl,'registry entries need complete metadata');
  assert.ok(!ids.has(entry.id),'registry IDs must be unique: '+entry.id);ids.add(entry.id);
  assert.ok(allowed.has(entry.state),'invalid capability state: '+entry.state);
  assert.equal(typeof entry.destructive,'boolean','destructive metadata required for '+entry.id);
}
assert.equal(R.find('project-delete')?.destructive,true,'delete must be explicitly destructive');
assert.equal(R.find('workspace-restore')?.destructive,true,'restore must be explicitly destructive');

const sources=['create-studio.js','files-workspace.js','storage-engine.js','ai-reader.js','action-hub.js','search-center.js','app-shell.js','office-mobile.js'];
const combined=sources.filter(f=>fs.existsSync('www/'+f)).map(f=>fs.readFileSync('www/'+f,'utf8')).join('\n');
for(const entry of R.list.filter(x=>x.state==='Available')){
 const [root,member]=entry.impl.split('.');
 assert.ok(combined.includes(root),'Available action root must exist in production source: '+entry.impl);
 assert.ok(combined.includes(member),'Available action member must exist in production source: '+entry.impl);
}
console.log('action-registry Build 55 truth contract passed, '+R.list.length+' actions catalogued');
