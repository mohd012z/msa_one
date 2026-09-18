(()=> {
  const KEY='msaHelperV1';
  let mounted=false;
  const HELP={
    home:{icon:'⌂',title:'Home',intro:'Choose what you want to accomplish. You do not need to know the file format first.',steps:[
      {text:'Create something new',target:'#home .tile'},
      {text:'Open an existing Office file',target:'.nav button:nth-child(2)'},
      {text:'Use a ready-made template',target:'[data-library-home]'},
      {text:'Plan work or write a diary entry',target:'[data-calendar-home]'}
    ],examples:['Create a monthly report','Open an Excel workbook','Start from a meeting-minutes template'],trouble:['If you are unsure where to start, open the Built-in Library.','Your recent drafts are under Files.']},
    files:{icon:'🗂️',title:'Files',intro:'Open saved projects or bring in a Word, Excel or PowerPoint file.',steps:[
      {text:'Open DOCX, XLSX or PPTX',target:'[data-open-office]'},
      {text:'Search your saved drafts',target:'.files-search'},
      {text:'Tap a project to continue editing',target:'.file-open'}
    ],examples:['Open a Word report','Find a saved spreadsheet','Duplicate a project before major edits'],trouble:['If an Office file cannot open, try saving it again in a current Office format.','Very large media may be resized or skipped to protect local storage.']},
    create:{icon:'＋',title:'Create',intro:'Pick the result you want. MSA One will open the matching local workspace.',steps:[
      {text:'Choose Document, Spreadsheet, Presentation, PDF or Smart HTML',target:'#create .tile'},
      {text:'Use the Built-in Library when you want a ready-made starting point',target:'[data-library-home]'}
    ],examples:['Professional report','Budget tracker','Training deck','Offline HTML dashboard'],trouble:['You can change workspace type from the Create Studio tabs.','Drafts autosave locally as you work.']},
    document:{icon:'📄',title:'Document Helper',intro:'Write directly, import DOCX/HTML/TXT, add tables or images, then export DOCX or PDF.',steps:[
      {text:'Type or paste content in the document area',target:'[data-doc]'},
      {text:'Use H1/H2, bold, italic or underline for structure',target:'[data-block="H1"]'},
      {text:'Insert a table when you need structured information',target:'[data-table]'},
      {text:'Insert an image from the device',target:'[data-doc-image]'},
      {text:'Use Export to create DOCX',target:'.studio-top [data-export]'}
    ],examples:['Professional Report','Meeting Minutes','Formal Letter','Procedure / SOP'],trouble:['If a complex DOCX looks different, simplify floating objects or advanced Word layouts.','Large images are resized locally to keep the project usable.']},
    spreadsheet:{icon:'📊',title:'Spreadsheet Helper',intro:'Enter text, numbers or formulas. Work across several sheets and export XLSX or CSV.',steps:[
      {text:'Tap a cell and type a value',target:'[data-cell]'},
      {text:'Start formulas with =',target:'[data-formula-bar]'},
      {text:'Add or switch worksheets with the sheet tabs',target:'.sheet-tabs'},
      {text:'Use Chart for a quick visual preview',target:'[data-chart]'},
      {text:'Export the workbook as XLSX',target:'.studio-top [data-export]'}
    ],examples:['=C2*D2','=SUM(E2:E20)','=AVERAGE(C2:C12)','=MIN(C2:C20)','=MAX(C2:C20)'],trouble:['If a formula shows an error, check the cell references and supported functions.','Macros, pivot tables and advanced Excel objects are not fully supported yet.']},
    presentation:{icon:'📽️',title:'Presentation Helper',intro:'Build slides, choose a layout, add images and export a PPTX.',steps:[
      {text:'Add a slide',target:'[data-add-slide]'},
      {text:'Choose the slide layout',target:'[data-slide-layout]'},
      {text:'Write the title and key message',target:'[data-slide-title]'},
      {text:'Add an image when needed',target:'[data-slide-image]'},
      {text:'Export as PowerPoint',target:'.studio-top [data-export]'}
    ],examples:['Project Update','Training Deck','Proposal Deck'],trouble:['Animations, SmartArt, video and advanced master layouts are not fully preserved.','Keep slide text concise for better mobile editing.']},
    pdf:{icon:'📕',title:'PDF Helper',intro:'Use this workspace for fast text-based PDFs. Type or paste content, then export.',steps:[
      {text:'Enter PDF text',target:'[data-pdf-text]'},
      {text:'Set a useful file title',target:'.studio-title input'},
      {text:'Export the PDF',target:'.studio-top [data-export]'}
    ],examples:['PDF Notes','Checklist','Simple text report'],trouble:['This PDF workspace is text-focused; complex source PDFs are not reconstructed here.']},
    html:{icon:'🌐',title:'Smart HTML Helper',intro:'Edit HTML source and see the result in a safe preview before exporting.',steps:[
      {text:'Edit HTML in the source panel',target:'[data-code]'},
      {text:'Check the live sandbox preview',target:'[data-preview]'},
      {text:'Export the finished HTML',target:'.studio-top [data-export]'}
    ],examples:['Knowledge Guide','Mini Dashboard','Offline Form'],trouble:['Scripts are isolated in the preview sandbox.','Keep important layouts responsive for phone and desktop use.']},
    ai:{icon:'✦',title:'AI Workspace Helper',intro:'Describe the task in normal words. Local routing can open the right workspace even without an online AI model.',steps:[
      {text:'Describe what you want to create',target:'#ai textarea'},
      {text:'Attach files or images when useful',target:'#ai [data-msa-action="files"]'},
      {text:'Use Voice if your device supports speech recognition',target:'#ai [data-msa-action="voice"]'},
      {text:'Press Start to route the task',target:'#ai [data-msa-action="start"]'}
    ],examples:['Create a spreadsheet for monthly expenses','Make a presentation for a training session','Open my planner'],trouble:['Local routing is not the same as a connected generative AI model.','If voice is unavailable, type the request instead.']},
    me:{icon:'◉',title:'Workspace Helper',intro:'Manage your profile, appearance, backups and built-in tools here.',steps:[
      {text:'Back up local work regularly',target:'[data-msa-action="backup"]'},
      {text:'Restore an MSA One backup when needed',target:'[data-msa-action="restore"]'},
      {text:'Open the Built-in Function Library',target:'[data-library-me]'},
      {text:'Adjust button appearance in UI Studio',target:'[data-msa-action="ui-studio"]'}
    ],examples:['Back up before reinstalling','Change workspace name','Review built-in capabilities'],trouble:['Clearing app data or uninstalling can remove unsynchronized local drafts.']},
    library:{icon:'🧰',title:'Library Helper',intro:'Search reusable modules and templates. Use a template to create an editable project instantly.',steps:[
      {text:'Search for a task or format',target:'.library-search'},
      {text:'Open a module to launch its main function',target:'.library-module button'},
      {text:'Choose Use on a template to create a project',target:'.library-template'}
    ],examples:['report','budget','training','dashboard','checklist'],trouble:['READY means the required local module is loaded.','CHECK means one of that module’s dependencies is not currently available.']},
    planner:{icon:'📅',title:'Planner Helper',intro:'Use Daily Program for scheduled activities, Plan for future work, Diary for records and Note for quick information.',steps:[{text:'Choose a day from the calendar',target:'#planner [data-grid]'},{text:'Add a new planner entry',target:'#planner [data-add]'},{text:'Choose Daily Program, Plan, Diary or Note',target:'#planner [data-kind]'},{text:'Save the entry when complete',target:'#planner [data-save]'}],examples:['Daily Program = scheduled activity','Plan = future action','Diary = record what happened','Note = quick reference'],trouble:['Planner entries are stored locally and included in workspace backups.']}
  };

  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
  function save(v){const raw=JSON.stringify(v);try{localStorage.setItem(KEY,raw)}catch{}globalThis.MSAStorage?.mirror(KEY,raw)}
  function state(){return {enabled:true,welcomeSeen:false,completed:{},dismissed:{},...load()}}
  function patch(x){const s={...state(),...x};save(s);return s}
  function context(){
    if(document.querySelector('.studio-overlay.on')){
      const t=document.querySelector('.studio-type.on')?.dataset.type;
      return HELP[t]?t:'create';
    }
    if(document.querySelector('.planner-overlay.on,.planner-shell.on,.planner-modal.on'))return'planner';
    const page=document.querySelector('.page.on')?.id||'home';
    return HELP[page]?page:'home';
  }
  function current(){const id=context();return{id,...HELP[id]}}
  function el(tag,cls=''){const x=document.createElement(tag);if(cls)x.className=cls;return x}
  function ensure(){
    if(!document.querySelector('[data-helper-fab]')){
      const b=el('button','helper-fab');b.setAttribute('data-helper-fab','');b.setAttribute('aria-label','Help with this screen');b.innerHTML='?';b.onclick=()=>open();document.body.appendChild(b);
    }
    if(!document.querySelector('[data-helper-sheet]')){
      const shell=el('div','helper-shell');shell.setAttribute('data-helper-sheet','');
      shell.innerHTML='<div class="helper-scrim" data-helper-close></div><section class="helper-sheet" role="dialog" aria-modal="true" aria-label="MSA One Helper"><div class="helper-handle"></div><header><div class="helper-icon">?</div><div class="grow"><b data-helper-title>Helper</b><small data-helper-intro></small></div><button class="helper-x" data-helper-close>×</button></header><div class="helper-tabs"><button data-help-tab="guide" class="on">Guide</button><button data-help-tab="examples">Examples</button><button data-help-tab="trouble">Troubleshoot</button></div><div class="helper-content" data-helper-content></div><footer><button data-helper-library>Built-in Library</button><button data-helper-done>Got it</button></footer></section>';
      document.body.appendChild(shell);
      shell.querySelectorAll('[data-helper-close]').forEach(x=>x.onclick=close);
      shell.querySelector('[data-helper-library]').onclick=()=>{close();globalThis.MSALibrary?.open()};
      shell.querySelector('[data-helper-done]').onclick=()=>{complete(context());close()};
      shell.querySelectorAll('[data-help-tab]').forEach(b=>b.onclick=()=>renderTab(b.dataset.helpTab));
    }
    ensureStatus();
  }
  function ensureStatus(){
    const top=document.querySelector('.studio-overlay.on .studio-top');
    if(!top)return;
    let bar=document.querySelector('.studio-overlay.on .helper-status');
    if(!bar){
      bar=el('button','helper-status');bar.type='button';bar.onclick=()=>open();top.insertAdjacentElement('afterend',bar);
    }
    const c=current();bar.innerHTML='<span>Local draft · autosave enabled</span><b>Need help with '+c.title.replace(' Helper','')+'?</b><strong>?</strong>';
  }
  function renderTab(tab='guide'){
    const c=current(),box=document.querySelector('[data-helper-content]');if(!box)return;
    document.querySelectorAll('[data-help-tab]').forEach(b=>b.classList.toggle('on',b.dataset.helpTab===tab));
    if(tab==='guide'){
      const steps=c.steps||[];
      box.innerHTML=steps.length?'<ol class="helper-steps">'+steps.map((s,i)=>'<li><button data-show-index="'+i+'"><span>'+(i+1)+'</span><div>'+escapeHTML(s.text)+'</div><strong>Show me</strong></button></li>').join('')+'</ol>':'<div class="helper-empty">Use the examples below for a quick starting point.</div>';
      box.querySelectorAll('[data-show-index]').forEach(b=>b.onclick=()=>showMe(steps[+b.dataset.showIndex]?.target,steps[+b.dataset.showIndex]?.text));
    }else if(tab==='examples'){
      box.innerHTML='<div class="helper-example-list">'+(c.examples||[]).map(x=>'<button data-copy-example="'+escapeHTML(x)+'"><span>✦</span><b>'+escapeHTML(x)+'</b><small>Tap to copy</small></button>').join('')+'</div>';
      box.querySelectorAll('[data-copy-example]').forEach(b=>b.onclick=async()=>{const t=b.dataset.copyExample;try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(t);notify('Copied: '+t,'success')}catch{notify('Example: '+t,'info')}});
    }else{
      box.innerHTML='<div class="helper-trouble">'+(c.trouble||[]).map((x,i)=>'<article><span>'+(i+1)+'</span><p>'+escapeHTML(x)+'</p></article>').join('')+'</div>';
    }
  }
  function open(tab='guide'){
    ensure();const c=current(),shell=document.querySelector('[data-helper-sheet]');
    shell.querySelector('[data-helper-title]').textContent=c.title;
    shell.querySelector('[data-helper-intro]').textContent=c.intro;
    shell.querySelector('.helper-icon').textContent=c.icon;
    shell.classList.add('on');renderTab(tab);
  }
  function close(){document.querySelector('[data-helper-sheet]')?.classList.remove('on');clearHighlight()}
  function complete(id){const s=state();s.completed={...(s.completed||{}),[id]:true};save(s)}
  function clearHighlight(){document.querySelectorAll('.helper-highlight').forEach(x=>x.classList.remove('helper-highlight'));document.querySelector('[data-helper-pointer]')?.remove()}
  function showMe(selector,text){
    clearHighlight();close();
    const target=selector&&document.querySelector(selector);
    const visible=target&&target.getClientRects().length>0&&getComputedStyle(target).visibility!=='hidden';
    if(!visible){notify('That control is not visible on this screen yet. Open the related workspace first.','info');return}
    target.classList.add('helper-highlight');target.scrollIntoView({behavior:'smooth',block:'center'});
    const p=el('button','helper-pointer');p.setAttribute('data-helper-pointer','');p.textContent=text||'Use this control';p.onclick=clearHighlight;document.body.appendChild(p);
    setTimeout(clearHighlight,6500);
  }
  function notify(message,kind='info',actions=[]){
    let n=document.querySelector('[data-helper-notice]');
    if(!n){n=el('div','helper-notice');n.setAttribute('data-helper-notice','');document.body.appendChild(n)}
    n.className='helper-notice '+kind;
    n.innerHTML='<div><b>'+(kind==='error'?'Couldn’t complete that':kind==='success'?'Done':'MSA One')+'</b><span>'+escapeHTML(message)+'</span></div>'+(actions.length?'<section>'+actions.map((a,i)=>'<button data-notice-action="'+i+'">'+escapeHTML(a.label)+'</button>').join('')+'</section>':'');
    n.classList.add('on');n.querySelectorAll('[data-notice-action]').forEach(b=>b.onclick=()=>{actions[+b.dataset.noticeAction]?.run?.();n.classList.remove('on')});
    clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.classList.remove('on'),kind==='error'?6000:3200);
  }
  function error(message,actions=[]){notify(message,'error',actions)}
  function success(message,actions=[]){notify(message,'success',actions)}
  function escapeHTML(s=''){return globalThis.MSACore?.escapeHTML(s)??String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function welcome(){
    const s=state();if(s.welcomeSeen||s.enabled===false)return;
    s.welcomeSeen=true;save(s);
    setTimeout(()=>notify('New here? Tap ? anytime for help with the screen you are using.','info',[{label:'Show help',run:()=>open()}]),2200);
  }
  function nudgeCurrent(){
    const id=context();if(id==='home'||id==='me')return;
    const s=state();s.nudged=s.nudged||{};
    if(s.enabled===false||s.completed?.[id]||s.nudged[id])return;
    s.nudged[id]=true;save(s);
    const c=HELP[id];setTimeout(()=>notify('First time in '+c.title.replace(' Helper','')+'? I can show you the important controls.','info',[{label:'Show help',run:()=>open()}]),350);
  }
  function refresh(){ensure();ensureStatus();nudgeCurrent()}
  function mount(){
    ensure();
    if(mounted){refresh();return}
    mounted=true;welcome();
    document.addEventListener('click',e=>{if(e.target.closest('.studio-type,.nav button,[data-planner-open],[data-library-home],[data-library-me]'))setTimeout(refresh,60)});
    window.addEventListener('resize',refresh,{passive:true});
  }

  globalThis.MSAHelper={contexts:HELP,state,current,open,close,complete,showMe,notify,error,success,nudgeCurrent,refresh,mount};
  if(typeof document!=='undefined'){
    document.addEventListener('DOMContentLoaded',mount);
    setTimeout(mount,800);
  }
})();