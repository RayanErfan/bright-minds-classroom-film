import * as THREE from 'three';
import { smooth, clamp } from './story.js';

// Every camera move is deterministic, so seeking and offline exports match playback.
const shots=[
 {a:0,b:18,p:[6.45,4.35,7.45],q:[5.35,3.85,6.55],at:[-.8,1.38,-1.72],bt:[-.9,1.48,-2.9],fov:61},
 {a:18,b:28,p:[-3.7,2.8,5.55],q:[-3.6,2.55,1.3],at:[3.7,1.38,5.7],bt:[.1,1.6,-4.3],fov:54},
 {a:28,b:36,p:[-4.3,2.52,-2.9],q:[-3.3,2.13,-3.23],at:[-1.3,1.88,-5.84],bt:[-1.28,1.86,-5.96],fov:52},
 {a:36,b:44,p:[-3.7,2.7,-2.2],q:[-2.7,2.62,-2.65],at:[.3,2.4,-6.65],bt:[.4,2.5,-6.65],fov:54},
 {a:44,b:50,p:[4.9,2.26,-3.6],q:[4.6,2.08,-3.86],at:[3.61,1.84,-5.69],bt:[3.61,1.81,-5.69],fov:44},
 {a:50,b:54,p:[-.5,2.8,-3.7],q:[-.25,2.8,-3.95],at:[-.4,2.7,-7.12],bt:[-.4,2.7,-7.12],fov:61},
 {a:54,b:62,p:[-4.8,2.42,-.55],q:[-4.26,2.32,-.18],at:[-1.8,1.65,1.3],bt:[-1.82,1.8,1.35],fov:47},
 {a:62,b:72,p:[3.2,2.55,-2.72],q:[2.1,2.51,-3.14],at:[.02,2.3,-6.75],bt:[-.4,2.55,-7.1],fov:60},
 {a:72,b:79,p:[5.7,3.35,5.85],q:[3.45,3.05,4.9],at:[.05,1.45,-1.15],bt:[-.65,1.38,-1.1],fov:57},
 {a:79,b:90,p:[.25,2.5,1.66],q:[.23,2.3,.98],at:[-1.36,1.35,-1.67],bt:[-1.47,1.37,-1.99],fov:51},
 {a:90,b:96,p:[-2.66,1.96,-5.91],q:[-2.36,1.82,-5.83],at:[-1.59,1.33,-5.15],bt:[-1.58,1.31,-5.16],fov:41},
 {a:96,b:101,p:[-3.67,1.78,-1.67],q:[-3.6,1.65,-1.8],at:[-4.71,1.1,-2.16],bt:[-4.73,1.13,-2.15],fov:41},
 {a:101,b:104,p:[-1.02,1.62,1.83],q:[-.99,1.52,1.63],at:[-1.34,1.12,.86],bt:[-1.34,1.12,.86],fov:36},
 {a:104,b:108,p:[-3.6,2.4,-4.45],q:[-3.25,2.48,-4.62],at:[-.35,2.5,-7.14],bt:[-.35,2.5,-7.14],fov:58},
 {a:108,b:114,p:[2.75,2.36,-3.28],q:[3.3,2.6,-2.4],at:[.35,2.27,-6.75],bt:[.1,2.25,-6.35],fov:54},
 {a:114,b:126,p:[3.6,3.2,4.5],q:[6.4,4.4,7.45],at:[-.55,1.6,-3.45],bt:[-.72,1.5,-1.8],fov:61},
];
export function setCamera(camera,t,aspect=16/9){
 const shot=shots.find(s=>t<s.b)||shots.at(-1),u=smooth((t-shot.a)/(shot.b-shot.a));
 camera.position.fromArray(shot.p).lerp(new THREE.Vector3(...shot.q),u);
 const aim=new THREE.Vector3(...shot.at).lerp(new THREE.Vector3(...shot.bt),u);
 // Slow dolly easing; no random camera noise or discontinuous hand-held shake.
 camera.lookAt(aim);camera.fov=shot.fov+(aspect<1.6?8:0);camera.aspect=aspect;camera.updateProjectionMatrix();
 return {shot,aim,transition:1};
}
export const shotCount=shots.length;
