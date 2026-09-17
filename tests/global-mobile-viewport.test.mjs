import fs from 'node:fs';import assert from 'node:assert/strict';
const css=fs.readFileSync('www/theme-v2.css','utf8');
for(const rule of ['overflow-x:hidden!important','grid-template-columns:repeat(2,minmax(0,1fr))!important','max-width:var(--msa-screen-width,100vw)!important','.grid>*{min-width:0!important','.grow{min-width:0!important','body.msa-portrait .grid{grid-template-columns:minmax(0,1fr)!important'])assert.ok(css.includes(rule),'missing global mobile viewport rule: '+rule);
console.log('global mobile viewport contract passed');