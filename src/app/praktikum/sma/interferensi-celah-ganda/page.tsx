"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Waves, ArrowLeft, RotateCcw, Info, Sparkles, Sliders } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function InterferensiSimulation() {
  // --- STATE KONTROL ---
  const [lambda, setLambda] = useState(532); // Panjang gelombang (nm) -> Hijau
  const [d, setD] = useState(0.25); // Jarak antar celah (mm)
  const [L, setL] = useState(2.0); // Jarak layar (m)

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- HELPER: Konversi Wavelength (nm) ke RGB ---
  const nmToRGB = (wavelength: number) => {
    let R = 0, G = 0, B = 0;
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
    }
    
    // Intensitas tepi spektrum
    let factor = 1.0;
    if (wavelength > 700) factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
    else if (wavelength < 420) factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);

    return `rgb(${Math.round(R * factor * 255)}, ${Math.round(G * factor * 255)}, ${Math.round(B * factor * 255)})`;
  };

  // Hitung jarak antar pita terang secara teoritis: deltaY = (lambda * L) / d
  const lambda_m = lambda * 1e-9;
  const d_m = d * 1e-3;
  const deltaY_mm = ((lambda_m * L) / d_m) * 1000; // mm

  // Sudut pita terang ke-1 (theta): sin(theta) = lambda / d
  const sinTheta1 = lambda_m / d_m;
  const theta1Deg = (Math.asin(Math.min(1, sinTheta1)) * 180) / Math.PI;

  const resetParams = () => {
    setLambda(532);
    setD(0.25);
    setL(2.0);
  };

  // --- RENDER CANVAS POLA INTERFERENSI & DISTRIBUSI INTENSITAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    const baseColor = nmToRGB(lambda);
    const rgbValues = baseColor.match(/\d+/g);
    if (!rgbValues) return;
    const [r, g, b] = rgbValues;

    // Bersihkan kanvas ruang gelap optik
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Skala visual agar fringe terlihat realistis di kanvas
    const visualScale = 140000; 
    const lambda_mm = lambda * 1e-6; 
    const L_mm = L * 1000;
    const y_scale = (lambda_mm * L_mm) / d; // mm
    const fringeSpacing = Math.max(8, (y_scale * visualScale) / 1000); // px

    const fringeHeight = 140;

    // 1. Gambar Pita Interferensi
    for (let x = 0; x < width; x++) {
      const distanceFromCenter = Math.abs(x - width / 2);
      const phase = (Math.PI * distanceFromCenter) / fringeSpacing;
      let intensity = Math.pow(Math.cos(phase), 2);
      
      // Amplop difraksi celah tunggal (sinc/gauss envelope)
      const envelope = Math.max(0, 1 - Math.pow(distanceFromCenter / (width * 0.48), 2));
      intensity *= envelope;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity})`;
      ctx.fillRect(x, 20, 1, fringeHeight);
    }

    // Border bingkai layar interferensi
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 20, width, fringeHeight);

    // 2. Garis Penanda Orde Terang (m = 0, +1, -1, +2, -2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 10);
    ctx.lineTo(width / 2, height - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Kurva Distribusi Intensitas Fotometrik (Bawah)
    const graphBaseY = height - 25;
    const graphMaxH = 65;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, graphBaseY);
    ctx.lineTo(width - 10, graphBaseY);
    ctx.stroke();

    ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const dist = Math.abs(x - width / 2);
      const phase = (Math.PI * dist) / fringeSpacing;
      const intensity = Math.pow(Math.cos(phase), 2) * Math.max(0, 1 - Math.pow(dist / (width * 0.48), 2));
      const y = graphBaseY - (intensity * graphMaxH);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Label kurva
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px monospace';
    ctx.fillText('INTENSITAS CAHAYA (I)', 15, graphBaseY - graphMaxH + 5);
  }, [lambda, d, L]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-cyan-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition hover:border-slate-700 shadow-sm"
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Beranda</span>
              </Link>
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Optika Gelombang • SMA
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Waves className="text-cyan-400" size={24} />
              Interferensi Celah Ganda Thomas Young
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Pembuktian sifat gelombang cahaya melalui superposisi koheren dua berkas laser celah ganda (Eksperimen Young 1801).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetParams}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shadow-sm"
              title="Reset Parameter"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Jarak Antar Pita Terang:</span>
            <MathFormula formula="\Delta y = \frac{\lambda \cdot L}{d}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Kondisi Interferensi Konstruktif:</span>
            <MathFormula formula="d \sin\theta = m \cdot \lambda" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Kondisi Destruktif:</span>
            <MathFormula formula="d \sin\theta = (m - \frac{1}{2})\lambda" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-xl h-fit space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Sliders size={16} className="text-cyan-400"/> Pengaturan Laser
              </h2>
            </div>
            
            <div className="space-y-5">
              {/* Panjang Gelombang Laser */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Panjang Gelombang (<MathFormula formula="\lambda" />)</span>
                  <span className="font-mono font-bold" style={{ color: nmToRGB(lambda) }}>
                    {lambda} nm
                  </span>
                </div>
                <input 
                  type="range" min="390" max="720" value={lambda} 
                  onChange={(e) => setLambda(Number(e.target.value))} 
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer" 
                  style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6, #10b981, #eab308, #ef4444)' }}
                />
                
                {/* Presets Laser Populer */}
                <div className="grid grid-cols-3 gap-1 mt-2.5">
                  <button 
                    onClick={() => setLambda(405)}
                    className={`py-1 rounded border text-[10px] font-medium transition ${
                      lambda === 405 ? 'bg-purple-950/60 border-purple-400 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Violet 405
                  </button>
                  <button 
                    onClick={() => setLambda(532)}
                    className={`py-1 rounded border text-[10px] font-medium transition ${
                      lambda === 532 ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Hijau 532
                  </button>
                  <button 
                    onClick={() => setLambda(632)}
                    className={`py-1 rounded border text-[10px] font-medium transition ${
                      lambda === 632 ? 'bg-rose-950/60 border-rose-400 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Merah 632
                  </button>
                </div>
              </div>

              {/* Jarak Antar Celah (d) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Jarak Celah (<MathFormula formula="d" />)</span>
                  <span className="text-cyan-400 font-mono font-bold">{d.toFixed(2)} mm</span>
                </div>
                <input 
                  type="range" min="0.08" max="0.60" step="0.02" 
                  value={d} 
                  onChange={(e) => setD(Number(e.target.value))} 
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                  <span>0.08 mm (Pita Luas)</span>
                  <span>0.60 mm (Pita Rapat)</span>
                </div>
              </div>

              {/* Jarak Layar (L) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Jarak Layar (<MathFormula formula="L" />)</span>
                  <span className="text-cyan-400 font-mono font-bold">{L.toFixed(1)} m</span>
                </div>
                <input 
                  type="range" min="0.8" max="4.0" step="0.2" 
                  value={L} 
                  onChange={(e) => setL(Number(e.target.value))} 
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                  <span>0.8 m</span>
                  <span>4.0 m</span>
                </div>
              </div>

              {/* Formula Evaluasi Cepat */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400">Efek Perubahan Variabel:</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Jika <MathFormula formula="\lambda" /> naik atau <MathFormula formula="L" /> naik <span className="text-emerald-400 font-bold">→ pita makin renggang</span>.<br />
                  Jika <MathFormula formula="d" /> naik <span className="text-rose-400 font-bold">→ pita makin rapat</span>.
                </p>
              </div>
            </div>
          </div>

          {/* AREA KANVAS & TELEMETRI KANAN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Pola Fringes & Intensitas */}
            <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
              {/* Badge Terang Pusat */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest bg-slate-950/90 text-cyan-300 px-3 py-1 rounded-full border border-cyan-500/30 z-10 shadow-lg">
                TERANG PUSAT (m = 0)
              </div>
              
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={260} 
                className="w-full h-auto bg-[#030712] block rounded-xl border border-slate-800/60" 
              />
            </div>

            {/* Dashboard Telemetri 3-Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Jarak Antar Pita Terang */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-cyan-400" /> Jarak Pita (<MathFormula formula="\Delta y" />)
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {deltaY_mm.toFixed(3)} <span className="text-xs font-normal text-slate-400">mm</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Jarak pemisah antara dua pita terang berturutan
                </div>
              </div>

              {/* Card 2: Sudut Difraksi Orde 1 */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Waves size={13} className="text-emerald-400" /> Sudut Orde 1 (<MathFormula formula="\theta_1" />)
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {theta1Deg.toFixed(4)}°
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  \(\sin\theta_1 = \lambda / d = {(sinTheta1 * 1000).toFixed(2)} \times 10^{-3}\)
                </div>
              </div>

              {/* Card 3: Frekuensi Foton */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Waves size={13} style={{ color: nmToRGB(lambda) }} /> Frekuensi Gelombang (<MathFormula formula="f" />)
                </div>
                <div className="text-2xl font-black font-mono" style={{ color: nmToRGB(lambda) }}>
                  {((3e8 / (lambda * 1e-9)) / 1e12).toFixed(1)} <span className="text-xs font-normal text-slate-400">THz</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  c = 3.00 × 10⁸ m/s
                </div>
              </div>
            </div>

            {/* Kotak Edukasi / Teori Fisika */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex gap-3.5 items-start">
              <div className="bg-cyan-500/10 p-2.5 rounded-xl text-cyan-400 border border-cyan-500/20 shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Signifikansi Historis: Pembuktian Sifat Gelombang Cahaya</h4>
                <p className="leading-relaxed text-slate-400">
                  Sebelum tahun 1801, teori partikel korpuskular Sir Isaac Newton meyakini cahaya sebagai partikel lurus. Jika cahaya berupa partikel murni, melewati dua celah sempit hanya akan menghasilkan dua garis terang di layar.
                </p>
                <p className="leading-relaxed text-slate-400">
                  Thomas Young mendemonstrasikan munculnya puluhan garis pita terang dan gelap berulang yang teratur. Hal ini hanya mungkin terjadi jika gelombang dari celah pertama dan celah kedua saling menguatkan (<strong>interferensi konstruktif</strong> saat beda fase <MathFormula formula="\Delta \phi = 2m\pi" />) dan saling meniadakan (<strong>interferensi destruktif</strong> saat beda fase <MathFormula formula="\Delta \phi = (2m+1)\pi" />).
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
