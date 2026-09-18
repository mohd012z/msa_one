import fs from 'node:fs';
import assert from 'node:assert/strict';

await import('../www/performance-engine.js');
const P=globalThis.MSAPerformance;
assert.ok(P,'MSAPerformance must be registered');

for(const api of ['load','save','device','profile','apply','scheduleFrame','rafThrottle','idle','cancelIdle','yieldUI','chunk','withBusy','setMode','setFontScale','setIconScale','setLineHeight','toggleReading']){
  assert.equal(typeof P[api],'function','missing performance API '+api);
}

const js=fs.readFileSync('www/performance-engine.js','utf8');
for(const feature of ['requestAnimationFrame','requestIdleCallback','visualViewport','refreshHz','data-perf-mode','data-reading-toggle','reader-bar','fontScale','iconScale','lineHeight','refreshClass']){
  assert.ok(js.includes(feature),'missing performance feature '+feature);
}
assert.equal(P.profile({mode:'battery'}),'low');
assert.equal(P.profile({mode:'smooth'}),'smooth');

const css=fs.readFileSync('www/performance.css','utf8');
for(const feature of ['content-visibility:auto','contain-intrinsic-size','data-perf-profile="low"','.msa-reading','.reader-bar','.perf-busy','--msa-font-scale','--msa-icon-scale','--msa-vh']){
  assert.ok(css.includes(feature),'missing performance CSS '+feature);
}

console.log('adaptive performance and Reading View contract passed');
