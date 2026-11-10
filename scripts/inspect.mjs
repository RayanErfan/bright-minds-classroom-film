import { launchBrowser } from './browser.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('artifacts',{recursive:true});
const browser=await launchBrowser();
const page=await browser.newPage({viewport:{width:1440,height:1080}});
page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log(m.type()+': '+m.text());});page.on('pageerror',e=>console.log('ERROR: '+e.message));
await page.goto('http://127.0.0.1:4175/?render=1',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForFunction(()=>document.documentElement.dataset.ready||document.documentElement.dataset.error,null,{timeout:120000});
console.log(await page.evaluate(()=>({error:document.documentElement.dataset.error,stats:window.classroom?.getStats()})));
await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
for(const t of [9,30,44,59,65,83,93,98,102,119]){
 const data=await page.evaluate(t=>window.classroom.renderAt(t,1280,720),t);
 await writeFile(`artifacts/shot-${t}.png`,Buffer.from(data.split(',')[1],'base64'));
 console.log(`Captured ${t}s`);
}
await page.setViewportSize({width:390,height:844});await page.reload();await page.waitForFunction(()=>window.classroom,null,{timeout:120000});await page.screenshot({path:'artifacts/mobile.png',fullPage:true});
await browser.close();
