import assert from 'node:assert/strict';

const store=new Map();
globalThis.localStorage={
  getItem:key=>store.has(key)?store.get(key):null,
  setItem:(key,value)=>store.set(key,String(value)),
  removeItem:key=>store.delete(key),
  clear:()=>store.clear(),
  key:index=>[...store.keys()][index]??null,
  get length(){return store.size}
};

await import('../www/ai-engine.js');
const AI=globalThis.MSAAIEngine;
assert.ok(AI,'MSAAIEngine must register');

const doc='MSA One is a mobile office workspace. It lets you create documents, spreadsheets and presentations. '+
  'The total budget for the project is 42000 dollars. Sofia is the project owner. '+
  'The deadline for the maintenance report is next Friday. MSA One works fully offline by default.';

// Stats
const s=AI.stats(doc);
assert.ok(s.words>20,'stats must count real words');
assert.ok(s.sentences>=4,'stats must count sentences');
assert.ok(s.readingMinutes>=1,'stats must estimate reading time');

// Keywords: must reflect actual document content, not be empty/generic
const kws=AI.keywords(doc,5);
assert.ok(kws.length>0,'keywords must be extracted from real text');
assert.ok(kws.every(k=>doc.toLowerCase().includes(k)),'every keyword must actually appear in the source document');

// Summarize: must be a strict subset of real sentences, shorter than the original
const summary=AI.summarize(doc,2);
assert.ok(summary.length<doc.length,'summary must be shorter than the source document');
assert.ok(doc.includes(summary.split('. ')[0].split('.')[0]),'summary sentences must be drawn from the real document, not invented');

// Offline Q&A: must actually read the document to answer, not guess
const budgetAnswer=AI.ask('What is the total budget?',doc);
assert.ok(budgetAnswer.confident,'a direct factual question with matching keywords must get a confident offline answer');
assert.ok(budgetAnswer.matches.some(m=>m.includes('42000')),'the answer must come from the sentence that actually contains the fact');

const ownerAnswer=AI.ask('Who is the project owner?',doc);
assert.ok(ownerAnswer.matches.some(m=>m.includes('Sofia')),'must find the sentence naming the actual owner');

const unrelated=AI.ask('What is the capital of France?',doc);
assert.equal(unrelated.confident,false,'a question with no relation to the document must not fabricate a confident match');
assert.equal(unrelated.source,'offline-only','without an online endpoint configured, must say so honestly instead of pretending to answer');

// Online configuration is opt-in and off by default (API setup deferred)
assert.equal(AI.onlineConfigured(),false,'online AI must be off until explicitly configured');
AI.setOnlineEndpoint('https://example.com/ai');
assert.equal(AI.onlineConfigured(),true,'setOnlineEndpoint must enable the online path once configured');
const withOnline=AI.ask('What is the capital of France?',doc);
assert.equal(withOnline.source,'online-needed','once configured, an offline miss should report a connected upgrade is available');
AI.setOnlineEndpoint('');
assert.equal(AI.onlineConfigured(),false,'clearing the endpoint must fall back to offline-only');

// Project text extraction across every project type
assert.equal(AI.extractProjectText({type:'document',content:'<h1>Title</h1><p>Body text</p>'}).text.includes('Body text'),true);
assert.equal(AI.extractProjectText({type:'spreadsheet',content:JSON.stringify({sheets:[{name:'Sheet1',rows:[['A','B'],['1','2']]}]})}).text.includes('A B'),true);
assert.equal(AI.extractProjectText({type:'presentation',content:JSON.stringify({slides:[{title:'Intro',body:'Welcome'}]})}).text.includes('Welcome'),true);
const pdfResult=AI.extractProjectText({type:'pdf',content:'blob:abc123'});
assert.equal(pdfResult.pdfTextUnavailable,true,'a binary/scanned PDF must be honestly reported as having no offline text layer, not silently return empty');
const editablePdf=AI.extractProjectText({type:'pdf',content:'Plain editable PDF text'});
assert.equal(editablePdf.pdfTextUnavailable,false,'an editable text PDF must extract its real text');

console.log('offline AI engine (summary, keywords, Q&A, project extraction) passed');
