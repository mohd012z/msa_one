import fs from 'node:fs';import assert from 'node:assert/strict';
const p='www/spreadsheet-production-engine-v2.js';assert.ok(fs.existsSync(p),'missing Spreadsheet Production Engine v2 '+p);const s=fs.readFileSync(p,'utf8');
for(const k of ['MSASpreadsheetProductionEngine','createWorkbook','addSheet','removeSheet','renameSheet','setActiveSheet','setCell','getCell','insertRow','removeRow','insertColumn','removeColumn','evaluateFormula','sortRange','filterRows','chartData','importCSV','exportCSV','autosave','recover','undo','redo','getStatus'])assert.ok(s.includes(k),'missing spreadsheet engine '+k);
for(const k of ['MSAProjectStore','MSARagaConverter','MSARuntimeIntegration','MSAKagaLibrary'])assert.ok(s.includes(k),'missing spreadsheet integration '+k);
for(const k of ['SUM','AVERAGE','MIN','MAX','AVAILABLE','DEGRADED','UNAVAILABLE','localStorage','history','future'])assert.ok(s.includes(k),'missing spreadsheet formula/state '+k);
assert.ok(!s.includes('eval('),'spreadsheet engine must not use eval');assert.ok(!s.includes('new Function'),'spreadsheet engine must not use new Function');
console.log('Spreadsheet Production Engine v2 contract passed');