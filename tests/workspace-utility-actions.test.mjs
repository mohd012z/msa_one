import fs from 'node:fs';import assert from 'node:assert/strict';const h=fs.readFileSync('www/index.html','utf8'),c=fs.readFileSync('www/ui-action-controller-v2.js','utf8');
for(const a of ['find','replace','zoom-in','zoom-out','fullscreen','help','settings'])assert.ok(h.includes('data-msa-action="'+a+'"')||c.includes("'"+a+"'"),'workspace utility missing '+a);
for(const x of ['window.find','requestFullscreen','exitFullscreen','zoom','replace'])assert.ok(c.includes(x),'workspace utility integration missing '+x);
assert.ok(c.includes('showModal'),'utility actions need visible UI');assert.ok(h.includes('aria-label="Workspace utilities"'),'utility bar accessibility missing');
console.log('Workspace utility actions contract passed');