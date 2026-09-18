import fs from 'node:fs';
import assert from 'node:assert/strict';

const ws=fs.readFileSync('www/workspace-v2.css','utf8');
const officeCss=fs.readFileSync('www/office-mobile.css','utf8');
const officeJs=fs.readFileSync('www/office-mobile.js','utf8');
const files=fs.readFileSync('www/files-v2.js','utf8');
const android=fs.readFileSync('scripts/apply-android-security.mjs','utf8');

assert.ok(ws.includes('--native-safe-top'),'Workspace must consume native Android top inset');
assert.ok(ws.includes('--native-safe-bottom'),'Workspace must consume native Android bottom inset');
assert.ok(ws.includes('.ws-list .ws-source'),'Storage rows must reset default WebView button styling');
assert.ok(ws.includes('appearance:none'),'Storage rows must not inherit native/browser button appearance');
assert.ok(files.includes('FOLDER ACCESS'),'Storage must separate device and folder access groups');
assert.ok(files.includes('DEVICE'),'Storage must separate device and folder access groups');

assert.ok(officeJs.includes('bindSheetDrag'),'More Options must support drag gesture');
assert.ok(officeJs.includes('hideMore'),'More Options must have animated dismiss path');
assert.ok(officeCss.includes('.office-more-sheet.dragging'),'More Options drag state must be styled');
assert.ok(officeCss.includes('.office-more-sheet.dismissing'),'More Options dismiss animation must be styled');
assert.ok(officeCss.includes('max-height:70dvh'),'More Options must leave more document visible');

assert.ok(android.includes('--native-safe-top'),'Android bridge must expose status-bar inset to CSS');
assert.ok(android.includes('--native-safe-bottom'),'Android bridge must expose navigation-bar inset to CSS');
assert.ok(android.includes('getDisplayMetrics().density'),'Android inset must convert physical pixels to CSS pixels');
assert.ok(android.includes('v.setPadding(0, 0, 0, 0)'),'WebView must avoid double-applying native padding');

console.log('Build 54 Safe UI regression contract passed');
