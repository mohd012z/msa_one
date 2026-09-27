(()=>{'use strict';
  function available(){return typeof document!=='undefined'&&typeof document.execCommand==='function'}
  function run(command,value=null,editor=null){
    if(editor?.focus)editor.focus();
    if(!available())return false;
    try{return document.execCommand(command,false,value)}catch{return false}
  }
  function bold(editor){return run('bold',null,editor)}
  function italic(editor){return run('italic',null,editor)}
  function underline(editor){return run('underline',null,editor)}
  function unorderedList(editor){return run('insertUnorderedList',null,editor)}
  function formatBlock(tag,editor){
    const allowed=new Set(['H1','H2','H3','P','BLOCKQUOTE']);
    return run('formatBlock',allowed.has(String(tag).toUpperCase())?String(tag).toUpperCase():'P',editor);
  }
  function insertHTML(html,editor){return run('insertHTML',String(html||''),editor)}
  function command(name,value,editor){
    const key=String(name||'');
    if(key==='bold')return bold(editor);
    if(key==='italic')return italic(editor);
    if(key==='underline')return underline(editor);
    if(key==='insertUnorderedList')return unorderedList(editor);
    if(key==='formatBlock')return formatBlock(value,editor);
    if(key==='insertHTML')return insertHTML(value,editor);
    return false;
  }
  function status(){return{available:available(),mode:'legacy-execCommand-adapter',isolated:true}}
  globalThis.MSAEditorAdapter={run,command,bold,italic,underline,unorderedList,formatBlock,insertHTML,status};
})();