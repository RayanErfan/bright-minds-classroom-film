// Bundled audio gives every browser the same two Iranian Persian voices.
// This source also routes the complete soundtrack into recorded video exports.
export function createAudio(){
 const media=new Audio(new URL('../audio/classroom-fa.mp3',import.meta.url).href);media.preload='auto';media.preservesPitch=true;
 let ctx,bus,destination,enabled=true,unlocked=false,playRequest=0,desiredTime=0,desiredSpeed=1;
 function init(){
  if(ctx)return;ctx=new AudioContext();bus=ctx.createGain();destination=ctx.createMediaStreamDestination();
  const source=ctx.createMediaElementSource(media);source.connect(bus);bus.connect(ctx.destination);bus.connect(destination);bus.gain.value=enabled?1:0;
 }
 async function unlock(){init();await ctx.resume();unlocked=true;}
 async function playAt(time,speed=1){
  const ticket=++playRequest;desiredTime=time;desiredSpeed=speed;await unlock();if(ticket!==playRequest)return;
  media.playbackRate=desiredSpeed;
  if(Math.abs(media.currentTime-desiredTime)>.10)media.currentTime=Math.max(0,Math.min(125.99,desiredTime));
  try{await media.play();}catch(error){if(ticket===playRequest)throw error;}
 }
 function pause(value){if(value){playRequest++;media.pause();}}
 function seek(time,speed=1){desiredTime=time;desiredSpeed=speed;media.playbackRate=speed;media.currentTime=Math.max(0,Math.min(126,time));}
 async function toggle(){await unlock();enabled=!enabled;bus.gain.setTargetAtTime(enabled?1:0,ctx.currentTime,.025);return enabled;}
 return {playAt,unlock,pause,seek,toggle,tick(){},
  get enabled(){return enabled;},get unlocked(){return unlocked;},get running(){return !media.paused&&!media.ended;},get time(){return media.currentTime;},
  get stream(){return destination?.stream;},get context(){return ctx;},get media(){return media;}
 };
}
