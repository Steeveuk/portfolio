// Stick Figure Game Module
const stick_figure_game = {
  canvas: document.getElementById('stick_figure_game_canvas'),
  canvas_movement: { x: 0, y: 0, timer: null },
  ctx: null,
  width: 0,
  height: 0,
  bullets: [],
  targets: [],
  clay_target: null, // Only one flying target at a time
  keys: {},
  mouse: { x: 0, y: 0 },
  running: false,
  targets_destroyed: 0,
  missed_shots: 0,
  reload: {
    ready: true,
    time: 500, // ms
    last: 0,
    gauge: 1, // 0 to 1
  },

  stickFigure: {
    x: 0,
    y: 0,
    arm_length: 35,
    leg_length: 40,
    speed: 5,
    leg_phase: 0.6,
    gun_length: 45,
    gun_stock: 20,
    draw() {
      const ctx = stick_figure_game.ctx;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;

      // Head
      ctx.beginPath();
      ctx.arc(this.x, this.y - 60, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 50);
      ctx.lineTo(this.x, this.y - 10);
      ctx.stroke();

      // Calculate angle between shoulder and mouse
      const dx = stick_figure_game.mouse.x - this.x;
      const dy = stick_figure_game.mouse.y - (this.y - 50); // shoulder position
      const angle = Math.atan2(dy, dx);

      // Gun barrel endpoint
      const barrel_x = this.x + Math.cos(angle) * this.gun_length;
      const barrel_y = this.y - 50 + Math.sin(angle) * this.gun_length;

      // Gun stock endpoint (backwards from shoulder)
      const stock_angle = angle + Math.PI; // opposite direction
      const stock_x = this.x + Math.cos(stock_angle) * this.gun_stock;
      const stock_y = this.y - 50 + Math.sin(stock_angle) * this.gun_stock;

      // Draw gun barrel (grey)
      ctx.save();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 50); // shoulder
      ctx.lineTo(barrel_x, barrel_y); // end of barrel
      ctx.stroke();
      ctx.restore();

      // Draw gun stock (brown)
      ctx.save();
      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 50); // shoulder
      ctx.lineTo(stock_x, stock_y); // end of stock
      ctx.stroke();
      ctx.restore();

      // Draw reload gauge (brown bar below feet)
      const gauge_w = 50;
      const gauge_h = 8;
      const gauge_x = this.x - gauge_w / 2;
      const gauge_y = this.y + this.leg_length + 15;
      ctx.save();
      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 2;
      ctx.strokeRect(gauge_x, gauge_y, gauge_w, gauge_h);
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(gauge_x, gauge_y, gauge_w * stick_figure_game.reload.gauge, gauge_h);
      ctx.restore();

      // Legs
      const swing = Math.sin(this.leg_phase) * 10;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 10);
      ctx.lineTo(this.x - swing, this.y + this.leg_length);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 10);
      ctx.lineTo(this.x + swing, this.y + this.leg_length);
      ctx.stroke();

      // Output targets_destroyed and missed_shots (bottom left)
      ctx.font = '16px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      const y1 = stick_figure_game.height - 36;
      const y2 = stick_figure_game.height - 16;
      ctx.fillText(`Score: ${stick_figure_game.targets_destroyed}`, 20, y1);
      ctx.fillText(`Missed: ${stick_figure_game.missed_shots}`, 20, y2);
    },
    update() {
      if (stick_figure_game.keys['a'] && this.x > 20) this.x -= this.speed;
      if (stick_figure_game.keys['d'] && this.x < stick_figure_game.width - 20) this.x += this.speed;
      const moving = stick_figure_game.keys['w'] || stick_figure_game.keys['a'] || stick_figure_game.keys['s'] || stick_figure_game.keys['d'];
      if (moving) {
        this.leg_phase += 0.2;
      }
    }
  },

  create_target() {
    // Only create a new target if there isn't one already
    if (this.clay_target) return;
    // Randomly choose left-to-right or right-to-left
    const direction = Math.random() < 0.5 ? 1 : -1;
    const r = 15;
    let x, vx;
    if (direction === 1) {
      x = -r;
      vx = 4;
    } else {
      x = this.width + r;
      vx = -4;
    }
    // For curved path, store initial y and a phase
    const base_y = Math.random() * (this.height / 3) + 30;
    const amplitude = 40 + Math.random() * 30; // curve height
    const freq = 0.012 + Math.random() * 0.008; // curve frequency
    this.clay_target = { x, y: base_y, r, vx, base_y, amplitude, freq, phase: 0 };
  },

  draw_targets() {
    if (this.clay_target) {
      const t = this.clay_target;
      const colors = ['white', 'blue', 'red', 'orange'];
      for (let i = colors.length - 1; i >= 0; i--) {
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, t.r * (i + 1) / colors.length, 0, Math.PI * 2);
        this.ctx.fillStyle = colors[i];
        this.ctx.fill();
      }
    }
  },

  draw_bullets() {
    this.ctx.fillStyle = 'white';
    this.bullets.forEach(b => {
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
    });
  },

  update_bullets() {
    this.bullets.forEach((b, index) => {
      b.x += b.vx;
      b.y += b.vy;

      //Check which edge was hit and reset position
      let timeout_speed = 200;
      if (b.x < 0) {
        this.canvas_movement.x -= 10;
        jQuery('#hover-area').css('left', `${this.canvas_movement.x}px`);
        if(this.canvas_movement.x > -30){
          clearTimeout(this.canvas_movement.timer);
        }
        this.canvas_movement.timer = setTimeout(() => {
          jQuery('#hover-area').css('left', '0');
          jQuery('#hover-area').css('top', '0');
          this.canvas_movement.x = 0;
        }, timeout_speed);
      } else if(b.x > this.width) {
        this.canvas_movement.x += 10;
        jQuery('#hover-area').css('left', `${this.canvas_movement.x}px`);
        if(this.canvas_movement.x < 30){
          clearTimeout(this.canvas_movement.timer);
        }
        this.canvas_movement.timer = setTimeout(() => {
          jQuery('#hover-area').css('left', '0');
          jQuery('#hover-area').css('top', '0');
          this.canvas_movement.x = 0;
        }, timeout_speed);
      } else if(b.y < 0) {
        this.canvas_movement.y -= 10;
        jQuery('#hover-area').css('top', `${this.canvas_movement.y}px`);
        if(this.canvas_movement.y > -30){
          clearTimeout(this.canvas_movement.timer);
        }
        this.canvas_movement.timer = setTimeout(() => {
          jQuery('#hover-area').css('top', '0');
          jQuery('#hover-area').css('top', '0');
          this.canvas_movement.y = 0;
        }, timeout_speed);
      } else if(b.y > this.height) {
        this.canvas_movement.y += 10;
        jQuery('#hover-area').css('top', `${this.canvas_movement.y}px`);
        if(this.canvas_movement.y < 30){
          clearTimeout(this.canvas_movement.timer);
        }
        this.canvas_movement.timer = setTimeout(() => {
          jQuery('#hover-area').css('top', '0');
          jQuery('#hover-area').css('top', '0');
          this.canvas_movement.y = 0;
        }, timeout_speed);
      }
    });
    // Count missed shots
    const before = this.bullets.length;
    this.bullets = this.bullets.filter(b => b.x > 0 && b.x < this.width && b.y > 0 && b.y < this.height);
    const missed = before - this.bullets.length;
    if (missed > 0) this.missed_shots += missed;
  },

  update_clay_target() {
    if (!this.clay_target) return;
    this.clay_target.x += this.clay_target.vx;
    this.clay_target.phase += this.clay_target.vx * this.clay_target.freq;
    this.clay_target.y = this.clay_target.base_y + Math.sin(this.clay_target.phase) * this.clay_target.amplitude;
    // Remove if out of bounds
    if (
      (this.clay_target.vx > 0 && this.clay_target.x - this.clay_target.r > this.width) ||
      (this.clay_target.vx < 0 && this.clay_target.x + this.clay_target.r < 0)
    ) {
      this.clay_target = null;
    }
  },

  detect_hits() {
    if (this.clay_target) {
      this.bullets.forEach((b, bi) => {
        const t = this.clay_target;
        const dx = b.x - t.x;
        const dy = b.y - t.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < t.r + 5) {
          this.bullets.splice(bi, 1);
          this.clay_target = null;
          this.targets_destroyed++;
        }
      });
    }
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
    this.update_clay_target();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.stickFigure.update();
    this.stickFigure.draw();
    this.update_bullets();
    this.detect_hits();
    this.draw_bullets();
    this.draw_targets();
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
    this.stickFigure.x = this.width / 2;
    this.stickFigure.y = this.height - 100;
    this.canvas.addEventListener('click', e => {
      if (!this.reload.ready) return; // can't shoot yet
      this.reload.ready = false;
      this.reload.last = Date.now();
      this.reload.gauge = 0;
      const rect = this.canvas.getBoundingClientRect();
      const targetX = e.clientX - rect.left;
      const targetY = e.clientY - rect.top;
      const shoulder_x = this.stickFigure.x;
      const shoulder_y = this.stickFigure.y - 50;
      const dx = targetX - shoulder_x;
      const dy = targetY - shoulder_y;
      const angle = Math.atan2(dy, dx);
      const hand_x = shoulder_x + Math.cos(angle) * this.stickFigure.gun_length;
      const hand_y = shoulder_y + Math.sin(angle) * this.stickFigure.gun_length;
      const speed = 10;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.bullets.push({
        x: hand_x,
        y: hand_y,
        vx: vx,
        vy: vy
      });
    });
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });
    window.addEventListener('resize', () => {
      this.width = this.canvas.offsetWidth;
      this.height = this.canvas.offsetHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    });
    setInterval(() => {
      if (this.running) this.create_target();
    }, 1500);
  }
};
stick_figure_game.init();

const game_observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.info('Play Stick Figure Game');
      stick_figure_game.play();
    } else {
      console.info('Pause Stick Figure Game');
      stick_figure_game.pause();
    }
  });
}, { threshold: 0.25 });
game_observer.observe(document.getElementById('game-container')); 