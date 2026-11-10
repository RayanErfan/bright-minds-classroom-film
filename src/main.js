import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWorld } from './world.js';
import { setCamera, shotCount } from './director.js';
import { createAudio } from './speech-audio.js';
import { CHAPTERS, CAPTIONS, DURATION, chapterAt, formatTime, clamp, fa } from './story.js';

const $=s=>document.querySelector(s), canvas=$('#scene-canvas'),viewport=$('#viewport');
const query=new URLSearchParams(location.search),manual=query.has('render');
let world,renderer,camera,controls;
const state={time:0,playing:false,speed:1,mode:'film',captions:true,chapter:-1,exporting:false};
let lastFrame=0,frameRequest=0,exportTimer=0,recorder,recordCanvas,recordContext,recordStream,exportChunks=[],exportAborted=false,exportOrigin,exportSaved,toastTimer,resizePending=false;
const sound=createAudio();
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3800);}
function createChapters(){
 $('#chapters').innerHTML=CHAPTERS.map((c,i)=>`<button class="chapter${i===0?' active':''}" data-chapter="${i}" aria-label="فصل ${fa(i+1)}: ${c.title}" aria-pressed="${i===0}"><span class="chapter-image"><img src="./thumbnails/chapter-${i+1}.jpg" alt="${c.title}" id="thumb-${i}"/><span class="chapter-numeral">${fa(i+1,2)}</span><span class="chapter-time">${formatTime(c.start)}</span></span><span class="chapter-title">${c.title}</span><span class="chapter-subtitle">${c.short}</span></button>`).join('');
 document.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>{if(state.exporting)return;setMode('film');seek(CHAPTERS[Number(b.dataset.chapter)].start);setPlaying(true);}));
 $('.timeline-markers').innerHTML=CHAPTERS.slice(1).map(c=>`<i style="left:${c.start/DURATION*100}%"></i>`).join('');
}
function updateUI(){
 const i=chapterAt(state.time),chapter=CHAPTERS[i];
 if(i!==state.chapter){
  state.chapter=i;$('#scene-number').textContent=`${fa(i+1,2)} / ۰۷`;$('#scene-label').textContent=chapter.title;$('#shot-label').textContent=chapter.tag;$('#now-playing').textContent=chapter.title;
  $('#panel-index').textContent=`${fa(i+1,2)} از ۰۷`;$('#panel-chapter').textContent=`فصل ${chapter.word}`;$('#panel-title').innerHTML=chapter.heading;$('#panel-description').textContent=chapter.description;$('#panel-focus').innerHTML=chapter.focus.map(s=>`<li>${s}</li>`).join('');$('#scene-symbol').innerHTML=`<svg viewBox="0 0 24 24">${chapter.icon}</svg>`;
  document.querySelectorAll('[data-chapter]').forEach((el,j)=>{el.classList.toggle('active',j===i);el.setAttribute('aria-pressed',j===i?'true':'false');});
 }
 $('#current-time').textContent=formatTime(state.time);$('#timeline').value=state.time;$('#timeline').style.setProperty('--progress',`${state.time/DURATION*100}%`);
 const caption=CAPTIONS.find(c=>state.time>=c[0]&&state.time<c[1]);$('#caption').textContent=state.captions&&state.mode==='film'&&caption?caption[2]:'';
 $('#film-title').classList.toggle('visible',state.mode==='film'&&state.time>=.2&&state.time<7.3&&!state.exporting);
 if(state.exporting)$('#export-status').textContent=`آماده‌سازی ${fa(Math.round(state.time/DURATION*100))}٪ · ${formatTime(DURATION-state.time)} باقی‌مانده`;
}
async function setPlaying(value){
 if(state.exporting&&!value)return;
 if(value&&state.time>=DURATION)seek(0);state.playing=value;lastFrame=performance.now();sound.pause(!value);
 if(value){$('#start-with-voice').hidden=true;sound.playAt(state.time,state.speed).catch(()=>{setPlaying(false);toast('برای شنیدن صدای فارسی، دوباره دکمهٔ پخش را بزنید.');});}
 $('#play-button').setAttribute('aria-label',value?'مکث فیلم':'پخش فیلم');$('#play-button').innerHTML=value?'<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm7 0h4v14h-4z" fill="currentColor" stroke="none"/></svg>':'<svg viewBox="0 0 24 24"><path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none"/></svg>';
}
function seek(t){state.time=clamp(t,0,DURATION);lastFrame=performance.now();sound.seek(state.time,state.speed);draw();updateUI();}
function resize(){
 if(!renderer)return;const {width,height}=viewport.getBoundingClientRect();
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();
}
function draw(){
 if(!world)return;
 world.update(state.time);
 if(state.mode==='film')setCamera(camera,state.time,canvas.width/canvas.height);else controls.update();
 renderer.render(world.scene,camera);
}
function setMode(mode){
 if(state.exporting)return;state.mode=mode;controls.enabled=mode==='explore';$('#film-mode').classList.toggle('active',mode==='film');$('#explore-mode').classList.toggle('active',mode==='explore');$('#explore-hint').hidden=mode!=='explore';$('#render-label').innerHTML=mode==='explore'?'دوربین آزاد <b> / </b> گشت‌وگذار':'نمای سه‌بعدی <b> / </b> پخش زنده';
 if(mode==='explore'){const {aim}=setCamera(camera,state.time,camera.aspect);controls.target.copy(aim);controls.update();$('#film-title').classList.remove('visible');}
 draw();updateUI();
}
function frame(now){
 const dt=Math.min((now-lastFrame)/1000,.15);lastFrame=now;
 if(state.playing){state.time=sound.unlocked?Math.min(DURATION,sound.time):Math.min(DURATION,state.time+dt*state.speed);if(sound.media.ended)state.time=DURATION;}
 if(state.playing||state.mode==='explore')draw();
 updateUI();
 if(state.exporting){paintExport();recordStream?.getVideoTracks()[0]?.requestFrame?.();if(state.time>=DURATION&&recorder?.state==='recording')recorder.stop();}
 if(state.time>=DURATION&&!state.exporting&&state.playing)setPlaying(false);
 if(state.exporting)exportTimer=setTimeout(()=>frame(performance.now()),1000/30);
 else frameRequest=requestAnimationFrame(frame);
}
function paintExport(){
 const c=recordContext,w=recordCanvas.width,h=recordCanvas.height;c.fillStyle='#131c19';c.fillRect(0,0,w,h);c.drawImage(canvas,0,0,w,h);
 const grad=c.createLinearGradient(0,h*.72,0,h);grad.addColorStop(0,'#0b171800');grad.addColorStop(1,'#0b1718b0');c.fillStyle=grad;c.fillRect(0,0,w,h);
 c.direction='rtl';c.textAlign='right';c.fillStyle='#f2edda';c.font='500 20px Vazirmatn';c.fillText('ذهن‌های روشن  /  آزمایشگاه یادگیری',w-56,50);
 const chapter=CHAPTERS[chapterAt(state.time)];c.font='22px Vazirmatn';c.fillText(`${fa(chapterAt(state.time)+1,2)} از ۰۷     ${chapter.title}`,w-56,h-42);
 if(state.time<7.3&&state.time>.2){c.globalAlpha=Math.min(1,(state.time-.2)/1.5,(7.3-state.time)/1.2);c.fillStyle='#fff5e0';c.font='500 64px Vazirmatn';c.fillText('هر ایدهٔ بزرگ',w-115,390);c.fillText('از جایی شروع می‌شود.',w-115,490);c.font='27px Vazirmatn';c.fillText('به آزمایشگاه یادگیری خوش آمدید.',w-120,552);c.globalAlpha=1;}
 if(state.captions){const cap=CAPTIONS.find(a=>state.time>=a[0]&&state.time<a[1]);if(cap){c.font='28px Vazirmatn';const lines=[];let line='';for(const word of cap[2].split(' ')){const next=line?line+' '+word:word;if(c.measureText(next).width>w*.82&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);const width=Math.max(...lines.map(l=>c.measureText(l).width));c.fillStyle='#111d19df';c.fillRect((w-width)/2-24,h-103-lines.length*45,width+48,lines.length*45+13);c.fillStyle='#fcf9ec';c.textAlign='center';lines.forEach((l,i)=>c.fillText(l,w/2,h-103-(lines.length-1-i)*45));c.textAlign='right';}}
 if(state.time>122){c.globalAlpha=Math.min(1,(state.time-122)/1.5);c.textAlign='center';c.font='500 68px Vazirmatn';c.fillStyle='#f4e8ce';c.fillText('فردایی روشن‌تر',w/2,h*.46);c.font='25px Vazirmatn';c.fillText('همیشه بپرسید، همیشه بسازید.',w/2,h*.46+64);c.textAlign='right';c.globalAlpha=1;}
}
async function startExport(){
 if(state.exporting)return;if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){toast('این مرورگر امکان ضبط فیلم را ندارد. از کروم یا اِج استفاده کنید.');return;}
 const mime=['video/webm;codecs=vp8,opus','video/webm;codecs=vp9,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime){toast('برای دریافت فیلم، از مرورگر کروم یا اِج استفاده کنید.');return;}
 exportSaved={time:state.time,playing:state.playing,mode:state.mode,speed:state.speed};setMode('film');setPlaying(false);
 try{
  await sound.unlock();
  recordCanvas=document.createElement('canvas');recordCanvas.width=1920;recordCanvas.height=1080;recordContext=recordCanvas.getContext('2d');
  renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);camera.aspect=16/9;camera.updateProjectionMatrix();state.time=0;draw();paintExport();
  recordStream=recordCanvas.captureStream(0);if(sound.stream)sound.stream.getAudioTracks().forEach(t=>recordStream.addTrack(t.clone()));
  recorder=new MediaRecorder(recordStream,{mimeType:mime,videoBitsPerSecond:12_000_000});exportChunks=[];exportAborted=false;
  recorder.ondataavailable=e=>{if(e.data.size)exportChunks.push(e.data);};recorder.onerror=()=>{exportAborted=true;toast('ضبط فیلم متوقف شد. برنامه‌های سنگین را ببندید و دوباره تلاش کنید.');if(recorder.state!=='inactive')recorder.stop();else finishExport();};recorder.onstop=()=>finishExport(false);
  state.exporting=true;$('#export-progress').hidden=false;$('#export-button').disabled=true;$('#timeline').disabled=true;$('#film-mode').disabled=true;$('#explore-mode').disabled=true;state.speed=1;setPlaying(true);exportOrigin=performance.now();recorder.start(1000);
  cancelAnimationFrame(frameRequest);clearTimeout(exportTimer);recordStream.getVideoTracks()[0]?.requestFrame?.();exportTimer=setTimeout(()=>frame(performance.now()),0);
  toast('فیلم با صدای فارسی ضبط می‌شود. این برگه را تا آغاز دانلود باز نگه دارید.');
 }catch(error){console.error(error);state.exporting=false;finishExport(true);toast('ضبط شروع نشد. از مرورگر کروم یا اِج استفاده کنید.');}
}
function finishExport(failed=false){
 clearTimeout(exportTimer);
 if(!exportAborted&&!failed&&exportChunks.length){const blob=new Blob(exportChunks,{type:'video/webm'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='bright-minds-classroom-1080p.webm';link.click();setTimeout(()=>URL.revokeObjectURL(url),60_000);toast('فیلم کلاس آماده است. دانلود آغاز شد.');}
 recordStream?.getTracks().forEach(t=>t.stop());state.exporting=false;$('#export-progress').hidden=true;$('#export-button').disabled=false;$('#timeline').disabled=false;$('#film-mode').disabled=false;$('#explore-mode').disabled=false;
 if(exportSaved){state.speed=exportSaved.speed;state.time=exportSaved.time;state.mode=exportSaved.mode;sound.seek(state.time,state.speed);resize();setMode(exportSaved.mode);setPlaying(exportSaved.playing);}else resize();
 exportChunks=[];recordCanvas=null;recordContext=null;recorder=null;
 cancelAnimationFrame(frameRequest);if(!manual)frameRequest=requestAnimationFrame(frame);
}
function cancelExport(){if(!state.exporting)return;exportAborted=true;if(recorder?.state!=='inactive')recorder.stop();toast('دریافت فیلم لغو شد. می‌توانید تماشا را ادامه دهید.');}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('.player').requestFullscreen();}catch{toast('نمایش تمام‌صفحه در این مرورگر در دسترس نیست.');}}
function updateAudioButton(on){$('#audio-button').setAttribute('aria-label',on?'بی‌صدا کردن فیلم':'فعال‌کردن صدای فارسی');$('#audio-button').title=on?'بی‌صدا کردن فیلم':'فعال‌کردن صدای فارسی';$('#audio-button').innerHTML=`<svg viewBox="0 0 24 24"><path d="M11 4 6 8H3v8h3l5 4z${on?'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14':'M16 9l5 6m0-6-5 6'}"/></svg>`;}
async function toggleAudio(){if(state.exporting)return;try{const on=await sound.toggle();sound.pause(!state.playing);updateAudioButton(on);toast(on?'گفت‌وگوی فارسی و موسیقی فعال شد':'صدای فیلم خاموش شد');}catch{toast('پخش صدا ممکن نشد. دوباره دکمهٔ پخش را بزنید.');}}
function toggleCaptions(){state.captions=!state.captions;$('#caption-button').classList.toggle('active',state.captions);$('#caption-button').setAttribute('aria-pressed',String(state.captions));$('#caption-button').setAttribute('aria-label',state.captions?'پنهان‌کردن زیرنویس':'نمایش زیرنویس');updateUI();}
function bindControls(){
 $('#start-with-voice').addEventListener('click',()=>setPlaying(true));
 $('#play-button').addEventListener('click',()=>setPlaying(!state.playing));$('#restart-button').addEventListener('click',()=>{if(!state.exporting){seek(0);setPlaying(true);}});
 $('#timeline').addEventListener('input',e=>{if(!state.exporting)seek(Number(e.target.value));});
 $('#film-mode').addEventListener('click',()=>setMode('film'));$('#explore-mode').addEventListener('click',()=>setMode('explore'));$('#reset-camera').addEventListener('click',()=>{const {aim}=setCamera(camera,9,camera.aspect);controls.target.copy(aim);controls.update();draw();});
 $('#speed-button').addEventListener('click',()=>{if(state.exporting)return;const rates=[1,1.5,2,.5];state.speed=rates[(rates.indexOf(state.speed)+1)%rates.length];sound.media.playbackRate=state.speed;$('#speed-button').textContent=`${fa(state.speed)}×`;});
 $('#audio-button').addEventListener('click',toggleAudio);$('#caption-button').addEventListener('click',toggleCaptions);$('#fullscreen-button').addEventListener('click',fullscreen);
 $('#export-button').addEventListener('click',startExport);$('#cancel-export').addEventListener('click',cancelExport);
 $('#info-button').addEventListener('click',()=>$('#info-dialog').showModal());$('.dialog-close').addEventListener('click',()=>$('#info-dialog').close());$('.dialog-done').addEventListener('click',()=>$('#info-dialog').close());
 $('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
 document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,button')||$('#info-dialog').open||state.exporting)return;if(e.code==='Space'){e.preventDefault();setPlaying(!state.playing);}if(e.key==='ArrowRight'){e.preventDefault();seek(state.time+5);}if(e.key==='ArrowLeft'){e.preventDefault();seek(state.time-5);}if(e.key.toLowerCase()==='f')fullscreen();if(e.key.toLowerCase()==='m')toggleAudio();if(e.key.toLowerCase()==='c')toggleCaptions();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.exporting){cancelExport();toast('ضبط متوقف شد؛ هنگام ضبط فیلم، این برگه باید باز بماند.');}lastFrame=performance.now();});
 const observer=new ResizeObserver(()=>{if(state.exporting)return;cancelAnimationFrame(resizePending);resizePending=requestAnimationFrame(resize);});observer.observe(viewport);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setPlaying(false);if(state.exporting)cancelExport();toast('نمای سه‌بعدی متوقف شد. صفحه را دوباره بارگذاری کنید.');});
}
async function init(){
 try{
  createChapters();await document.fonts.load('500 24px Vazirmatn','ذهن‌های روشن');await document.fonts.ready;
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.93;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  camera=new THREE.PerspectiveCamera(58,16/9,.06,100);world=createWorld();controls=new OrbitControls(camera,canvas);controls.enabled=false;controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=.7;controls.maxDistance=17;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.15;controls.target.set(0,1.5,-1);controls.enablePan=true;
  // Cached stills were rendered from the seven real scenes; startup draws only the film.
  renderer.setPixelRatio(1);renderer.setSize(448,252,false);
  state.time=Number(query.get('t')||0);resize();bindControls();updateAudioButton(sound.enabled);updateUI();$('#loading').classList.add('hidden');
  window.classroom={state,world,sound,renderer,camera,chapters:CHAPTERS,duration:DURATION,shotCount,seek,setPlaying,setMode,startExport,cancelExport,
   getExportStatus(){return {recording:recorder?.state,exporting:state.exporting,time:state.time,audioTime:sound.time,audioPlaying:sound.running,chunks:exportChunks.length};},
   renderAt(t,width=1920,height=1080){state.playing=false;sound.pause(true);state.mode='film';state.time=t;renderer.setPixelRatio(1);renderer.setSize(width,height,false);draw();updateUI();return canvas.toDataURL('image/png');},
   captureVideoFrame(t){state.playing=false;sound.pause(true);state.mode='film';state.time=t;if(canvas.width!==1920||canvas.height!==1080){renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);}draw();recordCanvas=document.createElement('canvas');recordCanvas.width=1920;recordCanvas.height=1080;recordContext=recordCanvas.getContext('2d');paintExport();const data=recordCanvas.toDataURL('image/jpeg',.95);recordCanvas=null;recordContext=null;return data;},
   getStats(){return {triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,...world.stats};}};
  document.documentElement.dataset.ready='true';if(manual)$('#start-with-voice').hidden=true;
  if(!manual){setPlaying(false);lastFrame=performance.now();frameRequest=requestAnimationFrame(frame);}else setPlaying(false);
 }catch(error){console.error(error);$('#loading').innerHTML='<span>نمای سه‌بعدی آماده نشد.</span><small>شتاب‌دهی سخت‌افزاری مرورگر را فعال و صفحه را دوباره بارگذاری کنید.</small>';document.documentElement.dataset.error=error.message;}
}
init();
