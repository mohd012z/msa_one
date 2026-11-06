import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../www/document-search.js',import.meta.url),'utf8');
const values=new Map();
function context(){
  const ctx=vm.createContext({Date,Set,Number,String,JSON,localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}});
  ctx.globalThis=ctx;vm.runInContext(script,ctx);return ctx.MSADocumentSearch;
}
test('persistent search preserves sheet and slide anchors across reload',()=>{
  values.clear();
  const api=context();
  api.put({id:'a',name:'Workbook',segments:[{kind:'sheet',index:2,label:'Maintenance',text:'Hydraulic pressure check'}]});
  api.put({id:'b',name:'Slides',segments:[{kind:'slide',index:4,text:'Hydraulic system overview'}]});
  const matches=context().search('hydraulic');
  assert.equal(matches.length,2);
  assert.equal(matches[0].kind,'slide');
  assert.equal(matches[0].index,4);
  assert.equal(matches[1].kind,'sheet');
  assert.equal(matches[1].index,2);
});
test('replacement and removal do not leave stale indexed text',()=>{
  values.clear();const api=context();
  api.put({id:'x',name:'Doc',segments:[{kind:'page',index:1,text:'old term'}]});
  api.put({id:'x',name:'Doc',segments:[{kind:'page',index:2,text:'new term'}]});
  assert.equal(api.search('old').length,0);
  assert.equal(api.search('new').length,1);
  api.remove('x');assert.equal(api.search('new').length,0);
});
test('invalid anchors and overlarge documents rejected',()=>{
  values.clear();const api=context();
  assert.throws(()=>api.put({id:'x',name:'x',segments:[{kind:'page',index:0,text:'bad'}]}),/INVALID_ANCHOR/);
  assert.throws(()=>api.put({id:'x',name:'x',segments:[{kind:'page',index:1,text:'a'.repeat(160001)}]}),/SEARCH_TEXT_LIMIT/);
});
