import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync('www/index.html','utf8');
assert.ok(html.includes('data-calendar-home'), 'Calendar must be permanent in Home base HTML');
assert.ok(html.includes('data-calendar-me'), 'Calendar must be permanent in Me base HTML');
assert.ok(html.includes('data-build-id="MSA-ONE-37"'), 'Me must show an unmistakable build ID');
assert.ok(html.includes('Calendar & Daily Planner'), 'Calendar label must exist in base HTML');
console.log('calendar visibility contract passed');