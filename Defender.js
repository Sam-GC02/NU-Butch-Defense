// Defender — placed on the grid; attacks monsters in its lane (except Banner, which only generates spirit).
class Defender extends GameObject {
  constructor(x, y, kind) {
    super(x - 36, y - 44, 72, 88);
    this.kind = kind;      // 'cheer' | 'varsity' | 'banner' | 'mascot'
    this.row = 0;
    this.col = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.cooldown = 0;
    this.anim = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    this.setupStats();
  }

  setupStats() {
    switch (this.kind) {
      case 'cheer':
        this.hp = this.maxHp = 100;
        this.attackRate = 1.4;    // seconds between shots
        this.damage = 20;
        this.projectileSpeed = 420;
        this.color = '#ff69b4';
        break;
      case 'varsity':
        this.hp = this.maxHp = 140;
        this.attackRate = 0.75;
        this.damage = 25;
        this.projectileSpeed = 520;
        this.color = '#1a3a7e';
        break;
      case 'banner':
        this.hp = this.maxHp = 220;
        this.attackRate = 0;      // doesn't attack
        this.damage = 0;
        this.generates = true;
        this.generateInterval = 8;
        this.generateTimer = 4;
        this.generateAmount = 25;
        this.color = '#f4c430';
        break;
      case 'mascot':
        this.hp = this.maxHp = 180;
        this.attackRate = 0.5;
        this.damage = 15;
        this.projectileSpeed = 600;
        this.splash = true;
        this.color = '#2a6ab0';
        break;
    }
  }

  update(dt) {
    this.anim += dt * 4;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (!window.game || window.game.state !== 'playing') return;

    if (this.generates) {
      this.generateTimer -= dt;
      if (this.generateTimer <= 0) {
        this.generateTimer = this.generateInterval;
        window.game.spawnBadgeFrom(this.cx, this.y + 10, this.generateAmount);
      }
      return;
    }

    if (this.attackRate > 0) {
      this.cooldown -= dt;
      if (this.cooldown <= 0 && window.game.anyMonsterInRow(this.row, this.cx)) {
        this.cooldown = this.attackRate;
        this.fire();
      }
    }
  }

  fire() {
    const px = this.cx + 20;
    const py = this.cy - 6;
    const p = new Projectile(px, py, this.projectileSpeed, this.damage, this.row, this.kind, this.splash);
    window.game.projectiles.push(p);
    window.game.entities.push(p);
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.hitFlash = 0.15;
    if (this.hp <= 0) {
      this.dead = true;
      window.game.onDefenderDied(this);
    }
  }

  draw(ctx) {
    const x = this.x, y = this.y, w = this.width, h = this.height;
    const bob = Math.sin(this.anim) * 2;

    ctx.save();
    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.6 + Math.sin(this.hitFlash * 40) * 0.3;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 4, w * 0.35, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);
    this.drawBody(ctx, x, y, w, h);
    ctx.restore();

