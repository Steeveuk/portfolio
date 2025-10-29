// Fractal Canvas Module
const FractalSystem = {
  container: null,
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  parallax_offset: { x: 0, y: 0 },
  mouse: { x: 0, y: 0, active: false },
  fractals: [],
  frame: 0,
  shapes: ['triangle', 'snowflake', 'square', 'star'],

  init(container_id, canvas_id) {
    this.container = document.getElementById(container_id);
    this.canvas = document.getElementById(canvas_id);
    this.ctx = this.canvas.getContext('2d');

    this.resize_canvas();
    this.setup_event_listeners();
    this.generate_fractals();
    this.animate();
  },

  resize_canvas() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  },

  setup_event_listeners() {
    window.addEventListener('resize', () => {
      this.resize_canvas();
      this.generate_fractals();
    });

    window.addEventListener('scroll', () => {
      this.parallax_offset.y = window.scrollY * 0.15;
    });

    this.container.addEventListener('mousemove', e => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;

      // Clamp mouse inside container
      this.mouse.x = Math.max(0, Math.min(this.mouse.x, rect.width));
      this.mouse.y = Math.max(0, Math.min(this.mouse.y, rect.height));

      this.mouse.active = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });
  },

  generate_fractals() {
    this.fractals = [];
    const spacing = 140;
    for (let x = spacing / 2; x < this.width; x += spacing) {
      for (let y = spacing / 2; y < this.height; y += spacing) {
        this.fractals.push(this.create_fractal(x, y));
      }
    }
  },

  create_fractal(x, y) {
    // Return a fractal object instance
    const shapes = this.shapes;
    const ctx = this.ctx;
    const mouse = this.mouse;
    const parallax_offset = this.parallax_offset;

    return {
      x,
      y,
      type: shapes[Math.floor(Math.random() * shapes.length)],
      base_size: 40,
      hue: 20 + Math.random() * 20,
      angle: Math.random() * Math.PI * 2,

      draw_triangle(x, y, size, depth) {
        if (depth === 0) return;
        const h = size * Math.sqrt(3) / 2;

        ctx.beginPath();
        ctx.moveTo(x, y - h / 2);
        ctx.lineTo(x - size / 2, y + h / 2);
        ctx.lineTo(x + size / 2, y + h / 2);
        ctx.closePath();
        ctx.stroke();

        const new_size = size / 2;
        const h2 = new_size * Math.sqrt(3) / 2;

        this.draw_triangle(x, y - h2 / 2, new_size, depth - 1);
        this.draw_triangle(x - new_size / 2, y + h2 / 2, new_size, depth - 1);
        this.draw_triangle(x + new_size / 2, y + h2 / 2, new_size, depth - 1);
      },

      draw_snowflake(x, y, len, depth) {
        if (depth === 0) return;

        for (let i = 0; i < 6; i++) {
          const angle = Math.PI * 2 * i / 6;
          const x_end = x + Math.cos(angle) * len;
          const y_end = y + Math.sin(angle) * len;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x_end, y_end);
          ctx.stroke();
          this.draw_snowflake(x_end, y_end, len * 0.4, depth - 1);
        }
      },

      draw_square(x, y, size, depth) {
        if (depth === 0) return;

        ctx.strokeRect(x - size / 2, y - size / 2, size, size);

        const new_size = size * 0.5;
        this.draw_square(x - size / 2, y - size / 2, new_size, depth - 1);
        this.draw_square(x + size / 2, y - size / 2, new_size, depth - 1);
        this.draw_square(x - size / 2, y + size / 2, new_size, depth - 1);
        this.draw_square(x + size / 2, y + size / 2, new_size, depth - 1);
      },

      draw_star(x, y, len, depth) {
        if (depth === 0) return;
        for (let i = 0; i < 8; i++) {
          const angle = Math.PI * 2 * i / 8;
          const x_end = x + Math.cos(angle) * len;
          const y_end = y + Math.sin(angle) * len;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x_end, y_end);
          ctx.stroke();
          this.draw_star(x_end, y_end, len * 0.3, depth - 1);
        }
      },

      update_and_draw(frame) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const max_dist = 250;
        const proximity = Math.max(0, 1 - dist / max_dist);

        const scale = 1 + proximity * 2;
        const depth = 1 + Math.floor(proximity * 3);
        const hue = this.hue;
        const lightness = 40 + proximity * 30;

        ctx.save();
        ctx.translate(this.x + parallax_offset.x, this.y + parallax_offset.y);
        ctx.rotate(this.angle + proximity * 1.2);
        ctx.scale(scale, scale);
        ctx.strokeStyle = `hsl(${hue}, 100%, ${lightness}%)`;
        ctx.lineWidth = 1.2;

        switch (this.type) {
          case 'triangle':
            this.draw_triangle(0, 0, this.base_size, depth);
            break;
          case 'snowflake':
            this.draw_snowflake(0, 0, this.base_size * 0.6, depth);
            break;
          case 'square':
            this.draw_square(0, 0, this.base_size, depth);
            break;
          case 'star':
            this.draw_star(0, 0, this.base_size * 0.7, depth);
            break;
        }

        ctx.restore();
        this.angle += 0.002 + proximity * 0.01;
      },
    };
  },

  animate() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.fractals.forEach(f => f.update_and_draw(this.frame));
    this.frame++;

    requestAnimationFrame(() => this.animate());
  },
};

// Initialize FractalSystem (call this after DOM is ready)
FractalSystem.init('fractal-container', 'fractal-canvas'); 