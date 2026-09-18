import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('www/index.html','utf8');

assert.ok(html.includes('data-calendar-home'),'Calendar must be permanent in Home source HTML');
assert.ok(html.includes('data-calendar-me'),'Calendar must be permanent in Me source HTML');
assert.ok(html.includes('data-build-id="MSA-ONE-38"'),'source HTML must show MSA One 38 build ID');
assert.ok(html.includes('Calendar & Daily Planner'),'Calendar label must exist in source HTML');
assert.ok(html.includes('planner.js'),'Planner runtime must be loaded by source HTML');

console.log('calendar visibility contract passed');
