"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Activity, Settings2, Timer, ArrowLeft, Play, Pause, RotateCcw, Info, Sparkles } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function HarmonikSimulation() {
  // --- STATE KONTROL ---
  const [mode, setMode] = useState<'bandul' | 'pegas'>('bandul');
  const [isRunning, setIsRunning] = useState(true);
  const [, setTick] = useState(0); // Trigger re-render SVG di RAF

  // Parameter Bandul
  const [length, setLength] = useState(1.2); // meter
  const [gravity, setGravity] = useState(9.8); // m/s^2
  const maxAngle = 16; // Derajat (Sudut kecil SHM)

  // Parameter Pegas
  const [mass, setMass] = useState(1.5); // kg
  const [kSpring, setKSpring] = useState(20); // N/m
  const maxAmplitude = 45; // pixel visual

  // Referensi Waktu & Grafik
  const timeRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- KALKULASI FISIKA ---
  let omega = 0; // Kecepatan Sudut
  let period = 0; // Periode (T)

  if (mode === 'bandul') {
    omega = Math.sqrt(gravity / length);
    period = 2 * Math.PI * Math.sqrt(length / gravity);
  } else {
    omega = Math.sqrt(kSpring / mass);
    period = 2 * Math.PI * Math.sqrt(mass / kSpring);
  }

  const frequency = period > 0 ? 1 / period : 0;

  // --- ANIMASI LOOP ---
  const animate = useCallback(() => {
    if (!isRunning) return;
    
    timeRef.current += 0.016; // ~60fps
    const t = timeRef.current;
    setTick(t); // Trigger re-render SVG

    const canvas = graphCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Grid Background
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < canvas.width; x += 30) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Garis Tengah (Sumbu X)
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); 
        ctx.moveTo(0, canvas.height / 2); 
        ctx.lineTo(canvas.width, canvas.height / 2); 
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // 2. Gambar Gelombang Sinus Harmonik y(t)
        ctx.beginPath();
        ctx.strokeStyle = mode === 'bandul' ? '#38bdf8' : '#34d399';
        ctx.lineWidth = 3;
        ctx.shadowColor = mode === 'bandul' ? '#0ea5e9' : '#10b981';
        ctx.shadowBlur = 12;

        const ampPixel = 55;
        for (let x = 0; x < canvas.width; x++) {
          // Konversi pixel x ke waktu masa lalu mundur dari t sekarang
          const pastTime = t - (canvas.width - x) * 0.015;
          const y = (canvas.height / 2) - Math.cos(omega * pastTime) * ampPixel;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 3. Titik Indikator Terkini (Ujung Kanan)
        const currentY = (canvas.height / 2) - Math.cos(omega * t) * ampPixel;
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(canvas.width - 4, currentY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isRunning, omega, mode]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const handleReset = () => {
    timeRef.current = 0;
    setTick(0);
  };

  // Posisi fisik untuk SVG di detik t
  const currentAngle = maxAngle * Math.cos(omega * timeRef.current);
  const springY = maxAmplitude * Math.cos(omega * timeRef.current);

  // Jalur pegas zig-zag SVG realistis
  const numCoils = 9;
  const coilHeight = (90 + springY) / numCoils;
  let springPath = `M 150 15 `;
  for (let i = 1; i <= numCoils; i++) {
     const xOffset = i % 2 === 0 ? 168 : 132;
     springPath += `L ${xOffset} ${15 + (i * coilHeight)} `;
  }
  springPath += `L 150 ${15 + (90 + springY)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* TOP NAVIGATION & HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 shadow-sm"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-blue-300 bg-blue-950/80 border border-blue-800">
                  SMA • Fisika Getaran &amp; Gelombang
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Gerak Harmonik Sederhana (SHM)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Laboratorium Gerak Harmonik Sederhana
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengamatan periodisitas getaran, osilasi bandul matematis, dan sistem pegas Hooke.
              </p>
            </div>
          </div>

          {/* Toggle Mode Tab (Bandul vs Pegas) & Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
              <button 
                onClick={() => { setMode('bandul'); handleReset(); }} 
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition ${
                  mode === 'bandul' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bandul Matematis
              </button>
              <button 
                onClick={() => { setMode('pegas'); handleReset(); }} 
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition ${
                  mode === 'pegas' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sistem Pegas
              </button>
            </div>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition border ${
                isRunning 
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600/30' 
                  : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
              }`}
              title={isRunning ? 'Jeda Simulasi' : 'Lanjutkan Simulasi'}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center transition border border-slate-700 shadow-sm"
              title="Reset Waktu"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* BANNER RUMUS FISIKA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-blue-300">
          {mode === 'bandul' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Periode Bandul:</span>
                <MathFormula formula="T = 2\pi \sqrt{\frac{L}{g}}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Frekuensi Sudut:</span>
                <MathFormula formula="\omega = \sqrt{\frac{g}{L}}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Simpangan Sudut:</span>
                <MathFormula formula="\theta(t) = \theta_{\text{max}} \cos(\omega t)" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Periode Pegas:</span>
                <MathFormula formula="T = 2\pi \sqrt{\frac{m}{k}}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Frekuensi Sudut:</span>
                <MathFormula formula="\omega = \sqrt{\frac{k}{m}}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Gaya Pemulih Hooke:</span>
                <MathFormula formula="F = -k \cdot y(t)" />
              </div>
            </>
          )}
        </div>

        {/* MAIN 4-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (1 Kolom) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Settings2 size={16} className={mode === 'bandul' ? 'text-blue-400' : 'text-emerald-400'} />
              Parameter {mode === 'bandul' ? 'Bandul' : 'Pegas'}
            </h3>

            {mode === 'bandul' ? (
              <div className="space-y-5">
                {/* Panjang Tali */}
                <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-blue-900/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Panjang Tali (<MathFormula formula="L" />):</span>
                    <span className="font-mono text-blue-400 font-bold">{length.toFixed(2)} m</span>
                  </div>
                  <input 
                    type="range" min="0.4" max="2.5" step="0.1" 
                    value={length} onChange={(e) => setLength(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>0.4 m</span>
                    <span>1.5 m</span>
                    <span>2.5 m</span>
                  </div>
                </div>

                {/* Percepatan Gravitasi */}
                <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Gravitasi (<MathFormula formula="g" />):</span>
                    <span className="font-mono text-amber-400 font-bold">{gravity.toFixed(1)} m/s²</span>
                  </div>
                  <input 
                    type="range" min="1.6" max="25" step="0.2" 
                    value={gravity} onChange={(e) => setGravity(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer" 
                  />
                </div>

                {/* Preset Planet */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Preset Gravitasi Ruang:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setGravity(1.6)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition text-center"
                    >
                      Bulan (1.6)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGravity(3.7)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition text-center"
                    >
                      Mars (3.7)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGravity(9.8)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition text-center"
                    >
                      Bumi (9.8)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGravity(24.8)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition text-center"
                    >
                      Jupiter (24.8)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Massa Beban */}
                <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-emerald-900/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Massa Beban (<MathFormula formula="m" />):</span>
                    <span className="font-mono text-emerald-400 font-bold">{mass.toFixed(1)} kg</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="5.0" step="0.2" 
                    value={mass} onChange={(e) => setMass(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-emerald-500 cursor-pointer" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>0.5 kg</span>
                    <span>2.5 kg</span>
                    <span>5.0 kg</span>
                  </div>
                </div>

                {/* Konstanta Pegas k */}
                <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold">Konstanta Pegas (<MathFormula formula="k" />):</span>
                    <span className="font-mono text-cyan-400 font-bold">{kSpring} N/m</span>
                  </div>
                  <input 
                    type="range" min="5" max="60" step="1" 
                    value={kSpring} onChange={(e) => setKSpring(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-500 cursor-pointer" 
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>5 N/m (Lembek)</span>
                    <span>60 N/m (Kaku)</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* AREA KANVAS & DASHBOARD (3 Kolom) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Split Screen Stage: Visual Fisik & Grafik Osiloskop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
              
              {/* 1. Visual Fisik SVG */}
              <div className="bg-[#020617] rounded-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between items-center p-3 h-[290px]">
                <div className="w-full flex justify-between items-center text-[10px] font-mono text-slate-400 px-1 z-10">
                  <span>STAGE: {mode === 'bandul' ? 'PENDULUM' : 'SPRING HOOKE'}</span>
                  <span className="text-emerald-400">FPS: 60 REALTIME</span>
                </div>

                <svg width="280" height="230" className="w-full h-full">
                  {/* Penahan Atap Baja */}
                  <rect x="40" y="0" width="200" height="15" fill="#334155" rx="3" stroke="#475569" strokeWidth="1" />
                  
                  {mode === 'bandul' ? (
                    // --- GAMBAR BANDUL ---
                    <g style={{ transformOrigin: '140px 15px', transform: `rotate(${currentAngle}deg)` }}>
                      {/* Tali Nilon */}
                      <line 
                        x1="140" y1="15" 
                        x2="140" y2={15 + Math.min(180, length * 65)} 
                        stroke="#94a3b8" 
                        strokeWidth="2.5" 
                      />
                      {/* Bola Bandul Logam Bercahaya */}
                      <circle 
                        cx="140" 
                        cy={15 + Math.min(180, length * 65)} 
                        r="16" 
                        fill="url(#pendulumGrad)" 
                        stroke="#60a5fa" 
                        strokeWidth="2" 
                      />
                      <defs>
                        <radialGradient id="pendulumGrad" cx="30%" cy="30%">
                          <stop offset="0%" stopColor="#93c5fd" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </radialGradient>
                      </defs>
                    </g>
                  ) : (
                    // --- GAMBAR PEGAS ---
                    <g>
                      {/* Spiral Pegas Logam */}
                      <path 
                        d={springPath} 
                        fill="none" 
                        stroke="#94a3b8" 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                      {/* Balok Beban Bercahaya */}
                      <rect 
                        x="120" 
                        y={15 + (90 + springY)} 
                        width="60" 
                        height={24 + (mass * 6)} 
                        fill="#059669" 
                        stroke="#34d399" 
                        strokeWidth="2" 
                        rx="5" 
                      />
                      <text 
                        x="150" 
                        y={15 + (90 + springY) + 16} 
                        fill="#ffffff" 
                        fontSize="10" 
                        fontFamily="monospace" 
                        fontWeight="bold" 
                        textAnchor="middle"
                      >
                        {mass}kg
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              {/* 2. Grafik Simpangan Canvas Real-time */}
              <div className="bg-[#020617] rounded-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between p-3 h-[290px]">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 px-1 z-10">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Activity size={13} className={mode === 'bandul' ? 'text-blue-400' : 'text-emerald-400'} />
                    Simpangan y(t) vs Waktu (t)
                  </span>
                  <span className="text-slate-500">KONTINU</span>
                </div>

                <div className="w-full h-[240px]">
                  <canvas ref={graphCanvasRef} width={400} height={240} className="w-full h-full block" />
                </div>
              </div>

            </div>

            {/* DASHBOARD METRIK HARMONIK (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                  Periode Getaran (T)
                </span>
                <div className="text-2xl font-black text-blue-400 font-mono">
                  {period.toFixed(2)} <span className="text-xs font-normal text-slate-400">sekon</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Waktu 1 siklus osilasi penuh
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Frekuensi Getaran (f)
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {frequency.toFixed(2)} <span className="text-xs font-normal text-slate-400">Hz</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  f = 1 / T (jumlah getaran/detik)
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Frekuensi Sudut (ω)
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {omega.toFixed(2)} <span className="text-xs font-normal text-slate-400">rad/s</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  ω = 2πf = 2π / T
                </p>
              </div>

            </div>

            {/* PENJELASAN EDUKATIF KONSEPTUAL */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Karakteristik Fundamental Gerak Harmonik Sederhana:</strong>
                <p>
                  Pada <strong>Bandul Matematis</strong>, periode getaran hanya dipengaruhi oleh panjang tali (<MathFormula formula="L" />) dan percepatan gravitasi (<MathFormula formula="g" />), sama sekali <em>tidak dipengaruhi</em> oleh massa bandul. Sebaliknya, pada <strong>Sistem Pegas</strong>, periode dipengaruhi oleh massa beban (<MathFormula formula="m" />) dan konstanta kekakuan pegas (<MathFormula formula="k" />), dan <em>tidak dipengaruhi</em> oleh percepatan gravitasi lokal.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
