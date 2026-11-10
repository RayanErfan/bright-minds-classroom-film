export function createAudio(){
 let ctx,bus,destination,enabled=false,timer,noiseBuffer,lastNote=-1;
 const notes=[130.81,164.81,196,261.63,146.83,174.61,220,293.66,130.81,164.81,220,261.63,123.47,164.81,196,246.94];
 function init(){
  if(ctx)return;ctx=new AudioContext();bus=ctx.createGain();bus.gain.value=0;bus.connect(ctx.destination);destination=ctx.createMediaStreamDestination();bus.connect(destination);
  noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*.08,ctx.sampleRate);const d=noiseBuffer.getChannelData(0);let seed=7;for(let i=0;i<d.length;i++){seed=(seed*16807)%2147483647;d[i]=(seed/2147483647*2-1)*Math.exp(-i/d.length*9);}
 }
 function note(freq,duration=3.7){if(!ctx||!enabled)return;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(0,ctx.currentTime);gain.gain.linearRampToValueAtTime(.043,ctx.currentTime+.05);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);osc.connect(gain);gain.connect(bus);osc.start();osc.stop(ctx.currentTime+duration+.1);osc.onended=()=>{osc.disconnect();gain.disconnect();};}
 function tick(t){if(!enabled||!ctx)return;const n=Math.floor(t*1.3);if(n!==lastNote){lastNote=n;note(notes[n%notes.length],3.5);if(n%4===0)note(notes[(n+2)%notes.length]/2,4.9);if(t>=72&&t<108){const src=ctx.createBufferSource(),g=ctx.createGain(),filter=ctx.createBiquadFilter();src.buffer=noiseBuffer;filter.type='highpass';filter.frequency.value=1300;g.gain.value=.035;src.connect(filter);filter.connect(g);g.connect(bus);src.start();src.onended=()=>{src.disconnect();filter.disconnect();g.disconnect();};}}}
 async function toggle(){init();await ctx.resume();enabled=!enabled;bus.gain.setTargetAtTime(enabled?.65:0,ctx.currentTime,.15);return enabled;}
 function pause(value){if(ctx)bus.gain.setTargetAtTime(enabled&&!value?.65:0,ctx.currentTime,.15);}
 return {toggle,tick,pause,get enabled(){return enabled;},get stream(){return destination?.stream;},get context(){return ctx;}};
}
