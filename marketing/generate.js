/**
 * Tenly Brand Image Generator
 * Produces 5 design-quality PNGs for the marketing website.
 * Requires: npm install canvas
 */

let createCanvas;

try {
  ({ createCanvas } = require('canvas'));
} catch (e) {
  try {
    ({ createCanvas } = require('@napi-rs/canvas'));
  } catch (e2) {
    console.error('No canvas package found. Run: npm install canvas');
    process.exit(1);
  }
}

const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const DARK   = '#07070E';
const INDIGO = '#6366F1';
const AMBER  = '#F59E0B';

function rgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `rgb(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)})` : hex;
}

function save(canvas, name) {
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`  ✓ ${name}`);
}

// ─────────────────────────────────────────────────────
// IMAGE 1 · HERO  1200×800
// Two abstract silhouettes, amber "7" glow between them
// ─────────────────────────────────────────────────────
function hero() {
  const W = 1200, H = 800;
  const cv = createCanvas(W, H);
  const c  = cv.getContext('2d');

  // Deep navy gradient background
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#05050F');
  bg.addColorStop(0.5, '#080820');
  bg.addColorStop(1,   '#05050F');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Subtle indigo floor light
  const floor = c.createRadialGradient(600, H, 0, 600, H, 500);
  floor.addColorStop(0, 'rgba(99,102,241,0.12)');
  floor.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = floor;
  c.fillRect(0, 0, W, H);

  // Amber centre glow (between the two figures)
  const mid = c.createRadialGradient(600, 390, 0, 600, 390, 320);
  mid.addColorStop(0,   'rgba(245,158,11,0.28)');
  mid.addColorStop(0.45,'rgba(245,158,11,0.08)');
  mid.addColorStop(1,   'rgba(0,0,0,0)');
  c.fillStyle = mid;
  c.fillRect(0, 0, W, H);

  // ── LEFT FIGURE – leaning slightly forward ──
  c.save();
  const lgGrad = c.createLinearGradient(200, 150, 450, 600);
  lgGrad.addColorStop(0, 'rgba(99,102,241,0.85)');
  lgGrad.addColorStop(1, 'rgba(50,50,160,0.50)');
  c.fillStyle = lgGrad;

  // Head
  c.beginPath();
  c.arc(318, 210, 42, 0, Math.PI * 2);
  c.fill();

  // Neck
  c.fillRect(308, 250, 20, 28);

  // Torso – leaning right/forward
  c.beginPath();
  c.moveTo(245, 278);
  c.bezierCurveTo(268, 272, 308, 270, 355, 285);
  c.bezierCurveTo(395, 298, 415, 335, 410, 390);
  c.bezierCurveTo(405, 445, 385, 495, 365, 545);
  c.lineTo(295, 545);
  c.bezierCurveTo(275, 495, 262, 445, 262, 390);
  c.bezierCurveTo(258, 335, 242, 292, 245, 278);
  c.fill();

  // Right arm reaching toward centre
  c.beginPath();
  c.moveTo(390, 305);
  c.bezierCurveTo(430, 315, 480, 328, 530, 345);
  c.bezierCurveTo(515, 362, 490, 364, 465, 356);
  c.bezierCurveTo(430, 344, 395, 325, 365, 315);
  c.fill();
  c.restore();

  // ── RIGHT FIGURE – open listening posture ──
  c.save();
  const rgGrad = c.createLinearGradient(750, 150, 1000, 600);
  rgGrad.addColorStop(0, 'rgba(99,102,241,0.65)');
  rgGrad.addColorStop(1, 'rgba(50,50,180,0.35)');
  c.fillStyle = rgGrad;

  // Head
  c.beginPath();
  c.arc(882, 198, 42, 0, Math.PI * 2);
  c.fill();

  // Neck
  c.fillRect(872, 238, 20, 28);

  // Torso – upright, attentive
  c.beginPath();
  c.moveTo(820, 266);
  c.bezierCurveTo(843, 260, 868, 258, 905, 264);
  c.bezierCurveTo(940, 270, 962, 288, 960, 330);
  c.bezierCurveTo(958, 375, 940, 428, 920, 482);
  c.bezierCurveTo(910, 510, 902, 532, 898, 552);
  c.lineTo(855, 552);
  c.bezierCurveTo(848, 532, 840, 510, 832, 482);
  c.bezierCurveTo(815, 428, 800, 375, 800, 330);
  c.bezierCurveTo(800, 288, 808, 270, 820, 266);
  c.fill();
  c.restore();

  // ── AMBER "7" CIRCLE ──
  // Outer glow
  const og = c.createRadialGradient(600, 388, 0, 600, 388, 110);
  og.addColorStop(0,   'rgba(245,158,11,0.55)');
  og.addColorStop(0.5, 'rgba(245,158,11,0.18)');
  og.addColorStop(1,   'rgba(0,0,0,0)');
  c.fillStyle = og;
  c.beginPath();
  c.arc(600, 388, 110, 0, Math.PI * 2);
  c.fill();

  // Circle ring
  c.strokeStyle = 'rgba(245,158,11,0.75)';
  c.lineWidth = 2.5;
  c.beginPath();
  c.arc(600, 388, 58, 0, Math.PI * 2);
  c.stroke();

  // Circle fill
  c.fillStyle = 'rgba(245,158,11,0.15)';
  c.beginPath();
  c.arc(600, 388, 58, 0, Math.PI * 2);
  c.fill();

  // "7" glyph
  c.fillStyle = '#F59E0B';
  c.font = 'bold 72px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('7', 600, 392);

  // Vignette
  const vig = c.createRadialGradient(600, 400, 180, 600, 400, 720);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.72)');
  c.fillStyle = vig;
  c.fillRect(0, 0, W, H);

  save(cv, 'hero.png');
}

