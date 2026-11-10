import * as THREE from 'three';
import { smooth, clamp } from './story.js';
import { VOICE_CUES } from './voice-timing.js';

const UP=new THREE.Vector3(0,1,0),PI=Math.PI;
const SKINS=['#b78060','#d5a382','#895b43','#ddb595','#b18361','#c39173'];
const CLOTHES=['#72918a','#bb8e75','#d6c8ab','#587385','#829780','#b19682','#648e8c','#b7ab8d','#8494a6','#b8beab','#a98981','#778b7b'];
const HAIR=['#302b27','#4b372b','#242727','#6a4d37','#39302b'];

export function speechAt(t,standing,index){
 const cue=VOICE_CUES.find(c=>c.speaker===(standing?'teacher':'student')&&(standing||c.character===index)&&t>=c.start&&t<c.audioEnd);
 if(!cue)return 0;const f=(t-cue.start)*25,lo=Math.floor(f),u=f-lo;
 return THREE.MathUtils.lerp(cue.envelope[lo]||0,cue.envelope[lo+1]||0,u);
}

function headGeometry(){
 const g=new THREE.SphereGeometry(1,40,32),p=g.attributes.position;
 const bump=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
 for(let i=0;i<p.count;i++){
  const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i);
  const jaw=ny<-.18?1-.20*smooth((-ny-.18)/.8):1;
  const x=nx*.148*jaw,y=ny*.199;let z=nz*.144;
  if(nz<0){
   // A continuous face: bridge, nose, cheekbones, eye sockets, lips and chin.
   z-=.031*bump(x,y,0,-.013,.019,.032);
   z-=.013*bump(x,y,0,.035,.019,.060);
   z-=.008*bump(x,y,0,-.079,.046,.030);
   z-=.004*(bump(x,y,.075,-.025,.040,.034)+bump(x,y,-.075,-.025,.040,.034));
   z+=.005*(bump(x,y,.057,.030,.038,.022)+bump(x,y,-.057,.030,.038,.022));
  }
  p.setXYZ(i,x,y,z);
 }
 g.computeVertexNormals();return g;
}
function torsoGeometry(width,depth){
 const rings=[[-.52,.80],[-.49,.94],[-.35,.88],[-.15,1],[ -.055,1.05],[0,.80],[.025,.37]];
 const positions=[],indices=[],segments=24;
 rings.forEach(([y,scale])=>{for(let i=0;i<=segments;i++){const a=i/segments*PI*2;positions.push(Math.cos(a)*width*scale,y,Math.sin(a)*depth*(scale*.5+.5));}});
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
 const uv=new Float32Array(positions.length/3*2);for(let i=0;i<uv.length/2;i++){uv[i*2]=(i%25)/24;uv[i*2+1]=Math.floor(i/25)/6;}g.setAttribute('uv',new THREE.BufferAttribute(uv,2));return g;
}

