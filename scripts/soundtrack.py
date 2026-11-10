"""Generate an original, quiet ambient score and synchronized typing foley."""
import wave
from pathlib import Path
import numpy as np

SR = 48000
DURATION = 126
rng = np.random.default_rng(204)
audio = np.zeros((SR * DURATION, 2), dtype=np.float32)
notes = [130.81, 164.81, 196, 261.63, 146.83, 174.61, 220, 293.66,
         130.81, 164.81, 220, 261.63, 123.47, 164.81, 196, 246.94]

def place(start, signal, pan=0):
    offset = int(start * SR)
    length = min(len(signal), len(audio) - offset)
    if length <= 0:
        return
    audio[offset:offset+length, 0] += signal[:length] * np.sqrt((1-pan)/2)
    audio[offset:offset+length, 1] += signal[:length] * np.sqrt((1+pan)/2)

def tone(frequency, duration=4.2, amplitude=.073):
    t = np.arange(int(SR * duration)) / SR
    envelope = (1-np.exp(-t*45)) * np.exp(-t*1.35)
    signal = np.sin(2*np.pi*frequency*t) + .18*np.sin(2*np.pi*frequency*2.001*t)*np.exp(-t*2) + .05*np.sin(2*np.pi*frequency*3*t)*np.exp(-t*4)
    return (signal * envelope * amplitude).astype(np.float32)

for n in range(int(DURATION * 1.3)):
    start = n / 1.3
    frequency = notes[n % len(notes)]
    sound = tone(frequency)
    pan = np.sin(n * 1.7) * .24
    place(start, sound, pan)
    place(start+.23, sound*.13, -pan)
    place(start+.43, sound*.075, pan)
    if n % 4 == 0:
        place(start, tone(notes[(n+2) % len(notes)]/2, 5.5, .06), 0)

# Low room tone, almost subliminal, and soft tactile keyboard sounds.
room_t = np.arange(len(audio)) / SR
room = (np.sin(2*np.pi*62*room_t)+.2*np.sin(2*np.pi*124*room_t)) * .00055
audio[:,0] += room
audio[:,1] += room
for start in np.arange(73, 108, .17):
    if rng.random() > .7:
        continue
    t = np.arange(int(.035*SR)) / SR
    sound = (rng.normal(size=len(t))*.25 + np.sin(2*np.pi*950*t)) * np.exp(-t*185) * .011
    place(start+rng.uniform(0,.045),sound,rng.uniform(-.65,.65))
for start in np.arange(18.3,28,.54):
    t=np.arange(int(.12*SR))/SR
    sound=(np.sin(2*np.pi*95*t)+rng.normal(size=len(t))*.16)*np.exp(-t*36)*.011
    place(start,sound,.25)

fade = np.minimum(np.arange(len(audio))/SR/3, 1) * np.minimum((len(audio)-1-np.arange(len(audio)))/SR/4, 1)
audio *= fade[:,None]
audio = np.clip(audio,-.94,.94)
Path('artifacts').mkdir(exist_ok=True)
with wave.open('artifacts/bright-minds-score.wav','wb') as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((audio*32767).astype('<i2').tobytes())
print('Created original 126-second stereo score: artifacts/bright-minds-score.wav')
