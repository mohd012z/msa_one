import fs from 'node:fs';
import assert from 'node:assert/strict';

const readme=fs.readFileSync('README.md','utf8');
const contract=fs.readFileSync('integration-contract.md','utf8');

assert.ok(readme.includes('MyAI and Lola companion workflow'),'README must document the companion workflow');
assert.ok(readme.includes('integration-contract.md'),'README must link the integration contract');
for(const field of ['contractVersion','jobId','source','target','taskType','request','project','selectedFiles','options','authorization','createdAt']){
  assert.ok(contract.includes('`'+field+'`')||contract.includes('"'+field+'"'),'contract doc must describe manifest field '+field);
}
for(const field of ['status','provider','summary','sections','findings','artifacts','warnings','provenance','createdAt']){
  assert.ok(contract.includes('`'+field+'`')||contract.includes('"'+field+'"'),'contract doc must describe result field '+field);
}
assert.ok(contract.includes('Desktop Lola is **desktop-only**'),'contract doc must clearly state Lola is desktop-only');
assert.ok(contract.includes('never uploads local files automatically'),'contract doc must document the local trust model');
assert.ok(contract.includes('authorized'),'contract doc must document the authorized-use requirement');

console.log('integration contract documentation passed');
