// Crossbow Game Module
const crossbow_game = {
  canvas: document.getElementById('crossbow_game_canvas'),
  ctx: null,
  width: 0,
  height: 0,
  bolts: [],
  targets: [],
  keys: {},
  mouse: { x: 0, y: 0 },
  running: false,
  score: 0,
  missed: 0,
  mobile: false, // New mobile detection variable
  reload: {
    ready: true,
    time: 600, // ms
    last: 0,
    gauge: 1, // 0 to 1
  },
  gravity: 0.35,
  power: 0, // 0 to 1
  powerCharging: false,
  powerMax: 1.0,
  powerMin: 0.1,
  powerRate: 0.012, // how fast power charges per frame
  stringFiring: false, // New property for string firing animation
  canvas_movement: { x: 0, y: 0, timer: null },

  crossbow: {
    x: 0,
    y: 0,
    length: 50,
    armLen: 38,
    armAngle: Math.PI / 4.2, // angle from main axis
    draw() {
      const ctx = crossbow_game.ctx;
      // --- Draw crossbow (rotated) ---
      ctx.save();
      ctx.translate(this.x, this.y);
      // Angle to mouse
      const dx = crossbow_game.mouse.x - this.x;
      const dy = crossbow_game.mouse.y - this.y;
      const angle = Math.atan2(dy, dx);
      ctx.rotate(angle + Math.PI / 2);

      // --- Draw central body (vertical, thick) ---
      ctx.save();
      ctx.fillStyle = '#a86b32';
      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-8, -38);
      ctx.lineTo(8, -38);
      ctx.lineTo(8, 30);
      ctx.lineTo(-8, 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // --- Draw curved arms (Bezier curves) ---
      ctx.save();
      ctx.strokeStyle = '#c89b6e';
      ctx.lineWidth = 10;
      ctx.beginPath();
      // Left arm
      ctx.moveTo(-8, -30);
      ctx.bezierCurveTo(-60, -40, -60, 40, 0, 18);
      // Right arm
      ctx.moveTo(8, -30);
      ctx.bezierCurveTo(60, -40, 60, 40, 0, 18);
      ctx.stroke();
      ctx.restore();

      // --- Draw yellow guard (V shape) ---
      ctx.save();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(0, 18);
      ctx.lineTo(18, 0);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // --- Draw arrow/bolt (vertical, with tip) ---
      ctx.save();
      // Shaft
      ctx.strokeStyle = '#7c4a03';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(0, -60);
      ctx.stroke();
      // Tip
      ctx.fillStyle = '#bfc9ca';
      ctx.beginPath();
      ctx.moveTo(0, -68);
      ctx.lineTo(-7, -60);
      ctx.lineTo(7, -60);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // --- Draw string ---
      ctx.save();
      ctx.strokeStyle = '#b6a77a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Arm tips (match Bezier end points)
      // Firing: string is straight across the front
      if (crossbow_game.stringFiring) {
        ctx.moveTo(-8, -30);
        ctx.lineTo(8, -30);
      } else {
        // Idle: string from left tip to curve bottom to right tip
        ctx.moveTo(-8, -30);
        ctx.lineTo(0, 18);
        ctx.lineTo(8, -30);
      }
      ctx.stroke();
      ctx.restore();

      ctx.restore(); // End crossbow rotation

      // --- Draw reload gauge (underneath crossbow, not rotated) ---
      const gauge_w = 50;
      const gauge_h = 8;
      const gauge_x = this.x - gauge_w / 2;
      const gauge_y = this.y + 50;
      ctx.save();
      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 2;
      ctx.strokeRect(gauge_x, gauge_y, gauge_w, gauge_h);
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(gauge_x, gauge_y, gauge_w * crossbow_game.reload.gauge, gauge_h);
      ctx.restore();
      
      // --- Draw power gauge (below reload gauge, not rotated) - only on desktop ---
      if (!crossbow_game.mobile) {
        const power_w = 50;
        const power_h = 8;
        const power_x = this.x - power_w / 2;
        const power_y = gauge_y + gauge_h + 6;
        ctx.save();
        ctx.strokeStyle = '#0af';
        ctx.lineWidth = 2;
        ctx.strokeRect(power_x, power_y, power_w, power_h);
        ctx.fillStyle = '#0af';
        ctx.fillRect(power_x, power_y, power_w * crossbow_game.power, power_h);
        ctx.restore();
      }
    }
  },

  create_target() {
    // Randomly spawn at top or left edge
    const edge = Math.random() < 0.5 ? 'top' : 'left';
    let x, y, vx, vy;
    // Smaller targets for mobile
    const r = this.mobile ? 12 : 18;
    if (edge === 'top') {
      x = Math.random() * (this.width - 2 * r) + r;
      y = -r;
      vx = (Math.random() - 0.5) * 2;
      vy = 2 + Math.random() * 2;
    } else {
      x = -r;
      y = Math.random() * (this.height / 2);
      vx = 2 + Math.random() * 2;
      vy = (Math.random() - 0.5) * 2;
    }
    this.targets.push({ x, y, vx, vy, r });
  },

  draw_targets() {
    this.targets.forEach(t => {
      const colors = ['#fff', '#0af', '#f33', '#fa0'];
      for (let i = colors.length - 1; i >= 0; i--) {
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, t.r * (i + 1) / colors.length, 0, Math.PI * 2);
        this.ctx.fillStyle = colors[i];
        this.ctx.fill();
      }
    });
  },

  draw_bolts() {
    this.ctx.save();
    this.ctx.strokeStyle = '#ccc';
    this.ctx.lineWidth = 4;
    this.bolts.forEach(b => {
      this.ctx.beginPath();
      this.ctx.moveTo(b.x, b.y);
      // Draw bolt as a line in its velocity direction
      const len = 18;
      const angle = Math.atan2(b.vy, b.vx);
      this.ctx.lineTo(b.x - Math.cos(angle) * len, b.y - Math.sin(angle) * len);
      this.ctx.stroke();
      // Draw tip
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#f33';
      this.ctx.fill();
    });
    this.ctx.restore();
  },

  update_bolts() {
    this.bolts.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.vy += this.gravity;
    });
    // Remove bolts out of bounds
    const before = this.bolts.length;
    // Nudge effect for out-of-bounds
    let timeout_speed = 200;
    this.bolts.forEach(b => {
      if (b.x < 0) {
        this.canvas_movement.x -= 10;
        jQuery('#hover-area-crossbow').css('left', `${this.canvas_movement.x}px`);
        if (this.canvas_movement.x > -30) {
          clearTimeout(this.canvas_movement.timer);
        }
        this.canvas_movement.timer = setTimeout(() => {
          jQuery('#hover-area-crossbow').css('left', '0');
          jQuery('#hover-area-crossbow').css('top', '0');
          this.canvas_movement.x = 0;
        }, timeout_speed);
      } else if (b.x > this.width) {
        this.canvas_movement.x += 10;
        jQuery('#hover-area-crossbow').css('left', `${this.canvas_movement.x}px`);
        if (this.canvas_movement.x < 30) {
          clearTimeout(this.canvas_movement.timer);
        }
        this.canvas_movement.timer = setTimeout(() => {
          jQuery('#hover-area-crossbow').css('left', '0');
          jQuery('#hover-area-crossbow').css('top', '0');
          this.canvas_movement.x = 0;
        }, timeout_speed);
      } else if (b.y < 0) {
        this.canvas_movement.y -= 10;
        jQuery('#hover-area-crossbow').css('top', `${this.canvas_movement.y}px`);
        if (this.canvas_movement.y > -30) {
          clearTimeout(this.canvas_movement.timer);
        }
        this.canvas_movement.timer = setTimeout(() => {
          jQuery('#hover-area-crossbow').css('top', '0');
          jQuery('#hover-area-crossbow').css('left', '0');
          this.canvas_movement.y = 0;
        }, timeout_speed);
      } else if (b.y > this.height) {
        this.canvas_movement.y += 10;
        jQuery('#hover-area-crossbow').css('top', `${this.canvas_movement.y}px`);
        if (this.canvas_movement.y < 30) {
          clearTimeout(this.canvas_movement.timer);
        }
        this.canvas_movement.timer = setTimeout(() => {
          jQuery('#hover-area-crossbow').css('top', '0');
          jQuery('#hover-area-crossbow').css('left', '0');
          this.canvas_movement.y = 0;
        }, timeout_speed);
      }
    });
    this.bolts = this.bolts.filter(b => b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height);
    const missed = before - this.bolts.length;
    if (missed > 0) this.missed += missed;
  },

  update_targets() {
    this.targets.forEach(t => {
      t.x += t.vx;
      t.y += t.vy;
    });
    // Remove targets out of bounds
    this.targets = this.targets.filter(t => t.x > -30 && t.x < this.width + 30 && t.y > -30 && t.y < this.height + 30);
  },

  detect_hits() {
    this.bolts.forEach((b, bi) => {
      this.targets.forEach((t, ti) => {
        const dx = b.x - t.x;
        const dy = b.y - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < t.r + 4) {
          this.bolts.splice(bi, 1);
          this.targets.splice(ti, 1);
          this.score++;
        }
      });
    });
  },

  game_loop() {
    if (!this.running) return;
    // Update reload gauge
    if (!this.reload.ready) {
      const now = Date.now();
      const elapsed = now - this.reload.last;
      this.reload.gauge = Math.min(elapsed / this.reload.time, 1);
      if (elapsed >= this.reload.time) {
        this.reload.ready = true;
        this.reload.gauge = 1;
      }
    }
    // Power charging (only on desktop, mobile always has max power)
    if (!this.mobile && this.powerCharging) {
      this.power += this.powerRate;
      if (this.power > this.powerMax) this.power = this.powerMax;
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.crossbow.draw();
    this.update_bolts();
    this.update_targets();
    this.detect_hits();
    this.draw_bolts();
    this.draw_targets();
    // UI
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 20, this.height - 36);
    this.ctx.fillText(`Missed: ${this.missed}`, 20, this.height - 16);
    requestAnimationFrame(() => this.game_loop());
  },

  play() {
    if (!this.running) {
      this.running = true;
      this.game_loop();
    }
  },

  pause() {
    this.running = false;
  },

  init() {
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.offsetWidth;
    this.height = this.canvas.offsetHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Check if mobile (screen width < 500px)
    this.mobile = this.width < 500;
    
    // Crossbow position
    this.crossbow.x = this.width - 60;
    this.crossbow.y = this.height - 80;
    // Mouse tracking
    this.mouse.x = this.crossbow.x;
    this.mouse.y = this.crossbow.y - 100;
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    // Power gauge logic
    this.canvas.addEventListener('mousedown', e => {
      if (this.mobile) {
        // On mobile, power is always at max
        this.power = this.powerMax;
      } else {
        // Removed reload.ready check so power can be charged anytime
        this.powerCharging = true;
        this.power = this.powerMin;
      }
    });
    this.canvas.addEventListener('mouseup', e => {
      if (!this.reload.ready) return;
      
      // On mobile, power is always at max, so no need to check powerCharging
      if (!this.mobile && !this.powerCharging) return;
      
      this.reload.ready = false;
      this.reload.last = Date.now();
      this.reload.gauge = 0;
      this.powerCharging = false;
      const rect = this.canvas.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      const targetY = e.clientY - rect.top;
      const dx = targetX - this.crossbow.x;
      const dy = targetY - this.crossbow.y;
      const angle = Math.atan2(dy, dx);
      // Power affects speed
      const minSpeed = 8;
      const maxSpeed = 18;
      const speed = minSpeed + (maxSpeed - minSpeed) * this.power;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.bolts.push({
        x: this.crossbow.x,
        y: this.crossbow.y,
        vx: vx,
        vy: vy
      });
      this.power = 0;
    });
    // Prevent accidental firing on mouseleave
    this.canvas.addEventListener('mouseleave', e => {
      this.powerCharging = false;
      this.power = 0;
    });
    window.addEventListener('resize', () => {
      this.width = this.canvas.offsetWidth;
      this.height = this.canvas.offsetHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      
      // Update mobile detection on resize
      this.mobile = this.width < 500;
      
      this.crossbow.x = this.width - 60;
      this.crossbow.y = this.height - 120;
    });
    setInterval(() => {
      if (this.running) this.create_target();
    }, 1200);
  }
};
crossbow_game.init();

const crossbow_game_observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.info('Play Crossbow Game');
      crossbow_game.play();
    } else {
      console.info('Pause Crossbow Game');
      crossbow_game.pause();
    }
  });
}, { threshold: 0.25 });
crossbow_game_observer.observe(document.getElementById('crossbow-game-container'));
