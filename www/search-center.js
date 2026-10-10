(()=>{'use strict';
const FILTERS=['all','files','tools','templates','ai','calendar','actions'];
const LABELS={all:'All',files:'Files',tools:'Tools',templates:'Templates',ai:'AI',calendar:'Calendar',actions:'Actions'};
const registry=new Map();
let panel=null,scrim=null,input=null,results=null,filters=null,activeKind='all';

function projects(){try{return globalThis.MSAProjects?.all?.()||JSON.parse(globalThis.localStorage?.getItem?.('msaOneProjectsV1')||'[]')}catch{return[]}}
function templates(){const a=[];try{a.push(...(globalThis.MSALibrary?.allTemplates?.()||[]))}catch{};a.push(...(globalThis.MSATemplateCatalog||[]));const seen=new Set();return a.filter(x=>{const id=x?.id||x?.name||x?.title;if(!id||seen.has(id))return false;seen.add(id);return true})}
function assistants(){return (globalThis.MSAAssistantCatalog||[]).flatMap(g=>(g.items||[]).map(x=>({...x,group:g.group})))}
function tools(){return globalThis.MSAToolsCatalog||[]}
function planner(){try{return JSON.parse(globalThis.localStorage?.getItem?.('msaOnePlannerV1')||'[]')}catch{return[]}}
function fileIcon(type){return({document:'📄',spreadsheet:'📊',presentation:'📽',pdf:'📕',html:'🌐',image:'🖼'}[type]||'▣')}
function score(value,q){const s=String(value||'').toLowerCase(),needle=String(q||'').trim().toLowerCase();if(!needle)return 1;if(s===needle)return 100;if(s.startsWith(needle))return 50;if(s.includes(needle))return 20;return 0}
function matches(values,q){return Math.max(0,...values.map(v=>score(v,q)))}
function registerProvider(provider){if(!provider?.id||typeof provider.search!=='function')return false;registry.set(provider.id,{id:provider.id,label:provider.label||LABELS[provider.id]||provider.id,search:provider.search});return true}
function normalize(item,providerId){if(!item||typeof item!=='object'||!item.id||!item.title||typeof item.action!=='function')return null;return{id:String(item.id),kind:String(item.kind||providerId),icon:item.icon||'•',title:String(item.title),subtitle:String(item.subtitle||item.sub||''),score:Number.isFinite(Number(item.score))?Number(item.score):1,action:item.action,provider:providerId}}
function search(query='',{kind='all'}={}){
 const wanted=FILTERS.includes(kind)?kind:'all',dedupe=new Map();
 for(const provider of registry.values()){
  if(wanted!=='all'&&provider.id!==wanted)continue;
  let raw=[];try{raw=provider.search(query)||[]}catch{continue}
  if(!Array.isArray(raw))continue;
  for(const candidate of raw){const item=normalize(candidate,provider.id);if(!item)continue;const prior=dedupe.get(item.id);if(!prior||item.score>prior.score)dedupe.set(item.id,item)}
 }
 return [...dedupe.values()].sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,60)
}
function action(id,title,icon,run,keywords=''){return{id:'cmd:'+id,kind:'actions',icon,title,subtitle:'Action',score:1,keywords,action:run}}
function registerBuiltins(){
 registerProvider({id:'files',label:'Files',search:q=>projects().map(p=>{const n=matches([p.title,p.type,p.path,p.name],q);return n?{id:'file:'+p.id,kind:'files',icon:fileIcon(p.type),title:p.title||p.name||'Untitled',subtitle:p.type||'File',score:n,action:()=>globalThis.MSAFiles?.openProject?.(p.id)}:null}).filter(Boolean)});
 registerProvider({id:'tools',label:'Tools',search:q=>tools().map(t=>{const n=matches([t.name,t.desc,t.category],q);return n?{id:'tool:'+t.id,kind:'tools',icon:t.icon,title:t.name,subtitle:t.desc||t.category,score:n,action:()=>globalThis.MSAToolsCenter?.run?.(t)}:null}).filter(Boolean)});
 registerProvider({id:'templates',label:'Templates',search:q=>templates().map(t=>{const title=t.name||t.title,n=matches([title,t.category,t.desc||t.description],q);return n?{id:'template:'+(t.id||title),kind:'templates',icon:t.icon||fileIcon(t.type),title,subtitle:t.category||t.type||'Template',score:n,action:()=>globalThis.MSATemplateCenter?.use?.(t)}:null}).filter(Boolean)});
 registerProvider({id:'ai',label:'AI',search:q=>assistants().map(a=>{const n=matches([a.name,a.group,a.prompt],q);return n?{id:'ai:'+a.id,kind:'ai',icon:a.icon||'✦',title:a.name,subtitle:a.group||'Assistant',score:n,action:()=>globalThis.MSAAIWorkspace?.openAssistant?.(a)}:null}).filter(Boolean)});
 registerProvider({id:'calendar',label:'Calendar',search:q=>planner().map(x=>{const n=matches([x.title,x.note,x.date,x.kind,x.time],q);return n?{id:'calendar:'+x.id,kind:'calendar',icon:'▦',title:x.title||'Planner entry',subtitle:[x.date,x.time,x.kind].filter(Boolean).join(' · '),score:n,action:()=>globalThis.MSAAppShell?.open?.('myday')}:null}).filter(Boolean)});
 registerProvider({id:'actions',label:'Actions',search:q=>[
  action('new-document','New Document','📄',()=>globalThis.MSAActionHub?.run?.('document'),'create document word report'),
  action('scan','Scan','📷',()=>globalThis.MSAActions?.runAction?.('scan'),'camera capture'),
  action('import','Import','↥',()=>globalThis.MSAFiles?.importOfficeFile?.(),'open file import'),
  action('backup','Backup','💾',()=>globalThis.MSAStorage?.downloadBackup?.(),'storage export workspace'),
  action('settings','Settings','⚙',()=>{globalThis.MSAAppShell?.open?.('me');setTimeout(()=>globalThis.MSASettingsV2?.mount?.(),40)},'display buttons preferences'),
  action('myday','Open My Day','▦',()=>globalThis.MSAAppShell?.open?.('myday'),'calendar planner diary')
 ].map(x=>{const n=matches([x.title,x.keywords],q);return n?{...x,score:n}:null}).filter(Boolean)})
}
function filterHTML(){return FILTERS.map(k=>'<button class="ws-chip '+(activeKind===k?'on':'')+'" data-search-kind="'+k+'">'+LABELS[k]+'</button>').join('')}
function ensure(){if(panel||typeof document==='undefined')return;scrim=document.createElement('div');scrim.className='ws-search-scrim';scrim.onclick=close;panel=document.createElement('section');panel.className='ws-search-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Search MSA One');panel.innerHTML='<div class="ws-search-head"><button class="ws-icon" aria-label="Close search" data-close>‹</button><div class="ws-search"><span>⌕</span><input data-q aria-label="Search MSA One" placeholder="Search files, tools, templates, AI, calendar and actions"></div></div><div class="ws-chipbar" data-filters>'+filterHTML()+'</div><div class="ws-search-results" data-results></div>';document.body.append(scrim,panel);input=panel.querySelector('[data-q]');results=panel.querySelector('[data-results]');filters=panel.querySelector('[data-filters]');panel.querySelector('[data-close]').onclick=close;input.oninput=()=>render();wireFilters()}
function wireFilters(){filters?.querySelectorAll('[data-search-kind]').forEach(b=>b.onclick=()=>{activeKind=b.dataset.searchKind;filters.innerHTML=filterHTML();wireFilters();render()})}
function render(seed){if(seed!==undefined&&input)input.value=seed;const q=input?.value||String(seed||''),items=search(q,{kind:activeKind});if(!results)return items;results.innerHTML=items.length?items.map((x,i)=>'<button class="ws-row" data-result="'+i+'"><span class="ws-row-icon">'+esc(x.icon)+'</span><span class="ws-row-meta"><b>'+esc(x.title)+'</b><small>'+esc(LABELS[x.kind]||x.kind)+' · '+esc(x.subtitle||'')+'</small></span><span>›</span></button>').join(''):'<div class="ws-empty">No matching results.</div>';results.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{const x=items[+b.dataset.result];close();x?.action?.()});return items}
function open(seed=''){ensure();if(!panel)return;activeKind='all';filters.innerHTML=filterHTML();wireFilters();input.value=seed;render();scrim.classList.add('on');panel.classList.add('on');setTimeout(()=>input.focus(),60)}
function close(){scrim?.classList.remove('on');panel?.classList.remove('on')}
function providers(){return[...registry.keys()]}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
registerBuiltins();
globalThis.MSASearchCenter={open,close,render,search,registerProvider,providers,filters:[...FILTERS]};
})();