import fs from 'node:fs';
import assert from 'node:assert/strict';

const native=fs.readFileSync('native-prep/android/MSAFileBridgePlugin.java','utf8');
const wrapper=fs.readFileSync('www/native-file-bridge.js','utf8');
const android=fs.readFileSync('scripts/apply-android-security.mjs','utf8');
const files=fs.readFileSync('www/files-workspace.js','utf8');
const studio=fs.readFileSync('www/create-studio.js','utf8');
const office=fs.readFileSync('www/office-engine.js','utf8');

for(const x of ['ACTION_OPEN_DOCUMENT_TREE','takePersistableUriPermission','DocumentsContract.buildChildDocumentsUriUsingTree','ACTION_OPEN_DOCUMENT','MediaStore.Downloads','RELATIVE_PATH','MSA One','readUri','saveFile']) {
  assert.ok(native.includes(x),'native bridge missing '+x);
}
assert.ok(wrapper.includes('pickFolder'));
assert.ok(wrapper.includes('rescanFolder'));
assert.ok(wrapper.includes('pickFiles'));
assert.ok(wrapper.includes('readDescriptor'));
assert.ok(wrapper.includes('saveBlob'));
assert.ok(files.includes('data-open-folder'),'Files must expose folder import');
assert.ok(files.includes('data-rescan-folder'),'Files must expose persisted folder rescan');
assert.ok(files.includes("content:'native-pdf:'"),'Native PDFs must store persisted URI references');
assert.ok(studio.includes("startsWith('native-pdf:')"),'PDF viewer must reopen persisted native PDF sources');
assert.ok(studio.includes("return ta?ta.value:(get(state.id)?.content||'')"),'PDF autosave must preserve imported viewer sources');
assert.ok(office.includes('MSANativeFiles.saveBlob'),'Office export must prefer native Downloads save');
assert.ok(android.includes('registerPlugin(MSAFileBridgePlugin.class)'),'Capacitor plugin must register before bridge creation');
assert.ok(android.includes('applySystemBarInsets'),'Android system bars must be handled natively');
assert.ok(android.includes('setAllowFileAccess(false)'),'TechTrace methods must retain hardened WebView file access');
assert.ok(android.includes('MIXED_CONTENT_NEVER_ALLOW'),'TechTrace methods must retain hardened mixed-content policy');

console.log('TechTrace-derived native file/folder method contract passed');
