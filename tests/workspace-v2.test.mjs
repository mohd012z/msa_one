import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
const shell=fs.readFileSync('www/app-shell.js','utf8');
const search=fs.readFileSync('www/search-center.js','utf8');
const home=fs.readFileSync('www/home-v2.js','utf8');
const files=fs.readFileSync('www/files-v2.js','utf8');
const create=fs.readFileSync('www/create-v2.js','utf8');
const tools=fs.readFileSync('www/tools-center.js','utf8');
const templates=fs.readFileSync('www/template-center.js','utf8');
const ai=fs.readFileSync('www/ai-tools.js','utf8');
const drawer=fs.readFileSync('www/drawer.js','utf8');
const css=fs.readFileSync('www/workspace-v2.css','utf8');

for(const asset of [
  'workspace-v2.css','tools-catalog.js','template-catalog.js','assistant-catalog.js',
  'action-sheet.js','drawer.js','search-center.js','home-v2.js','files-v2.js',
  'tools-center.js','template-center.js','ai-tools.js','create-v2.js','app-shell.js'
]) assert.ok(html.includes(asset),'index must load '+asset);

for(const page of ['home','files','create','tools','ai'])assert.ok(shell.includes("'"+page+"'")||shell.includes('"'+page+'"'),'workspace shell missing '+page);
assert.ok(shell.includes('MSAHomeV2'),'shell must reuse Home V2');
assert.ok(shell.includes('MSAFilesV2'),'shell must reuse Files V2');
assert.ok(shell.includes('MSAToolsCenter'),'shell must reuse Tools Center');
assert.ok(shell.includes('MSATemplateCenter'),'shell must reuse Template Center');
assert.ok(shell.includes('MSAAIWorkspace'),'shell must reuse AI workspace');

for(const source of ['MSAProjects','MSALibrary','MSAToolsCatalog','MSAAssistantCatalog'])assert.ok(search.includes(source),'universal search missing '+source);
assert.ok(search.includes('MSAFiles?.openProject'),'search file results must use existing Files API');

for(const type of ['document','spreadsheet','presentation','pdf','html'])assert.ok(home.includes("MSAStudio?.open?.")&&home.includes(type),'Home quick create must support '+type);
assert.ok(files.includes('MSAFiles?.importOfficeFile'),'Files V2 must reuse unified Office import');
assert.ok(files.includes('MSAFiles?.importFolder'),'Files V2 must reuse native folder import');
assert.ok(files.includes('MSAFiles?.openProject'),'Files V2 must reuse project opener');
assert.ok(files.includes('MSAActionSheet'),'Files V2 must use reusable action sheet');

assert.ok(create.includes('MSAStudio?.open'),'Create V2 must reuse real Office editor');
assert.ok(create.includes('MSAFiles?.importOfficeFile'),'Create V2 must reuse file import');
assert.ok(create.includes('MSAFiles?.importFolder'),'Create V2 must reuse folder import');

assert.ok(tools.includes('MSAToolsCatalog'),'Tools Center must be catalog driven');
assert.ok(tools.includes('MSAStorage?.downloadBackup'),'Tools Center must expose real workspace backup');
assert.ok(tools.includes('MSAFiles?.importFolder'),'Tools Center must expose real folder import');

assert.ok(templates.includes('MSALibrary?.allTemplates'),'Template Center must merge Built-in Library templates');
assert.ok(templates.includes('MSAProjects?.write'),'starter templates must create real saved projects');
assert.ok(templates.includes('MSAStudio?.open'),'templates must open in the real editor');

assert.ok(ai.includes('MSAAssistantCatalog'),'AI browser must be catalog driven');
assert.ok(ai.includes('MSAActions?.openPicker'),'AI file attachment must use existing picker');
assert.ok(ai.includes("document.querySelector('#ai textarea')"),'AI assistants must route into current composer');

for(const route of ['MSAPlanner','MSAStorage','MSALibrary','MSASettingsV2'])assert.ok(drawer.includes(route),'drawer missing existing engine '+route);

assert.ok(css.includes('.ws-bottom'),'workspace must have new five-item bottom navigation');
assert.ok(css.includes('.ws-drawer'),'workspace must have side drawer');
assert.ok(css.includes('.ws-search-panel'),'workspace must have universal search overlay');
assert.ok(css.includes('@media(min-width:1000px)'),'workspace must adapt to desktop');

console.log('Build 53 Workspace V2 integration contract passed');
