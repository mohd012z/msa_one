(()=>{'use strict';
const ACTIONS=[
 {id:'document',icon:'document',label:'Document',hint:'Report, letter, procedure'},
 {id:'spreadsheet',icon:'spreadsheet',label:'Spreadsheet',hint:'Table, formulas, analysis'},
 {id:'presentation',icon:'presentation',label:'Presentation',hint:'Slides and briefing'},
 {id:'pdf',icon:'pdf',label:'PDF',hint:'Create or edit PDF text'},
 {id:'html',icon:'html',label:'Smart HTML',hint:'Interactive report or guide'},
 {id:'scan',icon:'camera',label:'Scan / Camera',hint:'Capture a page or image'},
 {id:'open-file',icon:'import',label:'Open / Import File',hint:'DOCX, XLSX, PPTX, PDF and text'},
 {id:'import-folder',icon:'folder',label:'Import Folder',hint:'Connect an Android workspace folder'},
 {id:'ai',icon:'ai',label:'Create with AI',hint:'Describe the result you want'},
 {id:'templates',icon:'library',label:'Templates',hint:'Start from a reusable layout'},
 {id:'browse',icon:'more',label:'More creation options',hint:'Open the full Create workspace'}
];
let scrim=null,sheet=null;
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function icon(id,fallback='•'){return globalThis.MSAIcons?.svg?.(id)||fallback}
function ensure(){if(sheet||typeof document==='undefined')return;scrim=document.createElement('div');scrim.className='msa-action-hub-scrim';scrim.onclick=close;sheet=document.createElement('section');sheet.className='msa-action-hub';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Create');sheet.innerHTML='<div class="msa-hub-grab"></div><div class="msa-hub-head"><div><small>CREATE</small><h2>Start something</h2></div><button data-hub-close aria-label="Close Create menu">×</button></div><div class="msa-hub-grid">'+ACTIONS.slice(0,6).map(a=>button(a,true)).join('')+'</div><div class="msa-hub-list">'+ACTIONS.slice(6).map(a=>button(a,false)).join('')+'</div>';document.body.append(scrim,sheet);sheet.querySelector('[data-hub-close]').onclick=close;sheet.querySelectorAll('[data-hub-action]').forEach(b=>b.onclick=()=>run(b.dataset.hubAction))}
function button(a,grid){return '<button class="'+(grid?'msa-hub-tile':'msa-hub-row')+'" data-hub-action="'+a.id+'"><span class="msa-hub-icon">'+icon(a.icon,a.label.slice(0,1))+'</span><span><b>'+esc(a.label)+'</b><small>'+esc(a.hint)+'</small></span>'+(grid?'':'<strong>›</strong>')+'</button>'}
function open(){ensure();if(!sheet)return false;scrim.classList.add('on');sheet.classList.add('on');setTimeout(()=>sheet.querySelector('[data-hub-action]')?.focus(),50);return true}
function close(){scrim?.classList.remove('on');sheet?.classList.remove('on')}
function run(id){close();switch(id){case'document':case'spreadsheet':case'presentation':case'pdf':case'html':return globalThis.MSAStudio?.open?.(id);case'scan':return globalThis.MSAActions?.runAction?.('scan');case'open-file':return globalThis.MSAFiles?.importOfficeFile?.();case'import-folder':return globalThis.MSAFiles?.importFolder?.(false);case'ai':return globalThis.MSAAIWorkspace?.openPrompt?.('Create a new workspace for: ');case'templates':return globalThis.MSAAppShell?.open?.('templates');case'browse':return globalThis.MSAAppShell?.open?.('create');default:return false}}
globalThis.MSAActionHub={open,close,run,actions:Object.freeze(ACTIONS.map(x=>({...x})))};
})();
