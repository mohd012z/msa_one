import fs from 'node:fs';
import assert from 'node:assert/strict';

const css=fs.readFileSync('www/office-mobile.css','utf8');
const js=fs.readFileSync('www/office-mobile.js','utf8');
assert.ok(css.includes('var(--msa-touch-min,48px)')||css.includes('min-height:48px'),'Office controls must use the 48px Build 55 touch contract');
for(const label of ['Undo','Redo','More options']) assert.ok(js.includes('aria-label="'+label+'"'),`Office icon control must have accessible label ${label}`);
assert.ok(js.includes('function close()'),'Office module must expose a predictable close path');
assert.ok(js.includes('globalThis.MSAAppShell?.sync')||js.includes('MSAAppShell?.open'),'Office close must return through/synchronize with the central shell');
assert.ok(js.includes('bindSheetDrag'),'More Options drag-down behavior must remain');
assert.ok(js.includes('pinchStart')&&js.includes('setZoom'),'pinch zoom behavior must remain');
assert.ok(js.includes("if(a==='pdfedit')"),'native/viewer PDF edit boundary must remain explicit');
assert.ok(js.includes('MSAOfficeMobile={')&&js.includes('action'),'Office module must expose action routing for registry truth checks');
assert.match(css,/@media\(max-width:620px\)[\s\S]*office-ribbon/,'narrow-screen ribbon density rule must exist');
console.log('Build 55 Office mobile contract passed');
