import assert from 'node:assert/strict';

// Reproduces: "Import failed: Failed to execute 'setItem' on 'Storage': Setting the
// value of 'msaOneProjectsBackupV1' exceeded the quota." A previous version of
// projectWrite() wrote the (purely advisory) backup copy BEFORE the real save, so a
// quota error on that backup write aborted the entire save — silently dropping the
// document the user had just imported.

const data=new Map();
const QUOTA_LIMIT=200000; // bytes, simulates a near-full localStorage quota
function quotaError(){const e=new Error('Setting the value exceeded the quota.');e.name='QuotaExceededError';return e}
globalThis.localStorage={
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>{
    value=String(value);
    let used=0;for(const [k,v] of data)if(k!==key)used+=v.length;
    if(used+value.length>QUOTA_LIMIT)throw quotaError();
    data.set(key,value);
  },
  removeItem:key=>data.delete(key),
  clear:()=>data.clear(),
  key:index=>[...data.keys()][index]??null,
  get length(){return data.size}
};

await import('../www/core-library.js?project-quota-recovery-test');
const P=globalThis.MSAProjects;

const current='msaOneProjectsV1';
const backup='msaOneProjectsBackupV1';

// Fill the backup key with a large previous project list so rotating it again would
// exceed the simulated quota, while the new (smaller) save on its own still fits.
const bigPrevious=[{id:'old',type:'document',title:'Old',content:'x'.repeat(150000)}];
data.set(current,JSON.stringify(bigPrevious));
data.set(backup,JSON.stringify(bigPrevious));
P.invalidate();

const imported=[{id:'p-imported-pdf',type:'pdf',title:'Imported.pdf',content:'blob:imported'}];
const result=P.write(imported);

assert.equal(result[0].id,'p-imported-pdf','write() must return the newly imported project even when the backup rotation cannot fit');
assert.equal(JSON.parse(data.get(current))[0].id,'p-imported-pdf','the imported document must actually be persisted, not silently dropped');
assert.equal(P.all()[0].id,'p-imported-pdf','subsequent reads must see the imported document');

console.log('Project save survives backup-copy quota exhaustion (import-still-fails regression) passed');
