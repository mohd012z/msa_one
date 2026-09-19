(()=>{'use strict';
  /** Real "AI Reader & Presenter": extracts actual document text (offline) and reads it aloud with on-device TTS. */
  let root=null,currentText='',currentTitle='',lang='en-US';

  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function ensure(){
    if(root)return;
    root=document.createElement('section');
    root.className='ai-reader-overlay';
    document.body.appendChild(root);
  }

  function pickerList(){
    const projects=(globalThis.MSAProjects?.all?.()||[]).slice(0,30);
    return projects.map(p=>'<button class="ai-reader-pick" data-open-project="'+esc(p.id)+'"><span>'+({document:'📄',spreadsheet:'📊',presentation:'📽️',pdf:'📕',html:'🌐'}[p.type]||'◇')+'</span><b>'+esc(p.title||'Untitled')+'</b></button>').join('')
      ||'<p class="muted">No saved documents yet. Attach a file or create one in Files.</p>';
  }

  function openPicker(){
    ensure();
    root.innerHTML='<div class="ai-reader-sheet"><header><b>AI Reader &amp; Presenter</b><button data-close aria-label="Close">✕</button></header>'+
      '<p class="muted">Choose what to read. Everything below runs fully offline on this device.</p>'+
      '<button class="ai-reader-attach" data-attach>📎 Attach a file (Word, Excel, PowerPoint, PDF text, TXT, CSV, HTML)</button>'+
      '<div class="ai-reader-list">'+pickerList()+'</div></div>';
    root.classList.add('on');
    root.querySelector('[data-close]').onclick=close;
    root.querySelectorAll('[data-open-project]').forEach(b=>b.onclick=()=>openProject(b.dataset.openProject));
    root.querySelector('[data-attach]').onclick=attach;
  }

  function openProject(id){
    const project=globalThis.MSAProjects?.get?.(id);
    if(!project)return;
    const{text,pdfTextUnavailable}=globalThis.MSAAIEngine.extractProjectText(project);
    if(pdfTextUnavailable){
      renderUnavailable(project.title,'This PDF has no offline text layer (it is a scanned/imported PDF). Open it in the PDF viewer instead, or use an editable text PDF.');
      return;
    }
    if(!text.trim()){renderUnavailable(project.title,'This document has no readable text yet.');return}
    renderReader(project.title||'Untitled',text);
  }

  function attach(){
    const input=document.createElement('input');
    input.type='file';input.hidden=true;
    input.accept='.docx,.xlsx,.pptx,.pdf,.txt,.csv,.tsv,.html,.htm,.md';
    input.onchange=async()=>{
      const file=input.files?.[0];input.remove();
      if(!file)return;
      root.querySelector('.ai-reader-sheet')?.insertAdjacentHTML('beforeend','<p class="ai-reader-status" data-status>Reading '+esc(file.name)+'…</p>');
      try{
        const{text,pdfTextUnavailable}=await globalThis.MSAAIEngine.extractFileText(file);
        if(pdfTextUnavailable){renderUnavailable(file.name,'This PDF has no offline text layer. MSA One cannot extract text from a scanned/binary PDF without a connected OCR service.');return}
        if(!text.trim()){renderUnavailable(file.name,'No readable text was found in this file.');return}
        renderReader(file.name,text);
      }catch(e){renderUnavailable(file.name,'Could not read this file: '+e.message)}
    };
    document.body.appendChild(input);input.click();
  }

  function renderUnavailable(title,message){
    ensure();
    root.innerHTML='<div class="ai-reader-sheet"><header><b>'+esc(title||'AI Reader')+'</b><button data-close aria-label="Close">✕</button></header><p class="muted">'+esc(message)+'</p><button class="ai-reader-back" data-back>‹ Choose another document</button></div>';
    root.querySelector('[data-close]').onclick=close;
    root.querySelector('[data-back]').onclick=openPicker;
  }

  const STRINGS={
    'en-US':{play:'▶ Read aloud',stats:(w,s,m)=>w+' words · '+s+' sentences · ~'+m+' min read',summaryTitle:'Offline summary',askTitle:'Ask about this document',askPlaceholder:'e.g. What is the total? Who is responsible?',ask:'Ask',back:'‹ Choose another document',noVoice:'No on-device voice installed for this language — using the system default voice instead.'},
    'ms-MY':{play:'▶ Baca dengan kuat',stats:(w,s,m)=>w+' perkataan · '+s+' ayat · ~'+m+' minit membaca',summaryTitle:'Ringkasan luar talian',askTitle:'Tanya tentang dokumen ini',askPlaceholder:'cth. Berapakah jumlah keseluruhan? Siapa yang bertanggungjawab?',ask:'Tanya',back:'‹ Pilih dokumen lain',noVoice:'Tiada suara peranti untuk bahasa ini — menggunakan suara lalai sistem.'}
  };

  function renderReader(title,text){
    currentText=text;currentTitle=title;
    ensure();
    const s=globalThis.MSAAIEngine.stats(text);
    const kws=globalThis.MSAAIEngine.keywords(text,8);
    const summary=globalThis.MSAAIEngine.summarize(text,5);
    const savedLang=(localStorage.getItem('msaOneLanguage')==='MY')?'ms-MY':'en-US';
    lang=savedLang;
    const t=STRINGS[lang]||STRINGS['en-US'];
    root.innerHTML='<div class="ai-reader-sheet"><header><b>'+esc(title)+'</b><button data-close aria-label="Close">✕</button></header>'+
      '<div class="ai-reader-stats">'+t.stats(s.words,s.sentences,s.readingMinutes)+'</div>'+
      '<div class="ai-reader-controls">'+
        '<select data-lang><option value="en-US"'+(lang==='en-US'?' selected':'')+'>English</option><option value="ms-MY"'+(lang==='ms-MY'?' selected':'')+'>Bahasa Melayu</option></select>'+
        '<button data-play>'+t.play+'</button><button data-pause>⏸</button><button data-stop>⏹</button>'+
      '</div><p class="ai-reader-note" data-voice-note></p>'+
      (kws.length?'<div class="ai-reader-keywords">'+kws.map(k=>'<span>'+esc(k)+'</span>').join('')+'</div>':'')+
      '<h3>'+t.summaryTitle+'</h3><p class="ai-reader-summary">'+esc(summary)+'</p>'+
      '<h3>'+t.askTitle+'</h3><div class="ai-reader-ask"><input data-question placeholder="'+esc(t.askPlaceholder)+'"><button data-ask>'+t.ask+'</button></div>'+
      '<div class="ai-reader-answer" data-answer></div>'+
      '<button class="ai-reader-back" data-back>'+t.back+'</button></div>';
    root.classList.add('on');
    root.querySelector('[data-close]').onclick=close;
    root.querySelector('[data-back]').onclick=()=>{globalThis.MSAAIEngine.stopReading();openPicker()};
    root.querySelector('[data-lang]').onchange=e=>{
      globalThis.MSAAIEngine.stopReading();
      localStorage.setItem('msaOneLanguage',e.target.value==='ms-MY'?'MY':'EN');
      globalThis.MSAStorage?.mirror?.('msaOneLanguage',e.target.value==='ms-MY'?'MY':'EN');
      renderReader(currentTitle,currentText);
    };
    root.querySelector('[data-play]').onclick=()=>{
      const result=globalThis.MSAAIEngine.readAloud(currentText,{lang});
      const note=root.querySelector('[data-voice-note]');
      if(note)note.textContent=result.started?result.reason:result.reason;
    };
    root.querySelector('[data-pause]').onclick=()=>globalThis.MSAAIEngine.pauseReading();
    root.querySelector('[data-stop]').onclick=()=>globalThis.MSAAIEngine.stopReading();
    root.querySelector('[data-ask]').onclick=()=>{
      const q=root.querySelector('[data-question]').value.trim();
      const out=root.querySelector('[data-answer]');
      if(!q){out.textContent='';return}
      const result=globalThis.MSAAIEngine.ask(q,currentText);
      out.innerHTML=result.matches.length
        ?'<b>From the document:</b><br>'+result.matches.map(m=>esc(m)).join('<br>')+(result.message?'<br><small class="muted">'+esc(result.message)+'</small>':'')
        :'<small class="muted">'+esc(result.message||'No matching content found in this document.')+'</small>';
    };
  }

  function close(){
    globalThis.MSAAIEngine?.stopReading?.();
    root?.classList.remove('on');
  }

  function open(projectId){
    if(!globalThis.MSAAIEngine){console.warn('MSAAIEngine not loaded');return}
    if(projectId)openProject(projectId);else openPicker();
  }

  globalThis.MSAAIReader={open,close};
})();
