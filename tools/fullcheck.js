const {chromium,devices}=require('playwright');const url=process.argv[2],shot=process.argv[3];
(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13']});const p=await c.newPage();
const errs=[],bad=[];let bytes=0,n=0;p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,140))});
p.on('response',async r=>{if(r.url().includes('embed=1'))return;n++;try{bytes+=(await r.body()).length;if(r.status()>=400)bad.push(r.status()+' '+r.url())}catch(e){}});
await p.goto(url,{waitUntil:'load'});for(let y=0;y<40;y++){await p.mouse.wheel(0,900);await p.waitForTimeout(150)}await p.waitForTimeout(2500);
const r=await p.evaluate(()=>({imgs:document.images.length,broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')).slice(0,8),figs:document.querySelectorAll('#track figure').length,wide:document.documentElement.scrollWidth>innerWidth+2}));
console.log(JSON.stringify({requests:n,KB:Math.round(bytes/1024),...r,errs,bad}));
if(shot){await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(500);await p.screenshot({path:shot})}await b.close()})();
