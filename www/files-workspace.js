(()=>{const KEY='msaOneProjectsV1',ICON={document:'📄',html:'🌐',spreadsheet:'📊',presentation:'📽️',pdf:'📕'};let query='';
function all(){if(window.MSAProjects)return window.MSAProjects.all();try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function write(a){if(window.MSAProjects)window.MSAProjects.write(a);else{const raw=JSON.stringify(a);localStorage.setItem(KEY,raw);window.MSAStorage?.mirror(KEY,raw)}renderFiles()}
function esc(s=''){return window.MSACore?.escapeHTML(s)??String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function updateWorkspaceStats(){const a=all(),set=(q,v)=>{const e=document.querySelector(q);if(e)e.textContent=v};set('[data-stat-docs]',a.filter(x=>x.type==='document').length);set('[data-stat-sheets]',a.filter(x=>x.type==='spreadsheet').length);set('[data-stat-slides]',a.filter(x=>x.type==='presentation').length);let bytes=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i),v=localStorage.getItem(k)||'';bytes+=(String(k).length+v.length)*2}}catch{}const label=bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':Math.max(0,Math.round(bytes/1024))+' KB';set('[data-stat-size]',label)}
function openProject(id){let p=all().find(x=>x.id===id);if(p&&window.MSAStudio)MSAStudio.open(p.type,p.id)}
function renameProject(id){let a=all(),p=a.find(x=>x.id===id);if(!p)return;let n=prompt('Rename project',p.title);if(n&&n.trim()){p.title=n.trim();p.updated=Date.now();write(a)}}
function duplicateProject(id){let a=all(),p=a.find(x=>x.id===id);if(!p)return;let c={...p,id:'p_'+Date.now().toString(36),title:p.title+' Copy',updated:Date.now()};a.unshift(c);write(a)}
function deleteProject(id){let a=all(),p=a.find(x=>x.id===id);if(!p)return;if(!confirm('Delete “'+p.title+'”?'))return;write(a.filter(x=>x.id!==id));if(window.MSAHelper?.success)window.MSAHelper.success('“'+p.title+'” deleted.',[{label:'Undo',run:()=>{let next=all();next.unshift(p);write(next);window.MSAHelper?.success('Project restored.')}}])}
async function importOneFile(file,{open=false}={}){
 if(!file)return null;
 const ext=(file.name.split('.').pop()||'').toLowerCase(),id='p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),base=file.name.replace(/\.[^.]+$/,'');
 let type='',content='';
 if(['docx','xlsx','pptx','pdf'].includes(ext)){
   if(!window.MSAImport)throw new Error('Office import engine is not loaded.');
   const imported=await window.MSAImport.readFile(file);
   type=imported.type;
   if(type==='document')content=imported.html;
   else if(type==='spreadsheet')content=JSON.stringify({sheets:imported.sheets,activeSheet:0});
   else if(type==='presentation')content=JSON.stringify({slides:imported.slides});
   else if(type==='pdf')content=imported.blobUrl;
 }else if(ext==='csv'||ext==='tsv'){
   const delimiter=ext==='tsv'?'\t':',',rows=(await file.text()).split(/\r?\n/).filter(Boolean).map(line=>line.split(delimiter));
   type='spreadsheet';content=JSON.stringify({sheets:[{name:'Sheet1',rows}],activeSheet:0});
 }else if(ext==='html'||ext==='htm'){
   type='html';content=await file.text();
 }else if(ext==='txt'||ext==='rtf'){
   type='document';content='<p>'+esc(await file.text()).replace(/\r?\n/g,'</p><p>')+'</p>';
 }else return null;
 const a=all();a.unshift({id,type,title:base,content,updated:Date.now()});write(a.slice(0,50));
 if(open)openProject(id);
 return id;
}
async function importNativeDescriptor(item,{open=false}={}){
 if(!item?.uri)return null;
 const ext=(item.name?.split('.').pop()||'').toLowerCase();
 if(ext==='pdf'){
   const id='p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),base=(item.name||'PDF').replace(/\.[^.]+$/,'');
   const a=all();a.unshift({id,type:'pdf',title:base,content:'native-pdf:'+encodeURIComponent(item.uri),updated:Date.now()});write(a.slice(0,50));
   if(open)openProject(id);return id;
 }
 const file=await window.MSANativeFiles.readDescriptor(item);
 return importOneFile(file,{open});
}
async function importOfficeFile(){
 if(window.MSANativeFiles?.isNative?.()){
   try{
     const result=await window.MSANativeFiles.pickFiles({multiple:false});
     const item=result?.files?.[0];if(!item)return;
     await importNativeDescriptor(item,{open:true});return;
   }catch(e){window.MSAHelper?.notify?.('Native picker unavailable · using browser picker','info')}
 }
 const input=document.createElement('input');input.type='file';input.hidden=true;input.accept='.docx,.xlsx,.pptx,.pdf,.csv,.tsv,.txt,.rtf,.html,.htm,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,text/html';
 input.onchange=async()=>{const file=input.files?.[0];if(!file)return;try{await importOneFile(file,{open:true})}catch(e){if(window.MSAHelper?.error)window.MSAHelper.error('Office file could not be opened: '+e.message,[{label:'Troubleshoot',run:()=>window.MSAHelper.open('trouble')}]);else alert('Office file could not be opened: '+e.message)}finally{input.remove()}};
 document.body.appendChild(input);input.click();
}
async function importFolder(nativeRescan=false){
 try{
   let files=[];
   if(window.MSANativeFiles?.isNative?.()){
     const folder=nativeRescan?await window.MSANativeFiles.rescanFolder():await window.MSANativeFiles.pickFolder();
     if(folder?.cancelled)return;
     let imported=0,failed=0;
     const list=(folder.files||[]).slice(0,50);
     for(let i=0;i<list.length;i++){
       const item=list[i];window.MSAHelper?.notify?.('Importing '+(i+1)+'/'+list.length+' · '+item.name,'info');
       try{if(await importNativeDescriptor(item))imported++}catch(e){failed++;console.warn('Native folder import',item.name,e)}
       if((i&3)===3)await(window.MSAPerformance?.yieldUI?.()||Promise.resolve());
     }
     renderFiles();
     if(folder.truncated)window.MSAHelper?.notify?.('Folder scan limited to first 1000 supported files.','info');
     if(failed)window.MSAHelper?.notify?.(failed+' file(s) could not be imported.','info');
     window.MSAHelper?.success?.('Folder import complete · '+imported+' file(s) added.');
     return;
   }else{
     files=await new Promise(resolve=>{
       const input=document.createElement('input');input.type='file';input.multiple=true;input.setAttribute('webkitdirectory','');input.hidden=true;
       input.onchange=()=>{const a=[...(input.files||[])];input.remove();resolve(a)};
       document.body.appendChild(input);input.click();
     });
   }
   let imported=0;
   for(const file of files.slice(0,50)){try{if(await importOneFile(file))imported++}catch(e){console.warn('Folder import',file?.name,e)}}
   renderFiles();window.MSAHelper?.success?.('Folder import complete · '+imported+' file(s) added.');
 }catch(e){window.MSAHelper?.error?.('Folder import failed: '+e.message)}
}
function renderFiles(){updateWorkspaceStats();let page=document.querySelector('#files .wrap');if(!page)return;let old=page.querySelector('.msa-files-live');if(!old){old=document.createElement('section');old.className='msa-files-live';page.innerHTML='';page.appendChild(old)}let items=all().filter(p=>(p.title||'').toLowerCase().includes(query.toLowerCase()));old.innerHTML='<section class="hero"><h1>Your files</h1><p class="muted">Saved locally on this device · reopen and continue anytime.</p><div class="files-hero-actions"><button class="studio-primary" data-open-office>Open File</button><button class="files-secondary" data-open-folder>Import Folder</button><button class="files-secondary" data-rescan-folder>Re-scan</button><button class="files-secondary" data-create>＋ Create</button></div><input class="files-search" type="search" placeholder="Search drafts…" value="'+esc(query)+'"></section><div class="files-count">'+items.length+' LOCAL DRAFT'+(items.length===1?'':'S')+'</div><div class="files-list">'+(items.length?items.map(p=>'<article class="file-card"><button class="file-open" data-open="'+p.id+'"><span class="file-icon">'+(ICON[p.type]||'◆')+'</span><span><b>'+esc(p.title||'Untitled')+'</b><small>'+esc(p.type)+' · '+new Date(p.updated).toLocaleString()+'</small></span></button><div class="file-actions"><button data-rename="'+p.id+'">Rename</button><button data-copy="'+p.id+'">Duplicate</button><button data-delete="'+p.id+'">Delete</button></div></article>').join(''):'<div class="files-empty"><b>No saved drafts yet</b><p>Create a Document or Smart HTML project and it will appear here automatically.</p><button class="studio-primary" data-create>＋ Create</button></div>')+'</div>';
 old.querySelector('.files-search').oninput=e=>{query=e.target.value;renderFiles();let s=document.querySelector('.files-search');s?.focus();try{s?.setSelectionRange(query.length,query.length)}catch{}};old.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openProject(b.dataset.open));old.querySelectorAll('[data-rename]').forEach(b=>b.onclick=()=>renameProject(b.dataset.rename));old.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>duplicateProject(b.dataset.copy));old.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteProject(b.dataset.delete));old.querySelectorAll('[data-create]').forEach(c=>c.onclick=()=>window.show?.('create'));let o=old.querySelector('[data-open-office]');if(o)o.onclick=importOfficeFile;let f=old.querySelector('[data-open-folder]');if(f)f.onclick=()=>importFolder(false);let r=old.querySelector('[data-rescan-folder]');if(r)r.onclick=()=>importFolder(true)}
window.MSAFiles={renderFiles,openProject,renameProject,duplicateProject,deleteProject,importOneFile,importNativeDescriptor,importOfficeFile,importFolder,updateWorkspaceStats};document.addEventListener('DOMContentLoaded',renderFiles);document.addEventListener('visibilitychange',()=>{if(!document.hidden)renderFiles()});document.addEventListener('click',e=>{if(e.target.closest('.nav button')?.textContent.includes('Files'))setTimeout(renderFiles,0)});setTimeout(renderFiles,500);
})();