"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Flame, Snowflake, Activity, Zap, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function CarnotSimulation() {
  // --- STATE PARAMETER ---
  const [Th, setTh] = useState(800); // Suhu Tinggi (Kelvin)
  const [Tc, setTc] = useState(300); // Suhu Rendah (Kelvin)
  const [isSimulating, setIsSimulating] = useState(true);

  // Pastikan Tc tidak pernah melebihi Th
  useEffect(() => { if (Tc >= Th) setTc(Th - 50); }, [Th, Tc]);

  // --- STATE ANIMASI ---
  // progress berjalan dari 0 sampai 4 (merepresentasikan 4 langkah Carnot)
  const [progress, setProgress] = useState(0); 
  const requestRef = useRef<number | null>(null);

  // --- KALKULASI FISIKA ---
  const efisiensi = (1 - (Tc / Th)) * 100;

  // Animasi Loop
  useEffect(() => {
    const animate = () => {
      if (isSimulating) {
        setProgress((prev) => {
          let next = prev + 0.015; // Kecepatan siklus mesin
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

  // --- LOGIKA VISUAL: Diagram P-V & Piston ---
  let phase = 0; // 0=Iso Exp, 1=Adia Exp, 2=Iso Comp, 3=Adia Comp
  let phaseName = "";
  let pistonY = 0; // Posisi piston (Volume)
  let heatColor = "#94a3b8"; // Warna default (Adiabatik)

  if (progress < 1) {
    phase = 0;
    phaseName = "Ekspansi Isotermal (Gas menyerap kalor Q_H dari Reservoir Panas)";
    pistonY = progress; // Piston naik (volume bertambah)
    heatColor = "#ef4444"; // Merah (Reservoir Panas)
  } else if (progress < 2) {
    phase = 1;
    phaseName = "Ekspansi Adiabatik (Gas memuai tanpa pertukaran kalor)";
    pistonY = 1 + (progress - 1); 
    heatColor = "#94a3b8"; // Abu-abu (Terisolasi)
  } else if (progress < 3) {
    phase = 2;
    phaseName = "Kompresi Isotermal (Gas melepas kalor Q_C ke Reservoir Dingin)";
    pistonY = 2 - (progress - 2); // Piston turun (volume berkurang)
    heatColor = "#3b82f6"; // Biru (Reservoir Dingin)
  } else {
    phase = 3;
    phaseName = "Kompresi Adiabatik (Suhu gas kembali ke T_H)";
    pistonY = 1 - (progress - 3);
    heatColor = "#94a3b8"; 
  }

  // Koordinat SVG P-V (Disederhanakan untuk visualisasi bentuk Carnot)
  const getPVPoints = () => {
    const p1 = 30 + (1500 - Th) * 0.05; // Titik A (P max, V min)
    const p2 = p1 + 40;                 // Titik B 
    const p3 = p2 + 70 + (Th - Tc) * 0.1; // Titik C (P min, V max)
    const p4 = p1 + 70 + (Th - Tc) * 0.1; // Titik D
    return {
      A: { x: 50, y: p1 },
      B: { x: 140, y: p2 },
      C: { x: 240, y: p3 },
      D: { x: 120, y: p4 },
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
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header & Navigasi */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold transition mb-3 border border-slate-300 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Simulasi Mesin Termal Carnot</h1>
          <p className="text-slate-500 font-medium">Hukum II Termodinamika, Siklus Ideal &amp; Diagram P-V Real-time</p>
        </header>

        {/* Formula Banner */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-around items-center gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Efisiensi Maksimum Carnot (\(\eta\)):</span>
            <MathFormula formula="\eta = \left( 1 - \frac{T_C}{T_H} \right) \times 100\%" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Usaha Bersih (W):</span>
            <MathFormula formula="W = Q_H - Q_C" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KONTROL PANEL */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between space-y-6">
            <div>
              <h2 className="font-bold mb-6 text-slate-800 border-b pb-3 uppercase tracking-wider text-xs flex items-center gap-2">
                 <Activity size={18}/> Parameter Sistem
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="flex justify-between text-sm font-semibold mb-2">
                    <span className="flex items-center gap-1 text-red-600"><Flame size={16}/> Reservoir Panas (<MathFormula formula="T_H" />)</span>
                    <span className="text-red-700 font-black font-mono">{Th} K</span>
                  </label>
                  <input type="range" min="400" max="1500" step="50" value={Th} onChange={(e) => setTh(Number(e.target.value))} className="w-full accent-red-500 cursor-pointer" />
                </div>

                <div>
                  <label className="flex justify-between text-sm font-semibold mb-2">
                    <span className="flex items-center gap-1 text-blue-600"><Snowflake size={16}/> Reservoir Dingin (<MathFormula formula="T_C" />)</span>
                    <span className="text-blue-700 font-black font-mono">{Tc} K</span>
                  </label>
                  <input type="range" min="100" max={Th - 50} step="50" value={Tc} onChange={(e) => setTc(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Animation Control Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isSimulating
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-slate-900 hover:bg-black text-white'
                  }`}
                >
                  {isSimulating ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                  {isSimulating ? 'Jeda Siklus' : 'Lanjutkan Siklus'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition border border-slate-200"
                >
                  <RotateCcw size={16} /> Reset
                </button>
              </div>

              {/* Efisiensi Result Card */}
              <div className="bg-amber-50 p-5 rounded-xl border border-amber-200">
                 <span className="block text-xs font-bold text-amber-500 uppercase mb-2">Efisiensi Termal (\(\eta\))</span>
                 <div className="flex items-center justify-between">
                    <span className="text-4xl font-black text-amber-700 font-mono">{efisiensi.toFixed(1)}%</span>
                    <Zap size={32} className="text-amber-400"/>
                 </div>
                 <p className="text-xs text-amber-700 mt-2 font-medium">
                    Sisa { (100 - efisiensi).toFixed(1) }% energi terbuang ke reservoir dingin sebagai <MathFormula formula="Q_C" />.
                 </p>
              </div>
            </div>
          </div>

          {/* VISUALISASI DIAGRAM P-V & PISTON */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 items-center min-h-[350px]">
               
               {/* 1. Animasi Silinder Mesin */}
               <div className="w-full md:w-1/3 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-widest">Silinder Gas Piston</span>
                  <div className="w-24 h-48 border-4 border-slate-700 border-t-0 rounded-b-xl relative overflow-hidden flex flex-col justify-end transition-colors duration-500" style={{ backgroundColor: heatColor + '20' }}>
                     
                     {/* Gas Color Fade */}
                     <div className="absolute inset-0 transition-opacity duration-300" style={{ backgroundColor: heatColor, opacity: 0.35 }}></div>
                     
                     {/* Kepala Piston */}
                     <div 
                        className="w-full h-4 bg-slate-800 border-t-2 border-slate-600 absolute transition-all duration-75"
                        style={{ bottom: `${(pistonY / 2) * 100}%` }}
                     ></div>
                     
                     {/* Tangkai Piston */}
                     <div 
                        className="w-2 h-40 bg-slate-400 absolute left-1/2 -translate-x-1/2 transition-all duration-75"
                        style={{ bottom: `${(pistonY / 2) * 100}%` }}
                     ></div>
                  </div>
               </div>

               {/* 2. Diagram SVG P-V */}
               <div className="w-full md:w-2/3 bg-slate-50 border border-slate-200 rounded-xl relative h-full min-h-[250px] flex items-center justify-center p-4">
                  <div className="absolute top-3 left-4 text-xs font-bold text-slate-400">Tekanan (P)</div>
                  <div className="absolute bottom-2 right-4 text-xs font-bold text-slate-400">Volume (V)</div>
                  
                  <svg width="300" height="230" className="overflow-visible">
                     {/* Sumbu Koordinat */}
                     <line x1="20" y1="20" x2="20" y2="210" stroke="#94a3b8" strokeWidth="2" />
                     <line x1="20" y1="210" x2="280" y2="210" stroke="#94a3b8" strokeWidth="2" />

                     {/* Area Dalam Siklus Carnot (Luas = Usaha Bersih) */}
                     <path 
                       d={`M ${pts.A.x} ${pts.A.y} Q ${pts.A.x + 40} ${pts.A.y} ${pts.B.x} ${pts.B.y} Q ${pts.B.x + 30} ${pts.B.y + 40} ${pts.C.x} ${pts.C.y} Q ${pts.C.x - 50} ${pts.C.y} ${pts.D.x} ${pts.D.y} Q ${pts.D.x - 40} ${pts.D.y - 40} ${pts.A.x} ${pts.A.y} Z`} 
                       fill="#fef3c7" stroke="#fbbf24" strokeWidth="2.5" strokeLinejoin="round" 
                     />
                     
                     {/* Label Titik */}
                     <text x={pts.A.x - 15} y={pts.A.y + 5} fontSize="12" fontWeight="bold" fill="#1e293b">A</text>
                     <text x={pts.B.x + 10} y={pts.B.y} fontSize="12" fontWeight="bold" fill="#1e293b">B</text>
                     <text x={pts.C.x + 5} y={pts.C.y + 15} fontSize="12" fontWeight="bold" fill="#1e293b">C</text>
                     <text x={pts.D.x - 15} y={pts.D.y + 15} fontSize="12" fontWeight="bold" fill="#1e293b">D</text>

                     {/* Titik Berjalan (Tracer) */}
                     <circle cx={dot.x} cy={dot.y} r="6" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" className="transition-all duration-75 ease-linear"/>
                  </svg>
               </div>
            </div>

            {/* STATUS PHASE AKTIF */}
            <div className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700 text-center shadow-md">
               <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Langkah Siklus Aktif</span>
               <div className="text-base sm:text-lg font-bold text-amber-400">{phaseName}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
