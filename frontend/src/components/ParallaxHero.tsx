import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react';

interface ParallaxHeroProps {
  onGetStarted: () => void;
}

export const ParallaxHero: React.FC<ParallaxHeroProps> = ({ onGetStarted }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mouse parallax state with lerping
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);
  const isReducedMotion = useRef(false);

  useEffect(() => {
    isReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      if (isReducedMotion.current) return;
      const { innerWidth, innerHeight } = window;
      mouseTarget.current = {
        x: (e.clientX / innerWidth) * 2 - 1,
        y: (e.clientY / innerHeight) * 2 - 1
      };
    };

    const handleScroll = () => {
      if (isReducedMotion.current) return;
      scrollOffset.current = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Canvas animation: Layer 1 (Atmosphere & Particles), Layer 2 (Flowing Metallic Ribbons), Layer 4 (Path energy particles)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particles for Layer 1
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    let time = 0;

    const render = () => {
      time += 0.012;

      // Smooth mouse lerp
      if (!isReducedMotion.current) {
        mouseCurrent.current.x += (mouseTarget.current.x - mouseCurrent.current.x) * 0.05;
        mouseCurrent.current.y += (mouseTarget.current.y - mouseCurrent.current.y) * 0.05;
        setMousePos({ x: mouseCurrent.current.x, y: mouseCurrent.current.y });
      }

      const mx = mouseCurrent.current.x;
      const my = mouseCurrent.current.y;
      const sy = scrollOffset.current * 0.4;

      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric background radial vignette
      const bgGrad = ctx.createRadialGradient(
        width * 0.5 + mx * 50,
        height * 0.4 + my * 40 - sy * 0.2,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      bgGrad.addColorStop(0, '#2B211D');
      bgGrad.addColorStop(0.5, '#211611');
      bgGrad.addColorStop(1, '#170E0B');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // LAYER 1: Distant subtle floating particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = p.alpha + Math.sin(time * 2 + p.pulsePhase) * 0.2;
        ctx.fillStyle = `rgba(232, 199, 142, ${Math.max(0.1, currentAlpha)})`;
        ctx.beginPath();
        const px = p.x - mx * 25;
        const py = p.y - my * 20 - sy * 0.15;
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // LAYER 2: Large Flowing Metallic Ribbons (The Flow of Money)
      const drawRibbon = (
        yBase: number,
        amplitude: number,
        freq: number,
        speed: number,
        thickness: number,
        colorStart: string,
        colorEnd: string,
        parallaxFactor: number
      ) => {
        ctx.save();
        ctx.beginPath();
        const offsetY = yBase + my * 60 * parallaxFactor - sy * parallaxFactor;
        const offsetX = mx * 40 * parallaxFactor;

        for (let x = -50; x <= width + 50; x += 15) {
          const wave1 = Math.sin(x * freq + time * speed) * amplitude;
          const wave2 = Math.cos(x * freq * 0.5 - time * speed * 0.7) * (amplitude * 0.4);
          const y = offsetY + wave1 + wave2;
          if (x === -50) {
            ctx.moveTo(x + offsetX, y);
          } else {
            ctx.lineTo(x + offsetX, y);
          }
        }

        const grad = ctx.createLinearGradient(0, offsetY - amplitude, width, offsetY + amplitude);
        grad.addColorStop(0, colorStart);
        grad.addColorStop(0.5, '#E8C78E');
        grad.addColorStop(1, colorEnd);

        ctx.strokeStyle = grad;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#C28B3D';
        ctx.shadowBlur = 18;
        ctx.globalAlpha = 0.45;
        ctx.stroke();
        ctx.restore();
      };

      // Flowing ribbons with varying depth, thickness, and metallic tones
      drawRibbon(height * 0.38, 55, 0.0022, 0.9, 3.5, '#85543A', '#C28B3D', 0.06);
      drawRibbon(height * 0.52, 70, 0.0018, -0.7, 4.5, '#C28B3D', '#85543A', 0.1);
      drawRibbon(height * 0.65, 45, 0.0028, 1.1, 2.8, '#A77E5C', '#E8C78E', 0.04);

      // LAYER 4: Tiny illuminated particles traveling along the ribbon flows
      for (let i = 0; i < 18; i++) {
        const offsetPhase = (time * 0.8 + (i * Math.PI) / 9) % (Math.PI * 2);
        const normX = (offsetPhase / (Math.PI * 2)) * width;
        const wave = Math.sin(normX * 0.0018 - time * 0.7) * 70;
        const cy = height * 0.52 + wave + my * 60 * 0.1 - sy * 0.1;
        const cx = normX + mx * 40 * 0.1;

        ctx.beginPath();
        ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF5E0';
        ctx.shadowColor = '#E8C78E';
        ctx.shadowBlur = 12;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Parallax offsets for layer 3 & 5
  const coinOffsetX = mousePos.x * 35;
  const coinOffsetY = mousePos.y * 30;
  const ringsOffsetX = mousePos.x * -25;
  const ringsOffsetY = mousePos.y * -20;
  const textOffsetX = mousePos.x * 12;
  const textOffsetY = mousePos.y * 10;

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden px-4 md:px-8"
      id="hero"
    >
      {/* Canvas for Layer 1, 2, 4 (Atmosphere, Metallic Ribbons, Energy Particles) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Subtle Noise Film Grain Overlay */}
      <div className="absolute inset-0 film-grain pointer-events-none z-[1]" />

      {/* LAYER 3: Interactive Floating Translucent Coins & Recurring Payment Rings */}
      {/* Floating 3D Coin (Left) */}
      <div
        className="absolute left-[6%] top-[25%] hidden lg:block pointer-events-none z-[2] transition-transform duration-300 ease-out animate-float-slow"
        style={{
          transform: `translate(${coinOffsetX * 1.2}px, ${coinOffsetY * 1.2}px) rotateX(${mousePos.y * 15}deg) rotateY(${mousePos.x * 20}deg)`
        }}
      >
        <div className="relative w-36 h-36 rounded-full p-[2px] bg-gradient-to-tr from-[#85543A] via-[#C28B3D] to-[#E8C78E] shadow-[0_20px_50px_rgba(194,139,61,0.25)]">
          <div className="w-full h-full rounded-full bg-[#2B211D]/90 backdrop-blur-md flex flex-col items-center justify-center border border-[#E8C78E]/30 text-center p-3">
            <span className="font-serif text-3xl font-bold text-[#E8C78E] drop-shadow-[0_2px_8px_rgba(232,199,142,0.5)]">₹</span>
            <span className="text-[10px] tracking-widest uppercase font-semibold text-[#C28B3D] mt-0.5">UPI AutoPay</span>
            <div className="w-6 h-[1.5px] bg-[#E8C78E]/40 my-1"></div>
            <span className="text-[9px] text-[#F5EBDD]/70 font-mono">Pre-Debit Alert</span>
          </div>
        </div>
      </div>

      {/* Floating Recurring Mandate Ring Node (Right) */}
      <div
        className="absolute right-[7%] top-[28%] hidden lg:block pointer-events-none z-[2] transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${ringsOffsetX * 1.1}px, ${ringsOffsetY * 1.1}px) rotate(${mousePos.x * 12}deg)`
        }}
      >
        <div className="relative w-44 h-44 rounded-full border border-[#C28B3D]/30 flex items-center justify-center p-3 animate-spin [animation-duration:40s]">
          <div className="absolute inset-0 rounded-full border border-dashed border-[#E8C78E]/25"></div>
          <div className="w-28 h-28 rounded-full border-2 border-[#85543A] bg-[#2B211D]/80 backdrop-blur-md flex flex-col items-center justify-center shadow-lg">
            <RefreshCw className="w-6 h-6 text-[#E8C78E] animate-spin [animation-duration:12s]" />
            <span className="text-[9px] uppercase tracking-wider font-bold text-[#C28B3D] mt-1.5">Mandate Flow</span>
            <span className="text-[8px] text-[#75836B] font-mono">NPCI Aligned</span>
          </div>
        </div>
      </div>

      {/* Floating Small Coin Node (Bottom Left) */}
      <div
        className="absolute left-[12%] bottom-[16%] hidden md:block pointer-events-none z-[2] transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${coinOffsetX * 0.8}px, ${coinOffsetY * 0.8}px)`
        }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-full metallic-card text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-[#C28B3D] animate-ping" />
          <span className="text-[#F5EBDD]/90 font-mono tracking-tight">Active E-Mandate Audit</span>
        </div>
      </div>

      {/* LAYER 5: Foreground Minimal Product Branding & Single Primary CTA */}
      <div
        className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center transition-transform duration-200 ease-out py-12"
        style={{
          transform: `translate(${textOffsetX}px, ${textOffsetY}px)`
        }}
      >
        {/* Subtle Brand Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2B211D]/80 border border-[#C28B3D]/30 backdrop-blur-md mb-8 hover:border-[#C28B3D]/60 transition-all cursor-default">
          <Sparkles className="w-3.5 h-3.5 text-[#E8C78E]" />
          <span className="text-xs uppercase tracking-widest font-semibold text-[#E8C78E]">
            Financial Clarity Engine
          </span>
          <span className="text-[#C28B3D]/50 text-xs">&bull;</span>
          <span className="text-xs text-[#F5EBDD]/80 tracking-wide font-mono">
            NPCI & RBI Grounded
          </span>
        </div>

        {/* Product Name */}
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[1.02] mb-6">
          <span className="gold-gradient-text drop-shadow-[0_12px_40px_rgba(194,139,61,0.25)]">
            SPASHTMANDATE
          </span>
          <span className="text-[#C28B3D] text-4xl sm:text-6xl md:text-7xl font-light italic ml-3">
            AI
          </span>
        </h1>

        {/* Main Tagline */}
        <div className="relative mb-6 max-w-2xl">
          <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-[#C28B3D] to-transparent mx-auto mb-5"></div>
          <p className="font-serif text-2xl sm:text-3xl md:text-4xl italic text-[#F5EBDD] font-medium tracking-wide">
            "Every payment deserves clarity."
          </p>
        </div>

        {/* Supporting Line */}
        <p className="text-lg sm:text-xl md:text-2xl text-[#F5EBDD]/85 font-normal max-w-xl mx-auto mb-12 leading-relaxed font-sans">
          Understand what you agree to. Know what gets charged. Stay in control.
        </p>

        {/* Prominent Get Started / Sign In Action */}
        <div className="flex flex-col items-center justify-center gap-3 w-full max-w-sm">
          <button
            onClick={onGetStarted}
            className="group relative w-full px-10 py-5 rounded-2xl bg-gradient-to-r from-[#85543A] via-[#C28B3D] to-[#E8C78E] text-[#211611] font-bold text-base tracking-widest uppercase shadow-[0_12px_35px_rgba(194,139,61,0.4)] hover:shadow-[0_18px_45px_rgba(194,139,61,0.6)] transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Get Started / Sign In</span>
            <ArrowRight className="w-5 h-5 text-[#211611] transition-transform group-hover:translate-x-1.5" />
          </button>
          <span className="text-xs text-[#A77E5C] font-mono mt-1">
            Sign in to analyze real subscription disclosures & timelines
          </span>
        </div>
      </div>
    </section>
  );
};
