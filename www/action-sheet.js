(()=>{let scrim,sheet;
function ensure(){if(sheet)return;scrim=document.createElement('div');scrim.className='ws-action-scrim';scrim.onclick=close;sheet=document.createElement('section');sheet.className='ws-action-sheet';document.body.append(scrim,sheet)}
function open({title='Actions',actions=[]}={}){ensure();sheet.innerHTML='<div class="ws-grab"></div><h2>'+esc(title)+'</h2>'+actions.map((a,i)=>'<button data-a="'+i+'" class="'+(a.danger?'ws-danger':'')+'">'+esc(a.icon||'')+' '+esc(a.label)+'</button>').join('');sheet.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=actions[+b.dataset.a];close();setTimeout(()=>a?.run?.(),20)});scrim.classList.add('on');sheet.classList.add('on')}
function close(){scrim?.classList.remove('on');sheet?.classList.remove('on')}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
globalThis.MSAActionSheet={open,close};})();