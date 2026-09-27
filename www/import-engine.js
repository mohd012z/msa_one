(()=> {
  const td=new TextDecoder();
  const MAX_ZIP_BYTES=80*1024*1024;
  const MAX_ENTRY_BYTES=24*1024*1024;
  const MAX_TOTAL_UNCOMPRESSED=96*1024*1024;
  const MAX_ENTRIES=4096;

  function u16(v,o){return v[o]|(v[o+1]<<8)}
  function u32(v,o){return (v[o]|(v[o+1]<<8)|(v[o+2]<<16)|(v[o+3]<<24))>>>0}
  function text(v){return td.decode(v)}
  async function breathe(progress,message){
    if(progress&&message)progress(message);
    if(globalThis.MSAPerformance?.yieldUI)return globalThis.MSAPerformance.yieldUI();
    return new Promise(resolve=>setTimeout(resolve,0));
  }
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
  const LBASE=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
  const LEXT=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  const DBASE=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
  const DEXT=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  const CLORDER=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
  let fixedLit=null,fixedDist=null;
  function huffConstruct(lens,n){
    const counts=new Int32Array(16);
    for(let i=0;i<n;i++)counts[lens[i]]++;
    counts[0]=0;
    const offs=new Int32Array(17);
    for(let len=1;len<16;len++)offs[len+1]=offs[len]+counts[len];
    const symbols=new Int32Array(n),cursor=offs.slice();
    for(let i=0;i<n;i++)if(lens[i])symbols[cursor[lens[i]]++]=i;
    return{counts,symbols};
  }
  function fixedTrees(){
    if(fixedLit)return;
    const litLens=new Uint8Array(288);
    for(let i=0;i<144;i++)litLens[i]=8;
    for(let i=144;i<256;i++)litLens[i]=9;
    for(let i=256;i<280;i++)litLens[i]=7;
    for(let i=280;i<288;i++)litLens[i]=8;
    fixedLit=huffConstruct(litLens,288);
    fixedDist=huffConstruct(new Uint8Array(30).fill(5),30);
  }
  /** Pure-JS raw DEFLATE (RFC 1951) decoder — fallback for WebViews without DecompressionStream('deflate-raw'). */
  function inflateRawJS(data,outSize){
    const out=new Uint8Array(outSize);
    let outPos=0,inPos=0,bitbuf=0,bitcnt=0;
    function bits(n){
      let val=bitbuf;
      while(bitcnt<n){val|=(data[inPos++]||0)<<bitcnt;bitcnt+=8}
      bitbuf=val>>>n;bitcnt-=n;
      return val&((1<<n)-1);
    }
    function decodeSym(h){
      let code=0,first=0,index=0;
      for(let len=1;len<=15;len++){
        code|=bits(1);
        const count=h.counts[len];
        if(code-first<count)return h.symbols[index+(code-first)];
        index+=count;first+=count;first<<=1;code<<=1;
      }
      throw new Error('Invalid compressed Office data (bad code).');
    }
    function block(litTree,distTree){
      for(;;){
        const sym=decodeSym(litTree);
        if(sym<256){if(outPos>=outSize)throw new Error('Decompressed Office data exceeded expected size.');out[outPos++]=sym}
        else if(sym===256)return;
        else{
          const li=sym-257;
          if(li>=LBASE.length)throw new Error('Invalid Office ZIP length code.');
          let len=LBASE[li]+bits(LEXT[li]);
          const dsym=decodeSym(distTree);
          if(dsym>=DBASE.length)throw new Error('Invalid Office ZIP distance code.');
          const dist=DBASE[dsym]+bits(DEXT[dsym]);
          let from=outPos-dist;
          if(from<0)throw new Error('Invalid Office ZIP back-reference.');
          if(outPos+len>outSize)throw new Error('Decompressed Office data exceeded expected size.');
          while(len-->0){out[outPos++]=out[from++]}
        }
      }
    }
    function dynamicTrees(){
      const hlit=bits(5)+257,hdist=bits(5)+1,hclen=bits(4)+4;
      const clLens=new Uint8Array(19);
      for(let i=0;i<hclen;i++)clLens[CLORDER[i]]=bits(3);
      const clTree=huffConstruct(clLens,19);
      const lens=new Uint8Array(hlit+hdist);
      let i=0;
      while(i<hlit+hdist){
        const sym=decodeSym(clTree);
        if(sym<16)lens[i++]=sym;
        else if(sym===16){if(!i)throw new Error('Invalid Office ZIP repeat code.');const prev=lens[i-1];let rep=bits(2)+3;while(rep-->0&&i<lens.length)lens[i++]=prev}
        else if(sym===17){let rep=bits(3)+3;while(rep-->0&&i<lens.length)lens[i++]=0}
        else{let rep=bits(7)+11;while(rep-->0&&i<lens.length)lens[i++]=0}
      }
      return{lit:huffConstruct(lens.subarray(0,hlit),hlit),dist:huffConstruct(lens.subarray(hlit),hdist)};
    }
    let final=0;
    do{
      final=bits(1);
      const type=bits(2);
      if(type===0){
        bitbuf=0;bitcnt=0;
        if(inPos+4>data.length)throw new Error('Truncated stored ZIP block.');
        const len=data[inPos]|(data[inPos+1]<<8),nlen=data[inPos+2]|(data[inPos+3]<<8);
        inPos+=4;
        if((len^nlen)!==0xFFFF)throw new Error('Invalid stored ZIP block length.');
        if(inPos+len>data.length||outPos+len>outSize)throw new Error('Truncated stored ZIP block data.');
        out.set(data.subarray(inPos,inPos+len),outPos);
        outPos+=len;inPos+=len;
      }else if(type===1){
        fixedTrees();block(fixedLit,fixedDist);
      }else if(type===2){
        const trees=dynamicTrees();block(trees.lit,trees.dist);
      }else throw new Error('Invalid DEFLATE block type in Office ZIP.');
    }while(!final);
    return out.subarray(0,outPos);
  }
  async function inflateRaw(bytes,expectedSize){
    if(typeof DecompressionStream!=='undefined'){
      try{
        const ds=new DecompressionStream('deflate-raw');
        const stream=new Blob([bytes]).stream().pipeThrough(ds);
        return new Uint8Array(await new Response(stream).arrayBuffer());
      }catch(e){/* older/partial WebView implementation — fall back to the JS decoder below */}
    }
    return inflateRawJS(bytes,Math.max(0,Math.floor(Number(expectedSize)||0)));
  }
  async function unzip(input,progress){
    const v=input instanceof Uint8Array?input:new Uint8Array(input);
    if(v.length>MAX_ZIP_BYTES)throw new Error('Office file is too large for safe on-device import.');
    let eocd=-1;
    for(let i=Math.max(0,v.length-65557);i<=v.length-22;i++)if(u32(v,i)===0x06054b50)eocd=i;
    if(eocd<0)throw new Error('ZIP central directory was not found.');
    const count=u16(v,eocd+10),centralOffset=u32(v,eocd+16),files={};
    if(count>MAX_ENTRIES)throw new Error('Office file contains too many internal parts.');
    if(centralOffset>=v.length)throw new Error('Invalid ZIP central directory offset.');
    let p=centralOffset,total=0;
    for(let n=0;n<count;n++){
      if(p+46>v.length||u32(v,p)!==0x02014b50)throw new Error('Invalid ZIP central directory.');
      const method=u16(v,p+10),compSize=u32(v,p+20),rawSize=u32(v,p+24),nameLen=u16(v,p+28),extraLen=u16(v,p+30),commentLen=u16(v,p+32),localOffset=u32(v,p+42);
      if(rawSize>MAX_ENTRY_BYTES)throw new Error('An Office file part is too large for safe import.');
      total+=rawSize;if(total>MAX_TOTAL_UNCOMPRESSED)throw new Error('Office file expands beyond the safe on-device limit.');
      if(p+46+nameLen+extraLen+commentLen>v.length)throw new Error('Invalid ZIP entry bounds.');
      const name=td.decode(v.subarray(p+46,p+46+nameLen));
      if(localOffset+30>v.length||u32(v,localOffset)!==0x04034b50)throw new Error('Invalid ZIP local header for '+name);
      const ln=u16(v,localOffset+26),le=u16(v,localOffset+28),dataStart=localOffset+30+ln+le;
      if(dataStart+compSize>v.length)throw new Error('Invalid ZIP data bounds for '+name);
      const compressed=v.subarray(dataStart,dataStart+compSize);
      let out;
      if(method===0)out=new Uint8Array(compressed);
      else if(method===8)out=await inflateRaw(compressed,rawSize);
      else throw new Error('Unsupported ZIP compression method '+method+' in '+name);
      if(out.length>MAX_ENTRY_BYTES)throw new Error('An Office file part expanded beyond the safe import limit.');
      files[norm(name)]=out;
      p+=46+nameLen+extraLen+commentLen;
      if((n+1)%12===0)await breathe(progress,'Reading Office package '+(n+1)+'/'+count+'…');
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
      if(child.localName==='r'){inner+=runHtml(child);for(const blip of descendants(child,'blip')){const src=officeImage(files,part,relMap,attr(blip,'embed'));if(src)inner+='<img src="'+src+'" alt="Imported document image">'}}
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
  async function docx(input,progress){
    const files=await unzip(input,progress),part='word/document.xml',doc=xmlDoc(files[part]);
    if(!doc)throw new Error('word/document.xml is missing.');
    const relMap=relationships(files,relPathFor(part)),body=descendants(doc,'body')[0];let html='';
    let bi=0;const nodes=[...(body?.children||[])];
    for(const node of nodes){
      if(node.localName==='p')html+=docParagraphHtml(node,files,part,relMap);
      else if(node.localName==='tbl')html+=docTableHtml(node,files,part,relMap);
      bi++;if(bi%80===0)await breathe(progress,'Reading document '+bi+'/'+nodes.length+'…');
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
  async function worksheetRows(files,path,shared,progress,sheetName='Sheet'){
    const d=xmlDoc(files[path]);if(!d)return[];
    const source=descendants(d,'row'),rows=[];let index=0;
    for(const row of source){
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
      index++;if(index%120===0)await breathe(progress,'Reading '+sheetName+' row '+index+'/'+source.length+'…');
    }
    return rows.length?rows:[['']];
  }
  async function xlsx(input,progress){
    const files=await unzip(input,progress),workbook='xl/workbook.xml',doc=xmlDoc(files[workbook]);
    if(!doc)throw new Error('xl/workbook.xml is missing.');
    const relMap=relationships(files,'xl/_rels/workbook.xml.rels'),shared=sharedStrings(files),sheets=[];
    for(const sh of descendants(doc,'sheet')){
      const name=attr(sh,'name')||('Sheet'+(sheets.length+1)),rid=relId(sh),rel=relMap[rid];
      if(!rel)continue;
      sheets.push({name,rows:await worksheetRows(files,resolve(workbook,rel.target),shared,progress,name)});
      await breathe(progress,'Loaded worksheet '+name+'…');
    }
    if(!sheets.length)throw new Error('No worksheets were found.');
    return {sheets};
  }

  function slideText(slide){
    const texts=descendants(slide,'t').map(x=>x.textContent||'').filter(Boolean);
    return {title:texts[0]||'',body:texts.slice(1).join('\n')};
  }
  async function pptx(input,progress){
    const files=await unzip(input,progress),pres='ppt/presentation.xml',doc=xmlDoc(files[pres]);
    if(!doc)throw new Error('ppt/presentation.xml is missing.');
    const presRels=relationships(files,'ppt/_rels/presentation.xml.rels'),slides=[];
    const slideIds=descendants(doc,'sldId');let slideIndex=0;
    for(const id of slideIds){
      const rel=presRels[relId(id)];if(!rel)continue;
      const part=resolve(pres,rel.target),sd=xmlDoc(files[part]);if(!sd)continue;
      const t=slideText(sd),rels=relationships(files,relPathFor(part));let image='';
      for(const blip of descendants(sd,'blip')){image=officeImage(files,part,rels,attr(blip,'embed'));if(image)break}
      slides.push({title:t.title||'Slide '+(slides.length+1),body:t.body,layout:image?'image-right':'title-body',image});
      slideIndex++;if(slideIndex%8===0)await breathe(progress,'Reading slides '+slideIndex+'/'+slideIds.length+'…');
    }
    if(!slides.length)throw new Error('No slides were found.');
    return {slides};
  }


  async function pdf(input,progress){
    if(progress)progress('Reading PDF…');
    const bytes=new Uint8Array(input);
    if(bytes.length<5||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw new Error('This is not a valid PDF file.');
    const blob=new Blob([bytes],{type:'application/pdf'});
    return {blobUrl:URL.createObjectURL(blob),size:bytes.length};
  }

  async function readFile(file,progress){
    const ext=(file.name.split('.').pop()||'').toLowerCase();if(progress)progress('Loading '+file.name+'…');
    const buffer=await file.arrayBuffer();await breathe(progress,'Opening '+file.name+'…');
    if(ext==='docx')return {type:'document',...(await docx(buffer,progress))};
    if(ext==='xlsx')return {type:'spreadsheet',...(await xlsx(buffer,progress))};
    if(ext==='pptx')return {type:'presentation',...(await pptx(buffer,progress))};
    if(ext==='pdf')return {type:'pdf',...(await pdf(buffer,progress))};
    throw new Error('Unsupported Office file: .'+ext);
  }

  globalThis.MSAImport={unzip,docx,xlsx,pptx,pdf,readFile,inflateRawJS};
})();