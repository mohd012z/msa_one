import assert from 'node:assert/strict';

const store=new Map();
globalThis.localStorage={
  getItem:k=>store.has(k)?store.get(k):null,
  setItem:(k,v)=>store.set(k,String(v)),
  removeItem:k=>store.delete(k),
  clear:()=>store.clear()
};

const build46Modules=[
  'core','document','spreadsheet','presentation','pdf','html','files','storage',
  'planner','media','voice','ui','helper','performance'
];
const build46Templates=[
  'doc-report','doc-letter','doc-minutes','doc-procedure',
  'sheet-budget','sheet-inventory','sheet-kpi','sheet-task',
  'ppt-update','ppt-training','ppt-proposal',
  'pdf-note','pdf-checklist','html-guide','html-dashboard','html-form'
];

localStorage.setItem('msaLibraryStateV2',JSON.stringify({
  schema:2,
  lastBuild:'MSA-ONE-46',
  lastVersion:'46.0.0',
  lastSync:'2026-09-18T00:00:00.000Z',
  catalog:{modules:build46Modules,templates:build46Templates},
  lastUpdate:null,
  history:[],
  ackBuild:'MSA-ONE-46'
}));
localStorage.setItem('msaUserLibraryV1',JSON.stringify({
  schema:1,
  favorites:['doc-report'],
  templates:[{id:'user-checklist',type:'document',icon:'✓',name:'My Checklist',group:'My Templates',title:'My Checklist',content:'<h1>Checklist</h1>',source:'user'}],
  recent:[]
}));

await import('../www/app-manifest.js');
await import('../www/core-library.js');
await import('../www/library-engine.js');
await import('../www/library-updater.js');

const U=globalThis.MSALibraryUpdate;
const L=globalThis.MSALibrary;
assert.ok(U,'Library updater must register');
assert.equal(globalThis.MSAAppManifest.version,'47.0.0');
assert.equal(globalThis.MSAAppManifest.buildId,'MSA-ONE-47');

const synced=U.sync({quiet:true});
assert.equal(synced.version,'47.0.0');
assert.equal(synced.buildId,'MSA-ONE-47');
assert.equal(synced.pendingUpdate,true,'upgrade must be marked new until acknowledged');
assert.equal(synced.lastUpdate.fromBuild,'MSA-ONE-46');
assert.equal(synced.lastUpdate.toBuild,'MSA-ONE-47');
assert.deepEqual(synced.lastUpdate.addedModules.sort(),['premium','updates']);
assert.deepEqual(synced.lastUpdate.removedModules,[]);
assert.deepEqual(synced.lastUpdate.addedTemplates,[]);
assert.deepEqual(synced.lastUpdate.removedTemplates,[]);

assert.equal(U.isFavorite('doc-report'),true,'favorite must survive app upgrade');
assert.ok(U.userTemplates().some(t=>t.id==='user-checklist'),'personal template must survive app upgrade');
assert.ok(L.allTemplates().some(t=>t.id==='user-checklist'),'personal template must merge into Library catalog');

const added=U.addUserTemplate({type:'html',name:'My Guide',content:'<h1>Guide</h1>'});
assert.ok(U.userTemplates().some(t=>t.id===added.id),'personal template must be addable after upgrade');
U.toggleFavorite(added.id);
assert.equal(U.isFavorite(added.id),true,'new personal template can be favorited');
U.removeUserTemplate(added.id);
assert.ok(!U.userTemplates().some(t=>t.id===added.id),'personal template must be removable');

const ack=U.acknowledge();
assert.equal(ack.pendingUpdate,false,'acknowledging update must clear NEW state');
assert.ok(ack.history.some(x=>x.fromBuild==='MSA-ONE-46'&&x.toBuild==='MSA-ONE-47'),'46→47 upgrade must remain in update history');

console.log('Build 46 to 47 Library migration contract passed');
