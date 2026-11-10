"""Create bundled Iranian Persian dialogue, timing data, and a stereo soundtrack.
Run with .voice-venv/bin/python scripts/generate-voices.py (edge-tts required).
Only the authored lesson dialogue is sent to the TTS service.
"""
import asyncio, json, math, subprocess, wave
from pathlib import Path
import edge_tts

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/audio'
OUT.mkdir(parents=True,exist_ok=True)
CUES=json.loads((ROOT/'scripts/dialogue-fa.json').read_text())
VOICES={'teacher':'fa-IR-FaridNeural','narrator':'fa-IR-FaridNeural','student':'fa-IR-DilaraNeural'}
SR=24000
def run(args): return subprocess.run(args,check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE).stdout

async def main():
    # Serial requests avoid throttling and preserve useful, completed clips on retry.
    for i,cue in enumerate(CUES):
        raw=OUT/f'raw-{i:02}.mp3'
        if not raw.exists() or raw.stat().st_size<1000:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(cue['text'],VOICES[cue['speaker']],rate='+0%').save(str(raw))
                    break
                except Exception:
                    if attempt==2: raise
                    await asyncio.sleep(2)
        duration=float(run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(raw)]))
        available=cue['end']-cue['start']-.10
        tempo=max(1,duration/available)
        if tempo>1.4: raise RuntimeError(f"Line {i} is too long for natural delivery: {tempo:.2f}x. Shorten its text.")
        target=OUT/f'line-{i:02}.wav'
        run(['ffmpeg','-y','-v','error','-i',str(raw),'-af',f'atempo={tempo:.6f},loudnorm=I=-18:TP=-2:LRA=8,afade=t=in:d=0.015,afade=t=out:st={available-.04}:d=0.04','-ac','1','-ar',str(SR),str(target)])
        cue['voice']=VOICES[cue['speaker']]
        cue['tempo']=round(tempo,3)
        cue['file']=f'/audio/line-{i:02}.wav'
        print(f'{i+1}/{len(CUES)} {cue["voice"]}: {duration:.2f}s → {available:.2f}s window',flush=True)

    # Standard-library PCM mix avoids adding a heavy ML runtime to the project.
    import array
    mix=array.array('f',[0])*(126*SR)
    for i,cue in enumerate(CUES):
        with wave.open(str(OUT/f'line-{i:02}.wav'),'rb') as f:
            pcm=array.array('h',f.readframes(f.getnframes()))
        cue['audioEnd']=round(cue['start']+len(pcm)/SR,4)
        offset=round(cue['start']*SR)
        for j,v in enumerate(pcm):
            if offset+j<len(mix): mix[offset+j]+=v/32768
        window=SR//25
        rms=[math.sqrt(sum((v/32768)**2 for v in pcm[j:j+window])/max(1,len(pcm[j:j+window]))) for j in range(0,len(pcm),window)]
        peak=max(rms) or 1
        cue['envelope']=[round(min(1,max(0,(v/peak-.06)/.7)),3) for v in rms]
    # Keep a clean dialogue master. The music is mixed quietly beneath it.
    with wave.open(str(OUT/'dialogue-fa.wav'),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR)
        f.writeframes(array.array('h',(int(max(-.98,min(.98,v))*32767) for v in mix)).tobytes())
    score=ROOT/'artifacts/bright-minds-score.wav'
    if score.exists():
        run(['ffmpeg','-y','-v','error','-i',str(OUT/'dialogue-fa.wav'),'-i',str(score),'-filter_complex','[1:a]volume=0.20[m];[0:a][m]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.96:level=false[a]','-map','[a]','-ac','2','-ar','48000','-c:a','libmp3lame','-b:a','160k',str(OUT/'classroom-fa.mp3')])
    else:
        run(['ffmpeg','-y','-v','error','-i',str(OUT/'dialogue-fa.wav'),'-ac','2','-c:a','libmp3lame','-b:a','160k',str(OUT/'classroom-fa.mp3')])
    (OUT/'dialogue.json').write_text(json.dumps(CUES,ensure_ascii=False,indent=2))
    (ROOT/'src/voice-timing.js').write_text('export const VOICE_CUES = '+json.dumps(CUES,ensure_ascii=False,separators=(',',':'))+';\n')
    def stamp(t):
        ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    srt='\n'.join(f'{i+1}\n{stamp(c["start"])} --> {stamp(c["end"])}\n'+({'teacher':'معلم: ','student':'دانش‌آموز: '}.get(c['speaker'],''))+c['text']+'\n' for i,c in enumerate(CUES))
    (ROOT/'artifacts/bright-minds-captions-fa.srt').write_text(srt)
    print('Created 126-second Persian soundtrack and audio-driven mouth timing.',flush=True)

asyncio.run(main())
