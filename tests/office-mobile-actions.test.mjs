import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/office-mobile.js','utf8');
const css=fs.readFileSync('www/office-mobile.css','utf8');
const studio=fs.readFileSync('www/create-studio.js','utf8');
const helperCss=fs.readFileSync('www/helper.css','utf8');

// Every ribbon tool id used in configs must have a real handler in action() — no dead 'noop' buttons.
const toolIds=[...js.matchAll(/\['[^']*','[^']*','([a-z]+)'\]/g)].map(m=>m[1]);
assert.ok(toolIds.length>10,'expected many ribbon tools to be declared');
assert.ok(!toolIds.includes('noop'),'no ribbon tool should be wired to a no-op placeholder action');
const richTextIds=['bold','italic','underline','insertUnorderedList','justifyLeft'];
for(const id of new Set(toolIds)){
  const handled=js.includes("a==='"+id+"'")||(richTextIds.includes(id)&&js.includes("'"+id+"'"));
  assert.ok(handled,'ribbon action "'+id+'" is declared in a tool config but has no handler in action()');
}

// The dead Borders/Merge/Bold(presentation)/Draw buttons must actually be gone, not just relabeled.
assert.ok(!js.includes("'Borders','noop'")&&!js.includes("'Merge','noop'"),'non-functional spreadsheet Borders/Merge buttons must be removed');
assert.ok(!/presentation:\{[^}]*'Bold','noop'/.test(js),'non-functional presentation Bold button must be removed');

// Present mode must be real: reads the actual slide deck and renders real slide content.
assert.ok(js.includes('presentSlides')&&js.includes('MSAStudio?.currentSlides'),'Present must use the real slide deck, not a placeholder');
assert.ok(studio.includes('currentSlides'),'MSAStudio must expose currentSlides for the presenter to consume');
assert.ok(css.includes('.office-present-overlay'),'presenter overlay must be styled');

// The floating zoom +/-/reset button HUD must be gone; pinch-to-zoom is the only zoom control now.
assert.ok(!js.includes('office-zoom-hud')&&!js.includes('data-zout')&&!js.includes('data-zin')&&!js.includes('data-zreset'),'zoom button HUD must be fully removed from office-mobile.js');
assert.ok(!css.includes('.office-zoom-hud'),'zoom button HUD must be fully removed from office-mobile.css');
assert.ok(js.includes('pinchStart')&&js.includes('pinchMove'),'pinch-to-zoom must remain the way to zoom');

// In-app notifications must appear at the bottom (above the nav bar), not the top of the screen.
assert.ok(!/\.helper-notice\{[^}]*\btop:/.test(helperCss),'helper-notice must not be pinned to the top of the screen');
assert.ok(/\.helper-notice\{[^}]*bottom:/.test(helperCss),'helper-notice must be anchored to the bottom like the rest of the app\'s toasts');

console.log('office ribbon real-action + present mode + zoom/notification placement contract passed');
