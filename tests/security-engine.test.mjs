import assert from 'node:assert/strict';

await import('../www/security-engine.js');
const S=globalThis.MSASecurity;
assert.ok(S,'MSASecurity must register');

assert.equal(S.isHTTPS('https://example.com/path'),true);
assert.equal(S.isHTTPS('http://example.com/path'),false);
assert.equal(S.isHTTPS('javascript:alert(1)'),false);
assert.equal(S.isHTTPS('https://user:pass@example.com'),false);
assert.equal(S.isHTTPS('https://play.google.com/store/apps/details?id=x',['play.google.com']),true);
assert.equal(S.isHTTPS('https://evil.example/store',['play.google.com']),false);

const dirty='<h1 onclick="evil()">Title</h1><script>alert(1)</script><img src="javascript:alert(2)" onerror=evil()><a href="javascript:evil()">bad</a>';
const clean=S.sanitizeRichHTML(dirty);
assert.ok(!/script/i.test(clean),'script content must be removed');
assert.ok(!/onclick|onerror/i.test(clean),'event handlers must be removed');
assert.ok(!/javascript:/i.test(clean),'javascript URLs must be removed');

const preview=S.previewHTML('<h1>Hello</h1><script>alert(1)</script>');
assert.ok(preview.includes("default-src 'none'"));
assert.ok(preview.includes("script-src 'none'"));
assert.ok(preview.includes("connect-src 'none'"));

const project={id:'p1',type:'document',title:'Test',content:'<p onclick="x()">Safe</p><script>x()</script>',updated:1};
const backup={
  schema:1,app:'MSA One',values:{
    msaOneProjectsV1:JSON.stringify([project]),
    msaUserLibraryV1:JSON.stringify({schema:1,favorites:[],recent:[],templates:[{id:'u1',type:'document',name:'T',content:'<img src=x onerror=evil()>'}]})
  }
};
const restored=S.parseBackupText(JSON.stringify(backup),['msaOneProjectsV1','msaUserLibraryV1']);
const projects=JSON.parse(restored.values.msaOneProjectsV1);
assert.ok(!/onclick|script/i.test(projects[0].content),'restored document must be sanitized');
const lib=JSON.parse(restored.values.msaUserLibraryV1);
assert.ok(!/onerror/i.test(lib.templates[0].content),'restored personal template must be sanitized');

assert.throws(()=>S.parseBackupText('{"app":"Other","values":{"x":"1"}}',['x']));
assert.throws(()=>S.sanitizeProject({type:'unknown',content:''}));

console.log('central content/backup security contract passed');
