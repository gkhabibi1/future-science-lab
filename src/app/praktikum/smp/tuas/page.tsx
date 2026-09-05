"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, RotateCcw, ArrowLeft, Info, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function TuasSimulation() {
  // State Beban Kiri (Beban w)
  const [massLeft, setMassLeft] = useState(50); // kg
  const [distLeft, setDistLeft] = useState(2);  // meter
  
  // State Beban Kanan (Kuasa F)
  const [massRight, setMassRight] = useState(25); // kg
  const [distRight, setDistRight] = useState(4);  // meter

  const [tiltAngle, setTiltAngle] = useState(0);

  // Fisika Momen Gaya (Torsi): tau = F * d (asumsi g = 9.8 m/s^2 untuk torsi nyata)
  const g = 9.8;
  const torqueLeft = massLeft * g * distLeft;
  const torqueRight = massRight * g * distRight;
  const torqueDiff = torqueRight - torqueLeft;
  
  // Keuntungan Mekanis KM = l_kuasa / l_beban
  const mechanicalAdvantage = distLeft > 0 ? distRight / distLeft : 1;

  // Efek untuk menghitung rotasi papan setiap kali nilai berubah
  useEffect(() => {
    // Batasi sudut maksimal kemiringan papan (max 18 derajat)
    const rawAngle = (torqueDiff / (g * 10)) * 2;
    let newAngle = Math.max(-18, Math.min(18, rawAngle));
    
    // Threshold toleransi seimbang presisi jika torsi hampir nol
    if (Math.abs(torqueDiff) < 0.01) {
      newAngle = 0;
    }
    
    setTiltAngle(newAngle);
  }, [massLeft, distLeft, massRight, distRight, torqueDiff, g]);

  const resetDefault = () => {
    setMassLeft(50);
    setDistLeft(2);
    setMassRight(25);
    setDistRight(4);
  };

  const applyPreset = (m1: number, d1: number, m2: number, d2: number) => {
    setMassLeft(m1);
    setDistLeft(d1);
    setMassRight(m2);
    setDistRight(d2);
  };

  const isBalanced = Math.abs(torqueDiff) < 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-cyan-500 selection:text-white">
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
                  SMP • Fisika Mekanika
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Pesawat Sederhana Kelas VIII
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Laboratorium: Tuas Pengungkit
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Eksperimen kesetimbangan momen gaya (torsi), lengan beban, dan keuntungan mekanis (KM).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={resetDefault}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition shadow-sm w-full md:w-auto"
            >
              <RotateCcw size={15} /> Reset Posisi
            </button>
          </div>
        </header>

        {/* BANNER RUMUS FISIKA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Syarat Kesetimbangan:</span>
            <MathFormula formula="w \cdot l_w = F \cdot l_F \iff \tau_{\text{kiri}} = \tau_{\text{kanan}}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Keuntungan Mekanis (KM):</span>
            <MathFormula formula="\text{KM} = \frac{w}{F} = \frac{l_F}{l_w}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Torsi Bersih:</span>
            <MathFormula formula="\sum \tau = \tau_{\text{kanan}} - \tau_{\text{kiri}}" />
          </div>
        </div>

        {/* MAIN 4-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (1 Kolom) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Scale size={16} className="text-amber-400" /> Variabel Tuas
            </h3>

            {/* Sisi Beban (Kiri) */}
            <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-red-900/40">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Sisi Beban (Kiri)
              </span>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Massa Beban (<MathFormula formula="w" />):</span>
                  <span className="font-mono text-rose-400 font-bold">{massLeft} kg</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  step="5"
                  value={massLeft} 
                  onChange={(e) => setMassLeft(Number(e.target.value))} 
                  className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer" 
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Lengan Beban (<MathFormula formula="l_w" />):</span>
                  <span className="font-mono text-rose-300 font-bold">{distLeft} m</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="5" 
                  step="0.5" 
                  value={distLeft} 
                  onChange={(e) => setDistLeft(Number(e.target.value))} 
                  className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer" 
                />
              </div>
            </div>

            {/* Sisi Kuasa (Kanan) */}
            <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-sky-900/40">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Sisi Kuasa (Kanan)
              </span>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Gaya Kuasa (<MathFormula formula="F" />):</span>
                  <span className="font-mono text-sky-400 font-bold">{massRight} kg</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  step="5"
                  value={massRight} 
                  onChange={(e) => setMassRight(Number(e.target.value))} 
                  className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer" 
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Lengan Kuasa (<MathFormula formula="l_F" />):</span>
                  <span className="font-mono text-sky-300 font-bold">{distRight} m</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="5" 
                  step="0.5" 
                  value={distRight} 
                  onChange={(e) => setDistRight(Number(e.target.value))} 
                  className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer" 
                />
              </div>
            </div>

            {/* Preset Eksperimen Cepat */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Preset Skenario:</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(50, 2, 25, 4)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold text-left border border-slate-700 transition flex items-center justify-between"
                >
                  <span>1. Seimbang KM = 2x</span>
                  <span className="font-mono text-emerald-400 text-[10px]">50kg·2m = 25kg·4m</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(80, 1, 20, 4)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold text-left border border-slate-700 transition flex items-center justify-between"
                >
                  <span>2. Beban Berat KM = 4x</span>
                  <span className="font-mono text-emerald-400 text-[10px]">80kg·1m = 20kg·4m</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(60, 3, 20, 2)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold text-left border border-slate-700 transition flex items-center justify-between"
                >
                  <span>3. Condong Kiri (Jatuh)</span>
                  <span className="font-mono text-rose-400 text-[10px]">180 &gt; 40</span>
                </button>
              </div>
            </div>
          </div>

          {/* AREA KANVAS & DASHBOARD (3 Kolom) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Ruang Kanvas Jungkat-Jungkit */}
            <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col items-center justify-end overflow-hidden h-[360px] sm:h-[420px] backdrop-blur">
              
              {/* Header Status Seimbang */}
              <div className="w-full flex justify-between items-center mb-4 z-10 px-2">
                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 shadow-lg animate-pulse">
                      <CheckCircle2 size={15} /> Torsi Seimbang (Στ = 0)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/60 text-amber-400 shadow-lg">
                      <AlertTriangle size={15} /> Condong ke {tiltAngle < 0 ? 'Kiri (Beban)' : 'Kanan (Kuasa)'}
                    </span>
                  )}
                </div>

                <div className="text-right text-[11px] font-mono text-slate-400 bg-slate-950/70 px-3 py-1 rounded-lg border border-slate-800">
                  Sudut Kemiringan: <span className="text-white font-bold">{Math.abs(tiltAngle).toFixed(1)}°</span>
                </div>
              </div>

              {/* Grid Latar Belakang Sci-Fi */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Wrapper Batang Tuas Berputar */}
              <div 
                className="relative w-full max-w-2xl flex justify-center origin-bottom transition-transform duration-500 ease-out z-10"
                style={{ transform: `rotate(${tiltAngle}deg)`, marginBottom: '-6px' }}
              >
                {/* Batang Logam Utama */}
                <div className="w-full h-5 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-slate-500 relative flex items-center justify-between px-2">
                  {/* Tanda Skala Laser Meter */}
                  {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((m) => (
                    <div key={m} className="flex flex-col items-center">
                      <div className={`w-0.5 ${m === 0 ? 'h-3 bg-amber-400' : 'h-2 bg-slate-400'}`} />
                      <span className="text-[8px] font-mono text-slate-400 mt-1 select-none">
                        {m === 0 ? '0' : `${Math.abs(m)}m`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Beban Sisi Kiri (Merah) */}
                <div 
                  className="absolute bottom-6 bg-gradient-to-b from-rose-500 to-red-700 rounded-t-xl border-2 border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] flex flex-col items-center justify-center text-white font-bold transition-all duration-300"
                  style={{ 
                    left: `calc(50% - ${(distLeft / 5) * 48}% - ${Math.min(45, Math.max(25, massLeft * 0.45))}px)`,
                    width: `${Math.min(60, Math.max(36, massLeft * 0.65))}px`, 
                    height: `${Math.min(65, Math.max(36, massLeft * 0.65))}px` 
                  }}
                >
                  <span className="text-[10px] font-mono opacity-80">w</span>
                  <span className="text-xs font-mono font-black">{massLeft}kg</span>
                </div>

                {/* Beban Sisi Kanan (Kuasa Biru) */}
                <div 
                  className="absolute bottom-6 bg-gradient-to-b from-sky-400 to-blue-600 rounded-t-xl border-2 border-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.4)] flex flex-col items-center justify-center text-white font-bold transition-all duration-300"
                  style={{ 
                    right: `calc(50% - ${(distRight / 5) * 48}% - ${Math.min(45, Math.max(25, massRight * 0.45))}px)`,
                    width: `${Math.min(60, Math.max(36, massRight * 0.65))}px`, 
                    height: `${Math.min(65, Math.max(36, massRight * 0.65))}px` 
                  }}
                >
                  <span className="text-[10px] font-mono opacity-80">F</span>
                  <span className="text-xs font-mono font-black">{massRight}kg</span>
                </div>
              </div>

              {/* Fulkrum / Titik Tumpu Baja */}
              <div className="w-0 h-0 border-l-[32px] border-l-transparent border-r-[32px] border-r-transparent border-b-[64px] border-b-slate-700 relative z-20 drop-shadow-2xl">
                <div className="absolute top-1 -left-1.5 w-3 h-3 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse" />
              </div>

              {/* Landasan Dasar Laboratorium */}
              <div className="w-full h-8 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700 border-t-2 border-amber-500/60 shadow-inner flex items-center justify-between px-4 text-[10px] text-slate-400 font-mono z-20">
                <span>LAB-PHYSICS // MECHANICAL LEVER</span>
                <span>FULCRUM PIVOT: 0.00 M</span>
              </div>
            </div>

            {/* DASHBOARD METRIK KESETIMBANGAN (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                  Momen Gaya Kiri (Beban)
                </span>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  {torqueLeft.toFixed(1)} <span className="text-xs font-normal text-slate-400">N·m</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  <MathFormula formula={`\\tau_1 = ${massLeft} \\times 9.8 \\times ${distLeft}`} />
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Momen Gaya Kanan (Kuasa)
                </span>
                <div className="text-2xl font-black text-sky-400 font-mono">
                  {torqueRight.toFixed(1)} <span className="text-xs font-normal text-slate-400">N·m</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  <MathFormula formula={`\\tau_2 = ${massRight} \\times 9.8 \\times ${distRight}`} />
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Keuntungan Mekanis (KM)
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {mechanicalAdvantage.toFixed(2)}x
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {mechanicalAdvantage >= 1 ? 'Menggandakan gaya kuasa' : 'Memperbesar jarak tempuh'}
                </p>
              </div>

            </div>

            {/* PENJELASAN EDUKATIF KONSEPTUAL */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Prinsip Asas Tuas Archimedes:</strong>
                <p>
                  Tuas jenis pertama menempatkan titik tumpu (fulkrum) di antara beban dan kuasa. Semakin panjang <strong>lengan kuasa (<MathFormula formula="l_F" />)</strong> dibandingkan lengan beban (<MathFormula formula="l_w" />), maka semakin kecil gaya kuasa yang dibutuhkan untuk mengangkat beban berat. Ini adalah alasan mengapa linggis panjang mempermudah pengangkatan batu besar!
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
