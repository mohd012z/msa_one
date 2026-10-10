(()=> {
  const STORAGE_PROFILE='msaOneProfileV1';
  let picker=null;
  let attachedContext=null;

  function page(id){
    if(typeof window.show==='function') window.show(id);
  }

  function toast(message){
    let el=document.querySelector('[data-msa-toast]');
    if(!el){
      el=document.createElement('div');
      el.className='msa-toast';
      el.setAttribute('data-msa-toast','');
      document.body.appendChild(el);
    }
    el.textContent=message;
    el.classList.add('on');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>el.classList.remove('on'),2400);
  }

  function aiBox(){
    return document.querySelector('#ai textarea');
  }

  function openAI(text=''){
    page('ai');
    const box=aiBox();
    if(box && text){
      box.value=text;
      box.focus();
      box.setSelectionRange(box.value.length,box.value.length);
    }
  }

  function openPicker(accept='',capture=''){
    if(picker) picker.remove();
    picker=document.createElement('input');
    picker.type='file';
    picker.multiple=true;
    picker.accept=accept;
    if(capture) picker.setAttribute('capture',capture);
    picker.hidden=true;
    picker.onchange=async()=>{
      const files=[...(picker.files||[])];
      if(!files.length){picker.remove();picker=null;return}
      const box=aiBox();
      const label=files.map(f=>f.name).join(', ');
      picker.remove();picker=null;
      const docLike=files.filter(f=>!/^image\//.test(f.type)&&!/\.(png|jpe?g|gif|webp)$/i.test(f.name));
      if(!docLike.length||!window.MSAAIEngine){
        if(box) box.value=(box.value?box.value+'\n':'')+'Attached: '+label;
        toast(files.length+' file'+(files.length===1?'':'s')+' selected');
        return;
      }
      toast('Reading '+label+'…');
      const parts=[];
      for(const file of docLike){
        try{
          const{text,pdfTextUnavailable}=await window.MSAAIEngine.extractFileText(file);
          if(pdfTextUnavailable){toast(file.name+': scanned PDF has no offline text layer');continue}
          if(text.trim())parts.push('--- '+file.name+' ---\n'+text);
        }catch(e){toast(file.name+' could not be read: '+e.message)}
      }
      attachedContext=parts.length?{label,text:parts.join('\n\n')}:null;
      if(box) box.value=(box.value?box.value+'\n':'')+(attachedContext?'📎 Attached and read: '+label+' — ask a question or type "summarize".':'Attached: '+label+' (no readable text found)');
      toast(attachedContext?label+' ready — MSA One AI can read it offline':label+' selected');
    };
    picker.oncancel=()=>{picker?.remove();picker=null};
    document.body.appendChild(picker);
    picker.click();
  }

  function voice(){
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){
      toast('Voice input is not supported by this WebView/browser.');
      return;
    }
    const r=new SpeechRecognition();
    const lang=document.querySelector('#lang')?.value==='MY'?'ms-MY':'en-US';
    r.lang=lang;
    r.interimResults=false;
    r.maxAlternatives=1;
    r.onstart=()=>toast('Listening…');
    r.onerror=e=>toast('Voice input: '+(e.error||'error'));
    r.onresult=e=>{
      const text=e.results?.[0]?.[0]?.transcript||'';
      const box=aiBox();
      if(box){
        box.value=(box.value?box.value+' ':'')+text;
        box.focus();
      }
      toast('Voice captured');
    };
    try{r.start()}catch(e){
      const message='Voice input could not start: '+(e?.message||'device error');
      if(window.MSAHelper?.error)window.MSAHelper.error(message,[{label:'Help',run:()=>window.MSAHelper.open('trouble')}]);
      else toast(message);
    }
  }

  function showAIResult(html){
    let out=document.querySelector('#ai [data-ai-result]');
    if(!out){
      out=document.createElement('div');
      out.className='ai-result';
      out.setAttribute('data-ai-result','');
      document.querySelector('#ai [data-ai-composer]')?.insertAdjacentElement('afterend',out)||document.querySelector('#ai .wrap')?.appendChild(out);
    }
    out.innerHTML=html;
  }

  // Looks like a question the user wants answered (not a "create a document" command).
  function looksLikeQuestion(s){
    const t=String(s||'');
    if(/\?\s*$/.test(t))return true;
    return /^\s*(what|who|whom|whose|when|where|why|how|how much|how many|who is|name|tell|explain|list|is |are |was |were |do |does |did |can |could |will |would |should|berapa|siapa|kenapa|bagaimana|apakah|di mana|kapan)/i.test(t);
  }

  // ---------- LOLA learned-facts store (learning loop persistence) ----------
  const LOla_LEARNED_KEY='msaOneLolaLearnedV1';
  function learnedStore(){
    let d={entries:[]};
    try{d=JSON.parse(localStorage.getItem(LOla_LEARNED_KEY)||'{"entries":[]}')}catch{}
    if(!d||!Array.isArray(d.entries))d={entries:[]};
    return d;
  }
  function learnPromote(question,answerText){
    try{
      const d=learnedStore();
      const key=String(question||'').toLowerCase().trim();
      d.entries=d.entries.filter(e=>e.q.toLowerCase()!==key);
      d.entries.unshift({q:question,a:answerText,at:Date.now()});
      if(d.entries.length>20)d.entries=d.entries.slice(0,20);
      localStorage.setItem(LOla_LEARNED_KEY,JSON.stringify(d));
      return true;
    }catch{return false}
  }

  /**
   * HYBRID AI answer via the LOLA cognitive loop (www/lola-cognitive.js).
   * Returns true if it handled the input (question-like), false otherwise.
   * Flow: offline extractive scan of saved documents (internal reasoning)
   * -> research gate (novelty before external: external is allowed only when
   * an internal hypothesis exists, else QUARANTINE) -> optional online fetch
   * -> structured answer with evidence confidence (SUPPORTED / ... never a
   * percentage) -> learning governor PROMOTEs verified answers into the
   * learned store, which fast-triage then answers from directly.
   */
  async function askSavedDocuments(q){
    if(!window.MSAAIEngine)return false;
    if(!looksLikeQuestion(q))return false;
    const lola=window.MSALolaCognitive;
    const esc=v=>String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const projects=(window.MSAProjects?.all?.()||[]);
    const sources=[];
    for(const p of projects){
      try{
        const {text,pdfTextUnavailable}=window.MSAAIEngine.extractProjectText(p);
        if(pdfTextUnavailable)continue;
        if(text&&text.trim())sources.push({title:p.title||'Untitled',id:p.id,text});
      }catch(e){}
    }
    // internal reasoning: best offline match across all saved documents
    if(!sources.length){
      showAIResult('<b>No documents to search yet</b><p>Save a document in Files first, then ask about it here — or attach a file with the ＋ Files chip.</p>');
      toast('No saved documents to answer from');
      return true;
    }
    let best=null;
    for(const src of sources){
      const r=window.MSAAIEngine.ask(q,src.text);
      if(r.confident&&r.matches.length){
        const score=r.matches.length*10+r.matches[0].length;
        if(!best||score>best.score)best={src,r,score};
      }
    }
    const offlineAnswer=best?{matches:best.r.matches,confident:true}:{matches:[],confident:false};
    // learned/verified facts feed fast-triage (the ANSWER shortcut)
    const learned=learnedStore().entries;
    const verifiedState={};
    for(const e of learned)verifiedState[e.q]=e.a;

    if(!lola){
      // graceful fallback (module not loaded): plain offline answer
      if(best){
        showAIResult('<b>From your document “'+esc(best.src.title)+'”</b><p>'+best.r.matches.map(esc).join('<br>')+'</p><small class="muted">Offline answer from your saved files.</small>');
      }else{
        showAIResult('<b>No confident match in your saved documents</b><p>I searched '+sources.length+' document'+(sources.length===1?'':'s')+' offline and found no clear answer to that. Try rephrasing, or attach the specific file.</p>');
      }
      return true;
    }

    // online tier (optional): fetch only when an endpoint is configured
    let onFetchExternal=null;
    try{
      if(window.MSAAIEngine.onlineConfigured?.()){
        onFetchExternal=async(question,context)=>{
          const endpoint=localStorage.getItem('msaOneAIEndpointV1').trim();
          const ctrl=new AbortController();
          const timer=setTimeout(()=>ctrl.abort(),8000);
          try{
            const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({question,context,source:'msa-one-hybrid'}),signal:ctrl.signal});
            const data=await res.json().catch(()=>({}));
            return data.text||data.message||data.answer||'';
          }finally{clearTimeout(timer)}
        };
      }
    }catch{}

    showAIResult('<p class="muted">Thinking (LOLA loop) — offline documents'+(onFetchExternal?' + web':'')+'…</p>');
    try{
      const report=await lola.runCognitive({
        question:q,
        offlineAnswer,
        verifiedState,
        inspectable:sources.map(s=>s.id),
        frozenHypothesis:offlineAnswer.confident?{frozen_before_external:true}:{frozen_before_external:false},
        onFetchExternal
      });
      // OFFLINE LLM TIER (PR B): if the on-device model is enabled, upgrade the
      // extractive answer to a real reasoned one over ALL imported files (RAG).
      const llm=window.MSAAIOfflineLLM;
      if(llm&&llm.enabled()&&best){
        try{
          if(!llm.ready()){
            showAIResult('<p class="muted">Downloading offline LLM model (one time)…</p>');
            await llm.ensureModel((p)=>{
              if(p.phase==='download'&&p.total)showAIResult('<p class="muted">Downloading offline model… '+Math.round(100*p.loaded/p.total)+'%</p>');
            });
          }
          if(llm.ready()){
            const context=buildRAGContext(best,sources,q);
            showAIResult('<p class="muted">Reasoning with offline LLM (all imported files)…</p>');
            const res=await llm.ask({question:q,context});
            if(res.ok&&res.text&&res.text.toLowerCase()!=='i could not find that in your documents.'){
              renderCognitiveReport(report,q,esc,sources.length,best,res.text,'offline-llm',res.ms);
              llmLearn(q,res.text);
              return;
            }
          }
        }catch(e){/* fall through to the extractive answer below */}
      }
      renderCognitiveReport(report,q,esc,sources.length,best);
      // learning governor: verified, non-quarantined answers get PROMOTEd into
      // the learned store; next matching question fast-triages straight to it.
      const verdict=lola.learningGovernor({...report,transfer_passed:report.stopped_by==='ANSWERED_WITH_EVIDENCE',regression_passed:!report.quarantined});
      if(verdict==='PROMOTE'&&report.matches.length){
        learnPromote(q,report.matches.join('\n'));
        toast('Learned: '+q.slice(0,40));
      }
    }catch(e){
      showAIResult('<b>AI answered offline</b><p>'+(best?best.r.matches.map(esc).join('<br>'):'No confident match in your saved documents.')+'</p>');
    }
    return true;
  }

  // RAG context: the best match's sentences, then top matches from every other
  // imported file, up to the LLM's budget — so the model reads ALL files, not
  // just the single best one.
  function buildRAGContext(best,sources,question){
    const budget=(window.MSAAIOfflineLLM&&window.MSAAIOfflineLLM.MAX_CONTEXT_CHARS)||6000;
    const seen=new Set();const parts=[];
    const add=(title,text)=>{
      if(!text)return;
      const t=String(text).replace(/\s+/g,' ').trim();
      if(!t||seen.has(t))return;seen.add(t);
      parts.push('['+title+'] '+t);
    };
    add(best.src.title,best.r.matches.join(' '));
    for(const src of sources){
      if(src.id===best.src.id)continue;
      try{
        const r=window.MSAAIEngine.ask(question,src.text);
        if(r.confident)r.matches.slice(0,2).forEach(m=>add(src.title,m));
      }catch(e){}
    }
    let out='';
    for(const p of parts){if(out.length+p.length>budget)break;out+=(out?'\n':'')+p;}
    return out;
  }
  // LLM answers are learned under a distinct key so they don't collide with
  // extractive PROMOTEs in the verified store.
  function llmLearn(q,text){
    try{
      const key='msaOneLolaLearnedV1';
      let d={entries:[]};
      try{d=JSON.parse(localStorage.getItem(key)||'{"entries":[]}')}catch{}
      if(!Array.isArray(d.entries))d.entries=[];
      const k='[llm] '+q.toLowerCase().trim();
      d.entries=d.entries.filter(e=>e.q.toLowerCase()!==k);
      d.entries.unshift({q:k,a:text,at:Date.now(),llm:true});
      if(d.entries.length>20)d.entries=d.entries.slice(0,20);
      localStorage.setItem(key,JSON.stringify(d));
    }catch{}
  }

  function renderCognitiveReport(r,q,esc,docCount,best,llmText,sourceOverride,ms){
    const confBadge={SUPPORTED:'✓ Supported by evidence',PARTIALLY_SUPPORTED:'◐ Partially supported',UNVERIFIED:'○ Unverified — no confident match',CONTRADICTED:'✕ Contradicted'}[r.confidence]||r.confidence;
    const srcLabel=sourceOverride==='offline-llm'?'Offline LLM (all imported files)':(r.source==='hybrid'?'Offline documents + web knowledge':(r.source==='offline'?'Offline documents':(r.source==='external-quarantined'?'Web (unverified — quarantined)':'Verified knowledge')));
    const title=r.route==='ANSWER'?'From your learned answers':(best?'From your document “'+esc(best.src.title)+'”':'Answer');
    const bodyText=(llmText!==undefined?llmText:null);
    const matches=bodyText!==null?esc(bodyText):(r.matches.length?r.matches.map(esc).join('<br>'):esc('I searched '+docCount+' document'+(docCount===1?'':'s')+' offline'+(r.external_sources_used?' and the web':'')+' and found no clear answer to that. Try rephrasing, or attach the specific file.'));
    const speedNote=ms!=null?' · '+(ms/1000).toFixed(1)+'s':'';
    const quarantinedNote=r.quarantined?'<small class="muted">⚠ Web result is shown but UNVERIFIED: your documents had no internal hypothesis to check it against (LOLA research gate).</small>':'';
    const traceSteps=r.trace.map(t=>esc(t.step)).join(' · ');
    showAIResult(
      '<b>'+title+'</b>'+
      '<p>'+matches+'</p>'+
      '<small class="muted">'+esc(confBadge)+' · '+esc(srcLabel)+speedNote+' · type: '+esc(r.answer_type)+'</small>'+
      quarantinedNote+
      '<details><summary class="muted" style="cursor:pointer">How it was answered (LOLA loop)</summary><small class="muted">'+traceSteps+'</small></details>'
    );
  }

  async function routeTask(){
    const box=aiBox();
    const q=(box?.value||'').trim();
    if(!q){
      toast('Describe what you want to create or do.');
      box?.focus();
      return;
    }
    const s=q.toLowerCase();

    if(attachedContext?.text&&window.MSAAIEngine){
      const question=q.replace(/^📎.*?—\s*/,'').trim();
      const asksSummary=/^summar(y|ize|ise)\b/i.test(question)||!question;
      const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      if(asksSummary){
        const summary=window.MSAAIEngine.summarize(attachedContext.text,5);
        const kws=window.MSAAIEngine.keywords(attachedContext.text,8);
        showAIResult('<b>Offline summary of '+esc(attachedContext.label)+'</b><p>'+esc(summary)+'</p>'+(kws.length?'<div class="ai-result-kw">'+kws.map(k=>'<span>'+esc(k)+'</span>').join('')+'</div>':''));
      }else{
        const result=window.MSAAIEngine.ask(question,attachedContext.text);
        showAIResult('<b>From '+esc(attachedContext.label)+'</b><p>'+(result.matches.length?result.matches.map(esc).join('<br>'):esc(result.message||'No matching content found.'))+'</p>'+(result.message&&result.matches.length?'<small class="muted">'+esc(result.message)+'</small>':''));
      }
      toast('Answered offline from '+attachedContext.label);
      return;
    }

    if(/calendar|planner|diary|schedule|appointment|daily program/.test(s)){
      window.MSAPlanner?.open();
      toast('Opened Calendar & Daily Planner');
      return;
    }

    // No file attached. Before falling back to "create a document", answer the
    // question with the HYBRID LOLA cognitive loop (offline saved documents +
    // optional web, evidence confidence, learning) — this is also the fix for
    // the reported "AI won't answer" bug: a plain question with no attachment
    // used to just open a blank editor and show nothing.
    if(window.MSAStudio?.open){
      const asked=await askSavedDocuments(q);
      if(asked)return;
    }

    let type='document';
    if(/spreadsheet|excel|xlsx|csv|table|formula|chart/.test(s)) type='spreadsheet';
    else if(/presentation|slides|ppt|pptx|deck/.test(s)) type='presentation';
    else if(/smart html|html|web page|website|interactive report/.test(s)) type='html';
    else if(/pdf/.test(s)) type='pdf';

    if(window.MSAStudio?.open){
      window.MSAStudio.open(type);
      toast('Opened '+type+' workspace · local mode');
    }else{
      page('create');
      toast('Create workspace opened');
    }
  }

  function editProfile(){
    let saved={};
    try{saved=JSON.parse(localStorage.getItem(STORAGE_PROFILE)||'{}')}catch{}
    const current=saved.name||'My Workspace';
    const name=prompt('Workspace name',current);
    if(!name||!name.trim()) return;
    saved.name=name.trim();
    const raw=JSON.stringify(saved);localStorage.setItem(STORAGE_PROFILE,raw);window.MSAStorage?.mirror(STORAGE_PROFILE,raw);
    applyProfile();
    toast('Workspace name saved on this device');
  }

  function applyProfile(){
    let saved={};
    try{saved=JSON.parse(localStorage.getItem(STORAGE_PROFILE)||'{}')}catch{}
    if(!saved.name) return;
    const heading=document.querySelector('#me .card h2');
    if(heading) heading.textContent=saved.name;
  }

  function uiStudio(){
    page('me');
    setTimeout(()=>{
      const target=document.querySelector('.button-studio');
      target?.scrollIntoView({behavior:'smooth',block:'center'});
      toast(target?'Button Studio opened':'UI Studio is loading…');
    },80);
  }

  function runAction(action){
    switch(action){
      case 'reader': window.MSAAIReader?.open?.(); break;
      case 'converter': page('create'); toast('Offline Office export is ready: DOCX, XLSX, PPTX, PDF, CSV and HTML.'); break;
      case 'automation': openAI('Create an automation for: '); break;
      case 'files': page('files'); break;
      case 'scan': page('ai'); openPicker('image/*','environment'); break;
      case 'image': page('ai'); openPicker('image/*'); break;
      case 'voice': page('ai'); voice(); break;
      case 'start': routeTask(); break;
      case 'profile': editProfile(); break;
      case 'ui-studio': uiStudio(); break;
      case 'backup': window.MSAStorage?.downloadBackup(); toast('Workspace backup prepared'); break;
      case 'restore': window.MSAStorage?.importBackup(); break;
      case 'advanced-ai': openAI('Help me with: '); break;
      case 'presenter': window.MSAAIReader?.open?.(); break;
      case 'templates': window.MSALibrary?.open(); break;
      case 'dashboard-template': window.MSALibrary?.openTemplate('html-dashboard'); break;
      case 'library': window.MSALibrary?.open(); break;
      case 'premium-lens': page('ai'); toast('AI workspace opened'); break;
      default: break;
    }
  }

  function wire(){
    document.querySelectorAll('[data-msa-action]').forEach(el=>{
      if(el.dataset.msaWired) return;
      el.dataset.msaWired='1';
      el.addEventListener('click',()=>runAction(el.dataset.msaAction));
    });
    applyProfile();

    const lang=document.querySelector('#lang');
    if(lang && !lang.dataset.msaWired){
      lang.dataset.msaWired='1';
      const saved=localStorage.getItem('msaOneLanguage');
      if(saved==='EN'||saved==='MY') lang.value=saved;
      lang.addEventListener('change',()=>{
        localStorage.setItem('msaOneLanguage',lang.value);window.MSAStorage?.mirror('msaOneLanguage',lang.value);
        toast(lang.value==='MY'?'Bahasa Melayu dipilih':'English selected');
      });
    }
  }

  window.MSAActions={wire,runAction,routeTask,openPicker,voice,editProfile,uiStudio};
  document.addEventListener('DOMContentLoaded',wire);
  setTimeout(wire,500);
})();