const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:1});
for(const [src,out,w] of JSON.parse(process.argv[2])){const svg=fs.readFileSync(src,'utf8');
await p.setContent(`<html><body style="margin:0;background:#888">${svg.replace(/width="[\d.]+mm" height="[\d.]+mm"/,`width="${w}"`)}</body></html>`);
const el=await p.$('svg');await el.screenshot({path:out});}
await b.close()})();
