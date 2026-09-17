import fs from 'node:fs';import assert from 'node:assert/strict';
const js=fs.readFileSync('www/settings-v2.js','utf8');
for(const token of ['screen.width','visualViewport','devicePixelRatio','--msa-screen-width','data-display-info','resize','orientationchange']) assert.ok(js.includes(token),'missing runtime display fit token: '+token);
console.log('runtime display fit contract passed');