    // HP bar
    if (this.hp < this.maxHp) {
      const bw = w * 0.8, bh = 4;
      const bx = x + (w - bw) / 2, by = y - 6;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.hp > this.maxHp * 0.5 ? '#4ade80' : (this.hp > this.maxHp * 0.25 ? '#fbbf24' : '#ef4444');
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    }
  }

  drawBody(ctx, x, y, w, h) {
    switch (this.kind) {
      case 'cheer': this.drawCheer(ctx, x, y, w, h); break;
      case 'varsity': this.drawVarsity(ctx, x, y, w, h); break;
      case 'banner': this.drawBanner(ctx, x, y, w, h); break;
      case 'mascot': this.drawMascot(ctx, x, y, w, h); break;
    }
  }

  // Cheerleader Butch - pink/white uniform with pompoms
  drawCheer(ctx, x, y, w, h) {
    const cx = x + w / 2;
    // Body (dress)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.22, y + h * 0.55);
    ctx.lineTo(cx + w * 0.22, y + h * 0.55);
    ctx.lineTo(cx + w * 0.3, y + h * 0.9);
    ctx.lineTo(cx - w * 0.3, y + h * 0.9);
    ctx.closePath();
    ctx.fill();
    // Chevron on dress
    ctx.fillStyle = '#1a3a7e';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.22, y + h * 0.6);
    ctx.lineTo(cx + w * 0.22, y + h * 0.6);
    ctx.lineTo(cx, y + h * 0.72);
    ctx.closePath();
    ctx.fill();
    // Head (bulldog)
    this.drawBulldogHead(ctx, cx, y + h * 0.3, w * 0.3, '#e8d4b0');
    // Pompoms
    const pomL = cx - w * 0.3 + Math.cos(this.anim) * 3;
    const pomR = cx + w * 0.3 - Math.cos(this.anim) * 3;
    const pomY = y + h * 0.5 + Math.sin(this.anim * 2) * 3;
    this.drawPompom(ctx, pomL, pomY, w * 0.14, '#ff69b4');
    this.drawPompom(ctx, pomR, pomY, w * 0.14, '#ff69b4');
    // Bow
    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    ctx.arc(cx - w * 0.12, y + h * 0.14, w * 0.06, 0, Math.PI * 2);
    ctx.arc(cx - w * 0.02, y + h * 0.14, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPompom(ctx, px, py, r, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < 7; i++) {
      const a = i * (Math.PI * 2 / 7);
      ctx.beginPath();
      ctx.arc(px + Math.cos(a) * r * 0.5, py + Math.sin(a) * r * 0.5, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px, py, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Varsity Butch - jersey with football
  drawVarsity(ctx, x, y, w, h) {
    const cx = x + w / 2;
    // Jersey
    ctx.fillStyle = '#1a3a7e';
    ctx.fillRect(cx - w * 0.26, y + h * 0.5, w * 0.52, h * 0.3);
    // Shorts
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - w * 0.24, y + h * 0.78, w * 0.48, h * 0.14);
    // Jersey number
    ctx.fillStyle = '#f4c430';
    ctx.font = `bold ${w * 0.18}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NU', cx, y + h * 0.63);
    // Head
    this.drawBulldogHead(ctx, cx, y + h * 0.3, w * 0.3, '#e8d4b0');
    // Football in hand (throw animation)
    const throwPhase = Math.sin(this.anim * 1.2);
    const fx = cx + w * 0.3 + throwPhase * 4;
    const fy = y + h * 0.55 - throwPhase * 4;
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.ellipse(fx, fy, w * 0.09, w * 0.055, Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx - w * 0.05, fy); ctx.lineTo(fx + w * 0.05, fy);
    ctx.stroke();
  }

  // NU Shield Banner - static banner that generates spirit
  drawBanner(ctx, x, y, w, h) {
    const cx = x + w / 2;
    // Pole
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(cx - w * 0.04, y + h * 0.1, w * 0.08, h * 0.85);
    // Pole top
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.1, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Shield banner
    const sway = Math.sin(this.anim * 0.5) * 2;
    ctx.save();
    ctx.translate(sway, 0);
    ctx.fillStyle = '#1a3a7e';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.28, y + h * 0.2);
    ctx.lineTo(cx + w * 0.28, y + h * 0.2);
    ctx.lineTo(cx + w * 0.28, y + h * 0.65);
    ctx.quadraticCurveTo(cx, y + h * 0.85, cx - w * 0.28, y + h * 0.65);
    ctx.closePath();
    ctx.fill();
    // Gold border
    ctx.strokeStyle = '#f4c430';
    ctx.lineWidth = 3;
    ctx.stroke();
    // NU text
    ctx.fillStyle = '#f4c430';
    ctx.font = `bold ${w * 0.22}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NU', cx, y + h * 0.46);
    // Star
    this.drawStar(ctx, cx, y + h * 0.68, w * 0.06, '#f4c430');
    ctx.restore();
  }

  drawStar(ctx, sx, sy, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      const px = sx + Math.cos(a) * rr;
      const py = sy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Blue & Gold Mascot - big mascot throwing confetti
  drawMascot(ctx, x, y, w, h) {
    const cx = x + w / 2;
    // Body (big mascot suit)
    ctx.fillStyle = '#1a3a7e';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.65, w * 0.33, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Gold belly stripe
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.7, w * 0.18, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a3a7e';
    ctx.font = `bold ${w * 0.14}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NU', cx, y + h * 0.71);
    // Mascot head (big bulldog)
    this.drawBulldogHead(ctx, cx, y + h * 0.27, w * 0.36, '#f4c430');
    // Arms waving
    ctx.fillStyle = '#1a3a7e';
    const armSwing = Math.sin(this.anim * 2) * 0.4;
    ctx.save();
    ctx.translate(cx - w * 0.32, y + h * 0.55);
    ctx.rotate(-0.5 + armSwing);
    ctx.fillRect(-w * 0.05, 0, w * 0.1, h * 0.22);
    ctx.restore();
    ctx.save();
    ctx.translate(cx + w * 0.32, y + h * 0.55);
    ctx.rotate(0.5 - armSwing);
    ctx.fillRect(-w * 0.05, 0, w * 0.1, h * 0.22);
    ctx.restore();
  }

  drawBulldogHead(ctx, cx, cy, r, color) {
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ears
    ctx.fillStyle = '#b89a70';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.75, cy - r * 0.3, r * 0.22, r * 0.3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.75, cy - r * 0.3, r * 0.22, r * 0.3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Jowls
    ctx.fillStyle = '#f0e0c0';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.2, cy + r * 0.35, r * 0.28, r * 0.22, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + r * 0.2, cy + r * 0.35, r * 0.28, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.1, r * 0.14, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 0.1, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.08, r * 0.07, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 0.08, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    // Nose
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.2, r * 0.18, r * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.35);
    ctx.lineTo(cx, cy + r * 0.5);
    ctx.stroke();
    // Tiny tooth
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - r * 0.06, cy + r * 0.45, r * 0.05, r * 0.1);
    ctx.fillRect(cx + r * 0.01, cy + r * 0.45, r * 0.05, r * 0.1);
  }
}
