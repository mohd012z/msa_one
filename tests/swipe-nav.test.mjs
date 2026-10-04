import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
const src=fs.readFileSync('www/swipe-nav.js','utf8');
const shell=fs.readFileSync('www/app-shell.js','utf8');
assert.ok(html.includes('swipe-nav.js'),'index must load swipe-nav.js');
for(const capability of ['touchstart','touchmove','touchend','touchcancel','MSASwipeNav','MSAAppShell?.open']) assert.ok(src.includes(capability),'missing swipe navigation capability '+capability);
assert.ok(src.includes('primaryDestinations'),'swipe navigation must derive current destinations from AppShell');
assert.ok(shell.includes('function primaryDestinations()'),'AppShell must expose dynamic primary destinations');
assert.ok(!src.includes('.nav,')&&!src.includes(',.nav'),'swipe navigation must not depend on hidden legacy navigation');
for(const guard of ['studio-overlay','contenteditable','textarea','input','iframe','.ws-bottom','.msa-action-hub']) assert.ok(src.includes(guard),'swipe navigation must guard against interfering with '+guard);
for(const overlay of ['.office-more-sheet','.office-tab-menu','.ai-reader-overlay','.office-present-overlay']) assert.ok(src.includes(overlay),'swipe navigation must not hijack touches inside '+overlay);
console.log('Swipe navigation follows Build 55 shell contract');
