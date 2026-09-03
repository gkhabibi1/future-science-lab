"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Activity, Settings2, Timer, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function HarmonikSimulation() {
  // --- STATE KONTROL ---
  const [mode, setMode] = useState<'bandul' | 'pegas'>('bandul');
  const [isRunning, setIsRunning] = useState(true);
  const [, setTick] = useState(0); // State untuk men-trigger re-render SVG di RAF

  // Parameter Bandul
  const [length, setLength] = useState(1); // meter
  const [gravity, setGravity] = useState(9.8); // m/s^2
  const maxAngle = 15; // Derajat (Sudut kecil agar SHM berlaku)

  // Parameter Pegas
  const [mass, setMass] = useState(1); // kg
  const [kSpring, setKSpring] = useState(15); // N/m
  const maxAmplitude = 50; // pixel visual

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
        
        // Garis Tengah (Sumbu X)
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); 
        ctx.moveTo(0, canvas.height / 2); 
        ctx.lineTo(canvas.width, canvas.height / 2); 
        ctx.stroke();
        ctx.setLineDash([]);

        // Menggambar kurva sejarah simpangan (Scrolling Graph)
        ctx.beginPath();
        for (let x = 0; x < canvas.width; x++) {
          const timeAtX = t - (x * 0.015);
          
          let yVal = 0;
          if (timeAtX > 0) {
            if (mode === 'bandul') {
                yVal = (maxAngle * Math.cos(omega * timeAtX)) * (50 / maxAngle);
            } else {
                yVal = maxAmplitude * Math.cos(omega * timeAtX);
            }
          }
          
          const canvasY = canvas.height / 2 - yVal;
          if (x === 0) ctx.moveTo(canvas.width - x, canvasY);
          else ctx.lineTo(canvas.width - x, canvasY);
        }
        ctx.strokeStyle = mode === 'bandul' ? '#3b82f6' : '#10b981';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isRunning, mode, omega]);

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => { 
      if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    };
  }, [isRunning, animate]);

  const handleReset = () => {
    timeRef.current = 0;
    setTick(0);
  };

  // --- SVG HELPER (Menghitung Posisi Visual) ---
  const t = timeRef.current;
  
  // Posisi Bandul
  const currentAngle = mode === 'bandul' ? maxAngle * Math.cos(omega * t) : 0;
  
  // Posisi Pegas
  const springY = mode === 'pegas' ? maxAmplitude * Math.cos(omega * t) : 0;
  
  // Jalur Pegas (Membuat Zig-zag)
  let springPath = `M 150 20 `;
  const numCoils = 10;
  const coilHeight = (100 + springY) / numCoils;
  for (let i = 1; i <= numCoils; i++) {
     const xOffset = i % 2 === 0 ? 170 : 130;
     springPath += `L ${xOffset} ${20 + (i * coilHeight)} `;
  }
  springPath += `L 150 ${20 + (100 + springY)}`;

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold transition mb-3 border border-slate-300 shadow-sm"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Beranda Praktikum</span>
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Laboratorium Gerak Harmonik Sederhana</h1>
            <p className="text-slate-500 font-medium">Menemukan Nilai Gravitasi, Periode, &amp; Konstanta Pegas Real-time</p>
          </div>
          
          {/* Toggle Tab */}
          <div className="flex bg-white rounded-xl shadow-sm p-1 border border-slate-200">
            <button 
              onClick={() => { setMode('bandul'); timeRef.current = 0; setTick(0); }} 
              className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'bandul' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Bandul Matematis
            </button>
            <button 
              onClick={() => { setMode('pegas'); timeRef.current = 0; setTick(0); }} 
              className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'pegas' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Sistem Pegas
            </button>
          </div>
        </header>

        {/* Formula Card Banner */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-around items-center gap-4 text-xs text-slate-700">
          {mode === 'bandul' ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Periode Bandul:</span>
                <MathFormula formula="T = 2\pi \sqrt{\frac{L}{g}}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Frekuensi Sudut:</span>
                <MathFormula formula="\omega = \sqrt{\frac{g}{L}}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Simpangan (SHM):</span>
                <MathFormula formula="\theta(t) = \theta_{\text{max}} \cos(\omega t)" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Periode Pegas:</span>
                <MathFormula formula="T = 2\pi \sqrt{\frac{m}{k}}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Frekuensi Sudut:</span>
                <MathFormula formula="\omega = \sqrt{\frac{k}{m}}" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">Simpangan (SHM):</span>
                <MathFormula formula="y(t) = A \cos(\omega t)" />
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel Kontrol Kiri */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-bold mb-6 text-slate-800 border-b pb-3">
                <Settings2 size={18} className={mode === 'bandul' ? 'text-blue-500' : 'text-emerald-500'}/> 
                Parameter {mode === 'bandul' ? 'Bandul' : 'Pegas'}
              </h2>
              
              {mode === 'bandul' ? (
                <div className="space-y-6">
                  <label className="block text-sm font-semibold text-slate-700">Panjang Tali (L): <span className="text-blue-600 font-bold">{length.toFixed(1)} m</span>
                    <input type="range" min="0.5" max="3" step="0.1" value={length} onChange={(e) => setLength(Number(e.target.value))} className="w-full mt-2 accent-blue-600 cursor-pointer" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">Gravitasi (g): <span className="text-blue-600 font-bold">{gravity.toFixed(1)} m/s²</span>
                    <input type="range" min="1.6" max="25" step="0.1" value={gravity} onChange={(e) => setGravity(Number(e.target.value))} className="w-full mt-2 accent-blue-600 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold"><span>Bulan (1.6)</span> <span>Bumi (9.8)</span> <span>Jupiter (24)</span></div>
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <label className="block text-sm font-semibold text-slate-700">Massa Beban (m): <span className="text-emerald-600 font-bold">{mass.toFixed(1)} kg</span>
                    <input type="range" min="0.5" max="5" step="0.1" value={mass} onChange={(e) => setMass(Number(e.target.value))} className="w-full mt-2 accent-emerald-600 cursor-pointer" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">Konstanta Pegas (k): <span className="text-emerald-600 font-bold">{kSpring} N/m</span>
                    <input type="range" min="5" max="50" step="1" value={kSpring} onChange={(e) => setKSpring(Number(e.target.value))} className="w-full mt-2 accent-emerald-600 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold"><span>Lembek</span> <span>Keras</span></div>
                  </label>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-4">
              {/* Tombol Kontrol Animasi */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    isRunning
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                      : 'bg-slate-900 hover:bg-black text-white'
                  }`}
                >
                  {isRunning ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                  {isRunning ? 'Jeda Simulasi' : 'Lanjutkan'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition border border-slate-200"
                >
                  <RotateCcw size={16} /> Reset Waktu
                </button>
              </div>

              {/* Hasil Observasi */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Timer size={14}/> Hasil Observasi Real-time</div>
                <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-slate-600">Periode (T)</span>
                    <span className="text-xl font-black text-slate-800">{period.toFixed(2)} sekon</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-slate-600">Frek. Sudut (ω)</span>
                    <span className="text-lg font-bold text-slate-500">{omega.toFixed(2)} rad/s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Area Visualisasi Fisik & Grafik */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Split Screen Visual & Graph */}
            <div className="flex flex-col md:flex-row gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[350px]">
               
               {/* 1. Visualisasi Fisik (SVG) */}
               <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden flex justify-center items-start pt-4 min-h-[280px]">
                  <svg width="300" height="300" className="w-full h-full">
                     {/* Atap penahan */}
                     <rect x="50" y="0" width="200" height="15" fill="#cbd5e1" rx="4" />
                     
                     {mode === 'bandul' ? (
                        // --- GAMBAR BANDUL ---
                        <g style={{ transformOrigin: '150px 15px', transform: `rotate(${currentAngle}deg)` }}>
                           {/* Tali */}
                           <line x1="150" y1="15" x2="150" y2={15 + (length * 75)} stroke="#475569" strokeWidth="2.5" />
                           {/* Bola Bandul */}
                           <circle cx="150" cy={15 + (length * 75)} r="16" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
                        </g>
                     ) : (
                        // --- GAMBAR PEGAS ---
                        <g>
                           {/* Per / Pegas */}
                           <path d={springPath} fill="none" stroke="#64748b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                           {/* Balok Massa */}
                           <rect x="125" y={20 + (100 + springY)} width="50" height={20 + (mass * 8)} fill="#10b981" stroke="#047857" strokeWidth="2" rx="4" />
                        </g>
                     )}
                  </svg>
               </div>

               {/* 2. Grafik Simpangan (Canvas) */}
               <div className="flex-1 bg-[#0f172a] rounded-xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
                  <div className="absolute top-3 left-3 text-xs font-bold text-slate-300 uppercase flex items-center gap-2 z-10 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Activity size={14} className={mode === 'bandul' ? 'text-blue-400' : 'text-emerald-400'}/>
                      Grafik Simpangan (y) vs Waktu (t)
                  </div>
                  <canvas ref={graphCanvasRef} width={400} height={300} className="w-full h-full block" />
               </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
