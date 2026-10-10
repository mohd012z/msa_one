import assert from 'node:assert/strict';

await import('../www/search-center.js?build55-search');
const S=globalThis.MSASearchCenter;
assert.ok(S,'Search Center must register globally');
assert.equal(typeof S.registerProvider,'function');
assert.equal(typeof S.search,'function');
assert.deepEqual(S.filters,['all','files','tools','templates','ai','calendar','actions']);
for(const id of ['files','tools','templates','ai','calendar','actions']) assert.ok(S.providers().includes(id),`built-in provider ${id} must exist`);
const actionTitles=S.search('',{kind:'actions'}).map(x=>x.title);
for(const title of ['New Document','Scan','Import','Backup','Settings','Open My Day']) assert.ok(actionTitles.includes(title),`action command ${title} must exist`);

S.registerProvider({id:'broken-test',label:'Broken',search(){throw new Error('boom')}});
S.registerProvider({id:'duplicates-test',label:'Duplicates',search(){return [{id:'dup',kind:'tools',title:'One',score:2,action(){ }},{id:'dup',kind:'tools',title:'Two',score:1,action(){ }},null,{id:'bad',kind:'tools'}]}});
const results=S.search('');
assert.equal(results.filter(x=>x.id==='dup').length,1,'duplicate result IDs must deduplicate');
assert.ok(results.every(x=>x&&x.id&&x.title&&typeof x.action==='function'),'malformed provider results must be ignored');
assert.ok(!results.some(x=>x.provider==='broken-test'),'one provider exception must not break other providers');

console.log('Build 55 Search Center contract passed');
