const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({deviceScaleFactor:1.5,viewport:{width:1800,height:1200}});
await p.goto('file://'+process.argv[2],{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);
await p.waitForTimeout(400);await p.screenshot({path:process.argv[3],fullPage:true});await b.close();console.log('ok')})();
