const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const [serial,code,owner,out]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:2});
await p.goto(`http://localhost:8765/verify/${serial}/`,{waitUntil:'load'});
await p.waitForTimeout(6000);
await p.evaluate(({serial,owner})=>{
 const flip=document.querySelector('.owner-flip');const card=flip.cloneNode(true);
 card.querySelectorAll('.owner-back').forEach(e=>e.remove());
 card.style.cssText='width:340px;transform:scale(1.9) rotate(-1.5deg);transform-origin:center center;';
 document.body.innerHTML='';document.body.style.cssText='margin:0;background:#050403;overflow:hidden';
 const s=document.createElement('div');
 s.style.cssText='position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse 70% 45% at 50% 46%,#2a2012 0%,#120d08 45%,#050403 80%);display:flex;flex-direction:column;align-items:center;';
 s.innerHTML=`<div style="position:absolute;inset:0;background:repeating-radial-gradient(circle at 50% 46%,rgba(200,161,78,.035) 0 2px,transparent 2px 46px)"></div>
 <img src="/brand/gara-lockup-official.png" style="position:relative;margin-top:128px;width:380px">
 <p class="font-data" style="position:relative;margin-top:44px;color:#d9b45f;font-size:22px;letter-spacing:.32em;text-transform:uppercase">Pieza auténtica · Atelier Registry</p>
 <div id="slot" style="position:relative;margin-top:300px;width:340px;height:476px;filter:drop-shadow(0 40px 60px rgba(0,0,0,.8))"></div>
 <p class="font-data" style="position:relative;margin-top:330px;color:#a49a88;font-size:19px;letter-spacing:.34em;text-transform:uppercase">Propietario</p>
 <p class="font-display" style="position:relative;margin-top:14px;color:#efe6d4;font-size:58px;line-height:1.1">${owner}</p>
 <p class="font-display" style="position:relative;margin-top:14px;color:#d9b45f;font-size:30px;font-style:italic">Hecha a mano en México</p>
 <div class="font-data" style="position:relative;margin-top:44px;padding:18px 36px;border:1px solid rgba(200,161,78,.4);border-radius:999px;color:#efe6d4;font-size:24px;letter-spacing:.06em;background:rgba(0,0,0,.35)">garaleathergoods.mx/verify/${serial}</div>`;
 document.body.appendChild(s);s.querySelector('#slot').appendChild(card);
},{serial,owner});
await p.waitForTimeout(1500);
await p.screenshot({path:out,type:'jpeg',quality:86,clip:{x:0,y:0,width:1080,height:1920}});await b.close();})();
