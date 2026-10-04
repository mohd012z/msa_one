import fs from 'node:fs';
import assert from 'node:assert/strict';

assert.ok(fs.existsSync('www/action-hub.js'),'Action Hub module must exist');
const src=fs.existsSync('www/action-hub.js')?fs.readFileSync('www/action-hub.js','utf8'):'';
const shell=fs.readFileSync('www/app-shell.js','utf8');
for(const id of ['document','spreadsheet','presentation','pdf','html','scan','open-file','import-folder','ai','templates','browse']) assert.ok(src.includes("id:'"+id+"'")||src.includes('id:"'+id+'"'),`Action Hub must expose ${id}`);
assert.ok(src.includes('MSAStudio')&&src.includes('MSAFiles')&&src.includes('MSAAIWorkspace'),'Action Hub must route to existing engines');
assert.ok(src.includes('MSAActionHub'),'Action Hub must register globally');
assert.ok(shell.includes('MSAActionHub'),'center Create control must route through Action Hub');
assert.ok(shell.includes('action-hub.js'),'shell bootstrap must load Action Hub');
assert.ok(src.includes("open('create')")||src.includes("open?.('create')"),'expanded Create browse path must remain available');

console.log('Build 55 Action Hub contract passed');