// ─────────────────────────────────────────────────────
// IMAGE 2 · THE QUESTION  1200×600
// Split: grey strikethrough left / vibrant indigo right
// ─────────────────────────────────────────────────────
function question() {
  const W = 1200, H = 600;
  const cv = createCanvas(W, H);
  const c  = cv.getContext('2d');

  // Left half – desaturated dark
  const lb = c.createLinearGradient(0, 0, 600, H);
  lb.addColorStop(0, '#141414');
  lb.addColorStop(1, '#1C1C1C');
  c.fillStyle = lb;
  c.fillRect(0, 0, 600, H);

  // Right half – deep indigo
  const rb = c.createLinearGradient(600, 0, W, H);
  rb.addColorStop(0, '#1A1B4B');
  rb.addColorStop(1, '#25275E');
  c.fillStyle = rb;
  c.fillRect(600, 0, 600, H);

  // Left ambient – very subtle warm from centre
  const la = c.createRadialGradient(540, 300, 0, 540, 300, 350);
  la.addColorStop(0, 'rgba(245,158,11,0.05)');
  la.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = la;
  c.fillRect(0, 0, 600, H);

  // Right ambient indigo glow
  const ra = c.createRadialGradient(860, 280, 0, 860, 280, 380);
  ra.addColorStop(0, 'rgba(99,102,241,0.38)');
  ra.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = ra;
  c.fillRect(600, 0, 600, H);

  // Centre blend
  const blend = c.createLinearGradient(480, 0, 720, 0);
  blend.addColorStop(0,   'rgba(20,20,20,0)');
  blend.addColorStop(0.45,'rgba(20,20,20,0.85)');
  blend.addColorStop(0.55,'rgba(26,27,75,0.85)');
  blend.addColorStop(1,   'rgba(26,27,75,0)');
  c.fillStyle = blend;
  c.fillRect(480, 0, 240, H);

  // ── LEFT TEXT – muted old question ──
  c.save();
  c.fillStyle = 'rgba(200,200,200,0.38)';
  c.font = 'italic 34px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('How are you doing?', 295, 295);

  // Strikethrough
  const tw = c.measureText('How are you doing?').width;
  c.strokeStyle = 'rgba(180,180,180,0.35)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(295 - tw / 2 - 8, 295);
  c.lineTo(295 + tw / 2 + 8, 295);
  c.stroke();
  c.restore();

  // ── RIGHT TEXT – new question emerging ──
  c.save();
  c.fillStyle = 'rgba(255,255,255,0.92)';
  c.font = '30px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText("What's your Tenly", 900, 270);
  c.fillText('score this week?', 900, 316);

  // Amber underline accent
  c.strokeStyle = 'rgba(245,158,11,0.85)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(755, 348);
  c.lineTo(1045, 348);
  c.stroke();
  c.restore();

  // Thin vertical split line
  c.strokeStyle = 'rgba(255,255,255,0.06)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(600, 40);
  c.lineTo(600, 560);
  c.stroke();

  // Vignette edges
  const vig = c.createLinearGradient(0, 0, W, 0);
  vig.addColorStop(0,    'rgba(0,0,0,0.55)');
  vig.addColorStop(0.12, 'rgba(0,0,0,0)');
  vig.addColorStop(0.88, 'rgba(0,0,0,0)');
  vig.addColorStop(1,    'rgba(0,0,0,0.55)');
  c.fillStyle = vig;
  c.fillRect(0, 0, W, H);

  // Top / bottom vignette
  const tv = c.createLinearGradient(0, 0, 0, H);
  tv.addColorStop(0,   'rgba(0,0,0,0.45)');
  tv.addColorStop(0.12,'rgba(0,0,0,0)');
  tv.addColorStop(0.88,'rgba(0,0,0,0)');
  tv.addColorStop(1,   'rgba(0,0,0,0.45)');
  c.fillStyle = tv;
  c.fillRect(0, 0, W, H);

  save(cv, 'question.png');
}

