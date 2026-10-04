import fs from 'node:fs';
import assert from 'node:assert/strict';

const planner=fs.readFileSync('www/planner.js','utf8');
const plannerCss=fs.readFileSync('www/planner.css','utf8');

assert.ok(planner.includes("const KEY='msaOnePlannerV1'"),'planner storage key must remain unchanged');
assert.ok(!planner.includes("querySelector('.nav')"),'Planner must not mutate legacy .nav');
assert.ok(!planner.includes("repeat(6,1fr)"),'Planner must not create a six-tab legacy nav');
assert.ok(planner.includes("registerPage({id:'myday'")||planner.includes("registerPage?.({id:'myday'"),'Planner must register My Day with AppShell');
assert.ok(planner.includes('function todaySummary()'),'Planner must expose a pure todaySummary helper');
assert.ok(planner.includes('todaySummary'),'MSAPlanner export must include todaySummary');
assert.ok(plannerCss.includes('var(--msa-touch-min,48px)'),'Planner controls must consume the shared touch token');

console.log('Build 55 surface contract passed');
