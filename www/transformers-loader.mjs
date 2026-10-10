/**
 * ESM loader for the vendored Transformers.js v3 bundle.
 *
 * transformers.min.js is an ES module (it ends with `export{...}`), so it
 * CANNOT load as a classic <script src> in the app. This tiny module imports
 * it and attaches the two globals the offline LLM tier (ai-llm.js) expects:
 *   - window.env                 (model cache + WASM backend config)
 *   - window.TransformersPipeline -> the pipeline() factory (text-generation)
 *
 * Loaded with <script type="module"> BEFORE ai-llm.js (module scripts are
 * deferred, so ai-llm.js only touches the globals at runtime, when the user
 * asks the assistant — by then the bundle is loaded).
 *
 * WASM layout (verified in a headless browser, BARE config = no
 * SharedArrayBuffer, i.e. the Android WebView case):
 *   www/ort-wasm-simd-threaded.jsep.mjs    (ORT wasm JS glue, imported at runtime)
 *   www/ort-wasm-simd-threaded.jsep.wasm   (~21.6MB runtime, vendored)
 *   www/ort.bundle.min.mjs                 (ORT bundle fallback)
 * ORT resolves them as wasmPaths + filename (plain string concat), so
 * wasmPaths='./' points at this directory. numThreads=1 runs inference on
 * the main thread — no web workers, no cross-origin isolation needed,
 * which keeps it CSP-safe in the WebView.
 *
 * Only the ~480MB MODEL is fetched on first use (cached by Transformers.js
 * in IndexedDB); everything else in this file set is offline.
 */
import * as tf from './transformers.min.js';

try{
  const wasm=tf.env && tf.env.backends && tf.env.backends.onnx && tf.env.backends.onnx.wasm;
  if(wasm){
    wasm.wasmPaths='./';
    wasm.numThreads=1;
    wasm.proxy=false;
  }
  if(tf.env){
    // model lives on Hugging Face; there are no local model files in the app
    tf.env.allowLocalModels=false;
    tf.env.allowRemoteModels=true;
  }
}catch(e){/* backend not initialized yet; defaults are CDN — still works online */}

globalThis.env = tf.env;
globalThis.TransformersPipeline = (task, model, options) => tf.pipeline(task, model, options);

globalThis.MSATransformersReady = true;
