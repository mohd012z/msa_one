(()=> {
  const MODULES=[
    {id:'core',icon:'🧩',name:'Core SDK',desc:'Shared helpers, file picking, downloads, media resize and event utilities',requires:['MSACore','MSAMedia']},
    {id:'document',icon:'📄',name:'Document',desc:'Rich text, tables, images, DOCX/PDF import-export',requires:['MSAStudio','MSAOffice','MSAImport']},
    {id:'spreadsheet',icon:'📊',name:'Spreadsheet',desc:'Multi-sheet grid, formulas, charts, XLSX/CSV round trip',requires:['MSAStudio','MSAOffice','MSAImport','MSAFormula']},
    {id:'presentation',icon:'📽️',name:'Presentation',desc:'Slides, layouts, images, PPTX import-export',requires:['MSAStudio','MSAOffice','MSAImport']},
    {id:'pdf',icon:'📕',name:'PDF',desc:'Offline text PDF creation and export',requires:['MSAStudio','MSAOffice']},
    {id:'html',icon:'🌐',name:'Smart HTML',desc:'Source editor, sandbox preview and HTML export',requires:['MSAStudio']},
    {id:'files',icon:'🗂️',name:'Files',desc:'Local drafts plus direct DOCX/XLSX/PPTX opening',requires:['MSAFiles','MSAImport']},
    {id:'storage',icon:'💾',name:'Storage & Backup',desc:'localStorage + IndexedDB mirror, JSON backup and restore',requires:['MSAStorage']},
    {id:'planner',icon:'📅',name:'Planner',desc:'Daily Program, Plan, Diary and Note calendar entries',requires:['MSAPlanner']},
    {id:'media',icon:'🖼️',name:'Media',desc:'Image resize/compression and Office media embedding',requires:['MSAStudio','MSAOffice']},
    {id:'voice',icon:'🎙️',name:'Voice & AI Routing',desc:'Device speech input and local task routing',requires:['MSAActions']},
    {id:'ui',icon:'🎨',name:'UI & Display',desc:'Responsive display fit, Button Studio and visual effects',requires:['MSAActions']},
    {id:'helper',icon:'?',name:'Friendly Helper',desc:'Context help, Show Me guidance, examples and troubleshooting',requires:['MSAHelper']},
    {id:'performance',icon:'⚡',name:'Performance & Reading',desc:'Adaptive frame pacing, display fit, font/icon scale and Reading View',requires:['MSAPerformance']},
    {id:'premium',icon:'✦',name:'Premium System',desc:'Prepared entitlement and Google Play billing gate · inactive',requires:['MSAEntitlement','MSAPremiumUI']},
    {id:'updates',icon:'↻',name:'Version & Update Policy',desc:'Prepared minimum-version and force-update policy · inactive',requires:['MSAUpdatePolicy']},
    {id:'security',icon:'🛡️',name:'Security Center',desc:'Content sanitization, backup validation, safe URLs and runtime security audit',requires:['MSASecurity']},
    {id:'quality',icon:'🩺',name:'App Diagnostics',desc:'Viewport, accessibility, storage recovery and security checks',requires:['MSAMobileQuality']},
    {id:'pdf-readiness',icon:'📋',name:'PDF Readiness',desc:'Local PDF page readiness tracking · OCR not built in',requires:['MSAPDFReadiness']}
  ];

  const TEMPLATES=[
    {id:'doc-report',type:'document',icon:'📄',name:'Professional Report',group:'Document',title:'Professional Report',content:'<h1>Report Title</h1><p><b>Date:</b> </p><h2>Executive Summary</h2><p>Summarize the purpose, findings and recommended action.</p><h2>Background</h2><p>Add relevant context.</p><h2>Findings</h2><ul><li>Finding 1</li><li>Finding 2</li></ul><h2>Action Plan</h2><table><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th></tr><tr><td>Action item</td><td></td><td></td><td>Open</td></tr></table>'},
    {id:'doc-letter',type:'document',icon:'✉️',name:'Formal Letter',group:'Document',title:'Formal Letter',content:'<p>Date: </p><p>To:<br>Organisation:<br>Address:</p><h2>Subject</h2><p>Dear Sir/Madam,</p><p>Write the main message here.</p><p>Thank you.</p><p>Yours faithfully,<br><b>Name</b><br>Position</p>'},
    {id:'doc-minutes',type:'document',icon:'📝',name:'Meeting Minutes',group:'Document',title:'Meeting Minutes',content:'<h1>Meeting Minutes</h1><p><b>Date:</b> <br><b>Time:</b> <br><b>Location:</b> </p><h2>Attendees</h2><ul><li>Name</li></ul><h2>Agenda</h2><ol><li>Topic</li></ol><h2>Discussion</h2><p></p><h2>Actions</h2><table><tr><th>Action</th><th>Owner</th><th>Due</th></tr><tr><td></td><td></td><td></td></tr></table>'},
    {id:'doc-procedure',type:'document',icon:'🧭',name:'Procedure / SOP',group:'Document',title:'Procedure',content:'<h1>Procedure Title</h1><h2>1. Purpose</h2><p></p><h2>2. Scope</h2><p></p><h2>3. Safety / Preconditions</h2><ul><li></li></ul><h2>4. Procedure</h2><ol><li>Step 1</li><li>Step 2</li></ol><h2>5. Verification</h2><p></p>'},
    {id:'sheet-budget',type:'spreadsheet',icon:'💰',name:'Budget Tracker',group:'Spreadsheet',title:'Budget Tracker',content:()=>JSON.stringify({sheets:[{name:'Budget',rows:[['Category','Budget','Actual','Variance'],['Operations','1000','850','=B2-C2'],['Training','500','300','=B3-C3'],['Total','=SUM(B2:B3)','=SUM(C2:C3)','=SUM(D2:D3)']]},{name:'Notes',rows:[['Date','Note'],['','']]}],activeSheet:0})},
    {id:'sheet-inventory',type:'spreadsheet',icon:'📦',name:'Inventory Register',group:'Spreadsheet',title:'Inventory Register',content:()=>JSON.stringify({sheets:[{name:'Inventory',rows:[['Code','Item','Qty','Minimum','Reorder'],['A001','Item 1','10','5','=C2-D2']]},{name:'Movements',rows:[['Date','Code','In','Out','Remarks'],['','','','','']]}],activeSheet:0})},
    {id:'sheet-kpi',type:'spreadsheet',icon:'📈',name:'KPI Dashboard Data',group:'Spreadsheet',title:'KPI Dashboard',content:()=>JSON.stringify({sheets:[{name:'KPI',rows:[['Metric','Target','Actual','Gap'],['Quality','95','92','=C2-B2'],['Delivery','98','99','=C3-B3'],['Safety','100','100','=C4-B4']]},{name:'History',rows:[['Month','Quality','Delivery','Safety'],['Jan','90','96','100'],['Feb','92','99','100']]}],activeSheet:0})},
    {id:'sheet-task',type:'spreadsheet',icon:'✅',name:'Task Tracker',group:'Spreadsheet',title:'Task Tracker',content:()=>JSON.stringify({sheets:[{name:'Tasks',rows:[['ID','Task','Owner','Due','Status','Priority'],['1','Example task','','','Open','Medium']]}],activeSheet:0})},
    {id:'ppt-update',type:'presentation',icon:'📽️',name:'Project Update',group:'Presentation',title:'Project Update',content:()=>JSON.stringify({slides:[{title:'Project Update',body:'Project name\nDate\nPresenter',layout:'title-body',image:''},{title:'Progress',body:'Completed\nIn progress\nNext milestone',layout:'title-body',image:''},{title:'Risks & Actions',body:'Risk 1 → action\nRisk 2 → action',layout:'title-body',image:''},{title:'Next Steps',body:'1. Action\n2. Action\n3. Decision required',layout:'title-body',image:''}]})},
    {id:'ppt-training',type:'presentation',icon:'🎓',name:'Training Deck',group:'Presentation',title:'Training Deck',content:()=>JSON.stringify({slides:[{title:'Training Topic',body:'Learning objectives',layout:'title-body',image:''},{title:'Concept',body:'Explain the key idea.',layout:'image-right',image:''},{title:'Procedure',body:'Step 1\nStep 2\nStep 3',layout:'title-body',image:''},{title:'Knowledge Check',body:'Question / discussion',layout:'title-body',image:''}]})},
    {id:'ppt-proposal',type:'presentation',icon:'💡',name:'Proposal Deck',group:'Presentation',title:'Proposal',content:()=>JSON.stringify({slides:[{title:'Proposal',body:'Problem · solution · value',layout:'title-body',image:''},{title:'Current Situation',body:'What is happening now?',layout:'image-right',image:''},{title:'Proposed Solution',body:'Describe the solution.',layout:'title-body',image:''},{title:'Benefits',body:'Benefit 1\nBenefit 2\nBenefit 3',layout:'title-body',image:''},{title:'Decision',body:'Approval / next action required',layout:'title-body',image:''}]})},
    {id:'pdf-note',type:'pdf',icon:'📕',name:'PDF Notes',group:'PDF',title:'PDF Notes',content:'PDF NOTES\n\nTitle:\nDate:\n\nSUMMARY\n\n\nDETAILS\n\n\nACTION ITEMS\n\n'},
    {id:'pdf-checklist',type:'pdf',icon:'☑️',name:'PDF Checklist',group:'PDF',title:'Checklist',content:'CHECKLIST\n\nDate:\nOwner:\n\n[ ] Item 1\n[ ] Item 2\n[ ] Item 3\n\nRemarks:\n'},
    {id:'html-guide',type:'html',icon:'🌐',name:'Knowledge Guide',group:'Smart HTML',title:'Knowledge Guide',content:'<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Knowledge Guide</title><style>body{font-family:system-ui;max-width:900px;margin:auto;padding:24px;background:#081523;color:#eef}section{padding:18px;margin:12px 0;background:#ffffff10;border-radius:16px}</style></head><body><h1>Knowledge Guide</h1><section><h2>Overview</h2><p>Add the key explanation.</p></section><section><h2>Steps</h2><ol><li>Step one</li><li>Step two</li></ol></section></body></html>'},
    {id:'html-dashboard',type:'html',icon:'📊',name:'Mini Dashboard',group:'Smart HTML',title:'Mini Dashboard',content:'<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Dashboard</title><style>body{font-family:system-ui;background:#07121f;color:white;padding:22px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.kpi{padding:20px;border-radius:18px;background:#14283f}.kpi b{font-size:28px;display:block}</style></head><body><h1>Dashboard</h1><div class="grid"><div class="kpi"><span>Total</span><b>128</b></div><div class="kpi"><span>Open</span><b>24</b></div><div class="kpi"><span>Done</span><b>104</b></div></div></body></html>'},
    {id:'html-form',type:'html',icon:'📋',name:'Offline Form',group:'Smart HTML',title:'Offline Form',content:'<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Form</title><style>body{font-family:system-ui;max-width:680px;margin:auto;padding:24px}label{display:block;margin:14px 0}input,textarea,select{width:100%;padding:10px}</style></head><body><h1>Offline Form</h1><label>Name<input></label><label>Status<select><option>Open</option><option>Done</option></select></label><label>Details<textarea rows="6"></textarea></label></body></html>'}
  ];

  const API={
    core:{
      escapeHTML:(v)=>globalThis.MSACore?.escapeHTML(v),
      safeName:(v)=>globalThis.MSACore?.safeName(v),
      pickFile:(o)=>globalThis.MSACore?.pickFile(o),
      emit:(n,d)=>globalThis.MSACore?.emit(n,d)
    },
    document:{
      create:(title='Document',html='')=>globalThis.MSAStudio?.createProject('document',title,html),
      open:()=>globalThis.MSAStudio?.open('document'),
      import:()=>globalThis.MSAStudio?.open('document')
    },
    spreadsheet:{
      create:(title='Spreadsheet',content='')=>globalThis.MSAStudio?.createProject('spreadsheet',title,content),
      open:()=>globalThis.MSAStudio?.open('spreadsheet'),
      formula:(formula,rows)=>globalThis.MSAFormula?.evaluate(formula,rows)
    },
    presentation:{
      create:(title='Presentation',content='')=>globalThis.MSAStudio?.createProject('presentation',title,content),
      open:()=>globalThis.MSAStudio?.open('presentation')
    },
    pdf:{
      create:(title='PDF',text='')=>globalThis.MSAStudio?.createProject('pdf',title,text),
      open:()=>globalThis.MSAStudio?.open('pdf')
    },
    html:{
      create:(title='Smart HTML',html='')=>globalThis.MSAStudio?.createProject('html',title,html),
      open:()=>globalThis.MSAStudio?.open('html')
    },
    files:{
      open:()=>globalThis.show?.('files'),
      openOffice:()=>globalThis.MSAFiles?.importOfficeFile(),
      refresh:()=>globalThis.MSAFiles?.renderFiles()
    },
    storage:{
      backup:()=>globalThis.MSAStorage?.downloadBackup(),
      restore:()=>globalThis.MSAStorage?.importBackup(),
      get:(k)=>globalThis.MSAStorage?.get(k),
      set:(k,v)=>globalThis.MSAStorage?.set(k,v)
    },
    planner:{open:()=>globalThis.MSAPlanner?.open()},
    media:{
      resize:(file,opt)=>globalThis.MSAMedia?.resizeImage(file,opt),
      asset:(url)=>globalThis.MSAMedia?.dataUrlAsset(url)
    },
    voice:{start:()=>globalThis.MSAActions?.voice()},
    ui:{studio:()=>globalThis.MSAActions?.uiStudio()},
    helper:{open:(tab='guide')=>globalThis.MSAHelper?.open(tab),troubleshoot:()=>globalThis.MSAHelper?.open('trouble'),current:()=>globalThis.MSAHelper?.current()},
    performance:{reading:(on)=>globalThis.MSAPerformance?.toggleReading(on),mode:(m)=>globalThis.MSAPerformance?.setMode(m),font:(v)=>globalThis.MSAPerformance?.setFontScale(v),icons:(v)=>globalThis.MSAPerformance?.setIconScale(v),device:()=>globalThis.MSAPerformance?.device()},
    premium:{status:()=>globalThis.MSAEntitlement?.status(),can:(cap)=>globalThis.MSAEntitlement?.can(cap),diagnostics:()=>globalThis.MSAEntitlement?.diagnostics(),open:()=>globalThis.show?.('premium')},
    updates:{check:(opt)=>globalThis.MSAUpdatePolicy?.check(opt),evaluate:(p,v)=>globalThis.MSAUpdatePolicy?.evaluate(p,v),diagnostics:()=>globalThis.MSAUpdatePolicy?.diagnostics()},
    security:{audit:()=>globalThis.MSASecurity?.audit(),sanitize:(html)=>globalThis.MSASecurity?.sanitizeRichHTML(html),safeURL:(url)=>globalThis.MSASecurity?.isHTTPS(url)},
    quality:{diagnostics:()=>globalThis.MSAMobileQuality?.diagnostics(),summary:()=>globalThis.MSAMobileQuality?.summary()},
    pdfReadiness:{summary:()=>globalThis.MSAPDFReadiness?.summary(),setPage:(page,info)=>globalThis.MSAPDFReadiness?.setPageReadiness(page,info),capabilities:()=>globalThis.MSAPDFReadiness?.capabilities()}
  };
  function api(module){return API[module]||null}
  function call(module,action,...args){
    const group=api(module),fn=group?.[action];
    if(typeof fn!=='function')throw new Error('Library action not found: '+module+'.'+action);
    return fn(...args);
  }

  function globalObj(name){return globalThis[name]}
  function moduleStatus(m){
    const missing=m.requires.filter(x=>!globalObj(x));
    return {ready:missing.length===0,missing};
  }
  function capabilities(){
    return MODULES.map(m=>({...m,...moduleStatus(m)}));
  }
  function selfCheck(){
    const modules=capabilities(),ready=modules.filter(x=>x.ready).length,templates=allTemplates();
    return {ready,total:modules.length,modules,templates:templates.length,builtInTemplates:TEMPLATES.length,userTemplates:templates.length-TEMPLATES.length,offline:true};
  }
  function allTemplates(){
    const user=globalThis.MSALibraryUpdate?.userTemplates?.()||[];
    return [...TEMPLATES,...user];
  }
  function template(id){return allTemplates().find(x=>x.id===id)}
  function openTemplate(id){
    const t=template(id);if(!t)throw new Error('Template not found');
    if(!globalThis.MSAStudio?.createProject)throw new Error('Create Studio library API is not ready');
    const content=typeof t.content==='function'?t.content():t.content;
    globalThis.MSAStudio.createProject(t.type,t.title,content);
    close();
  }
  function runModule(id){
    switch(id){
      case'core':return open();
      case'document':return globalThis.MSAStudio?.open('document');
      case'spreadsheet':return globalThis.MSAStudio?.open('spreadsheet');
      case'presentation':return globalThis.MSAStudio?.open('presentation');
      case'pdf':return globalThis.MSAStudio?.open('pdf');
      case'html':return globalThis.MSAStudio?.open('html');
      case'files':return globalThis.show?.('files');
      case'storage':return globalThis.show?.('me');
      case'planner':return globalThis.MSAPlanner?.open();
      case'media':return globalThis.MSAStudio?.open('document');
      case'voice':return globalThis.show?.('ai');
      case'ui':return globalThis.show?.('me');
      case'helper':return globalThis.MSAHelper?.open();
      case'performance':return globalThis.show?.('me');
      case'premium':return globalThis.show?.('premium');
      case'updates':return globalThis.show?.('premium');
      case'security':globalThis.show?.('me');return globalThis.MSAHelper?.notify?.('Security Center is active · content, backup and URL validation enabled.','success');case'quality':return globalThis.MSAHelper?.notify?.(globalThis.MSAMobileQuality?.summary?.()||'Diagnostics unavailable','info');case'pdf-readiness':globalThis.MSAStudio?.open?.('pdf');return globalThis.MSAHelper?.notify?.('PDF readiness tracking is available. Built-in OCR is not enabled.','info');
    }
  }
  function filter(q=''){
    q=q.trim().toLowerCase();
    if(!q){
      const fav=globalThis.MSALibraryUpdate?.isFavorite;
      const templates=allTemplates().sort((a,b)=>Number(!!fav?.(b.id))-Number(!!fav?.(a.id)));
      return {modules:capabilities(),templates};
    }
    return {
      modules:capabilities().filter(x=>(x.name+' '+x.desc+' '+x.id).toLowerCase().includes(q)),
      templates:allTemplates().filter(x=>(x.name+' '+x.group+' '+x.type).toLowerCase().includes(q))
    };
  }
  function render(q=''){
    const page=document.querySelector('#library .wrap');if(!page)return;
    const data=filter(q),health=selfCheck(),updatePanel=globalThis.MSALibraryUpdate?.panelHTML?.()||'';
    page.innerHTML='<section class="hero library-hero"><h1>Built-in Library</h1><p class="muted">Reusable offline modules, templates and capability checks packaged inside MSA One.</p><div class="library-health"><b>'+health.ready+'/'+health.total+'</b><span>main modules ready</span><strong>'+health.builtInTemplates+' built-in</strong>'+(health.userTemplates?'<strong>'+health.userTemplates+' mine</strong>':'')+'</div><input class="library-search" type="search" placeholder="Search modules or templates…" value="'+escapeHTML(q)+'"></section>'+updatePanel+
      '<div class="cap">MAIN FUNCTION LIBRARIES</div><div class="library-modules">'+(data.modules.length?data.modules.map(m=>'<article class="library-module"><button data-module="'+m.id+'"><span>'+m.icon+'</span><div><b>'+escapeHTML(m.name)+'</b><small>'+escapeHTML(m.desc)+'</small></div><i class="'+(m.ready?'ready':'missing')+'">'+(m.ready?'READY':'CHECK')+'</i></button></article>').join(''):'<div class="library-empty">No module matches.</div>')+'</div>'+
      '<div class="cap">TEMPLATES</div><div class="library-templates">'+(data.templates.length?data.templates.map(t=>'<article class="library-template-wrap"><button class="library-template" data-template="'+t.id+'"><span>'+t.icon+'</span><div><b>'+escapeHTML(t.name)+'</b><small>'+escapeHTML(t.group)+(t.source==='user'?' · My template':'')+'</small></div><strong>Use</strong></button><button class="library-favorite '+(globalThis.MSALibraryUpdate?.isFavorite?.(t.id)?'on':'')+'" data-library-favorite="'+t.id+'" aria-label="Favorite '+escapeHTML(t.name)+'">★</button></article>').join(''):'<div class="library-empty">No template matches.</div>')+'</div>';
    const input=page.querySelector('.library-search');input.oninput=e=>render(e.target.value);
    page.querySelectorAll('[data-module]').forEach(b=>b.onclick=()=>runModule(b.dataset.module));
    page.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>{globalThis.MSALibraryUpdate?.markRecent?.(b.dataset.template);openTemplate(b.dataset.template)});
    globalThis.MSALibraryUpdate?.bindPanel?.(page);
  }
  function escapeHTML(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function open(){globalThis.show?.('library');render()}
  function close(){globalThis.show?.('home')}
  function mount(){
    if(!document.getElementById('library')){
      const main=document.createElement('main');main.id='library';main.className='page';
      main.innerHTML='<header class="head"><button class="back" data-library-back>‹</button><div class="grow"><b>Built-in Library</b><div class="muted">Offline modules & templates</div></div><span class="pro">BUILT IN</span></header><div class="wrap"></div>';
      document.body.insertBefore(main,document.querySelector('.lens'));
      main.querySelector('[data-library-back]').onclick=()=>close();
    }
    const home=document.querySelector('#home .wrap'),cal=home?.querySelector('[data-calendar-home]');
    if(home&&cal&&!home.querySelector('[data-library-home]')){
      const b=document.createElement('button');b.className='planner-home library-shortcut';b.setAttribute('data-library-home','');b.innerHTML='<span>🧰</span><div><b>Built-in Function Library</b><small>Modules · templates · offline capability check</small></div><strong>›</strong>';b.onclick=open;cal.insertAdjacentElement('afterend',b);
    }
    const me=document.querySelector('#me .wrap'),mcal=me?.querySelector('[data-calendar-me]');
    if(me&&mcal&&!me.querySelector('[data-library-me]')){
      const b=document.createElement('button');b.className='planner-home library-shortcut';b.setAttribute('data-library-me','');b.innerHTML='<span>🧰</span><div><b>Built-in Function Library</b><small>Inspect and launch local capabilities</small></div><strong>›</strong>';b.onclick=open;mcal.insertAdjacentElement('afterend',b);
    }
    render();
  }

  globalThis.MSALibrary={modules:MODULES,templates:TEMPLATES,allTemplates,api,call,capabilities,selfCheck,filter,template,openTemplate,runModule,render,open,close,mount};
  if(typeof document!=='undefined'){
    document.addEventListener('DOMContentLoaded',mount);
    setTimeout(mount,650);
  }
})();