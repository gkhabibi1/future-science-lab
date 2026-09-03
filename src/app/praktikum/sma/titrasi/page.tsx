"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Droplet, RotateCcw, Settings, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import MathFormula from '@/components/MathFormula';

export default function TitrasiSimulation() {
  // Parameter Default: 25 mL HCl 0.1 M dititrasi dengan NaOH 0.1 M
  const [volAcid] = useState(25); // mL
  const [concAcid] = useState(0.1); // Molaritas
  const [concBase] = useState(0.1); // Molaritas
  
  const [volBaseAdded, setVolBaseAdded] = useState(0); // mL NaOH yang ditambahkan
  const [pH, setPH] = useState(1);
  const [isDripping, setIsDripping] = useState(false);

  // Fungsi Logika Perhitungan pH (Asam Kuat + Basa Kuat)
  const calculatePH = useCallback((vBase: number) => {
    const molAcid = volAcid * concAcid;
    const molBase = vBase * concBase;
    const totalVolume = volAcid + vBase;

    let currentPH = 7;
    if (molAcid > molBase) {
      // Kelebihan Asam
      const hPlus = (molAcid - molBase) / totalVolume;
      currentPH = -Math.log10(hPlus);
    } else if (molBase > molAcid) {
      // Kelebihan Basa
      const ohMinus = (molBase - molAcid) / totalVolume;
      const pOH = -Math.log10(ohMinus);
      currentPH = 14 - pOH;
    } else {
      // Titik Ekuivalen
      currentPH = 7;
    }
    return currentPH;
  }, [volAcid, concAcid, concBase]);

  // Efek Animasi Menetes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDripping && volBaseAdded < 50) {
      interval = setInterval(() => {
        setVolBaseAdded((prev) => {
          const nextVol = parseFloat((prev + 0.2).toFixed(1));
          if (nextVol >= 50) setIsDripping(false);
          return nextVol;
        });
      }, 100); // Kecepatan tetesan
    }
    return () => clearInterval(interval);
  }, [isDripping, volBaseAdded]);

  // Update pH setiap kali volume berubah
  useEffect(() => {
    setPH(calculatePH(volBaseAdded));
  }, [volBaseAdded, calculatePH]);

  // Penentuan Warna Indikator Fenolftalein (Trayek pH 8.3 - 10.0)
  const getFlaskColor = () => {
    if (pH < 8.3) return 'rgba(248, 250, 252, 0.3)'; // Bening
    if (pH >= 8.3 && pH <= 10) return 'rgba(244, 114, 182, 0.6)'; // Pink muda
    return 'rgba(236, 72, 153, 0.9)'; // Magenta pekat
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline">
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-pink-400">Tingkat SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Simulasi Titrasi Asam Basa</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Asam Kuat (HCl) Dititrasi dengan Basa Kuat (NaOH) & Indikator PP (Formulasi Presisi LaTeX)</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold">
            <Sparkles size={14} /> Chemistry Titration Engine
          </div>
        </header>

        {/* LaTeX Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-pink-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Netralisasi:</span>
            <MathFormula formula="M_A \cdot V_A \cdot n_A = M_B \cdot V_B \cdot n_B" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Perhitungan pH:</span>
            <MathFormula formula="\text{pH} = -\log[\text{H}^+]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Hubungan pOH & pH:</span>
            <MathFormula formula="\text{pH} = 14 - \text{pOH}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Alat Lab (Visual SVG & Buret) */}
          <div className="bg-slate-900/80 backdrop-blur p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[420px] relative">
            
            {/* Animasi Tetesan Air */}
            {isDripping && (
               <div className="absolute top-[185px] text-cyan-400 animate-bounce">
                  <Droplet size={16} fill="currentColor" />
               </div>
            )}

            {/* Buret SVG / Glass Component */}
            <div className="w-8 h-40 border-2 border-slate-700 rounded-b-md relative overflow-hidden bg-slate-950 shadow-inner">
                {/* Cairan Basa dalam buret berkurang */}
                <div 
                  className="absolute bottom-0 w-full bg-cyan-500/40 border-t border-cyan-400 transition-all duration-300"
                  style={{ height: `${100 - (volBaseAdded / 50 * 100)}%` }}
                />
                {/* Skala Buret */}
                <div className="absolute top-2 right-1 text-[8px] text-slate-500 font-mono">0</div>
                <div className="absolute bottom-2 right-1 text-[8px] text-slate-500 font-mono">50</div>
            </div>
            
            {/* Keran Buret */}
            <div 
              className={`w-12 h-3 rounded-full mt-1 cursor-pointer transition-colors shadow-md ${isDripping ? 'bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`} 
              onClick={() => setIsDripping(!isDripping)} 
              title="Klik untuk membuka/menutup keran"
            />

            {/* Erlenmeyer Flask */}
            <div className="mt-8 relative">
               <svg width="110" height="130" viewBox="0 0 100 120">
                  <path d="M40 0 L60 0 L60 40 L95 110 A 5 5 0 0 1 90 120 L10 120 A 5 5 0 0 1 5 110 L40 40 Z" fill="none" stroke="#64748b" strokeWidth="3"/>
                  {/* Cairan dalam Erlenmeyer */}
                  <path d="M30 60 L70 60 L93 115 A 2 2 0 0 1 90 118 L10 118 A 2 2 0 0 1 7 115 Z" fill={getFlaskColor()} className="transition-colors duration-500" />
               </svg>
            </div>
          </div>

          {/* Panel Kontrol & Informasi */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/80 backdrop-blur p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="flex items-center gap-2 font-bold text-cyan-400 text-sm"><Settings size={18}/> Kontrol Titrasi</h2>
                  <div className="px-4 py-2 bg-slate-950 text-cyan-300 font-bold rounded-2xl border border-cyan-500/40 font-mono text-xl shadow-lg">
                      pH: {pH.toFixed(2)}
                  </div>
              </div>

              <div>
                <label className="block mb-2 font-semibold text-xs text-slate-300">
                  Volume NaOH Ditambahkan (<MathFormula formula="V_B" />): <span className="text-cyan-400 font-mono font-bold">{volBaseAdded.toFixed(1)} mL</span>
                </label>
                <input 
                  type="range" min="0" max="50" step="0.1" 
                  value={volBaseAdded} 
                  onChange={(e) => { setVolBaseAdded(Number(e.target.value)); setIsDripping(false); }} 
                  className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-500 cursor-pointer" 
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setIsDripping(!isDripping)} 
                  className={`flex-1 py-3 rounded-2xl font-bold text-xs flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95 ${
                    isDripping ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white'
                  }`}
                >
                  <Droplet size={16}/> {isDripping ? 'Tutup Keran' : 'Buka Keran (Tetes)'}
                </button>
                <button 
                  onClick={() => { setVolBaseAdded(0); setIsDripping(false); }} 
                  className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 border border-slate-700 active:scale-95"
                >
                  <RotateCcw size={16}/> Reset
                </button>
              </div>
            </div>

            {/* Kotak Info Kesimpulan */}
            <div className="grid grid-cols-2 gap-4 text-xs">
               <div className="bg-slate-900/80 border border-purple-500/30 p-4 rounded-2xl space-y-1">
                  <span className="block font-bold text-purple-400 uppercase tracking-wide">Indikator</span>
                  <span className="text-base font-black text-purple-200">Fenolftalein (PP)</span>
                  <span className="block text-[10px] text-slate-400">Trayek pH: 8.3 – 10.0</span>
               </div>
               <div className="bg-slate-900/80 border border-emerald-500/30 p-4 rounded-2xl space-y-1">
                  <span className="block font-bold text-emerald-400 uppercase tracking-wide">Status Titik Ekuivalen</span>
                  <span className="text-base font-black text-emerald-300">
                      {pH < 7 ? 'Belum Tercapai' : (Math.abs(pH - 7) < 0.1 ? 'Tercapai (pH 7)' : 'Terlampaui')}
                  </span>
                  <span className="block text-[10px] text-slate-400">Target V_B: 25.0 mL</span>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