// ─────────────────────────────────────────────────────
// IMAGE 3 · THE SCORE  1200×420
// Numbers 1-10, 7 glowing amber
// ─────────────────────────────────────────────────────
function score() {
  const W = 1200, H = 420;
  const cv = createCanvas(W, H);
  const c  = cv.getContext('2d');

  // Background
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#060612');
  bg.addColorStop(1, '#07070E');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  // Amber halo behind "7"
  const x7 = 644;
  const halo = c.createRadialGradient(x7, 200, 0, x7, 200, 200);
  halo.addColorStop(0,   'rgba(245,158,11,0.32)');
  halo.addColorStop(0.45,'rgba(245,158,11,0.10)');
  halo.addColorStop(1,   'rgba(0,0,0,0)');
  c.fillStyle = halo;
  c.fillRect(0, 0, W, H);

  // Baseline rule
  c.strokeStyle = 'rgba(99,102,241,0.12)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(55, 305);
  c.lineTo(1145, 305);
  c.stroke();

  const nums  = [1,2,3,4,5,6,7,8,9,10];
  const startX = 100;
  const step   = 106;

  nums.forEach((n, i) => {
    const x   = startX + i * step;
    const dist = Math.abs(n - 7);
    const active = n === 7;

    if (active) {
      // Extra glow ring
      const ring = c.createRadialGradient(x, 205, 0, x, 205, 75);
      ring.addColorStop(0,   'rgba(245,158,11,0.45)');
      ring.addColorStop(0.6, 'rgba(245,158,11,0.12)');
      ring.addColorStop(1,   'rgba(0,0,0,0)');
      c.fillStyle = ring;
      c.beginPath();
      c.arc(x, 205, 75, 0, Math.PI * 2);
      c.fill();

      c.fillStyle  = '#F59E0B';
      c.font       = 'bold 100px serif';
      c.shadowColor = '#F59E0B';
      c.shadowBlur  = 22;
    } else {
      const alpha = Math.max(0.08, 0.32 - dist * 0.045);
      c.fillStyle   = `rgba(99,102,241,${alpha.toFixed(2)})`;
      const sz      = Math.max(40, 72 - dist * 8);
      c.font        = `${sz}px serif`;
      c.shadowBlur  = 0;
    }

    c.textAlign    = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(n.toString(), x, 270);
    c.shadowBlur = 0;

    // Small tick mark below baseline
    c.strokeStyle = active
      ? 'rgba(245,158,11,0.5)'
      : `rgba(99,102,241,${Math.max(0.06, 0.18 - dist * 0.02)})`;
    c.lineWidth = active ? 1.5 : 1;
    c.beginPath();
    c.moveTo(x, 309);
    c.lineTo(x, active ? 326 : 318);
    c.stroke();
  });

  // Side vignettes
  const vig = c.createLinearGradient(0, 0, W, 0);
  vig.addColorStop(0,    'rgba(0,0,0,0.68)');
  vig.addColorStop(0.1,  'rgba(0,0,0,0)');
  vig.addColorStop(0.9,  'rgba(0,0,0,0)');
  vig.addColorStop(1,    'rgba(0,0,0,0.68)');
  c.fillStyle = vig;
  c.fillRect(0, 0, W, H);

  save(cv, 'score.png');
}

