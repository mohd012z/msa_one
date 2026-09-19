(()=>{'use strict';
  /**
   * Offline-first document intelligence: extractive summarization, keyword
   * extraction and question answering computed entirely on-device from real
   * document text (no network, no API key). If MSAAIEngine.onlineConfigured()
   * ever returns true (an online endpoint saved via Settings), ask() reports
   * that a connected answer is available; until then it says so honestly
   * instead of pretending to reason like a full conversational model.
   */
  const ONLINE_ENDPOINT_KEY='msaOneAIEndpointV1';
  const STOPWORDS=new Set([
    'the','a','an','and','or','but','if','of','to','in','on','for','is','are','was','were','be','been','being',
    'this','that','these','those','it','its','as','at','by','with','from','into','than','then','so','not','no',
    'yang','dan','atau','tetapi','jika','di','ke','untuk','adalah','ialah','ini','itu','dengan','pada','dari','akan','telah'
  ]);

  function splitSentences(text){
    return String(text||'').replace(/\s+/g,' ').trim()
      .split(/(?<=[.!?])\s+(?=[A-Z0-9À-ɏ])|\n+/)
      .map(s=>s.trim()).filter(Boolean);
  }
  function words(text){
    return String(text||'').toLowerCase().match(/[a-z0-9À-ɏ]+/g)||[];
  }
  function stats(text){
    const w=words(text),sentences=splitSentences(text);
    return{
      characters:String(text||'').length,
      words:w.length,
      sentences:sentences.length,
      readingMinutes:Math.max(1,Math.round(w.length/200))
    };
  }
  function keywords(text,n=8){
    const freq=new Map();
    for(const w of words(text)){
      if(w.length<3||STOPWORDS.has(w))continue;
      freq.set(w,(freq.get(w)||0)+1);
    }
    return[...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([w])=>w);
  }
  /** Extractive summary: scores sentences by frequency of their significant words, keeps original order. */
  function summarize(text,maxSentences=5){
    const sentences=splitSentences(text);
    if(sentences.length<=maxSentences)return sentences.join(' ');
    const freq=new Map();
    for(const w of words(text)){if(w.length<3||STOPWORDS.has(w))continue;freq.set(w,(freq.get(w)||0)+1)}
    const scored=sentences.map((s,i)=>{
      const sw=words(s);
      const score=sw.reduce((sum,w)=>sum+(freq.get(w)||0),0)/Math.max(1,sw.length);
      return{s,i,score};
    });
    const top=scored.sort((a,b)=>b.score-a.score).slice(0,maxSentences).sort((a,b)=>a.i-b.i);
    return top.map(x=>x.s).join(' ');
  }
  /** Offline retrieval-style Q&A: ranks sentences by term overlap with the question. Not full reasoning — an honest local lookup. */
  function answer(question,text,maxSentences=3){
    const qWords=new Set(words(question).filter(w=>w.length>2&&!STOPWORDS.has(w)));
    if(!qWords.size)return{matches:[],confident:false};
    const sentences=splitSentences(text);
    const scored=sentences.map((s,i)=>{
      const sw=words(s);
      const overlap=sw.filter(w=>qWords.has(w)).length;
      return{s,i,score:overlap};
    }).filter(x=>x.score>0);
    scored.sort((a,b)=>b.score-a.score||a.i-b.i);
    const matches=scored.slice(0,maxSentences).sort((a,b)=>a.i-b.i).map(x=>x.s);
    return{matches,confident:matches.length>0};
  }
  function onlineConfigured(){
    try{return!!(localStorage.getItem(ONLINE_ENDPOINT_KEY)||'').trim()}catch{return false}
  }
  function setOnlineEndpoint(url){
    try{
      const v=String(url||'').trim();
      if(v)localStorage.setItem(ONLINE_ENDPOINT_KEY,v);else localStorage.removeItem(ONLINE_ENDPOINT_KEY);
      globalThis.MSAStorage?.mirror?.(ONLINE_ENDPOINT_KEY,v);
      return true;
    }catch{return false}
  }
  /** Offline-first: always computes the local answer; only reports whether a connected upgrade is available. */
  function ask(question,text){
    const local=answer(question,text);
    const online=onlineConfigured();
    if(local.confident)return{...local,source:'offline'};
    return{
      matches:local.matches,
      confident:false,
      source:online?'online-needed':'offline-only',
      message:online
        ?'Offline search found no confident match — connected AI is configured and would be used here.'
        :'Offline search found no confident match. Connect an AI key in Settings to enable deeper answers.'
    };
  }

  function plainFromProject(project){
    if(!project)return'';
    const type=project.type,content=project.content;
    if(type==='document'||type==='html')return globalThis.MSACore?.textFromHTML?.(content||'')||String(content||'').replace(/<[^>]+>/g,' ');
    if(type==='spreadsheet'){
      try{
        const data=JSON.parse(content||'{}'),sheets=data.sheets||[];
        return sheets.map(sh=>(sh.name||'Sheet')+'\n'+(sh.rows||[]).map(r=>r.join(' ')).join('\n')).join('\n\n');
      }catch{return''}
    }
    if(type==='presentation'){
      try{
        const data=JSON.parse(content||'{}'),slides=Array.isArray(data)?data:(data.slides||[]);
        return slides.map((sl,i)=>'Slide '+(i+1)+': '+(sl.title||'')+'\n'+(sl.body||'')).join('\n\n');
      }catch{return''}
    }
    if(type==='pdf'){
      const raw=String(content||'');
      if(raw.startsWith('blob:')||raw.startsWith('native-pdf:'))return'';
      return raw;
    }
    return'';
  }
  /** Extracts real text from any project. Binary/scanned PDFs have no offline text layer — callers should show pdfTextUnavailable. */
  function extractProjectText(project){
    const text=plainFromProject(project);
    return{text,pdfTextUnavailable:project?.type==='pdf'&&!text};
  }
  /** Extracts real text from a freshly picked file (not yet imported as a project), reusing the Office import engine. */
  async function extractFileText(file){
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(['txt','csv','tsv','md'].includes(ext))return{text:await file.text(),pdfTextUnavailable:false};
    if(['html','htm'].includes(ext))return{text:globalThis.MSACore?.textFromHTML?.(await file.text())||'',pdfTextUnavailable:false};
    if(!globalThis.MSAImport)return{text:'',pdfTextUnavailable:false};
    if(ext==='pdf')return{text:'',pdfTextUnavailable:true};
    const imported=await globalThis.MSAImport.readFile(file);
    if(imported.type==='document')return{text:globalThis.MSACore?.textFromHTML?.(imported.html||'')||'',pdfTextUnavailable:false};
    if(imported.type==='spreadsheet')return{text:plainFromProject({type:'spreadsheet',content:JSON.stringify({sheets:imported.sheets})}),pdfTextUnavailable:false};
    if(imported.type==='presentation')return{text:plainFromProject({type:'presentation',content:JSON.stringify({slides:imported.slides})}),pdfTextUnavailable:false};
    return{text:'',pdfTextUnavailable:false};
  }

  // --- Speech reader (offline, on-device TTS via the Web Speech API) ---
  let utterance=null;
  function speechAvailable(){return typeof speechSynthesis!=='undefined'}
  function voicesFor(lang='en'){
    if(!speechAvailable())return[];
    const prefix=lang.slice(0,2).toLowerCase();
    return speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith(prefix));
  }
  function readAloud(text,{lang='en-US',rate=1,voiceName=''}={}){
    if(!speechAvailable())return{started:false,reason:'Text-to-speech is not supported by this WebView/browser.'};
    stopReading();
    utterance=new SpeechSynthesisUtterance(String(text||'').slice(0,32000));
    utterance.lang=lang;
    utterance.rate=Math.max(0.5,Math.min(2,rate));
    const voices=voicesFor(lang);
    const picked=voiceName?voices.find(v=>v.name===voiceName):voices[0];
    if(picked)utterance.voice=picked;
    const matched=!!picked;
    speechSynthesis.speak(utterance);
    return{started:true,matchedVoice:matched,reason:matched?'':'No on-device voice installed for this language — using the system default voice instead.'};
  }
  function pauseReading(){if(speechAvailable())speechSynthesis.pause()}
  function resumeReading(){if(speechAvailable())speechSynthesis.resume()}
  function stopReading(){if(speechAvailable())speechSynthesis.cancel();utterance=null}
  function isReading(){return speechAvailable()&&speechSynthesis.speaking}

  globalThis.MSAAIEngine={
    stats,keywords,summarize,answer,ask,
    onlineConfigured,setOnlineEndpoint,
    extractProjectText,extractFileText,
    readAloud,pauseReading,resumeReading,stopReading,isReading,voicesFor,speechAvailable
  };
})();
