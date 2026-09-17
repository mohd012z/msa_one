import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/create-studio.js',s=fs.readFileSync(p,'utf8');
for(const k of ['sheetToIR','sheetFromIR','applySheetTemplate','evaluateFormula','importCSV','exportCSV','insertSheetRow','insertSheetColumn','removeSheetRow','removeSheetColumn'])assert.ok(s.includes(k),'missing Spreadsheet Studio v2 '+k);
for(const k of ['MSADocumentIR','MSAKagaLibrary','MSAProjectStore','spreadsheet'])assert.ok(s.includes(k),'missing Spreadsheet Studio integration '+k);
for(const k of ['SUM','AVERAGE','MIN','MAX'])assert.ok(s.includes(k),'missing spreadsheet formula '+k);
assert.ok(s.includes('CSV'),'Spreadsheet Studio must support CSV workflow');
assert.ok(s.includes('sheet-ir'),'Spreadsheet Studio must persist IR identity');
console.log('Spreadsheet Studio v2 contract passed');