// ─────────────────────────────────────────────────────
// IMAGE 4 · LEAN IN / LEAN OUT  1200×600
// Left: urgent indigo figure / Right: open amber figure
// ─────────────────────────────────────────────────────
function lean() {
  const W = 1200, H = 600;
  const cv = createCanvas(W, H);
  const c  = cv.getContext('2d');

  // Left half bg
  const lb = c.createLinearGradient(0, 0, 600, H);
  lb.addColorStop(0, '#08082A');
  lb.addColorStop(1, '#0F1040');
  c.fillStyle = lb;
  c.fillRect(0, 0, 600, H);

  // Right half bg
  const rb = c.createLinearGradient(600, 0, W, H);
  rb.addColorStop(0, '#180F03');
  rb.addColorStop(1, '#241508');
  c.fillStyle = rb;
  c.fillRect(600, 0, 600, H);

  // Left glow
  const lg = c.createRadialGradient(270, 280, 0, 270, 280, 330);
  lg.addColorStop(0, 'rgba(99,102,241,0.32)');
  lg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = lg;
  c.fillRect(0, 0, 600, H);

  // Right glow
  const rg = c.createRadialGradient(930, 280, 0, 930, 280, 330);
  rg.addColorStop(0, 'rgba(245,158,11,0.32)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = rg;
  c.fillRect(600, 0, 600, H);

  // ── LEFT FIGURE – forward lean, urgency ──
  c.save();
  const lf = c.createLinearGradient(160, 120, 430, 560);
  lf.addColorStop(0, 'rgba(99,102,241,0.88)');
  lf.addColorStop(1, 'rgba(60,60,200,0.50)');
  c.fillStyle = lf;

  // Head tilted slightly forward
  c.save();
  c.translate(262, 168);
  c.rotate(0.12);
  c.beginPath();
  c.arc(0, 0, 40, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // Neck
  c.fillRect(252, 207, 20, 26);

  // Torso leaning
  c.beginPath();
  c.moveTo(188, 233);
  c.bezierCurveTo(215, 225, 252, 222, 300, 234);
  c.bezierCurveTo(348, 246, 375, 278, 374, 330);
  c.bezierCurveTo(372, 385, 352, 440, 333, 498);
  c.lineTo(264, 498);
  c.bezierCurveTo(246, 440, 232, 385, 230, 330);
  c.bezierCurveTo(228, 278, 210, 246, 188, 233);
  c.fill();

  // Arm reaching urgently forward
  c.beginPath();
  c.moveTo(355, 282);
  c.bezierCurveTo(400, 295, 458, 308, 520, 322);
  c.bezierCurveTo(505, 340, 478, 342, 452, 334);
  c.bezierCurveTo(412, 322, 368, 304, 338, 294);
  c.fill();
  c.restore();

  // ── RIGHT FIGURE – open, expansive posture ──
  c.save();
  const rf = c.createLinearGradient(760, 120, 1040, 560);
  rf.addColorStop(0, 'rgba(245,158,11,0.75)');
  rf.addColorStop(1, 'rgba(180,100,5,0.42)');
  c.fillStyle = rf;

  // Head – upright
  c.beginPath();
  c.arc(938, 158, 40, 0, Math.PI * 2);
  c.fill();

  // Neck
  c.fillRect(928, 196, 20, 26);

  // Torso – open, relaxed
  c.beginPath();
  c.moveTo(875, 222);
  c.bezierCurveTo(900, 215, 925, 212, 960, 218);
  c.bezierCurveTo(995, 224, 1015, 244, 1016, 285);
  c.bezierCurveTo(1018, 328, 1000, 390, 980, 448);
  c.bezierCurveTo(968, 480, 958, 508, 953, 530);
  c.lineTo(918, 530);
  c.bezierCurveTo(910, 508, 900, 480, 890, 448);
  c.bezierCurveTo(872, 390, 858, 328, 860, 285);
  c.bezierCurveTo(861, 244, 866, 226, 875, 222);
  c.fill();

  // Arms spread wide / open
  c.beginPath();
  c.moveTo(875, 270);
  c.bezierCurveTo(835, 282, 785, 296, 730, 308);
  c.bezierCurveTo(740, 326, 762, 329, 788, 322);
  c.bezierCurveTo(822, 313, 856, 296, 882, 284);
  c.fill();

  c.beginPath();
  c.moveTo(1010, 270);
  c.bezierCurveTo(1052, 282, 1098, 296, 1145, 305);
  c.bezierCurveTo(1138, 324, 1115, 326, 1090, 318);
  c.bezierCurveTo(1058, 308, 1024, 292, 1002, 282);
  c.fill();
  c.restore();

  // Dashed centre divider
  c.save();
  c.strokeStyle = 'rgba(255,255,255,0.07)';
  c.lineWidth = 1;
  c.setLineDash([6, 18]);
  c.beginPath();
  c.moveTo(600, 30);
  c.lineTo(600, 570);
  c.stroke();
  c.restore();

  // Vignette
  const vig = c.createRadialGradient(600, 300, 120, 600, 300, 680);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.65)');
  c.fillStyle = vig;
  c.fillRect(0, 0, W, H);

  save(cv, 'lean.png');
}

// ─────────────────────────────────────────────────────
// IMAGE 5 · CONSTELLATION  1200×600
// 5 data lines: 1 amber descending, 4 indigo/violet/green/pink rising
// Two amber glowing dots at peak & trough
// ─────────────────────────────────────────────────────
function constellation() {
  const W = 1200, H = 600;
  const cv = createCanvas(W, H);
  const c  = cv.getContext('2d');

  // Near-black bg
  c.fillStyle = '#050508';
  c.fillRect(0, 0, W, H);

  // Very faint grid
  c.strokeStyle = 'rgba(99,102,241,0.055)';
  c.lineWidth = 1;
  for (let y = 60; y < H; y += 60) {
    c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
  }
  for (let x = 100; x < W; x += 100) {
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
  }

  // Upward-trending lines
  const upLines = [
    { color: 'rgba(99,102,241,0.72)',  sy: 488, ey: 148, cp1y: 430, cp2y: 220 },
    { color: 'rgba(167,139,250,0.58)', sy: 508, ey: 192, cp1y: 460, cp2y: 270 },
    { color: 'rgba(52,211,153,0.50)',  sy: 520, ey: 245, cp1y: 470, cp2y: 315 },
    { color: 'rgba(244,114,182,0.50)', sy: 498, ey: 168, cp1y: 445, cp2y: 238 },
  ];

  const x0 = 80, x1 = 1120;

  upLines.forEach(l => {
    c.save();
    c.shadowColor = l.color;
    c.shadowBlur  = 10;
    c.strokeStyle = l.color;
    c.lineWidth   = 2;
    c.beginPath();
    c.moveTo(x0, l.sy);
    c.bezierCurveTo(
      x0 + (x1 - x0) * 0.35, l.cp1y,
      x0 + (x1 - x0) * 0.65, l.cp2y,
      x1, l.ey
    );
    c.stroke();
    c.restore();
  });

  // ── AMBER DESCENDING LINE ──
  const peakX = 175, peakY = 108;
  const troughX = 1005, troughY = 472;

  c.save();
  c.shadowColor = AMBER;
  c.shadowBlur  = 18;
  c.strokeStyle = 'rgba(245,158,11,0.92)';
  c.lineWidth   = 3;
  c.beginPath();
  c.moveTo(peakX, peakY);
  c.bezierCurveTo(
    peakX + (troughX - peakX) * 0.35, peakY  + (troughY - peakY) * 0.18,
    peakX + (troughX - peakX) * 0.65, troughY - (troughY - peakY) * 0.18,
    troughX, troughY
  );
  c.stroke();
  c.restore();

  // Glowing dot helper
  function glowDot(x, y) {
    const outer = c.createRadialGradient(x, y, 0, x, y, 32);
    outer.addColorStop(0,   'rgba(245,158,11,0.55)');
    outer.addColorStop(0.5, 'rgba(245,158,11,0.18)');
    outer.addColorStop(1,   'rgba(0,0,0,0)');
    c.fillStyle = outer;
    c.beginPath();
    c.arc(x, y, 32, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#F59E0B';
    c.beginPath();
    c.arc(x, y, 5.5, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = 'rgba(245,158,11,0.7)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(x, y, 11, 0, Math.PI * 2);
    c.stroke();
  }

  // Dashed drop lines from dots to bottom
  c.strokeStyle = 'rgba(245,158,11,0.22)';
  c.lineWidth   = 1;
  c.setLineDash([4, 10]);
  c.beginPath();
  c.moveTo(peakX,   peakY   + 32);
  c.lineTo(peakX,   560);
  c.stroke();
  c.beginPath();
  c.moveTo(troughX, troughY + 32);
  c.lineTo(troughX, 560);
  c.stroke();
  c.setLineDash([]);

  glowDot(peakX,   peakY);
  glowDot(troughX, troughY);

  // Vignette
  const vig = c.createRadialGradient(600, 300, 140, 600, 300, 720);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.65)');
  c.fillStyle = vig;
  c.fillRect(0, 0, W, H);

  // Edge vignettes
  const ev = c.createLinearGradient(0, 0, W, 0);
  ev.addColorStop(0,   'rgba(0,0,0,0.5)');
  ev.addColorStop(0.08,'rgba(0,0,0,0)');
  ev.addColorStop(0.92,'rgba(0,0,0,0)');
  ev.addColorStop(1,   'rgba(0,0,0,0.5)');
  c.fillStyle = ev;
  c.fillRect(0, 0, W, H);

  save(cv, 'constellation.png');
}

// ── Run ──
console.log('Generating Tenly brand images…');
hero();
question();
score();
lean();
constellation();
console.log('\nAll 5 images written to marketing/');
