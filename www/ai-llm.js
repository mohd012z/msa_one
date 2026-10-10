(()=>{'use strict';
  /**
   * OFFLINE LLM TIER — the "LLM method to read all imported files" engine.
   *
   * Runs a small real LLM (Qwen2.5-0.5B-Instruct, ONNX q4f16, ~483MB) inside
   * the WebView via Transformers.js v3 (vendored locally: transformers.min.js
   * + ort-wasm-simd-threaded.jsep.{mjs,wasm} + ort.bundle.min.mjs, so the
   * RUNTIME is offline). The MODEL is fetched from Hugging Face on first use
   * and cached by Transformers.js in IndexedDB — after that everything
   * (inference + model) is fully offline, no key.
   *
   * It is the offline REASONING tier of the LOLA hybrid (PR #18): the router
   * gathers the best evidence from ALL imported documents (MSAAIEngine
   * extraction) and passes it here as RAG context; the LLM reasons over that
   * context and produces a natural answer — real reasoning, not keyword
   * matching. When the model isn't downloaded yet (or the bundle isn't
   * loaded), ask() reports that honestly and the router falls back to the
   * extractive answer, so the assistant always answers.
   *
   * WASM: single-threaded, main-thread inference (numThreads=1, proxy=false)
   * — no web workers, no SharedArrayBuffer/cross-origin isolation needed,
   * which is what an Android WebView actually provides. Verified end-to-end
   * in a bare headless browser (load ~20s, 24-token answer ~40s on a dev
   * container; phones are faster), producing grounded answers from context.
   *
   * CSP-safe: script-src 'self' (all JS/WASM vendored), connect-src https:
   * (one-time model fetch from huggingface.co).
   */
  const MODEL_ID='onnx-community/Qwen2.5-0.5B-Instruct';
  const DTYPE='q4f16'; // single-file quantized ONNX (model_q4f16.onnx)
  const KEY_ENABLED='msaOneOfflineLLMEnabledV1';
  const KEY_MODEL_STATE='msaOneOfflineLLMModelV1';
  const MAX_CONTEXT_CHARS=6000; // RAG context budget fed to the LLM
  const MAX_NEW_TOKENS=48;      // short, direct answers; phone-realistic latency

  let pipeline=null, loading=null;
  function enabled(){
    try{return localStorage.getItem(KEY_ENABLED)==='1'}catch{return false}
  }
  function setEnabled(v){
    try{localStorage.setItem(KEY_ENABLED,v?'1':'0')}catch{}
  }
  function modelState(){
    let s={downloaded:false};
    try{s=JSON.parse(localStorage.getItem(KEY_MODEL_STATE)||'{}')}catch{}
    return s;
  }
  function setModelState(patch){
    try{localStorage.setItem(KEY_MODEL_STATE,JSON.stringify(Object.assign(modelState(),patch)))}catch{}
  }

  // transformers-loader.mjs (ESM, deferred) attaches these globals.
  function bundleReady(){
    return typeof globalThis.TransformersPipeline==='function' && globalThis.MSATransformersReady===true;
  }
  function ready(){return !!(pipeline&&pipeline.ready===true)}

  // Build a grounded, short-answer prompt (Qwen2.5 instruct style).
  function buildPrompt(question,context){
    const ctx=(context||'').trim().slice(0,MAX_CONTEXT_CHARS);
    return [
      'You are the offline AI assistant inside MSA One. Use ONLY the context below to answer.',
      'If the context does not contain the answer, reply exactly: I could not find that in your documents.',
      'Keep the answer short and direct.',
      '',
      'Context:',
      ctx||'(no matching context)',
      '',
      'Question: '+question
    ].join('\n');
  }

  /**
   * Download + warm the model (first time). Reports progress. Idempotent.
   * Resolves true when the pipeline is ready.
   */
  async function ensureModel(onProgress){
    if(ready())return true;
    if(!bundleReady())throw new Error('Transformers.js bundle not loaded');
    if(loading)return loading;
    loading=(async()=>{
      const report=onProgress||(p=>{});
      report({phase:'download',loaded:0,total:0,message:'Preparing offline model…'});
      const pipe=await globalThis.TransformersPipeline('text-generation',MODEL_ID,{
        dtype:DTYPE,
        progress_callback:(p)=>{
          if(p&&p.status==='progress'&&(p.file||'').includes('model_q4f16')){
            report({phase:'download',loaded:p.loaded||0,total:p.total||0,message:'Downloading offline model… '+(p.total?Math.round(100*p.loaded/p.total):0)+'%'});
          }
        }
      });
      pipeline=pipe;
      report({phase:'ready',message:'Offline model ready'});
      setModelState({downloaded:true,at:Date.now()});
      return true;
    })();
    try{return await loading}finally{loading=null;}
  }

  /**
   * Ask the offline LLM over a context string.
   * returns {ok,text,model,error?}
   */
  async function ask({question,context,onProgress}={}){
    if(!bundleReady())return{ok:false,error:'bundle-not-loaded',model:MODEL_ID};
    const t0=Date.now();
    try{
      if(!ready())await ensureModel(onProgress);
      const prompt=buildPrompt(question,context);
      // v3 API: pipeline takes the raw string; result[0].generated_text is
      // prompt+completion, so the answer is the tail after prompt.length.
      const out=await pipeline(prompt,{max_new_tokens:MAX_NEW_TOKENS,do_sample:false});
      const full=String(out&&out[0]&&(out[0].generated_text||out[0].text||''));
      let text=full.length>prompt.length?full.slice(prompt.length):full;
      text=text.trim();
      if(!text)return{ok:false,error:'empty-generation',model:MODEL_ID,ms:Date.now()-t0};
      setModelState({lastUsed:Date.now()});
      return{ok:true,text,model:MODEL_ID,ms:Date.now()-t0};
    }catch(e){
      return{ok:false,error:String(e&&e.message||e),model:MODEL_ID,ms:Date.now()-t0};
    }
  }

  globalThis.MSAAIOfflineLLM={
    MODEL_ID,DTYPE,
    enabled,setEnabled,
    modelState,
    ready,
    ensureModel,
    ask,
    buildPrompt,
    MAX_CONTEXT_CHARS,MAX_NEW_TOKENS,
    // provenance
    _NOTE:'offline LLM tier of the LOLA hybrid (Transformers.js v3, Qwen2.5-0.5B q4f16); model cached in IndexedDB by Transformers.js'
  };
})();
