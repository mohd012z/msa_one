import fs from 'node:fs';
import assert from 'node:assert/strict';

assert.ok(fs.existsSync('www/ui-system.css'),'Build 55 must provide ui-system.css');
assert.ok(fs.existsSync('www/icon-system.js'),'Build 55 must provide icon-system.js');

const css=fs.existsSync('www/ui-system.css')?fs.readFileSync('www/ui-system.css','utf8'):'';
assert.match(css,/--msa-touch-min\s*:\s*48px/,'touch token must be 48px');
assert.match(css,/--msa-focus/,'focus token must exist');
assert.match(css,/--msa-ai/,'AI semantic token must exist');
assert.match(css,/--msa-warning/,'warning semantic token must exist');
assert.match(css,/--msa-danger/,'danger semantic token must exist');

if(fs.existsSync('www/icon-system.js')){
  await import('../www/icon-system.js?build55-red');
  assert.ok(globalThis.MSAIcons,'MSAIcons must register globally');
  assert.equal(typeof globalThis.MSAIcons.svg,'function');
  const icon=globalThis.MSAIcons.svg('home',{label:'Home'});
  assert.match(icon,/aria-label="Home"/);
  assert.match(icon,/<svg/);
}

await import('../www/mobile-quality.js?build55-red');
assert.equal(globalThis.MSAMobileQuality?.MIN_TOUCH_TARGET,48,'mobile quality minimum must be 48');

console.log('Build 55 UI system contract passed');
