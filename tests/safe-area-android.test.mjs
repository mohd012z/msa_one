import fs from 'node:fs';
import assert from 'node:assert/strict';

// Android WebView (unlike iOS Safari/PWA) does not reliably populate
// env(safe-area-inset-top) — that's exactly why status/notification bars kept
// overlapping page headers, the Calendar header, and in-app notices across
// several rounds of screenshots. The app already builds a native Android
// bridge that injects the real inset into --native-safe-top/--native-safe-bottom
// (see scripts/apply-android-security.mjs), but most page chrome was reading
// the bare, Android-unreliable env() value directly instead of falling back
// to it. This test locks in that every top-inset read across the app's CSS
// goes through the native-fallback-aware variable.

const html=fs.readFileSync('www/index.html','utf8');
const root=html.match(/:root\{[^}]*\}/)?.[0]||'';
assert.ok(root.includes('--native-safe-top'),'app root must default --native-safe-top so pages render correctly before the native bridge (if any) has injected the real value');
assert.ok(root.includes('--native-safe-bottom'),'app root must default --native-safe-bottom for the same reason');
assert.ok(/--safe-top:max\(env\(safe-area-inset-top,0px\),var\(--native-safe-top,0px\)\)/.test(root),'the app must define a single --safe-top that falls back to the native Android inset');
assert.ok(html.includes('.head{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:max(12px,var(--safe-top))'),'every page header (.head) — Home/Files/Create/AI/Me/Planner — must clear the status bar using the native-fallback-aware --safe-top, not bare env()');

const cssFiles=['ai-reader.css','create-studio.css','planner.css','premium.css','workspace-v2.css','office-mobile.css'];
for(const file of cssFiles){
  const css=fs.readFileSync('www/'+file,'utf8');
  assert.ok(!css.includes('env(safe-area-inset-top)'),file+' must not read the bare (Android-unreliable) safe-area-inset-top — use var(--safe-top,0px) so it falls back to the native bridge value');
}

console.log('Android status-bar overlap (native safe-area fallback) contract passed');
