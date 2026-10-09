import fs from 'node:fs';
import assert from 'node:assert/strict';

// Faithful-port contract for www/lola-cognitive.js. The golden cases below are
// MIRRORED from LOLA's own Python test suite (tests/test_answer_planner.py,
// test_runtime_loop.py, test_agent_roles_observe.py, test_cognitive_evidence.py)
// so the JS port provably behaves the same as the reference implementation.

globalThis.window = globalThis;
eval(fs.readFileSync('www/lola-cognitive.js', 'utf8'));
const L = globalThis.MSALolaCognitive;
assert.ok(L, 'MSALolaCognitive must be exported');

// ---------- planAnswer (mirrors lola tests/test_answer_planner.py) ----------
{
  const p = L.planAnswer('why does the application freeze after ten seconds');
  assert.equal(p.question_type, 'TROUBLESHOOTING');
  assert.deepEqual(p.sections.slice(0, 3), ['Finding', 'Evidence', 'Root cause']);
  assert.ok(p.sections.includes('Unknowns'));
}
{
  const p = L.planAnswer('research and compare the evidence for scheduling options');
  assert.equal(p.question_type, 'RESEARCH');
  assert.ok(p.sections.includes('Competing explanations'));
  assert.ok(p.sections.includes('Conclusion'));
  assert.ok(!p.sections.includes('Root cause'));
}
{
  const p = L.planAnswer('implement the new build pipeline and deploy it');
  assert.equal(p.question_type, 'IMPLEMENTATION');
  assert.ok(p.sections.includes('Dependencies'));
  assert.ok(p.sections.includes('Regression'));
}
{
  const p = L.planAnswer('hello');
  assert.equal(p.question_type, 'GENERIC');
  assert.ok(p.sections.includes('Summary'));
}
{ // deterministic
  const a = L.planAnswer('why does it fail');
  const b = L.planAnswer('why does it fail');
  assert.deepEqual(a.sections, b.sections);
  assert.equal(a.question_type, b.question_type);
}
{ // batch convenience
  const out = L.plannedSections(['why does it fail', 'research the options', 'implement the change', 'hello']);
  assert.equal(out.length, 4);
  assert.ok(out[0].includes('Root cause'));
  assert.ok(out[1].includes('Conclusion'));
}

// ---------- fastTriage (mirrors lola tests/test_runtime_loop.py triage cases) ----------
{
  const t = L.fastTriage('what is the total revenue for q3', { verifiedState: { 'total revenue q3': '12,000' } });
  assert.equal(t.route, 'ANSWER');
  assert.equal(t.match, 'total revenue q3');
  assert.equal(t.external_justified, false);
}
{
  const t = L.fastTriage('check the build status of the project', {});
  assert.equal(t.route, 'INSPECT');
}
{
  const t = L.fastTriage('how should we restructure the whole organisation', {});
  assert.equal(t.route, 'MAP');
}

// ---------- confidenceFromEvidence (mirrors lola presentation tests) ----------
{
  assert.equal(L.confidenceFromEvidence([]).confidence, 'UNVERIFIED');
  assert.equal(L.confidenceFromEvidence([{ id: 'a', state: 'SUPPORTED', evidence_ids: ['e1'] }]).confidence, 'SUPPORTED');
  assert.equal(L.confidenceFromEvidence([{ id: 'a', state: 'SUPPORTED', evidence_ids: ['e1'] }, { id: 'b', state: 'UNVERIFIED', evidence_ids: [] }]).confidence, 'PARTIALLY_SUPPORTED');
  assert.equal(L.confidenceFromEvidence([{ id: 'a', state: 'CONTRADICTED', evidence_ids: ['e1'] }, { id: 'b', state: 'SUPPORTED', evidence_ids: ['e2'] }]).confidence, 'CONTRADICTED');
}

// ---------- evidence bus: evidence wins, not agent count ----------
{
  const bus = L.makeEvidenceBus();
  bus.registerEvidence('e1', 'e2');
  // C is backed by e1; D is backed by e2 but self-reports e2 as contradicting D.
  bus.submit({ agent: 'a', finding: 'C', evidence_ids: ['e1'], unknowns: [], contradictions: [], next_gap: '' });
  bus.submit({ agent: 'b', finding: 'D', evidence_ids: ['e2'], unknowns: [], contradictions: ['e2'], next_gap: '' });
  const v = bus.verdict('C', 'D');
  assert.equal(v.winner, 'C'); // D contradicts itself (e2); C does not
  assert.ok(v.discriminating);
}
{ // identical citations from both sides discriminate NOTHING (agent count is not evidence)
  const bus = L.makeEvidenceBus();
  bus.registerEvidence('e1', 'e2');
  bus.submit({ agent: 'a', finding: 'C', evidence_ids: ['e1'], unknowns: [], contradictions: [], next_gap: '' });
  bus.submit({ agent: 'b', finding: 'C', evidence_ids: ['e2'], unknowns: [], contradictions: [], next_gap: '' });
  bus.submit({ agent: 'c', finding: 'D', evidence_ids: ['e1', 'e2'], unknowns: [], contradictions: [], next_gap: '' });
  const v = bus.verdict('C', 'D');
  assert.equal(v.winner, null); // C and D cite the same evidence -> no winner by headcount
  assert.ok(!v.discriminating);
}
{ // pollution guard: unknown evidence id is a hard error
  const bus = L.makeEvidenceBus();
  assert.throws(() => bus.submit({ agent: 'a', finding: 'C', evidence_ids: ['nope'], unknowns: [], contradictions: [], next_gap: '' }), /unknown evidence ids/);
}

