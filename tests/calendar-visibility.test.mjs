import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');
const shell=fs.readFileSync('www/app-shell.js','utf8');
const planner=fs.readFileSync('www/planner.js','utf8');
assert.ok(html.includes('planner.js'),'Planner runtime must remain packaged by source HTML');
assert.ok(shell.includes("BUILD_ID='MSA-ONE-55'"),'active Build 55 shell must own the displayed build marker');
assert.ok(shell.includes("'myday'"),'My Day must be part of the Build 55 navigation model');
assert.ok(planner.includes("id:'myday'"),'Planner must register as My Day');
assert.ok(planner.includes('todaySummary'),'Home must be able to show a compact My Day summary');
console.log('Build 55 My Day visibility contract passed');
