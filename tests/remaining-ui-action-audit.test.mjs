import fs from 'node:fs';import assert from 'node:assert/strict';const s=fs.readFileSync('www/index.html','utf8'),c=fs.readFileSync('www/ui-action-controller-v2.js','utf8');
for(const a of ['profile','premium','continue-report','continue-presentation','back-home','back-me'])assert.ok(s.includes('data-msa-action="'+a+'"'),'remaining UI missing action '+a);
for(const x of ['Profile & Identity','Premium UI Studio','Monthly Report','Presentation Draft']){let i=s.indexOf(x);assert.ok(i>=0,'missing UI '+x);let r=s.lastIndexOf('<div class="row"',i),e=s.indexOf('</div></div>',i);assert.ok(s.slice(r,e+12).includes('data-msa-action'),'decorative row '+x)}
assert.ok(!/class="back" onclick=/g.test(s),'inline back button remains');
for(const a of ['profile','premium','continue-report','continue-presentation','back-home','back-me'])assert.ok(c.includes(a),'controller missing action '+a);
console.log('Remaining navigation/action audit contract passed');