'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { 
  Sparkles, 
  Atom, 
  FlaskConical, 
  Dna, 
  Compass, 
  Zap, 
  Search, 
  Layers, 
  ChevronDown, 
  Globe, 
  Activity,
  Microscope,
  Orbit
} from 'lucide-react';

interface ParallaxHeroProps {
  onExploreClick?: () => void;
  totalSimulations: number;
}

export default function ParallaxHero({ onExploreClick, totalSimulations }: ParallaxHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interpolated smooth coordinates for 60fps parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // Mouse move and Device Orientation handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Normalize from -1 to 1 based on center of hero
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetPos.current = { 
        x: Math.max(-1, Math.min(1, x)), 
        y: Math.max(-1, Math.min(1, y)) 
      };
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma: left-to-right tilt [-90, 90]
        // beta: front-to-back tilt [-180, 180]
        const x = Math.max(-1, Math.min(1, e.gamma / 30));
        const y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
        targetPos.current = { x, y };
      }
    };

    const handleMouseLeave = () => {
      targetPos.current = { x: 0, y: 0 };
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    // Smooth Lerp loop (like wagerfield/parallax friction: 0.1)
    const animate = () => {
      const lerp = 0.08;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * lerp;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * lerp;

      setMousePos({
        x: currentPos.current.x,
        y: currentPos.current.y
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Calculate transform style with given depth
  const getLayerStyle = (depth: number, rotateFactor: number = 0) => {
    const moveX = mousePos.x * depth * 55;
    const moveY = mousePos.y * depth * 45;
    const rotZ = mousePos.x * rotateFactor * 12;
    return {
      transform: `translate3d(${moveX}px, ${moveY}px, 0px) rotate(${rotZ}deg)`,
      willChange: 'transform',
      transition: 'none',
    };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full min-h-[480px] md:min-h-[560px] rounded-3xl overflow-hidden border border-slate-800/80 shadow-[0_25px_60px_-15px_rgba(2,6,23,0.9)] bg-gradient-to-b from-[#050b17] via-[#081226] to-[#030712] flex items-center justify-center p-6 md:p-12 select-none"
    >
      {/* ================= LAYER 0: Deep Starfield & Radial Nebula Background (Depth 0.05) ================= */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={getLayerStyle(0.05)}
      >
        {/* Glow Spheres */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-[450px] h-[450px] bg-indigo-600/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px]" />

        {/* Ambient Grid Matrix */}
        <div 
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />
      </div>

      {/* ================= LAYER 1: Deep Distant Orbit Rings & Constellations (Depth 0.15) ================= */}
      <div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={getLayerStyle(0.15)}
      >
        {/* Giant Outer Orbit Circle */}
        <div className="w-[620px] h-[620px] md:w-[780px] md:h-[780px] rounded-full border border-cyan-500/10 animate-[spin_120s_linear_infinite]" />
        {/* Mid Ellipse */}
        <div className="absolute w-[440px] h-[440px] md:w-[560px] md:h-[560px] rounded-full border border-dashed border-indigo-400/15 animate-[spin_80s_linear_infinite_reverse]" />
      </div>

      {/* ================= LAYER 2: Floating Science Particles & Constellation Dots (Depth 0.35) ================= */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={getLayerStyle(0.35, 0.1)}
      >
        {/* Sparkle Nodes */}
        <div className="absolute top-16 left-12 md:left-28 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md text-[11px] font-mono text-cyan-300 shadow-lg">
          <Orbit size={14} className="text-cyan-400 animate-spin" />
          <span>Mechanics & Quantum</span>
        </div>

        <div className="absolute top-20 right-10 md:right-32 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md text-[11px] font-mono text-pink-300 shadow-lg">
          <FlaskConical size={14} className="text-pink-400" />
          <span>Equilibrium & Reaction</span>
        </div>

        <div className="absolute bottom-20 left-16 md:left-36 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md text-[11px] font-mono text-emerald-300 shadow-lg">
          <Dna size={14} className="text-emerald-400" />
          <span>Genetics & Photosynthesis</span>
        </div>
      </div>

      {/* ================= LAYER 3: Interactive 3D Mid-ground Orbs & Badges (Depth 0.65) ================= */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={getLayerStyle(0.65, 0.25)}
      >
        {/* Glowing Atom Badge Left */}
        <div className="absolute top-1/2 -translate-y-24 left-6 md:left-20 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-cyan-600/40 via-cyan-500/20 to-blue-500/10 border border-cyan-400/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.35)]">
          <Atom className="w-7 h-7 md:w-8 md:h-8 text-cyan-300 animate-[spin_20s_linear_infinite]" />
        </div>

        {/* Floating Microscope Right */}
        <div className="absolute top-1/2 -translate-y-12 right-6 md:right-24 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600/40 via-teal-500/20 to-emerald-500/10 border border-emerald-400/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.35)]">
          <Microscope className="w-7 h-7 md:w-8 md:h-8 text-emerald-300" />
        </div>
      </div>

      {/* ================= LAYER 4: Foreground Typography & Interactive Content (Depth 0.95) ================= */}
      <div 
        className="relative z-20 text-center max-w-3xl mx-auto space-y-6"
        style={getLayerStyle(0.95, -0.05)}
      >
        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:border-cyan-400 transition-colors">
          <Sparkles size={14} className="text-amber-400 animate-pulse" />
          <span className="tracking-wider uppercase">LABSAINS VIRTUAL 2.0 • INTERACTIVE ENGINE</span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[10px] text-cyan-200 border border-cyan-400/30 font-mono">
            {totalSimulations} LABS
          </span>
        </div>

        {/* Hero Title with 3D Depth Lighting */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Laboratorium Virtual <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 drop-shadow-[0_10px_25px_rgba(6,182,212,0.4)]">
              Sains & Komputasi AI
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
            Eksplorasi fenomena fisika, mekanika fluida, kesetimbangan kimiawi, dan genetika molekuler melalui simulasi interaktif matematis real-time berstandar kurikulum nasional.
          </p>
        </div>

        {/* Interactive Fast Jump Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onExploreClick}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(6,182,212,0.5)] flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Compass size={18} /> Mulai Eksplorasi Praktikum
          </button>
          
          <div className="hidden sm:flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Fisika • Kimia • Biologi (SD / SMP / SMA)</span>
          </div>
        </div>
      </div>

      {/* ================= LAYER 5: Extreme Foreground Floating Glow Flares (Depth 1.3) ================= */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={getLayerStyle(1.3, 0.4)}
      >
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl" />
      </div>

      {/* Bottom Floating Scroll Cue */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[10px] text-slate-500 font-mono pointer-events-none opacity-80 animate-bounce">
        <span>GESER KURSOR / TILT UNTUK EFEK PARALLAX</span>
        <ChevronDown size={14} />
      </div>
    </div>
  );
}
