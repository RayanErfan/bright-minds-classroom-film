import * as THREE from 'three';
import { fa } from './story.js';

export function canvasTexture(w,h,draw){
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');draw(ctx,w,h);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  return {texture,canvas,ctx};
}
export function woodTexture(){return canvasTexture(512,512,(c,w,h)=>{
  c.fillStyle='#b89870';c.fillRect(0,0,w,h);
  for(let i=0;i<360;i++){let x=((Math.sin(i*127.1)*43758.5453)%1+1)%1*w;c.strokeStyle=i%3?'rgba(87,59,36,.11)':'rgba(255,236,192,.19)';c.lineWidth=i%5===0?2:.6;c.beginPath();c.moveTo(x,0);for(let y=0;y<=h;y+=16)c.lineTo(x+Math.sin(y*.014+i)*1.7,y);c.stroke();}
}).texture;}
export function fabricTexture(){return canvasTexture(128,128,(c,w,h)=>{
  c.fillStyle='#ffffff';c.fillRect(0,0,w,h);c.strokeStyle='#bbbbbb';c.lineWidth=.5;
  for(let i=0;i<128;i+=3){c.beginPath();c.moveTo(i,0);c.lineTo(i,128);c.moveTo(0,i);c.lineTo(128,i);c.stroke();}
}).texture;}
export function labelTexture(text,{bg='#223e3c',color='#eee8ce',w=512,h=128,size=40,sub=''}={}){
  return canvasTexture(w,h,(c)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.direction='rtl';c.font=`500 ${size}px Vazirmatn`;c.fillText(text,w/2,sub?h*.38:h/2,w*.92);if(sub){c.globalAlpha=.6;c.font=`${size*.37}px Vazirmatn`;c.fillText(sub,w/2,h*.75,w*.9);}}).texture;
}
function round(c,x,y,w,h,r=8){c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}
function text(c,s,x,y,size=24,color='#dae8e0',weight=400){c.save();c.translate(x,y);if(c.getTransform().a<0)c.scale(-1,1);c.fillStyle=color;c.direction='rtl';c.textAlign='right';c.font=`${weight} ${size}px Vazirmatn`;c.fillText(s,0,0);c.restore();}
function chip(c,x,y,w,h,color='#78bbab'){
 c.fillStyle=color;round(c,x,y,w,h,5);c.fillStyle='#1f403c';round(c,x+8,y+8,w-16,h-16,2);
 c.strokeStyle=color;c.lineWidth=3;
 for(let i=8;i<w;i+=11){c.beginPath();c.moveTo(x+i,y-7);c.lineTo(x+i,y);c.moveTo(x+i,y+h);c.lineTo(x+i,y+h+7);c.stroke();}
 for(let i=8;i<h;i+=11){c.beginPath();c.moveTo(x-7,y+i);c.lineTo(x,y+i);c.moveTo(x+w,y+i);c.lineTo(x+w+7,y+i);c.stroke();}
}
export function makeBoard(){
 const surface=canvasTexture(1536,768,()=>{});let last=-1;
 function update(t){const page=t<18?0:t<36?1:t<54?2:t<72?3:t<108?4:5;if(page===last&&page!==2&&page!==4)return;const tick=Math.floor(t*2);if(last===`${page}-${tick}`)return;last=page===2||page===4?`${page}-${tick}`:page;
  const c=surface.ctx;c.setTransform(-1,0,0,1,1536,0);c.fillStyle='#122d32';c.fillRect(0,0,1536,768);
  const g=c.createLinearGradient(0,0,1536,768);g.addColorStop(0,'#1b4244');g.addColorStop(1,'#0e242d');c.fillStyle=g;c.fillRect(0,0,1536,768);
  c.fillStyle='#90b5a133';for(let x=0;x<1536;x+=48)for(let y=0;y<768;y+=48)c.fillRect(x,y,1,1);
  text(c,'ذهن‌های روشن  /  آزمایشگاه یادگیری',70,66,20,'#8eb5a7',500);text(c,'آموزش رایانه  •  درس اول',1090,66,16,'#8eb5a7');
  c.fillStyle='#9cbfa044';c.fillRect(70,93,1396,1);
  if(page===0||page===1){
   text(c,page===0?'اینجا، آغاز کنجکاوی است.':'درون یک رایانه',72,255,88,'#f0eee0',500);
   text(c,'قطعه‌های کوچک، توانایی‌های بزرگ',78,326,31,'#b6cabc');
   const labels=['اتصال','پردازش','حافظه','ذخیره‌سازی','نمایش'];
   labels.forEach((label,i)=>{c.fillStyle='#ffffff07';round(c,75+i*284,416,262,169,12);chip(c,102+i*284,444,40,38,i===1?'#efb779':'#84b8a5');text(c,fa(i+1,2),276+i*284,475,18,'#83a492');text(c,label,101+i*284,555,22,'#c8d9cb',500);});
   text(c,'آشنایی با سخت‌افزار',76,694,20,'#83aa98');text(c,'با هم، بهتر یاد می‌گیریم.',1000,694,19,'#b6c4b6');
  }else if(page===2){
   text(c,'با قطعه‌ها آشنا شویم',70,179,61,'#f0eee0',500);text(c,'پنج بخش، یک دستگاه شگفت‌انگیز',75,224,24,'#9dbeb0');
   const labels=['مادربرد','پردازنده','رَم','ذخیره‌سازی','گرافیک'];
   const subs=['پیوند میان قطعه‌ها','اجرای دستورها','حافظهٔ کارهای جاری','نگهداری فایل‌ها','پردازش تصویر'];
   const active=Math.min(4,Math.floor((t-36)/3.5));
   labels.forEach((label,i)=>{const x=75+i*284;c.fillStyle=i===active?'#accc9f24':'#ffffff07';round(c,x,282,262,320,10);c.strokeStyle=i===active?'#e1b982':'#ffffff15';c.lineWidth=2;c.stroke();
    if(i===0){c.fillStyle='#3e7765';round(c,x+53,328,145,130,3);chip(c,x+78,356,60,60);c.fillStyle='#bfbe91';for(let n=0;n<3;n++)c.fillRect(x+153+n*12,342,6,102);}
    if(i===1)chip(c,x+76,344,107,101,'#c6cfc4');
    if(i===2){c.fillStyle='#427d63';round(c,x+34,367,194,61,3);for(let n=0;n<4;n++){c.fillStyle='#142d2b';c.fillRect(x+45+n*43,379,32,31);}c.fillStyle='#c4b47a';for(let n=0;n<15;n++)c.fillRect(x+41+n*12,428,8,7);}
    if(i===3){c.fillStyle='#c5d5cf';round(c,x+59,327,145,130,5);c.fillStyle='#819a96';c.beginPath();c.arc(x+133,389,44,0,7);c.fill();c.fillStyle='#dce3d4';c.beginPath();c.arc(x+133,389,13,0,7);c.fill();c.strokeStyle='#2c4d46';c.lineWidth=9;c.beginPath();c.moveTo(x+186,430);c.lineTo(x+133,389);c.stroke();}
    if(i===4){c.fillStyle='#597064';round(c,x+32,356,198,82,3);for(let n=0;n<2;n++){c.fillStyle='#263e38';c.beginPath();c.arc(x+86+n*91,397,32,0,7);c.fill();c.strokeStyle='#879d8c';for(let j=0;j<8;j++){c.beginPath();c.moveTo(x+86+n*91,397);c.lineTo(x+86+n*91+Math.cos(j*Math.PI/4+t)*26,397+Math.sin(j*Math.PI/4+t)*26);c.stroke();}}}
    text(c,label,x+22,517,23,'#e1eadc',500);text(c,subs[i],x+22,559,19,'#9db8a8');
   });text(c,'پردازنده  ↔  رَم  ↔  ذخیره‌سازی',80,691,26,'#ebbe83');text(c,'مادربرد، قطعه‌ها را به هم متصل می‌کند.',930,691,22,'#a7c4b3');
  }else if(page===3){
   text(c,'چه پرسش خوبی!',70,186,65,'#f0eee0',500);text(c,'چرا هم رَم لازم داریم و هم ذخیره‌سازی؟',76,241,30,'#aacbbb');
   [{x:76,title:'رَم',sub:'میز کار شما',body:'دسترسی سریع به کارهای همین حالا',color:'#a5c9ad'},{x:817,title:'ذخیره‌سازی',sub:'قفسهٔ کتاب شما',body:'نگهداری فایل‌ها حتی بدون برق',color:'#e5b682'}].forEach(p=>{
    c.fillStyle='#ffffff08';round(c,p.x,296,641,320,12);text(c,p.title,p.x+34,351,22,p.color,600);text(c,p.sub,p.x+34,411,49,'#e6eee0');text(c,p.body,p.x+34,573,25,'#9fbbab');c.strokeStyle=p.color;c.lineWidth=5;
    if(p.title==='رَم'){c.strokeRect(p.x+370,409,195,12);c.beginPath();c.moveTo(p.x+389,421);c.lineTo(p.x+379,520);c.moveTo(p.x+546,421);c.lineTo(p.x+556,520);c.stroke();c.strokeRect(p.x+421,361,93,48);c.strokeRect(p.x+398,432,79,35);}else{c.strokeRect(p.x+381,369,180,142);for(let i=0;i<3;i++){c.beginPath();c.moveTo(p.x+383,410+i*41);c.lineTo(p.x+559,410+i*41);c.stroke();}for(let i=0;i<8;i++)c.strokeRect(p.x+393+i*19,376,10,28);}
   });text(c,'دو کار متفاوت، در کنار هم',76,694,30,'#e6c39c');
  }else if(page===4){
   text(c,'حالا نوبت شماست!',70,185,67,'#f0eee0',500);text(c,'هر قطعه را به کار درستش وصل کنید.',77,240,30,'#a7c9b7');
   ['۰۱    قطعه را بشناسید','۰۲    کار آن را توضیح دهید','۰۳    جای آن را در رایانه پیدا کنید'].forEach((v,i)=>{c.fillStyle='#ffffff08';round(c,78,289+i*103,920,83,10);text(c,v,104,342+i*103,31,'#d9e6d7');});
   c.strokeStyle='#9fba8f';c.lineWidth=8;c.beginPath();c.arc(1244,439,110,-Math.PI/2,Math.PI*1.5);c.stroke();text(c,'با هم',1192,429,29,'#d0ddbf');text(c,'بسازیم',1174,478,39,'#efd09d',500);text(c,'بپرسید، امتحان کنید، به هم کمک کنید.',77,692,29,'#e0c9a4');
  }else{
   text(c,'هر قطعه، یک وظیفه دارد.',70,217,73,'#f2eee0',500);text(c,'اتصال، پردازش، حافظه، ذخیره‌سازی، نمایش',77,281,32,'#a9cbb6');
   ['مادربرد','پردازنده','رَم','ذخیره‌سازی','گرافیک'].forEach((v,i)=>{const x=82+i*281;chip(c,x+68,384,84,79,i%2?'#dfb67f':'#94b89f');text(c,v,x+15,534,30,'#d7e4d3');});
   text(c,'همیشه بپرسید. همیشه بسازید.',77,669,39,'#e6c695');text(c,'تا کلاس بعد  ↖',1161,698,17,'#92aa91');
  }surface.texture.needsUpdate=true;
 }
 update(0);return {...surface,update};
}
export function makeScreen(index){
 const surface=canvasTexture(768,448,()=>{});let last='';
 const update=t=>{const mode=t<36?0:t<72?1:t<108?2:3;const progress=Math.min(5,Math.floor(Math.max(0,t-73-index*.4)/3));const key=`${mode}-${progress}`;if(key===last)return;last=key;const c=surface.ctx;c.setTransform(-1,0,0,1,768,0);
  c.fillStyle='#172e35';c.fillRect(0,0,768,448);c.fillStyle='#24464a';c.fillRect(0,0,768,39);text(c,'ذهن‌های روشن',21,26,18,'#dee6cf',500);text(c,`کلاس ۲۰۴ / رایانهٔ ${fa(index+1,2)}`,419,26,12,'#a8c3b4');
  c.fillStyle='#12282e';c.fillRect(0,39,135,409);['مرور درس','درس من','قطعه‌ها','تمرین','یادداشت‌ها'].forEach((s,i)=>{if(i===mode){c.fillStyle='#91b69525';round(c,11,73+i*52,113,34,4);}text(c,s,24,95+i*52,13,i===mode?'#e2c195':'#7b9e97');});
  text(c,mode===0?'خوش آمدید!':mode===1?'درون رایانه':mode===2?'وصل کن، یاد بگیر، کشف کن':'آفرین، ذهن کنجکاو!',165,97,29,'#dce8d6',500);text(c,'سخت‌افزار رایانه / درس اول',166,126,11,'#87a999');
  if(mode===0){text(c,'هر پرسش، آغاز یک کشف است.',169,177,17,'#afc7b1');for(let i=0;i<3;i++){c.fillStyle='#355754';round(c,168+i*191,211,176,137,7);chip(c,226+i*191,238,55,51,'#aac6ae');text(c,['کشف کن','یاد بگیر','بساز'][i],204+i*191,328,12,'#c3d5bd');}}
  if(mode===1||mode===3){for(let i=0;i<5;i++){c.fillStyle='#31534e';round(c,169,159+i*48,566,37,4);text(c,['مادربرد','پردازنده','حافظهٔ موقت','حافظهٔ ذخیره‌سازی','کارت گرافیک'][i],184,183+i*48,14,'#d4e2ce');text(c,['اتصال‌ها','دستورها','اطلاعات جاری','فایل‌های ذخیره‌شده','تصویرها'][i],529,183+i*48,12,'#9dbda5');}}
  if(mode===2){['پردازنده: اجرای دستورها','رَم: نگهداری کارهای جاری','ذخیره‌ساز: نگهداری فایل‌ها','گرافیک: پردازش تصویر','مادربرد: اتصال قطعه‌ها'].forEach((v,i)=>{c.fillStyle=i<progress?'#547653':'#2b4d4c';round(c,168,155+i*45,564,35,4);text(c,v,183,178+i*45,14,'#cfe3c9');text(c,i<progress?'✓':'○',697,178+i*45,18,'#d7bf8c');});}
  c.fillStyle='#d1ab77';round(c,588,405,144,26,5);text(c,mode===3?'انجام شد ✓':'ادامه ←',611,423,11,'#263c33',600);text(c,'یادگیری یک سفر است؛ ادامه بدهید.',167,423,10,'#85a691');surface.texture.needsUpdate=true;
 };update(0);return {...surface,update};
}