// ---------- observe (mirrors lola observe tests) ----------
{
  const o = L.recordObservation('o1', { expected: 10, observed: 10.4, source: 'test_run' });
  assert.equal(o.prediction_error, o.observed - o.expected);
  assert.equal(o.needs_recheck, false); // within tolerance 1.0
  const o2 = L.recordObservation('o2', { expected: 10, observed: 12 });
  assert.equal(o2.needs_recheck, true); // beyond tolerance
}

// ---------- runCognitive: the hybrid loop ----------
await (async () => {
  // offline-answered: SUPPORTED, no external, source offline, planned sections
  const r = await L.runCognitive({
    question: 'why does the app freeze',
    offlineAnswer: { matches: ['The freeze is caused by a blocking main-thread loop.'], confident: true },
    verifiedState: {},
    inspectable: ['doc1']
  });
  assert.equal(r.route, 'MAP');
  assert.equal(r.confidence, 'SUPPORTED');
  assert.equal(r.external_sources_used, 0);
  assert.equal(r.quarantined, false);
  assert.equal(r.source, 'offline');
  assert.deepEqual(r.planned_sections.slice(0, 3), ['Finding', 'Evidence', 'Root cause']);
  assert.equal(r.stopped_by, 'ANSWERED_WITH_EVIDENCE');

  // no offline match + external configured but NO frozen hypothesis -> QUARANTINE
  const rq = await L.runCognitive({
    question: 'what is the latest market trend',
    offlineAnswer: { matches: [], confident: false },
    onFetchExternal: async () => 'External web fact.'
  });
  assert.equal(rq.quarantined, true);
  assert.ok(rq.violations.includes('NOVELTY_BEFORE_EXTERNAL'));
  assert.equal(rq.source, 'external-quarantined');
  assert.ok(!rq.matches.includes('External web fact.')); // quarantined text not presented as an answer

  // offline match + external -> HYBRID (novelty satisfied, external justified)
  const rh = await L.runCognitive({
    question: 'why does it fail',
    offlineAnswer: { matches: ['Local hypothesis line.'], confident: true },
    frozenHypothesis: { frozen_before_external: true },
    onFetchExternal: async () => 'Web confirmation.'
  });
  assert.equal(rh.quarantined, false);
  assert.equal(rh.external_sources_used, 1);
  assert.equal(rh.source, 'hybrid');
  assert.ok(rh.matches.includes('Web confirmation.'));

  // verified state fast-triages straight to ANSWER (the learning loop's payoff)
  const rv = await L.runCognitive({
    question: 'what is the total revenue for q3',
    verifiedState: { 'total revenue q3': '12,000 (from budget doc)' },
    offlineAnswer: { matches: [], confident: false }
  });
  assert.equal(rv.route, 'ANSWER');
  assert.equal(rv.confidence, 'SUPPORTED');
  assert.equal(rv.source, 'verified');

  // learning governor (mirrors lola test_governor_*: only quarantine or
  // CONTRADICTED rejects; PROMOTE needs answered-with-evidence + no violations
  // + transfer + regression passing)
  assert.equal(L.learningGovernor({ quarantined: false, confidence: 'SUPPORTED', stopped_by: 'ANSWERED_WITH_EVIDENCE', violations: [], transfer_passed: true, regression_passed: true }), 'PROMOTE');
  assert.equal(L.learningGovernor({ quarantined: true, confidence: 'SUPPORTED', stopped_by: 'ANSWERED_WITH_EVIDENCE', violations: [], transfer_passed: true, regression_passed: true }), 'REJECT');
  assert.equal(L.learningGovernor({ quarantined: false, confidence: 'UNVERIFIED', stopped_by: 'ANSWERED_WITH_EVIDENCE', violations: [], transfer_passed: true, regression_passed: true }), 'PROMOTE');
  assert.equal(L.learningGovernor({ quarantined: false, confidence: 'UNVERIFIED', stopped_by: 'ANSWERED_WITH_EVIDENCE', violations: [], transfer_passed: false, regression_passed: true }), 'RETAIN');
})();

// ---------- the hybrid is wired into the app ----------
{
  const actions = fs.readFileSync('www/app-actions.js', 'utf8');
  const html = fs.readFileSync('www/index.html', 'utf8');
  assert.ok(html.includes('<script src="lola-cognitive.js"></script>'), 'index.html must load lola-cognitive.js');
  assert.ok(html.indexOf('lola-cognitive.js') < html.indexOf('app-actions.js'), 'lola-cognitive.js must load BEFORE app-actions.js');
  assert.ok(actions.includes('await lola.runCognitive('), 'routeTask must run the LOLA cognitive loop');
  assert.ok(actions.includes('frozenHypothesis:offlineAnswer.confident'), 'internal offline reasoning must be the frozen hypothesis before external');
  assert.ok(actions.includes('learningGovernor('), 'the learning governor must decide PROMOTE/RETAIN/REJECT');
  assert.ok(actions.includes('learnPromote('), 'PROMOTEd answers must persist to the learned store');
  assert.ok(actions.includes("verifiedState[e.q]=e.a"), 'the learned store must feed fast-triage verified state');
  assert.ok(actions.includes('onlineConfigured?.()'), 'the online tier must only fetch when an endpoint is configured');
}

console.log('LOLA cognitive hybrid (port + wiring) contract passed');
