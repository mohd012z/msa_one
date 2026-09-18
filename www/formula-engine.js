(()=> {
  function colName(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
  function parseRef(ref){
    const m=String(ref).match(/^([A-Z]+)(\d+)$/i);if(!m)return null;
    let c=0;for(const ch of m[1].toUpperCase())c=c*26+ch.charCodeAt(0)-64;
    return {r:+m[2]-1,c:c-1};
  }
  function rangeValues(a,b,rows,seen){
    const x=parseRef(a),y=parseRef(b);if(!x||!y)return[];const out=[];
    for(let r=Math.min(x.r,y.r);r<=Math.max(x.r,y.r);r++)for(let c=Math.min(x.c,y.c);c<=Math.max(x.c,y.c);c++)out.push(cellNumber(rows,r,c,seen));
    return out.filter(Number.isFinite);
  }
  function cellNumber(rows,r,c,seen=new Set()){
    const key=r+':'+c;if(seen.has(key))return 0;seen.add(key);
    const raw=String(rows[r]?.[c]??'').trim();let out=Number(raw);
    if(raw.startsWith('='))out=evaluate(raw,rows,seen);
    seen.delete(key);return Number.isFinite(out)?out:0;
  }
  function evaluate(formula,rows,seen=new Set()){
    let expr=String(formula).replace(/^=/,'');
    expr=expr.replace(/\b(SUM|AVERAGE|MIN|MAX)\(([A-Z]+\d+):([A-Z]+\d+)\)/gi,(m,fn,a,b)=>{
      const vals=rangeValues(a,b,rows,seen);if(!vals.length)return'0';fn=fn.toUpperCase();
      if(fn==='SUM')return String(vals.reduce((x,y)=>x+y,0));
      if(fn==='AVERAGE')return String(vals.reduce((x,y)=>x+y,0)/vals.length);
      if(fn==='MIN')return String(Math.min(...vals));
      return String(Math.max(...vals));
    });
    expr=expr.replace(/\b([A-Z]+)(\d+)\b/gi,(m,a,b)=>{
      const ref=parseRef(a+b);return ref?String(cellNumber(rows,ref.r,ref.c,seen)):'0';
    });
    if(!/^[0-9eE+\-*/().\s]+$/.test(expr))return NaN;
    try{const v=Function('"use strict";return ('+expr+')')();return Number.isFinite(Number(v))?Number(v):NaN}catch{return NaN}
  }
  globalThis.MSAFormula={colName,parseRef,cellNumber,evaluate};
})();