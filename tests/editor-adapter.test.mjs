import fs from 'node:fs';import assert from 'node:assert/strict';

await import('../www/editor-adapter.js?editor-adapter-test');
const A=globalThis.MSAEditorAdapter;
const studio=fs.readFileSync('www/create-studio.js','utf8');
const adapter=fs.readFileSync('www/editor-adapter.js','utf8');

assert.ok(A,'MSAEditorAdapter must register');
assert.equal(A.status().mode,'legacy-execCommand-adapter');
assert.equal(A.status().isolated,true);
assert.equal(A.status().available,false,'Node test environment should not expose browser execCommand');
assert.equal(A.command('bold'),false);
assert.ok(adapter.includes('document.execCommand'),'legacy formatting may exist only inside the adapter');
assert.ok(!studio.includes('document.execCommand'),'Create Studio must not call deprecated execCommand directly');
for(const api of ['MSAEditorAdapter','formatBlock','insertHTML','command'])assert.ok(studio.includes(api),'Create Studio must use editor adapter '+api);

console.log('document editor adapter isolation contract passed');
