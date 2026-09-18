(()=> {
  const te=new TextEncoder();

  function u16(n){return [n&255,(n>>>8)&255]}
  function u32(n){return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]}
  function bytes(v){return typeof v==='string'?te.encode(v):v}
  function concat(parts){
    let len=parts.reduce((n,p)=>n+p.length,0), out=new Uint8Array(len), off=0;
    for(const p of parts){out.set(p,off);off+=p.length}
    return out;
  }
  const crcTable=(()=>{let t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  function crc32(data){let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}

  function zip(files){
    const locals=[],centrals=[];let offset=0;
    for(const file of files){
      const name=bytes(file.name), data=bytes(file.data), crc=crc32(data);
      const local=new Uint8Array([
        ...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),
        ...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0)
      ]);
      locals.push(local,name,data);
      const central=new Uint8Array([
        ...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),
        ...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),
        ...u32(0),...u32(offset)
      ]);
      centrals.push(central,name);
      offset+=local.length+name.length+data.length;
    }
    const cd=concat(centrals), body=concat(locals);
    const end=new Uint8Array([
      ...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),
      ...u32(cd.length),...u32(body.length),...u16(0)
    ]);
    return concat([body,cd,end]);
  }

  function xml(s=''){
    return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  }
  function plain(html=''){
    const d=document.createElement('div');d.innerHTML=html;
    d.querySelectorAll('br').forEach(x=>x.replaceWith('\n'));
    d.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,li').forEach(x=>x.append('\n'));
    return (d.textContent||'').replace(/\n{3,}/g,'\n\n').trim();
  }
  function download(name,data,type){
    const blob=data instanceof Blob?data:new Blob([data],{type});
    const u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(u),1000);
  }

  function wordRun(text,opt={}){
    const rp=(opt.bold?'<w:b/>':'')+(opt.italic?'<w:i/>':'')+(opt.underline?'<w:u w:val="single"/>':'')+(opt.size?'<w:sz w:val="'+opt.size+'"/><w:szCs w:val="'+opt.size+'"/>':'');
    return '<w:r>'+(rp?'<w:rPr>'+rp+'</w:rPr>':'')+'<w:t xml:space="preserve">'+xml(text||' ')+'</w:t></w:r>';
  }
  function inlineRuns(node,opt={}){
    let out='';
    for(const child of node.childNodes){
      if(child.nodeType===3){out+=wordRun(child.nodeValue,opt);continue}
      if(child.nodeType!==1)continue;
      const tag=child.tagName.toLowerCase(),next={...opt};
      if(tag==='b'||tag==='strong')next.bold=true;
      if(tag==='i'||tag==='em')next.italic=true;
      if(tag==='u')next.underline=true;
      if(tag==='br'){out+='<w:r><w:br/></w:r>';continue}
      out+=inlineRuns(child,next);
    }
    return out;
  }
  function wordParagraph(node,opt={}){
    const tag=(node.tagName||'').toLowerCase();
    const heading=tag==='h1'?36:tag==='h2'?30:tag==='h3'?26:0;
    const pPr=(heading?'<w:pPr><w:spacing w:before="180" w:after="100"/></w:pPr>':'');
    const runs=inlineRuns(node,{...opt,bold:opt.bold||!!heading,size:heading||opt.size});
    return '<w:p>'+pPr+(runs||wordRun(' ',opt))+'</w:p>';
  }
  function wordTable(table){
    const rows=[...table.rows].map(row=>'<w:tr>'+[...row.cells].map(cell=>'<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>'+wordParagraph(cell,{bold:cell.tagName.toLowerCase()==='th'})+'</w:tc>').join('')+'</w:tr>').join('');
    return '<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="B7C9D6"/><w:left w:val="single" w:sz="4" w:color="B7C9D6"/><w:bottom w:val="single" w:sz="4" w:color="B7C9D6"/><w:right w:val="single" w:sz="4" w:color="B7C9D6"/><w:insideH w:val="single" w:sz="4" w:color="D7E1E8"/><w:insideV w:val="single" w:sz="4" w:color="D7E1E8"/></w:tblBorders></w:tblPr>'+rows+'</w:tbl>';
  }
  function htmlToWord(html){
    const d=document.createElement('div');d.innerHTML=html;
    let out='';
    for(const node of d.childNodes){
      if(node.nodeType===3){if(node.nodeValue.trim())out+='<w:p>'+wordRun(node.nodeValue)+'</w:p>';continue}
      if(node.nodeType!==1)continue;
      const tag=node.tagName.toLowerCase();
      if(tag==='table')out+=wordTable(node);
      else if(tag==='ul'||tag==='ol'){
        [...node.children].forEach((li,i)=>{const mark=tag==='ol'?(i+1)+'. ':'• ';out+='<w:p>'+wordRun(mark,{bold:true})+inlineRuns(li)+'</w:p>'});
      }else out+=wordParagraph(node);
    }
    return out||'<w:p>'+wordRun(' ')+'</w:p>';
  }
  function docx(title,html){
    const body=htmlToWord(html);
    const files=[
      {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'},
      {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'},
      {name:'docProps/core.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>'+xml(title)+'</dc:title><dc:creator>MSA One</dc:creator></cp:coreProperties>'},
      {name:'word/document.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>'}
    ];
    return zip(files);
  }

  function colName(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
  function xlsx(rows){
    rows=Array.isArray(rows)?rows:[];
    const sheet=rows.map((row,r)=>'<row r="'+(r+1)+'">'+row.map((v,c)=>{
      const ref=colName(c)+(r+1),str=String(v??''),trim=str.trim();
      if(trim.startsWith('=')){
        const formula=xml(trim.slice(1));
        return '<c r="'+ref+'"><f>'+formula+'</f><v>0</v></c>';
      }
      const num=trim!==''&&Number.isFinite(Number(trim));
      return num?'<c r="'+ref+'"><v>'+Number(trim)+'</v></c>':'<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+xml(str)+'</t></is></c>';
    }).join('')+'</row>').join('');
    const files=[
      {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'},
      {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
      {name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>'},
      {name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'},
      {name:'xl/worksheets/sheet1.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'+sheet+'</sheetData></worksheet>'}
    ];
    return zip(files);
  }
  function csv(rows){
    return rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  }

  function pptx(slides){
    slides=(slides&&slides.length?slides:[{title:'Untitled',body:''}]);
    const overrides=slides.map((_,i)=>'<Override PartName="/ppt/slides/slide'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join('');
    const sldIds=slides.map((_,i)=>'<p:sldId id="'+(256+i)+'" r:id="rId'+(i+2)+'"/>').join('');
    const presRels=['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',...slides.map((_,i)=>'<Relationship Id="rId'+(i+2)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide'+(i+1)+'.xml"/>')].join('');
    const files=[
      {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'+overrides+'</Types>'},
      {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>'},
      {name:'ppt/presentation.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>'+sldIds+'</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'},
      {name:'ppt/_rels/presentation.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+presRels+'</Relationships>'},
      {name:'ppt/slideMasters/slideMaster1.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm/></p:grpSpPr></p:spTree></p:cSld><p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles/></p:sldMaster>'},
      {name:'ppt/slideMasters/_rels/slideMaster1.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>'},
      {name:'ppt/slideLayouts/slideLayout1.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm/></p:grpSpPr></p:spTree></p:cSld></p:sldLayout>'},
      {name:'ppt/slideLayouts/_rels/slideLayout1.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>'},
      {name:'ppt/theme/theme1.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="MSA One"><a:themeElements><a:clrScheme name="MSA One"><a:dk1><a:srgbClr val="081523"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1F2937"/></a:dk2><a:lt2><a:srgbClr val="F3F4F6"/></a:lt2><a:accent1><a:srgbClr val="36D9DF"/></a:accent1><a:accent2><a:srgbClr val="63E76D"/></a:accent2><a:accent3><a:srgbClr val="4D8CFF"/></a:accent3><a:accent4><a:srgbClr val="A65CFF"/></a:accent4><a:accent5><a:srgbClr val="FF58AD"/></a:accent5><a:accent6><a:srgbClr val="FFB34C"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="MSA One"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="MSA One"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>'}
    ];
    slides.forEach((s,i)=>{
      const title=xml(s.title||'Slide '+(i+1)), body=xml(s.body||'');
      const tx=(id,name,x,y,cx,cy,text,size,bold)=>'<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="'+name+'"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="'+size+'"'+(bold?' b="1"':'')+'/><a:t>'+text+'</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>';
      files.push({name:'ppt/slides/slide'+(i+1)+'.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="081523"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm/></p:grpSpPr>'+tx(2,'Title',700000,700000,10800000,1400000,title,2800,true)+tx(3,'Body',700000,2300000,10800000,3300000,body,1800,false)+'</p:spTree></p:cSld></p:sld>'});
      files.push({name:'ppt/slides/_rels/slide'+(i+1)+'.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>'});
    });
    return zip(files);
  }

  function pdf(text,title='MSA One'){
    const lines=String(text||' ').replace(/\r/g,'').split('\n').flatMap(line=>{
      const words=line.split(/\s+/), out=[];let cur='';
      for(const w of words){if((cur+' '+w).trim().length>88){out.push(cur);cur=w}else cur=(cur+' '+w).trim()}
      out.push(cur);return out;
    });
    const pages=[];for(let i=0;i<lines.length;i+=46)pages.push(lines.slice(i,i+46));if(!pages.length)pages.push([' ']);
    const objs=[];const add=s=>{objs.push(s);return objs.length};
    const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const pageIds=[];
    const contentIds=[];
    for(const page of pages){
      const escPdf=s=>String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[^\x20-\x7E]/g,'?');
      const ops=['BT','/F1 11 Tf','50 790 Td','14 TL',...page.flatMap((l,i)=>i?['T*','('+escPdf(l)+') Tj']:['('+escPdf(l)+') Tj']),'ET'].join('\n');
      contentIds.push(add('<< /Length '+ops.length+' >>\nstream\n'+ops+'\nendstream'));
      pageIds.push(add('PENDING'));
    }
    const pagesId=add('PENDING');
    pageIds.forEach((id,i)=>objs[id-1]='<< /Type /Page /Parent '+pagesId+' 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 '+font+' 0 R >> >> /Contents '+contentIds[i]+' 0 R >>');
    objs[pagesId-1]='<< /Type /Pages /Kids ['+pageIds.map(id=>id+' 0 R').join(' ')+'] /Count '+pageIds.length+' >>';
    const catalog=add('<< /Type /Catalog /Pages '+pagesId+' 0 R >>');
    const safeTitle=String(title).replace(/[^\x20-\x7E]/g,'?').replace(/[()\\]/g,'');
    const info=add('<< /Title ('+safeTitle+') /Producer (MSA One) >>');
    let out='%PDF-1.4\n', offsets=[0];
    objs.forEach((o,i)=>{offsets.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});
    const xref=out.length;
    out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
    for(let i=1;i<offsets.length;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
    out+='trailer\n<< /Size '+(objs.length+1)+' /Root '+catalog+' 0 R /Info '+info+' 0 R >>\nstartxref\n'+xref+'\n%%EOF';
    return bytes(out);
  }

  window.MSAOffice={zip,docx,xlsx,csv,pptx,pdf,plain,download};
})();