import { launchBrowser } from './browser.mjs';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const fps=Number(process.env.FPS||24), duration=Number(process.env.DURATION||126),output=process.env.OUTPUT||'artifacts/bright-minds-classroom-fa.mp4';
await mkdir('artifacts',{recursive:true});
const browser=await launchBrowser();
try {
 const page=await browser.newPage({viewport:{width:1920,height:1200}});
 page.on('pageerror',e=>console.error(e));
 await page.goto('http://127.0.0.1:4175/?render=1',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.classroom,null,{timeout:120000});
 const encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-r',String(fps),'-i','pipe:0','-i','public/audio/classroom-fa.mp3','-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t',String(duration),'-movflags','+faststart',output],{stdio:['pipe','inherit','inherit']});
 const completion=once(encoder,'close');let count=0,start=Date.now();
 for(let i=0;i<Math.ceil(duration*fps);i++){
  const data=await page.evaluate(t=>window.classroom.captureVideoFrame(t),i/fps);
  if(!encoder.stdin.write(Buffer.from(data.split(',')[1],'base64')))await once(encoder.stdin,'drain');
  count++;if(i%fps===0)console.log(`${Math.floor(i/fps)}/${duration}s · ${count} frames · ${((Date.now()-start)/1000).toFixed(1)}s elapsed`);
 }
 encoder.stdin.end();const [code]=await completion;if(code)throw new Error(`FFmpeg exited with ${code}`);console.log(`Rendered ${output}: 1920×1080, ${fps}fps, ${duration}s in ${((Date.now()-start)/1000).toFixed(1)} seconds`);
}finally{await browser.close();}
