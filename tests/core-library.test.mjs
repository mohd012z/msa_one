import assert from 'node:assert/strict';
await import('../www/core-library.js');

const C=globalThis.MSACore;
const M=globalThis.MSAMedia;
const Projects=globalThis.MSAProjects;

assert.ok(C,'MSACore must be registered');
assert.ok(M,'MSAMedia must be registered');
assert.ok(Projects,'MSAProjects cache must be registered');
for(const api of ['all','write','get','upsert','remove','invalidate','recover','flush','validateRaw','normalizeList']) assert.equal(typeof Projects[api],'function','missing project cache API '+api);
assert.equal(C.escapeHTML('<b>&'), '&lt;b&gt;&amp;');
assert.equal(C.safeName(' Monthly Report 2026 '),'Monthly-Report-2026');
assert.deepEqual(C.parseJSON('{"a":1}',{}),{a:1});
assert.deepEqual(C.parseJSON('{bad}',{fallback:true}),{fallback:true});
assert.equal(C.clamp(15,0,10),10);
assert.equal(C.clamp(-1,0,10),0);
assert.ok(C.uid('x').startsWith('x_'));
assert.equal(typeof C.debounce,'function');
assert.equal(typeof C.on,'function');
assert.equal(typeof C.emit,'function');
assert.equal(typeof C.pickFile,'function');
assert.equal(typeof M.resizeImage,'function');
assert.equal(typeof M.dataUrlAsset,'function');

console.log('core and media SDK contract passed');
