(()=>{'use strict';
const FOURTH_KEY='msaBuild55FourthTab';
const ALLOWED_FOURTH=['myday','tools','library'];
const baseNav=['home','files','create',null,'ai'];
const pages=new Map();
let bottom=null,current='home',assetsBootstrapped=false;

function bootstrapAssets(){
 if(assetsBootstrapped||typeof document==='undefined')return;assetsBootstrapped=true;
 if(!document.querySelector('link[data-msa-ui-system]')){const l=document.createElement('link');l.rel='stylesheet';l.href='ui-system.css';l.dataset.msaUiSystem='1';document.head.appendChild(l)}
 if(!globalThis.MSAIcons&&!document.querySelector('script[data-msa-icons]')){const s=document.createElement('script');s.src='icon-system.js';s.async=false;s.dataset.msaIcons='1';document.head.appendChild(s)}
}
function icon(id,fallback){return globalThis.MSAIcons?.svg?.(id)||fallback}
function topbarHTML(title='MSA One'){
 return '<header class="ws-topbar"><div class="ws-top-row"><button class="ws-icon" aria-label="Menu" data-ws-drawer>'+icon('menu','☰')+'</button><div class="ws-page-head"><span class="ws-page-title">'+esc(title)+'</span><button class="ws-search" aria-label="Search MSA One" data-ws-search><span>'+icon('search','⌕')+'</span><span class="ws-search-copy">Search files, tools, templates, AI</span></button></div><button class="ws-icon ws-avatar" aria-label="Profile" data-ws-profile>M</button></div></header>'
}
function registerPage(def){if(!def?.id)return false;pages.set(def.id,{title:def.title||def.id,kind:def.kind||'page',parent:def.parent||'home',render:typeof def.render==='function'?def.render:null});return true}
function defaults(){
 registerPage({id:'home',title:'Home',parent:null,render:()=>globalThis.MSAHomeV2?.render?.()});
 registerPage({id:'files',title:'Files',render:()=>globalThis.MSAFilesV2?.render?.()});
 registerPage({id:'create',title:'Create',render:()=>globalThis.MSACreateV2?.render?.()});
 registerPage({id:'tools',title:'Tools',render:()=>globalThis.MSAToolsCenter?.render?.()});
 registerPage({id:'templates',title:'Templates',render:()=>globalThis.MSATemplateCenter?.render?.()});
 registerPage({id:'library',title:'Library',render:()=>globalThis.MSALibrary?.render?.()});
 registerPage({id:'ai',title:'AI',render:()=>globalThis.MSAAIWorkspace?.render?.()});
 registerPage({id:'me',title:'Me',render:()=>globalThis.MSASettingsV2?.mount?.()});
 registerPage({id:'premium',title:'Premium'});
 registerPage({id:'myday',title:'My Day',render:()=>globalThis.MSAPlanner?.render?.()});
}
function getFourthTab(){try{const v=localStorage.getItem(FOURTH_KEY);return ALLOWED_FOURTH.includes(v)?v:'myday'}catch{return'myday'}}
function setFourthTab(id){const v=ALLOWED_FOURTH.includes(id)?id:'myday';try{localStorage.setItem(FOURTH_KEY,v);globalThis.MSAStorage?.mirror?.(FOURTH_KEY,v)}catch{};renderBottom();return v}
function navLabel(id){return({home:['home','⌂','Home'],files:['files','▣','Files'],myday:['calendar','▦','My Day'],tools:['tools','◇','Tools'],library:['library','▤','Library'],ai:['ai','✦','AI']}[id]||[id,'•',id])}
function navButton(id){const [ico,fallback,label]=navLabel(id);return '<button data-ws-nav="'+id+'" aria-label="'+esc(label)+'"><b>'+icon(ico,fallback)+'</b><span>'+esc(label)+'</span></button>'}
function ensureBottom(){if(bottom)return;bottom=document.createElement('nav');bottom.className='ws-bottom';bottom.setAttribute('aria-label','Primary');document.body.appendChild(bottom);renderBottom()}
function renderBottom(){if(!bottom)return;const slots=[...baseNav];slots[3]=getFourthTab();bottom.innerHTML=navButton(slots[0])+navButton(slots[1])+'<button class="create" data-ws-nav="create" aria-label="Create"><b>'+icon('plus','＋')+'</b><span>Create</span></button>'+navButton(slots[3])+navButton(slots[4]);bottom.querySelectorAll('[data-ws-nav]').forEach(b=>b.onclick=()=>open(b.dataset.wsNav));sync(current)}
function wireTop(){
 document.querySelectorAll('[data-ws-drawer]').forEach(b=>{if(!b.dataset.w){b.dataset.w='1';b.onclick=()=>globalThis.MSADrawer?.open?.()}});
 document.querySelectorAll('[data-ws-search]').forEach(b=>{if(!b.dataset.w){b.dataset.w='1';b.onclick=()=>globalThis.MSASearchCenter?.open?.()}});
 document.querySelectorAll('[data-ws-profile]').forEach(b=>{if(!b.dataset.w){b.dataset.w='1';b.onclick=()=>open('me')}})
}
function ensureTarget(id){
 if(document.getElementById(id))return true;
 if(id==='tools')globalThis.MSAToolsCenter?.mount?.();
 if(id==='templates')globalThis.MSATemplateCenter?.mount?.();
 if(id==='library')globalThis.MSALibrary?.mount?.();
 if(id==='myday'&&!document.getElementById('myday')&&!document.getElementById('planner'))globalThis.MSAPlanner?.mount?.();
 return !!document.getElementById(id)||(id==='myday'&&!!document.getElementById('planner'))
}
function normalizePage(id){if(id==='planner')return'myday';if(pages.has(id)||document.getElementById(id)||(id==='myday'&&document.getElementById('planner')))return id;return'home'}
function activate(id){
 const domId=id==='myday'&&!document.getElementById('myday')&&document.getElementById('planner')?'planner':id;
 if(typeof globalThis.show==='function'&&document.getElementById(domId))globalThis.show(domId);else document.querySelectorAll('.page').forEach(x=>x.classList.toggle('on',x.id===domId));
}
function open(requested,options={}){
 let id=normalizePage(requested);
 if(!ensureTarget(id)&&id!=='home'){globalThis.MSAHelper?.notify?.('That workspace is unavailable. Returning Home.','info');id='home'}
 if(id==='myday'&&document.getElementById('planner')&&!document.getElementById('myday')&&globalThis.MSAPlanner?.open){globalThis.MSAPlanner.open();current='myday';sync('myday');return'myday'}
 activate(id);current=id;pages.get(id)?.render?.(options);sync(id);setTimeout(wireTop,0);return id
}
function back(){
 if(document.querySelector('.ws-action-sheet.on')){globalThis.MSAActionSheet?.close?.();return current}
 if(document.querySelector('.ws-search-panel.on')){globalThis.MSASearchCenter?.close?.();return current}
 if(document.querySelector('.ws-drawer.on')){globalThis.MSADrawer?.close?.();return current}
 const studio=document.querySelector('.studio-overlay.on');if(studio&&globalThis.MSAStudio?.close){globalThis.MSAStudio.close();return current}
 const parent=pages.get(current)?.parent;if(current!=='home')return open(parent||'home');return'home'
}
function sync(id=current){current=id||'home';ensureBottom();bottom.querySelectorAll('[data-ws-nav]').forEach(b=>b.classList.toggle('on',b.dataset.wsNav===current));wireTop()}
function mount(){
 if(typeof document==='undefined')return;bootstrapAssets();defaults();document.body.classList.add('workspace-v2');ensureBottom();
 globalThis.MSAToolsCenter?.mount?.();globalThis.MSATemplateCenter?.mount?.();globalThis.MSACreateV2?.mount?.();globalThis.MSAHomeV2?.mount?.();globalThis.MSAFilesV2?.mount?.();globalThis.MSAAIWorkspace?.mount?.();
 sync(document.querySelector('.page.on')?.id||'home');wireTop();setTimeout(()=>open(document.querySelector('.page.on')?.id||'home'),80)
}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

globalThis.MSAAppShell={mount,open,back,sync,topbarHTML,registerPage,getFourthTab,setFourthTab,ALLOWED_FOURTH:[...ALLOWED_FOURTH]};
if(typeof document!=='undefined'){document.addEventListener('DOMContentLoaded',mount);setTimeout(mount,700)}
})();