import assert from 'node:assert/strict';

const data=new Map();
globalThis.localStorage={
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,String(value)),
  removeItem:key=>data.delete(key),
  clear:()=>data.clear(),
  key:index=>[...data.keys()][index]??null,
  get length(){return data.size}
};

await import('../www/core-library.js?project-recovery-test');
const P=globalThis.MSAProjects;

const current='msaOneProjectsV1';
const backup='msaOneProjectsBackupV1';
const lastGood='msaOneProjectsLastGoodV1';

data.set(current,'{broken json');
data.set(lastGood,JSON.stringify([{id:'p1',type:'document',title:'Recovered'}]));
P.invalidate();
assert.equal(P.all()[0].title,'Recovered','corrupt current project payload must recover from last-known-good data');
assert.equal(P.validateRaw(data.get(current)),true,'recovery must repair the current project payload');

data.set(current,JSON.stringify([{id:'p1',type:'document',title:'Before'}]));
P.invalidate();
assert.equal(P.all()[0].title,'Before');
P.write([{id:'p2',type:'spreadsheet',title:'After'}]);
assert.equal(JSON.parse(data.get(backup))[0].title,'Before','previous valid project list must rotate into backup before replacement');
assert.equal(JSON.parse(data.get(lastGood))[0].title,'After','new valid project list must become last-known-good');
assert.equal(JSON.parse(data.get(current))[0].title,'After','current project list must contain the new valid data');

assert.equal(P.validateRaw(JSON.stringify([{id:'x',type:'document'}])),true);
assert.equal(P.validateRaw(JSON.stringify([{id:'',type:'document'}])),false);
assert.equal(P.validateRaw(JSON.stringify([{id:'x',type:''}])),false);
assert.equal(P.validateRaw(JSON.stringify([{id:'x',type:'document'},{id:'x',type:'pdf'}])),false);

console.log('project recovery and last-known-good contract passed');
