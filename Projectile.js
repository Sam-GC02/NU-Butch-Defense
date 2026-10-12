// Projectile — flies right, hits first monster in its row.
class Projectile extends GameObject {
  constructor(x, y, speed, damage, row, kind, splash) {
    super(x - 10, y - 10, 20, 20);
    this.vx = speed;
    this.damage = damage;
    this.row = row;
    this.kind = kind;
    this.splash = !!splash;
    this.anim = 0;
    this.life = 2.0;
  }

  update(dt) {
    if (!window.game || window.game.state !== 'playing') return;
    this.anim += dt;
    this.x += this.vx * dt;
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }

    // Check collision with monsters in same row (or near row if splash on hit)
    const g = window.game;
    for (const m of g.monsters) {
      if (m.dead) continue;
      if (m.row !== this.row) continue;
      if (this.x + this.width > m.x + 6 && this.x < m.x + m.width - 10) {
        m.takeDamage(this.damage);
        g.spawnHitParticles(this.x + this.width / 2, this.y + this.height / 2, this.kind === 'mascot' ? '#f4c430' : '#ff69b4');
        if (this.splash) {
          // Hit adjacent rows weakly
          for (const m2 of g.monsters) {
            if (m2 === m || m2.dead) continue;
            if (Math.abs(m2.row - this.row) === 1 &&
                Math.abs((m2.x + m2.width / 2) - (this.x + this.width / 2)) < 80) {
              m2.takeDamage(this.damage * 0.5);
            }
          }
        }
        this.dead = true;
        return;
      }
    }

    // Off-screen right
    if (this.x > g.canvas.width + 40) this.dead = true;
  }

  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    if (this.kind === 'cheer') {
      // Pink pompom projectile
      ctx.fillStyle = '#ff69b4';
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + this.anim * 6;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === 'varsity') {
      // Football
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.anim * 8);
      ctx.fillStyle = '#8b4513';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
      ctx.moveTo(-4, -2); ctx.lineTo(-4, 2);
      ctx.moveTo(0, -2); ctx.lineTo(0, 2);
      ctx.moveTo(4, -2); ctx.lineTo(4, 2);
      ctx.stroke();
      ctx.restore();
    } else if (this.kind === 'mascot') {
      // Gold confetti burst
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#f4c430';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a3a7e';
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5 + this.anim * 10;
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(5, -2, 6, 4);
        ctx.restore();
      }
      ctx.restore();
    }
  }
}
