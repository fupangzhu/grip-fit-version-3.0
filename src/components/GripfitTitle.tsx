import { useCallback, useEffect, useRef } from 'react';

type Particle = {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  phase: number;
};

type GripfitTitleProps = {
  width?: number;
  height?: number;
};

export default function GripfitTitle({ width = 720, height = 180 }: GripfitTitleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    particles: [] as Particle[],
    animId: 0,
    mouseX: -9999,
    mouseY: -9999,
    shimmer: -160,
    tick: 0,
  });

  const buildParticles = useCallback((w: number, h: number): Particle[] => {
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;

    const ctx = offscreen.getContext('2d');
    if (!ctx) return [];

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${Math.floor(h * 0.82)}px 'Space Grotesk', 'Arial Black', Arial, sans-serif`;
    ctx.fillText('GRIPFIT', 0, h / 2 + 3);

    const pixels = ctx.getImageData(0, 0, w, h).data;
    const gap = 5;
    const particles: Particle[] = [];

    for (let y = 0; y < h; y += gap) {
      for (let x = 0; x < w; x += gap) {
        const index = (y * w + x) * 4;
        const alpha = pixels[index + 3];

        if (alpha > 90) {
          const brightness = pixels[index] / 255;
          particles.push({
            hx: x,
            hy: y,
            x: x + (Math.random() - 0.5) * w * 0.22,
            y: y + (Math.random() - 0.5) * h * 0.42,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 1 + brightness * 1.15,
            baseAlpha: 0.42 + brightness * 0.5,
            alpha: 0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const state = stateRef.current;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.particles = buildParticles(width, height);
    state.shimmer = -160;
    state.tick = 0;

    const spring = 0.075;
    const damping = 0.78;
    const mouseRadius = 86;
    const mouseForce = 5.4;
    const shimmerSpeed = 1.8;
    const shimmerWidth = 112;

    const draw = () => {
      state.tick += 1;
      state.animId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      state.shimmer += shimmerSpeed;
      if (state.shimmer > width + shimmerWidth) state.shimmer = -shimmerWidth;

      for (const p of state.particles) {
        const ax = (p.hx - p.x) * spring;
        const ay = (p.hy - p.y) * spring;
        const dx = p.x - state.mouseX;
        const dy = p.y - state.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRadius && dist > 0) {
          const force = ((mouseRadius - dist) / mouseRadius) * mouseForce;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.vx = (p.vx + ax) * damping;
        p.vy = (p.vy + ay) * damping;
        p.x += p.vx;
        p.y += p.vy;

        const driftX = Math.sin(state.tick * 0.008 + p.phase) * 0.32;
        const driftY = Math.cos(state.tick * 0.006 + p.phase) * 0.32;
        const x = p.x + driftX;
        const y = p.y + driftY;

        const distToShimmer = Math.abs(x - state.shimmer);
        const shimmerBoost = distToShimmer < shimmerWidth ? (1 - distToShimmer / shimmerWidth) * 0.64 : 0;
        const targetAlpha = p.baseAlpha + shimmerBoost;
        p.alpha += (targetAlpha - p.alpha) * 0.08;

        const shade = Math.floor(205 + shimmerBoost * 50);
        ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${p.alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // The shimmer only brightens particles; no background glow is painted.
    };

    draw();
    return () => cancelAnimationFrame(state.animId);
  }, [buildParticles, height, width]);

  useEffect(() => {
    const updateMouse = (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const margin = 96;

      if (x < -margin || y < -margin || x > rect.width + margin || y > rect.height + margin) {
        stateRef.current.mouseX = -9999;
        stateRef.current.mouseY = -9999;
        return;
      }

      stateRef.current.mouseX = x;
      stateRef.current.mouseY = y;
    };

    const handleWindowMouseMove = (event: MouseEvent) => updateMouse(event.clientX, event.clientY);
    const resetMouse = () => {
      stateRef.current.mouseX = -9999;
      stateRef.current.mouseY = -9999;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('blur', resetMouse);
    document.addEventListener('mouseleave', resetMouse);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('blur', resetMouse);
      document.removeEventListener('mouseleave', resetMouse);
    };
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    stateRef.current.mouseX = event.clientX - rect.left;
    stateRef.current.mouseY = event.clientY - rect.top;
  }, []);

  const handleMouseLeave = useCallback(() => {
    stateRef.current.mouseX = -9999;
    stateRef.current.mouseY = -9999;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="gripfit-title"
      aria-label="GRIPFIT"
      role="img"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}
