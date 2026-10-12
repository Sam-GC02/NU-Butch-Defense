// Badge — falls from the sky OR drops from a Banner defender; click/tap to collect Spirit Points.
class Badge extends GameObject {
  constructor(x, y, amount) {
    super(x - 22, y - 22, 44, 44);
    this.amount = amount || 25;
    this.vy = 0;
    this.vx = 0;
    this.landed = false;
    this.landY = 0;
    this.life = 10;
    this.anim = Math.random() * Math.PI * 2;
    this.collected = false;
  }

  update(dt) {
    this.anim += dt * 3;
    if (!this.landed) {
      this.vy += 220 * dt;
      this.vx *= 0.98;
      this.y += this.vy * dt;
      this.x += this.vx * dt;
      if (this.y >= this.landY) {
        this.y = this.landY;
        this.landed = true;
        this.vy = 0;
      }
    } else {
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
    }
  }

  tryCollect(mx, my) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const d = Math.hypot(mx - cx, my - cy);
    if (d <= this.width * 0.7) {
      this.collect();
      return true;
    }
    return false;
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.dead = true;
    window.game.addSpirit(this.amount);
    window.game.spawnCollectFx(this.x + this.width / 2, this.y + this.height / 2, this.amount);
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.width / 2;
    const flash = this.landed && this.life < 3 ? (Math.sin(this.life * 10) * 0.4 + 0.6) : 1;

    ctx.save();
    ctx.globalAlpha = flash;
    // Outer glow
    const g = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.3);
    g.addColorStop(0, 'rgba(244, 196, 48, 0.6)');
    g.addColorStop(1, 'rgba(244, 196, 48, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Badge shape (gold shield)
    ctx.fillStyle = '#f4c430';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    // Inner darker
    ctx.strokeStyle = '#b48a10';
    ctx.lineWidth = 3;
    ctx.stroke();
    // NU text
    ctx.fillStyle = '#1a3a7e';
    ctx.font = `bold ${r * 0.9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NU', cx, cy);
    // Spin shine
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, this.anim, this.anim + Math.PI * 0.4);
    ctx.stroke();
    ctx.restore();
  }
}
