const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const [srcs,out] of JSON.parse(process.argv[2])){
 const pages=srcs.map(s=>`<div class="pg">${fs.readFileSync(s,'utf8').replace(/width="[\d.]+mm" height="[\d.]+mm"/,'width="158mm" height="108mm"')}</div>`).join('');
 await p.setContent(`<html><head><style>@page{size:158mm 108mm;margin:0}html,body{margin:0}.pg{width:158mm;height:108mm;overflow:hidden;page-break-after:always}.pg:last-child{page-break-after:auto}svg{display:block}</style></head><body>${pages}</body></html>`);
 await p.pdf({path:out,width:'158mm',height:'108mm',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});console.log('pdf',out)}
await b.close()})();
