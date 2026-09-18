import assert from 'node:assert/strict';

const store=new Map();
globalThis.localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k),
  clear:()=>store.clear()
};

const build48Modules=[
  'core','document','spreadsheet','presentation','pdf','html','files','storage',
  'planner','media','voice','ui','helper','performance','premium','updates'
];
const build48Templates=[
  'doc-report','doc-letter','doc-minutes','doc-procedure',
  'sheet-budget','sheet-inventory','sheet-kpi','sheet-task',
  'ppt-update','ppt-training','ppt-proposal',
  'pdf-note','pdf-checklist','html-guide','html-dashboard','html-form'
];

localStorage.setItem('msaLibraryStateV2',JSON.stringify({
  schema:2,
  lastBuild:'MSA-ONE-48',
  lastVersion:'48.0.0',
  lastSync:'2026-09-18T00:00:00.000Z',
  catalog:{modules:build48Modules,templates:build48Templates},
  lastUpdate:null,
  history:[],
  ackBuild:'MSA-ONE-48'
}));
localStorage.setItem('msaUserLibraryV1',JSON.stringify({
  schema:1,
  favorites:['doc-report'],
  templates:[{id:'user-checklist',type:'document',icon:'✓',name:'My Checklist',group:'My Templates',title:'My Checklist',content:'<h1>Checklist</h1>',source:'user'}],
  recent:[]
}));

await import('../www/app-manifest.js');
await import('../www/core-library.js');
await import('../www/security-engine.js');
await import('../www/library-engine.js');
await import('../www/library-updater.js');

const U=globalThis.MSALibraryUpdate;
const L=globalThis.MSALibrary;
assert.ok(U,'Library updater must register');
assert.equal(globalThis.MSAAppManifest.version,'49.0.0');
assert.equal(globalThis.MSAAppManifest.buildId,'MSA-ONE-49');

const synced=U.sync({quiet:true});
assert.equal(synced.version,'49.0.0');
assert.equal(synced.buildId,'MSA-ONE-49');
assert.equal(synced.pendingUpdate,true,'upgrade must be marked new until acknowledged');
assert.equal(synced.lastUpdate.fromBuild,'MSA-ONE-48');
assert.equal(synced.lastUpdate.toBuild,'MSA-ONE-49');
assert.deepEqual(synced.lastUpdate.addedModules,[]);
assert.deepEqual(synced.lastUpdate.removedModules,[]);
assert.deepEqual(synced.lastUpdate.addedTemplates,[]);
assert.deepEqual(synced.lastUpdate.removedTemplates,[]);

assert.equal(U.isFavorite('doc-report'),true,'favorite must survive app upgrade');
assert.ok(U.userTemplates().some(t=>t.id==='user-checklist'),'personal template must survive app upgrade');
assert.ok(L.allTemplates().some(t=>t.id==='user-checklist'),'personal template must merge into Library catalog');

const added=U.addUserTemplate({type:'document',name:'My Guide',content:'<h1>Guide</h1><script>bad()</script>'});
assert.ok(U.userTemplates().some(t=>t.id===added.id),'personal template must be addable after upgrade');
assert.ok(!U.userTemplates().find(t=>t.id===added.id).content.includes('<script>'),'personal document template must be sanitized');
U.toggleFavorite(added.id);
assert.equal(U.isFavorite(added.id),true,'new personal template can be favorited');
U.removeUserTemplate(added.id);

const ack=U.acknowledge();
assert.equal(ack.pendingUpdate,false,'acknowledging update must clear NEW state');
assert.ok(ack.history.some(x=>x.fromBuild==='MSA-ONE-48'&&x.toBuild==='MSA-ONE-49'),'47→48 upgrade must remain in update history');

console.log('Build 48 to 49 secure update migration contract passed');
