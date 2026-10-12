// Scenery sprites — stamped by Game.js background pass.
// All ink stays inside 0..w / 0..h. These paint ONCE and are reused.

Assets.sprite('moon', 100, 100, (ctx, w, h) => {
  const cx = w * 0.5, cy = h * 0.5;
  // Soft glow
  const g = ctx.createRadialGradient(cx, cy, w * 0.2, cx, cy, w * 0.48);
  g.addColorStop(0, 'rgba(255,240,200,0.5)');
  g.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Moon body
  ctx.fillStyle = '#fff2c7';
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Crater shading
  ctx.fillStyle = 'rgba(180,160,110,0.35)';
  ctx.beginPath(); ctx.arc(cx - w * 0.08, cy - w * 0.05, w * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + w * 0.07, cy + w * 0.06, w * 0.03, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + w * 0.02, cy - w * 0.09, w * 0.025, 0, Math.PI * 2); ctx.fill();
});

Assets.sprite('bat', 60, 40, (ctx, w, h) => {
  ctx.fillStyle = '#1a1026';
  // Body
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.55, w * 0.08, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wings
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.5);
  ctx.quadraticCurveTo(w * 0.25, h * 0.2, w * 0.08, h * 0.5);
  ctx.quadraticCurveTo(w * 0.2, h * 0.55, w * 0.3, h * 0.75);
  ctx.quadraticCurveTo(w * 0.4, h * 0.6, w * 0.5, h * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.5);
  ctx.quadraticCurveTo(w * 0.75, h * 0.2, w * 0.92, h * 0.5);
  ctx.quadraticCurveTo(w * 0.8, h * 0.55, w * 0.7, h * 0.75);
  ctx.quadraticCurveTo(w * 0.6, h * 0.6, w * 0.5, h * 0.65);
  ctx.closePath();
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#ff5522';
  ctx.beginPath(); ctx.arc(w * 0.46, h * 0.5, w * 0.015, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.54, h * 0.5, w * 0.015, 0, Math.PI * 2); ctx.fill();
});

Assets.sprite('pumpkin', 50, 50, (ctx, w, h) => {
  // Stem
  ctx.fillStyle = '#3a5a1a';
  ctx.fillRect(w * 0.45, h * 0.15, w * 0.1, h * 0.15);
  // Pumpkin body
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.6, w * 0.4, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ridges
  ctx.strokeStyle = '#c44a00';
  ctx.lineWidth = w * 0.03;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.35); ctx.quadraticCurveTo(w * 0.3, h * 0.6, w * 0.3, h * 0.85);
  ctx.moveTo(w * 0.7, h * 0.35); ctx.quadraticCurveTo(w * 0.7, h * 0.6, w * 0.7, h * 0.85);
  ctx.stroke();
  // Jack-o-lantern face
  ctx.fillStyle = '#fff0a0';
  // eyes (triangles)
  ctx.beginPath();
  ctx.moveTo(w * 0.33, h * 0.5); ctx.lineTo(w * 0.42, h * 0.5); ctx.lineTo(w * 0.37, h * 0.6);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.58, h * 0.5); ctx.lineTo(w * 0.67, h * 0.5); ctx.lineTo(w * 0.63, h * 0.6);
  ctx.closePath(); ctx.fill();
  // mouth
  ctx.beginPath();
  ctx.moveTo(w * 0.32, h * 0.72);
  ctx.lineTo(w * 0.4, h * 0.72); ctx.lineTo(w * 0.44, h * 0.78);
  ctx.lineTo(w * 0.5, h * 0.72); ctx.lineTo(w * 0.56, h * 0.78);
  ctx.lineTo(w * 0.6, h * 0.72); ctx.lineTo(w * 0.68, h * 0.72);
  ctx.lineTo(w * 0.6, h * 0.82); ctx.lineTo(w * 0.4, h * 0.82);
  ctx.closePath(); ctx.fill();
});

Assets.sprite('tombstone', 60, 70, (ctx, w, h) => {
  ctx.fillStyle = '#5a5f6a';
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.95);
  ctx.lineTo(w * 0.15, h * 0.4);
  ctx.quadraticCurveTo(w * 0.5, h * 0.05, w * 0.85, h * 0.4);
  ctx.lineTo(w * 0.85, h * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3a3f48';
  ctx.fillRect(w * 0.1, h * 0.9, w * 0.8, h * 0.08);
  ctx.fillStyle = '#2a2f38';
  ctx.font = `bold ${h * 0.18}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText('NU', w * 0.5, h * 0.55);
});

Assets.sprite('fence', 80, 50, (ctx, w, h) => {
  ctx.fillStyle = '#2a1f14';
  // Horizontal bars
  ctx.fillRect(0, h * 0.3, w, h * 0.08);
  ctx.fillRect(0, h * 0.6, w, h * 0.08);
  // Vertical pickets
  const n = 5;
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (w / n) - w * 0.04;
    ctx.fillRect(x, h * 0.1, w * 0.08, h * 0.85);
    // Pointed top
    ctx.beginPath();
    ctx.moveTo(x, h * 0.1);
    ctx.lineTo(x + w * 0.04, h * 0.02);
    ctx.lineTo(x + w * 0.08, h * 0.1);
    ctx.closePath();
    ctx.fill();
  }
});

Assets.sprite('nu_banner', 60, 80, (ctx, w, h) => {
  // Pole
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(w * 0.08, h * 0.05, w * 0.06, h * 0.9);
  // Banner
  ctx.fillStyle = '#1a3a7e';
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.1);
  ctx.lineTo(w * 0.92, h * 0.1);
  ctx.lineTo(w * 0.92, h * 0.68);
  ctx.lineTo(w * 0.53, h * 0.78);
  ctx.lineTo(w * 0.14, h * 0.68);
  ctx.closePath();
  ctx.fill();
  // Gold border
  ctx.strokeStyle = '#f4c430';
  ctx.lineWidth = w * 0.04;
  ctx.stroke();
  // NU text
  ctx.fillStyle = '#f4c430';
  ctx.font = `bold ${h * 0.3}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NU', w * 0.53, h * 0.42);
});

Assets.sprite('cloud', 120, 60, (ctx, w, h) => {
  ctx.fillStyle = 'rgba(60, 55, 85, 0.75)';
  ctx.beginPath();
  ctx.arc(w * 0.25, h * 0.6, h * 0.3, 0, Math.PI * 2);
  ctx.arc(w * 0.45, h * 0.45, h * 0.38, 0, Math.PI * 2);
  ctx.arc(w * 0.65, h * 0.5, h * 0.35, 0, Math.PI * 2);
  ctx.arc(w * 0.8, h * 0.62, h * 0.28, 0, Math.PI * 2);
  ctx.fill();
});
