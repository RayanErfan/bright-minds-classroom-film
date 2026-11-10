import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { woodTexture, fabricTexture, labelTexture, makeBoard, makeScreen } from './textures.js';
import { smooth, clamp } from './story.js';
import { createCharacter } from './characters.js';

const PI=Math.PI, Y=new THREE.Vector3(0,1,0), tmp=new THREE.Vector3();
const materials=new Map(), geometries=new Map();
function mat(color,roughness=.7,metalness=0){const key=`${color}-${roughness}-${metalness}`;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness}));return materials.get(key);}
function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
function mesh(parent,g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(p,w,h,d,m,x=0,y=0,z=0,r=0){return mesh(p,geometry(`b${w},${h},${d},${r}`,()=>r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2,h/2,d/2)):new THREE.BoxGeometry(w,h,d)),m,x,y,z);}
function ball(p,rx,ry,rz,m,x=0,y=0,z=0){const o=mesh(p,geometry('sphere',()=>new THREE.SphereGeometry(1,16,12)),m,x,y,z);o.scale.set(rx,ry,rz);return o;}
function cyl(p,r1,r2,h,m,x=0,y=0,z=0,n=16){return mesh(p,geometry(`c${r1},${r2},${h},${n}`,()=>new THREE.CylinderGeometry(r1,r2,h,n)),m,x,y,z);}
function rod(p,a,b,r,m){const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b),d=v2.clone().sub(v1);const o=cyl(p,r,r,d.length(),m);o.position.copy(v1).add(v2).multiplyScalar(.5);o.quaternion.setFromUnitVectors(Y,d.normalize());return o;}
function plane(p,w,h,m,x=0,y=0,z=0){return mesh(p,geometry(`p${w},${h}`,()=>new THREE.PlaneGeometry(w,h)),m,x,y,z);}
function textPlane(p,text,w,h,x,y,z,opts={}){return plane(p,w,h,new THREE.MeshBasicMaterial({map:labelTexture(text,opts)}),x,y,z);}
function wire(p,points,color='#263c3b',r=.009){const curve=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a)));return mesh(p,new THREE.TubeGeometry(curve,16,r,5,false),mat(color));}
function emissive(color,intensity=1){return new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:intensity,roughness:.4});}

