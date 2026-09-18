(()=> {
  const td=new TextDecoder();

  function u16(v,o){return v[o]|(v[o+1]<<8)}
  function u32(v,o){return (v[o]|(v[o+1]<<8)|(v[o+2]<<16)|(v[o+3]<<24))>>>0}
  function text(v){return td.decode(v)}
  function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function mimeFor(name=''){
    const x=name.toLowerCase();
    if(x.endsWith('.png'))return'image/png';
    if(x.endsWith('.gif'))return'image/gif';
    if(x.endsWith('.webp'))return'image/webp';
    if(x.endsWith('.svg'))return'image/svg+xml';
    return'image/jpeg';
  }
  function dataUrl(name,bytes,maxBytes=1800000){
    if(!bytes||bytes.length>maxBytes)return'';
    let bin='',step=0x8000;
    for(let i=0;i<bytes.length;i+=step)bin+=String.fromCharCode(...bytes.subarray(i,i+step));
    return'data:'+mimeFor(name)+';base64,'+btoa(bin);
  }
  function norm(path){
    const out=[];
    for(const p of String(path).replace(/\\/g,'/').split('/')){
      if(!p||p==='.')continue;
      if(p==='..')out.pop();else out.push(p);
    }
    return out.join('/');
  }
  function resolve(base,target){
    if(String(target).startsWith('/'))return norm(target);
    const dir=String(base).split('/').slice(0,-1).join('/');
    return norm(dir+'/'+target);
  }
  async function inflateRaw(bytes){
    if(typeof DecompressionStream==='undefined')throw new Error('This WebView cannot decompress standard Office ZIP files.');
    const ds=new DecompressionStream('deflate-raw');
    const stream=new Blob([bytes]).stream().pipeThrough(ds);
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  async function unzip(input){
    const v=input instanceof Uint8Array?input:new Uint8Array(input);
    let eocd=-1;
    for(let i=Math.max(0,v.length-65557);i<=v.length-22;i++)if(u32(v,i)===0x06054b50)eocd=i;
    if(eocd<0)throw new Error('ZIP central directory was not found.');
    const count=u16(v,eocd+10),centralOffset=u32(v,eocd+16),files={};
    let p=centralOffset;
    for(let n=0;n<count;n++){
      if(u32(v,p)!==0x02014b50)throw new Error('Invalid ZIP central directory.');
      const method=u16(v,p+10),compSize=u32(v,p+20),nameLen=u16(v,p+28),extraLen=u16(v,p+30),commentLen=u16(v,p+32),localOffset=u32(v,p+42);
      const name=td.decode(v.subarray(p+46,p+46+nameLen));
      if(u32(v,localOffset)!==0x04034b50)throw new Error('Invalid ZIP local header for '+name);
      const ln=u16(v,localOffset+26),le=u16(v,localOffset+28),dataStart=localOffset+30+ln+le,compressed=v.subarray(dataStart,dataStart+compSize);
      let out;
      if(method===0)out=new Uint8Array(compressed);
      else if(method===8)out=await inflateRaw(compressed);
      else throw new Error('Unsupported ZIP compression method '+method+' in '+name);
      files[norm(name)]=out;
      p+=46+nameLen+extraLen+commentLen;
    }
    return files;
  }
  function xmlDoc(bytes){
    if(!bytes)return null;
    const d=new DOMParser().parseFromString(text(bytes),'application/xml');
    if(d.querySelector('parsererror'))throw new Error('Office XML could not be parsed.');
    return d;
  }
  function attr(el,local){
    if(!el)return'';
    for(const a of el.attributes||[])if(a.localName===local)return a.value;
    return'';
  }
  function relId(el){for(const a of el?.attributes||[])if(a.prefix==='r'||String(a.namespaceURI||'').includes('/relationships'))return a.value;return attr(el,'id')}
  function children(el,name){return [...(el?.children||[])].filter(x=>x.localName===name)}
  function descendants(el,name){return [...(el?.getElementsByTagName('*')||[])].filter(x=>x.localName===name)}
  function relationships(files,path){
    const d=xmlDoc(files[norm(path)]),map={};
    for(const r of d?.documentElement?.children||[])if(r.localName==='Relationship')map[attr(r,'Id')]={target:attr(r,'Target'),type:attr(r,'Type')};
    return map;
  }

  function runHtml(run){
    let value='';
    for(const n of run.childNodes){
      if(n.nodeType!==1)continue;
      if(n.localName==='t')value+=esc(n.textContent||'');
      else if(n.localName==='tab')value+='&emsp;';
      else if(n.localName==='br')value+='<br>';
    }
    const pr=children(run,'rPr')[0];
    if(pr){
      if(descendants(pr,'u').length)value='<u>'+value+'</u>';
      if(descendants(pr,'i').length)value='<i>'+value+'</i>';
      if(descendants(pr,'b').length)value='<b>'+value+'</b>';
    }
    return value;
  }
  function relPathFor(part){
    const seg=part.split('/'),file=seg.pop();
    return seg.concat(['_rels',file+'.rels']).join('/');
  }
  function officeImage(files,part,relMap,rid){
    const rel=relMap[rid];if(!rel)return'';
    const path=resolve(part,rel.target),bytes=files[path];
    return bytes?dataUrl(path,bytes):'';
  }
  function docParagraphHtml(p,files,part,relMap){
    let inner='';
    for(const child of p.children){
      if(child.localName==='r')inner+=runHtml(child);
      else if(child.localName==='hyperlink')for(const r of children(child,'r'))inner+=runHtml(r);
      else{
        for(const blip of descendants(child,'blip')){
          const rid=attr(blip,'embed'),src=officeImage(files,part,relMap,rid);
          if(src)inner+='<img src="'+src+'" alt="Imported document image">';
        }
      }
    }
    if(!inner.trim())inner='<br>';
    const pPr=children(p,'pPr')[0],style=attr(descendants(pPr,'pStyle')[0],'val').toLowerCase();
    let tag='p';if(style.includes('heading1')||style==='title')tag='h1';else if(style.includes('heading2'))tag='h2';else if(style.includes('heading3'))tag='h3';
    const list=descendants(pPr,'numPr').length>0;
    return list?'<p>• '+inner+'</p>':'<'+tag+'>'+inner+'</'+tag+'>';
  }
  function docTableHtml(tbl,files,part,relMap){
    let out='<table>';
    for(const tr of children(tbl,'tr')){
      out+='<tr>';
      for(const tc of children(tr,'tc')){
        const cell=children(tc,'p').map(p=>docParagraphHtml(p,files,part,relMap).replace(/^<p>|<\/p>$/g,'')).join('<br>');
        out+='<td>'+cell+'</td>';
      }
      out+='</tr>';
    }
    return out+'</table>';
  }
  async function docx(input){
    const files=await unzip(input),part='word/document.xml',doc=xmlDoc(files[part]);
    if(!doc)throw new Error('word/document.xml is missing.');
    const relMap=relationships(files,relPathFor(part)),body=descendants(doc,'body')[0];let html='';
    for(const node of body?.children||[]){
      if(node.localName==='p')html+=docParagraphHtml(node,files,part,relMap);
      else if(node.localName==='tbl')html+=docTableHtml(node,files,part,relMap);
    }
    return {html:html||'<p></p>'};
  }

  function colIndex(ref='A1'){
    const m=String(ref).match(/^([A-Z]+)\d+$/i);if(!m)return 0;let c=0;
    for(const ch of m[1].toUpperCase())c=c*26+ch.charCodeAt(0)-64;
    return Math.max(0,c-1);
  }
  function sharedStrings(files){
    const d=xmlDoc(files['xl/sharedStrings.xml']);if(!d)return[];
    return descendants(d,'si').map(si=>descendants(si,'t').map(t=>t.textContent||'').join(''));
  }
  function worksheetRows(files,path,shared){
    const d=xmlDoc(files[path]);if(!d)return[];
    const rows=[];for(const row of descendants(d,'row')){
      const ri=Math.max(0,(+attr(row,'r')||rows.length+1)-1);while(rows.length<=ri)rows.push([]);
      for(const c of children(row,'c')){
        const ref=attr(c,'r'),ci=colIndex(ref),type=attr(c,'t'),f=descendants(c,'f')[0],v=descendants(c,'v')[0],inline=descendants(c,'is')[0];
        let value='';
        if(f)value='='+(f.textContent||'');
        else if(type==='s')value=shared[+(v?.textContent||0)]??'';
        else if(type==='inlineStr')value=descendants(inline,'t').map(t=>t.textContent||'').join('');
        else if(type==='b')value=(v?.textContent==='1')?'TRUE':'FALSE';
        else value=v?.textContent||'';
        while(rows[ri].length<=ci)rows[ri].push('');
        rows[ri][ci]=value;
      }
    }
    return rows.length?rows:[['']];
  }
  async function xlsx(input){
    const files=await unzip(input),workbook='xl/workbook.xml',doc=xmlDoc(files[workbook]);
    if(!doc)throw new Error('xl/workbook.xml is missing.');
    const relMap=relationships(files,'xl/_rels/workbook.xml.rels'),shared=sharedStrings(files),sheets=[];
    for(const sh of descendants(doc,'sheet')){
      const name=attr(sh,'name')||('Sheet'+(sheets.length+1)),rid=relId(sh),rel=relMap[rid];
      if(!rel)continue;
      sheets.push({name,rows:worksheetRows(files,resolve(workbook,rel.target),shared)});
    }
    if(!sheets.length)throw new Error('No worksheets were found.');
    return {sheets};
  }

  function slideText(slide){
    const texts=descendants(slide,'t').map(x=>x.textContent||'').filter(Boolean);
    return {title:texts[0]||'',body:texts.slice(1).join('\n')};
  }
  async function pptx(input){
    const files=await unzip(input),pres='ppt/presentation.xml',doc=xmlDoc(files[pres]);
    if(!doc)throw new Error('ppt/presentation.xml is missing.');
    const presRels=relationships(files,'ppt/_rels/presentation.xml.rels'),slides=[];
    for(const id of descendants(doc,'sldId')){
      const rel=presRels[relId(id)];if(!rel)continue;
      const part=resolve(pres,rel.target),sd=xmlDoc(files[part]);if(!sd)continue;
      const t=slideText(sd),rels=relationships(files,relPathFor(part));let image='';
      for(const blip of descendants(sd,'blip')){image=officeImage(files,part,rels,attr(blip,'embed'));if(image)break}
      slides.push({title:t.title||'Slide '+(slides.length+1),body:t.body,layout:image?'image-right':'title-body',image});
    }
    if(!slides.length)throw new Error('No slides were found.');
    return {slides};
  }

  async function readFile(file){
    const ext=(file.name.split('.').pop()||'').toLowerCase(),buffer=await file.arrayBuffer();
    if(ext==='docx')return {type:'document',...(await docx(buffer))};
    if(ext==='xlsx')return {type:'spreadsheet',...(await xlsx(buffer))};
    if(ext==='pptx')return {type:'presentation',...(await pptx(buffer))};
    throw new Error('Unsupported Office file: .'+ext);
  }

  globalThis.MSAImport={unzip,docx,xlsx,pptx,readFile};
})();