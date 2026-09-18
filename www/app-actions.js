(()=> {
  const STORAGE_PROFILE='msaOneProfileV1';
  let picker=null;

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
    picker.onchange=()=>{
      const files=[...(picker.files||[])];
      if(!files.length) return;
      const box=aiBox();
      const label=files.map(f=>f.name).join(', ');
      if(box) box.value=(box.value?box.value+'\n':'')+'Attached: '+label;
      toast(files.length+' file'+(files.length===1?'':'s')+' selected');
    };
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
    r.start();
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
    localStorage.setItem(STORAGE_PROFILE,JSON.stringify(saved));
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
      case 'reader': openAI('Read and present the selected file or pasted text.'); break;
      case 'converter': page('create'); toast('Offline Office export is ready: DOCX, XLSX, PPTX, PDF, CSV and HTML.'); break;
      case 'automation': openAI('Create an automation for: '); break;
      case 'files': page('files'); break;
      case 'scan': page('ai'); openPicker('image/*','environment'); break;
      case 'image': page('ai'); openPicker('image/*'); break;
      case 'voice': page('ai'); voice(); break;
      case 'start': routeTask(); break;
      case 'profile': editProfile(); break;
      case 'ui-studio': uiStudio(); break;\n      case 'backup': window.MSAStorage?.downloadBackup(); toast('Workspace backup prepared'); break;\n      case 'restore': window.MSAStorage?.importBackup(); break;
      case 'advanced-ai': openAI('Help me with: '); break;
      case 'presenter': openAI('Prepare presenter notes in Bahasa Melayu for: '); break;
      case 'templates': page('create'); break;
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
        localStorage.setItem('msaOneLanguage',lang.value);
        toast(lang.value==='MY'?'Bahasa Melayu dipilih':'English selected');
      });
    }
  }

  window.MSAActions={wire,runAction,routeTask,openPicker,voice,editProfile,uiStudio};
  document.addEventListener('DOMContentLoaded',wire);
  setTimeout(wire,500);
})();