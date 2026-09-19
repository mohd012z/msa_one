import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
const src=fs.readFileSync('www/swipe-nav.js','utf8');

assert.ok(html.includes('swipe-nav.js'),'index must load swipe-nav.js');
assert.ok(html.indexOf('swipe-nav.js')<html.indexOf('app-shell.js'),'swipe-nav must load before app-shell so MSAAppShell is available on first gesture');

for(const capability of ['touchstart','touchmove','touchend','touchcancel','MSASwipeNav','MSAAppShell?.open']) {
  assert.ok(src.includes(capability),'missing swipe navigation capability '+capability);
}

// swipe order must match the real bottom navigation wired by app-shell.js (home/files/create/tools/ai)
const shell=fs.readFileSync('www/app-shell.js','utf8');
const orderMatch=src.match(/ORDER=\[([^\]]+)\]/);
assert.ok(orderMatch,'swipe-nav must define a page ORDER');
const order=orderMatch[1].split(',').map(s=>s.trim().replace(/'/g,''));
for(const id of order){
  if(id==='home'||id==='files'||id==='create'||id==='ai')assert.ok(shell.includes("'"+id+"'"),'swipe order page missing from app shell: '+id);
}
assert.ok(order.includes('tools'),'swipe order must include the Tools page that replaced the old Me tab in the bottom nav');

// must not hijack typing/editing or the open document editor
for(const guard of ['studio-overlay','contenteditable','textarea','input','iframe']) {
  assert.ok(src.includes(guard),'swipe navigation must guard against interfering with '+guard);
}

// office-more-sheet and friends are appended to document.body as siblings of .studio-overlay,
// not children of it, so the .studio-overlay guard alone misses them — this global page-swipe
// handler was fighting their own drag-to-dismiss gestures (reported as "panel won't swipe").
for(const overlay of ['.office-more-sheet','.office-tab-menu','.ai-reader-overlay','.office-present-overlay']) {
  assert.ok(src.includes(overlay),'swipe navigation must not hijack touches inside '+overlay);
}

console.log('Swipe up/down page navigation contract passed');
