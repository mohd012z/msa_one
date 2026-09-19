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

// Document/PDF editors must fill the full screen width like Word/Excel mobile apps,
// not sit inside a narrow floating "card" with side gutters and a drop shadow.
assert.ok(!css.includes('width:min(92vw,794px)'),'document/PDF editor must not be boxed into a narrow floating card');
assert.ok(/\.office-fullpage \.studio-editor\{[^}]*width:100%/.test(css),'document editor must fill the full page width');
assert.ok(/\.office-fullpage \.studio-pdf-text\{[^}]*width:100%/.test(css),'editable PDF text view must fill the full page width');
assert.ok(/\.office-fullpage \.studio-editor\{[^}]*box-shadow:none/.test(css),'full-page document editor must not look like a floating card');

// The fixed ribbon toolbar must not overlap document content, and must not leave a dead gap
// above it either — studio-body's top padding must reserve exactly the ribbon's real height.
assert.ok(css.includes('--office-ribbon-h'),'ribbon height must be a named constant, not a magic number scattered across rules');
assert.ok(/\.studio-overlay\.office-mobile \.studio-body\{padding:var\(--office-ribbon-h\)/.test(css),'studio-body must reserve exactly the ribbon\'s height so content starts right below it, with no gap or overlap');
assert.ok(!/\.office-fullpage \.studio-body\{[^}]*padding-top:0/.test(css),'full-page mode must not zero out the ribbon-clearance padding again');
assert.ok(css.includes('--office-chrome'),'editor height calculations must derive from the same chrome constants instead of independent magic numbers');

console.log('office ribbon real-action + present mode + zoom/notification placement + full-page editor contract passed');
