import fs from 'node:fs';
import path from 'node:path';

const active=process.env.PREMIUM_ACTIVATE==='1';
if(!active){
  console.log('Premium activation skipped: PREMIUM_ACTIVATE is not 1.');
  process.exit(0);
}
const root=process.cwd();
const android=path.join(root,'android');
if(!fs.existsSync(android))throw new Error('Android project not found. Run cap add/sync first.');

const pkgDir=path.join(android,'app','src','main','java','com','msa','one','displayfit37');
fs.mkdirSync(pkgDir,{recursive:true});

const template=fs.readFileSync(path.join(root,'premium-prep','android','PremiumBillingPlugin.java'),'utf8')
  .replace('private static final boolean ACTIVE = false;','private static final boolean ACTIVE = true;');
fs.writeFileSync(path.join(pkgDir,'PremiumBillingPlugin.java'),template);

const mainActivity=path.join(pkgDir,'MainActivity.java');
fs.writeFileSync(mainActivity,`package com.msa.one.displayfit37;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PremiumBillingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);

const gradle=path.join(android,'app','build.gradle');
let g=fs.readFileSync(gradle,'utf8');
if(!g.includes('com.android.billingclient:billing:9.1.0')){
  g=g.replace(/dependencies\s*\{/,'dependencies {\n    implementation "com.android.billingclient:billing:9.1.0"');
  fs.writeFileSync(gradle,g);
}
console.log('Premium Android bridge activated for this generated Android project.');
