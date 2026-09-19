(()=> {
  const KEY='msaOneProjectsV1';
  const TYPES={document:['📄','Document'],spreadsheet:['📊','Spreadsheet'],presentation:['📽️','Presentation'],pdf:['📕','PDF'],html:['🌐','Smart HTML']};
  let state={type:'document',id:null,timer:null,idleSave:null,slide:0,sheet:0,rowStart:0,colStart:0,pdfObjectUrl:null,historyKey:null,dirty:false};

  function all(){if(window.MSAProjects)return window.MSAProjects.all();try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
  function put(p){
    if(window.MSAProjects){window.MSAProjects.upsert(p,50);return p}
    let a=all(),i=a.findIndex(x=>x.id===p.id);i<0?a.unshift(p):a[i]=p;a=a.slice(0,50);
    const raw=JSON.stringify(a);localStorage.setItem(KEY,raw);window.MSAStorage?.mirror(KEY,raw);return p;
  }
  function get(id){return window.MSAProjects?.get(id)||all().find(x=>x.id===id)}
  function esc(s=''){return window.MSACore?.escapeHTML(s)??String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function safeName(s='msa-one'){return window.MSACore?.safeName(s)??(String(s).trim().replace(/[^\w-]+/g,'-').replace(/^-+|-+$/g,'')||'msa-one')}
  function json(s,fallback){return window.MSACore?.parseJSON(s,fallback)??(()=>{try{return JSON.parse(s)}catch{return fallback}})()}
  function friendlyError(message){if(window.MSAHelper?.error)window.MSAHelper.error(message,[{label:'Troubleshoot',run:()=>window.MSAHelper.open('trouble')}]);else alert(message)}
  function friendlySuccess(message){if(window.MSAHelper?.success)window.MSAHelper.success(message);}
  function defaultSheet(){
    const rows=Array.from({length:12},()=>Array.from({length:6},()=>''));rows[0]=['Item','Description','Qty','Price','Total','Status'];rows[1]=['A001','Sample item','2','15','=C2*D2','Open'];return rows;
  }
  function defaultSlides(){return [{title:'Presentation title',body:'Add your key message here.',layout:'title-body',image:''},{title:'Visual slide',body:'Add supporting points here.',layout:'image-right',image:''}]}

  function historyKey(){return state.historyKey||(state.historyKey=(state.id?'project:'+state.id:'draft:'+state.type+':'+(window.MSACore?.uid?.('history')||Date.now().toString(36))))}
  function studioSnapshot(){
    return {id:state.id||null,type:state.type,title:document.querySelector('[data-title]')?.value||('Untitled '+TYPES[state.type][1]),content:currentContent(),slide:state.slide,sheet:state.sheet};
  }
  function updateHistoryButtons(){
    const st=window.MSAEditorHistory?.status?.(historyKey())||{canUndo:false,canRedo:false};
    const undo=document.querySelector('[data-history-undo]'),redo=document.querySelector('[data-history-redo]');
    if(undo){undo.disabled=!st.canUndo;undo.setAttribute('aria-disabled',String(!st.canUndo))}
    if(redo){redo.disabled=!st.canRedo;redo.setAttribute('aria-disabled',String(!st.canRedo))}
  }
  function beginHistory(){window.MSAEditorHistory?.begin?.(historyKey(),studioSnapshot());updateHistoryButtons()}
  function scheduleHistory(){window.MSAEditorHistory?.schedule?.(historyKey(),studioSnapshot,560);updateHistoryButtons()}
  function checkpointHistory(){window.MSAEditorHistory?.checkpoint?.(historyKey(),studioSnapshot);updateHistoryButtons()}
  function recordHistory(){window.MSAEditorHistory?.record?.(historyKey(),studioSnapshot());updateHistoryButtons()}
  function cancelSaveTimer(){
    clearTimeout(state.timer);
    if(state.idleSave!=null){window.MSAPerformance?.cancelIdle?.(state.idleSave);state.idleSave=null}
  }
  function applyHistorySnapshot(snapshot,label){
    if(!snapshot)return false;
    cancelSaveTimer();
    state.type=TYPES[snapshot.type]?snapshot.type:state.type;
    state.id=snapshot.id||state.id||(window.MSACore?.uid?.('p')||('p_'+Date.now().toString(36)));
    state.slide=Math.max(0,Number(snapshot.slide)||0);state.sheet=Math.max(0,Number(snapshot.sheet)||0);
    put({id:state.id,type:state.type,title:snapshot.title||('Untitled '+TYPES[state.type][1]),content:snapshot.content??'',updated:Date.now()});
    state.dirty=false;render();
    const status=document.querySelector('.studio-status');if(status)status.textContent=label+' · saved locally';
    updateHistoryButtons();return true;
  }
  function undoStudio(){
    const snap=window.MSAEditorHistory?.undo?.(historyKey(),studioSnapshot());
    if(!snap){window.MSAHelper?.notify?.('Nothing to undo.','info');updateHistoryButtons();return false}
    return applyHistorySnapshot(snap,'Undo');
  }
  function redoStudio(){
    const snap=window.MSAEditorHistory?.redo?.(historyKey(),studioSnapshot());
    if(!snap){window.MSAHelper?.notify?.('Nothing to redo.','info');updateHistoryButtons();return false}
    return applyHistorySnapshot(snap,'Redo');
  }
  function wireHistoryControls(work){
    if(!work)return;
    let tools=work.querySelector('.studio-tools');
    if(!tools){tools=document.createElement('div');tools.className='studio-tools studio-history-only';work.prepend(tools)}
    if(!tools.querySelector('[data-history-undo]'))tools.insertAdjacentHTML('afterbegin','<button class="studio-tool studio-history-btn" data-history-undo aria-label="Undo" title="Undo">↶ Undo</button><button class="studio-tool studio-history-btn" data-history-redo aria-label="Redo" title="Redo">↷ Redo</button>');
    tools.querySelector('[data-history-undo]').onclick=undoStudio;
    tools.querySelector('[data-history-redo]').onclick=redoStudio;
    updateHistoryButtons();
  }
  function historyKeydown(e){
    if(!document.body.classList.contains('studio-open')||!(e.ctrlKey||e.metaKey)||e.altKey)return;
    const key=String(e.key||'').toLowerCase();
    if(key==='z'){e.preventDefault();e.shiftKey?redoStudio():undoStudio()}
    else if(key==='y'){e.preventDefault();redoStudio()}
  }

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
    x.innerHTML='<header class="studio-top"><button class="studio-icon-btn" data-close aria-label="Close">‹</button><div class="studio-title"><input data-title value="Untitled"><div class="studio-status">Ready · autosaves on this device</div></div><button class="studio-tool" data-import>Import</button><button class="studio-primary" data-save>Save</button><button class="studio-tool" data-export>Export</button></header><div class="studio-body"><div class="studio-mode">'+Object.entries(TYPES).map(([k,v])=>'<button class="studio-type" data-type="'+k+'">'+v[0]+'<br>'+v[1]+'</button>').join('')+'</div><div data-work></div><div class="studio-recents" data-recents></div></div><footer class="studio-bottom"><button data-bottom-save>💾<span>Save</span></button><button data-bottom-import>↥<span>Import</span></button><button data-bottom-export>↧<span>Export</span></button><button data-bottom-files>▤<span>Files</span></button></footer>';
    document.body.appendChild(x);document.addEventListener('keydown',historyKeydown);x.querySelector('[data-close]').onclick=close;x.querySelector('[data-import]').onclick=importCurrent;x.querySelector('[data-save]').onclick=()=>saveDraft(true);x.querySelector('[data-export]').onclick=exportCurrent;x.querySelector('[data-bottom-save]').onclick=()=>saveDraft(true);x.querySelector('[data-bottom-import]').onclick=importCurrent;x.querySelector('[data-bottom-export]').onclick=exportCurrent;x.querySelector('[data-bottom-files]').onclick=()=>{close();window.show?.('files')};x.querySelector('[data-title]').oninput=queueSave;
    x.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>open(b.dataset.type));wireTiles();renderRecents();
  }

  function render(){
    const x=document.querySelector('.studio-overlay'),w=x.querySelector('[data-work]');x.querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('on',b.dataset.type===state.type));
    const p=state.id&&get(state.id);x.querySelector('[data-title]').value=p?.title||'Untitled '+TYPES[state.type][1];

    if(state.type==='document'){
      const safeDoc=sanitizeHTML(p?.content||'<h2>Start writing</h2><p>Your document keeps rich headings, bold, italic, underline, lists and simple tables when exported to DOCX.</p>');
      w.innerHTML='<div class="studio-tools"><button class="studio-tool" data-cmd="bold"><b>B</b></button><button class="studio-tool" data-cmd="italic"><i>I</i></button><button class="studio-tool" data-cmd="underline"><u>U</u></button><button class="studio-tool" data-block="H1">H1</button><button class="studio-tool" data-block="H2">H2</button><button class="studio-tool" data-block="P">P</button><button class="studio-tool" data-cmd="insertUnorderedList">☷ List</button><button class="studio-tool" data-table>▦ Table</button><button class="studio-tool" data-doc-image>🖼 Image</button><button class="studio-tool" data-doc-pdf>PDF</button></div><article class="studio-editor" contenteditable="true" data-doc>'+safeDoc+'</article>';
      const ed=w.querySelector('[data-doc]');ed.oninput=queueSave;
      w.querySelectorAll('[data-cmd]').forEach(b=>b.onclick=()=>{ed.focus();window.MSAEditorAdapter?.command?.(b.dataset.cmd,null,ed);queueSave()});
      w.querySelectorAll('[data-block]').forEach(b=>b.onclick=()=>{ed.focus();window.MSAEditorAdapter?.formatBlock?.(b.dataset.block,ed);queueSave()});
      w.querySelector('[data-table]').onclick=()=>{ed.focus();window.MSAEditorAdapter?.insertHTML?.('<table><tr><th>Header 1</th><th>Header 2</th></tr><tr><td>Value</td><td>Value</td></tr></table><p><br></p>',ed);queueSave()};
      w.querySelector('[data-doc-image]').onclick=()=>pickDocumentImage(ed);
      w.querySelector('[data-doc-pdf]').onclick=()=>exportPDF(window.MSAOffice?.plain(currentContent())||'');
    }else if(state.type==='html'){
      const src=p?.content||'<!doctype html>\n<html>\n<head><meta name="viewport" content="width=device-width"><title>MSA One</title></head>\n<body>\n  <h1>Hello from MSA One</h1>\n  <p>Edit the source and preview it below.</p>\n</body>\n</html>';
      w.innerHTML='<textarea class="studio-code" data-code></textarea><iframe class="studio-preview-frame" data-preview sandbox></iframe>';
      const c=w.querySelector('[data-code]');c.value=src;c.oninput=()=>{preview();queueSave()};preview();
    }else if(state.type==='spreadsheet'){
      const data=json(p?.content,{sheets:[{name:'Sheet1',rows:defaultSheet()}]}),sheets=normalizeSheets(data);state.sheet=Math.min(Number.isInteger(data?.activeSheet)?data.activeSheet:state.sheet,Math.max(0,sheets.length-1));renderSheet(w,sheets);
    }else if(state.type==='presentation'){
      const data=json(p?.content,{slides:defaultSlides()}),slides=Array.isArray(data)?data:(data.slides||defaultSlides());state.slide=Math.min(state.slide,Math.max(0,slides.length-1));renderPresentation(w,slides);
    }else if(state.type==='pdf'){
      const content=p?.content||'MSA One PDF\n\nType or paste content here. Export creates a real PDF file locally.';
      const nativePdf=String(content).startsWith('native-pdf:');
      if(/^blob:/.test(content)||nativePdf){
        w.innerHTML='<div class="studio-tools"><span class="studio-status" data-pdf-status>PDF viewer · imported file</span><button class="studio-tool" data-pdf-new>New editable PDF</button></div><iframe class="studio-pdf-viewer" data-pdf-viewer title="PDF document"></iframe>';
        const frame=w.querySelector('[data-pdf-viewer]'),status=w.querySelector('[data-pdf-status]');
        if(nativePdf){
          const uri=decodeURIComponent(String(content).slice('native-pdf:'.length));
          status.textContent='PDF viewer · reconnecting native file…';
          window.MSANativeFiles?.readDescriptor?.({uri}).then(file=>{
            if(state.pdfObjectUrl)URL.revokeObjectURL(state.pdfObjectUrl);
            state.pdfObjectUrl=URL.createObjectURL(file);frame.src=state.pdfObjectUrl;status.textContent='PDF viewer · persisted Android source';
          }).catch(e=>{status.textContent='PDF source unavailable';friendlyError('PDF could not be reopened: '+e.message)});
        }else frame.src=content;
        w.querySelector('[data-pdf-new]').onclick=()=>{if(state.pdfObjectUrl){URL.revokeObjectURL(state.pdfObjectUrl);state.pdfObjectUrl=null}put({id:state.id,type:'pdf',title:x.querySelector('[data-title]').value,content:'',updated:Date.now()});render()};
      }else{
        w.innerHTML='<div class="studio-tools"><span class="studio-status">Editable text PDF · offline export</span></div><textarea class="studio-pdf-text" data-pdf-text></textarea>';
        const ta=w.querySelector('[data-pdf-text]');ta.value=content;ta.oninput=queueSave;
      }
    }
    wireHistoryControls(w);renderRecents();updateHistoryButtons();
  }

  function colName(n){return window.MSAFormula?.colName(n)||String.fromCharCode(65+n)}
  function cellNumber(rows,r,c){return window.MSAFormula?.cellNumber(rows,r,c)??0}
  function evalFormula(formula,rows){return window.MSAFormula?.evaluate(formula,rows)??NaN}

  function normalizeSheets(data){
    if(Array.isArray(data))return[{name:'Sheet1',rows:data}];
    if(Array.isArray(data?.sheets)&&data.sheets.length)return data.sheets.map((sh,i)=>({name:String(sh.name||('Sheet'+(i+1))),rows:Array.isArray(sh.rows)?sh.rows:[['']]}));
    if(Array.isArray(data?.rows))return[{name:'Sheet1',rows:data.rows}];
    return[{name:'Sheet1',rows:defaultSheet()}];
  }
  function storedSheets(){
    const p=state.id&&get(state.id),data=json(p?.content,{sheets:[{name:'Sheet1',rows:defaultSheet()}]});
    return normalizeSheets(data);
  }
  function captureSheets(base){
    const sheets=(base||storedSheets()).map(sh=>({name:sh.name,rows:(sh.rows||[]).map(r=>[...r])}));
    const cells=document.querySelectorAll('[data-cell]');
    if(cells.length&&sheets[state.sheet]){
      const rows=sheets[state.sheet].rows;
      cells.forEach(i=>{
        const r=+i.dataset.r,c=+i.dataset.c;
        while(rows.length<=r)rows.push([]);
        while(rows[r].length<=c)rows[r].push('');
        rows[r][c]=i.value;
      });
    }
    return sheets;
  }
  function replaceSheets(sheets,next=state.sheet){
    const changed=next!==state.sheet;
    state.sheet=Math.max(0,Math.min(next,sheets.length-1));
    if(changed){state.rowStart=0;state.colStart=0}
    const p={id:state.id||('p_'+Date.now().toString(36)),type:'spreadsheet',title:document.querySelector('[data-title]')?.value||'Untitled Spreadsheet',content:JSON.stringify({sheets,activeSheet:state.sheet}),updated:Date.now()};
    state.id=p.id;put(p);state.dirty=false;render();recordHistory();
  }
  function sheetPageSize(){
    const p=window.MSAPerformance?.profile?.()||'balanced';
    return p==='low'?80:p==='smooth'?240:140;
  }
  function sheetColPageSize(){
    const p=window.MSAPerformance?.profile?.()||'balanced';
    return p==='low'?14:p==='smooth'?36:24;
  }
  function renderSheet(w,sheets){
    sheets=normalizeSheets({sheets});state.sheet=Math.max(0,Math.min(state.sheet,sheets.length-1));
    const rows=sheets[state.sheet].rows||[['']];
    const cols=Math.max(1,...rows.map(r=>r.length),6);
    const rowPage=sheetPageSize(),colPage=sheetColPageSize(),maxRowStart=Math.max(0,rows.length-rowPage),maxColStart=Math.max(0,cols-colPage);
    state.rowStart=Math.min(Math.max(0,state.rowStart),maxRowStart);
    state.colStart=Math.min(Math.max(0,state.colStart),maxColStart);
    const endRow=Math.min(rows.length,state.rowStart+rowPage),endCol=Math.min(cols,state.colStart+colPage);
    const visible=rows.slice(state.rowStart,endRow),colIndexes=Array.from({length:endCol-state.colStart},(_,i)=>state.colStart+i);
    const head=colIndexes.map(c=>'<th>'+colName(c)+'</th>').join('');
    const body=visible.map((r,offset)=>{
      const ri=state.rowStart+offset;
      return '<tr><th>'+(ri+1)+'</th>'+colIndexes.map(ci=>'<td><input data-cell data-r="'+ri+'" data-c="'+ci+'" value="'+esc(r[ci]??'')+'"></td>').join('')+'</tr>';
    }).join('');
    const tabs='<div class="sheet-tabs">'+sheets.map((sh,i)=>'<button class="studio-tool '+(i===state.sheet?'on':'')+'" data-sheet="'+i+'">'+esc(sh.name)+'</button>').join('')+'<button class="studio-tool" data-add-sheet>＋ Sheet</button></div>';
    const rowPager=rows.length>rowPage?'<div class="sheet-pager"><button class="studio-tool" data-row-prev '+(state.rowStart===0?'disabled':'')+'>‹ Rows</button><span>Rows '+(state.rowStart+1)+'–'+endRow+' of '+rows.length+'</span><button class="studio-tool" data-row-next '+(endRow>=rows.length?'disabled':'')+'>Rows ›</button></div>':'';
    const colPager=cols>colPage?'<div class="sheet-pager"><button class="studio-tool" data-col-prev '+(state.colStart===0?'disabled':'')+'>‹ Columns</button><span>'+colName(state.colStart)+'–'+colName(endCol-1)+' of '+colName(cols-1)+'</span><button class="studio-tool" data-col-next '+(endCol>=cols?'disabled':'')+'>Columns ›</button></div>':'';
    w.innerHTML='<div class="studio-tools"><button class="studio-tool" data-add-row>＋ Row</button><button class="studio-tool" data-add-col>＋ Column</button><button class="studio-tool" data-rename-sheet>Rename Sheet</button>'+(sheets.length>1?'<button class="studio-tool" data-delete-sheet>Delete Sheet</button>':'')+'<button class="studio-tool" data-chart>▥ Chart</button><button class="studio-tool" data-csv>CSV</button><span class="studio-status">'+sheets.length+' sheet'+(sheets.length===1?'':'s')+' · '+rows.length+' × '+cols+' · virtual view</span></div>'+tabs+rowPager+colPager+'<div class="formula-bar" data-formula-bar>Tap a cell · formulas: =C2*D2, =SUM(C2:C10)</div><div class="sheet-wrap"><table class="sheet-grid"><thead><tr><th>#</th>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div><div class="sheet-chart" data-chart-panel hidden></div>';
    w.querySelectorAll('[data-cell]').forEach(i=>{
      i.oninput=()=>{
        const r=+i.dataset.r,c=+i.dataset.c,row=sheets[state.sheet].rows[r]||(sheets[state.sheet].rows[r]=[]);
        while(row.length<=c)row.push('');
        row[c]=i.value;queueSave();showFormula(i,sheets[state.sheet].rows);
      };
      i.onfocus=()=>showFormula(i,sheets[state.sheet].rows);
    });
    w.querySelectorAll('[data-sheet]').forEach(b=>b.onclick=()=>{const a=captureSheets(sheets);state.rowStart=0;state.colStart=0;replaceSheets(a,+b.dataset.sheet)});
    w.querySelector('[data-add-sheet]').onclick=()=>{const a=captureSheets(sheets);a.push({name:'Sheet'+(a.length+1),rows:[['']]});state.rowStart=0;state.colStart=0;replaceSheets(a,a.length-1)};
    w.querySelector('[data-rename-sheet]').onclick=()=>{const a=captureSheets(sheets),name=prompt('Sheet name',a[state.sheet].name);if(name&&name.trim()){a[state.sheet].name=name.trim().slice(0,31);replaceSheets(a)}};
    const del=w.querySelector('[data-delete-sheet]');if(del)del.onclick=()=>{const a=captureSheets(sheets);a.splice(state.sheet,1);state.rowStart=0;state.colStart=0;replaceSheets(a,Math.max(0,state.sheet-1))};
    w.querySelector('[data-add-row]').onclick=()=>{const a=captureSheets(sheets),r=a[state.sheet].rows;r.push(Array.from({length:r[0]?.length||6},()=>''));state.rowStart=Math.max(0,r.length-rowPage);replaceSheets(a)};
    w.querySelector('[data-add-col]').onclick=()=>{const a=captureSheets(sheets);a[state.sheet].rows.forEach(x=>x.push(''));state.colStart=Math.max(0,cols+1-colPage);replaceSheets(a)};
    w.querySelector('[data-chart]').onclick=()=>toggleChart(captureSheets(sheets)[state.sheet].rows);
    w.querySelector('[data-csv]').onclick=()=>{saveDraft();const n=safeName(document.querySelector('[data-title]')?.value)+'-'+safeName(sheets[state.sheet].name),rowsNow=captureSheets(sheets)[state.sheet].rows;window.MSAOffice?.download(n+'.csv',window.MSAOffice.csv(rowsNow),'text/csv;charset=utf-8')};
    const rowPrev=w.querySelector('[data-row-prev]'),rowNext=w.querySelector('[data-row-next]'),colPrev=w.querySelector('[data-col-prev]'),colNext=w.querySelector('[data-col-next]');
    if(rowPrev)rowPrev.onclick=()=>{const a=captureSheets(sheets);state.rowStart=Math.max(0,state.rowStart-rowPage);renderSheet(w,a)};
    if(rowNext)rowNext.onclick=()=>{const a=captureSheets(sheets);state.rowStart=Math.min(maxRowStart,state.rowStart+rowPage);renderSheet(w,a)};
    if(colPrev)colPrev.onclick=()=>{const a=captureSheets(sheets);state.colStart=Math.max(0,state.colStart-colPage);renderSheet(w,a)};
    if(colNext)colNext.onclick=()=>{const a=captureSheets(sheets);state.colStart=Math.min(maxColStart,state.colStart+colPage);renderSheet(w,a)};
  }
  function showFormula(input,rows){
    const bar=document.querySelector('[data-formula-bar]');if(!bar)return;const raw=input.value,ref=colName(+input.dataset.c)+(+input.dataset.r+1);
    if(raw.trim().startsWith('=')){const v=evalFormula(raw,rows);bar.textContent=ref+'  '+raw+'  →  '+(Number.isFinite(v)?v:'Formula error')}else bar.textContent=ref+'  '+raw;
  }
  function toggleChart(rows){
    const p=document.querySelector('[data-chart-panel]');if(!p)return;if(!p.hidden){p.hidden=true;return}
    let valueCol=-1;for(let c=1;c<(rows[0]?.length||0);c++){if(rows.slice(1).some((r,i)=>String(r[c]??'').trim()!==''&&Number.isFinite(cellNumber(rows,i+1,c)))){valueCol=c;break}}
    if(valueCol<0){p.innerHTML='<div class="studio-status">Add numeric data to create a chart preview.</div>';p.hidden=false;return}
    const points=rows.slice(1).map((r,i)=>({label:String(r[0]||'Row '+(i+2)),value:cellNumber(rows,i+1,valueCol)})).filter(x=>Number.isFinite(x.value)).slice(0,16);
    const max=Math.max(1,...points.map(x=>Math.abs(x.value)));p.innerHTML='<b class="chart-title">'+esc(rows[0]?.[valueCol]||'Chart')+'</b>'+points.map(x=>'<div class="chart-row"><span>'+esc(x.label)+'</span><i><b style="width:'+Math.max(2,Math.abs(x.value)/max*100)+'%"></b></i><strong>'+x.value+'</strong></div>').join('');p.hidden=false;
  }
  function readSheet(){return captureSheets(storedSheets())[state.sheet]?.rows||[['']]}
  function currentSheets(){return captureSheets(storedSheets())}

  function renderPresentation(w,slides){
    const s=slides[state.slide]||slides[0],image=s.image||'',layout=s.layout||'title-body';
    w.innerHTML='<div class="studio-tools"><button class="studio-tool" data-add-slide>＋ Slide</button><button class="studio-tool" data-del-slide>Delete</button><button class="studio-tool" data-slide-image>🖼 Image</button>'+(image?'<button class="studio-tool" data-remove-image>Remove image</button>':'')+'<span class="studio-status">'+slides.length+' slide'+(slides.length===1?'':'s')+'</span></div><div class="slide-tabs">'+slides.map((x,i)=>'<button class="studio-tool '+(i===state.slide?'on':'')+'" data-slide="'+i+'">'+(i+1)+'</button>').join('')+'</div><div class="slide-editor"><select data-slide-layout><option value="title-body">Title + body</option><option value="image-right">Image right</option><option value="image-full">Large image</option></select><input data-slide-title placeholder="Slide title" value="'+esc(s.title||'')+'"><textarea data-slide-body placeholder="Slide content">'+esc(s.body||'')+'</textarea>'+(image?'<img class="slide-image-preview" src="'+image+'" alt="Slide image">':'<div class="slide-image-empty">Add an image for visual layouts</div>')+'</div>';
    const sel=w.querySelector('[data-slide-layout]');sel.value=layout;sel.onchange=queueSave;
    w.querySelectorAll('[data-slide]').forEach(b=>b.onclick=()=>{saveDraft();state.slide=+b.dataset.slide;render()});
    w.querySelector('[data-slide-title]').oninput=queueSave;w.querySelector('[data-slide-body]').oninput=queueSave;
    w.querySelector('[data-add-slide]').onclick=()=>{const a=readSlides(slides);a.push({title:'New slide',body:'',layout:'title-body',image:''});state.slide=a.length-1;replaceSlides(a)};
    w.querySelector('[data-del-slide]').onclick=()=>{if(slides.length<=1)return;const a=readSlides(slides);a.splice(state.slide,1);state.slide=Math.max(0,state.slide-1);replaceSlides(a)};
    w.querySelector('[data-slide-image]').onclick=()=>pickSlideImage(slides);
    const remove=w.querySelector('[data-remove-image]');if(remove)remove.onclick=()=>{const a=readSlides(slides);a[state.slide].image='';replaceSlides(a)};
  }
  function readSlides(base){
    const a=base.map(x=>({...x})),t=document.querySelector('[data-slide-title]'),b=document.querySelector('[data-slide-body]'),l=document.querySelector('[data-slide-layout]');
    if(a[state.slide]&&t&&b)a[state.slide]={...a[state.slide],title:t.value,body:b.value,layout:l?.value||a[state.slide].layout||'title-body'};return a;
  }
  function pickDocumentImage(editor){
    const input=document.createElement('input');input.type='file';input.accept='image/*';input.hidden=true;
    input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const data=await resizeImage(file);editor.focus();window.MSAEditorAdapter?.insertHTML?.('<p><img src="'+data+'" alt="'+esc(file.name)+'"></p><p><br></p>',editor);queueSave()}catch(e){friendlyError(e.message)}finally{input.remove()}};
    document.body.appendChild(input);input.click();
  }
  function resizeImage(file){
    if(window.MSAMedia?.resizeImage)return window.MSAMedia.resizeImage(file,{max:1280,quality:.78,type:'image/jpeg'});
    return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onerror=()=>reject(fr.error);fr.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Image could not be read'));img.onload=()=>{const max=1280,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.78))};img.src=fr.result};fr.readAsDataURL(file)});
  }
  function pickSlideImage(slides){
    const input=document.createElement('input');input.type='file';input.accept='image/*';input.hidden=true;
    input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{const data=await resizeImage(file),a=readSlides(slides);a[state.slide].image=data;if(a[state.slide].layout==='title-body')a[state.slide].layout='image-right';replaceSlides(a)}catch(e){friendlyError(e.message)}finally{input.remove()}};
    document.body.appendChild(input);input.click();
  }
  function replaceSlides(slides){
    const p={id:state.id||('p_'+Date.now().toString(36)),type:'presentation',title:document.querySelector('[data-title]')?.value||'Untitled Presentation',content:JSON.stringify({slides}),updated:Date.now()};state.id=p.id;put(p);state.dirty=false;render();recordHistory();
  }
  function currentSlides(){
    const p=state.id&&get(state.id),data=json(p?.content,{slides:defaultSlides()}),base=Array.isArray(data)?data:(data.slides||defaultSlides());return readSlides(base);
  }

  function preview(){const c=document.querySelector('[data-code]'),f=document.querySelector('[data-preview]');if(c&&f)f.srcdoc=window.MSASecurity?.previewHTML(c.value)||c.value}
  function currentContent(){
    if(state.type==='document')return sanitizeHTML(document.querySelector('[data-doc]')?.innerHTML||'');
    if(state.type==='html')return document.querySelector('[data-code]')?.value||'';
    if(state.type==='spreadsheet')return JSON.stringify({sheets:currentSheets(),activeSheet:state.sheet});
    if(state.type==='presentation')return JSON.stringify({slides:currentSlides()});
    if(state.type==='pdf'){const ta=document.querySelector('[data-pdf-text]');return ta?ta.value:(get(state.id)?.content||'')}return'';
  }
  function saveDraft(manual=false){
    if(!TYPES[state.type])return;if(manual)checkpointHistory();const title=document.querySelector('[data-title]')?.value.trim()||'Untitled '+TYPES[state.type][1];if(!state.id)state.id='p_'+Date.now().toString(36);
    try{put({id:state.id,type:state.type,title,content:currentContent(),updated:Date.now()})}catch(e){friendlyError('This draft is too large for local storage. Remove a large image, export the file, or back up the workspace first.');return}
    state.dirty=false;const s=document.querySelector('.studio-status');if(s)s.textContent='Saved locally · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});if(manual)friendlySuccess('Saved in MSA One › Files on this device.');renderRecents();
  }
  function queueSave(){
    state.dirty=true;scheduleHistory();clearTimeout(state.timer);
    if(state.idleSave!=null){window.MSAPerformance?.cancelIdle?.(state.idleSave);state.idleSave=null}
    state.timer=setTimeout(()=>{
      if(window.MSAPerformance?.idle)state.idleSave=window.MSAPerformance.idle(()=>{state.idleSave=null;saveDraft()},900);
      else saveDraft();
    },480);
  }
  function open(type='document',id=null){mount();if(state.historyKey)window.MSAEditorHistory?.cancel?.(state.historyKey);if(state.dirty)saveDraft();state.type=TYPES[type]?type:'document';state.id=id||(window.MSACore?.uid?.('p')||('p_'+Date.now().toString(36)));state.historyKey='project:'+state.id;state.dirty=false;state.slide=0;state.sheet=0;state.rowStart=0;state.colStart=0;if(state.type==='pdf'&&id){const project=get(state.id);window.MSAPDFReadiness?.openProject?.(project||{id:state.id,title:'PDF'})}document.body.classList.add('studio-open');const overlay=document.querySelector('.studio-overlay');overlay.classList.add('on','studio-opening');setTimeout(()=>overlay.classList.remove('studio-opening'),260);render();beginHistory();requestAnimationFrame(()=>{window.MSAHelper?.refresh?.();window.MSAPerformance?.mount?.()})}
  function close(){
    checkpointHistory();cancelSaveTimer();
    saveDraft();if(state.pdfObjectUrl){URL.revokeObjectURL(state.pdfObjectUrl);state.pdfObjectUrl=null}document.body.classList.remove('studio-open');document.querySelector('.studio-overlay')?.classList.remove('on');requestAnimationFrame(()=>window.MSAHelper?.refresh?.());
  }
  function openProject(id){const p=get(id);if(p)open(p.type,p.id)}
  function createProject(type,title,content){
    if(!TYPES[type])throw new Error('Unsupported project type: '+type);
    const id=window.MSACore?.uid('p')||('p_'+Date.now().toString(36));
    const project=window.MSASecurity?.sanitizeProject({id,type,title:title||('Untitled '+TYPES[type][1]),content:content??'',updated:Date.now()})||{id,type,title:title||('Untitled '+TYPES[type][1]),content:content??'',updated:Date.now()};
    put(project);open(type,id);return id;
  }
  function renderRecents(){
    const r=document.querySelector('[data-recents]');if(!r)return;const a=all().slice(0,5);
    r.innerHTML=a.length?'<div class="studio-status">RECENT DRAFTS</div>'+a.map(p=>'<div class="studio-recent"><span>'+(TYPES[p.type]?.[0]||'◆')+'</span><div><b>'+esc(p.title)+'</b><div class="studio-status">'+new Date(p.updated).toLocaleString()+'</div></div><button class="studio-tool" data-open="'+p.id+'">Open</button></div>').join(''):'';
    r.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openProject(b.dataset.open));
  }
  function exportPDF(text){
    const title=document.querySelector('[data-title]')?.value||'MSA One',name=safeName(title);if(!window.MSAOffice){friendlyError('The Office export engine is not available. Open Help for recovery options.');return}
    window.MSAOffice.download(name+'.pdf',window.MSAOffice.pdf(text,title),'application/pdf');
  }
  function sanitizeHTML(html){
    if(window.MSASecurity?.sanitizeRichHTML)return window.MSASecurity.sanitizeRichHTML(html);
    const d=document.createElement('div');d.textContent=String(html||'');return d.innerHTML;
  }
  function parseCSV(text,delimiter=','){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i],next=text[i+1];
      if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;continue}
      if(ch==='"'){quoted=!quoted;continue}
      if(ch===delimiter&&!quoted){row.push(cell);cell='';continue}
      if((ch==='\n'||ch==='\r')&&!quoted){
        if(ch==='\r'&&next==='\n')i++;row.push(cell);cell='';if(row.some(x=>x!==''))rows.push(row);row=[];continue;
      }
      cell+=ch;
    }
    row.push(cell);if(row.some(x=>x!==''))rows.push(row);return rows.length?rows:[['']];
  }
  async function parseCSVAsync(text,delimiter=','){
    if(text.length<180000)return parseCSV(text,delimiter);
    const rows=[];let row=[],cell='',quoted=false,start=performance.now();
    for(let i=0;i<text.length;i++){
      const ch=text[i],next=text[i+1];
      if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;continue}
      if(ch==='"'){quoted=!quoted;continue}
      if(ch===delimiter&&!quoted){row.push(cell);cell='';continue}
      if((ch==='\n'||ch==='\r')&&!quoted){
        if(ch==='\r'&&next==='\n')i++;row.push(cell);cell='';if(row.some(x=>x!==''))rows.push(row);row=[];continue;
      }
      cell+=ch;
      if((i&8191)===0&&performance.now()-start>8){await(window.MSAPerformance?.yieldUI?.()||Promise.resolve());start=performance.now()}
    }
    row.push(cell);if(row.some(x=>x!==''))rows.push(row);return rows.length?rows:[['']];
  }
  async function runBusy(label,fn){
    if(window.MSAPerformance?.withBusy)return window.MSAPerformance.withBusy(label,fn);
    return fn(()=>{});
  }

  async function importCurrent(){
    if(state.type==='pdf'&&window.MSANativeFiles?.isNative?.()){
      try{
        const result=await window.MSANativeFiles.pickFiles({multiple:false}),item=result?.files?.[0];
        if(item&&String(item.name||'').toLowerCase().endsWith('.pdf')){
          const title=document.querySelector('[data-title]');if(title)title.value=(item.name||'PDF').replace(/\.[^.]+$/,'');
          if(!state.id)state.id='p_'+Date.now().toString(36);
          put({id:state.id,type:'pdf',title:title?.value||'PDF',content:'native-pdf:'+encodeURIComponent(item.uri),updated:Date.now()});render();friendlySuccess('PDF linked securely from Android storage.');return;
        }
      }catch(e){window.MSAHelper?.notify?.('Native PDF picker unavailable · using standard picker','info')}
    }
    const input=document.createElement('input');input.type='file';input.hidden=true;
    if(state.type==='spreadsheet')input.accept='.xlsx,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/tab-separated-values';
    else if(state.type==='document')input.accept='.docx,.txt,.html,.htm,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/html';
    else if(state.type==='html')input.accept='.html,.htm,.txt,text/html,text/plain';
    else if(state.type==='presentation')input.accept='.pptx,image/*,.json,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/json';
    else input.accept='.pdf,.txt,application/pdf,text/plain';
    input.onchange=async()=>{
      const file=input.files?.[0];if(!file)return;
      try{
        const ext=(file.name.split('.').pop()||'').toLowerCase(),base=file.name.replace(/\.[^.]+$/,'');
        if(['docx','xlsx','pptx','pdf'].includes(ext)){
          if(!window.MSAImport)throw new Error('Office import engine is not loaded.');
          const imported=await runBusy('Opening '+file.name,progress=>window.MSAImport.readFile(file,progress)),id='p_'+Date.now().toString(36);
          let content='';
          if(imported.type==='document')content=imported.html;
          else if(imported.type==='spreadsheet')content=JSON.stringify({sheets:imported.sheets,activeSheet:0});
          else if(imported.type==='presentation')content=JSON.stringify({slides:imported.slides});
          else if(imported.type==='pdf')content=imported.blobUrl;
          put({id,type:imported.type,title:base,content,updated:Date.now()});
          open(imported.type,id);return;
        }
        const title=document.querySelector('[data-title]');if(title)title.value=base;
        if(state.type==='spreadsheet'){
          const text=await file.text(),delimiter=ext==='tsv'?'\t':',',rows=await runBusy('Reading '+file.name,async progress=>{progress('Parsing rows…');return parseCSVAsync(text,delimiter)});replaceSheets([{name:'Sheet1',rows}],0);
        }else if(state.type==='document'){
          const text=await file.text(),html=/\.html?$/i.test(file.name)?sanitizeHTML(text):'<p>'+esc(text).replace(/\r?\n/g,'</p><p>')+'</p>';
          const ed=document.querySelector('[data-doc]');if(ed){ed.innerHTML=html;queueSave()}
        }else if(state.type==='html'){
          const text=await file.text(),c=document.querySelector('[data-code]');if(c){c.value=text;preview();queueSave()}
        }else if(state.type==='pdf'){
          const text=await file.text(),ta=document.querySelector('[data-pdf-text]');if(ta){ta.value=text;queueSave()}
        }else if(state.type==='presentation'&&file.type.startsWith('image/')){
          const data=await resizeImage(file),slides=currentSlides();slides[state.slide].image=data;if(slides[state.slide].layout==='title-body')slides[state.slide].layout='image-right';replaceSlides(slides);
        }else if(state.type==='presentation'){
          const data=JSON.parse(await file.text()),slides=Array.isArray(data)?data:data.slides;
          if(!Array.isArray(slides)||!slides.length)throw new Error('Presentation JSON must contain a slides array');
          replaceSlides(slides.map(x=>({title:String(x.title||''),body:String(x.body||''),layout:['title-body','image-right','image-full'].includes(x.layout)?x.layout:'title-body',image:/^data:image\//.test(x.image||'')?x.image:''})));
        }
      }catch(e){friendlyError('Import failed: '+e.message)}finally{input.remove()}
    };
    document.body.appendChild(input);input.click();
  }

  async function exportCurrent(){
    saveDraft();if(!window.MSAOffice){friendlyError('The Office export engine is not available. Open Help for recovery options.');return}
    const title=document.querySelector('[data-title]')?.value||'MSA One',name=safeName(title);
    try{
      await runBusy('Preparing '+(TYPES[state.type]?.[1]||'file'),async progress=>{
        progress('Building file…');await(window.MSAPerformance?.yieldUI?.()||Promise.resolve());
        if(state.type==='html')window.MSAOffice.download(name+'.html',currentContent(),'text/html;charset=utf-8');
        else if(state.type==='document')window.MSAOffice.download(name+'.docx',window.MSAOffice.docx(title,currentContent()),'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        else if(state.type==='spreadsheet')window.MSAOffice.download(name+'.xlsx',window.MSAOffice.xlsx({sheets:currentSheets()}),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        else if(state.type==='presentation')window.MSAOffice.download(name+'.pptx',window.MSAOffice.pptx(currentSlides()),'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        else if(state.type==='pdf')exportPDF(currentContent());
      });
      friendlySuccess((TYPES[state.type]?.[1]||'File')+' export prepared on this device.');
    }catch(e){friendlyError('Export failed: '+e.message)}
  }

  window.MSAStudio={open,close,saveDraft,importCurrent,exportCurrent,openProject,createProject,evalFormula,pickDocumentImage,undo:undoStudio,redo:redoStudio,historyStatus:()=>window.MSAEditorHistory?.status?.(historyKey())};
  document.addEventListener('DOMContentLoaded',mount);setTimeout(mount,400);
})();