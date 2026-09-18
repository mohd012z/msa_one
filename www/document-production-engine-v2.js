(()=>{'use strict';
const AVAILABLE='AVAILABLE',DEGRADED='DEGRADED',UNAVAILABLE='UNAVAILABLE',KEY='msa:document-production:v2';let doc=null,history=[],future=[],timer=null;
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);const clone=x=>JSON.parse(JSON.stringify(x));
function snapshot(){if(doc)history.push(clone(doc));if(history.length>50)history.shift();future=[]}
function createDocument(title='Untitled'){doc={id:id(),title,version:2,blocks:[],updatedAt:new Date().toISOString()};history=[];future=[];autosave();return clone(doc)}
function openDocument(input){if(typeof input==='string'){try{let x=window.MSAProjectStore?.get?.(input);if(x?.document)doc=clone(x.document);else doc=JSON.parse(localStorage.getItem(KEY+':'+input)||'null')}catch{}}else if(input)doc=clone(input);return doc?clone(doc):null}
function add(block,index){if(!doc)createDocument();snapshot();block={id:id(),...block};if(Number.isInteger(index))doc.blocks.splice(index,0,block);else doc.blocks.push(block);touch();return clone(block)}
const insertHeading=(text='',level=1,index)=>add({type:'heading',text:String(text),level:Math.min(6,Math.max(1,level))},index);
const insertParagraph=(text='',index)=>add({type:'paragraph',text:String(text)},index);
const insertTable=(rows=[[]],index)=>add({type:'table',rows:clone(rows)},index);
const insertImage=(src='',alt='',index)=>add({type:'image',src:String(src),alt:String(alt)},index);
function updateBlock(blockId,patch={}){let i=doc?.blocks.findIndex(b=>b.id===blockId);if(i<0)return null;snapshot();doc.blocks[i]={...doc.blocks[i],...clone(patch),id:blockId};touch();return clone(doc.blocks[i])}
function removeBlock(blockId){let i=doc?.blocks.findIndex(b=>b.id===blockId);if(i<0)return false;snapshot();doc.blocks.splice(i,1);touch();return true}
function moveBlock(blockId,to){let i=doc?.blocks.findIndex(b=>b.id===blockId);if(i<0)return false;snapshot();let [b]=doc.blocks.splice(i,1);doc.blocks.splice(Math.max(0,Math.min(to,doc.blocks.length)),0,b);touch();return true}
function undo(){if(!history.length||!doc)return false;future.push(clone(doc));doc=history.pop();autosave();return clone(doc)}
function redo(){if(!future.length||!doc)return false;history.push(clone(doc));doc=future.pop();autosave();return clone(doc)}
function touch(){doc.updatedAt=new Date().toISOString();autosave()}
function autosave(){clearTimeout(timer);timer=setTimeout(()=>{if(!doc)return;try{localStorage.setItem(KEY+':'+doc.id,JSON.stringify(doc));localStorage.setItem(KEY+':last',doc.id)}catch{}try{window.MSAProjectStore?.save?.({id:doc.id,type:'document',title:doc.title,document:clone(doc)})}catch{}},120);return true}
function recover(id){try{return openDocument(id||localStorage.getItem(KEY+':last'))}catch{return null}}
function applyTemplate(template){let kaga=window.MSAKagaLibrary;if(!doc)createDocument(template?.name||'Document');snapshot();let blocks=template?.blocks||kaga?.getTemplate?.(template)?.blocks||[];doc.blocks=clone(blocks);touch();return clone(doc)}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function exportHTML(){if(!doc)return'';let body=doc.blocks.map(b=>b.type==='heading'?'<h'+b.level+'>'+esc(b.text)+'</h'+b.level+'>':b.type==='paragraph'?'<p>'+esc(b.text)+'</p>':b.type==='image'?'<img src="'+esc(b.src)+'" alt="'+esc(b.alt)+'">':b.type==='table'?'<table>'+b.rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</table>':'').join('');return'<!doctype html><html><body>'+body+'</body></html>'}
function exportIR(){let ir=window.MSADocumentIR;return ir?.normalize?ir.normalize(clone(doc)):clone(doc)}
function getStatus(){let capabilities={documentIR:!!window.MSADocumentIR,kaga:!!window.MSAKagaLibrary,projectStore:!!window.MSAProjectStore,raga:!!window.MSARagaConverter,runtime:!!window.MSARuntimeIntegration};let missing=Object.entries(capabilities).filter(([,v])=>!v).map(([k])=>k);return{status:missing.length?DEGRADED:AVAILABLE,capabilities,errors:missing,document:doc?clone(doc):null,history:history.length,future:future.length}}
window.MSADocumentProductionEngine={AVAILABLE,DEGRADED,UNAVAILABLE,createDocument,openDocument,insertHeading,insertParagraph,insertTable,insertImage,updateBlock,removeBlock,moveBlock,undo,redo,autosave,recover,applyTemplate,exportHTML,exportIR,getStatus};
})();