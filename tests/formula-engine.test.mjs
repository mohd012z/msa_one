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

// New Excel-style functions
assert.equal(F.evaluate('=COUNT(B2:B4)',rows),3,'COUNT must count numeric cells');
assert.equal(F.evaluate('=COUNTA(A1:A4)',rows),4,'COUNTA must count non-empty cells regardless of type');
assert.equal(F.evaluate('=MEDIAN(C2:C4)',rows),7,'MEDIAN of [10,5,7] must be 7');
assert.equal(F.evaluate('=PRODUCT(B2:B4)',rows),24,'PRODUCT must multiply range values (2*3*4)');
assert.equal(F.evaluate('=ROUND(3.14159,2)',rows),3.14,'ROUND must round to N decimal places');
assert.equal(F.evaluate('=ABS(-8)',rows),8,'ABS must return absolute value');
assert.equal(F.evaluate('=SQRT(9)',rows),3,'SQRT must return square root');
assert.equal(F.evaluate('=POWER(2,5)',rows),32,'POWER must raise to exponent');
assert.equal(F.evaluate('=MOD(10,3)',rows),1,'MOD must return remainder');
assert.equal(F.evaluate('=TRUNC(9.87)',rows),9,'TRUNC must truncate toward zero');
assert.equal(F.evaluate('=ROUND(SUM(B2:B4)/2,1)',rows),4.5,'nested range + math functions must compose');
assert.ok(Number.isNaN(F.evaluate('=SQRT(-4)',rows)),'SQRT of a negative number must be NaN, not a crash');

console.log('formula engine calculations passed');
