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
  function rangeRaw(a,b,rows){
    const x=parseRef(a),y=parseRef(b);if(!x||!y)return[];const out=[];
    for(let r=Math.min(x.r,y.r);r<=Math.max(x.r,y.r);r++)for(let c=Math.min(x.c,y.c);c<=Math.max(x.c,y.c);c++)out.push(String(rows[r]?.[c]??'').trim());
    return out;
  }
  const MATH_FN={
    ROUND:(a,b=0)=>{const f=10**Math.trunc(b||0);return Math.round(a*f)/f},
    TRUNC:(a,b=0)=>{const f=10**Math.trunc(b||0);return Math.trunc(a*f)/f},
    ABS:a=>Math.abs(a),
    SQRT:a=>a<0?NaN:Math.sqrt(a),
    POWER:(a,b)=>Math.pow(a,b),
    MOD:(a,b)=>b===0?NaN:a-b*Math.floor(a/b)
  };
  function resolveMathFns(expr){
    let guard=0;
    while(guard++<64){
      const m=expr.match(/\b(ROUND|TRUNC|ABS|SQRT|POWER|MOD)\(([^()]*)\)/i);
      if(!m)break;
      const fn=m[1].toUpperCase(),args=m[2].split(',').map(s=>{
        const a=s.trim();
        if(!/^[0-9eE+\-*/().\s]*$/.test(a))return NaN;
        if(!a)return NaN;
        try{return Number(Function('"use strict";return ('+a+')')())}catch{return NaN}
      });
      const val=MATH_FN[fn](...args);
      expr=expr.slice(0,m.index)+String(Number.isFinite(val)?val:'NaN')+expr.slice(m.index+m[0].length);
    }
    return expr;
  }
  function cellNumber(rows,r,c,seen=new Set()){
    const key=r+':'+c;if(seen.has(key))return 0;seen.add(key);
    const raw=String(rows[r]?.[c]??'').trim();let out=Number(raw);
    if(raw.startsWith('='))out=evaluate(raw,rows,seen);
    seen.delete(key);return Number.isFinite(out)?out:0;
  }
  function evaluate(formula,rows,seen=new Set()){
    let expr=String(formula).replace(/^=/,'');
    expr=expr.replace(/\b(SUM|AVERAGE|MIN|MAX|COUNT|COUNTA|MEDIAN|PRODUCT)\(([A-Z]+\d+):([A-Z]+\d+)\)/gi,(m,fn,a,b)=>{
      fn=fn.toUpperCase();
      if(fn==='COUNTA')return String(rangeRaw(a,b,rows).filter(s=>s!=='').length);
      const vals=rangeValues(a,b,rows,seen);
      if(fn==='COUNT')return String(vals.length);
      if(!vals.length)return'0';
      if(fn==='SUM')return String(vals.reduce((x,y)=>x+y,0));
      if(fn==='AVERAGE')return String(vals.reduce((x,y)=>x+y,0)/vals.length);
      if(fn==='MIN')return String(Math.min(...vals));
      if(fn==='MAX')return String(Math.max(...vals));
      if(fn==='MEDIAN'){const s=[...vals].sort((x,y)=>x-y),mid=Math.floor(s.length/2);return String(s.length%2?s[mid]:(s[mid-1]+s[mid])/2)}
      return String(vals.reduce((x,y)=>x*y,1));
    });
    expr=expr.replace(/\b([A-Z]+)(\d+)\b/gi,(m,a,b)=>{
      const ref=parseRef(a+b);return ref?String(cellNumber(rows,ref.r,ref.c,seen)):'0';
    });
    expr=resolveMathFns(expr);
    if(!/^[0-9eE+\-*/().\s]+$/.test(expr))return NaN;
    try{const v=Function('"use strict";return ('+expr+')')();return Number.isFinite(Number(v))?Number(v):NaN}catch{return NaN}
  }
  globalThis.MSAFormula={colName,parseRef,cellNumber,evaluate};
})();