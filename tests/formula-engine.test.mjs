import assert from 'node:assert/strict';
await import('../www/formula-engine.js');

const F=globalThis.MSAFormula;
assert.ok(F,'formula engine must attach to globalThis');

const rows=[
  ['Item','Qty','Price','Total'],
  ['A','2','10','=B2*C2'],
  ['B','3','5','=B3*C3'],
  ['C','4','7','=SUM(B2:B4)']
];

assert.equal(F.colName(0),'A');
assert.equal(F.colName(26),'AA');
assert.deepEqual(F.parseRef('C7'),{r:6,c:2});
assert.equal(F.evaluate('=B2*C2',rows),20);
assert.equal(F.evaluate('=SUM(B2:B4)',rows),9);
assert.equal(F.evaluate('=AVERAGE(C2:C4)',rows),22/3);
assert.equal(F.evaluate('=MIN(C2:C4)',rows),5);
assert.equal(F.evaluate('=MAX(C2:C4)',rows),10);
assert.equal(F.evaluate('=D2+D3',rows),35);
assert.ok(Number.isNaN(F.evaluate('=alert(1)',rows)));

console.log('formula engine calculations passed');
