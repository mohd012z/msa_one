import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../www/document-search.js',import.meta.url),'utf8');
const values=new Map();
const requests=[];
const records=new Map();
const db={
  objectStoreNames:{contains:()=>true},
  createObjectStore:()=>{},
  transaction(){
    const tx={oncomplete:null,onerror:null,onabort:null,objectStore(){
      return {
        getAll(){const request={onsuccess:null,onerror:null,result:[...records.values()]};queueMicrotask(()=>request.onsuccess?.());return request},
        put(value){records.set(value.id,value);queueMicrotask(()=>tx.oncomplete?.())},
        delete(id){records.delete(id);queueMicrotask(()=>tx.oncomplete?.())}
      }
    }};
    return tx;
  }
};
const indexedDB={open(){const request={result:db,onsuccess:null,onerror:null,onupgradeneeded:null};requests.push(request);queueMicrotask(()=>request.onsuccess?.());return request}};
function make(){
  const ctx=vm.createContext({Date,Set,Number,String,JSON,indexedDB,localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}});
  ctx.globalThis=ctx;vm.runInContext(source,ctx);return ctx.MSADocumentSearch;
}
test('migrates legacy localStorage documents into IndexedDB once',async()=>{
  records.clear();values.clear();
  const search=make();
  search.put({id:'legacy',name:'Old',segments:[{kind:'sheet',index:3,text:'Maintenance pressure'}]});
  const first=await search.migrate();
  assert.equal(first.migrated,1);
  assert.equal((await search.migrate()).migrated,0);
  const matches=await search.searchPersistent('pressure');
  assert.equal(matches[0].index,3);
  assert.equal(matches[0].kind,'sheet');
});
test('persistent replacement and deletion do not resurrect old records',async()=>{
  records.clear();values.clear();
  const search=make();
  await search.putPersistent({id:'a',name:'A',segments:[{kind:'slide',index:2,text:'old text'}]});
  await search.putPersistent({id:'a',name:'A',segments:[{kind:'slide',index:4,text:'new text'}]});
  assert.equal((await search.searchPersistent('old')).length,0);
  assert.equal((await search.searchPersistent('new'))[0].index,4);
  await search.removePersistent('a');
  assert.equal((await search.searchPersistent('new')).length,0);
});
