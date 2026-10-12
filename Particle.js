// Visual-only particle (hit sparks, badge collect, text popups).
class Particle extends GameObject {
  constructor(x, y, opts) {
    super(x - 4, y - 4, 8, 8);
    opts = opts || {};
    this.vx = opts.vx || 0;
    this.vy = opts.vy || 0;
    this.gravity = opts.gravity || 0;
    this.life = opts.life || 0.6;
    this.maxLife = this.life;
    this.color = opts.color || '#f4c430';
    this.size = opts.size || 5;
    this.text = opts.text || null;
    this.font = opts.font || 'bold 1rem sans-serif';
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.text) {
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = this.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(this.text, this.x, this.y);
      ctx.fillText(this.text, this.x, this.y);
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
