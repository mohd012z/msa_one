import assert from 'node:assert/strict';

await import('../www/mobile-quality.js?salvage-quality');
const Q=globalThis.MSAMobileQuality;

assert.ok(Q,'MSAMobileQuality must register');
assert.equal(Q.safeImport({name:'report.docx',size:1024}).status,'APPROVED');
assert.equal(Q.safeImport({name:'report.xlsx',size:1024}).status,'APPROVED');
assert.equal(Q.safeImport({name:'manual.pdf',size:1024}).status,'APPROVED');
assert.equal(Q.safeImport({name:'archive.exe',size:1024}).status,'BLOCKED');
assert.equal(Q.safeImport({name:'big.pdf',size:Q.MAX_IMPORT_SIZE+1}).reason,'size');
assert.equal(typeof Q.accessibilityCheck,'function');
assert.equal(typeof Q.viewportCheck,'function');
assert.equal(typeof Q.storageCheck,'function');
assert.equal(typeof Q.securityCheck,'function');
assert.equal(typeof Q.diagnostics,'function');
assert.equal(typeof Q.summary,'function');

console.log('mobile quality salvage contract passed');
