import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source=fs.readFileSync(new URL('../www/import-engine.js',import.meta.url),'utf8');
test('Office import rejects duplicate normalized ZIP entry names',()=>{
  assert.match(source,/Object\.prototype\.hasOwnProperty\.call\(files,canonical\)/);
  assert.match(source,/Unsafe or duplicate Office ZIP entry/);
});
test('Office import rejects parent traversal ZIP paths',()=>{
  assert.match(source,/name\.split\('\/'\)\.includes\('\.\.'\)/);
});
test('Office import enforces declared uncompressed entry size',()=>{
  assert.match(source,/out\.length!==rawSize/);
});
