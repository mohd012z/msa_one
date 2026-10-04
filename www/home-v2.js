(()=>{'use strict';
function projects(){try{return (globalThis.MSAProjects?.all?.()||JSON.parse(localStorage.getItem('msaOneProjectsV1')||'[]')).sort((a,b)=>(b.updated||0)-(a.updated||0))}catch{return[]}}
function icon(type){return({document:'📄',spreadsheet:'📊',presentation:'📽',pdf:'📕',html:'🌐'}[type]||'▣')}
function svg(id,fallback){return globalThis.MSAIcons?.svg?.(id)||fallback}
function mount(){const page=document.getElementById('home');if(!page||page.dataset.v2)return;page.dataset.v2='1';globalThis.MSAAppShell?.registerPage?.({id:'home',title:'Home',kind:'root',parent:null,render});render()}
function myDay(){try{return globalThis.MSAPlanner?.todaySummary?.()||{count:0,next:null}}catch{return{count:0,next:null}}}
function render(){
 const page=document.getElementById('home');if(!page)return;const rec=projects().slice(0,6),day=myDay(),next=day.next;
 page.innerHTML=globalThis.MSAAppShell?.topbarHTML?.('Home')||'';
 const wrap=document.createElement('div');wrap.className='ws-wrap ws-home';wrap.innerHTML=
 '<section class="ws-home-search" data-home-section="search"><button data-search-ask><span>'+svg('search','⌕')+'</span><span><b>Search or ask MSA One</b><small>Files, tools, calendar, actions and AI</small></span><strong>›</strong></button></section>'+ 
 '<section class="ws-section" data-home-section="continue"><div class="ws-section-head"><h2>Continue Working</h2><button class="ws-link" data-files>View all</button></div><div class="ws-hscroll">'+(rec.length?rec.map(p=>'<button class="ws-project-card" data-open="'+esc(p.id)+'"><div class="ws-project-preview">'+icon(p.type)+'</div><div class="ws-project-meta"><b>'+esc(p.title||'Untitled')+'</b><small>'+esc(p.type||'file')+' · '+when(p.updated)+'</small></div></button>').join(''):'<button class="ws-empty-card" data-home-action-empty="document"><b>No projects yet</b><small>Create a document or import a file.</small></button>')+'</div></section>'+ 
 '<section class="ws-section" data-home-section="myday"><div class="ws-section-head"><h2>My Day</h2><button class="ws-link" data-myday>Open</button></div><button class="ws-myday-card" data-myday><span class="ws-row-icon">'+svg('calendar','▦')+'</span><span class="ws-row-meta"><b>'+day.count+' '+(day.count===1?'item':'items')+' today</b><small>'+(next?(esc(next.time||'Any time')+' · '+esc(next.title||next.kind||'Planner item')):'No plans yet · add one when you are ready')+'</small></span><span>›</span></button></section>'+ 
 '<section class="ws-section" data-home-section="quick"><div class="ws-section-head"><h2>Quick Actions</h2></div><div class="ws-grid ws-quick-actions"><button class="ws-quick" data-home-action="document"><span>'+svg('document','📄')+'</span><b>New Document</b><small>Start writing</small></button><button class="ws-quick" data-home-action="scan"><span>'+svg('camera','📷')+'</span><b>Scan</b><small>Camera capture</small></button><button class="ws-quick" data-home-action="import"><span>'+svg('import','↥')+'</span><b>Import</b><small>Open a file</small></button><button class="ws-quick" data-home-action="ai"><span>'+svg('ai','✦')+'</span><b>Ask AI</b><small>Analyze or create</small></button></div></section>'+ 
 '<section class="ws-section ws-home-for-you" data-home-section="for-you"><div class="ws-section-head"><h2>For You</h2><button class="ws-link" data-tools>Tools</button></div><div class="ws-grid">'+(globalThis.MSAToolsCatalog||[]).filter(t=>t.state==='Available').slice(0,4).map(t=>'<button class="ws-quick" data-tool="'+esc(t.id)+'"><span>'+esc(t.icon)+'</span><b>'+esc(t.name)+'</b><small>'+esc(t.desc)+'</small></button>').join('')+'</div></section>';
 page.appendChild(wrap);wire(page)
}
function wire(page){
 page.querySelector('[data-search-ask]')?.addEventListener('click',()=>globalThis.MSASearchCenter?.open());
 page.querySelector('[data-files]')?.addEventListener('click',()=>globalThis.MSAAppShell?.open?.('files'));
 page.querySelectorAll('[data-myday]').forEach(b=>b.addEventListener('click',()=>globalThis.MSAAppShell?.open?.('myday')));
 page.querySelector('[data-home-action="document"]')?.addEventListener('click',()=>globalThis.MSAActionHub?.run?.('document')||globalThis.MSAStudio?.open?.('document'));
 page.querySelector('[data-home-action="scan"]')?.addEventListener('click',()=>globalThis.MSAActions?.runAction?.('scan'));
 page.querySelector('[data-home-action="import"]')?.addEventListener('click',()=>globalThis.MSAFiles?.importOfficeFile?.());
 page.querySelector('[data-home-action="ai"]')?.addEventListener('click',()=>globalThis.MSAAppShell?.open?.('ai'));
 page.querySelector('[data-home-action-empty]')?.addEventListener('click',()=>globalThis.MSAActionHub?.run?.('document')||globalThis.MSAStudio?.open?.('document'));
 page.querySelector('[data-tools]')?.addEventListener('click',()=>globalThis.MSAAppShell?.open?.('tools'));
 page.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>globalThis.MSAFiles?.openProject?.(b.dataset.open));
 page.querySelectorAll('[data-tool]').forEach(b=>{const t=(globalThis.MSAToolsCatalog||[]).find(x=>x.id===b.dataset.tool);b.onclick=()=>globalThis.MSAToolsCenter?.run?.(t)})
}
function when(t){if(!t)return'Recent';const d=Math.max(0,Date.now()-t),m=Math.floor(d/60000);if(m<2)return'just now';if(m<60)return m+' min ago';const h=Math.floor(m/60);if(h<24)return h+' hr ago';return new Date(t).toLocaleDateString()}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
globalThis.MSAHomeV2={mount,render};})();