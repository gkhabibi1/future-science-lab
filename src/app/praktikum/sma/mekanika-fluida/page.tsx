"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Waves, FastForward, Anchor, Droplet, ArrowLeft, RotateCcw, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function FluidaSimulation() {
  const [tab, setTab] = useState<'archimedes' | 'venturi'>('archimedes');

  // --- STATE ARCHIMEDES (Fluida Statis) ---
  const [rhoBenda, setRhoBenda] = useState(400); // Massa Jenis Benda (kg/m3) -> Default: Kayu
  const [rhoFluida, setRhoFluida] = useState(1000); // Massa Jenis Fluida (kg/m3) -> Default: Air
  const [volumeBenda] = useState(1); // m3
  const g = 9.8;

  // --- STATE VENTURIMETER (Fluida Dinamis) ---
  const [A1] = useState(10); // Luas Penampang 1 (cm2)
  const [v1, setV1] = useState(2.5); // Kecepatan di Penampang 1 (m/s)
  const [A2, setA2] = useState(5); // Luas Penampang 2 (Penyempitan) (cm2)

  // --- KALKULASI ARCHIMEDES ---
  let fractionSubmerged = rhoBenda / rhoFluida;
  let statusArchimedes = "Terapung";
  let statusColor = "text-amber-400";
  let statusBadgeBg = "bg-amber-950/80 border-amber-500/60";

  if (fractionSubmerged > 1) {
    fractionSubmerged = 1;
    statusArchimedes = "Tenggelam di Dasar";
    statusColor = "text-rose-400";
    statusBadgeBg = "bg-rose-950/80 border-rose-500/60";
  } else if (Math.abs(rhoBenda - rhoFluida) < 5) {
    fractionSubmerged = 1;
    statusArchimedes = "Melayang di Tengah";
    statusColor = "text-cyan-400";
    statusBadgeBg = "bg-cyan-950/80 border-cyan-500/60";
  }

  const weight = rhoBenda * volumeBenda * g;
  const buoyantForce = rhoFluida * (fractionSubmerged * volumeBenda) * g;

  // Posisi Y balok di akuarium
  let yPos = 35;
  if (statusArchimedes === "Terapung") {
    yPos = 30 + (fractionSubmerged * 70);
  } else if (statusArchimedes === "Melayang di Tengah") {
    yPos = 110;
  } else {
    yPos = 168; // Tenggelam kandas di dasar
  }

  // --- KALKULASI VENTURIMETER (KONTINUITAS) ---
  // A1 * v1 = A2 * v2 => v2 = (A1 * v1) / A2
  const v2 = (A1 * v1) / A2;
  
  // Beda Tekanan Bernoulli: P1 - P2 = 0.5 * rho * (v2^2 - v1^2)
  const deltaP = 0.5 * 1000 * (Math.pow(v2, 2) - Math.pow(v1, 2));
  const deltaP_visual = Math.min(55, deltaP * 0.005); 

  const resetArchimedes = () => {
    setRhoBenda(400);
    setRhoFluida(1000);
  };

  const resetVenturi = () => {
    setV1(2.5);
    setA2(5);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-sky-500 selection:text-white">
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-sky-300 bg-sky-950/80 border border-sky-800">
                  SMA • Fisika Mekanika Fluida
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Statika &amp; Dinamika Fluida
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Laboratorium Mekanika Fluida
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Studi Statika (Hukum Archimedes &amp; Gaya Apung) &amp; Dinamika Fluida (Tabung Venturi &amp; Azas Kontinuitas).
              </p>
            </div>
          </div>

          {/* Tab Switcher & Reset */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
              <button 
                onClick={() => setTab('archimedes')}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                  tab === 'archimedes' 
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Anchor size={14} /> Archimedes (Statik)
              </button>
              <button 
                onClick={() => setTab('venturi')}
                className={`px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                  tab === 'venturi' 
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FastForward size={14} /> Venturi (Dinamik)
              </button>
            </div>

            <button
              onClick={tab === 'archimedes' ? resetArchimedes : resetVenturi}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center transition border border-slate-700 shadow-sm"
              title="Reset Parameter"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* BANNER RUMUS FISIKA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-sky-300">
          {tab === 'archimedes' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Gaya Apung Archimedes:</span>
                <MathFormula formula="F_a = \rho_f \cdot V_{\text{celup}} \cdot g" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Syarat Mengapung:</span>
                <MathFormula formula="\rho_b < \rho_f \implies F_a = W" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Fraksi Tercelup:</span>
                <MathFormula formula="\frac{V_{\text{celup}}}{V_b} = \frac{\rho_b}{\rho_f}" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Asas Kontinuitas:</span>
                <MathFormula formula="A_1 v_1 = A_2 v_2 \implies v_2 = v_1 \cdot \frac{A_1}{A_2}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Hukum Bernoulli:</span>
                <MathFormula formula="P_1 + \frac{1}{2}\rho v_1^2 = P_2 + \frac{1}{2}\rho v_2^2" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Beda Tekanan:</span>
                <MathFormula formula="\Delta P = \frac{1}{2}\rho (v_2^2 - v_1^2) = \rho g \Delta h" />
              </div>
            </>
          )}
        </div>

        {/* TAB 1: HUKUM ARCHIMEDES (FLUIDA STATIS) */}
        {tab === 'archimedes' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            
            {/* Panel Kontrol Kiri (1 Kolom) */}
            <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <Droplet size={16} className="text-sky-400" /> Parameter Densitas (ρ)
              </h3>

              {/* Massa Jenis Benda */}
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-amber-900/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Densitas Benda (<MathFormula formula="\rho_b" />):</span>
                  <span className="font-mono text-amber-400 font-bold">{rhoBenda} kg/m³</span>
                </div>
                <input 
                  type="range" min="100" max="2800" step="50" 
                  value={rhoBenda} onChange={(e) => setRhoBenda(Number(e.target.value))} 
                  className="w-full h-2 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer" 
                />
                
                {/* Presets Benda */}
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <button onClick={() => setRhoBenda(400)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 p-1 rounded font-mono text-center border border-slate-700">
                    Kayu (400)
                  </button>
                  <button onClick={() => setRhoBenda(900)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-sky-300 p-1 rounded font-mono text-center border border-slate-700">
                    Es (900)
                  </button>
                  <button onClick={() => setRhoBenda(2700)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-zinc-300 p-1 rounded font-mono text-center border border-slate-700">
                    Alum (2700)
                  </button>
                </div>
              </div>

              {/* Massa Jenis Fluida Cairan */}
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-blue-900/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Densitas Fluida (<MathFormula formula="\rho_f" />):</span>
                  <span className="font-mono text-sky-400 font-bold">{rhoFluida} kg/m³</span>
                </div>
                <input 
                  type="range" min="500" max="1400" step="50" 
                  value={rhoFluida} onChange={(e) => setRhoFluida(Number(e.target.value))} 
                  className="w-full h-2 bg-slate-800 rounded-lg accent-sky-500 cursor-pointer" 
                />
                
                {/* Presets Cairan */}
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <button onClick={() => setRhoFluida(800)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-yellow-300 p-1 rounded font-mono text-center border border-slate-700">
                    Minyak (800)
                  </button>
                  <button onClick={() => setRhoFluida(1000)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-300 p-1 rounded font-mono text-center border border-slate-700">
                    Air (1000)
                  </button>
                  <button onClick={() => setRhoFluida(1030)} className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 p-1 rounded font-mono text-center border border-slate-700">
                    Laut (1030)
                  </button>
                </div>
              </div>

            </div>

            {/* Area Kanvas & Dashboard (3 Kolom) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Tangki Akuarium Transparan Archimedes */}
              <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col items-center justify-end h-[360px] sm:h-[400px] overflow-hidden backdrop-blur">
                
                {/* Status Badge */}
                <div className="w-full flex justify-between items-center mb-auto z-20">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusBadgeBg} ${statusColor}`}>
                    <CheckCircle2 size={14} /> Status: {statusArchimedes}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
                    Fraksi Tercelup: <strong className="text-white">{(fractionSubmerged * 100).toFixed(1)}%</strong>
                  </span>
                </div>

                {/* Grid Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />

                {/* Wadah Beaker Kaca Akrilik */}
                <div className="w-72 sm:w-80 h-64 border-4 border-slate-600 border-t-0 rounded-b-2xl relative flex justify-center bg-slate-950/40 z-10 shadow-2xl overflow-hidden">
                  
                  {/* Benda / Balok Uji */}
                  <div 
                    className="w-24 h-24 rounded-xl shadow-2xl absolute flex flex-col items-center justify-center font-bold text-white z-20 transition-all duration-700 ease-out border-2 border-white/40"
                    style={{ 
                      top: `${yPos}px`, 
                      backgroundColor: rhoBenda < 800 ? '#b45309' : rhoBenda < 1500 ? '#0284c7' : '#52525b',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
                    }}
                  >
                    <span className="text-[10px] font-mono opacity-80">Balok Uji</span>
                    <span className="text-xs font-mono font-black">{rhoBenda} kg/m³</span>
                  </div>

                  {/* Cairan Fluida dengan Gelombang Permukaan */}
                  <div 
                    className="w-full absolute bottom-0 rounded-b-xl transition-all duration-500 z-10"
                    style={{ 
                      height: `${145 + (fractionSubmerged * 25)}px`,
                      backgroundColor: rhoFluida < 900 ? 'rgba(234, 179, 8, 0.45)' : rhoFluida > 1010 ? 'rgba(6, 182, 212, 0.55)' : 'rgba(14, 165, 233, 0.5)',
                      borderTop: '2px solid rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    <div className="w-full h-2 bg-white/20 animate-pulse" />
                  </div>

                  {/* Skala Ukur Wadah */}
                  <div className="absolute left-2 top-8 text-[9px] font-mono text-slate-400">1000 mL</div>
                  <div className="absolute left-2 top-24 text-[9px] font-mono text-slate-500">500 mL</div>
                </div>

                <div className="w-full flex justify-between text-[10px] font-mono text-slate-500 pt-3 z-10">
                  <span>HYDROSTATIC TANK // DISPLACEMENT SIMULATOR</span>
                  <span>ACCELERATION g = 9.80 m/s²</span>
                </div>
              </div>

              {/* Dashboard Metrik Gaya (3 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                  <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                    Gaya Berat Benda (W)
                  </span>
                  <div className="text-2xl font-black text-rose-400 font-mono">
                    {weight.toFixed(0)} <span className="text-xs font-normal text-slate-400">N</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    W = m · g = ρ_b · V · g
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                  <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                    Gaya Apung Fluida (Fa)
                  </span>
                  <div className="text-2xl font-black text-sky-400 font-mono">
                    {buoyantForce.toFixed(0)} <span className="text-xs font-normal text-slate-400">N</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Fa = ρ_f · V_celup · g
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                  <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    Gaya Bersih Vertikal
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {Math.abs(weight - buoyantForce).toFixed(0)} <span className="text-xs font-normal text-slate-400">N</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {weight === buoyantForce ? 'Setimbang (ΣFy = 0)' : weight > buoyantForce ? 'Tenggelam (W > Fa)' : 'Terangkat ke Atas'}
                  </p>
                </div>

              </div>

              {/* Edukatif Archimedes */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
                <Info size={20} className="text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-1">Hukum Archimedes &amp; Syarat Apung:</strong>
                  <p>
                    Suatu benda yang dicelupkan sebagian atau seluruhnya ke dalam zat cair akan mengalami gaya ke atas (<MathFormula formula="F_a" />) yang besarnya sama dengan berat zat cair yang dipindahkan oleh benda tersebut. Bila kerapatan benda lebih kecil dari kerapatan fluida (<MathFormula formula="\rho_b < \rho_f" />), benda akan mengapung hingga gaya apung mengimbangi gaya beratnya (<MathFormula formula="F_a = W" />).
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: TABUNG VENTURIMETER (FLUIDA DINAMIS) */}
        {tab === 'venturi' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            
            {/* Panel Kontrol Kiri (1 Kolom) */}
            <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <FastForward size={16} className="text-teal-400" /> Parameter Aliran
              </h3>

              {/* Kecepatan Awal v1 */}
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Laju Pipa Lebar (<MathFormula formula="v_1" />):</span>
                  <span className="font-mono text-sky-400 font-bold">{v1.toFixed(1)} m/s</span>
                </div>
                <input 
                  type="range" min="1.0" max="8.0" step="0.5" 
                  value={v1} onChange={(e) => setV1(Number(e.target.value))} 
                  className="w-full h-2 bg-slate-800 rounded-lg accent-sky-500 cursor-pointer" 
                />
              </div>

              {/* Luas Penampang Penyempitan A2 */}
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-teal-900/40">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-semibold">Luas Leher Pipa (<MathFormula formula="A_2" />):</span>
                  <span className="font-mono text-teal-400 font-bold">{A2} cm²</span>
                </div>
                <input 
                  type="range" min="2.0" max="8.0" step="0.5" 
                  value={A2} onChange={(e) => setA2(Number(e.target.value))} 
                  className="w-full h-2 bg-slate-800 rounded-lg accent-teal-500 cursor-pointer" 
                />
                <p className="text-[11px] text-slate-400">
                  Luas penampang utama (<MathFormula formula="A_1" />) konstan pada 10 cm².
                </p>
              </div>

            </div>

            {/* Area Kanvas & Dashboard (3 Kolom) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Diagram Tabung Venturi SVG */}
              <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col justify-between backdrop-blur">
                <div className="flex justify-between items-center mb-3 z-10">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Waves size={14} className="text-teal-400" /> Tabung Venturi dengan Kolom Manometer
                  </span>
                  <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                    Fluida Inkompresibel
                  </span>
                </div>

                <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617] p-4 flex items-center justify-center relative">
                  <svg width="600" height="260" viewBox="0 0 600 260" className="w-full h-auto max-w-full">
                    {/* Aliran Cairan Fluida Biru Neon */}
                    <path 
                      d={`M 50 80 L 250 80 L 300 ${130 - (A2 * 5)} L 400 ${130 - (A2 * 5)} L 450 80 L 550 80 L 550 180 L 450 180 L 400 ${130 + (A2 * 5)} L 300 ${130 + (A2 * 5)} L 250 180 L 50 180 Z`} 
                      fill="rgba(56, 189, 248, 0.25)" 
                    />
                    
                    {/* Dinding Pipa Tabung Venturi */}
                    <path 
                      d={`M 50 80 L 250 80 L 300 ${130 - (A2 * 5)} L 400 ${130 - (A2 * 5)} L 450 80 L 550 80`} 
                      fill="none" 
                      stroke="#475569" 
                      strokeWidth="3.5" 
                    />
                    <path 
                      d={`M 50 180 L 250 180 L 300 ${130 + (A2 * 5)} L 400 ${130 + (A2 * 5)} L 450 180 L 550 180`} 
                      fill="none" 
                      stroke="#475569" 
                      strokeWidth="3.5" 
                    />

                    {/* Tabung Manometer Vertikal 1 (Pipa Lebar) */}
                    <rect x="150" y="10" width="22" height="70" fill="none" stroke="#475569" strokeWidth="3" />
                    <rect x="152" y="25" width="18" height="55" fill="#38bdf8" />

                    {/* Tabung Manometer Vertikal 2 (Pipa Sempit) */}
                    <rect x="340" y="10" width="22" height={120 - (A2 * 5)} fill="none" stroke="#475569" strokeWidth="3" />
                    <rect 
                      x="342" 
                      y={25 + deltaP_visual} 
                      width="18" 
                      height={Math.max(10, 105 - (A2 * 5) - deltaP_visual)} 
                      fill="#38bdf8" 
                      className="transition-all duration-300" 
                    />

                    {/* Garis Perbedaan Ketinggian Manometer (Delta h) */}
                    <line x1="175" y1="25" x2="335" y2="25" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" />
                    <line x1="175" y1={25 + deltaP_visual} x2="335" y2={25 + deltaP_visual} stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="240" y={22 + deltaP_visual / 2} fill="#f43f5e" fontSize="10" fontFamily="monospace" fontWeight="bold">
                      Δh (Tekanan Jatuh)
                    </text>

                    {/* Label Kecepatan */}
                    <text x="110" y="140" fill="#38bdf8" fontSize="12" fontFamily="monospace" fontWeight="bold">v₁ = {v1.toFixed(1)} m/s</text>
                    <text x="325" y="135" fill="#2dd4bf" fontSize="12" fontFamily="monospace" fontWeight="bold">v₂ = {v2.toFixed(1)} m/s</text>
                  </svg>
                </div>
              </div>

              {/* Dashboard Metrik Venturi (3 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                  <span className="block text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-1">
                    Laju Leher Pipa (v2)
                  </span>
                  <div className="text-3xl font-black text-teal-400 font-mono">
                    {v2.toFixed(1)} <span className="text-xs font-normal text-slate-400">m/s</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    v₂ = v₁ · (A₁ / A₂) = {(v2 / v1).toFixed(1)}x lebih cepat
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                  <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                    Penurunan Tekanan (ΔP)
                  </span>
                  <div className="text-2xl font-black text-sky-400 font-mono">
                    {(deltaP / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">kPa</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    P₁ - P₂ = ½ · ρ · (v₂² - v₁²)
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                  <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                    Hukum Bernoulli
                  </span>
                  <div className="text-sm font-bold text-amber-300 mt-1">
                    P₂ &lt; P₁ (Tekanan Menurun)
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Semakin cepat fluida mengalir, tekanannya semakin turun.
                  </p>
                </div>

              </div>

              {/* Edukatif Venturi */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
                <Info size={20} className="text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-1">Penerapan Tabung Venturi &amp; Efek Bernoulli:</strong>
                  <p>
                    Saat fluida memasuki bagian pipa yang lebih sempit (<MathFormula formula="A_2 < A_1" />), kecepatan fluida harus meningkat sesuai <strong>Asas Kontinuitas</strong> agar debit aliran tetap konstan. Berdasarkan <strong>Asas Bernoulli</strong>, kenaikan energi kinetik fluida ini harus diimbangi oleh penurunan energi tekanan, menyebabkan tekanan pada leher sempit lebih rendah (<MathFormula formula="P_2 < P_1" />). Prinsip ini digunakan pada karburator mesin, tabung pitot pengukur kecepatan pesawat, dan alat semprot parfum.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
