import assert from 'node:assert/strict';

await import('../www/editor-history.js?editor-history-test');
const H=globalThis.MSAEditorHistory;

assert.ok(H,'MSAEditorHistory must register');
H.begin('doc',{value:'A'});
assert.equal(H.status('doc').canUndo,false);
H.record('doc',{value:'B'});
H.record('doc',{value:'C'});
assert.equal(H.status('doc').undoDepth,2);
assert.deepEqual(H.undo('doc'),{value:'B'});
assert.deepEqual(H.undo('doc'),{value:'A'});
assert.deepEqual(H.redo('doc'),{value:'B'});

H.begin('pending-current',{value:'old'});
assert.deepEqual(H.undo('pending-current',{value:'new'}),{value:'old'},'undo must capture uncommitted current state first');
assert.deepEqual(H.redo('pending-current',{value:'old'}),{value:'new'});

H.begin('scheduled',{value:1});
H.schedule('scheduled',()=>({value:2}),5000);
assert.equal(H.status('scheduled').pending,true);
assert.equal(H.status('scheduled').canUndo,true);
H.cancel('scheduled');
assert.equal(H.status('scheduled').pending,false);

H.begin('move',{value:'x'});
H.record('move',{value:'y'});
H.move('move','project:1');
assert.equal(H.status('move').undoDepth,0);
assert.equal(H.status('project:1').undoDepth,1);

H.begin('bounded',{n:0});
for(let i=1;i<60;i++)H.record('bounded',{n:i});
assert.ok(H.status('bounded').undoDepth<=H.MAX,'history depth must remain bounded');

console.log('coalesced editor undo redo history contract passed');
