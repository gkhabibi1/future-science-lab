'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
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

      {/* ================= LAYER 1: Deep Distant Orbit Rings & Revolving Atoms (Depth 0.15) ================= */}
      <div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
        style={getLayerStyle(0.15)}
      >
        {/* Giant Outer Orbit Circle (Solid-Dash Hybrid) */}
        <div className="relative w-[620px] h-[620px] md:w-[820px] md:h-[820px] rounded-full border border-cyan-500/15 animate-[spin_100s_linear_infinite]">
          {/* Planet / Heavy Ion on outer orbit */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_20px_rgba(6,182,212,0.9)] animate-pulse" />
            <div className="absolute w-10 h-10 rounded-full bg-cyan-500/20 blur-sm" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-teal-300 border border-white shadow-[0_0_15px_rgba(45,212,191,0.8)]" />
          </div>
        </div>

        {/* Primary Dashed Orbit Ring with Fast Revolving Atoms & Electrons */}
        <div className="absolute w-[460px] h-[460px] md:w-[600px] md:h-[600px] rounded-full border-2 border-dashed border-cyan-400/25 animate-[spin_35s_linear_infinite_reverse]">
          {/* Orbiting Atom Alpha (Glowing Cyan Electron) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center group">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 border-2 border-white shadow-[0_0_22px_rgba(34,211,238,1)] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </div>
            {/* Glowing tail / orbital flare */}
            <div className="absolute -right-6 w-12 h-2 bg-gradient-to-l from-transparent via-cyan-400/40 to-cyan-300 rounded-full blur-[1px]" />
          </div>

          {/* Orbiting Atom Beta (Glowing Amber Positron) at 180 deg */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 border-2 border-white shadow-[0_0_20px_rgba(251,191,36,1)] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
            <div className="absolute -left-6 w-10 h-1.5 bg-gradient-to-r from-transparent via-amber-400/40 to-amber-300 rounded-full blur-[1px]" />
          </div>
        </div>

        {/* Tilted Elliptical Atomic Electron Ring (3D Ellipse Orbit) */}
        <div 
          className="absolute w-[360px] h-[360px] md:w-[480px] md:h-[480px] rounded-full border border-dashed border-emerald-400/30 animate-[spin_24s_linear_infinite]"
          style={{ transform: 'rotateX(68deg) rotateY(25deg)' }}
        >
          {/* Orbiting Electron Particle on tilted plane */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-emerald-400 border border-white shadow-[0_0_18px_rgba(52,211,153,1)] animate-ping" />
            <div className="w-3 h-3 rounded-full bg-emerald-300 border border-white shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
          </div>
        </div>

        {/* Counter Tilted Atomic Electron Ring (Second 3D Axis) */}
        <div 
          className="absolute w-[340px] h-[340px] md:w-[450px] md:h-[450px] rounded-full border border-dashed border-pink-400/25 animate-[spin_20s_linear_infinite_reverse]"
          style={{ transform: 'rotateX(-65deg) rotateY(35deg)' }}
        >
          {/* Orbiting Quantum Particle */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-pink-400 border border-white shadow-[0_0_16px_rgba(244,114,182,1)]" />
          </div>
        </div>
      </div>

      {/* ================= LAYER 2: Floating Science Particles & Constellation Dots (Depth 0.35) ================= */}
      <div 
        className="absolute inset-0 pointer-events-none hidden sm:block"
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
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={getLayerStyle(0.65, 0.25)}
      >
        {/* Glowing Brand Logo Badge Left */}
        <div className="absolute top-1/2 -translate-y-24 left-6 md:left-20 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-cyan-950/60 via-slate-900/80 to-blue-950/60 border border-cyan-400/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.4)] group">
          <Image
            src="https://ik.imagekit.io/e2yna5qg8/ChatGPT%20Image%20Sep%205,%202026,%2011_59_16%20AM_11zon.png"
            alt="LABSAINS Emblem"
            width={52}
            height={52}
            className="object-contain drop-shadow-[0_0_14px_rgba(34,211,238,0.7)] group-hover:scale-110 transition-transform"
          />
        </div>

        {/* Floating Microscope Right */}
        <div className="absolute top-1/2 -translate-y-12 right-6 md:right-24 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600/40 via-teal-500/20 to-emerald-500/10 border border-emerald-400/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.35)]">
          <Microscope className="w-7 h-7 md:w-8 md:h-8 text-emerald-300" />
        </div>
      </div>

      {/* ================= LAYER 4: Foreground Typography & Interactive Content (Depth 0.95) ================= */}
      <div 
        className="relative z-20 text-center max-w-3xl mx-auto space-y-4 sm:space-y-6"
        style={getLayerStyle(0.95, -0.05)}
      >
        {/* Pill Tag with Logo */}
        <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-slate-900/85 backdrop-blur-xl border border-cyan-500/40 text-cyan-300 text-[10px] sm:text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:border-cyan-400 transition-colors max-w-full overflow-hidden">
          <Image
            src="https://ik.imagekit.io/e2yna5qg8/ChatGPT%20Image%20Sep%205,%202026,%2011_59_16%20AM_11zon.png"
            alt="LABSAINS Mini Logo"
            width={16}
            height={16}
            className="object-contain drop-shadow-[0_0_6px_rgba(34,211,238,0.8)] shrink-0"
          />
          <span className="tracking-wider uppercase font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-200 truncate">
            LABSAINS VIRTUAL 2.0
          </span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-[9px] sm:text-[10px] text-cyan-200 border border-cyan-400/30 font-mono shrink-0">
            {totalSimulations} LABS
          </span>
        </div>

        {/* Hero Title with 3D Depth Lighting */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Laboratorium Virtual <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 drop-shadow-[0_10px_25px_rgba(6,182,212,0.4)]">
              Sains & Komputasi AI
            </span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-normal px-2">
            Eksplorasi fenomena fisika, mekanika fluida, kesetimbangan kimiawi, dan genetika molekuler melalui simulasi interaktif matematis real-time.
          </p>
        </div>

        {/* Interactive Fast Jump Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_10px_25px_-5px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Compass size={16} /> Mulai Eksplorasi Praktikum
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
