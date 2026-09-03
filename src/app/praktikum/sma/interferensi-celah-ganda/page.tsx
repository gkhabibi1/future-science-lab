"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Waves, Maximize2, ArrowLeft } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function InterferensiSimulation() {
  // --- STATE KONTROL ---
  const [lambda, setLambda] = useState(532); // Panjang gelombang (nm) -> Default Hijau
  const [d, setD] = useState(0.2); // Jarak antar celah (mm)
  const [L, setL] = useState(2.0); // Jarak layar (m)

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- HELPER: Konversi Wavelength (nm) ke RGB ---
  const nmToRGB = (wavelength: number) => {
    let R, G, B;
    if (wavelength >= 380 && wavelength < 440) {
      R = -(wavelength - 440) / (440 - 380); G = 0.0; B = 1.0;
    } else if (wavelength >= 440 && wavelength < 490) {
      R = 0.0; G = (wavelength - 440) / (490 - 440); B = 1.0;
    } else if (wavelength >= 490 && wavelength < 510) {
      R = 0.0; G = 1.0; B = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
      R = (wavelength - 510) / (580 - 510); G = 1.0; B = 0.0;
    } else if (wavelength >= 580 && wavelength < 645) {
      R = 1.0; G = -(wavelength - 645) / (645 - 580); B = 0.0;
    } else if (wavelength >= 645 && wavelength <= 780) {
      R = 1.0; G = 0.0; B = 0.0;
    } else {
      R = 0.0; G = 0.0; B = 0.0;
    }
    
    // Penyesuaian intensitas di ujung spektrum
    let intensity = 1.0;
    if (wavelength > 700) intensity = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
    else if (wavelength < 420) intensity = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);

    return `rgb(${Math.round(R * intensity * 255)}, ${Math.round(G * intensity * 255)}, ${Math.round(B * intensity * 255)})`;
  };

  // Hitung jarak antar pita terang secara teoritis
  const lambda_m = lambda * 1e-9;
  const d_m = d * 1e-3;
  const deltaY_mm = ((lambda_m * L) / d_m) * 1000; // mm

  // --- RENDER CANVAS (Pola Interferensi) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Warna dasar laser dari panjang gelombang
    const baseColor = nmToRGB(lambda);
    
    // Bersihkan layar jadi hitam
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Dapatkan array RGB dari string rgb(r,g,b)
    const rgbValues = baseColor.match(/\d+/g);
    if (!rgbValues) return;
    const [r, g, b] = rgbValues;

    // Kalkulasi Jarak Pita Terang (y) dalam skala pixel visual
    const visualScale = 150000; 
    const lambda_mm = lambda * 1e-6; 
    const L_mm = L * 1000;
    
    const y_scale = (lambda_mm * L_mm) / d; // Jarak aktual antar pita dalam mm
    const fringeSpacing = (y_scale * visualScale) / 1000; // Jarak dalam pixel

    // Gambar pola pita terang dan gelap
    // Intensitas I = I_max * cos^2(pi * y / fringeSpacing)
    for (let x = 0; x < width; x++) {
      const distanceFromCenter = Math.abs(x - width / 2);
      
      // Rumus interferensi cos kuadrat
      const phase = (Math.PI * distanceFromCenter) / fringeSpacing;
      let intensity = Math.pow(Math.cos(phase), 2);
      
      // Tambahkan efek envelope difraksi (makin ke pinggir makin redup)
      const diffractionEnvelope = Math.max(0, 1 - (distanceFromCenter / (width / 2)));
      intensity = intensity * diffractionEnvelope;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity})`;
      ctx.fillRect(x, 0, 1, height);
    }
  }, [lambda, d, L]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition mb-4 border border-slate-700 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            Interferensi Celah Ganda Young
          </h1>
          <p className="text-slate-400 font-medium">Membuktikan Sifat Gelombang Cahaya &amp; Gelombang Elektromagnetik Real-time</p>
        </header>

        {/* Formula Card */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 shadow-sm flex flex-wrap justify-around items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Jarak Antar Pita Terang (\(\Delta y\)):</span>
            <MathFormula formula="\Delta y = \frac{\lambda \cdot L}{d}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Kondisi Terang Ke-n:</span>
            <MathFormula formula="d \cdot \sin\theta = n \cdot \lambda" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Panel Kontrol */}
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 h-fit space-y-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-300 border-b border-slate-700 pb-3">
              <Waves size={18}/> Parameter Laser
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-400">Panjang Gelombang (λ)</span>
                </label>
                <div className="text-xl font-bold mb-2 font-mono" style={{ color: nmToRGB(lambda) }}>
                  {lambda} nm
                </div>
                {/* Gradient background for slider to show spectrum */}
                <input 
                  type="range" min="400" max="700" value={lambda} 
                  onChange={(e) => setLambda(Number(e.target.value))} 
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer" 
                  style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6, #10b981, #eab308, #ef4444)' }}
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-semibold text-slate-400 mb-2">
                  <span>Jarak Celah (d)</span>
                  <span className="text-white font-mono">{d.toFixed(2)} mm</span>
                </label>
                <input type="range" min="0.1" max="1.0" step="0.05" value={d} onChange={(e) => setD(Number(e.target.value))} className="w-full accent-slate-400 cursor-pointer" />
              </div>

              <div>
                <label className="flex justify-between text-sm font-semibold text-slate-400 mb-2">
                  <span>Jarak Layar (L)</span>
                  <span className="text-white font-mono">{L.toFixed(1)} m</span>
                </label>
                <input type="range" min="1.0" max="5.0" step="0.5" value={L} onChange={(e) => setL(Number(e.target.value))} className="w-full accent-slate-400 cursor-pointer" />
              </div>

              <div className="pt-4 border-t border-slate-700 text-xs space-y-1">
                <span className="text-slate-400 font-bold block">Jarak Pita Teoritis (Δy):</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">{deltaY_mm.toFixed(3)} mm</span>
              </div>
            </div>
          </div>

          {/* Area Visualisasi */}
          <div className="lg:col-span-3 space-y-4">
            
            <div className="bg-black p-3 rounded-2xl shadow-2xl border border-slate-700 relative overflow-hidden">
               {/* Indikator Titik Tengah */}
               <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-white/60 font-mono tracking-widest bg-black/60 px-2 py-0.5 rounded border border-white/10 z-10">TERANG PUSAT (n=0)</div>
               
               {/* Canvas Layar Interferensi */}
               <canvas ref={canvasRef} width={800} height={200} className="w-full h-[200px] rounded-xl mix-blend-screen block" />
            </div>

            {/* Insight Box */}
            <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700 flex gap-4 items-start">
               <div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-400 flex-shrink-0"><Maximize2 size={24}/></div>
               <div>
                  <h4 className="font-bold text-slate-200 mb-1">Analisis Pola Interferensi</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                     Pita terang akan semakin <strong>melebar</strong> jika Anda memperbesar panjang gelombang (<MathFormula formula="\lambda" />) atau menambah jarak layar (<MathFormula formula="L" />). Sebaliknya, pola akan <strong>merapat</strong> jika jarak antar celah (<MathFormula formula="d" />) diperbesar.
                  </p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