export function createCharacter(index,standing,env){
 const {room,cloth,dark,metal,mat,mesh,box,ball,rod,geometry}=env;
 const root=new THREE.Group(),figure=new THREE.Group();root.add(figure);room.add(root);
 const female=!standing&&[1,3,5,8,10].includes(index),skin=mat(SKINS[index%SKINS.length],.59),skinShade=mat(new THREE.Color(SKINS[index%SKINS.length]).multiplyScalar(.84).getHex(),.68);
 const shirt=new THREE.MeshStandardMaterial({color:standing?'#344f61':CLOTHES[index%12],roughness:.88,bumpMap:cloth,bumpScale:.004});
 const pants=mat(standing?'#333e43':['#4b5c63','#5c625c','#646461','#78796d'][index%4],.91),hair=mat(HAIR[index%5],.82);
 const hipY=standing?.94:.75,shoulderY=standing?1.48:1.33,headY=standing?1.745:1.595;
 const torso=new THREE.Group();torso.position.y=shoulderY;figure.add(torso);
 mesh(torso,torsoGeometry(female?.205:.218,.145),shirt);
 // Neck joins the sculpted jaw and shoulder opening, without a floating head.
 mesh(figure,new THREE.CylinderGeometry(.053,.067,.15,20),skin,0,shoulderY+.050,.011);
 box(figure,.35,.12,.275,pants,0,hipY,0,.045);
 const collarMaterial=standing?mat('#e3e2d5'):shirt;
 const collar=mesh(torso,new THREE.TorusGeometry(.073,.012,8,24),collarMaterial,0,.014,0);collar.rotation.x=PI/2;collar.scale.y=.91;
 if(standing){
  box(torso,.132,.405,.023,mat('#dfdfd2'),0,-.203,-.146,.006);
  for(const side of [-1,1]){
   const shape=new THREE.Shape();shape.moveTo(side*.060,.006);shape.lineTo(side*.149,-.08);shape.lineTo(side*.110,-.20);shape.lineTo(side*.049,-.30);shape.lineTo(side*.055,-.11);shape.closePath();
   mesh(torso,new THREE.ShapeGeometry(shape),shirt,0,0,-.166).rotation.y=PI;
  }
  box(torso,.033,.26,.016,mat('#677d82'),0,-.20,-.166,.006);
  for(let i=0;i<3;i++)ball(torso,.005,.005,.003,mat('#a8b6b1'),.071,-.21-i*.09,-.164);
  box(torso,.073,.014,.006,mat('#253e4f'),-.128,-.19,-.151,.003);
  box(torso,.044,.029,.006,mat('#d3d5c9'),-.128,-.172,-.153,.003);
 }else{
  // Quiet clothing details: seams, a hem, a collar, and a small chest pocket.
  const seam=mat(new THREE.Color(CLOTHES[index%12]).multiplyScalar(.82).getHex(),.9);
  const hem=mesh(torso,new THREE.TorusGeometry(.177,.005,5,28),seam,0,-.49,0);hem.rotation.x=PI/2;hem.scale.y=.76;
  if(index%3===1){for(let i=0;i<4;i++)ball(torso,.004,.004,.003,mat('#d8d4c0'),0,-.08-i*.083,-.150);rod(torso,[0,-.02,-.151],[0,-.38,-.151],.0025,seam);}
  box(torso,.069,.074,.006,shirt,-.111,-.19,-.146,.01);
 }
 const head=new THREE.Group();head.position.set(0,headY,0);figure.add(head);
 const headShape=mesh(head,geometry('sculpted-face-v2',headGeometry),skin);
 head.scale.set(1+(index%3-1)*.025,1+(index%4-1.5)*.019,1);
 // Small ears sit against the skull; inner ear tint adds depth.
 for(const side of [-1,1]){ball(head,.022,.036,.020,skin,side*.145,-.005,.005);ball(head,.010,.020,.006,skinShade,side*.157,-.006,-.010);}
 const eyes=[];
 for(const side of [-1,1]){
  const eye=new THREE.Group();eye.position.set(side*.056,.027,-.133);head.add(eye);
  ball(eye,.026,.011,.008,mat('#dfdfd1',.48),0,0,0);
  ball(eye,.0085,.009,.0028,mat(index%3===0?'#66684a':'#513e2b',.36),0,0,-.008);
  ball(eye,.0044,.005,.002,mat('#172321',.34),0,0,-.0101);
  ball(eye,.0018,.002,.001,mat('#fffaf0',.3),-.0025,.003,-.0118);
  const lash=rod(head,[side*.056-.024,.034,-.133],[side*.056+.022,.034,-.134],.0018,hair);
  const brow=ball(head,.029,.0042,.003,hair,side*.056,.061,-.132);brow.rotation.z=side*-.10;
  eyes.push(eye);
 }
 // Mouth aperture, lips, and teeth are driven by the recorded speech envelope.
 const lips=mat(female?'#a46d61':'#9a6b57',.64);
 const mouth=ball(head,.028,.003,.004,mat('#482f29'),0,-.080,-.140);
 const upperLip=ball(head,.030,.0032,.004,lips,0,-.076,-.141);
 const lowerLip=ball(head,.027,.0036,.004,lips,0,-.086,-.141);
 const teeth=box(head,.031,.005,.002,mat('#dedbce'),0,-.079,-.144,.002);
 for(const side of [-1,1])ball(head,.0035,.0018,.002,skinShade,side*.012,-.033,-.175);
 // Hair follows the skull, with a shaped hairline and varied silhouettes.
 const capGeo=new THREE.SphereGeometry(1,32,18,0,PI*2,0,PI*.59),cp=capGeo.attributes.position;
 for(let i=0;i<cp.count;i++){
  let x=cp.getX(i)*.155,y=cp.getY(i)*.199+.012,z=cp.getZ(i)*.151+.009;
  if(z<0){
   if(y<.092)y=.087+Math.abs(x)*.17+Math.sin(x*18+index)*.009;
   z=Math.min(z,-Math.sqrt(Math.max(.001,1-(x/.158)**2-((y-.012)/.209)**2))*.157-.007);
  }
  cp.setXYZ(i,x,y,z);
 }capGeo.computeVertexNormals();mesh(head,capGeo,hair);
 if(female){
  const bob=index%3===0;
  for(const side of [-1,1]){const lock=ball(head,.033,bob?.144:.102,.069,hair,side*.130,bob?-.038:.012,.057);lock.rotation.z=side*-.075;}
  if(!bob){ball(head,.083,.111,.073,hair,.018,.010,.174);const tail=ball(head,.055,.14,.050,hair,.035,-.095,.207);tail.rotation.x=-.23;}
  const fringe=ball(head,.098,.035,.027,hair,-.036,.125,-.105);fringe.rotation.z=.26;
 }else{
  for(let i=0;i<4;i++){const lock=ball(head,.073,.031,.060,hair,-.080+i*.044,.170+Math.sin(i)*.007,-.065);lock.rotation.z=-.16;}
  if(standing)for(const side of [-1,1])ball(head,.007,.032,.037,mat('#807a6d'),side*.142,.038,.001);
 }
 if(standing||index===6){
  for(const side of [-1,1]){const frame=mesh(head,new THREE.TorusGeometry(.034,.0026,6,24),dark,side*.056,.027,-.149);frame.scale.y=.75;rod(head,[side*.09,.032,-.147],[side*.146,.022,.008],.0024,dark);}
  rod(head,[-.022,.031,-.149],[.022,.031,-.149],.002,dark);
 }
 function segment(radius,material){
  const profile=[new THREE.Vector2(radius*.68,-.5),new THREE.Vector2(radius*.91,-.43),new THREE.Vector2(radius,-.14),new THREE.Vector2(radius*.96,.17),new THREE.Vector2(radius*.80,.44),new THREE.Vector2(radius*.70,.5)];
  const a=mesh(figure,geometry(`anatomical-limb-${radius}`,()=>new THREE.LatheGeometry(profile,16)),material);
  const joint=ball(figure,radius*.73,radius*.73,radius*.73,material);return {a,joint};
 }
 const vector=new THREE.Vector3();
 function poseSegment(seg,a,b){vector.set(...b).sub(new THREE.Vector3(...a));seg.a.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);seg.a.scale.y=vector.length();seg.a.quaternion.setFromUnitVectors(UP,vector.normalize());seg.joint.position.set(...b);}
 const arms=[-1,1].map(side=>{
  const upper=segment(.071,shirt),lower=segment(.044,skin),hand=new THREE.Group();figure.add(hand);
  ball(figure,.064,.058,.063,shirt,side*.203,shoulderY-.071,0);
  ball(hand,.044,.019,.055,skin,0,0,-.018);
  const fingers=[];
  for(let n=0;n<4;n++){
   const pivot=new THREE.Group();pivot.position.set((n-1.5)*.019,0,-.056);hand.add(pivot);
   const len=[.050,.061,.058,.043][n],tip=new THREE.Group();tip.position.set(0,-.001,-len*.56);pivot.add(tip);
   rod(pivot,[0,0,0],[0,-.001,-len*.56],.0078,skin);ball(pivot,.008,.007,.008,skin,0,-.001,-len*.56);
   rod(tip,[0,0,0],[0,-.002,-len*.44],.007,skin);ball(tip,.007,.006,.007,skin,0,-.002,-len*.44);
   box(tip,.009,.0015,.013,mat('#cfaa91',.52),0,.005,-len*.28,.003);
   pivot.userData.tip=tip;fingers.push(pivot);
  }
  const thumb=new THREE.Group();thumb.position.set(side*.039,-.004,-.006);thumb.rotation.y=-side*.48;hand.add(thumb);
  rod(thumb,[0,0,0],[side*.018,-.004,-.019],.010,skin);rod(thumb,[side*.018,-.004,-.019],[side*.019,-.006,-.038],.008,skin);
  return {side,upper,lower,hand,fingers};
 });
 const legs=[-1,1].map(side=>{
  const foot=new THREE.Group();figure.add(foot);const leather=mat(standing?'#323c3f':index%3?'#deddd0':'#4a5b5e',.65);
  box(foot,.137,.068,.268,leather,0,.030,-.02,.034);box(foot,.142,.023,.278,mat(standing?'#242c2e':'#efeddf'),0,-.008,-.02,.013);
  if(!standing)for(let i=0;i<3;i++)rod(foot,[-.037,.067,-.04-i*.02],[.037,.067,-.04-i*.02],.0027,mat('#eeeeDF'));
  return {side,thigh:segment(.095,pants),calf:segment(.075,pants),foot};
 });
 // A slim watch remains useful in the close-up without becoming an oversized ring.
 const watch=mesh(arms[0].hand,new THREE.TorusGeometry(.030,.005,6,16),dark,0,0,.025);watch.scale.y=.65;
 box(arms[0].hand,.028,.008,.025,metal,0,.023,.024,.004);
 const pose={mouth:0,blink:1};
 function update(t,{walk=0,teach=0,raise=0,type=0,mouse=0,nod=0}={}){
  const phase=t*1.35+index*.91,voice=speechAt(t,standing,index);
  pose.mouth=voice;figure.position.y=standing?Math.sin(t*12)*walk*.011:Math.sin(phase)*.003;
  torso.rotation.z=Math.sin(phase*.5)*.007;
  head.rotation.set(Math.sin(phase*.7)*.016+type*.065+nod*Math.sin(t*1.6)*.032,Math.sin(phase*.46)*.044,Math.sin(phase*.34)*.009);
  if(voice>0)head.rotation.x+=Math.sin(t*3.2)*voice*.014;
  const cycle=(t+index*.57)%(3.7+index*.13);const blink=cycle<.16?.08+.92*Math.abs(cycle-.08)/.08:1;
  pose.blink=blink;eyes.forEach(e=>{e.scale.y=blink;});
  mouth.scale.y=.003*(1+voice*5.4);mouth.position.y=-.081-voice*.006;
  lowerLip.position.y=-.086-voice*.019;lowerLip.scale.y=.0036*(1+voice*.32);
  upperLip.scale.x=.030*(1-voice*.08);teeth.scale.y=.01+voice*.8;
  for(const leg of legs){
   const s=leg.side,hip=[s*.115,hipY,0];let knee,ankle;
   if(standing){const stride=Math.sin(t*5.2+s*PI/2)*walk;knee=[s*.127,.52,-.012+stride*.115];ankle=[s*.135,.086,stride*.285];}
   else{knee=[s*.145,.605,-.34];ankle=[s*.153,.086,-.31+s*.024];}
   poseSegment(leg.thigh,hip,knee);poseSegment(leg.calf,knee,ankle);leg.foot.position.set(ankle[0],.030+Math.max(0,Math.sin(t*5.2+s*PI/2))*walk*.055,ankle[2]-.046);leg.foot.rotation.x=standing?Math.sin(t*5.2+s*PI/2)*walk*.07:0;
  }
  for(const arm of arms){
   const s=arm.side,shoulder=[s*.203,shoulderY-.045,0];let elbow,hand;
   if(standing){
    elbow=[s*.27,1.19,Math.sin(t*5.2)*walk*.10*s];hand=[s*.24,1.02,Math.sin(t*5.2)*walk*.20*s-.03];
    if(teach){const f=s===1?teach:teach*.5;elbow=[s*(.28+.10*f),1.19+.08*f,-.12*f];hand=[s*(.24+.27*f),1.02+.47*f+Math.sin(t*1.3)*.025*f,-.32*f];}
    if(type){elbow=[s*.30,1.17,-.14];hand=[s*.155,1.123+Math.sin(t*9+s)*.003,-.57];}
   }else{
    elbow=[s*.295,1.045,-.135];hand=[s*.15,1.116+Math.sin(t*7+index+s)*.003*type,-.535];
    if(s===1&&mouse){hand=[.52,1.123,-.59+Math.sin(t*1.8+index)*.035];elbow=[.39,1.04,-.18];}
    if(s===-1&&raise){elbow=[-.35,1.09+.4*raise,-.05];hand=[-.37,1.13+.77*raise,-.06];}
   }
   const sh=new THREE.Vector3(...shoulder),target=new THREE.Vector3(...hand),hint=new THREE.Vector3(...elbow),a=.31,b=.35;
   const dir=target.clone().sub(sh),distance=clamp(dir.length(),.06,a+b-.003);dir.normalize();target.copy(sh).addScaledVector(dir,distance);
   const projection=(a*a-b*b+distance*distance)/(2*distance),bend=hint.sub(sh);bend.addScaledVector(dir,-bend.dot(dir));if(bend.lengthSq()<.0001)bend.set(s,0,.3);bend.normalize();
   const joint=sh.clone().addScaledVector(dir,projection).addScaledVector(bend,Math.sqrt(Math.max(0,a*a-projection*projection)));
   poseSegment(arm.upper,shoulder,joint.toArray());poseSegment(arm.lower,joint.toArray(),target.toArray());arm.hand.position.copy(target);
   arm.hand.rotation.set(raise&&s===-1?-PI/2*raise:0,0,standing?teach*s*.20:0);
   arm.fingers.forEach((finger,k)=>{finger.rotation.x=type?(Math.sin(t*11+k*1.7+index)*.17+.17):raise&&s===-1?-.04:.16;finger.userData.tip.rotation.x=type?.25+Math.sin(t*11+k)*.13:.22;});
  }
 }
 update(0);return {root,figure,head,arms,legs,eyes,mouth,pose,update,index};
}
