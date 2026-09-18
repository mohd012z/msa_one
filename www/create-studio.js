(()=> {
  const KEY='msaOneProjectsV1';
  const TYPES={document:['📄','Document'],spreadsheet:['📊','Spreadsheet'],presentation:['📽️','Presentation'],pdf:['📕','PDF'],html:['🌐','Smart HTML']};
  let state={type:'document',id:null,timer:null,slide:0};

  function all(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
  function put(p){
    let a=all(),i=a.findIndex(x=>x.id===p.id);
    i<0?a.unshift(p):a[i]=p;
    a=a.slice(0,50);
    const raw=JSON.stringify(a);
    localStorage.setItem(KEY,raw);
    window.MSAStorage?.mirror(KEY,raw);
    return p;
  }
  function get(id){return all().find(x=>x.id===id)}
  function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function safeName(s='msa-one'){return String(s).trim().replace(/[^\w-]+/g,'-').replace(/^-+|-+$/g,'')||'msa-one'}
  function json(s,fallback){try{return JSON.parse(s)}catch{return fallback}}
  function defaultSheet(){return Array.from({length:12},(_,r)=>Array.from({length:6},(_,c)=>r===0?['Item','Description','Qty','Price','Status','Remarks'][c]||'':''))}
  function defaultSlides(){return [{title:'Presentation title',body:'Add your key message here.'},{title:'Second slide',body:'Add supporting points here.'}]}

  function wireTiles(){
    document.querySelectorAll('#create .tile,#home .tile,#ai .tile').forEach(b=>{
      const t=(b.querySelector('strong')?.textContent||'').toLowerCase();
      const type=t.includes('spreadsheet')?'spreadsheet':t.includes('presentation')?'presentation':t.includes('smart html')?'html':t.includes('pdf')?'pdf':t.includes('document')?'document':null;
      if(type)b.onclick=()=>open(type);
    });
  }

  function mount(){
    if(document.querySelector('.studio-overlay')){wireTiles();return}
    const x=document.createElement('section');x.className='studio-overlay';
    x.innerHTML='<header class="studio-top"><button data-close>‹</button><div class="studio-title"><input data-title value="Untitled"><div class="studio-status">Ready · autosaves on this device</div></div><button class="studio-primary" data-export>Export</button></header><div class="studio-body"><div class="studio-mode">'+Object.entries(TYPES).map(([k,v])=>'<button class="studio-type" data-type="'+k+'">'+v[0]+'<br>'+v[1]+'</button>').join('')+'</div><div data-work></div><div class="studio-recents" data-recents></div></div>';
    document.body.appendChild(x);
    x.querySelector('[data-close]').onclick=close;
    x.querySelector('[data-export]').onclick=exportCurrent;
    x.querySelector('[data-title]').oninput=queueSave;
    x.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>open(b.dataset.type));
    wireTiles();renderRecents();
  }

  function render(){
    const x=document.querySelector('.studio-overlay'),w=x.querySelector('[data-work]');
    x.querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('on',b.dataset.type===state.type));
    const p=state.id&&get(state.id);
    x.querySelector('[data-title]').value=p?.title||'Untitled '+TYPES[state.type][1];

    if(state.type==='document'){
      w.innerHTML='<div class="studio-tools"><button class="studio-tool" data-cmd="bold"><b>B</b></button><button class="studio-tool" data-cmd="italic"><i>I</i></button><button class="studio-tool" data-cmd="insertUnorderedList">☷ List</button><button class="studio-tool" data-doc-pdf>PDF</button></div><article class="studio-editor" contenteditable="true" data-doc>'+(p?.content||'<h2>Start writing</h2><p>Your document autosaves on this device and exports as DOCX.</p>')+'</article>';
      w.querySelector('[data-doc]').oninput=queueSave;
      w.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{document.execCommand(b.dataset.cmd);queueSave()});
      w.querySelector('[data-doc-pdf]').onclick=()=>exportPDF(window.MSAOffice?.plain(currentContent())||'');
    }else if(state.type==='html'){
      const src=p?.content||'<!doctype html>\n<html>\n<head><meta name="viewport" content="width=device-width"><title>MSA One</title></head>\n<body>\n  <h1>Hello from MSA One</h1>\n  <p>Edit the source and preview it below.</p>\n</body>\n</html>';
      w.innerHTML='<textarea class="studio-code" data-code></textarea><iframe class="studio-preview-frame" data-preview sandbox></iframe>';
      const c=w.querySelector('[data-code]');c.value=src;c.oninput=()=>{preview();queueSave()};preview();
    }else if(state.type==='spreadsheet'){
      const data=json(p?.content,defaultSheet()),rows=Array.isArray(data)?data:(data.rows||defaultSheet());
      renderSheet(w,rows);
    }else if(state.type==='presentation'){
      const data=json(p?.content,{slides:defaultSlides()}),slides=Array.isArray(data)?data:(data.slides||defaultSlides());
      state.slide=Math.min(state.slide,Math.max(0,slides.length-1));
      renderPresentation(w,slides);
    }else if(state.type==='pdf'){
      const text=p?.content||'MSA One PDF\n\nType or paste content here. Export creates a real PDF file locally.';
      w.innerHTML='<div class="studio-tools"><span class="studio-status">Text PDF · offline export</span></div><textarea class="studio-pdf-text" data-pdf-text></textarea>';
      const ta=w.querySelector('[data-pdf-text]');ta.value=text;ta.oninput=queueSave;
    }
    renderRecents();
  }

  function renderSheet(w,rows){
    const cols=Math.max(1,...rows.map(r=>r.length),6);
    rows=rows.map(r=>Array.from({length:cols},(_,c)=>r[c]??''));
    const head=Array.from({length:cols},(_,c)=>'<th>'+String.fromCharCode(65+c)+'</th>').join('');
    const body=rows.map((r,ri)=>'<tr><th>'+(ri+1)+'</th>'+r.map((v,ci)=>'<td><input data-cell data-r="'+ri+'" data-c="'+ci+'" value="'+esc(v)+'"></td>').join('')+'</tr>').join('');
    w.innerHTML='<div class="studio-tools"><button class="studio-tool" data-add-row>＋ Row</button><button class="studio-tool" data-add-col>＋ Column</button><button class="studio-tool" data-csv>CSV</button><span class="studio-status">XLSX export · '+rows.length+' × '+cols+'</span></div><div class="sheet-wrap"><table class="sheet-grid"><thead><tr><th>#</th>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>';
    w.querySelectorAll('[data-cell]').forEach(i=>i.oninput=queueSave);
    w.querySelector('[data-add-row]').onclick=()=>{const r=readSheet();r.push(Array.from({length:r[0]?.length||6},()=>''));replaceSheet(r)};
    w.querySelector('[data-add-col]').onclick=()=>{const r=readSheet();r.forEach(x=>x.push(''));replaceSheet(r)};
    w.querySelector('[data-csv]').onclick=()=>{saveDraft();const n=safeName(document.querySelector('[data-title]')?.value);window.MSAOffice?.download(n+'.csv',window.MSAOffice.csv(readSheet()),'text/csv;charset=utf-8')};
  }
  function replaceSheet(rows){
    const p={id:state.id||('p_'+Date.now().toString(36)),type:'spreadsheet',title:document.querySelector('[data-title]')?.value||'Untitled Spreadsheet',content:JSON.stringify({rows}),updated:Date.now()};
    state.id=p.id;put(p);render();
  }
  function readSheet(){
    const cells=[...document.querySelectorAll('[data-cell]')];let mr=0,mc=0;
    cells.forEach(i=>{mr=Math.max(mr,+i.dataset.r);mc=Math.max(mc,+i.dataset.c)});
    const rows=Array.from({length:mr+1},()=>Array.from({length:mc+1},()=>''));cells.forEach(i=>rows[+i.dataset.r][+i.dataset.c]=i.value);return rows;
  }

  function renderPresentation(w,slides){
    const s=slides[state.slide]||slides[0];
    w.innerHTML='<div class="studio-tools"><button class="studio-tool" data-add-slide>＋ Slide</button><button class="studio-tool" data-del-slide>Delete</button><span class="studio-status">'+slides.length+' slide'+(slides.length===1?'':'s')+'</span></div><div class="slide-tabs">'+slides.map((x,i)=>'<button class="studio-tool '+(i===state.slide?'on':'')+'" data-slide="'+i+'">'+(i+1)+'</button>').join('')+'</div><div class="slide-editor"><input data-slide-title placeholder="Slide title" value="'+esc(s.title||'')+'"><textarea data-slide-body placeholder="Slide content">'+esc(s.body||'')+'</textarea></div>';
    w.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>{saveDraft();state.slide=+b.dataset.slide;render()});
    w.querySelector('[data-slide-title]').oninput=queueSave;w.querySelector('[data-slide-body]').oninput=queueSave;
    w.querySelector('[data-add-slide]').onclick=()=>{const a=readSlides(slides);a.push({title:'New slide',body:''});state.slide=a.length-1;replaceSlides(a)};
    w.querySelector('[data-del-slide]').onclick=()=>{if(slides.length<=1)return;const a=readSlides(slides);a.splice(state.slide,1);state.slide=Math.max(0,state.slide-1);replaceSlides(a)};
  }
  function readSlides(base){
    const a=base.map(x=>({...x})),t=document.querySelector('[data-slide-title]'),b=document.querySelector('[data-slide-body]');
    if(a[state.slide]&&t&&b){a[state.slide]={title:t.value,body:b.value}}return a;
  }
  function replaceSlides(slides){
    const p={id:state.id||('p_'+Date.now().toString(36)),type:'presentation',title:document.querySelector('[data-title]')?.value||'Untitled Presentation',content:JSON.stringify({slides}),updated:Date.now()};
    state.id=p.id;put(p);render();
  }
  function currentSlides(){
    const p=state.id&&get(state.id),data=json(p?.content,{slides:defaultSlides()}),base=Array.isArray(data)?data:(data.slides||defaultSlides());
    return readSlides(base);
  }

  function preview(){const c=document.querySelector('[data-code]'),f=document.querySelector('[data-preview]');if(c&&f)f.srcdoc=c.value}
  function currentContent(){
    if(state.type==='document')return document.querySelector('[data-doc]')?.innerHTML||'';
    if(state.type==='html')return document.querySelector('[data-code]')?.value||'';
    if(state.type==='spreadsheet')return JSON.stringify({rows:readSheet()});
    if(state.type==='presentation')return JSON.stringify({slides:currentSlides()});
    if(state.type==='pdf')return document.querySelector('[data-pdf-text]')?.value||'';
    return '';
  }

  function saveDraft(){
    if(!TYPES[state.type])return;
    const title=document.querySelector('[data-title]')?.value.trim()||'Untitled '+TYPES[state.type][1];
    if(!state.id)state.id='p_'+Date.now().toString(36);
    put({id:state.id,type:state.type,title,content:currentContent(),updated:Date.now()});
    const s=document.querySelector('.studio-status');if(s)s.textContent='Saved · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    renderRecents();
  }
  function queueSave(){clearTimeout(state.timer);state.timer=setTimeout(saveDraft,350)}
  function open(type='document',id=null){mount();state.type=TYPES[type]?type:'document';state.id=id;state.slide=0;document.querySelector('.studio-overlay').classList.add('on');render()}
  function close(){saveDraft();document.querySelector('.studio-overlay')?.classList.remove('on')}
  function openProject(id){const p=get(id);if(p)open(p.type,p.id)}

  function renderRecents(){
    const r=document.querySelector('[data-recents]');if(!r)return;const a=all().slice(0,5);
    r.innerHTML=a.length?'<div class="studio-status">RECENT DRAFTS</div>'+a.map(p=>'<div class="studio-recent"><span>'+(TYPES[p.type]?.[0]||'◆')+'</span><div><b>'+esc(p.title)+'</b><div class="studio-status">'+new Date(p.updated).toLocaleString()+'</div></div><button class="studio-tool" data-open="'+p.id+'">Open</button></div>').join(''):'';
    r.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openProject(b.dataset.open));
  }

  function exportPDF(text){
    const title=document.querySelector('[data-title]')?.value||'MSA One',name=safeName(title);
    if(!window.MSAOffice)return alert('Office engine is not loaded.');
    window.MSAOffice.download(name+'.pdf',window.MSAOffice.pdf(text,title),'application/pdf');
  }
  function exportCurrent(){
    saveDraft();
    if(!window.MSAOffice)return alert('Office engine is not loaded.');
    const title=document.querySelector('[data-title]')?.value||'MSA One',name=safeName(title);
    if(state.type==='html')window.MSAOffice.download(name+'.html',currentContent(),'text/html;charset=utf-8');
    else if(state.type==='document')window.MSAOffice.download(name+'.docx',window.MSAOffice.docx(title,currentContent()),'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    else if(state.type==='spreadsheet')window.MSAOffice.download(name+'.xlsx',window.MSAOffice.xlsx(readSheet()),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    else if(state.type==='presentation')window.MSAOffice.download(name+'.pptx',window.MSAOffice.pptx(currentSlides()),'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    else if(state.type==='pdf')exportPDF(currentContent());
  }

  window.MSAStudio={open,close,saveDraft,exportCurrent,openProject};
  document.addEventListener('DOMContentLoaded',mount);setTimeout(mount,400);
})();