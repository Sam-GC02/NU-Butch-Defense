// Monster — advances right-to-left down a lane; takes damage from projectiles; attacks defenders.
class Monster extends GameObject {
  constructor(x, y, kind, row) {
    super(x - 32, y - 56, 64, 76);
    this.kind = kind;    // 'ghost' | 'zombie' | 'skeleton' | 'pumpkinBoss'
    this.row = row;
    this.speed = 30;
    this.attackRate = 1.0;
    this.cooldown = 0;
    this.damage = 10;
    this.target = null;
    this.anim = Math.random() * Math.PI * 2;
    this.hitFlash = 0;
    this.setupStats();
    this.hp = this.maxHp;
  }

  setupStats() {
    switch (this.kind) {
      case 'ghost':
        this.maxHp = 60;
        this.speed = 36;
        this.damage = 10;
        this.attackRate = 1.2;
        this.width = 60; this.height = 72;
        break;
      case 'zombie':
        this.maxHp = 120;
        this.speed = 24;
        this.damage = 12;
        this.attackRate = 1.0;
        this.width = 68; this.height = 80;
        break;
      case 'skeleton':
        this.maxHp = 90;
        this.speed = 42;
        this.damage = 10;
        this.attackRate = 0.8;
        this.width = 60; this.height = 80;
        break;
      case 'pumpkinBoss':
        this.maxHp = 1600;
        this.speed = 16;
        this.damage = 40;
        this.attackRate = 1.4;
        this.width = 140; this.height = 160;
        this.y -= 80; // taller
        break;
    }
  }

  update(dt) {
    if (!window.game || window.game.state !== 'playing') return;
    this.anim += dt * 4;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    // Find defender in same lane blocking us
    const g = window.game;
    const defender = g.defenderBlocking(this);
    if (defender) {
      this.target = defender;
      this.cooldown -= dt;
      if (this.cooldown <= 0) {
        this.cooldown = this.attackRate;
        defender.takeDamage(this.damage);
      }
    } else {
      this.target = null;
      this.x -= this.speed * dt;
    }

    // Reached the left edge (home base)
    if (this.x + this.width * 0.3 <= g.gridLeft - 40) {
      g.onMonsterReachedHome();
      this.dead = true;
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.hitFlash = 0.12;
    if (this.hp <= 0) {
      this.dead = true;
      window.game.onMonsterKilled(this);
    }
  }

  draw(ctx) {
    const x = this.x, y = this.y, w = this.width, h = this.height;
    const bob = Math.sin(this.anim) * 2;
    ctx.save();
    if (this.hitFlash > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(this.hitFlash * 50) * 0.4;
    }
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 4, w * 0.35, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);
    switch (this.kind) {
      case 'ghost': this.drawGhost(ctx, x, y, w, h); break;
      case 'zombie': this.drawZombie(ctx, x, y, w, h); break;
      case 'skeleton': this.drawSkeleton(ctx, x, y, w, h); break;
      case 'pumpkinBoss': this.drawPumpkinBoss(ctx, x, y, w, h); break;
    }
    ctx.restore();

    // HP bar
    if (this.hp < this.maxHp) {
      const bw = w * 0.9, bh = this.kind === 'pumpkinBoss' ? 7 : 4;
      const bx = x + (w - bw) / 2, by = y - 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.hp > this.maxHp * 0.5 ? '#4ade80' : (this.hp > this.maxHp * 0.25 ? '#fbbf24' : '#ef4444');
      ctx.fillRect(bx, by, bw * (this.hp / this.maxHp), bh);
    }
  }

