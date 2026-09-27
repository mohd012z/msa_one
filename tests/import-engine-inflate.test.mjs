import assert from 'node:assert/strict';
import zlib from 'node:zlib';

await import('../www/office-engine.js');
await import('../www/import-engine.js');

function u16(v){return[v&0xff,(v>>8)&0xff]}
function u32(v){return[v&0xff,(v>>8)&0xff,(v>>16)&0xff,(v>>24)&0xff]}
function crc32(buf){
  let c,crc=0xffffffff;
  for(let i=0;i<buf.length;i++){
    c=(crc^buf[i])&0xff;
    for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
    crc=(crc>>>8)^c;
  }
  return(crc^0xffffffff)>>>0;
}
/** Builds a minimal ZIP with a single deflate-compressed (method 8) entry, matching what real Word/Excel files use. */
function buildDeflateZip(name,content){
  const raw=Buffer.from(content,'utf8');
  const compressed=zlib.deflateRawSync(raw);
  const nameBuf=Buffer.from(name,'utf8');
  const crc=crc32(raw);
  const local=Buffer.concat([
    Buffer.from(u32(0x04034b50)),Buffer.from(u16(20)),Buffer.from(u16(0)),Buffer.from(u16(8)),
    Buffer.from(u16(0)),Buffer.from(u16(0)),Buffer.from(u32(crc)),Buffer.from(u32(compressed.length)),
    Buffer.from(u32(raw.length)),Buffer.from(u16(nameBuf.length)),Buffer.from(u16(0)),nameBuf
  ]);
  const localOffset=0;
  const entry=Buffer.concat([local,compressed]);
  const central=Buffer.concat([
    Buffer.from(u32(0x02014b50)),Buffer.from(u16(20)),Buffer.from(u16(20)),Buffer.from(u16(0)),Buffer.from(u16(8)),
    Buffer.from(u16(0)),Buffer.from(u16(0)),Buffer.from(u32(crc)),Buffer.from(u32(compressed.length)),
    Buffer.from(u32(raw.length)),Buffer.from(u16(nameBuf.length)),Buffer.from(u16(0)),Buffer.from(u16(0)),
    Buffer.from(u16(0)),Buffer.from(u16(0)),Buffer.from(u32(0)),Buffer.from(u32(localOffset)),nameBuf
  ]);
  const eocd=Buffer.concat([
    Buffer.from(u32(0x06054b50)),Buffer.from(u16(0)),Buffer.from(u16(0)),Buffer.from(u16(1)),Buffer.from(u16(1)),
    Buffer.from(u32(central.length)),Buffer.from(u32(entry.length)),Buffer.from(u16(0))
  ]);
  return new Uint8Array(Buffer.concat([entry,central,eocd]));
}

const longText='MSA One office import regression text. '.repeat(200);
const zipBytes=buildDeflateZip('word/document.xml',longText);

const savedDS=globalThis.DecompressionStream;
try{
  // Simulate an Android WebView build that does not implement DecompressionStream('deflate-raw').
  globalThis.DecompressionStream=undefined;
  const files=await globalThis.MSAImport.unzip(zipBytes);
  const decoded=new TextDecoder().decode(files['word/document.xml']);
  assert.equal(decoded,longText,'pure-JS DEFLATE fallback must exactly reproduce the original document content');
}finally{
  globalThis.DecompressionStream=savedDS;
}

// Direct decoder check against Node's zlib for a second payload, independent of the ZIP container.
const raw=Buffer.from('The quick brown fox jumps over the lazy dog. '.repeat(500),'utf8');
const compressed=zlib.deflateRawSync(raw);
const decodedDirect=globalThis.MSAImport.inflateRawJS(new Uint8Array(compressed),raw.length);
assert.equal(Buffer.from(decodedDirect).toString('utf8'),raw.toString('utf8'),'inflateRawJS must match zlib deflateRaw output');

console.log('Pure-JS DEFLATE fallback (old-WebView Office import) passed');
