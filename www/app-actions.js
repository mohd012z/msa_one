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

  function routeTask(){
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
      case 'companion': globalThis.MSACompanion?.open?.(); break;
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