"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Settings2, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import MathFormula from '@/components/MathFormula';

export default function RLCReactSimulation() {
  // --- REACT STATE: Menyimpan input dari pengguna ---
  const [R, setR] = useState(100);    // Resistor (Ohm)
  const [L, setL] = useState(0.5);    // Induktor (Henry)
  const [C, setC] = useState(50);     // Kapasitor (MicroFarad)
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const requestRef = useRef<number | null>(null);

  // --- LOGIKA FISIKA ---
  const f = 50; // Frekuensi 50Hz (Standar PLN)
  const w = 2 * Math.PI * f; // Kecepatan sudut
  
  // Konversi MicroFarad ke Farad
  const cFarad = C * 0.000001; 
  
  const XL = w * L;
  const XC = 1 / (w * cFarad);
  const Z = Math.sqrt(Math.pow(R, 2) + Math.pow(XL - XC, 2));
  
  // Beda Fase (Radian)
  const phaseAngleRad = Math.atan((XL - XC) / R);
  const phaseAngleDeg = (phaseAngleRad * 180) / Math.PI;

  // Status Rangkaian
  let circuitStatus = "Resistif (SeFase)";
  if (XL > XC) circuitStatus = "Induktif (Tegangan Mendahului Arus)";
  if (XC > XL) circuitStatus = "Kapasitif (Arus Mendahului Tegangan)";

  // --- REACT ANIMATION EFFECT (Osiloskop) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderOscilloscope = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Gambar grid latar belakang (layar osiloskop)
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.5;
      for(let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }
      for(let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }

      // Garis tengah (Sumbu X)
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();

      // Gambar Gelombang Tegangan (Biru) & Arus (Merah)
      ctx.lineWidth = 2.5;
      const centerY = canvas.height / 2;
      
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const t = timeRef.current + (x * 0.0001); // Skala waktu visual
        
        // Gelombang Tegangan: V = Vmax * sin(wt)
        const voltageY = Math.sin(w * t) * 100;
        
        if (x === 0) ctx.moveTo(x, centerY - voltageY);
        else ctx.lineTo(x, centerY - voltageY);
      }
      ctx.strokeStyle = '#38bdf8'; // Cyan/Biru
      ctx.stroke();

      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const t = timeRef.current + (x * 0.0001);
        
        // Gelombang Arus: I = Imax * sin(wt - sudutFase)
        // Arus diperbesar skalanya untuk visualisasi
        const currentY = Math.sin((w * t) - phaseAngleRad) * (100 * (100/Z)); 
        
        if (x === 0) ctx.moveTo(x, centerY - currentY);
        else ctx.lineTo(x, centerY - currentY);
      }
      ctx.strokeStyle = '#f43f5e'; // Rose/Merah
      ctx.stroke();

      timeRef.current += 0.0005; // Kecepatan gelombang berjalan
      requestRef.current = requestAnimationFrame(renderOscilloscope);
    };

    requestRef.current = requestAnimationFrame(renderOscilloscope);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [w, phaseAngleRad, Z]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline">
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-cyan-400">Tingkat SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Laboratorium Osiloskop RLC</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Simulasi Rangkaian Arus Bolak-Balik (AC) & Gelombang Fase (Formulasi Presisi LaTeX)</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <Sparkles size={14} /> AC Oscilloscope Engine
          </div>
        </header>

        {/* LaTeX Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Impedansi RLC:</span>
            <MathFormula formula="Z = \sqrt{R^2 + (X_L - X_C)^2}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Beda Fase:</span>
            <MathFormula formula="\tan\phi = \frac{X_L - X_C}{R}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Reaktansi Induktif & Kapasitif:</span>
            <MathFormula formula="X_L = 2\pi f L, \quad X_C = \frac{1}{2\pi f C}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel Kontrol React State */}
          <div className="bg-slate-900/80 backdrop-blur p-6 rounded-3xl border border-slate-800 space-y-6">
            <h2 className="flex items-center gap-2 font-bold text-cyan-400 text-sm">
              <Settings2 size={18} /> Parameter Komponen
            </h2>
            
            <div className="space-y-6 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-2">
                  <span className="text-slate-300">Resistor (R)</span>
                  <span className="font-mono text-amber-400 font-bold">{R} Ω</span>
                </div>
                <input type="range" min="10" max="500" value={R} onChange={(e) => setR(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-amber-400 cursor-pointer" />
              </div>
              
              <div>
                <div className="flex justify-between font-semibold mb-2">
                  <span className="text-slate-300">Induktor (L)</span>
                  <span className="font-mono text-emerald-400 font-bold">{L} H</span>
                </div>
                <input type="range" min="0.1" max="2" step="0.1" value={L} onChange={(e) => setL(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-emerald-400 cursor-pointer" />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-2">
                  <span className="text-slate-300">Kapasitor (C)</span>
                  <span className="font-mono text-orange-400 font-bold">{C} μF</span>
                </div>
                <input type="range" min="10" max="200" value={C} onChange={(e) => setC(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-orange-400 cursor-pointer" />
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Status Rangkaian</div>
              <div className="font-bold text-cyan-300 text-sm">{circuitStatus}</div>
              <div className="flex justify-between border-t border-slate-800 pt-2 mt-2">
                <span className="text-slate-400">Beda Fase (<MathFormula formula="\phi" />):</span>
                <span className="font-mono text-purple-300 font-bold">{phaseAngleDeg.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Impedansi (<MathFormula formula="Z" />):</span>
                <span className="font-mono text-amber-300 font-bold">{Z.toFixed(1)} Ω</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reaktansi Induktif (<MathFormula formula="X_L" />):</span>
                <span className="font-mono text-emerald-300">{XL.toFixed(1)} Ω</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reaktansi Kapasitif (<MathFormula formula="X_C" />):</span>
                <span className="font-mono text-orange-300">{XC.toFixed(1)} Ω</span>
              </div>
            </div>
          </div>

          {/* Area Visualisasi Canvas Osiloskop */}
          <div className="lg:col-span-2">
            <div className="bg-slate-950 p-4 rounded-3xl shadow-2xl border border-slate-800 relative">
              <div className="absolute top-3 right-3 sm:top-6 sm:right-6 flex gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold bg-slate-900/90 border border-slate-800 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl backdrop-blur z-10">
                <span className="flex items-center gap-1.5 text-cyan-400"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-cyan-400 rounded-full inline-block"></span> Tegangan (V)</span>
                <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-400 rounded-full inline-block"></span> Arus (I)</span>
              </div>
              
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={420} 
                className="w-full h-auto bg-[#020617] rounded-2xl border border-slate-800 shadow-inner block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
