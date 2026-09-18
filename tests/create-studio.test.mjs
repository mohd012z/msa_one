import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/create-studio.js','utf8');
const css=fs.readFileSync('www/create-studio.css','utf8');

for(const type of ['document','spreadsheet','presentation','pdf','html']) assert.ok(js.includes(type),'missing Create type '+type);
for(const api of ['MSAStudio','open','close','saveDraft','exportCurrent']) assert.ok(js.includes(api),'missing studio API '+api);
assert.ok(js.includes('contenteditable'),'Document editor must be editable');
assert.ok(js.includes('sandbox'),'Smart HTML preview must be sandboxed');
assert.ok(js.includes('localStorage'),'Drafts must persist locally');
assert.ok(css.includes('safe-area-inset-bottom'),'Studio must respect mobile safe area');
for(const feature of ['readSheet','renderSheet','renderPresentation','currentSlides','data-pdf-text']) assert.ok(js.includes(feature),'missing working editor '+feature);
for(const ext of ['.docx','.xlsx','.pptx','.pdf','.csv']) assert.ok(js.includes(ext),'missing export '+ext);
assert.ok(js.includes('MSAOffice'),'Create Studio must use the offline Office engine');
assert.ok(js.includes('MSAStorage'),'Create Studio must mirror drafts to durable storage');

console.log('create studio contract passed');