export function createWorld(){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#c6d3cd');scene.fog=new THREE.Fog('#b9c9c0',24,65);
 const room=new THREE.Group();scene.add(room);
 const wood=woodTexture();wood.wrapS=wood.wrapT=THREE.RepeatWrapping;wood.repeat.set(2,1);
 const woodMat=new THREE.MeshStandardMaterial({color:'#dfc294',map:wood,roughness:.5});
 const lightWood=new THREE.MeshStandardMaterial({color:'#d1bf9b',map:wood,roughness:.65});
 const dark=mat('#263735',.45,.25),black=mat('#1d282b',.45,.2),metal=mat('#b0bab5',.28,.75),teal=mat('#244e4e'),cream=mat('#e5e5d9');
 const cloth=fabricTexture();cloth.wrapS=cloth.wrapT=THREE.RepeatWrapping;cloth.repeat.set(8,8);
 const hemi=new THREE.HemisphereLight('#e2edf0','#97846c',2.5);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#fff1d1',4.3);sun.position.set(-12,15,-3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:45});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun);sun.target.position.set(0,0,0);scene.add(sun.target);
 const fill=new THREE.DirectionalLight('#cde4f2',1.2);fill.position.set(5,7,6);scene.add(fill);
 const boardLight=new THREE.PointLight('#9ecbd6',3,7,2);boardLight.position.set(0,2.8,-6.2);scene.add(boardLight);
 const warm=new THREE.PointLight('#fbe0ab',15,13,2);warm.position.set(2,4,-1);scene.add(warm);

 // Oak flooring is individually laid, with slight changes in grain and tone.
 box(room,14.5,.18,15.7,mat('#817f6c'),0,-.14,.25);
 const floorMaterials=Array.from({length:6},(_,i)=>new THREE.MeshStandardMaterial({color:new THREE.Color('#c5b49a').multiplyScalar(.92+i*.028),map:wood,roughness:.7}));
 for(let j=0;j<23;j++)for(let i=0;i<6;i++){const x=-6.03+i*2.42,z=-7.15+j*.67;box(room,2.405,.035,.654,floorMaterials[(i*7+j*3)%6],x,-.025,z);}
 // Front teaching wall and warm timber acoustic panels.
 box(room,14.5,4.8,.18,cream,0,2.4,-7.48);
 box(room,14.4,1.05,.08,teal,0,.53,-7.33);
 box(room,14.4,.05,.12,woodMat,0,1.07,-7.3);
 for(let i=0;i<19;i++)box(room,.055,3.47,.07,woodMat,-6.92+i*.115,2.8,-7.3);
 for(let i=0;i<14;i++)box(room,.055,3.47,.07,woodMat,5.3+i*.115,2.8,-7.3);
 box(room,14.4,.12,.11,dark,0,.06,-7.28);
 // Right wall, pinboards and open storage.
 box(room,.17,4.8,15.6,mat('#637a70'),7.22,2.4,.22);
 box(room,.05,1.1,15.5,mat('#36594f'),7.1,.55,.2);
 box(room,.09,.07,15.5,woodMat,7.08,1.11,.2);
 box(room,.08,.12,15.5,dark,7.09,.06,.2);
 // Windows are real openings: sunlight and window-frame shadows reach the desks.
 box(room,.18,.95,15.5,cream,-7.18,.475,.2);box(room,.18,.4,15.5,cream,-7.18,4.6,.2);
 const glass=new THREE.MeshPhysicalMaterial({color:'#cbe0de',transparent:true,opacity:.12,roughness:.1,metalness:.1,side:THREE.DoubleSide,depthWrite:false});
 for(let i=0;i<5;i++){
  const z=-5.8+i*2.98;
  box(room,.3,3.52,.12,mat('#657776'),-7.12,2.7,z-1.4);
  box(room,.3,.1,2.84,mat('#657776'),-7.12,1.02,z);box(room,.3,.1,2.84,mat('#657776'),-7.12,4.4,z);
  box(room,.22,.055,2.84,mat('#748582'),-7.13,2.68,z);
  const pane=plane(room,2.84,3.33,glass,-7.2,2.7,z);pane.rotation.y=PI/2;pane.castShadow=false;
  box(room,.51,.095,2.86,lightWood,-6.95,1.04,z);
  // partially raised roller blinds
  box(room,.12,.34,2.79,mat('#d6d0bc'),-7.01,4.17,z,.025);
  for(let k=0;k<4;k++)box(room,.13,.008,2.77,mat('#bbbca9'),-6.93,4.07+k*.055,z);
 }
 // Exterior greenery gives the glazing depth without image dependencies.
 box(scene,7,.12,25,mat('#8ca27e'),-11,-.1,0);
 for(let i=0;i<9;i++){const x=-9-(i%3)*1.7,z=-9+i*2.6;rod(scene,[x,0,z],[x,4.6,z],.09,mat('#80795d'));for(let k=0;k<4;k++)ball(scene,1.1+k*.05,1.5,1.12,mat(['#92ae87','#a4ba91','#819d7c'][i%3]),x+Math.sin(k*2)*.6,3.8+k*.55,z+Math.cos(k*2)*.5);}
 // Ceiling baffles, suspended strip lights, and a projector.
 for(let i=0;i<7;i++){const z=-5.8+i*2;box(room,14.35,.12,.11,cream,0,4.71,z);}
 for(const x of [-4.2,0,4.2])for(const z of [-3.7,1.9,6.2]){
  box(room,.18,.12,2.6,mat('#e7e6d7'),x,4.35,z,.025);const led=box(room,.13,.02,2.46,emissive('#fff1c8',2.2),x,4.279,z,.008);led.castShadow=false;
  rod(room,[x,4.4,z-.8],[x,4.74,z-.8],.01,metal);rod(room,[x,4.4,z+.8],[x,4.74,z+.8],.01,metal);
 }
 cyl(room,.035,.035,.4,metal,0,4.42,-1.4);box(room,.58,.2,.5,mat('#eceade'),0,4.16,-1.4,.05);let lens=cyl(room,.082,.082,.07,black,0,4.15,-1.675);lens.rotation.x=PI/2;lens=cyl(room,.059,.059,.073,emissive('#d2efff',1.2),0,4.15,-1.678);lens.rotation.x=PI/2;
 // Interactive whiteboard.
 const board=makeBoard();box(room,7.4,3.72,.15,black,-.4,2.78,-7.26,.07);box(room,7.24,3.57,.05,mat('#83938c'),-.4,2.78,-7.161,.035);
 plane(room,7.08,3.54,new THREE.MeshBasicMaterial({map:board.texture,toneMapped:false}),-.4,2.78,-7.12);
 box(room,2.4,.08,.18,metal,-.4,.93,-7.03,.025);box(room,.24,.035,.038,mat('#e5dac1'),-.65,.99,-7.04,.01);box(room,.24,.035,.038,mat('#2b5456'),-.3,.99,-7.04,.01);
 ball(room,.014,.014,.008,emissive('#8ccbb0'),3.12,1.005,-7.12);
 for(const x of [-4.65,3.9]){box(room,.36,.77,.25,dark,x,3.32,-7.08,.06);for(let i=0;i<2;i++){let s=cyl(room,.097,.097,.018,black,x,3.16+i*.29,-6.944);s.rotation.x=PI/2;}}
 // Wall clock and lab signage.
 let clock=cyl(room,.34,.34,.055,mat('#e6e0c8'),4.65,3.9,-7.2,40);clock.rotation.x=PI/2;
 let dial=cyl(room,.305,.305,.061,mat('#f2eedd'),4.65,3.9,-7.195,40);dial.rotation.x=PI/2;
 for(let i=0;i<12;i++){const a=i*PI/6;box(room,.015,.035,.014,dark,4.65+Math.sin(a)*.259,3.9+Math.cos(a)*.259,-7.153).rotation.z=-a;}
 rod(room,[4.65,3.9,-7.14],[4.51,4.01,-7.14],.014,dark);rod(room,[4.65,3.9,-7.137],[4.83,4.05,-7.137],.009,dark);ball(room,.025,.025,.008,mat('#a98859'),4.65,3.9,-7.125);
 textPlane(room,'۲۰۴',.8,.35,4.65,2.97,-7.2,{bg:'#e5e5d9',color:'#39584d',size:57});textPlane(room,'آزمایشگاه یادگیری',1.3,.23,4.65,2.66,-7.2,{bg:'#e5e5d9',color:'#567565',size:28});
 // Noticeboard on the right wall: rotate a local group to face the room.
 const notices=new THREE.Group();notices.position.set(7.09,2.7,-1.4);notices.rotation.y=-PI/2;room.add(notices);
 box(notices,3.65,1.93,.07,woodMat,0,0,0,.025);box(notices,3.5,1.78,.03,mat('#bac3a8'),0,0,.05);
 ['کنجکاو باش','ایده‌هایت را بساز','یادگیری را ادامه بده'].forEach((s,i)=>{const paper=textPlane(notices,s,.93,1.35,-1.14+i*1.14,0,.08,{bg:['#e0d4b1','#91aba0','#d1b797'][i],color:'#2e5347',w:256,h:360,size:24,sub:['بپرس چرا، پیدا کن چگونه','از ایده تا واقعیت','هر بار، یک قدم جلوتر'][i]});paper.rotation.z=(i-1)*.028;ball(notices,.02,.02,.009,mat('#946741'),-1.14+i*1.14,.59,.095);});
 // Low storage cubbies, books, routers and a spare machine.
 const storage=new THREE.Group();storage.position.set(6.75,0,4.3);storage.rotation.y=-PI/2;room.add(storage);
 box(storage,4.1,.07,.66,woodMat,0,.06,0);box(storage,4.1,.08,.66,woodMat,0,1.18,0);box(storage,4.1,1.08,.06,teal,0,.62,-.3);
 for(const x of [-2,-.67,.67,2])box(storage,.06,1.16,.65,woodMat,x,.62,0);
 box(storage,4.04,.055,.64,lightWood,0,.63,0);
 for(let i=0;i<19;i++){const x=-1.85+i*.192;const height=.25+(i%4)*.045;box(storage,.115,height,.3,mat(['#a8b7a0','#a88768','#455e61','#d4cfb1','#5e7974'][i%5]),x,.67+height/2,-.015,.007);box(storage,.12,.012,.004,mat('#d8cfb2'),x,.73,.14);}
 box(storage,1.02,.34,.45,mat('#7e9384'),-1.3,.27,.02,.035);box(storage,.17,.025,.01,dark,-1.3,.3,.26,.005);box(storage,1.02,.34,.45,mat('#a4aa94'),0,.27,.02,.035);box(storage,.17,.025,.01,dark,0,.3,.26,.005);
 box(storage,.56,.06,.4,black,.8,1.26,0,.035);rod(storage,[.6,1.3,-.1],[.53,1.63,-.1],.013,black);rod(storage,[1,1.3,-.1],[1.07,1.63,-.1],.013,black);
 function plant(x,z,scale=1){const p=new THREE.Group();p.position.set(x,0,z);p.scale.setScalar(scale);room.add(p);cyl(p,.27,.2,.47,mat('#cbbfa1'),0,.235,0,24);cyl(p,.23,.23,.035,mat('#554c3c'),0,.48,0,20);for(let i=0;i<11;i++){const a=i*2.4,ht=.75+(i%4)*.22;const px=Math.sin(a)*.35,pz=Math.cos(a)*.35;rod(p,[0,.48,0],[px,ht,pz],.012,mat('#688166'));const leaf=ball(p,.105,.34,.027,mat(i%2?'#4c7660':'#688866'),px,ht,pz);leaf.rotation.z=Math.sin(a)*.6;leaf.rotation.x=Math.cos(a)*.6;}return p;}
 plant(-6.4,-6.2,1.3);plant(6.3,-6.45,1.1);plant(-6.55,6.45,1.3);plant(6.65,6.8,.8);
 // Entry door on the back wall, deliberately away from the camera path.
 box(room,14.5,4.8,.18,cream,0,2.4,8.02);box(room,14.4,1.05,.05,teal,0,.525,7.9);
 const door=new THREE.Group();door.position.set(5.04,0,7.82);room.add(door);
 box(door,1.46,2.95,.1,dark,0,1.48,0,.02);box(door,1.3,2.82,.07,woodMat,0,1.45,-.066,.015);box(door,.67,1.43,.08,mat('#516e68'),0,1.91,-.11,.025);
 const dh=box(door,.04,.27,.055,metal,-.44,1.12,-.16,.018);textPlane(door,'۲۰۴',.35,.12,0,2.78,-.15,{bg:'#b99c77',color:'#20382e',size:42}).rotation.y=PI;
 const exit=new THREE.Group();exit.position.set(5.04,3.32,7.84);exit.rotation.y=PI;room.add(exit);textPlane(exit,'خروج  ←',.72,.24,0,0,0,{bg:'#3b735b',color:'#ecf4d9',size:42});

 const screens=[],keyboards=[],mice=[],students=[];
 function keyboard(parent,x,y,z,scale=1){const group=new THREE.Group();group.position.set(x,y,z);group.scale.setScalar(scale);parent.add(group);box(group,.63,.035,.225,mat('#d7d8ca'),0,0,0,.016);const kg=geometry('key',()=>new RoundedBoxGeometry(.033,.016,.031,1,.004));const km=mat('#eff0e4',.52);const inst=new THREE.InstancedMesh(kg,km,62);inst.castShadow=true;inst.receiveShadow=true;let j=0;const matrix=new THREE.Matrix4();for(let row=0;row<4;row++)for(let col=0;col<14;col++){matrix.makeTranslation(-.279+col*.041,.024,-.077+row*.044);inst.setMatrixAt(j++,matrix);}for(let col=0;col<6;col++){matrix.makeTranslation(-.26+col*.088,.024,.099);inst.setMatrixAt(j++,matrix);}group.add(inst);box(group,.23,.017,.03,km,-.02,.026,.099,.003);keyboards.push({group,inst});return group;}
 function monitor(parent,index,x=0,z=0){const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);box(g,.5,.025,.29,metal,0,1.079,.03,.018);box(g,.06,.24,.058,metal,0,1.2,-.046,.012);box(g,1.21,.739,.082,black,0,1.69,-.045,.035);box(g,1.16,.663,.014,mat('#475955'),0,1.71,.003,.008);const screen=makeScreen(index);screens.push(screen);plane(g,1.126,.637,new THREE.MeshBasicMaterial({map:screen.texture,toneMapped:false}),0,1.711,.014);ball(g,.008,.008,.008,mat('#111817'),0,2.038,.002);ball(g,.005,.005,.005,emissive('#b4d8ab'),.539,1.342,.003);textPlane(g,'روشن',.15,.031,0,1.343,.003,{bg:'#1d282b',color:'#a8b9a9',size:22});wire(g,[[0,1.51,-.1],[0,1.15,-.14],[.25,1.07,-.26],[.78,.92,-.25]],'#293c38',.012);return g;}
 function tower(p,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);box(g,.275,.59,.47,black,0,0,0,.028);box(g,.235,.536,.007,mat('#394849'),0,0,.241,.01);for(let j=0;j<13;j++)box(g,.15,.007,.006,mat('#182529'),0,-.19+j*.019,.248);ball(g,.012,.012,.006,emissive('#b2d1b6'),.074,.211,.251);for(let j=0;j<2;j++)box(g,.033,.012,.006,mat('#0b151b'),-.046+j*.052,.211,.251);box(g,.012,.105,.27,mat('#3a5552',.5,.3),.145,.045,-.005,.012);return g;}
 function desk(x,z,index){
  const g=new THREE.Group();g.position.set(x,0,z);room.add(g);
  box(g,2.57,.088,1.13,woodMat,0,1.015,0,.035);box(g,2.55,.019,1.105,lightWood,0,1.065,0,.006);
  for(const xx of [-1.08,1.08]){box(g,.065,.955,.065,dark,xx,.498,-.39,.012);box(g,.065,.955,.065,dark,xx,.498,.4,.012);box(g,.065,.075,.86,dark,xx,.18,0,.018);box(g,.095,.026,.13,black,xx,.028,-.39,.008);box(g,.095,.026,.13,black,xx,.028,.4,.008);}
  box(g,2.21,.065,.045,dark,0,.86,-.38);box(g,1.85,.28,.04,mat('#849184'),0,.81,-.48,.008);
  monitor(g,index,-.12,-.15);keyboard(g,-.15,1.095,.349);
  box(g,.295,.009,.25,mat('#566b66',.95),.53,1.081,.33,.025);const mouse=ball(g,.047,.024,.071,mat('#d7ddcf',.4),.53,1.106,.32);box(mouse,.018,.006,.12,mat('#547166'),0,.92,-.01,.003);mice.push({mesh:mouse,base:mouse.position.clone()});
  tower(g,.999,1.368,-.14);wire(g,[[.53,1.08,.27],[.65,1.079,.03],[.79,1.074,-.31],[.94,1.09,-.33]],'#4e5e51',.004);
  box(g,.24,.026,.34,mat(['#778f7d','#b4b396','#709493'][index%3]),-.94,1.097,.26,.008);box(g,.23,.017,.325,mat('#ece7d5'),-.938,1.107,.26,.003);rod(g,[-.91,1.124,.17],[-.82,1.124,.32],.007,mat('#b99a62'));
  // Seat, back, caster base, armrests.
  const chair=new THREE.Group();chair.position.set(0,0,.91);g.add(chair);
  cyl(chair,.04,.05,.35,metal,0,.34,0);cyl(chair,.078,.078,.055,black,0,.18,0);
  for(let k=0;k<5;k++){const a=k*PI*2/5;rod(chair,[0,.16,0],[Math.sin(a)*.32,.11,Math.cos(a)*.32],.025,dark);const wheel=cyl(chair,.044,.044,.045,black,Math.sin(a)*.32,.07,Math.cos(a)*.32,12);wheel.rotation.z=PI/2;}
  const seat=mat(['#607f73','#577b76','#83917a'][index%3],.9);box(chair,.56,.11,.55,seat,0,.59,0,.07);box(chair,.075,.47,.055,dark,0,.84,.245,.015);const back=box(chair,.54,.58,.095,seat,0,1.015,.27,.06);back.rotation.x=-.08;
  for(const xx of [-.3,.3]){rod(chair,[xx,.6,.1],[xx,.89,.1],.022,dark);box(chair,.065,.045,.33,black,xx,.89,-.005,.02);}
  textPlane(g,String(index+1).padStart(2,'0').replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]),.09,.044,-1.12,1.01,.568,{bg:'#b89870',color:'#3b5548',size:36});
  return g;
 }
 const positions=[];for(let row=0;row<3;row++)for(let col=0;col<4;col++){const x=[-4.78,-1.87,1.87,4.78][col],z=-2.55+row*3.07;desk(x,z,row*4+col);positions.push([x,z+.91]);}
 // Instructor station with an open, detailed laptop.
 const teaching=new THREE.Group();teaching.position.set(-1.38,0,-5.2);room.add(teaching);
 box(teaching,3.05,.095,1.22,woodMat,0,1.015,0,.035);box(teaching,2.95,.65,.08,teal,0,.66,.5,.015);
 for(const x of [-1.28,1.28])for(const z of [-.46,.46])box(teaching,.065,.96,.065,dark,x,.49,z,.008);
 box(teaching,1.9,.02,.75,mat('#486c62',.95),0,1.073,0,.03);
 const laptop=new THREE.Group();laptop.position.set(-.2,1.09,-.05);laptop.rotation.y=PI;teaching.add(laptop);
 box(laptop,.79,.032,.53,metal,0,0,0,.02);box(laptop,.34,.004,.105,mat('#a5b1aa',.4,.6),0,.02,.164,.012);
 const lk=keyboard(laptop,0,.009,-.045,1.03);lk.scale.z=.78;
 const lid=new THREE.Group();lid.position.set(0,.018,-.246);lid.rotation.x=-.19;laptop.add(lid);box(lid,.79,.515,.026,metal,0,.25,0,.02);box(lid,.756,.471,.009,black,0,.253,.017,.007);const ls=makeScreen(12);screens.push(ls);plane(lid,.727,.43,new THREE.MeshBasicMaterial({map:ls.texture,toneMapped:false}),0,.262,.024);ball(lid,.004,.004,.002,black,0,.488,.025);
 cyl(teaching,.063,.047,.18,mat('#e2dfc5'),.78,1.18,.07,24);const handle=mesh(teaching,new THREE.TorusGeometry(.038,.012,8,20),mat('#e2dfc5'),.85,1.185,.07);handle.rotation.y=PI/2;cyl(teaching,.053,.053,.003,mat('#6d5540'),.78,1.273,.07,24);
 box(teaching,.35,.045,.47,mat('#c1b597'),-1,1.096,.05,.005);rod(teaching,[-.91,1.131,-.05],[-.97,1.131,.2],.009,dark);

 // A physical motherboard display, to complement the projected lesson.
 const hardware=new THREE.Group();hardware.position.set(3.65,1.45,-5.7);room.add(hardware);
 cyl(room,.45,.52,.06,dark,3.65,.055,-5.7,32);cyl(room,.035,.06,1.0,metal,3.65,.58,-5.7);box(room,1.75,.075,.84,woodMat,3.65,1.105,-5.7,.04);
 box(hardware,1.4,1.05,.045,mat('#246451',.5,.3),0,.2,0,.018);
 for(let i=0;i<20;i++){const x=-.63+i*.065;wire(hardware,[[x,-.29,.03],[x,-.13,.03],[x*.6,-.01,.03],[x*.6,.4,.03]],'#a09d62',.002);}
 box(hardware,.36,.34,.065,mat('#647d75',.38,.65),-.13,.35,.053,.01);box(hardware,.245,.235,.045,metal,-.13,.35,.104,.015);textPlane(hardware,'پردازنده',.16,.07,-.13,.35,.131,{bg:'#b0bab5',color:'#3c5551',size:42});
 for(let k=0;k<3;k++){box(hardware,.06,.75,.05,mat('#b0a889'),.3+k*.105,.21,.055,.004);box(hardware,.025,.64,.16,mat('#325f4b'),.3+k*.105,.21,.142,.003);for(let m=0;m<6;m++)box(hardware,.03,.064,.07,black,.3+k*.105,-.045+m*.1,.17,.003);}
 for(let i=0;i<2;i++){box(hardware,.55,.055,.036,mat('#aaa791'),-.27,-.07-i*.115,.055,.004);box(hardware,.49,.02,.008,dark,-.27,-.07-i*.115,.079);}
 for(let i=0;i<9;i++){let cap=cyl(hardware,.03,.03,.079,metal,-.56+(i%3)*.09,.4+Math.floor(i/3)*.09,.066,10);cap.rotation.x=PI/2;}
 for(let i=0;i<4;i++)box(hardware,.08,.12,.14,metal,-.65,-.21+i*.21,.06,.01);
 for(const x of [-.65,.65])for(const y of [-.25,.65]){let screw=cyl(hardware,.014,.014,.008,metal,x,y,.028,8);screw.rotation.x=PI/2;}
 textPlane(room,'سخت‌افزار / دنیای درون رایانه',1.4,.12,3.65,1.18,-5.26,{bg:'#b89870',color:'#244f42',size:27});

 function character(index,standing=false){return createCharacter(index,standing,{room,cloth,dark,metal,mat,mesh,box,ball,rod,geometry});}
 positions.forEach(([x,z],i)=>{const person=character(i);person.root.position.set(x,0,z);students.push(person);});
 const teacher=character(4,true);teacher.root.position.set(1.1,0,-5.3);teacher.root.rotation.y=PI;
 // A fine, sparse dust field catches the afternoon light.
 const dustGeometry=new THREE.BufferGeometry();const dustPositions=[];for(let i=0;i<140;i++)dustPositions.push(Math.sin(i*39.43)*6.7,1+((Math.sin(i*71.78)+1)/2)*3.5,Math.cos(i*15.27)*7);
 dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({size:.011,color:'#fff1c5',transparent:true,opacity:.32,depthWrite:false}));room.add(dust);

 function teacherPose(t){
  const lerp=(a,b,f)=>a.map((v,i)=>THREE.MathUtils.lerp(v,b[i],smooth(f)));
  let p=[1.2,0,-5.8],rotation=PI,walk=0,teach=0,type=0;
  if(t<18){teacher.root.visible=false;}
  else{teacher.root.visible=true;
   if(t<28){const u=(t-18)/10;p=u<.33?lerp([5,0,7.05],[0,0,5.8],u/.33):lerp([0,0,5.8],[.1,0,-4.3],(u-.33)/.67);walk=1;rotation=u<.33?PI/2:0;}
   else if(t<32){
    const u=(t-28)/4;
    if(u<.45){p=lerp([.1,0,-4.3],[.62,0,-5.98],u/.45);rotation=0;}
    else{p=lerp([.62,0,-5.98],[-1.58,0,-5.89],(u-.45)/.55);rotation=PI/2+smooth((u-.75)/.25)*PI/2;}
    walk=.5*(1-smooth((u-.86)/.14));
   }
   else if(t<36){p=[-1.58,0,-5.89];rotation=PI;type=1;}
   else if(t<39){p=lerp([-1.58,0,-5.89],[1.02,0,-5.95],(t-36)/3);walk=.6;rotation=-PI/2;}
   else if(t<72){p=[1.02,0,-5.95];teach=.7+Math.sin(t*.7)*.25;rotation=t>61?PI-.3:PI+.13;}
   else if(t<79){p=lerp([1.02,0,-5.95],[.03,0,-1.15],(t-72)/7);walk=.85;rotation=PI;}
   else if(t<89){p=[.02,0,-1.15];rotation=PI/2;teach=.5;}
   else if(t<92){p=lerp([.02,0,-1.15],[-1.58,0,-5.89],(t-89)/3);rotation=-.36;walk=.7;}
   else if(t<99){p=[-1.58,0,-5.89];rotation=PI;type=1;}
   else if(t<110){p=lerp([-1.58,0,-5.89],[1.02,0,-5.95],(t-99)/4);rotation=t<103?-PI/2:PI;walk=t<103?.5:0;teach=t>=103?.5:0;}
   else{p=[1.02,0,-5.95];rotation=PI;teach=.6+Math.sin(t)*.2;}
  }
  teacher.root.position.set(...p);teacher.root.rotation.y=rotation;teacher.update(t,{walk,teach,type});
 }
 const characterBatches=[];
 function update(t){
  board.update(t);screens.forEach(s=>s.update(t));teacherPose(t);hardware.rotation.y=Math.sin((t-36)*.24)*.1;dust.rotation.y=Math.sin(t*.02)*.008;
  students.forEach((p,i)=>{
   const practice=t>=72&&t<108;const raise=i===5?smooth((t-54.5)/1.5)*(1-smooth((t-61)/1.7)):0;
   p.update(t,{raise,type:practice&&i%3!==1?1:t<18?.2:0,mouse:practice&&i%3===1?1:0,nod:t>108?1:0});
   if(t>=18&&t<28){p.head.rotation.y=clamp((teacher.root.position.x-p.root.position.x)*.08,-.45,.45);}
   if(t>=54&&t<63&&i!==5)p.head.rotation.y=clamp((students[5].root.position.x-p.root.position.x)*.06,-.28,.28);
   const mouse=mice[i];mouse.mesh.position.copy(mouse.base);if(practice&&i%3===1)mouse.mesh.position.z+=Math.sin(t*1.8+i)*.035;
  });
  if(characterBatches.length){
   for(const person of [...students,teacher])person.root.updateMatrixWorld(true);
   for(const batch of characterBatches){batch.sources.forEach(({source,owner},i)=>{batch.mesh.setMatrixAt(i,owner.root.visible?source.matrixWorld:new THREE.Matrix4().makeScale(0,0,0));});batch.mesh.instanceMatrix.needsUpdate=true;}
  }
 }
 // Batch static surfaces by material. Articulated characters, mice, and the
 // demonstration model keep their own transforms; the room takes few draw calls.
 const animated=new Set([teacher.root,hardware,...students.map(p=>p.root),...mice.map(m=>m.mesh)]);
 const batches=new Map(),removals=[];
 function collect(node,dynamic=false){
  dynamic=dynamic||animated.has(node);
  if(node.isMesh&&!node.isInstancedMesh&&!dynamic&&!Array.isArray(node.material)){
   const key=node.material.uuid;
   if(!batches.has(key))batches.set(key,{material:node.material,geometry:[]});
   let geo=node.geometry.clone();if(geo.index)geo=geo.toNonIndexed();geo.applyMatrix4(node.matrixWorld);
   batches.get(key).geometry.push(geo);removals.push(node);
  }
  node.children.forEach(child=>collect(child,dynamic));
 }
 scene.updateMatrixWorld(true);collect(scene);
 for(const data of batches.values()){
  const joined=mergeGeometries(data.geometry,false);if(!joined)continue;
  const batch=new THREE.Mesh(joined,data.material);batch.castShadow=!data.material.isMeshBasicMaterial;batch.receiveShadow=true;scene.add(batch);
  data.geometry.forEach(g=>g.dispose());
 }
 removals.forEach(o=>o.removeFromParent());
 // Instanced facial details and limbs retain the complete character hierarchy.
 // Only their visible draws are combined; poses stay independently articulated.
 const animatedGroups=new Map();
 for(const person of [...students,teacher])person.root.traverse(source=>{
  if(!source.isMesh)return;const key=source.geometry.uuid+source.material.uuid;
  if(!animatedGroups.has(key))animatedGroups.set(key,[]);animatedGroups.get(key).push({source,owner:person});
 });
 for(const sources of animatedGroups.values()){
  if(sources.length<2)continue;const original=sources[0].source;
  const instanced=new THREE.InstancedMesh(original.geometry,original.material,sources.length);instanced.castShadow=true;instanced.receiveShadow=true;instanced.frustumCulled=false;instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(instanced);
  sources.forEach(({source})=>{source.visible=false;});characterBatches.push({mesh:instanced,sources});
 }
 update(0);
 return {scene,room,teacher,students,board,screens,hardware,update,sun,stats:{students:12,workstations:12,chapters:7},positions};
}
