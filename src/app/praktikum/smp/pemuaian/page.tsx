"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, Ruler, ArrowLeft, RotateCcw, Info, Sparkles, Thermometer } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface MetalConfig {
  name: string;
  formulaSymbol: string;
  alpha: number;
  alphaDisplay: string;
  gradient: string;
  glowColor: string;
  textColor: string;
}

export default function PemuaianSimulation() {
  // --- STATE ---
  const [temperature, setTemperature] = useState(25); // Suhu awal ruangan (°C)
  const [selectedMetalKey, setSelectedMetalKey] = useState<string>('aluminium');
  
  // Panjang Awal = 100 cm (1 meter)
  const L0 = 100; 

  // Database Material Logam Presisi
  const metals: Record<string, MetalConfig> = {
    aluminium: { 
      name: 'Aluminium', 
      formulaSymbol: 'Al',
      alpha: 0.000024, 
      alphaDisplay: '24 \\times 10^{-6}',
      gradient: 'from-slate-400 via-slate-300 to-slate-400',
      glowColor: 'rgba(203, 213, 225, 0.4)',
      textColor: 'text-slate-300'
    },
    tembaga: { 
      name: 'Tembaga', 
      formulaSymbol: 'Cu',
      alpha: 0.000017, 
      alphaDisplay: '17 \\times 10^{-6}',
      gradient: 'from-amber-600 via-orange-500 to-amber-700',
      glowColor: 'rgba(249, 115, 22, 0.4)',
      textColor: 'text-orange-400'
    },
    besi: { 
      name: 'Besi / Baja', 
      formulaSymbol: 'Fe',
      alpha: 0.000012, 
      alphaDisplay: '12 \\times 10^{-6}',
      gradient: 'from-zinc-500 via-zinc-400 to-zinc-600',
      glowColor: 'rgba(113, 113, 122, 0.4)',
      textColor: 'text-zinc-400'
    },
    platina: { 
      name: 'Platina (Invar)', 
      formulaSymbol: 'Pt',
      alpha: 0.000009, 
      alphaDisplay: '9 \\times 10^{-6}',
      gradient: 'from-teal-600 via-teal-400 to-teal-700',
      glowColor: 'rgba(45, 212, 191, 0.4)',
      textColor: 'text-teal-400'
    },
  };

  const currentMetal = metals[selectedMetalKey];
  const deltaT = Math.max(0, temperature - 25);
  
  // Delta L dalam cm: Delta L = L0 * alpha * Delta T
  const deltaL = L0 * currentMetal.alpha * deltaT; 
  const finalLength = L0 + deltaL;
  
  // Skala visual agar perbedaan milimeter tampak jelas di layar (diperbesar 70x)
  const visualAddedWidth = deltaL * 70;

  // Derajat pijaran panas (thermochromic heat color)
  const heatIntensity = Math.min(1, deltaT / 450);

  const resetRoomTemp = () => {
    setTemperature(25);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-orange-500 selection:text-white">
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-orange-300 bg-orange-950/80 border border-orange-800">
                  SMP • Fisika Termal
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Suhu, Kalor, dan Pemuaian Zat
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Simulasi Pemuaian Zat Padat
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pengamatan pemuaian termal panjang batang logam akibat pemanasan suhu tinggi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={resetRoomTemp}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition shadow-sm w-full md:w-auto"
            >
              <RotateCcw size={15} /> Reset Suhu (25°C)
            </button>
          </div>
        </header>

        {/* BANNER RUMUS TERMAL (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-orange-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Pertambahan Panjang:</span>
            <MathFormula formula="\Delta L = L_0 \cdot \alpha \cdot \Delta T" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Panjang Akhir:</span>
            <MathFormula formula="L_t = L_0 (1 + \alpha \cdot \Delta T)" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Koefisien Muai:</span>
            <MathFormula formula="\alpha = \frac{\Delta L}{L_0 \cdot \Delta T}" />
          </div>
        </div>

        {/* MAIN 4-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (1 Kolom) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Thermometer size={16} className="text-orange-400" /> Parameter Termal
            </h3>

            {/* Pilihan Material Logam */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Pilih Jenis Logam Batang:
              </label>
              <div className="space-y-2">
                {Object.keys(metals).map((key) => {
                  const m = metals[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedMetalKey(key)}
                      className={`w-full p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between ${
                        selectedMetalKey === key
                          ? 'bg-orange-950/60 border-orange-500 text-orange-200 ring-1 ring-orange-500/40 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{m.name} ({m.formulaSymbol})</span>
                      <span className="font-mono text-[10px] text-amber-400">
                        α = {m.alpha * 1e6}×10⁻⁶
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider Temperatur Ruang */}
            <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Flame size={14} className="text-orange-500" /> Suhu Pemanas (<MathFormula formula="T" />):
                </span>
                <span className="font-mono text-base font-black text-orange-400">{temperature}°C</span>
              </div>
              <input 
                type="range" 
                min="25" 
                max="600" 
                step="5"
                value={temperature} 
                onChange={(e) => setTemperature(Number(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-lg accent-orange-500 cursor-pointer" 
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>25°C (Ruang)</span>
                <span>300°C</span>
                <span>600°C (Maks)</span>
              </div>
            </div>

            {/* Tombol Preset Suhu */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Preset Temperatur:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemperature(25)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition text-center"
                >
                  Suhu Ruang (25°C)
                </button>
                <button
                  type="button"
                  onClick={() => setTemperature(100)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition text-center"
                >
                  Air Mendidih (100°C)
                </button>
                <button
                  type="button"
                  onClick={() => setTemperature(300)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition text-center"
                >
                  Bara Api (300°C)
                </button>
                <button
                  type="button"
                  onClick={() => setTemperature(550)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition text-center"
                >
                  Tungku Panas (550°C)
                </button>
              </div>
            </div>

          </div>

          {/* AREA KANVAS & DASHBOARD (3 Kolom) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Stage Visualisasi Batang Logam & Pemanas Api */}
            <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col justify-between overflow-hidden h-[360px] sm:h-[400px] backdrop-blur">
              
              {/* Status Header Ruang Termal */}
              <div className="w-full flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                    <Ruler size={14} className="text-orange-400" /> Panjang Awal Batang: <strong className="text-white font-mono">100.00 cm</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-xl border border-orange-500/40 text-xs">
                  <Flame size={15} className={`text-orange-400 ${deltaT > 0 ? 'animate-bounce' : 'opacity-40'}`} />
                  <span className="font-mono text-orange-300 font-bold">ΔT = +{deltaT}°C</span>
                </div>
              </div>

              {/* Grid Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Dinding Penjepit Kiri (Fixed Clamp Wall) */}
              <div className="absolute left-4 top-16 bottom-16 w-10 bg-slate-800 border-r-4 border-amber-500/70 rounded-l-xl z-20 flex flex-col justify-around items-center py-4 shadow-2xl">
                <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-600" />
                <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-600" />
                <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-600" />
              </div>

              {/* Area Batang Logam & Pijaran Kalor */}
              <div className="relative w-full pl-14 pr-6 flex flex-col justify-center my-auto z-10">
                
                {/* Batang Logam */}
                <div className="relative h-12 flex items-center">
                  
                  {/* Panjang Awal L0 */}
                  <div 
                    className={`h-12 w-[62%] bg-gradient-to-r ${currentMetal.gradient} rounded-l-sm transition-all duration-300 relative z-10 shadow-lg flex items-center justify-between px-3 border-y border-white/20`}
                    style={{
                      boxShadow: heatIntensity > 0.1 ? `0 0 ${heatIntensity * 30}px rgba(239, 68, 68, ${heatIntensity * 0.7})` : 'none',
                      filter: heatIntensity > 0.2 ? `drop-shadow(0 0 10px rgba(249, 115, 22, ${heatIntensity}))` : 'none'
                    }}
                  >
                    <span className="text-[11px] font-mono font-bold text-slate-950/80 drop-shadow">
                      {currentMetal.name} (L₀ = 100 cm)
                    </span>
                  </div>

                  {/* Bagian Pertambahan Panjang (Delta L Animasi) */}
                  <div 
                    className="h-12 bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 rounded-r-md transition-all duration-200 ease-out z-10 border-y border-r border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.7)] flex items-center justify-end pr-1"
                    style={{ width: `${Math.max(4, visualAddedWidth)}px` }}
                  >
                    <div className="w-1.5 h-8 bg-white/80 rounded-full animate-pulse" />
                  </div>

                  {/* Indikator Laser Sensor Pemuaian */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 flex items-center transition-all duration-200"
                    style={{ left: `calc(62% + ${visualAddedWidth}px + 8px)` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <div className="bg-slate-950/90 border border-red-500/60 text-[10px] font-mono text-red-400 font-bold px-2 py-0.5 rounded ml-2 whitespace-nowrap shadow-lg">
                      ΔL = +{deltaL.toFixed(4)} cm
                    </div>
                  </div>
                </div>

                {/* Garis Penggaris Skala Kalibrasi */}
                <div className="w-[62%] mt-4 border-t-2 border-slate-600 relative">
                  <div className="absolute top-2 left-0 text-[10px] text-slate-400 font-mono font-bold">0 cm</div>
                  <div className="absolute top-2 right-0 text-[10px] text-slate-400 font-mono font-bold">L₀ (100 cm)</div>
                  <div className="absolute -top-1.5 right-0 w-0.5 h-3 bg-amber-400" />
                </div>

                {/* Pembakar Api Bunsen di Bawah Batang */}
                <div className="flex justify-around items-center w-[62%] mt-6">
                  {[1, 2, 3].map((burner) => (
                    <div key={burner} className="flex flex-col items-center">
                      <div 
                        className={`text-orange-500 transition-all duration-300 ${
                          deltaT > 0 ? 'opacity-100 scale-100 animate-pulse' : 'opacity-20 scale-75'
                        }`}
                        style={{ filter: deltaT > 50 ? 'drop-shadow(0 0 12px rgba(249, 115, 22, 0.9))' : 'none' }}
                      >
                        <Flame size={26 + Math.min(18, deltaT * 0.04)} fill="currentColor" />
                      </div>
                      <div className="w-7 h-3 bg-slate-700 rounded-b border-t border-slate-500 mt-0.5" />
                    </div>
                  ))}
                </div>

              </div>

              {/* Indikator Peringatan Suhu Tinggi */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-slate-800 pt-2 z-10">
                <span>SENSOR MICROMETER: SCALE 70x MAGNIFIED</span>
                <span className={temperature > 300 ? 'text-red-400 font-bold animate-pulse' : 'text-slate-500'}>
                  {temperature > 300 ? '⚠️ BAHAYA RADIASI KALOR TINGGI' : 'STATUS TERMAL AMAN'}
                </span>
              </div>
            </div>

            {/* DASHBOARD METRIK PEMUAIAN (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                  Kenaikan Suhu (ΔT)
                </span>
                <div className="text-2xl font-black text-orange-400 font-mono">
                  {deltaT} <span className="text-xs font-normal text-slate-400">°C</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  ΔT = {temperature}°C - 25°C
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                  Pertambahan Panjang (ΔL)
                </span>
                <div className="text-2xl font-black text-rose-400 font-mono">
                  +{deltaL.toFixed(4)} <span className="text-xs font-normal text-slate-400">cm</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  ({(deltaL * 10).toFixed(3)} mm)
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Panjang Akhir (Lt)
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {finalLength.toFixed(4)} <span className="text-xs font-normal text-slate-400">cm</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  L₀ + ΔL
                </p>
              </div>

            </div>

            {/* PENJELASAN EDUKATIF KONSEPTUAL */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-orange-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Analisis Koefisien Muai Panjang (<MathFormula formula="\alpha" />):</strong>
                <p>
                  Semakin besar nilai koefisien muai panjang suatu bahan, semakin cepat dan panjang pertambahan dimensinya saat dipanaskan. Sebagai contoh, <strong>Aluminium (<MathFormula formula="\alpha = 24 \times 10^{-6}/\text{°C}" />)</strong> memuai dua kali lebih panjang dibandingkan <strong>Besi (<MathFormula formula="\alpha = 12 \times 10^{-6}/\text{°C}" />)</strong> pada suhu yang sama. Penerapan praktis fenomena ini terlihat pada celah sambungan rel kereta api, kabel transmisi listrik yang sengaja dipasang kendur, dan keping bimetal pada saklar otomatis seterika listrik.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
