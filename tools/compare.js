// node compare.js <beforeURL> <afterURL> [outPrefix]  -> mobile+desktop screenshots, prints pixel-diff per view (needs: pip pillow numpy)
const {chromium,devices}=require('playwright');const {execSync}=require('child_process');
const [A,B,P='cmp']=process.argv.slice(2);
(async()=>{const b=await chromium.launch();
const views=[['m',{...devices['iPhone 13']}],['d',{viewport:{width:1440,height:900}}]];
for(const [k,ctx] of views)for(const [tag,u] of [['a',A],['b',B]]){const c=await b.newContext(ctx);const p=await c.newPage();await p.goto(u,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(2500);
await p.screenshot({path:`${P}_${k}_${tag}.png`,fullPage:false});await c.close()}
await b.close();
console.log(execSync(`python3 -c "
from PIL import Image,ImageChops;import numpy as np
for k in ['m','d']:
  a=Image.open('${P}_'+k+'_a.png').convert('RGB');b=Image.open('${P}_'+k+'_b.png').convert('RGB');d=np.asarray(ImageChops.difference(a,b))
  print(k,'mean',round(float(d.mean()),2),'changed',round(float((d.max(2)>40).mean())*100,2),'%', 'OK' if (d.max(2)>40).mean()<0.03 else 'CHECK')"`).toString())})();
