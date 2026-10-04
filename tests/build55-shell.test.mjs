import fs from 'node:fs';
import assert from 'node:assert/strict';

const shell=fs.readFileSync('www/app-shell.js','utf8');
const settings=fs.readFileSync('www/settings-v2.js','utf8');
const css=fs.readFileSync('www/workspace-v2.css','utf8');
const planner=fs.readFileSync('www/planner.js','utf8');
const drawer=fs.readFileSync('www/drawer.js','utf8');
const library=fs.readFileSync('www/library-engine.js','utf8');
const create=fs.readFileSync('www/create-v2.js','utf8');
const swipe=fs.readFileSync('www/swipe-nav.js','utf8');

for(const name of ['registerPage','getFourthTab','setFourthTab','back']) assert.ok(shell.includes('function '+name)||shell.includes(name+':'),`MSAAppShell must expose ${name}`);
assert.ok(shell.includes("['myday','tools','library']")||shell.includes('myday')&&shell.includes('tools')&&shell.includes('library'),'fourth tab choices must be bounded');
assert.ok(shell.includes("home','files','create")&&shell.includes("'ai'"),'default nav must retain home/files/create/ai');
assert.ok(shell.includes('myday'),'default nav must include My Day');
assert.ok(shell.includes('aria-label="Menu"'),'menu button must have an accessible name');
assert.ok(shell.includes('aria-label="Profile"'),'profile button must have an accessible name');
assert.ok(shell.includes("title='MSA One'")&&shell.includes('ws-page-title'),'topbarHTML(title) must render the title');
assert.ok(shell.includes('ui-system.css')&&shell.includes('icon-system.js')&&shell.includes('action-hub.js'),'shell bootstrap must load Build 55 UI assets');
assert.ok(shell.includes("return'home'")||shell.includes("open('home')")||shell.includes("id:'home'"),'unknown pages must have a Home fallback');
assert.ok(settings.includes('My Day')&&settings.includes('Tools')&&settings.includes('Library'),'Settings must expose the three fourth-tab choices');
assert.match(css,/@media\(min-width:1000px\)[\s\S]*\.ws-bottom/,'wide layout must keep a navigation-rail presentation');

for(const [name,src] of [['Planner',planner],['Drawer',drawer],['Library',library],['Settings',settings],['Create',create]]) assert.ok(!src.includes("querySelector('.nav')"),`${name} must not own/mutate legacy .nav`);
assert.ok(library.includes("MSAAppShell?.open?.('library')"),'Library open must route through AppShell');
assert.ok(library.includes("MSAAppShell?.open?.('home')"),'Library close must return through AppShell');
assert.ok(create.includes('MSAAppShell?.topbarHTML'),'Create browse page must use shared shell header');
assert.ok(!drawer.includes('globalThis.show'),'Drawer must not bypass AppShell');
assert.ok(!swipe.includes("closest('input,textarea,select,[contenteditable=\"true\"],.studio-overlay,#lens,.nav"),'swipe navigation must not depend on hidden legacy .nav');

console.log('Build 55 shell contract passed');
