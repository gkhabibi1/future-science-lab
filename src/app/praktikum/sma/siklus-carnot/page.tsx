"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Flame, Snowflake, Activity, Zap, ArrowLeft, Play, Pause, RotateCcw, Info, Sparkles } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function CarnotSimulation() {
  // --- STATE PARAMETER ---
  const [Th, setTh] = useState(800); // Suhu Tinggi (Kelvin)
  const [Tc, setTc] = useState(300); // Suhu Rendah (Kelvin)
  const [isSimulating, setIsSimulating] = useState(true);

  // Pastikan Tc tidak pernah melebihi Th
  useEffect(() => { 
    if (Tc >= Th) setTc(Th - 50); 
  }, [Th, Tc]);

  // --- STATE ANIMASI ---
  // progress berjalan dari 0 sampai 4 (4 langkah siklus Carnot)
  const [progress, setProgress] = useState(0); 
  const requestRef = useRef<number | null>(null);

  // --- KALKULASI FISIKA ---
  const efisiensi = (1 - (Tc / Th)) * 100;

  // Animasi Loop
  useEffect(() => {
    const animate = () => {
      if (isSimulating) {
        setProgress((prev) => {
          let next = prev + 0.015;
          if (next >= 4) next = 0;
          return next;
        });
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    if (isSimulating) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isSimulating]);

  const handleReset = () => {
    setProgress(0);
  };

  const applyPreset = (newTh: number, newTc: number) => {
    setTh(newTh);
    setTc(newTc);
    setProgress(0);
  };

  // --- LOGIKA VISUAL: Diagram P-V & Piston ---
  let phase = 0; // 0=Iso Exp, 1=Adia Exp, 2=Iso Comp, 3=Adia Comp
  let phaseName = "";
  let pistonY = 0; // Posisi piston (Volume)
  let heatColor = "#94a3b8"; 

  if (progress < 1) {
    phase = 0;
    phaseName = "1. Ekspansi Isotermal (Menyerap Q_H pada T_H konstan)";
    pistonY = progress; 
    heatColor = "#f43f5e"; // Merah
  } else if (progress < 2) {
    phase = 1;
    phaseName = "2. Ekspansi Adiabatik (Memuai terisolasi, suhu turun ke T_C)";
    pistonY = 1 + (progress - 1); 
    heatColor = "#94a3b8"; // Abu-abu netral
  } else if (progress < 3) {
    phase = 2;
    phaseName = "3. Kompresi Isotermal (Melepas Q_C ke reservoir dingin pada T_C)";
    pistonY = 2 - (progress - 2); 
    heatColor = "#38bdf8"; // Biru dingin
  } else {
    phase = 3;
    phaseName = "4. Kompresi Adiabatik (Dimampatkan terisolasi, suhu naik ke T_H)";
    pistonY = 1 - (progress - 3);
    heatColor = "#94a3b8"; 
  }

  // Koordinat SVG P-V
  const getPVPoints = () => {
    const p1 = 30 + (1500 - Th) * 0.04; 
    const p2 = p1 + 35;                 
    const p3 = p2 + 65 + (Th - Tc) * 0.08; 
    const p4 = p1 + 65 + (Th - Tc) * 0.08; 
    return {
      A: { x: 55, y: p1 },
      B: { x: 155, y: p2 },
      C: { x: 255, y: p3 },
      D: { x: 135, y: p4 },
    };
  };
  const pts = getPVPoints();
  
  // Interpolasi posisi titik pada kurva
  const getDotPos = () => {
    if (phase === 0) return { x: pts.A.x + (pts.B.x - pts.A.x) * (progress), y: pts.A.y + (pts.B.y - pts.A.y) * (progress) };
    if (phase === 1) return { x: pts.B.x + (pts.C.x - pts.B.x) * (progress - 1), y: pts.B.y + (pts.C.y - pts.B.y) * (progress - 1) };
    if (phase === 2) return { x: pts.C.x + (pts.D.x - pts.C.x) * (progress - 2), y: pts.C.y + (pts.D.y - pts.C.y) * (progress - 2) };
    if (phase === 3) return { x: pts.D.x + (pts.A.x - pts.D.x) * (progress - 3), y: pts.D.y + (pts.A.y - pts.D.y) * (progress - 3) };
    return pts.A;
  };
  const dot = getDotPos();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-amber-500 selection:text-white">
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-amber-300 bg-amber-950/80 border border-amber-800">
                  SMA • Fisika Termodinamika
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Hukum II Termodinamika &amp; Efisiensi Mesin Kalor
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Simulasi Mesin Termal Siklus Carnot
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Diagram P-V dinamis, pergerakan silinder piston gas ideal, dan batas efisiensi reversibel Carnot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border shadow-sm w-full md:w-auto cursor-pointer ${
                isSimulating
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600/30'
                  : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
              }`}
            >
              {isSimulating ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
              {isSimulating ? 'Jeda Siklus' : 'Lanjutkan Siklus'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition shadow-sm w-full md:w-auto cursor-pointer"
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>
        </header>

        {/* BANNER RUMUS TERMODINAMIKA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Efisiensi Maksimum Carnot:</span>
            <MathFormula formula="\eta = \left( 1 - \frac{T_C}{T_H} \right) \times 100\%" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Usaha Bersih Siklus:</span>
            <MathFormula formula="W = Q_H - Q_C = \oint P \, dV" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Entropi Siklus Tertutup:</span>
            <MathFormula formula="\Delta S_{\text{siklus}} = \oint \frac{dQ}{T} = 0" />
          </div>
        </div>

        {/* MAIN 4-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (1 Kolom) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Activity size={16} className="text-amber-400" /> Suhu Reservoir Termal
            </h3>

            {/* Suhu Reservoir Panas Th */}
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-rose-900/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Flame size={14} className="text-rose-400" /> Reservoir Panas (<MathFormula formula="T_H" />):
                </span>
                <span className="font-mono text-rose-400 font-bold">{Th} K</span>
              </div>
              <input 
                type="range" min="400" max="1500" step="25" 
                value={Th} onChange={(e) => setTh(Number(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-lg accent-rose-500 cursor-pointer" 
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>400 K</span>
                <span>950 K</span>
                <span>1500 K</span>
              </div>
            </div>

            {/* Suhu Reservoir Dingin Tc */}
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-sky-900/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Snowflake size={14} className="text-sky-400" /> Reservoir Dingin (<MathFormula formula="T_C" />):
                </span>
                <span className="font-mono text-sky-400 font-bold">{Tc} K</span>
              </div>
              <input 
                type="range" min="100" max={Th - 50} step="25" 
                value={Tc} onChange={(e) => setTc(Number(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-lg accent-sky-500 cursor-pointer" 
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>100 K</span>
                <span>Maks: {Th - 50} K</span>
              </div>
            </div>

            {/* Preset Skenario Mesin */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Preset Mesin Nyata &amp; Ideal:</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(473, 298)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>1. Mesin Uap Klasik (Watt)</span>
                  <span className="font-mono text-amber-400 text-[9px]">η = 37.0%</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(1200, 300)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>2. Turbina Gas Modern</span>
                  <span className="font-mono text-emerald-400 text-[9px]">η = 75.0%</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(1500, 150)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>3. Carnot Hipotetis Ekstrem</span>
                  <span className="font-mono text-cyan-400 text-[9px]">η = 90.0%</span>
                </button>
              </div>
            </div>

          </div>

          {/* AREA KANVAS & DASHBOARD (3 Kolom) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Piston & Diagram P-V */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
              
              {/* 1. Animasi Silinder Piston Fisik (4 Kolom) */}
              <div className="md:col-span-4 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Silinder Piston Gas
                </span>
                
                {/* Tabung Silika Transparan */}
                <div 
                  className="w-28 h-56 border-4 border-slate-600 border-t-0 rounded-b-2xl relative overflow-hidden flex flex-col justify-end transition-all duration-300 shadow-inner"
                  style={{ backgroundColor: `${heatColor}15` }}
                >
                  {/* Fluida Gas Ideal dengan Warna Termal */}
                  <div 
                    className="absolute inset-0 transition-colors duration-500" 
                    style={{ backgroundColor: heatColor, opacity: 0.35 }} 
                  />

                  {/* Kepala Piston Baja */}
                  <div 
                    className="w-full h-5 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 border-t-2 border-slate-400 absolute transition-all duration-75 shadow-lg rounded-t-sm"
                    style={{ bottom: `${(pistonY / 2) * 80 + 10}%` }}
                  />

                  {/* Batang Piston */}
                  <div 
                    className="w-3 h-44 bg-gradient-to-b from-slate-400 to-slate-600 absolute left-1/2 -translate-x-1/2 transition-all duration-75 shadow-md"
                    style={{ bottom: `${(pistonY / 2) * 80 + 10}%` }}
                  />
                </div>

                <div className="mt-3 text-center">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Volume: <strong className="text-white">{(1 + (pistonY / 2) * 2).toFixed(2)} L</strong>
                  </span>
                </div>
              </div>

              {/* 2. Diagram Koordinat P-V (8 Kolom) */}
              <div className="md:col-span-8 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-amber-400" />
                    Kurva Diagram Tekanan (P) vs Volume (V)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Luas Area = Usaha Bersih (W)
                  </span>
                </div>

                <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617] p-3 relative h-[240px] flex items-center justify-center">
                  <div className="absolute top-2 left-3 text-[10px] font-mono font-bold text-slate-500">P (Tekanan) ↑</div>
                  <div className="absolute bottom-2 right-4 text-[10px] font-mono font-bold text-slate-500">V (Volume) →</div>

                  <svg width="320" height="210" viewBox="0 0 320 210" className="overflow-visible">
                    {/* Sumbu Axis */}
                    <line x1="30" y1="15" x2="30" y2="185" stroke="#475569" strokeWidth="2" />
                    <line x1="30" y1="185" x2="295" y2="185" stroke="#475569" strokeWidth="2" />

                    {/* Siklus Carnot Tertutup */}
                    <path 
                      d={`M ${pts.A.x} ${pts.A.y} Q ${pts.A.x + 45} ${pts.A.y} ${pts.B.x} ${pts.B.y} Q ${pts.B.x + 35} ${pts.B.y + 45} ${pts.C.x} ${pts.C.y} Q ${pts.C.x - 55} ${pts.C.y} ${pts.D.x} ${pts.D.y} Q ${pts.D.x - 45} ${pts.D.y - 45} ${pts.A.x} ${pts.A.y} Z`} 
                      fill="rgba(245, 158, 11, 0.18)" 
                      stroke="#f59e0b" 
                      strokeWidth="2.5" 
                      strokeLinejoin="round" 
                    />

                    {/* Label Titik Keadaan Termodinamika */}
                    <text x={pts.A.x - 14} y={pts.A.y + 4} fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#f43f5e">A</text>
                    <text x={pts.B.x + 8} y={pts.B.y + 2} fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#fbbf24">B</text>
                    <text x={pts.C.x + 8} y={pts.C.y + 10} fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#38bdf8">C</text>
                    <text x={pts.D.x - 14} y={pts.D.y + 12} fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#a78bfa">D</text>

                    {/* Titik Status Bergerak (Live Tracer) */}
                    <circle 
                      cx={dot.x} 
                      cy={dot.y} 
                      r="6" 
                      fill="#ffffff" 
                      stroke="#f59e0b" 
                      strokeWidth="3" 
                      className="shadow-[0_0_15px_rgba(245,158,11,1)]"
                    />
                  </svg>
                </div>

                {/* Banner Status Langkah Siklus Aktif */}
                <div className="mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">
                    Langkah Siklus Aktif
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {phaseName}
                  </span>
                </div>
              </div>

            </div>

            {/* DASHBOARD METRIK EFISIENSI (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Efisiensi Carnot (η)
                </span>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {efisiensi.toFixed(1)}%
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-700/60">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-400 h-full transition-all duration-300"
                    style={{ width: `${efisiensi}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                  Reservoir Panas (TH)
                </span>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  {Th} <span className="text-xs font-normal text-slate-400">K</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {(Th - 273.15).toFixed(0)}°C (Kalor Masuk QH)
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Reservoir Dingin (TC)
                </span>
                <div className="text-2xl font-black text-sky-400 font-mono">
                  {Tc} <span className="text-xs font-normal text-slate-400">K</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {(Tc - 273.15).toFixed(0)}°C (Kalor Buang QC)
                </p>
              </div>

            </div>

            {/* PENJELASAN EDUKATIF KONSEPTUAL */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Teorema Siklus Carnot &amp; Batas Hukum II Termodinamika:</strong>
                <p>
                  Nicolas Léonard Sadi Carnot (1824) membuktikan bahwa tidak ada mesin kalor nyata yang dapat memiliki efisiensi melebihi mesin Carnot reversibel yang bekerja di antara dua reservoir suhu yang sama. Efisiensi 100% secara termodinamika <strong>mustahil dicapai</strong> karena hal itu mensyaratkan suhu reservoir dingin mencapai nol mutlak (<MathFormula formula="T_C = 0\text{ K}" />), yang melanggar Hukum III Termodinamika. Energi terbuang (<MathFormula formula="Q_C" />) adalah konsekuensi alamiah dari peningkatan entropi semesta.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
