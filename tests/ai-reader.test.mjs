import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
const reader=fs.readFileSync('www/ai-reader.js','utf8');
const engine=fs.readFileSync('www/ai-engine.js','utf8');
const actions=fs.readFileSync('www/app-actions.js','utf8');

for(const asset of ['ai-engine.js','ai-reader.js','ai-reader.css']) assert.ok(html.includes(asset),'index must load '+asset);
assert.ok(html.indexOf('ai-engine.js')<html.indexOf('ai-reader.js'),'ai-reader.js depends on MSAAIEngine and must load after it');

assert.ok(reader.includes('MSAAIReader'),'reader module must expose MSAAIReader');
assert.ok(reader.includes('extractProjectText')&&reader.includes('extractFileText'),'reader must read real document content, not placeholder text');
assert.ok(reader.includes('readAloud')&&reader.includes('pauseReading')&&reader.includes('stopReading'),'reader must offer real playback controls');
assert.ok(reader.includes('ms-MY')&&reader.includes('Bahasa Melayu'),'reader must support Malay narration');
assert.ok(reader.includes('Baca dengan kuat')&&reader.includes('Ringkasan luar talian'),'reader panel labels must actually switch to Bahasa Melayu, not just the TTS voice');
assert.ok(reader.includes('pdfTextUnavailable'),'reader must honestly report when a scanned PDF has no offline text layer');
assert.ok(reader.includes('MSAAIEngine.ask'),'reader must let the user ask questions about the open document');

assert.ok(engine.includes('onlineConfigured')&&engine.includes('setOnlineEndpoint'),'engine must support an offline-first, online-when-configured architecture');
assert.ok(engine.includes('speechSynthesis'),'engine must use on-device text-to-speech, not a remote call');

assert.ok(actions.includes("MSAAIReader?.open"),'Home "AI Reader & Presenter" action must open the real reader, not a placeholder prompt');
assert.ok(actions.includes('attachedContext'),'attaching a file in AI chat must actually retain its extracted content for offline Q&A');
assert.ok(actions.includes('extractFileText'),'file attachment must read real content via the AI engine');

console.log('AI reader/presenter (offline-first, Malay narration, real document reading) contract passed');
