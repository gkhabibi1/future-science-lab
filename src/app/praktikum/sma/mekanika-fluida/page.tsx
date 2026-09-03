"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Waves, FastForward, Anchor, Droplet, ArrowLeft } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function FluidaSimulation() {
  const [tab, setTab] = useState<'archimedes' | 'venturi'>('archimedes');

  // --- STATE ARCHIMEDES (Fluida Statis) ---
  const [rhoBenda, setRhoBenda] = useState(400); // Massa Jenis Benda (kg/m3) -> Default: Kayu
  const [rhoFluida, setRhoFluida] = useState(1000); // Massa Jenis Fluida (kg/m3) -> Default: Air
  const [volumeBenda] = useState(1); // m3 (Konstan untuk kesederhanaan)
  const g = 9.8;

  // --- STATE VENTURIMETER (Fluida Dinamis) ---
  const [A1] = useState(10); // Luas Penampang 1 (cm2)
  const [v1, setV1] = useState(2); // Kecepatan di Penampang 1 (m/s)
  const [A2, setA2] = useState(5); // Luas Penampang 2 (Penyempitan) (cm2)

  // --- KALKULASI ARCHIMEDES ---
  // Fraksi tenggelam = rho_benda / rho_fluida
  let fractionSubmerged = rhoBenda / rhoFluida;
  let statusArchimedes = "Mengapung";
  if (fractionSubmerged >= 1) {
    fractionSubmerged = 1;
    statusArchimedes = rhoBenda === rhoFluida ? "Melayang" : "Tenggelam";
  }
  
  // W = m*g = rho_b * V * g
  const weight = rhoBenda * volumeBenda * g;
  // Fa = rho_f * V_tenggelam * g
  const buoyantForce = rhoFluida * (fractionSubmerged * volumeBenda) * g;

  // Animasi posisi Y benda (0% = permukaan atas, 100% = dasar)
  let yPos = 0;
  if (statusArchimedes === "Mengapung") yPos = (fractionSubmerged * 150) - 75; // Tengah balok di permukaan air
  if (statusArchimedes === "Melayang") yPos = 80; // Di tengah air
  if (statusArchimedes === "Tenggelam") yPos = 200; // Kandas di dasar

  // --- KALKULASI VENTURIMETER (KONTINUITAS) ---
  // A1 * v1 = A2 * v2  => v2 = (A1 * v1) / A2
  const v2 = (A1 * v1) / A2;
  
  // Perbedaan Tekanan (Asas Bernoulli: P1 - P2 = 1/2 * rho * (v2^2 - v1^2))
  const deltaP_visual = Math.min(60, 0.5 * 1000 * (Math.pow(v2, 2) - Math.pow(v1, 2)) * 0.005); 

  return (
    <div className="min-h-screen bg-sky-50 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold transition mb-3 border border-sky-200 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-sky-900 mb-2">Laboratorium Mekanika Fluida</h1>
          <p className="text-sky-700 font-medium">Studi Statika (Hukum Archimedes) &amp; Dinamika Fluida (Tabung Venturi &amp; Azas Kontinuitas).</p>
        </header>

        {/* Formula Banner */}
        <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm flex flex-wrap justify-around items-center gap-4 text-xs text-slate-700">
          {tab === 'archimedes' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Gaya Apung Archimedes:</span>
                <MathFormula formula="F_a = \rho_f \cdot V_{\text{tercelup}} \cdot g" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Kondisi Terapung:</span>
                <MathFormula formula="\rho_b < \rho_f \implies F_a = W" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Persamaan Kontinuitas:</span>
                <MathFormula formula="A_1 v_1 = A_2 v_2" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Asas Bernoulli:</span>
                <MathFormula formula="P_1 + \frac{1}{2}\rho v_1^2 = P_2 + \frac{1}{2}\rho v_2^2" />
              </div>
            </>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm w-fit border border-sky-100">
          <button 
             onClick={() => setTab('archimedes')}
             className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 text-sm transition-all ${tab === 'archimedes' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:bg-sky-50'}`}
          >
            <Anchor size={18}/> Hukum Archimedes (Statik)
          </button>
          <button 
             onClick={() => setTab('venturi')}
             className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 text-sm transition-all ${tab === 'venturi' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-teal-50'}`}
          >
            <FastForward size={18}/> Tabung Venturi (Dinamik)
          </button>
        </div>

        {tab === 'archimedes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Kontrol Archimedes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-100">
               <h2 className="font-bold text-sky-800 mb-6 border-b pb-2 flex items-center gap-2"><Droplet size={18}/> Parameter Densitas</h2>
               
               <div className="space-y-6">
                 <div>
                   <label className="flex justify-between text-sm font-semibold mb-2">
                     <span className="text-amber-700">Massa Jenis Benda (<MathFormula formula="\rho_b" />)</span>
                     <span className="font-bold text-amber-900 font-mono">{rhoBenda} kg/m³</span>
                   </label>
                   <input type="range" min="100" max="3000" step="50" value={rhoBenda} onChange={(e) => setRhoBenda(Number(e.target.value))} className="w-full accent-amber-600 cursor-pointer" />
                   <div className="flex gap-2 mt-2">
                      <button onClick={()=>setRhoBenda(400)} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold hover:bg-amber-200">Kayu (400)</button>
                      <button onClick={()=>setRhoBenda(900)} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold hover:bg-blue-200">Es (900)</button>
                      <button onClick={()=>setRhoBenda(2700)} className="text-xs bg-zinc-200 text-zinc-800 px-2 py-1 rounded font-bold hover:bg-zinc-300">Aluminium (2700)</button>
                   </div>
                 </div>

                 <div>
                   <label className="flex justify-between text-sm font-semibold mb-2 mt-8">
                     <span className="text-blue-600">Massa Jenis Fluida (<MathFormula formula="\rho_f" />)</span>
                     <span className="font-bold text-blue-900 font-mono">{rhoFluida} kg/m³</span>
                   </label>
                   <input type="range" min="500" max="1500" step="50" value={rhoFluida} onChange={(e) => setRhoFluida(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
                   <div className="flex gap-2 mt-2">
                      <button onClick={()=>setRhoFluida(800)} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold hover:bg-yellow-200">Minyak (800)</button>
                      <button onClick={()=>setRhoFluida(1000)} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold hover:bg-blue-200">Air (1000)</button>
                      <button onClick={()=>setRhoFluida(1030)} className="text-xs bg-cyan-100 text-cyan-800 px-2 py-1 rounded font-bold hover:bg-cyan-200">Air Laut (1030)</button>
                   </div>
                 </div>
               </div>
            </div>

            {/* Visualisasi Archimedes */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-sky-100 min-h-[350px] flex justify-center items-end relative overflow-hidden">
                  
                  {/* Aquarium Container */}
                  <div className="w-64 h-64 border-4 border-slate-300 border-t-0 rounded-b-xl relative flex justify-center bg-white z-10">
                     
                     {/* Benda / Balok */}
                     <div 
                        className="w-24 h-24 rounded-lg shadow-lg absolute flex items-center justify-center font-bold text-white z-20 transition-all duration-700 ease-in-out border-2 border-white/20"
                        style={{ 
                          top: `${yPos}px`, 
                          backgroundColor: rhoBenda < 800 ? '#b45309' : rhoBenda < 1500 ? '#38bdf8' : '#52525b' 
                        }}
                     >
                        {statusArchimedes}
                     </div>

                     {/* Air / Fluida */}
                     <div 
                        className="w-full absolute bottom-0 rounded-b-lg transition-colors duration-500 z-10"
                        style={{ 
                          height: `${150 + (fractionSubmerged * 20)}px`, // Permukaan air naik (Displacement)
                          backgroundColor: rhoFluida < 900 ? '#fde047' : rhoFluida > 1010 ? '#0891b2' : '#3b82f6',
                          opacity: 0.6
                        }}
                     >
                        <div className="w-full h-2 bg-white/40 animate-pulse"></div>
                     </div>

                  </div>
               </div>

               {/* Papan Analisis Gaya */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md border border-slate-700">
                     <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Gaya Berat Benda (W)</span>
                     <span className="text-2xl font-black font-mono">{weight.toFixed(0)} N</span>
                     <div className="text-xs text-slate-400 mt-1">Gaya gravitasi yang menarik benda ke bawah.</div>
                  </div>
                  <div className={`p-4 rounded-xl shadow-md border ${statusArchimedes === 'Mengapung' || statusArchimedes === 'Melayang' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-red-500 text-white border-red-600'}`}>
                     <span className="block text-xs font-bold text-white/80 uppercase mb-1">Gaya Apung (<MathFormula formula="F_a" />)</span>
                     <span className="text-2xl font-black font-mono">{buoyantForce.toFixed(0)} N</span>
                     <div className="text-xs text-white/90 mt-1">Gaya ke atas yang didorong oleh fluida tercelup.</div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {tab === 'venturi' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Kontrol Venturimeter */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 space-y-6">
               <h2 className="font-bold text-teal-800 border-b pb-2 flex items-center gap-2"><Waves size={18}/> Dinamika Fluida</h2>
               
               <div className="space-y-6">
                 <div>
                   <label className="flex justify-between text-sm font-semibold mb-2">
                     <span className="text-slate-700">Kecepatan Awal (<MathFormula formula="v_1" />)</span>
                     <span className="font-bold text-slate-900 font-mono">{v1} m/s</span>
                   </label>
                   <input type="range" min="1" max="10" step="0.5" value={v1} onChange={(e) => setV1(Number(e.target.value))} className="w-full accent-slate-600 cursor-pointer" />
                 </div>

                 <div>
                   <label className="flex justify-between text-sm font-semibold mb-2">
                     <span className="text-teal-600">Luas Penyempitan (<MathFormula formula="A_2" />)</span>
                     <span className="font-bold text-teal-900 font-mono">{A2} cm²</span>
                   </label>
                   <input type="range" min="1" max="10" step="0.5" value={A2} onChange={(e) => setA2(Number(e.target.value))} className="w-full accent-teal-600 cursor-pointer" />
                   <p className="text-xs text-slate-500 mt-2">Luas pipa utama (<MathFormula formula="A_1" />) dikunci pada {A1} cm².</p>
                 </div>
               </div>

               <div className="mt-8 bg-teal-50 p-4 rounded-xl border border-teal-200">
                  <span className="block text-xs font-bold text-teal-600 uppercase mb-1">Kecepatan di Penyempitan (<MathFormula formula="v_2" />)</span>
                  <span className="text-3xl font-black text-teal-800 font-mono">{v2.toFixed(1)} m/s</span>
               </div>
            </div>

            {/* Visualisasi Venturi (SVG Pipa) */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100 min-h-[350px] flex items-center justify-center relative">
                  
                  <svg width="600" height="300" viewBox="0 0 600 300" className="w-full h-auto max-w-full">
                     {/* Cairan dalam pipa (Biru) */}
                     <path d={`M 50 100 L 250 100 L 300 ${150 - (A2*5)} L 400 ${150 - (A2*5)} L 450 100 L 550 100 L 550 200 L 450 200 L 400 ${150 + (A2*5)} L 300 ${150 + (A2*5)} L 250 200 L 50 200 Z`} fill="#bae6fd" opacity="0.5" />
                     
                     {/* Outline Pipa Venturi */}
                     <path d={`M 50 100 L 250 100 L 300 ${150 - (A2*5)} L 400 ${150 - (A2*5)} L 450 100 L 550 100`} fill="none" stroke="#64748b" strokeWidth="4" />
                     <path d={`M 50 200 L 250 200 L 300 ${150 + (A2*5)} L 400 ${150 + (A2*5)} L 450 200 L 550 200`} fill="none" stroke="#64748b" strokeWidth="4" />

                     {/* Pipa Manometer Vertikal 1 (Lebar) */}
                     <rect x="150" y="20" width="20" height="80" fill="none" stroke="#64748b" strokeWidth="4" />
                     <rect x="152" y="40" width="16" height="60" fill="#38bdf8" />

                     {/* Pipa Manometer Vertikal 2 (Sempit) */}
                     <rect x="340" y="20" width="20" height={130 - (A2*5)} fill="none" stroke="#64748b" strokeWidth="4" />
                     {/* Air manometer 2 (ketinggian drop tergantung v2) */}
                     <rect x="342" y={40 + deltaP_visual} width="16" height={Math.max(10, 110 - (A2*5) - deltaP_visual)} fill="#38bdf8" className="transition-all duration-300"/> 

                     {/* Panah Kecepatan (Animasi V1) */}
                     <g className="animate-[slideRight_1s_linear_infinite]" style={{ animationDuration: `${Math.max(0.3, 2/v1)}s` }}>
                        <line x1="80" y1="150" x2="130" y2="150" stroke="#0369a1" strokeWidth="3" strokeDasharray="5,5" />
                        <polygon points="130,145 130,155 140,150" fill="#0369a1" />
                     </g>

                     {/* Panah Kecepatan (Animasi V2 - Lebih Cepat) */}
                     <g className="animate-[slideRight_1s_linear_infinite]" style={{ animationDuration: `${Math.max(0.15, 2/v2)}s` }}>
                        <line x1="320" y1="150" x2="370" y2="150" stroke="#0369a1" strokeWidth="3" strokeDasharray="5,5" />
                        <polygon points="370,145 370,155 380,150" fill="#0369a1" />
                     </g>
                  </svg>
                  
                  <style>{`
                    @keyframes slideRight {
                      0% { transform: translateX(0px); opacity: 0; }
                      20% { opacity: 1; }
                      80% { opacity: 1; }
                      100% { transform: translateX(50px); opacity: 0; }
                    }
                  `}</style>
               </div>

               <div className="bg-slate-800 text-white p-5 rounded-xl flex items-center justify-between shadow-md">
                  <div>
                    <h4 className="font-bold text-teal-400 mb-1">Hukum Bernoulli</h4>
                    <p className="text-sm text-slate-300">"Saat kecepatan fluida (<MathFormula formula="v" />) <strong>meningkat</strong>, tekanannya (<MathFormula formula="P" />) akan <strong>menurun</strong>."</p>
                  </div>
                  <div className="hidden md:block border-l border-slate-600 pl-4">
                     <span className="block text-xs text-slate-300 font-mono">Tekanan P₁ &gt; P₂</span>
                     <span className="block text-xs text-slate-300 font-mono">Perbedaan Tinggi Air (Δh)</span>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
