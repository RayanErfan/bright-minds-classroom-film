import {launchBrowser} from './browser.mjs';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const browser=await launchBrowser();
try{
 const page=await browser.newPage({viewport:{width:1100,height:850},acceptDownloads:true,reducedMotion:'reduce'});page.setDefaultTimeout(120000);
 page.on('pageerror',e=>console.log('PAGEERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text());});
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.classroom);console.log('Ready');
 let downloaded;page.on('download',d=>{downloaded=d;console.log('Download event',d.suggestedFilename());});
 await page.locator('#export-button').click();console.log('Clicked export');
 await page.waitForTimeout(1200);console.log('Start',await page.evaluate(()=>({status:window.classroom.getExportStatus(),toast:document.querySelector('#toast').textContent})));
 await page.evaluate(()=>window.classroom.sound.seek(19));await page.waitForTimeout(2200);
 console.log('Speaking',await page.evaluate(()=>window.classroom.getExportStatus()));
 await page.evaluate(()=>window.classroom.sound.seek(125.95));await page.waitForTimeout(2000);
 console.log('End',await page.evaluate(()=>({status:window.classroom.getExportStatus(),toast:document.querySelector('#toast').textContent})));
 await page.waitForTimeout(1000);
 if(!downloaded)downloaded=await page.waitForEvent('download',{timeout:60000});
 await downloaded.saveAs('artifacts/persian/video-export-smoke.webm');
 await page.waitForFunction(()=>!window.classroom.state.exporting);assert.equal(await page.locator('#export-button').isDisabled(),false);
 console.log('PASS: downloaded video saved and player controls restored.');
}finally{await browser.close();}
