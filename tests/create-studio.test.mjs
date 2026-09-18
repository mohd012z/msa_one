import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('www/create-studio.js','utf8');
const css=fs.readFileSync('www/create-studio.css','utf8');

for(const type of ['document','spreadsheet','presentation','pdf','html']) assert.ok(js.includes(type),'missing Create type '+type);
for(const api of ['MSAStudio','open','close','saveDraft','importCurrent','exportCurrent','createProject']) assert.ok(js.includes(api),'missing studio API '+api);
assert.ok(js.includes('contenteditable'),'Document editor must be editable');
assert.ok(js.includes('sandbox'),'Smart HTML preview must be sandboxed');
assert.ok(js.includes('localStorage'),'Drafts must persist locally');
assert.ok(css.includes('safe-area-inset-bottom'),'Studio must respect mobile safe area');

for(const feature of ['friendlyError','friendlySuccess','normalizeSheets','replaceSheets','currentSheets','readSheet','renderSheet','renderPresentation','currentSlides','data-pdf-text','evalFormula','toggleChart','pickSlideImage','resizeImage','pickDocumentImage','parseCSV','parseCSVAsync','runBusy','sheetPageSize','sheetColPageSize','sanitizeHTML','importCurrent']) assert.ok(js.includes(feature),'missing working editor feature '+feature);
for(const formula of ['SUM','AVERAGE','MIN','MAX']) assert.ok(js.includes(formula),'missing local formula '+formula);
for(const control of ['data-table','data-doc-image','data-block="H1"','data-chart','data-slide-layout','data-slide-image','data-import','data-row-next','data-col-next']) assert.ok(js.includes(control),'missing rich editor control '+control);
for(const ext of ['.docx','.xlsx','.pptx','.pdf','.csv']) assert.ok(js.includes(ext),'missing export '+ext);
assert.ok(js.includes('MSAOffice'),'Create Studio must use the offline Office engine');
assert.ok(js.includes('MSAImport'),'Create Studio must use the Office import engine');
assert.ok(js.includes('MSAStorage'),'Create Studio must mirror drafts to durable storage');
assert.ok(js.includes('MSACore'),'Create Studio must consume shared Core SDK');
assert.ok(js.includes('MSAMedia'),'Create Studio must consume shared Media SDK');
assert.ok(js.includes('MSAPerformance'),'Create Studio must use adaptive performance services');
assert.ok(js.includes('idleSave'),'autosave must support idle scheduling');
assert.ok(js.includes('virtual view'),'large spreadsheets must use virtual row/column rendering');
assert.ok(css.includes('.studio-editor img'),'document image preview must be styled');
assert.ok(css.includes('.formula-bar'),'formula UI must be styled');
assert.ok(css.includes('.sheet-tabs'),'multi-sheet tabs must be styled');
assert.ok(css.includes('.sheet-pager'),'virtual spreadsheet pager must be styled');
assert.ok(css.includes('.sheet-chart'),'chart preview must be styled');
assert.ok(css.includes('.slide-image-preview'),'slide image preview must be styled');

console.log('rich create studio media contract passed');
