import fs from 'node:fs';
import assert from 'node:assert/strict';

// Device-reported regressions (tested on a real phone) that the earlier source
// contracts did not cover:
//   1. Native PDF viewer: no scroll / page not full / no pinch zoom — root cause
//      was ImageView adjustViewBounds auto-shrinking the bitmap back to the
//      parent width, defeating both horizontal scroll and pinch.
//   2. Excel "not full view" — .sheet-wrap used a static calc(100dvh -
//      --office-chrome) height that under/over-filled the real space, clipping
//      the grid.
//   3. AI assistant "won't answer" — a typed question with no attached file
//      fell through to opening a blank editor instead of answering offline.

const viewer=fs.readFileSync('native-prep/android/MSAPdfViewerActivity.java','utf8');
const officeCss=fs.readFileSync('www/office-mobile.css','utf8');
const actions=fs.readFileSync('www/app-actions.js','utf8');

// 1. Native PDF viewer — the bitmap must be shown at its real size (scrollable +
//    pinchable), not auto-shrunk to the viewport.
assert.ok(!/image\.setAdjustViewBounds\(true\)/.test(viewer),'native PDF must NOT use adjustViewBounds=true — it auto-scales the page down to the parent width, which is why the page could not be shown full and pinch/zoom had no effect');
assert.ok(viewer.includes('setScaleType(ImageView.ScaleType.FIT_XY)'),'the page bitmap must be shown 1:1 in its box (FIT_XY) so the view, not the bitmap, carries the zoom');
assert.ok(/image\.setLayoutParams\(lp\)/.test(viewer),'renderPage must size the ImageView to the actual bitmap so zoom grows the real view and the scroll views can reach the whole page');
assert.ok(viewer.includes('MAX_BITMAP_DIMENSION'),'bitmap dimensions stay capped to avoid an oversized-bitmap crash at high zoom');
// pinch (from PR #16) must still be present and wired to the page scroll view.
assert.ok(viewer.includes('import android.view.ScaleGestureDetector;'),'pinch-to-zoom must remain');
assert.ok(viewer.includes('setOnTouchListener((v, event) -> pinch.onTouchEvent(event))'),'pinch must be wired to the ScrollView with the correct (View, MotionEvent) signature');

// 2. Excel full view — the content area must be a flex fill of the real
//    available space, not a static chrome-estimate height that clips the grid.
assert.ok(/\.studio-overlay\.office-fullpage \.studio-body\{display:flex/.test(officeCss),'office full-page body must be a flex column so the work area uses the real available height');
assert.ok(/\.studio-overlay\.office-fullpage \.studio-body \[data-work\]\{flex:1;min-height:0/.test(officeCss),'the spreadsheet work area must flex:1 + min-height:0 to claim exactly the available height (immune to the --office-chrome estimate)');
assert.ok(/\.office-fullpage \.sheet-wrap\{flex:1;min-height:0;height:auto/.test(officeCss),'the sheet grid container must flex-fill + height:auto so it scrolls its own overflow instead of being clipped by a fixed height');

// 3. AI assistant answers a plain (no-attachment) question offline instead of
//    silently opening a blank editor.
assert.ok(actions.includes('function askSavedDocuments'),'routeTask must answer no-attachment questions against the user\'s saved documents');
assert.ok(actions.includes('askSavedDocuments(q)'),'routeTask must CALL askSavedDocuments before falling back to opening a document workspace');
assert.ok(actions.includes('window.MSAAIEngine.ask(q,src.text)'),'the offline answer must run through the real AI engine Q&A against saved project text');
assert.ok(actions.includes('looksLikeQuestion'),'it must only answer things that look like a question, so "create an excel" still opens the editor');

console.log('device-reported regressions (native PDF scroll/pinch, Excel full view, AI answers) contract passed');
