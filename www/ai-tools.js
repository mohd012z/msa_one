(()=>{'use strict';
const MODES=[
 {id:'general',label:'General',hint:'Ask, create, summarize or plan'},
 {id:'document',label:'Document',hint:'Work with reports, letters and readable files'},
 {id:'technical',label:'Technical',hint:'Analyze technical documents and procedures'},
 {id:'coding',label:'Coding',hint:'Explain, draft and review code or Smart HTML'}
];
let activeMode='general';
function mount(){const p=document.getElementById('ai');if(!p||p.dataset.v2)return;p.dataset.v2='1';globalThis.MSAAppShell?.registerPage?.({id:'ai',title:'AI',kind:'root',parent:'home',render});render()}
function render(){
 const p=document.getElementById('ai');if(!p)return;p.innerHTML=globalThis.MSAAppShell?.topbarHTML?.('AI')||'';const w=document.createElement('div');w.className='ws-wrap ws-ai-v2';
 const presets=(globalThis.MSAAssistantCatalog||[]).flatMap(g=>(g.items||[]).map(a=>({...a,group:g.group}))).slice(0,4);
 w.innerHTML='<div class="ws-title-row"><div><small class="muted">MSA One intelligence</small><h1>Ask MSA</h1></div><span class="msa-capability-badge" data-state="Available">Local / offline</span></div>'+ 
 '<div class="ws-chipbar ws-ai-modes" aria-label="AI mode">'+MODES.map(m=>'<button class="ws-chip '+(activeMode===m.id?'on':'')+'" data-mode="'+m.id+'">'+m.label+'</button>').join('')+'</div>'+ 
 '<small class="muted ws-ai-mode-hint" data-mode-hint>'+esc(mode().hint)+'</small>'+ 
 '<div class="composer" data-ai-composer><textarea aria-label="Ask MSA One" placeholder="Ask, create, analyze or improve…"></textarea><div class="chips"><button class="chip" data-attach>＋ File</button><button class="chip" data-camera>📷 Camera</button><button class="chip" data-voice>🎙 Voice</button><button class="go" data-start>✦ Start</button></div></div>'+ 
 '<section class="ws-section"><div class="ws-section-head"><h2>Suggested</h2><small>Local presets</small></div><div class="ws-list">'+(presets.length?presets.map(a=>'<button class="ws-row" data-assistant="'+esc(a.id)+'"><span class="ws-row-icon">'+esc(a.icon||'✦')+'</span><span class="ws-row-meta"><b>'+esc(a.name)+'</b><small>'+esc(a.group||'Preset')+'</small></span><span>›</span></button>').join(''):'<button class="ws-row" data-suggest="summarize"><span class="ws-row-icon">✦</span><span class="ws-row-meta"><b>Summarize content</b><small>Paste text or attach a readable file</small></span><span>›</span></button>')+'</div></section>'+ 
 '<section class="ws-ai-boundary"><b>Local-first status</b><p>MSA One can use its built-in local workflows and readable file text offline. Connected-model features are only used when separately configured; scanned images are not claimed as OCR text.</p></section>';
 p.appendChild(w);wire(p)
}
function mode(){return MODES.find(x=>x.id===activeMode)||MODES[0]}
function wire(p){const box=p.querySelector('textarea');p.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{activeMode=MODES.some(m=>m.id===b.dataset.mode)?b.dataset.mode:'general';p.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('on',x.dataset.mode===activeMode));p.querySelector('[data-mode-hint]').textContent=mode().hint;box.placeholder=mode().hint+'…';box.focus()});p.querySelector('[data-start]').onclick=()=>{const q=box.value.trim();if(!q)return box.focus();globalThis.MSAActions?.runAction?.('start')};p.querySelector('[data-attach]').onclick=()=>globalThis.MSAActions?.openPicker?.('.docx,.xlsx,.pptx,.pdf,.txt,.csv,.html,image/*');p.querySelector('[data-camera]').onclick=()=>globalThis.MSAActions?.openPicker?.('image/*','environment');p.querySelector('[data-voice]').onclick=()=>globalThis.MSAActions?.runAction?.('voice');p.querySelectorAll('[data-assistant]').forEach(b=>{const a=find(b.dataset.assistant);b.onclick=()=>openAssistant(a)});p.querySelector('[data-suggest]')?.addEventListener('click',()=>{box.value='Summarize this content: ';box.focus()})}
function find(id){return (globalThis.MSAAssistantCatalog||[]).flatMap(g=>g.items||[]).find(x=>x.id===id)}
function openAssistant(a){if(!a)return;globalThis.MSAAppShell?.open?.('ai');setTimeout(()=>{const box=document.querySelector('#ai textarea');if(box){box.value=a.prompt||'';box.focus();box.setSelectionRange(box.value.length,box.value.length)}},50)}
function openPrompt(text){globalThis.MSAAppShell?.open?.('ai');setTimeout(()=>{const box=document.querySelector('#ai textarea');if(box){box.value=text||'';box.focus();box.setSelectionRange(box.value.length,box.value.length)}},50)}
function setMode(id){activeMode=MODES.some(m=>m.id===id)?id:'general';return activeMode}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
globalThis.MSAAIWorkspace={mount,render,openAssistant,openPrompt,setMode,modes:Object.freeze(MODES.map(x=>({...x})))};
})();