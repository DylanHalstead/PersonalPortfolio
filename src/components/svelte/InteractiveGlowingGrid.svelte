<script>
  // Tweaked from: https://codepen.io/osmosupply/pen/azzKmwX
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import InertiaPlugin from 'gsap/InertiaPlugin';

  export let enableInertia = false;

  let dotsContainer;
  let dots = [];
  let dotCenters = [];
  let ctx;
  let section;
  let rafId;
  let isHovered = false;

  const colors = { 
    base: { color: "#5B5B5B", opacity: 0.5 },
    active: { color: "#3A31D8", opacity: 1 }
  };
  // This controls the radius of the glow and gravity
  const threshold = 120;
  // How fast the dots move when you move your mouse
  const speedThreshold = 100;
  // How far the dots will move when you click
  const shockRadius = 100;
  // How much the dots will move when you click
  const shockPower = 5;
  // How fast the dots will move when you move your mouse
  const maxSpeed = 5000;
  // How many dots you can have
  const maxDots = 1000; 
  // How much the dots will resist the mouse
  const resistance = 5000;

  let lastTime = 0, lastX = 0, lastY = 0;

  function buildGrid() {
    if (!dotsContainer) return;
    
    dots = [];
    dotCenters = [];

    const contW = dotsContainer.clientWidth;
    const contH = dotsContainer.clientHeight;
    
    let dotSize = 2.4;
    let gapSize = 18;
    
    let cols = Math.max(1, Math.floor((contW + gapSize) / (dotSize + gapSize)));
    let rows = Math.max(1, Math.floor((contH + gapSize) / (dotSize + gapSize)));
    let total = cols * rows;

    // If we have too many dots, scale up the dot size to reduce the count
    if (total > maxDots) {
      console.warn(`InteractiveGlowingGrid: Too many dots (${total}), scaling up dot size to maintain performance`);
      
      // Calculate the scale factor needed to get close to maxDots
      const scaleFactor = Math.sqrt(total / maxDots);
      dotSize = Math.ceil(dotSize * scaleFactor);
      gapSize = Math.ceil(gapSize * scaleFactor);
      
      // Recalculate grid with new dot size
      cols = Math.max(1, Math.floor((contW + gapSize) / (dotSize + gapSize)));
      rows = Math.max(1, Math.floor((contH + gapSize) / (dotSize + gapSize)));
      total = cols * rows;
    }

    dotsContainer.innerHTML = "";
    dotsContainer.style.gridTemplateColumns = `repeat(${cols}, ${dotSize}px)`;
    dotsContainer.style.gridTemplateRows = `repeat(${rows}, ${dotSize}px)`;
    dotsContainer.style.gap = `${gapSize}px`;

    for (let i = 0; i < total; i++) {
      const d = document.createElement("div");
      d.classList.add(
        "relative",
        "will-change-[transform,background-color,opacity]",
        "origin-center",
        "bg-[#5B5B5B]",
        "rounded-full",
        "translate-x-0",
        "translate-y-0"
      );
      d.style.width = `${dotSize}px`;
      d.style.height = `${dotSize}px`;
      d.style.opacity = colors.base.opacity;

      dotsContainer.appendChild(d);
      dots.push(d);
    }

    requestAnimationFrame(() => {
      dotCenters = dots
        .filter(d => !d._isHole)
        .map(d => {
          const r = d.getBoundingClientRect();
          return {
            el: d,
            x: r.left + window.scrollX + r.width / 2,
            y: r.top + window.scrollY + r.height / 2
          };
        });
    });
  }

  function handleMouseMove(e) {
    if (!isHovered) return;
    
    const now = performance.now();
    const dt = now - lastTime || 16;
    let dx = e.pageX - lastX;
    let dy = e.pageY - lastY;
    let vx = dx / dt * 1000;
    let vy = dy / dt * 1000;
    let speed = Math.hypot(vx, vy);

    if (speed > maxSpeed) {
      const scale = maxSpeed / speed;
      vx *= scale;
      vy *= scale;
      speed = maxSpeed;
    }

    lastTime = now;
    lastX = e.pageX;
    lastY = e.pageY;

    if (rafId) cancelAnimationFrame(rafId);
    
    rafId = requestAnimationFrame(() => {
      dotCenters.forEach(({ el, x, y }) => {
        // Calculate the distance between the dot and the mouse
        const dist = Math.hypot(x - e.pageX, y - e.pageY);
        // Calculate the space between the dot and the mouse
        const t = Math.max(0, 1 - dist / threshold);
        // Interpolate the color and opacity of the dot based on the distance
        const col = gsap.utils.interpolate(colors.base.color, colors.active.color, t);
        const opacity = gsap.utils.interpolate(colors.base.opacity, colors.active.opacity, t);
        // Set the color and opacity of the dot
        gsap.set(el, { 
          backgroundColor: col,
          opacity: opacity
        });

        // Only apply gravity effects if enableInertia is true
        if (enableInertia && speed > speedThreshold && dist < threshold && !el._inertiaApplied) {
          el._inertiaApplied = true;
          // Calculate the force of the mouse on the dot
          const pushX = (x - e.pageX) + vx * 0.005;
          const pushY = (y - e.pageY) + vy * 0.005;

          // Add the force to the dot
          ctx.add(() => {
            gsap.to(el, {
              inertia: { x: pushX, y: pushY, resistance: resistance },
              onComplete() {
                gsap.to(el, {
                  x: 0,
                  y: 0,
                  duration: 1.5,
                  ease: "elastic.out(1,0.75)"
                });
                el._inertiaApplied = false;
              }
            });
          });
        }
      });
    });
  }

  function handleMouseEnter() {
    isHovered = true;
  }

  function handleMouseLeave() {
    isHovered = false;
    if (rafId) cancelAnimationFrame(rafId);
    
    dotCenters.forEach(({ el }) => {
      gsap.to(el, {
        backgroundColor: colors.base.color,
        opacity: colors.base.opacity,
        duration: 0.3,
        ease: "power2.out"
      });
    });
  }

  function handleClick(e) {
    if (!enableInertia) return; // Skip click effects if gravity is disabled
    
    dotCenters.forEach(({ el, x, y }) => {
      const dist = Math.hypot(x - e.pageX, y - e.pageY);
      if (dist < shockRadius && !el._inertiaApplied) {
        el._inertiaApplied = true;
        const falloff = Math.max(0, 1 - dist / shockRadius);
        const pushX = (x - e.pageX) * shockPower * falloff;
        const pushY = (y - e.pageY) * shockPower * falloff;

        ctx.add(() => {
          gsap.to(el, {
            inertia: { x: pushX, y: pushY, resistance: 750 },
            onComplete() {
              gsap.to(el, {
                x: 0,
                y: 0,
                duration: 1.5,
                ease: "elastic.out(1,0.75)"
              });
              el._inertiaApplied = false;
            }
          });
        });
      }
    });
  }

  onMount(() => {
    gsap.registerPlugin(InertiaPlugin);
    window.addEventListener("resize", buildGrid);
    section.addEventListener("mousemove", handleMouseMove);
    section.addEventListener("click", handleClick);
    section.addEventListener("mouseenter", handleMouseEnter);
    section.addEventListener("mouseleave", handleMouseLeave);
    ctx = gsap.context(() => {
      buildGrid();
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ctx.revert();
      window.removeEventListener("resize", buildGrid);
      section.removeEventListener("mousemove", handleMouseMove);
      section.removeEventListener("click", handleClick);
      section.removeEventListener("mouseenter", handleMouseEnter);
      section.removeEventListener("mouseleave", handleMouseLeave);
    };
  });
</script>

<!--------- Osmo [https://osmo.supply/] --------->
<section bind:this={section} class="bg-stone-900 text-white m-0 p-4 rounded-xl border border-stone-700 justify-center items-center relative overflow-hidden inline-block">
  <div class="relative w-fit h-fit">
    <div bind:this={dotsContainer} class="absolute inset-0 grid place-items-center pointer-events-none justify-center items-center content-center"></div>
    <div class="relative z-10">
      <slot></slot>
    </div>
  </div>
</section>