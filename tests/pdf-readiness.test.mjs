import assert from 'node:assert/strict';

const data=new Map();
globalThis.localStorage={
  getItem:key=>data.has(key)?data.get(key):null,
  setItem:(key,value)=>data.set(key,String(value)),
  removeItem:key=>data.delete(key)
};
globalThis.MSAStorage={mirror:()=>true};

await import('../www/pdf-readiness.js?salvage-pdf');
const P=globalThis.MSAPDFReadiness;

assert.ok(P,'MSAPDFReadiness must register');
assert.equal(P.detect({hasText:true,textCoverage:.95}),P.TEXT_READY);
assert.equal(P.detect({hasText:false}),P.SCANNED);
assert.equal(P.detect({hasText:true,textCoverage:.3}),P.PARTIAL);
assert.equal(P.detect({}),P.UNKNOWN);

P.openProject({id:'pdf-a',title:'A',pageCount:3});
P.setPageReadiness(1,{hasText:true,textCoverage:.95});
P.setPageReadiness(2,{scanned:true});
assert.equal(P.documentStatus(),'PARTIAL');
assert.equal(P.needsOCR(),true);
assert.equal(P.summary().counts.UNKNOWN,1);
assert.equal(P.capabilities().builtInOCR,false);
assert.equal(P.capabilities().searchableTextExtraction,false);

P.openProject({id:'pdf-b',title:'B',pageCount:1});
P.setPageReadiness(1,{hasText:true,textCoverage:1});
assert.equal(P.documentStatus(),'TEXT_READY');
assert.equal(P.needsOCR(),false);

P.openProject({id:'pdf-a'});
assert.equal(P.pageStatus(2),'SCANNED','readiness must persist separately per PDF project');
assert.equal(P.summary().counts.UNKNOWN,1);
assert.equal(P.list().length,2);

console.log('PDF readiness salvage contract passed');
