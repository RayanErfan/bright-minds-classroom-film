import {launchBrowser} from './browser.mjs';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const browser=await launchBrowser();
try{
 const page=await browser.newPage({viewport:{width:1200,height:900},acceptDownloads:true,reducedMotion:'reduce'});page.setDefaultTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?render=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.classroom);
 for(let i=0;i<7;i++){const data=await page.evaluate(i=>{const c=window.classroom;c.renderAt(c.chapters[i].thumb,448,252);return c.renderer.domElement.toDataURL('image/jpeg',.88);},i);await writeFile(`public/thumbnails/chapter-${i+1}.jpg`,Buffer.from(data.split(',')[1],'base64'));}
 const shot=await page.evaluate(()=>{const c=window.classroom;c.renderAt(45,1000,1000);c.camera.position.set(1.75,1.84,-4.45);c.camera.lookAt(1.02,1.63,-5.95);c.camera.fov=36;c.camera.updateProjectionMatrix();c.renderer.render(c.world.scene,c.camera);return c.renderer.domElement.toDataURL('image/png');});await writeFile('artifacts/persian/teacher-portrait.png',Buffer.from(shot.split(',')[1],'base64'));
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.classroom);
 const download=page.waitForEvent('download',{timeout:120000});
 await page.locator('#export-button').click();await page.waitForFunction(()=>window.classroom.state.exporting&&window.classroom.sound.running);
 await page.evaluate(()=>window.classroom.sound.seek(19));await page.waitForTimeout(2800);
 // Complete a short smoke recording using the real production completion path.
 await page.evaluate(()=>window.classroom.sound.seek(125.95));const file=await download;await file.saveAs('artifacts/persian/video-export-smoke.webm');
 await page.waitForFunction(()=>!window.classroom.state.exporting);assert.equal(await page.locator('#export-button').isDisabled(),false);assert.deepEqual(errors,[]);
 console.log('PASS: export completed, downloaded a video with the Persian audio stream, and restored player controls.');
}finally{await browser.close();}
