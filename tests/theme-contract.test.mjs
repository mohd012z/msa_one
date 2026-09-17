import fs from 'node:fs';
import assert from 'node:assert/strict';
const css=fs.readFileSync('www/theme-v2.css','utf8');
const js=fs.readFileSync('www/settings-v2.js','utf8');
assert.ok(/\.page\{background:[^}]*linear-gradient\(/.test(css),'page canvas must include a dark linear gradient');
for(const k of ['soft','round','pill','compact','ios']) assert.ok(js.includes(k),'missing shape '+k);
assert.ok(js.includes('localStorage.setItem'),'settings must persist');
console.log('theme contract passed');