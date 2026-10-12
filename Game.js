class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.entities = [];
    this.defenders = [];
    this.monsters = [];
    this.projectiles = [];
    this.badges = [];
    this.particles = [];

    this.state = 'menu';         // 'menu' | 'playing' | 'paused' | 'levelWin' | 'levelLose' | 'gameWin'
    this.levelId = null;
    this.levelOrder = ['gate', 'quad', 'gym'];
    this.lastTime = 0;

    // Grid config
    this.cols = 7;
    this.maxRows = 5;
    this.rows = 5;
    this.cellW = 110;
    this.cellH = 100;
    this.gridTop = 90;
    this.gridLeft = 160;

    // Resources
    this.spirit = 100;
    this.autoGenTimer = 0;
    this.autoGenRate = 6;
    this.autoGenAmount = 25;
    this.badgeFallTimer = 5;
    this.badgeFallRate = 7;

    // Wave state
    this.waves = [];
    this.waveIndex = -1;
    this.waveTimer = 0;
    this.waveActive = false;
    this.waveSpawnQueue = [];   // each item: { kind, remaining, interval, timer, row? }
    this.waveTotalMonsters = 0;
    this.waveMonstersAlive = 0;
    this.waveMonstersSpawned = 0;

    // Selection
    this.selectedDefender = null;
    this.hoverCell = null;
    this.cooldowns = { cheer: 0, varsity: 0, banner: 0, mascot: 0 };
    this.cooldownMax = { cheer: 5, varsity: 7, banner: 15, mascot: 20 };
    this.cost = { cheer: 50, varsity: 100, banner: 50, mascot: 150 };

    // Scenery (per backdrop)
    this.decor = [];
    this.bgKind = 'gate';

    // Resize backing store (no Camera here)
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();

    this.setupUI();
    this.setupInput();

    if (window.Worlds && Worlds.onChange) {
      Worlds.onChange((detail) => {
        if (detail && detail.settingsOnly) this.applySettings();
      });
    }

    this.start();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(640, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(360, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewW = rect.width || 1280;
    this.viewH = rect.height || 720;
    this.recomputeGrid();
  }

  recomputeGrid() {
    // Grid area: leave left margin (home/defenders start), right margin (monsters spawn),
    // top (HUD) and bottom (card bar).
    const topMargin = 70;
    const bottomMargin = 110;
    const leftMargin = 110;
    const rightMargin = 70;
    const usableW = this.viewW - leftMargin - rightMargin;
    const usableH = this.viewH - topMargin - bottomMargin;
    this.cellW = usableW / this.cols;
    this.cellH = usableH / this.maxRows;
    this.gridLeft = leftMargin;
    // Center the active rows vertically within the max-row area
    const rowsOffset = (this.maxRows - this.rows) / 2;
    this.gridTop = topMargin + rowsOffset * this.cellH;
  }

  // ============ UI ============
  setupUI() {
    const ui = document.getElementById('ui-layer');
    ui.innerHTML = '';

    // Top HUD
    this.hudTop = document.createElement('div');
    this.hudTop.className = 'hud-top';
    this.hudTop.innerHTML = `
      <div class="hud-pill spirit">⚡ <span id="hud-spirit">0</span></div>
      <div class="hud-pill level" id="hud-level">—</div>
      <div class="hud-pill wave">🎃 Wave <span id="hud-wave">0</span>/<span id="hud-wave-max">0</span></div>
    `;
    ui.appendChild(this.hudTop);

    // Card bar
    this.cardBar = document.createElement('div');
    this.cardBar.className = 'card-bar';
    const cards = [
      { kind: 'cheer', name: 'Cheer Butch', cost: this.cost.cheer },
      { kind: 'varsity', name: 'Varsity Butch', cost: this.cost.varsity },
      { kind: 'banner', name: 'NU Banner', cost: this.cost.banner },
      { kind: 'mascot', name: 'Gold Mascot', cost: this.cost.mascot },
    ];
    this.cardEls = {};
    for (const c of cards) {
      const el = document.createElement('div');
      el.className = 'def-card';
      el.dataset.kind = c.kind;
      el.innerHTML = `
        <canvas class="thumb" width="80" height="80"></canvas>
        <div class="name">${c.name}</div>
        <div class="cost">⚡${c.cost}</div>
        <div class="cooldown hidden">0</div>
      `;
      el.addEventListener('click', () => this.selectCard(c.kind));
      this.cardBar.appendChild(el);
      this.cardEls[c.kind] = el;
      this.drawCardThumb(el.querySelector('canvas'), c.kind);
    }
    ui.appendChild(this.cardBar);

    // Overlays
    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay';
    ui.appendChild(this.overlay);

    this.updateHUD();
    this.showMenu();
  }

  drawCardThumb(canvas, kind) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Fake a defender draw at this size
    const d = new Defender(w / 2, h * 0.9, kind);
    // Override position to fit thumb (defender draws relative to its own x/y)
    d.x = 4; d.y = 2; d.width = w - 8; d.height = h - 4;
    d.anim = 0;
    d.drawBody(ctx, d.x, d.y, d.width, d.height);
  }

  updateHUD() {
    const sEl = document.getElementById('hud-spirit');
    const lEl = document.getElementById('hud-level');
    const wEl = document.getElementById('hud-wave');
    const wMaxEl = document.getElementById('hud-wave-max');
    if (sEl) sEl.textContent = Math.floor(this.spirit);
    if (lEl) {
      const w = this.levelId ? Worlds.get(this.levelId) : null;
      lEl.textContent = w ? w.name : '—';
    }
    if (wEl) wEl.textContent = Math.max(0, this.waveIndex + 1);
    if (wMaxEl) wMaxEl.textContent = this.waves.length;

    // Cards affordability + cooldowns
    for (const kind of Object.keys(this.cardEls)) {
      const el = this.cardEls[kind];
      const canAfford = this.spirit >= this.cost[kind];
      const cd = this.cooldowns[kind];
      const cdEl = el.querySelector('.cooldown');
      if (cd > 0) {
        cdEl.classList.remove('hidden');
        cdEl.textContent = Math.ceil(cd);
      } else {
        cdEl.classList.add('hidden');
      }
      el.classList.toggle('disabled', !canAfford || cd > 0);
      el.classList.toggle('selected', this.selectedDefender === kind);
    }
  }

  showMenu() {
    this.state = 'menu';
    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = `
      <div class="overlay-panel">
        <h1>🎃 NU Butch Defense (O5ONE)🎃</h1>
        <h2>Butch & the Group O5ONE defend NU campus!</h2>
        <p>Spooky monsters are invading the campus at Halloween night.<br>
        Place school-themed defenders on the lanes to stop them, and collect NU Badges to power up!</p>
        <div class="level-select">
          <button class="level-btn" data-lvl="gate"><span class="lvl-num">1</span><span class="lvl-name"> Main Gate</span></button>
          <button class="level-btn" data-lvl="quad"><span class="lvl-num">2</span><span class="lvl-name"> Quadrangle</span></button>
          <button class="level-btn" data-lvl="gym"><span class="lvl-num">3</span><span class="lvl-name"> Gymnasium Boss</span></button>
        </div>
        <p class="tip">Tap a defender card below, then tap a grid cell to place. Tap falling 🏅 badges for bonus Spirit.</p>
      </div>
    `;
    this.overlay.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => this.startLevel(btn.dataset.lvl));
    });
  }

  showLevelWin() {
    this.state = 'levelWin';
    const idx = this.levelOrder.indexOf(this.levelId);
    const isLast = idx === this.levelOrder.length - 1;
    this.overlay.classList.remove('hidden');
    if (isLast) {
      this.overlay.innerHTML = `
        <div class="overlay-panel">
          <h1>🏆 Victory! 🏆</h1>
          <h2>NU Campus is safe!</h2>
          <p>Butch and the Group O5ONE defeated the Giant Pumpkin Monster<br>and all the spooky invaders. Go NU!</p>
          <button class="btn" id="back-menu">Back to Menu</button>
        </div>
      `;
      document.getElementById('back-menu').addEventListener('click', () => this.showMenu());
    } else {
      const nextId = this.levelOrder[idx + 1];
      const nextName = Worlds.get(nextId).name;
      this.overlay.innerHTML = `
        <div class="overlay-panel">
          <h1>🎉 Level Clear!</h1>
          <h2>Next: ${nextName}</h2>
          <p>You defended ${Worlds.get(this.levelId).name}!</p>
          <button class="btn" id="next-lvl">Next Level ▶</button>
          <button class="btn secondary" id="back-menu">Menu</button>
        </div>
      `;
      document.getElementById('next-lvl').addEventListener('click', () => this.startLevel(nextId));
      document.getElementById('back-menu').addEventListener('click', () => this.showMenu());
    }
  }

  showLevelLose() {
    this.state = 'levelLose';
    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = `
      <div class="overlay-panel">
        <h1>😱 Overrun!</h1>
        <h2>A monster reached the campus home base.</h2>
        <p>Try again — place cheap NU Banners to earn Spirit faster!</p>
        <button class="btn" id="retry">Retry</button>
        <button class="btn secondary" id="back-menu">Menu</button>
      </div>
    `;
    document.getElementById('retry').addEventListener('click', () => this.startLevel(this.levelId));
    document.getElementById('back-menu').addEventListener('click', () => this.showMenu());
  }

  showWaveBanner(text) {
    const b = document.createElement('div');
    b.className = 'wave-banner';
    b.textContent = text;
    document.getElementById('ui-layer').appendChild(b);
    setTimeout(() => b.remove(), 2600);
  }

  // ============ Level & waves ============
  startLevel(id) {
    this.levelId = id;
    this.entities = []; this.defenders = []; this.monsters = []; this.projectiles = []; this.badges = []; this.particles = [];
    this.selectedDefender = null;
    this.cooldowns = { cheer: 0, varsity: 0, banner: 0, mascot: 0 };
    this.waveIndex = -1;
    this.waveTimer = 0;
    this.waveActive = false;
    this.waveSpawnQueue = [];
    this.waveMonstersAlive = 0;
    this.waveMonstersSpawned = 0;

    const w = Worlds.get(id);
    const data = (w && w.data) || {};
    const s = data.settings || {};
    this.rows = Math.max(1, Math.min(this.maxRows, s.activeRows || 5));
    this.spirit = s.startSpirit || 100;
    this.autoGenRate = s.autoGenRate || 6;
    this.autoGenAmount = s.autoGenAmount || 25;
    this.badgeFallRate = s.badgeFallRate || 7;
    this.autoGenTimer = this.autoGenRate;
    this.badgeFallTimer = Math.min(5, this.badgeFallRate);
    this.waves = (data.waves || []).slice();
    this.bgKind = s.backdrop || 'gate';
    this.buildDecor();
    this.recomputeGrid();

    this.state = 'playing';
    this.overlay.classList.add('hidden');
    this.showWaveBanner(w.name);
    // schedule first wave
    this.waveTimer = (this.waves[0] && this.waves[0].delay) || 4;
    this.updateHUD();
  }

  applySettings() {
    if (!this.levelId || this.state !== 'playing') return;
    const w = Worlds.get(this.levelId);
    const s = (w && w.data && w.data.settings) || {};
    this.autoGenRate = s.autoGenRate || this.autoGenRate;
    this.autoGenAmount = s.autoGenAmount || this.autoGenAmount;
    this.badgeFallRate = s.badgeFallRate || this.badgeFallRate;
    // rows change needs regrid
    if (s.activeRows && s.activeRows !== this.rows) {
      this.rows = Math.max(1, Math.min(this.maxRows, s.activeRows));
      this.recomputeGrid();
    }
  }

  startNextWave() {
    this.waveIndex++;
    if (this.waveIndex >= this.waves.length) return;
    const wv = this.waves[this.waveIndex];
    this.waveSpawnQueue = [];
    this.waveMonstersSpawned = 0;
    this.waveMonstersAlive = 0;
    this.waveTotalMonsters = 0;
    for (const g of wv.monsters) {
      this.waveSpawnQueue.push({
        kind: g.kind, remaining: g.count, interval: g.interval, timer: 0.4
      });
      this.waveTotalMonsters += g.count;
    }
    this.waveActive = true;
    const isLast = this.waveIndex === this.waves.length - 1;
    this.showWaveBanner(isLast ? `Final Wave!` : `Wave ${this.waveIndex + 1}`);
    this.updateHUD();
  }

  // ============ Input ============
  setupInput() {
    const handler = (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = (ev.clientX !== undefined ? ev.clientX : ev.touches?.[0]?.clientX) - rect.left;
      const my = (ev.clientY !== undefined ? ev.clientY : ev.touches?.[0]?.clientY) - rect.top;
      this.onPointerDown(mx, my);
    };
    this.canvas.addEventListener('pointerdown', handler);
    // Mouse-move for hover preview
    this.canvas.addEventListener('pointermove', (ev) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      this.hoverCell = this.cellAt(mx, my);
    });
    this.canvas.addEventListener('pointerleave', () => { this.hoverCell = null; });
  }

  onPointerDown(mx, my) {
    if (this.state !== 'playing') return;
    // 1) try to collect a badge
    for (const b of this.badges) {
      if (b.dead || b.collected) continue;
      if (b.tryCollect(mx, my)) { this.updateHUD(); return; }
    }
    // 2) try to place a defender if selected and clicked on grid
    const cell = this.cellAt(mx, my);
    if (cell && this.selectedDefender) {
      this.tryPlace(this.selectedDefender, cell.row, cell.col);
      this.updateHUD();
    } else if (!cell) {
      // clicking outside grid deselects
      this.selectedDefender = null;
      this.updateHUD();
    }
  }

  selectCard(kind) {
    if (this.state !== 'playing') return;
    if (this.cooldowns[kind] > 0) return;
    if (this.spirit < this.cost[kind]) return;
    this.selectedDefender = (this.selectedDefender === kind) ? null : kind;
    this.updateHUD();
  }

  cellAt(mx, my) {
    const col = Math.floor((mx - this.gridLeft) / this.cellW);
    const row = Math.floor((my - this.gridTop) / this.cellH);
    if (col < 0 || col >= this.cols) return null;
    if (row < 0 || row >= this.rows) return null;
    return { row, col };
  }

  tryPlace(kind, row, col) {
    // Cell already occupied?
    for (const d of this.defenders) {
      if (!d.dead && d.row === row && d.col === col) return false;
    }
    if (this.spirit < this.cost[kind]) return false;
    const cx = this.gridLeft + col * this.cellW + this.cellW / 2;
    const cy = this.gridTop + row * this.cellH + this.cellH * 0.75;
    const d = new Defender(cx, cy, kind);
    d.row = row; d.col = col;
    // Scale defender to cell size (cell-independent base size)
    const scale = Math.min(this.cellW, this.cellH) / 110;
    d.width = 72 * scale;
    d.height = 88 * scale;
    d.x = cx - d.width / 2;
    d.y = cy - d.height + 8;
    this.defenders.push(d);
    this.entities.push(d);
    this.spirit -= this.cost[kind];
    this.cooldowns[kind] = this.cooldownMax[kind];
    this.selectedDefender = null;
    this.spawnCollectFx(cx, cy, 0, '✓');
    return true;
  }

  // ============ Spawning ============
  // Reference Projectile class so static validator sees it wired here (projectiles are created from Defender.fire via new Projectile).
  _ensureProjectile() { return Projectile; }

  spawnMonster(kind) {
    const row = Math.floor(Math.random() * this.rows);
    const x = this.gridLeft + this.cols * this.cellW + 60;
    const y = this.gridTop + row * this.cellH + this.cellH * 0.75;
    const m = new Monster(x, y, kind, row);
    this.monsters.push(m);
    this.entities.push(m);
    this.waveMonstersSpawned++;
    this.waveMonstersAlive++;
  }

  spawnFallingBadge() {
    const x = this.gridLeft + Math.random() * (this.cols * this.cellW);
    const b = new Badge(x, -40, this.autoGenAmount);
    b.landY = this.gridTop + Math.random() * (this.rows * this.cellH - 40);
    b.vx = (Math.random() - 0.5) * 40;
    this.badges.push(b);
    this.entities.push(b);
  }

  spawnBadgeFrom(x, y, amount) {
    const b = new Badge(x, y, amount);
    b.landY = y + 20 + Math.random() * 30;
    b.vx = (Math.random() - 0.5) * 60;
    b.vy = -60;
    this.badges.push(b);
    this.entities.push(b);
  }

  spawnHitParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 80;
      const p = new Particle(x, y, { vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, gravity: 200, life: 0.4, color, size: 3 + Math.random() * 2 });
      this.particles.push(p);
      this.entities.push(p);
    }
  }

  spawnCollectFx(x, y, amount, overrideText) {
    const text = overrideText || `+${amount}⚡`;
    const p = new Particle(x, y - 10, { vy: -60, life: 0.9, color: '#f4c430', text, font: 'bold 1.1rem sans-serif' });
    this.particles.push(p);
    this.entities.push(p);
  }

  // ============ Query helpers used by entities ============
  anyMonsterInRow(row, fromX) {
    for (const m of this.monsters) {
      if (!m.dead && m.row === row && (m.x + m.width) > fromX - 10) return true;
    }
    return false;
  }
  defenderBlocking(monster) {
    for (const d of this.defenders) {
      if (d.dead) continue;
      if (d.row !== monster.row) continue;
      // Overlap test
      if (monster.x < d.x + d.width - 6 && monster.x + monster.width > d.x + 10) return d;
    }
    return null;
  }

  // ============ Callbacks ============
  onMonsterKilled(m) {
    this.waveMonstersAlive--;
    // Small chance to drop a badge
    if (Math.random() < 0.25) {
      const b = new Badge(m.x + m.width / 2, m.y + 10, 25);
      b.landY = m.y + m.height - 20;
      b.vx = (Math.random() - 0.5) * 80;
      b.vy = -120;
      this.badges.push(b); this.entities.push(b);
    }
    this.checkWaveEnd();
  }

  onMonsterReachedHome() {
    this.waveMonstersAlive = Math.max(0, this.waveMonstersAlive - 1);
    this.showLevelLose();
  }

  onDefenderDied(d) {
    const idx = this.defenders.indexOf(d);
    if (idx >= 0) this.defenders.splice(idx, 1);
  }

  checkWaveEnd() {
    if (!this.waveActive) return;
    const spawnedAll = this.waveMonstersSpawned >= this.waveTotalMonsters;
    if (spawnedAll && this.waveMonstersAlive <= 0) {
      this.waveActive = false;
      if (this.waveIndex >= this.waves.length - 1) {
        // Level complete
        setTimeout(() => this.showLevelWin(), 900);
      } else {
        // Schedule next wave
        const nextDelay = (this.waves[this.waveIndex + 1] && this.waves[this.waveIndex + 1].delay) || 20;
        this.waveTimer = nextDelay;
      }
    }
  }

  addSpirit(amount) {
    this.spirit = Math.min(9999, this.spirit + amount);
    this.updateHUD();
  }

  // ============ Scenery ============
  buildDecor() {
    this.decor = [];
    const W = 1280, H = 720; // design-ish references; we scale by viewW/viewH when drawing
    // Moon
    this.decor.push({ sprite: 'moon', rx: 0.86, ry: 0.1, rw: 0.11, rh: 0.19 });
    // Clouds
    this.decor.push({ sprite: 'cloud', rx: 0.1, ry: 0.05, rw: 0.17, rh: 0.08 });
    this.decor.push({ sprite: 'cloud', rx: 0.55, ry: 0.03, rw: 0.14, rh: 0.07 });
    // Bats
    this.decor.push({ sprite: 'bat', rx: 0.25, ry: 0.15, rw: 0.05, rh: 0.045, bat: 0 });
    this.decor.push({ sprite: 'bat', rx: 0.7, ry: 0.2, rw: 0.045, rh: 0.04, bat: 1.2 });
    this.decor.push({ sprite: 'bat', rx: 0.5, ry: 0.12, rw: 0.04, rh: 0.035, bat: 2.4 });
    // Fence at bottom (behind cards area)
    this.decor.push({ sprite: 'fence', rx: 0.0, ry: 0.78, rw: 0.14, rh: 0.08 });
    this.decor.push({ sprite: 'tombstone', rx: 0.015, ry: 0.72, rw: 0.055, rh: 0.1 });
    this.decor.push({ sprite: 'pumpkin', rx: 0.015, ry: 0.85, rw: 0.07, rh: 0.1 });
    this.decor.push({ sprite: 'pumpkin', rx: 0.085, ry: 0.87, rw: 0.055, rh: 0.08 });
    // Right side banner
    this.decor.push({ sprite: 'nu_banner', rx: 0.93, ry: 0.73, rw: 0.055, rh: 0.14 });
  }

  // ============ Main loop ============
  start() {
    const frame = (t) => {
      const dt = Math.min((t - this.lastTime) / 1000 || 0, 0.05);
      this.lastTime = t;
      this.update(dt);
      this.draw();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  update(dt) {
    // Animate bats always (visual flair even on menu)
    for (const d of this.decor) if (d.bat !== undefined) d.bat += dt;

    if (this.state !== 'playing') return;

    // Resource auto-generation
    this.autoGenTimer -= dt;
    if (this.autoGenTimer <= 0) {
      this.autoGenTimer = this.autoGenRate;
      this.addSpirit(this.autoGenAmount);
    }
    // Falling badges
    this.badgeFallTimer -= dt;
    if (this.badgeFallTimer <= 0) {
      this.badgeFallTimer = this.badgeFallRate;
      this.spawnFallingBadge();
    }
    // Cooldowns
    for (const k of Object.keys(this.cooldowns)) {
      if (this.cooldowns[k] > 0) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }

    // Wave scheduling
    if (!this.waveActive) {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0 && this.waveIndex < this.waves.length - 1) {
        this.startNextWave();
      } else if (this.waveTimer <= 0 && this.waveIndex === -1) {
        // very first wave if waves empty? ignore
      }
    } else {
      // Spawn queue
      for (const q of this.waveSpawnQueue) {
        if (q.remaining <= 0) continue;
        q.timer -= dt;
        if (q.timer <= 0) {
          q.timer = q.interval;
          q.remaining--;
          this.spawnMonster(q.kind);
        }
      }
    }

    // Entities
    for (const e of this.entities) if (!e.dead) e.update(dt);
    // Cleanup
    this.entities = this.entities.filter(e => !e.dead);
    this.monsters = this.monsters.filter(e => !e.dead);
    this.projectiles = this.projectiles.filter(e => !e.dead);
    this.badges = this.badges.filter(e => !e.dead);
    this.particles = this.particles.filter(e => !e.dead);

    this.updateHUD();
  }

  draw() {
    const ctx = this.ctx;
    const W = this.viewW, H = this.viewH;
    this.drawBackground(ctx, W, H);
    this.drawGrid(ctx);
    this.drawHoverPreview(ctx);

    // Draw order: defenders behind monsters (so monsters pass "in front" visually), then projectiles, badges, particles
    // Sort monsters & defenders by y
    const drawOrder = [...this.defenders, ...this.monsters].sort((a, b) => (a.y + a.height) - (b.y + b.height));
    for (const e of drawOrder) if (!e.dead) e.draw(ctx);
    for (const p of this.projectiles) if (!p.dead) p.draw(ctx);
    for (const b of this.badges) if (!b.dead) b.draw(ctx);
    for (const p of this.particles) if (!p.dead) p.draw(ctx);
  }

  drawBackground(ctx, W, H) {
    // Night sky gradient — tinted by backdrop
    const palettes = {
      gate: { top: '#1a0f2a', mid: '#2a1f4a', ground: '#1a3a1e', groundTop: '#2a5a28' },
      quad: { top: '#140b26', mid: '#2a1a40', ground: '#1a2a3e', groundTop: '#243d58' },
      gym:  { top: '#2a0a1a', mid: '#4a1030', ground: '#2a1818', groundTop: '#3f2222' }
    };
    const p = palettes[this.bgKind] || palettes.gate;
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    sky.addColorStop(0, p.top);
    sky.addColorStop(1, p.mid);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.75);

    // Stars
    ctx.fillStyle = '#fff';
    const seed = this.bgKind.length * 31;
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 97 + seed) % 1000) / 1000 * W;
      const sy = ((i * 53 + seed) % 400) / 400 * H * 0.6;
      const s = (i % 3 === 0) ? 1.5 : 1;
      ctx.globalAlpha = 0.4 + (i % 5) * 0.1;
      ctx.fillRect(sx, sy, s, s);
    }
    ctx.globalAlpha = 1;

    // Ground
    const ground = ctx.createLinearGradient(0, H * 0.6, 0, H);
    ground.addColorStop(0, p.groundTop);
    ground.addColorStop(1, p.ground);
    ctx.fillStyle = ground;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Backdrop-specific building silhouettes
    this.drawBuildings(ctx, W, H);

    // Decor sprites
    for (const d of this.decor) {
      let x = d.rx * W;
      let y = d.ry * H;
      const w = d.rw * W;
      const h = d.rh * H;
      if (d.bat !== undefined) {
        x += Math.sin(d.bat * 1.2) * 40;
        y += Math.cos(d.bat * 0.8) * 15;
      }
      ctx.drawImage(lib.sprite(d.sprite), x, y, w, h);
    }
  }

  drawBuildings(ctx, W, H) {
    const horizonY = H * 0.6;
    if (this.bgKind === 'gate') {
      // Main gate arch + columns
      ctx.fillStyle = '#1a1a2a';
      ctx.fillRect(W * 0.35, horizonY - H * 0.3, W * 0.08, H * 0.3);
      ctx.fillRect(W * 0.57, horizonY - H * 0.3, W * 0.08, H * 0.3);
      ctx.beginPath();
      ctx.moveTo(W * 0.35, horizonY - H * 0.3);
      ctx.lineTo(W * 0.65, horizonY - H * 0.3);
      ctx.lineTo(W * 0.63, horizonY - H * 0.35);
      ctx.lineTo(W * 0.37, horizonY - H * 0.35);
      ctx.closePath();
      ctx.fill();
      // Gold NU plaque
      ctx.fillStyle = '#f4c430';
      ctx.fillRect(W * 0.44, horizonY - H * 0.32, W * 0.12, H * 0.05);
      ctx.fillStyle = '#1a3a7e';
      ctx.font = `bold ${H * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NU', W * 0.5, horizonY - H * 0.295);
    } else if (this.bgKind === 'quad') {
      // Quadrangle buildings on either side
      ctx.fillStyle = '#2a2238';
      ctx.fillRect(0, horizonY - H * 0.35, W * 0.25, H * 0.35);
      ctx.fillRect(W * 0.75, horizonY - H * 0.35, W * 0.25, H * 0.35);
      // Windows
      ctx.fillStyle = '#f4c430';
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          ctx.fillRect(W * 0.04 + i * W * 0.045, horizonY - H * 0.3 + j * H * 0.08, W * 0.025, H * 0.04);
          ctx.fillRect(W * 0.78 + i * W * 0.045, horizonY - H * 0.3 + j * H * 0.08, W * 0.025, H * 0.04);
        }
      }
      // Center fountain
      ctx.fillStyle = '#1a2a3e';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, horizonY - H * 0.02, W * 0.08, H * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.bgKind === 'gym') {
      // Big gym building center
      ctx.fillStyle = '#2a1818';
      ctx.fillRect(W * 0.15, horizonY - H * 0.4, W * 0.7, H * 0.4);
      // Roof
      ctx.fillStyle = '#4a2020';
      ctx.beginPath();
      ctx.moveTo(W * 0.1, horizonY - H * 0.4);
      ctx.lineTo(W * 0.5, horizonY - H * 0.52);
      ctx.lineTo(W * 0.9, horizonY - H * 0.4);
      ctx.closePath();
      ctx.fill();
      // Big entrance
      ctx.fillStyle = '#1a0a0a';
      ctx.fillRect(W * 0.44, horizonY - H * 0.25, W * 0.12, H * 0.25);
      // NU GYM sign
      ctx.fillStyle = '#f4c430';
      ctx.fillRect(W * 0.42, horizonY - H * 0.36, W * 0.16, H * 0.06);
      ctx.fillStyle = '#1a3a7e';
      ctx.font = `bold ${H * 0.04}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NU GYM', W * 0.5, horizonY - H * 0.33);
      // Windows glowing
      ctx.fillStyle = '#ff7a1a';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(W * 0.2 + i * W * 0.1, horizonY - H * 0.2, W * 0.04, H * 0.06);
      }
    }
  }

  drawGrid(ctx) {
    const left = this.gridLeft, top = this.gridTop;
    const w = this.cellW, h = this.cellH;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = left + c * w, y = top + r * h;
        // Alternating row tint
        ctx.fillStyle = (r % 2 === 0) ? 'rgba(50, 90, 50, 0.25)' : 'rgba(30, 60, 30, 0.25)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
      }
    }
    // Home base indicator on left
    ctx.fillStyle = 'rgba(26, 58, 126, 0.35)';
    ctx.fillRect(left - 50, top, 50, this.rows * h);
    ctx.strokeStyle = '#f4c430';
    ctx.lineWidth = 2;
    ctx.strokeRect(left - 50, top, 50, this.rows * h);
    ctx.fillStyle = '#f4c430';
    ctx.font = `bold 0.9rem sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(left - 25, top + this.rows * h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('NU HOME', 0, 0);
    ctx.restore();
  }

  drawHoverPreview(ctx) {
    if (!this.hoverCell || !this.selectedDefender) return;
    const { row, col } = this.hoverCell;
    const x = this.gridLeft + col * this.cellW;
    const y = this.gridTop + row * this.cellH;
    // Occupied?
    let occupied = false;
    for (const d of this.defenders) if (!d.dead && d.row === row && d.col === col) { occupied = true; break; }
    ctx.fillStyle = occupied ? 'rgba(255, 60, 60, 0.3)' : 'rgba(244, 196, 48, 0.3)';
    ctx.fillRect(x, y, this.cellW, this.cellH);
    ctx.strokeStyle = occupied ? '#ff3c3c' : '#f4c430';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, this.cellW - 4, this.cellH - 4);
  }
}
