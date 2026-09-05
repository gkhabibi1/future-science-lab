"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sun, Zap, Target, Settings2, ArrowLeft } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface Particle {
  x: number;
  y: number;
  speed: number;
  active: boolean;
}

export default function FotolistrikSimulation() {
  // --- STATE PARAMETER ---
  const [wavelength, setWavelength] = useState(400); // Nanometer (nm)
  const [intensity, setIntensity] = useState(5); // Jumlah foton per frame
  const [metal, setMetal] = useState('Sodium');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Data Logam (Fungsi Kerja dalam eV)
  const metals = {
    'Sodium': { wf: 2.36, color: '#facc15' }, // Natrium
    'Zinc': { wf: 4.31, color: '#94a3b8' },   // Seng
    'Copper': { wf: 4.70, color: '#b45309' }, // Tembaga
    'Platinum': { wf: 6.35, color: '#e2e8f0' } // Platina
  };

  // Referensi sistem partikel
  const photons = useRef<Particle[]>([]);
  const electrons = useRef<Particle[]>([]);

  // --- KALKULASI FISIKA KUANTUM ---
  // Konstanta hc dalam satuan eV·nm = 1240
  const photonEnergy = 1240 / wavelength; 
  const workFunction = metals[metal as keyof typeof metals].wf;
  
  // Jika Energi Foton > Fungsi kerja, ada sisa untuk Energi Kinetik
  const isEmitting = photonEnergy >= workFunction;
  const kineticEnergy = isEmitting ? (photonEnergy - workFunction) : 0;

  // Helper untuk warna cahaya (nm -> RGB string)
  const getLightColor = (wl: number) => {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) { r = -(wl - 440)/(440 - 380); b = 1; }
    else if (wl >= 440 && wl < 490) { g = (wl - 440)/(490 - 440); b = 1; }
    else if (wl >= 490 && wl < 510) { g = 1; b = -(wl - 510)/(510 - 490); }
    else if (wl >= 510 && wl < 580) { r = (wl - 510)/(580 - 510); g = 1; }
    else if (wl >= 580 && wl < 645) { r = 1; g = -(wl - 645)/(645 - 580); }
    else if (wl >= 645 && wl <= 780) { r = 1; }
    
    // Fallback UV jadi ungu redup, IR jadi merah gelap
    if (wl < 380) return `rgba(139, 92, 246, 0.6)`; 
    if (wl > 780) return `rgba(153, 27, 27, 0.6)`;
    
    return `rgba(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)}, 0.8)`;
  };

  // --- ANIMASI PARTIKEL ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Background hitam (ruang vakum)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gambar Plat Logam Kiri (Katoda)
      const metalColor = metals[metal as keyof typeof metals].color;
      ctx.fillStyle = metalColor;
      ctx.fillRect(50, 50, 20, 200);
      
      // Gambar Plat Kanan (Anoda/Detektor)
      ctx.fillStyle = '#475569';
      ctx.fillRect(canvas.width - 70, 50, 20, 200);

      // Sorotan Senter Cahaya
      const lightColor = getLightColor(wavelength);
      ctx.fillStyle = lightColor;
      ctx.globalAlpha = intensity / 20; // Opacity cahaya bergantung intensitas
      ctx.beginPath();
      ctx.moveTo(150, 0); // Asal cahaya dari atas
      ctx.lineTo(70, 50);
      ctx.lineTo(70, 250);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Spawner Foton (Cahaya Masuk)
      if (Math.random() < (intensity / 10)) {
        photons.current.push({
          x: 150 - (Math.random() * 50),
          y: 0,
          speed: 8,
          active: true
        });
      }

      // Update & Gambar Foton (Gelombang zigzag turun)
      ctx.strokeStyle = lightColor;
      ctx.lineWidth = 2;
      for (let i = photons.current.length - 1; i >= 0; i--) {
        const p = photons.current[i];
        p.x -= p.speed * 0.5; // Miring ke kiri
        p.y += p.speed;

        // Visualisasi foton sebagai gelombang bergelombang
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.sin(p.y/5)*5, p.y - 10);
        ctx.stroke();

        // Tumbukan Foton dengan Logam
        if (p.x <= 70 && p.y >= 50 && p.y <= 250) {
          photons.current.splice(i, 1);
          
          // SPAWN ELEKTRON (Hanya jika energi cukup!)
          if (isEmitting) {
            electrons.current.push({
              x: 70,
              y: p.y,
              speed: 2 + (kineticEnergy * 2), // Kecepatan bergantung Ek
              active: true
            });
          }
        } else if (p.y > canvas.height) {
           photons.current.splice(i, 1);
        }
      }

      // Update & Gambar Elektron (Partikel Biru menyeberang)
      ctx.fillStyle = '#38bdf8'; // Biru cerah (Elektron)
      for (let i = electrons.current.length - 1; i >= 0; i--) {
        const e = electrons.current[i];
        e.x += e.speed; // Bergerak ke detektor (kanan)

        ctx.beginPath();
        ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('-', e.x-3, e.y+3);
        ctx.fillStyle = '#38bdf8';

        // Hit detektor
        if (e.x >= canvas.width - 70) {
          electrons.current.splice(i, 1);
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [wavelength, intensity, metal, isEmitting, kineticEnergy]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold transition mb-3 border border-slate-300 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Eksperimen Efek Fotolistrik</h1>
          <p className="text-slate-500 font-medium">Pembuktian Sifat Dualisme Partikel-Gelombang Cahaya &amp; Paket Kuanta Energi (Albert Einstein).</p>
        </header>

        {/* Formula Banner */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-around items-center gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Energi Foton (E):</span>
            <MathFormula formula="E = h \cdot f = \frac{h \cdot c}{\lambda}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Persamaan Einstein:</span>
            <MathFormula formula="E_k = E - W_0 = h f - W_0" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 h-fit space-y-6">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-600 pb-2">
              <Settings2 size={18} className="text-blue-400"/> Setup Alat
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">Target Plat Logam</label>
                <select 
                   value={metal} 
                   onChange={(e) => setMetal(e.target.value)}
                   className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2 font-medium cursor-pointer"
                >
                  {Object.keys(metals).map(m => (
                     <option key={m} value={m}>{m} (W₀ = {metals[m as keyof typeof metals].wf} eV)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex justify-between text-sm font-semibold text-slate-300 mb-2">
                  <span>Panjang Gel. Sinar (<MathFormula formula="\lambda" />)</span>
                  <span className="text-white font-mono">{wavelength} nm</span>
                </label>
                {/* Spektrum Warna Slider */}
                <input 
                  type="range" min="200" max="800" value={wavelength} 
                  onChange={(e) => setWavelength(Number(e.target.value))} 
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer" 
                  style={{ background: 'linear-gradient(to right, #6b21a8, #3b82f6, #10b981, #eab308, #ef4444, #7f1d1d)' }}
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase font-bold">
                   <span>UV (Ungu)</span> <span>Tampak</span> <span>Inframerah</span>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-sm font-semibold text-slate-300 mb-2">
                  <span>Intensitas Cahaya</span>
                  <span className="text-white font-mono">{intensity * 10}%</span>
                </label>
                <input type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full accent-yellow-400 cursor-pointer" />
              </div>
            </div>
          </div>

          {/* AREA KANVAS & ANALISIS (KANAN) */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="bg-[#0f172a] p-2 sm:p-4 rounded-2xl shadow-xl border-2 border-slate-700 relative overflow-hidden">
               <div className="absolute top-2 right-2 sm:top-4 sm:right-6 flex flex-col gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold bg-slate-800/85 backdrop-blur p-2 sm:p-2.5 rounded-lg border border-slate-600 z-10">
                  <div className="text-yellow-400 flex items-center gap-1.5">⚡ Foton (Energi Cahaya)</div>
                  <div className="text-sky-400 flex items-center gap-1.5">⊖ Elektron (Terlepas)</div>
               </div>
               
               <canvas ref={canvasRef} width={800} height={320} className="w-full h-auto bg-[#0f172a] block rounded-xl" />
            </div>

            {/* Panel Kalkulasi Kuantum */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               
               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1 mb-2"><Sun size={14}/> Energi Foton (<MathFormula formula="E" />)</h4>
                  <div className="text-2xl font-black text-amber-600 font-mono">{photonEnergy.toFixed(2)} eV</div>
                  <p className="text-[10px] text-slate-500 mt-1"><MathFormula formula="E = \frac{hc}{\lambda}" /> (Energi kuanta paket cahaya)</p>
               </div>

               <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1 mb-2"><Target size={14}/> Fungsi Kerja Logam (<MathFormula formula="W_0" />)</h4>
                  <div className="text-2xl font-black text-slate-700 font-mono">{workFunction.toFixed(2)} eV</div>
                  <p className="text-[10px] text-slate-500 mt-1">Energi ambang batas pelepasan elektron</p>
               </div>

               <div className={`p-5 rounded-xl border shadow-sm transition-colors ${isEmitting ? 'bg-sky-50 border-sky-200' : 'bg-red-50 border-red-200'}`}>
                  <h4 className={`text-xs uppercase font-bold flex items-center gap-1 mb-2 ${isEmitting ? 'text-sky-600' : 'text-red-600'}`}>
                    <Zap size={14}/> Energi Kinetik (<MathFormula formula="E_k" />)
                  </h4>
                  <div className={`text-2xl font-black font-mono ${isEmitting ? 'text-sky-700' : 'text-red-700'}`}>
                    {isEmitting ? kineticEnergy.toFixed(2) : '0.00'} eV
                  </div>
                  <p className={`text-xs font-bold mt-1 ${isEmitting ? 'text-sky-600' : 'text-red-600'}`}>
                    {isEmitting ? 'Elektron Terlepas! (E > W₀)' : 'Gagal Lepas! (E < W₀)'}
                  </p>
               </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
