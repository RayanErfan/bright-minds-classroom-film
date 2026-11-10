import * as THREE from 'three';

const W = 512, H = 320;

const PALETTE = {
  bg: '#0b1017',
  bgAlt: '#0e1520',
  kw: '#c792ea',
  fn: '#82aaff',
  str: '#c3e88d',
  num: '#f78c6c',
  com: '#5c6f88',
  txt: '#c8d3e0',
  accent: '#6fd3ff',
  ok: '#7ee787',
};

function rnd(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function makeCanvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function base(ctx, w, h, alt = false) {
  ctx.fillStyle = alt ? PALETTE.bgAlt : PALETTE.bg;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w * 0.5, h * 0.1, 0, w * 0.5, h * 0.1, h * 1.1);
  g.addColorStop(0, 'rgba(90,150,220,0.13)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/* ------------------------------------------------------------------ */
/*  code editor                                                        */
/* ------------------------------------------------------------------ */
const CODE = [
  ['kw', 'const'], ['txt', ' rig = '], ['fn', 'buildRig'], ['txt', '('], ['str', "'arm'"], ['txt', ');'],
  ['txt', ''],
  ['kw', 'function'], ['txt', ' '], ['fn', 'buildRig'], ['txt', '(part) {'],
  ['txt', '  '], ['kw', 'const'], ['txt', ' j = '], ['kw', 'new'], ['txt', ' '], ['fn', 'Joint'], ['txt', '();'],
  ['txt', '  j.'], ['fn', 'attach'], ['txt', '('], ['str', "'servo'"], ['txt', ', '], ['num', '0.42'], ['txt', ');'],
  ['txt', '  '], ['com', '// torque budget'],
  ['txt', '  '], ['kw', 'return'], ['txt', ' j.'], ['fn', 'calibrate'], ['txt', '({ '], ['fn', 'mass'], ['txt', ': '], ['num', '1.8'], ['txt', ' });'],
  ['txt', '}'],
  ['txt', ''],
  ['kw', 'export'], ['txt', ' '], ['kw', 'default'], ['txt', ' '], ['fn', 'Rig'], ['txt', ';'],
];

function drawCode(ctx, w, h, t, seed) {
  base(ctx, w, h, seed % 2 === 0);
  ctx.font = '13px ui-monospace, Menlo, monospace';
  ctx.textBaseline = 'middle';

  const scroll = Math.floor((t * 0.9 + seed) % 8);
  const lh = 19;
  for (let i = 0; i < 17; i++) {
    const line = CODE[(i + scroll) % CODE.length];
    const y = 26 + i * lh;
    if (y > h - 8) break;
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(String(i + scroll + 1).padStart(2, '0'), 8, y);
    ctx.font = '13px ui-monospace, monospace';
    let x = 34;
    for (let p = 0; p < line.length; p++) {
      ctx.fillStyle = PALETTE[line[p][0]] || PALETTE.txt;
      ctx.fillText(line[p][1], x, y);
      x += ctx.measureText(line[p][1]).width;
    }
  }
  // cursor
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = PALETTE.accent;
    ctx.fillRect(34, 26 + 10 * lh - 8, 7, 15);
  }
  // minimap
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(w - 46, 0, 46, h);
  for (let i = 0; i < 34; i++) {
    ctx.fillStyle = `rgba(130,170,255,${0.12 + ((i * 7) % 5) * 0.05})`;
    ctx.fillRect(w - 42, 8 + i * 8, 4 + ((i * 13) % 30), 2);
  }
}

/* ------------------------------------------------------------------ */
/*  terminal                                                           */
/* ------------------------------------------------------------------ */
const TERM = [
  '$ npm run build --release',
  '  compiling classroom.shaders ...',
  '  ✓ 42 modules transformed',
  '  ✓ light probes baked (512)',
  '  ✓ volume fog solved',
  '  ✓ camera spline smoothed',
  '$ node verify.js --sequence all',
  '  [1/7] establishing shot  ok',
  '  [2/7] entrance timing    ok',
  '  [3/7] board sync         ok',
  '  [4/7] hand-raise rig     ok',
  '  [5/7] aisle dolly       ok',
  '  [6/7] macro pass         ok',
  '  [7/7] finale pullback    ok',
  '$ render --out film.mp4',
  '  frames: 1800  fps: 24',
];

function drawTerminal(ctx, w, h, t) {
  base(ctx, w, h, true);
  ctx.font = '12px ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  const shown = Math.min(TERM.length, Math.floor(t * 3.2) % (TERM.length + 6));
  for (let i = 0; i < Math.min(shown, 15); i++) {
    const y = 24 + i * 19;
    if (y > h - 6) break;
    const line = TERM[i];
    ctx.fillStyle = line.startsWith('$') ? PALETTE.accent
      : line.includes('✓') || line.includes('ok') ? PALETTE.ok
      : PALETTE.txt;
    ctx.fillText(line, 12, y);
  }
  if (Math.floor(t * 2.4) % 2 === 0) {
    ctx.fillStyle = PALETTE.ok;
    ctx.fillRect(12, 24 + Math.min(shown, 15) * 19 - 6, 8, 13);
  }
}

/* ------------------------------------------------------------------ */
/*  slide deck                                                         */
/* ------------------------------------------------------------------ */
function drawSlide(ctx, w, h, t, seed) {
  const hue = 205 + (seed % 4) * 14;
  ctx.fillStyle = `hsl(${hue} 40% 9%)`;
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsla(${hue},80%,60%,0.22)`);
  g.addColorStop(1, 'hsla(0,0%,0%,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#eaf4ff';
  ctx.font = 'bold 26px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(seed % 2 ? 'حافظه و ذخیره‌سازی' : 'ساختار مادربرد', w - 30, 62);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px Vazirmatn, Tahoma, sans-serif';
  for (let i = 0; i < 4; i++) {
    const y = 120 + i * 40;
    const wd = 190 + ((i * 47 + seed * 31) % 130);
    ctx.globalAlpha = 0.35 + 0.12 * Math.sin(t * 1.4 + i);
    ctx.fillRect(30, y, wd, 10);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(111,211,255,0.85)';
  ctx.fillRect(30, 96, 64, 4);

  // progress dots
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(w - 40 - i * 16, h - 26, 4, 0, 7);
    ctx.fillStyle = i === 1 ? '#6fd3ff' : 'rgba(255,255,255,0.22)';
    ctx.fill();
  }
}

/* ------------------------------------------------------------------ */
/*  smart board — hardware anatomy                                     */
/* ------------------------------------------------------------------ */
const PARTS = [
  { label: 'CPU', fa: 'پردازنده', x: 0.50, y: 0.30, w: 0.13, h: 0.20, c: '#ff9d5c' },
  { label: 'RAM', fa: 'حافظه', x: 0.74, y: 0.22, w: 0.05, h: 0.34, c: '#6fd3ff' },
  { label: 'GPU', fa: 'کارت گرافیک', x: 0.34, y: 0.66, w: 0.24, h: 0.10, c: '#c792ea' },
  { label: 'SSD', fa: 'حافظه SSD', x: 0.14, y: 0.70, w: 0.13, h: 0.09, c: '#7ee787' },
  { label: 'PSU', fa: 'منبع تغذیه', x: 0.80, y: 0.70, w: 0.14, h: 0.13, c: '#ffd166' },
];

function drawBoard(ctx, w, h, t) {
  // backdrop
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#071119');
  g.addColorStop(1, '#0d1b26');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(111,211,255,0.09)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 44) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  ctx.fillStyle = '#eaf4ff';
  ctx.font = 'bold 34px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('اجزای اصلی کامپیوتر', w - 40, 60);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(111,211,255,0.8)';
  ctx.font = '16px ui-monospace, monospace';
  ctx.fillText('MOTHERBOARD / ANATOMY  ·  LESSON 03', 40, 96);
  ctx.fillRect(40, 104, 320, 2);

  const bx = 60, by = 150, bw = w - 140, bh = h - 250;

  // board PCB
  ctx.fillStyle = 'rgba(20,70,60,0.55)';
  ctx.strokeStyle = 'rgba(126,231,135,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 12);
  ctx.fill();
  ctx.stroke();

  // traces
  ctx.strokeStyle = 'rgba(126,231,135,0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    ctx.beginPath();
    ctx.moveTo(bx + 12, by + 12 + i * (bh / 26));
    ctx.lineTo(bx + bw * 0.5, by + 12 + i * (bh / 26));
    ctx.lineTo(bx + bw * 0.5 + (i % 2 ? 30 : -30), by + 40 + i * (bh / 26));
    ctx.stroke();
  }

  const active = Math.floor(t * 0.55) % PARTS.length;

  PARTS.forEach((p, i) => {
    const x = bx + bw * p.x, y = by + bh * p.y;
    const pw = bw * p.w, ph = bh * p.h;
    const on = i === active;
    ctx.globalAlpha = on ? 1 : 0.5;

    ctx.fillStyle = on ? p.c : 'rgba(200,220,235,0.35)';
    ctx.beginPath();
    ctx.roundRect(x, y, pw, ph, 4);
    ctx.fill();

    if (on) {
      ctx.shadowColor = p.c;
      ctx.shadowBlur = 24;
      ctx.strokeStyle = p.c;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // leader line + callout
      const lx = x + pw + 26, ly = y - 14;
      ctx.strokeStyle = p.c;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + pw, y + ph * 0.5);
      ctx.lineTo(lx, ly + 10);
      ctx.stroke();

      ctx.fillStyle = 'rgba(4,10,16,0.92)';
      ctx.beginPath();
      ctx.roundRect(lx + 6, ly - 14, 210, 52, 6);
      ctx.fill();
      ctx.strokeStyle = p.c;
      ctx.stroke();

      ctx.fillStyle = p.c;
      ctx.font = 'bold 16px ui-monospace, monospace';
      ctx.fillText(p.label, lx + 18, ly + 4);
      ctx.fillStyle = '#dfeaf5';
      ctx.font = '15px Vazirmatn, Tahoma, sans-serif';
      ctx.fillText(p.fa, lx + 18, ly + 26);
    }
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '17px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('هر قطعه نقش مشخصی در پردازش و انتقال داده دارد', w - 40, h - 40);
  ctx.textAlign = 'left';

  // scan sweep
  const sy = (t * 60) % h;
  const sg = ctx.createLinearGradient(0, sy - 60, 0, sy + 60);
  sg.addColorStop(0, 'rgba(111,211,255,0)');
  sg.addColorStop(0.5, 'rgba(111,211,255,0.07)');
  sg.addColorStop(1, 'rgba(111,211,255,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, sy - 60, w, 120);
}

/* ------------------------------------------------------------------ */

const DRAWERS = {
  code: drawCode,
  terminal: drawTerminal,
  slide: drawSlide,
  board: drawBoard,
};

export function createScreen(kind, seed = 1, opts = {}) {
  const w = opts.w || (kind === 'board' ? 1024 : W);
  const h = opts.h || (kind === 'board' ? 576 : H);
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const draw = DRAWERS[kind] || drawSlide;

  const screen = {
    kind,
    texture,
    canvas,
    draw(t) {
      ctx.save();
      draw(ctx, w, h, t, seed);
      ctx.restore();
      texture.needsUpdate = true;
    },
  };

  screen.draw(0);
  return screen;
}
