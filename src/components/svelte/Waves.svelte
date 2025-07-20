<!-- 
  @component
  
  A Svelte component that generates an interactive waves effect on a canvas.

  @prop {string} lineColor - The color of the lines.
  @prop {number} waveSpeedX - The speed of the waves in the x-direction.
  @prop {number} waveSpeedY - The speed of the waves in the y-direction.
  @prop {number} waveAmpX - The amplitude of the waves in the x-direction.
  @prop {number} waveAmpY - The amplitude of the waves in the y-direction.
  @prop {number} xGap - The gap between the lines in the x-direction.
  @prop {number} yGap - The gap between the lines in the y-direction.
  @prop {number} friction - The friction of the waves.
  @prop {number} tension - The tension of the waves.
  @prop {number} maxCursorMove - The maximum distance the cursor can move.
  @prop {object} style - The style of the canvas.
  @prop {string} className - The class name of the canvas.

  @see https://www.reactbits.dev/backgrounds/waves for the original implementation.

  @example
  ```astro
  <Waves client:only="svelte" lineColor="#948FE6"  />
  ```
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  /** 
   * Class representing a gradient vector
   * @property {number} x - The x-coordinate of the gradient vector
   * @property {number} y - The y-coordinate of the gradient vector
   * @property {number} z - The z-coordinate of the gradient vector
   */
  class GradVector {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    /**
     * Calculates the dot product of the gradient vector and another vector
     * @param x - The x-coordinate of the other vector
     * @param y - The y-coordinate of the other vector
     * @returns The dot product of the gradient vector and the other vector
     */
    dot2(x: number, y: number): number {
      return this.x * x + this.y * y;
    }
  }

  /** Class representing a noise generator */
  class Noise {
    grad3: GradVector[];
    p: number[];
    perm: number[];
    gradP: GradVector[];

    /**
     * Creates a new noise generator
     * @param seed - The seed for the noise generator
     */
    constructor(seed = 0) {
      this.grad3 = [
        new GradVector(1, 1, 0),
        new GradVector(-1, 1, 0),
        new GradVector(1, -1, 0),
        new GradVector(-1, -1, 0),
        new GradVector(1, 0, 1),
        new GradVector(-1, 0, 1),
        new GradVector(1, 0, -1),
        new GradVector(-1, 0, -1),
        new GradVector(0, 1, 1),
        new GradVector(0, -1, 1),
        new GradVector(0, 1, -1),
        new GradVector(0, -1, -1),
      ];
      this.p = [
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
        140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
        120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177,
        33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165,
        71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
        133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25,
        63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
        226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
        59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248,
        152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22,
        39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218,
        246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
        81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
        184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
        222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
      ];
      this.perm = new Array(512);
      this.gradP = new Array(512);
      this.seed(seed);
    }

    /**
     * Seeds the noise generator
     * @param seed - The seed for the noise generator
     */
    seed(seed: number) {
      if (seed > 0 && seed < 1) seed *= 65536;
      seed = Math.floor(seed);
      if (seed < 256) seed |= seed << 8;
      for (let i = 0; i < 256; i++) {
        let v =
          i & 1 ? this.p[i] ^ (seed & 255) : this.p[i] ^ ((seed >> 8) & 255);
        this.perm[i] = this.perm[i + 256] = v;
        this.gradP[i] = this.gradP[i + 256] = this.grad3[v % 12];
      }
    }

    /**
     * Fades the noise
     * @param t - The time value
     * @returns The faded noise
     */
    fade(t: number): number {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Linearly interpolates between two values
     * @param a - The first value
     * @param b - The second value
     * @param t - The interpolation factor
     * @returns The interpolated value
     */
    lerp(a: number, b: number, t: number): number {
      return (1 - t) * a + t * b;
    }

    /**
     * Generates Perlin noise
     * @param x - The x-coordinate of the noise
     * @param y - The y-coordinate of the noise
     * @returns The Perlin noise value
     */
    perlin2(x: number, y: number): number {
      let X = Math.floor(x),
        Y = Math.floor(y);
      x -= X;
      y -= Y;
      X &= 255;
      Y &= 255;
      const n00 = this.gradP[X + this.perm[Y]].dot2(x, y);
      const n01 = this.gradP[X + this.perm[Y + 1]].dot2(x, y - 1);
      const n10 = this.gradP[X + 1 + this.perm[Y]].dot2(x - 1, y);
      const n11 = this.gradP[X + 1 + this.perm[Y + 1]].dot2(x - 1, y - 1);
      const u = this.fade(x);
      return this.lerp(
        this.lerp(n00, n10, u),
        this.lerp(n01, n11, u),
        this.fade(y)
      );
    }
  }

  interface Point {
    x: number;
    y: number;
    wave: { x: number; y: number };
    cursor: { x: number; y: number; vx: number; vy: number };
  }

  interface Mouse {
    x: number;
    y: number;
    lx: number;
    ly: number;
    sx: number;
    sy: number;
    v: number;
    vs: number;
    a: number;
    set: boolean;
  }

  interface Config {
    lineColor: string;
    waveSpeedX: number;
    waveSpeedY: number;
    waveAmpX: number;
    waveAmpY: number;
    friction: number;
    tension: number;
    maxCursorMove: number;
    xGap: number;
    yGap: number;
  }

  export let lineColor = "white";
  export let backgroundColor = "transparent";
  export let waveSpeedX = 0.0125;
  export let waveSpeedY = 0.005;
  export let waveAmpX = 32;
  export let waveAmpY = 16;
  export let xGap = 15;
  export let yGap = 30;
  export let friction = 0.925;
  export let tension = 0.005;
  export let maxCursorMove = 100;
  export let style = {};
  export let className = "";

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let bounding = {
    width: 0,
    height: 0,
    left: 0,
    top: 0,
  };
  let noise = new Noise(Math.random());
  let lines: Point[][] = [];
  let mouse: Mouse = {
    x: -10,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    v: 0,
    vs: 0,
    a: 0,
    set: false,
  };

  let config: Config = {
    lineColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    friction,
    tension,
    maxCursorMove,
    xGap,
    yGap,
  };

  let frameId: number | null = null;
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Sets the size of the canvas
   */
  function setSize() {
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    bounding = {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    };
    
    // Set actual canvas size with DPI scaling
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the canvas back down using CSS
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Scale the drawing context to match DPI
    if (ctx) {
      ctx.scale(dpr, dpr);
      // Set canvas context properties to prevent artifacts
      ctx.imageSmoothingEnabled = false;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }

  /**
   * Sets the lines of the canvas
   */
  function setLines() {
    const { width, height } = bounding;
    lines = [];
    const oWidth = width + 200,
      oHeight = height + 30;
    const { xGap, yGap } = config;
    const totalLines = Math.ceil(oWidth / xGap);
    const totalPoints = Math.ceil(oHeight / yGap);
    const xStart = (width - xGap * totalLines) / 2;
    const yStart = (height - yGap * totalPoints) / 2;
    for (let i = 0; i <= totalLines; i++) {
      const pts: Point[] = [];
      for (let j = 0; j <= totalPoints; j++) {
        pts.push({
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave: { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        });
      }
      lines.push(pts);
    }
  }

  /**
   * Moves the points on the canvas
   * @param time - The time value
   */
  function movePoints(time: number) {
    const {
      waveSpeedX,
      waveSpeedY,
      waveAmpX,
      waveAmpY,
      friction,
      tension,
      maxCursorMove,
    } = config;
    lines.forEach((pts) => {
      pts.forEach((p) => {
        const move =
          noise.perlin2(
            (p.x + time * waveSpeedX) * 0.002,
            (p.y + time * waveSpeedY) * 0.0015
          ) * 12;
        p.wave.x = Math.cos(move) * waveAmpX;
        p.wave.y = Math.sin(move) * waveAmpY;

        const dx = p.x - mouse.sx,
          dy = p.y - mouse.sy;
        const dist = Math.hypot(dx, dy);
        const l = Math.max(175, mouse.vs);
        if (dist < l) {
          const s = 1 - dist / l;
          const f = Math.cos(dist * 0.001) * s;
          p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.0002;
          p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.0002;
        }

        p.cursor.vx += (0 - p.cursor.x) * tension;
        p.cursor.vy += (0 - p.cursor.y) * tension;
        p.cursor.vx *= friction;
        p.cursor.vy *= friction;
        p.cursor.x += p.cursor.vx * 2;
        p.cursor.y += p.cursor.vy * 2;
        p.cursor.x = Math.min(
          maxCursorMove,
          Math.max(-maxCursorMove, p.cursor.x)
        );
        p.cursor.y = Math.min(
          maxCursorMove,
          Math.max(-maxCursorMove, p.cursor.y)
        );
      });
    });
  }

  /**
   * Moves a point on the canvas
   * @param point - The point to move
   * @param withCursor - Whether to include the cursor in the movement
   * @returns The moved point
   */
  function moved(point: Point, withCursor = true): { x: number; y: number } {
    const x = point.x + point.wave.x + (withCursor ? point.cursor.x : 0);
    const y = point.y + point.wave.y + (withCursor ? point.cursor.y : 0);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }

  /**
   * Draws the lines on the canvas
   */
  function drawLines() {
    const { width, height } = bounding;
    const context = ctx as CanvasRenderingContext2D;
    if (!context) return;
    
    // Clear the entire canvas including DPI-scaled dimensions
    const dpr = window.devicePixelRatio || 1;
    context.clearRect(0, 0, width * dpr, height * dpr);
    
    // Set stroke properties for each frame to prevent inconsistencies
    context.strokeStyle = config.lineColor;
    context.lineWidth = 1;
    context.globalCompositeOperation = 'source-over';
    
    // Draw each line separately to prevent overlapping brightness issues
    lines.forEach((points) => {
      context.beginPath();
      let p1 = moved(points[0], false);
      context.moveTo(p1.x, p1.y);
      points.forEach((p, idx) => {
        const isLast = idx === points.length - 1;
        p1 = moved(p, !isLast);
        context.lineTo(p1.x, p1.y);
      });
      context.stroke();
    });
  }

  /**
   * Updates the canvas
   * @param t - The time value
   */
  function tick(t: number) {
    if (!container) return;
    mouse.sx += (mouse.x - mouse.sx) * 0.1;
    mouse.sy += (mouse.y - mouse.sy) * 0.1;
    const dx = mouse.x - mouse.lx,
      dy = mouse.y - mouse.ly;
    const d = Math.hypot(dx, dy);
    mouse.v = d;
    mouse.vs += (d - mouse.vs) * 0.1;
    mouse.vs = Math.min(100, mouse.vs);
    mouse.lx = mouse.x;
    mouse.ly = mouse.y;
    mouse.a = Math.atan2(dy, dx);
    container.style.setProperty("--x", `${mouse.sx}px`);
    container.style.setProperty("--y", `${mouse.sy}px`);

    movePoints(t);
    drawLines();
    frameId = requestAnimationFrame(tick);
  }

  function onResize() {
    // Throttle resize to prevent excessive calls during scroll
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (frameId) cancelAnimationFrame(frameId);
      setSize();
      setLines();
      frameId = requestAnimationFrame(tick);
    }, 100);
  }

  function onMouseMove(e: MouseEvent) {
    const rect = container.getBoundingClientRect();
    updateMouse(e.clientX - rect.left, e.clientY - rect.top);
  }

  function onTouchMove(e: TouchEvent) {
    const touch = e.touches[0];
    const rect = container.getBoundingClientRect();
    updateMouse(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  function updateMouse(x: number, y: number) {
    mouse.x = x;
    mouse.y = y;
    if (!mouse.set) {
      mouse.sx = mouse.x;
      mouse.sy = mouse.y;
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.set = true;
    }
  }

  onMount(() => {
    ctx = canvas.getContext("2d");
    if (ctx) {
      // Set initial context properties
      ctx.imageSmoothingEnabled = false;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    setSize();
    setLines();
    frameId = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
  });

  onDestroy(() => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("touchmove", onTouchMove);
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
    if (resizeTimeout !== null) {
      clearTimeout(resizeTimeout);
    }
  });

  $: config = {
    lineColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    friction,
    tension,
    maxCursorMove,
    xGap,
    yGap,
  };
</script>

<div
  bind:this={container}
  style="background-color: {backgroundColor}; {Object.entries(style).map(([key, value]) => `${key}: ${value}`).join(';')}"
  class="absolute top-0 left-0 w-full h-full overflow-hidden {className}"
>
  <canvas bind:this={canvas} class="block w-full h-full"></canvas>
</div> 