  drawGhost(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const wobble = Math.sin(this.anim * 1.5) * 2;
    ctx.fillStyle = 'rgba(230, 230, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.35, w * 0.42, Math.PI, 0);
    ctx.lineTo(cx + w * 0.42, y + h * 0.85);
    // Scalloped bottom
    const scallops = 4;
    for (let i = 0; i < scallops; i++) {
      const t = (i + 1) / scallops;
      const sx = cx + w * 0.42 - w * 0.84 * t;
      const sy = y + h * 0.85 + (i % 2 === 0 ? w * 0.08 : -w * 0.02) + wobble;
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(cx - w * 0.42, y + h * 0.85);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx - w * 0.14, y + h * 0.3, w * 0.07, w * 0.1, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + w * 0.14, y + h * 0.3, w * 0.07, w * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.5, w * 0.08, w * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawZombie(ctx, x, y, w, h) {
    const cx = x + w / 2;
    // Legs
    ctx.fillStyle = '#4a3a2a';
    const legOffset = Math.sin(this.anim * 2) * 3;
    ctx.fillRect(cx - w * 0.18, y + h * 0.72, w * 0.12, h * 0.26);
    ctx.fillRect(cx + w * 0.06, y + h * 0.72, w * 0.12, h * 0.26);
    // Shirt (tattered)
    ctx.fillStyle = '#6a3a2a';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.26, y + h * 0.42);
    ctx.lineTo(cx + w * 0.26, y + h * 0.42);
    ctx.lineTo(cx + w * 0.3, y + h * 0.74);
    ctx.lineTo(cx + w * 0.15, y + h * 0.72);
    ctx.lineTo(cx + w * 0.08, y + h * 0.78);
    ctx.lineTo(cx - w * 0.08, y + h * 0.72);
    ctx.lineTo(cx - w * 0.18, y + h * 0.76);
    ctx.lineTo(cx - w * 0.3, y + h * 0.74);
    ctx.closePath();
    ctx.fill();
    // Arms outstretched
    ctx.fillStyle = '#7ab85a';
    ctx.fillRect(cx - w * 0.5, y + h * 0.46 + legOffset, w * 0.2, h * 0.1);
    ctx.fillRect(cx + w * 0.3, y + h * 0.46 - legOffset, w * 0.2, h * 0.1);
    // Head
    ctx.fillStyle = '#7ab85a';
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.28, w * 0.24, 0, Math.PI * 2);
    ctx.fill();
    // Hair
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.17, w * 0.22, Math.PI, 0);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - w * 0.09, y + h * 0.28, w * 0.05, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.09, y + h * 0.28, w * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c00';
    ctx.beginPath();
    ctx.arc(cx - w * 0.09, y + h * 0.29, w * 0.025, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.09, y + h * 0.29, w * 0.025, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    ctx.strokeStyle = '#2a1a10';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.08, y + h * 0.38);
    ctx.lineTo(cx + w * 0.08, y + h * 0.38);
    ctx.stroke();
    // Tooth
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - w * 0.02, y + h * 0.38, w * 0.03, h * 0.04);
  }

  drawSkeleton(ctx, x, y, w, h) {
    const cx = x + w / 2;
    // Legs (bones)
    ctx.strokeStyle = '#e8e8d8';
    ctx.lineWidth = 4;
    const legSwing = Math.sin(this.anim * 2.5) * 3;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, y + h * 0.65);
    ctx.lineTo(cx - w * 0.12 + legSwing * 0.3, y + h * 0.96);
    ctx.moveTo(cx + w * 0.1, y + h * 0.65);
    ctx.lineTo(cx + w * 0.12 - legSwing * 0.3, y + h * 0.96);
    ctx.stroke();
    // Ribcage
    ctx.fillStyle = '#e8e8d8';
    ctx.beginPath();
    ctx.ellipse(cx, y + h * 0.55, w * 0.22, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Rib lines
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const ry = y + h * (0.44 + i * 0.07);
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.18, ry);
      ctx.lineTo(cx + w * 0.18, ry);
      ctx.stroke();
    }
    // Arms with bony fingers forward
    ctx.strokeStyle = '#e8e8d8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.2, y + h * 0.48);
    ctx.lineTo(cx - w * 0.42, y + h * 0.55 + legSwing * 0.5);
    ctx.moveTo(cx + w * 0.2, y + h * 0.48);
    ctx.lineTo(cx + w * 0.42, y + h * 0.55 - legSwing * 0.5);
    ctx.stroke();
    // Skull
    ctx.fillStyle = '#f0f0e0';
    ctx.beginPath();
    ctx.arc(cx, y + h * 0.25, w * 0.22, 0, Math.PI * 2);
    ctx.fill();
    // Jaw
    ctx.fillRect(cx - w * 0.14, y + h * 0.33, w * 0.28, h * 0.08);
    // Eye sockets
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - w * 0.09, y + h * 0.24, w * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.09, y + h * 0.24, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Glow in sockets
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.arc(cx - w * 0.09, y + h * 0.24, w * 0.025, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.09, y + h * 0.24, w * 0.025, 0, Math.PI * 2);
    ctx.fill();
    // Teeth
    ctx.fillStyle = '#f0f0e0';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(cx - w * 0.12 + i * w * 0.07, y + h * 0.35, w * 0.04, h * 0.05);
    }
  }

  drawPumpkinBoss(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h * 0.55;
    // Giant pumpkin body
    const pulse = 1 + Math.sin(this.anim * 1.5) * 0.03;
    // Stem
    ctx.fillStyle = '#2a4a1a';
    ctx.fillRect(cx - w * 0.08, y + h * 0.1, w * 0.16, h * 0.14);
    // Body
    ctx.fillStyle = '#ff5a0a';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.45 * pulse, h * 0.4 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ridges
    ctx.strokeStyle = '#b03000';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.ellipse(cx + i * w * 0.14, cy, w * 0.12, h * 0.38 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Evil face - flaming eyes
    const flameFlicker = Math.sin(this.anim * 8) * 0.3 + 1;
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.2, cy - h * 0.05);
    ctx.lineTo(cx - w * 0.05, cy - h * 0.05);
    ctx.lineTo(cx - w * 0.12, cy + h * 0.1 * flameFlicker);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.2, cy - h * 0.05);
    ctx.lineTo(cx + w * 0.05, cy - h * 0.05);
    ctx.lineTo(cx + w * 0.12, cy + h * 0.1 * flameFlicker);
    ctx.closePath();
    ctx.fill();
    // Flame glow inside eyes
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(cx - w * 0.12, cy, w * 0.03, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.12, cy, w * 0.03, 0, Math.PI * 2);
    ctx.fill();
    // Jagged mouth
    ctx.fillStyle = '#1a0000';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.25, cy + h * 0.18);
    const teeth = 8;
    for (let i = 0; i <= teeth; i++) {
      const t = i / teeth;
      const tx = cx - w * 0.25 + w * 0.5 * t;
      const ty = cy + h * 0.18 + (i % 2 === 0 ? h * 0.08 : 0);
      ctx.lineTo(tx, ty);
    }
    ctx.lineTo(cx + w * 0.25, cy + h * 0.18);
    ctx.lineTo(cx + w * 0.22, cy + h * 0.3);
    ctx.lineTo(cx - w * 0.22, cy + h * 0.3);
    ctx.closePath();
    ctx.fill();
    // Fangs
    ctx.fillStyle = '#ffdd99';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.14, cy + h * 0.19);
    ctx.lineTo(cx - w * 0.08, cy + h * 0.19);
    ctx.lineTo(cx - w * 0.11, cy + h * 0.29);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.08, cy + h * 0.19);
    ctx.lineTo(cx + w * 0.14, cy + h * 0.19);
    ctx.lineTo(cx + w * 0.11, cy + h * 0.29);
    ctx.closePath();
    ctx.fill();
  }
}
