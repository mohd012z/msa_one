(()=> {
  const KEY='msaOnePlannerV1';
  const KINDS={'Daily Program':'🕘','Plan':'✓','Diary':'📖','Note':'📝'};
  let view=new Date();
  let selectedDate=iso(new Date());

  function iso(d){const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10)}
  function all(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
  function persist(a){const raw=JSON.stringify(a);localStorage.setItem(KEY,raw);window.MSAStorage?.mirror(KEY,raw)}
  function esc(s=''){return window.MSACore?.escapeHTML(s)??String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function notify(message,kind='success',actions=[]){const h=window.MSAHelper;if(kind==='error'&&h?.error)return h.error(message,actions);if(kind==='success'&&h?.success)return h.success(message,actions);h?.notify?.(message,kind,actions)}
  function register(){window.MSAAppShell?.registerPage?.({id:'myday',title:'My Day',kind:'root',parent:'home',render})}
  function todaySummary(){const today=iso(new Date()),items=all().filter(x=>x.date===today).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));return{count:items.length,next:items.find(x=>x.time)||items[0]||null}}

  function mount(){
    register();
    if(document.querySelector('#planner'))return;
    const p=document.createElement('main');p.id='planner';p.className='page';p.dataset.shellPage='myday';
    const kindOptions=Object.keys(KINDS).map(k=>'<option>'+esc(k)+'</option>').join('');
    p.innerHTML=(window.MSAAppShell?.topbarHTML?.('My Day')||'<header class="head"><div class="grow"><b>My Day</b></div></header>')+`
      <div class="wrap">
        <section class="planner-hero">
          <div><span class="planner-kicker">MY DAY</span><h1>Plan with clarity.</h1><p class="muted">Calendar, diary, programs and notes stay together on this device.</p></div>
          <button class="planner-add" aria-label="Add planner entry" data-add>＋</button>
        </section>
        <section class="planner-card">
          <div class="planner-month"><button aria-label="Previous month" data-prev>‹</button><b data-month></b><button aria-label="Next month" data-next>›</button></div>
          <div class="planner-week"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
          <div class="planner-grid" data-grid></div>
        </section>
        <section class="planner-card">
          <div class="planner-section"><div><span class="planner-kicker">SELECTED DAY</span><h2 data-daytitle></h2></div><div class="planner-day-actions"><button class="planner-today" data-today>Today</button><button class="planner-new" data-add>＋ Add</button></div></div>
          <div class="planner-agenda" data-agenda></div>
        </section>
      </div>
      <section class="planner-editor" data-editor aria-hidden="true">
        <div class="planner-sheet" role="dialog" aria-modal="true" aria-label="Planner entry">
          <div class="planner-grab"></div>
          <div class="planner-section"><h2 data-editor-title>New entry</h2><button class="planner-x" aria-label="Close planner editor" data-cancel>×</button></div>
          <label>Type<select data-kind>${kindOptions}</select></label>
          <label>Date<input type="date" data-date></label>
          <label>Time<input type="time" data-time></label>
          <label>Title<input data-title placeholder="What is planned?"></label>
          <label>Details<textarea data-note placeholder="Program, diary detail, plan or note…"></textarea></label>
          <div class="planner-actions"><button class="planner-danger" data-delete>Delete</button><button class="planner-save" data-save>Save</button></div>
        </div>
      </section>`;
    document.body.appendChild(p);
    p.querySelector('[data-today]').onclick=()=>{view=new Date();selectedDate=iso(view);render()};
    p.querySelector('[data-prev]').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};
    p.querySelector('[data-next]').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};
    p.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addEntry());
    p.querySelector('[data-cancel]').onclick=closeEditor;p.querySelector('[data-save]').onclick=saveEntry;p.querySelector('[data-delete]').onclick=deleteEntry;
    render();
  }

  function showPlanner(){mount();document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));const p=document.querySelector('#planner');if(!p)return;p.classList.add('on');p.scrollTop=0;render();window.MSAHelper?.refresh();window.MSAAppShell?.sync?.('myday')}
  function render(){
    const p=document.querySelector('#planner');if(!p)return;
    const y=view.getFullYear(),m=view.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),lead=first.getDay(),a=all();
    p.querySelector('[data-month]').textContent=first.toLocaleDateString(undefined,{month:'long',year:'numeric'});let h='';
    for(let i=0;i<lead;i++)h+='<span class="planner-cell blank"></span>';
    for(let d=1;d<=days;d++){const date=iso(new Date(y,m,d)),n=a.filter(x=>x.date===date).length;h+=`<button class="planner-cell ${date===selectedDate?'selected':''} ${date===iso(new Date())?'today':''}" data-pdate="${date}" aria-label="${date}${n?' '+n+' entries':''}"><b>${d}</b>${n?`<i>${n}</i>`:''}</button>`}
    p.querySelector('[data-grid]').innerHTML=h;p.querySelectorAll('[data-pdate]').forEach(b=>b.onclick=()=>{selectedDate=b.dataset.pdate;render()});
    const sd=new Date(selectedDate+'T12:00');p.querySelector('[data-daytitle]').textContent=sd.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'});
    const items=a.filter(x=>x.date===selectedDate).sort((x,z)=>(x.time||'99').localeCompare(z.time||'99'));
    p.querySelector('[data-agenda]').innerHTML=items.length?items.map(x=>`<button class="planner-item" data-id="${esc(x.id)}"><span class="planner-kind">${KINDS[x.kind]||'•'}</span><div><b>${esc(x.title)}</b><small>${esc(x.time||'Any time')} · ${esc(x.kind)}</small>${x.note?`<p>${esc(x.note)}</p>`:''}</div><strong>›</strong></button>`).join(''):'<div class="planner-empty"><b>No entries yet</b><span>Add a daily program, plan, diary entry or note.</span></div>';
    p.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>addEntry(b.dataset.id));
  }
  function addEntry(id){const x=all().find(v=>v.id===id)||{id:window.MSACore?.uid('cal')||('cal_'+Date.now().toString(36)),date:selectedDate,time:'',kind:'Daily Program',title:'',note:''};const p=document.querySelector('#planner');if(!p)return;const editor=p.querySelector('[data-editor]');editor.dataset.id=x.id;editor.setAttribute('aria-hidden','false');p.querySelector('[data-editor-title]').textContent=id?'Edit entry':'New entry';p.querySelector('[data-kind]').value=x.kind;p.querySelector('[data-date]').value=x.date;p.querySelector('[data-time]').value=x.time;p.querySelector('[data-title]').value=x.title;p.querySelector('[data-note]').value=x.note;p.querySelector('[data-delete]').style.visibility=id?'visible':'hidden';editor.classList.add('on');setTimeout(()=>p.querySelector('[data-title]').focus(),180)}
  function closeEditor(){const e=document.querySelector('[data-editor]');e?.classList.remove('on');e?.setAttribute('aria-hidden','true')}
  function saveEntry(){const p=document.querySelector('#planner'),editor=p?.querySelector('[data-editor]');if(!p||!editor)return;const id=editor.dataset.id,title=p.querySelector('[data-title]').value.trim();if(!title){p.querySelector('[data-title]').focus();notify('Add a title before saving this entry.','error');return}const x={id,kind:p.querySelector('[data-kind]').value,date:p.querySelector('[data-date]').value||selectedDate,time:p.querySelector('[data-time]').value,title,note:p.querySelector('[data-note]').value.trim(),updated:Date.now()};const a=all(),i=a.findIndex(v=>v.id===id);i<0?a.push(x):a[i]=x;selectedDate=x.date;view=new Date(x.date+'T12:00');persist(a);closeEditor();render();notify('Planner entry saved.')}
  function deleteEntry(){const editor=document.querySelector('[data-editor]'),id=editor?.dataset.id;if(!id)return;const a=all(),item=a.find(x=>x.id===id);if(!item)return;persist(a.filter(x=>x.id!==id));closeEditor();render();notify('“'+item.title+'” deleted.','success',[{label:'Undo',run:()=>{const next=all();next.push(item);persist(next);selectedDate=item.date;render();notify('Planner entry restored.')}}])}

  window.MSAPlanner={open:showPlanner,mount,addEntry,saveEntry,deleteEntry,render,todaySummary};
  document.addEventListener('DOMContentLoaded',mount);setTimeout(mount,500);
})();