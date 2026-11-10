import {launchBrowser} from './browser.mjs';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4175';
const cues=JSON.parse(await readFile('public/audio/dialogue.json','utf8'));
assert.equal(cues.length,19);assert.equal(new Set(cues.map(c=>c.voice)).size,2);
for(let i=0;i<cues.length;i++){
 const c=cues[i];assert.ok(c.audioEnd<=c.end+.02);assert.ok(c.envelope.some(v=>v>.1));assert.ok(c.tempo<=1.2);if(i)assert.ok(c.start>=cues[i-1].audioEnd);
 assert.equal(c.voice,c.speaker==='student'?'fa-IR-DilaraNeural':'fa-IR-FaridNeural');
}
await mkdir('artifacts/persian',{recursive:true});
const browser=await launchBrowser();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(base+'/?render=1',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.classroom||document.documentElement.dataset.error);
 assert.equal(await page.evaluate(()=>document.documentElement.dataset.error),undefined);
 assert.equal(await page.locator('html').getAttribute('lang'),'fa');assert.equal(await page.locator('html').getAttribute('dir'),'rtl');
 console.log('Persian scene loaded:',await page.evaluate(()=>window.classroom.getStats()));
 await page.screenshot({path:'artifacts/persian/desktop.png',fullPage:true});
 for(const t of [44,57,93]){
  const data=await page.evaluate(t=>window.classroom.renderAt(t,1280,720),t);await writeFile(`artifacts/persian/scene-${t}.png`,Buffer.from(data.split(',')[1],'base64'));
 }
 const portrait=await page.evaluate(()=>{const c=window.classroom;c.renderAt(45,1000,1000);c.camera.position.set(1.75,1.84,-4.45);c.camera.lookAt(1.02,1.63,-5.95);c.camera.fov=36;c.camera.updateProjectionMatrix();c.renderer.render(c.world.scene,c.camera);return c.renderer.domElement.toDataURL('image/png');});await writeFile('artifacts/persian/teacher-portrait.png',Buffer.from(portrait.split(',')[1],'base64'));
 const board=await page.evaluate(()=>window.classroom.world.board.canvas.toDataURL());await writeFile('artifacts/persian/whiteboard.png',Buffer.from(board.split(',')[1],'base64'));
 const poses=await page.evaluate(()=>{
  const c=window.classroom,values=[];
  for(const t of [55.8,56.2,57.1,57.6]){c.world.update(t);values.push({student:c.world.students[5].pose.mouth,teacher:c.world.teacher.pose.mouth,hand:c.world.students[5].arms[0].hand.position.y});}
  c.world.update(62.8);const response={student:c.world.students[5].pose.mouth,teacher:c.world.teacher.pose.mouth};c.world.update(53);const closed=c.world.students[5].pose.mouth;
  return {values,response,closed};
 });assert.ok(poses.values.some(p=>p.student>.05));assert.ok(poses.values.every(p=>p.teacher===0));assert.ok(poses.values.every(p=>p.hand>1.7));assert.equal(poses.response.student,0);assert.equal(poses.closed,0);
 console.log('Audio-driven mouth animation:',poses);
 const bounds=await page.evaluate(async()=>{const THREE=await import('three');const c=window.classroom;const all=[];for(const t of [20,40.8,55.8,57,62.8,86]){c.world.update(t);for(const p of [c.world.teacher,c.world.students[5],c.world.students[1]]){p.root.updateMatrixWorld(true);all.push(new THREE.Box3().setFromObject(p.head).getSize(new THREE.Vector3()).toArray());}}return all;});
 assert.ok(bounds.every(([x,y,z])=>x<.65&&y<.7&&z<.65),'Talking faces must remain anatomically bounded, without stretched lip geometry');
 // Produce cached storyboard images from the updated, actual Persian scenes.
 for(let i=0;i<7;i++){
  const data=await page.evaluate(i=>{const c=window.classroom;c.renderAt(c.chapters[i].thumb,448,252);return c.renderer.domElement.toDataURL('image/jpeg',.88);},i);
  await writeFile(`public/thumbnails/chapter-${i+1}.jpg`,Buffer.from(data.split(',')[1],'base64'));
 }
 await page.setViewportSize({width:390,height:844});await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.classroom);await page.screenshot({path:'artifacts/persian/mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Media verification uses an actual user click and a Web Audio loopback recording.
 await page.setViewportSize({width:1100,height:850});await page.goto(base+'/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.classroom);
 await page.locator('#start-with-voice').click();await page.waitForFunction(()=>window.classroom.sound.running);await page.waitForTimeout(450);
 let clock=await page.evaluate(()=>({film:window.classroom.state.time,audio:window.classroom.sound.time,tracks:window.classroom.sound.stream.getAudioTracks().length}));assert.ok(Math.abs(clock.film-clock.audio)<.6);assert.equal(clock.tracks,1);
 await page.locator('#play-button').click();await page.waitForFunction(()=>!window.classroom.state.playing);assert.ok(await page.evaluate(()=>window.classroom.sound.media.paused));
 await page.evaluate(()=>window.classroom.seek(55));assert.ok(Math.abs(await page.evaluate(()=>window.classroom.sound.time)-55)<.1);
 await page.locator('#play-button').click();await page.waitForFunction(()=>window.classroom.sound.running);
 const recorded=await page.evaluate(async()=>{
  const {sound}=window.classroom;const chunks=[];const recorder=new MediaRecorder(sound.stream,{mimeType:'audio/webm;codecs=opus'});
  return await new Promise(resolve=>{recorder.ondataavailable=e=>chunks.push(e.data);recorder.onstop=async()=>{const blob=new Blob(chunks,{type:'audio/webm'});const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(blob);};recorder.start();setTimeout(()=>recorder.stop(),1600);});
 });await writeFile('artifacts/persian/student-recording.webm',Buffer.from(recorded.split(',')[1],'base64'));
 await page.locator('#play-button').click();await page.locator('#speed-button').click();assert.equal(await page.evaluate(()=>window.classroom.sound.media.playbackRate),1.5);
 await page.locator('#audio-button').click();assert.equal(await page.evaluate(()=>window.classroom.sound.enabled),false);await page.locator('#audio-button').click();assert.equal(await page.evaluate(()=>window.classroom.sound.enabled),true);
 await page.locator('#caption-button').click();assert.equal(await page.locator('#caption').textContent(),'');await page.locator('#caption-button').click();
 const range=await page.request.get(base+'/audio/classroom-fa.mp3',{headers:{Range:'bytes=1000-1999'}});assert.equal(range.status(),206);assert.equal((await range.body()).length,1000);
 assert.deepEqual(errors,[]);
 await writeFile('artifacts/persian/verification.json',JSON.stringify({passed:true,voices:['fa-IR-FaridNeural','fa-IR-DilaraNeural'],dialogueLines:19,clock,poses,errors},null,2));
 console.log('PASS: RTL, all native Persian voice clips, mouth animation, raised hand, responsive layout, playback/seek/pause/rate/mute, captions, audio export track, and HTTP range seeking.');
}finally{await browser.close();}
