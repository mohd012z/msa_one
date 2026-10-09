import fs from 'node:fs';
import assert from 'node:assert/strict';

// Offline LLM tier (PR B): the on-device LLM that reads ALL imported files and
// reasons over them via RAG. Contract: prompt shape, model lifecycle, ask()
// (with a STUBBED pipeline so the test is fast + fully offline), and the wiring
// into the LOLA hybrid + Settings + build manifest.
//
// Stub mirrors the VERIFIED Transformers.js v3 pipeline API (proven in a real
// headless browser, not just assumed): pipeline(prompt: string) resolves to
// [{generated_text: prompt + completion}].

globalThis.window = globalThis;
// stub localStorage (node has none) so model-state persistence is exercised
{
  const store={};
  globalThis.localStorage={
    getItem:(k)=>(k in store?store[k]:null),
    setItem:(k,v)=>{store[k]=String(v)},
    removeItem:(k)=>{delete store[k]}
  };
}
// Stub the Transformers.js bundle BEFORE loading the module so ask() runs
// offline (no 480MB download, no network) but exercises the real code path.
globalThis.MSATransformersReady=true; // set by transformers-loader.mjs in the app
globalThis.TransformersPipeline = async (task, model, opts) => {
  assert.equal(task, 'text-generation');
  assert.equal(model, 'onnx-community/Qwen2.5-0.5B-Instruct');
  const SENTINEL='I could not find that in your documents.';
  let promptLen=0;
  let emptyCtx=false;
  const pipe = async (prompt) => {
    assert.equal(typeof prompt, 'string', 'v3 pipeline takes a raw string prompt');
    promptLen=String(prompt).length;
    emptyCtx=String(prompt).includes('(no matching context)');
    // mirror the real model: grounded completion when context present, sentinel when empty
    const completion=emptyCtx?SENTINEL:'ANSWER: the budget shows 12,000 total.';
    return [{ generated_text: prompt + completion }];
  };
  pipe.ready = true;
  return pipe;
};
globalThis.env = {};

eval(fs.readFileSync('www/ai-llm.js', 'utf8'));
const L = globalThis.MSAAIOfflineLLM;
assert.ok(L, 'MSAAIOfflineLLM must be exported');

// default off, opt-in via Settings
assert.equal(L.enabled(), false, 'offline LLM must be OFF by default (opt-in)');

// ask() before model load should download + warm (stub), then answer
const res = await L.ask({ question: 'What is the total budget?', context: 'The budget total is 12,000.' });
assert.equal(res.ok, true);
assert.ok(res.text.includes('12,000'), 'answer must be grounded in the provided context');
assert.equal(L.ready(), true, 'model must be ready after ask()');
assert.equal(L.modelState().downloaded, true, 'model download must be recorded');

// prompt shape: grounded, short, instruct-style
{
  const p = L.buildPrompt('why does it fail', 'ROOT CAUSE: memory leak.');
  assert.ok(p.includes('Use ONLY the context below'), 'must instruct to use only the context');
  assert.ok(p.includes('ROOT CAUSE: memory leak.'), 'must embed the context');
  assert.ok(p.includes('why does it fail'), 'must embed the question');
  assert.ok(p.includes('I could not find that in your documents.'), 'must define the no-answer sentinel');
}
// context is capped to the budget
{
  const p = L.buildPrompt('q', 'x'.repeat(20000));
  assert.ok(p.length < 20000, 'context must be truncated to MAX_CONTEXT_CHARS');
}
// the "no answer" sentinel is surfaced verbatim so the router can fall back
{
  const res = await L.ask({ question: 'xyz not in docs', context: '' });
  assert.equal(res.ok, true);
  assert.equal(res.text.toLowerCase(), 'i could not find that in your documents.', 'empty context -> honest no-answer sentinel');
}
// enable/disable persists
L.setEnabled(true);
assert.equal(L.enabled(), true);
L.setEnabled(false);
assert.equal(L.enabled(), false);

// ---------- wiring ----------
{
  const actions = fs.readFileSync('www/app-actions.js', 'utf8');
  const html = fs.readFileSync('www/index.html', 'utf8');
  const settings = fs.readFileSync('www/settings-v2.js', 'utf8');

  assert.ok(html.includes('<script src="ai-llm.js"></script>'), 'index.html must load ai-llm.js');
  assert.ok(html.includes('transformers-loader.mjs'), 'index.html must load the ESM bundle loader (v3 is an ES module)');
  assert.ok(html.indexOf('transformers-loader.mjs') < html.indexOf('ai-llm.js'), 'bundle loader before LLM tier');
  assert.ok(html.indexOf('lola-cognitive.js') < html.indexOf('ai-llm.js'), 'cognitive core before LLM tier');

  assert.ok(actions.includes('buildRAGContext('), 'router must build RAG context over ALL imported files');
  assert.ok(actions.includes('llm.ensureModel('), 'router must download the model on first use with progress');
  assert.ok(actions.includes('llm.ask({question:q,context})'), 'router must ask the offline LLM over the RAG context');
  assert.ok(actions.includes("sourceOverride==='offline-llm'"), 'LLM answers must be labelled as offline-LLM in the UI');
  assert.ok(actions.includes('llmLearn(q,res.text)'), 'LLM answers must be learned');

  assert.ok(settings.includes('function llmCard()'), 'Settings must expose the offline LLM card');
  assert.ok(settings.includes('llm.setEnabled('), 'Settings must allow opt-in');
  assert.ok(settings.includes('ensureModel('), 'Settings must allow a one-tap model download');
}

// ---------- the vendored bundle + WASM are real (v3 layout) ----------
{
  const bundle = fs.readFileSync('www/transformers.min.js', 'utf8');
  assert.ok(bundle.length > 500000, 'vendored Transformers.js bundle must be the real minified build');
  assert.ok(bundle.includes('export{'), 'bundle must be the ESM build (loaded via transformers-loader.mjs)');
  assert.ok(bundle.includes('pipeline'), 'bundle must define the pipeline factory');
  const mjs = fs.readFileSync('www/ort-wasm-simd-threaded.jsep.mjs', 'utf8');
  assert.ok(mjs.length > 10000, 'ORT wasm JS glue must be vendored');
  const wasm = fs.readFileSync('www/ort-wasm-simd-threaded.jsep.wasm');
  assert.ok(wasm.length > 5000000, 'ORT wasm runtime must be the real binary');
  assert.equal(wasm[0], 0x00); assert.equal(wasm[1], 0x61); assert.equal(wasm[2], 0x73); assert.equal(wasm[3], 0x6d); // \0asm
  const ortb = fs.readFileSync('www/ort.bundle.min.mjs', 'utf8');
  assert.ok(ortb.length > 100000, 'ORT bundle fallback must be vendored');
  const loader = fs.readFileSync('www/transformers-loader.mjs', 'utf8');
  assert.ok(loader.includes("wasmPaths='./'"), 'loader must point WASM at the app root');
  assert.ok(loader.includes('numThreads=1'), 'loader must force single-threaded (WebView-safe) WASM');
  assert.ok(loader.includes('proxy=false'), 'loader must disable the wasm proxy worker');
}

console.log('offline LLM tier (on-device Qwen2.5-0.5B via Transformers.js v3, RAG over all files) contract passed');
