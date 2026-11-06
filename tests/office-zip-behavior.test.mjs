import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../www/import-engine.js',import.meta.url),'utf8');
const context=vm.createContext({TextDecoder,Uint8Array,Int32Array,Blob,Response,DecompressionStream:undefined,setTimeout,Promise});
context.globalThis=context;
vm.runInContext(source,context);
const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
function zip(entries){
  const bytes=[],central=[];
  for(const {name,data} of entries){
    const filename=[...new TextEncoder().encode(name)],payload=[...new TextEncoder().encode(data)],offset=bytes.length;
    bytes.push(...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(payload.length),...u32(payload.length),...u16(filename.length),...u16(0),...filename,...payload);
    central.push(...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(payload.length),...u32(payload.length),...u16(filename.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...filename);
  }
  const offset=bytes.length;
  bytes.push(...central,...u32(0x06054b50),...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(central.length),...u32(offset),...u16(0));
  return new Uint8Array(bytes);
}
test('valid stored Office ZIP entry is imported',async()=>{
  const result=await context.MSAImport.unzip(zip([{name:'word/document.xml',data:'<root/>'}]));
  assert.equal(new TextDecoder().decode(result['word/document.xml']),'<root/>');
});
test('duplicate normalized paths rejected',async()=>{
  await assert.rejects(context.MSAImport.unzip(zip([{name:'word/document.xml',data:'first'},{name:'word/./document.xml',data:'second'}])),/Unsafe or duplicate/);
});
test('parent traversal rejected',async()=>{
  await assert.rejects(context.MSAImport.unzip(zip([{name:'../evil.xml',data:'bad'}])),/Unsafe or duplicate/);
});
test('incorrect declared decompressed length rejected',async()=>{
  const bytes=zip([{name:'word/document.xml',data:'abc'}]);
  const nameLen='word/document.xml'.length;
  const central=30+nameLen+3;
  bytes[central+24]=4;
  await assert.rejects(context.MSAImport.unzip(bytes),/size does not match/);
});
test('truncated central directory rejected',async()=>{
  await assert.rejects(context.MSAImport.unzip(new Uint8Array([1,2,3])),/central directory/);
});
