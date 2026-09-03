"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Droplet, RotateCcw, Settings, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import MathFormula from '@/components/MathFormula';

interface Drop {
  id: number;
  y: number;
  speed: number;
}

interface Ripple {
  id: number;
  radius: number;
  alpha: number;
}

export default function TitrasiSimulation() {
  // --- VARIABEL BEBAS (INPUTS) ---
  const [volAcid, setVolAcid] = useState(25);      // mL (Volume HCl)
  const [concAcid, setConcAcid] = useState(0.1);   // M (Molaritas HCl)
  const [concBase, setConcBase] = useState(0.1);   // M (Molaritas NaOH)
  const [dripRate, setDripRate] = useState(0.2);   // mL/tetesan

  // --- STATE PRAKTIKUM ---
  const [volBaseAdded, setVolBaseAdded] = useState(0); // mL NaOH yang ditambahkan
  const [pH, setPH] = useState(1);
  const [isDripping, setIsDripping] = useState(false);

  // Animation States for Drop Physics
  const [drops, setDrops] = useState<Drop[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const dropIdRef = useRef(0);
  const rippleIdRef = useRef(0);

  // Perhitungan Titik Ekuivalen Teoretis: V_eq = (M_A * V_A) / M_B
  const equivVolume = (concAcid * volAcid) / concBase;

  // Fungsi Logika Perhitungan pH Presisi
  const calculatePH = useCallback((vBase: number) => {
    const molAcid = volAcid * concAcid;
    const molBase = vBase * concBase;
    const totalVolume = volAcid + vBase;

    let currentPH = 7;
    if (molAcid > molBase) {
      // Kelebihan Asam
      const hPlus = (molAcid - molBase) / totalVolume;
      currentPH = Math.max(0.5, -Math.log10(hPlus));
    } else if (molBase > molAcid) {
      // Kelebihan Basa
      const ohMinus = (molBase - molAcid) / totalVolume;
      const pOH = -Math.log10(ohMinus);
      currentPH = Math.min(13.8, 14 - pOH);
    } else {
      // Titik Ekuivalen
      currentPH = 7.0;
    }
    return currentPH;
  }, [volAcid, concAcid, concBase]);

  // Efek Animasi Menetes & Fisika Butiran Air Fall Physics
  useEffect(() => {
    let dripTimer: NodeJS.Timeout;
    if (isDripping && volBaseAdded < 60) {
      dripTimer = setInterval(() => {
        // Spawn a new falling drop particle
        dropIdRef.current += 1;
        const newDropId = dropIdRef.current;
        setDrops((prev) => [...prev, { id: newDropId, y: 0, speed: 6 }]);

        // Increment volume
        setVolBaseAdded((prev) => {
          const nextVol = parseFloat((prev + dripRate).toFixed(1));
          if (nextVol >= 60) setIsDripping(false);
          return nextVol;
        });
      }, 180);
    }
    return () => clearInterval(dripTimer);
  }, [isDripping, volBaseAdded, dripRate]);

  // Animation Loop for Drops falling down burette into flask
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setDrops((prevDrops) => {
        const nextDrops: Drop[] = [];
        prevDrops.forEach((d) => {
          const nextY = d.y + d.speed;
          if (nextY >= 140) {
            // Drop hits flask liquid surface! Spawn ripple
            rippleIdRef.current += 1;
            const rId = rippleIdRef.current;
            setRipples((prevR) => [...prevR, { id: rId, radius: 2, alpha: 0.9 }]);
          } else {
            nextDrops.push({ ...d, y: nextY });
          }
        });
        return nextDrops;
      });

      setRipples((prevRipples) => {
        return prevRipples
          .map((r) => ({ ...r, radius: r.radius + 1.2, alpha: r.alpha - 0.05 }))
          .filter((r) => r.alpha > 0);
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update pH setiap kali volume berubah
  useEffect(() => {
    setPH(calculatePH(volBaseAdded));
  }, [volBaseAdded, calculatePH]);

  // Penentuan Warna Indikator Fenolftalein (Trayek pH 8.3 - 10.0)
  const getFlaskColor = () => {
    if (pH < 8.3) return 'rgba(248, 250, 252, 0.25)'; // Bening
    if (pH >= 8.3 && pH <= 10) {
      const alpha = 0.3 + ((pH - 8.3) / 1.7) * 0.4;
      return `rgba(244, 114, 182, ${alpha})`; // Pink muda bertahap
    }
    return 'rgba(236, 72, 153, 0.9)'; // Magenta pekat
  };

  const handleReset = () => {
    setVolBaseAdded(0);
    setIsDripping(false);
    setDrops([]);
    setRipples([]);
  };

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
              <span className="text-xs font-semibold text-pink-400">Tingkat SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Simulasi Titrasi Asam Basa Interaktif</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Laboratorium Kimia Virtual (Variabel Bebas Fleksibel & Animasi Tetesan Air Realistis)</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold">
            <Sparkles size={14} /> Realistic Droplet Engine
          </div>
        </header>

        {/* LaTeX Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-pink-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Netralisasi:</span>
            <MathFormula formula="M_A \cdot V_A \cdot n_A = M_B \cdot V_B \cdot n_B" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Titik Ekuivalen Teoretis (<MathFormula formula="V_{\text{eq}}" />):</span>
            <span className="font-mono text-cyan-400 font-bold">{equivVolume.toFixed(1)} mL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Perhitungan pH:</span>
            <MathFormula formula="\text{pH} = -\log[\text{H}^+]" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Panel Alat Lab (Visual SVG & Buret Animasi) */}
          <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
            
            {/* Liquid Falling Drops Animation */}
            <div className="absolute top-[180px] w-full flex justify-center pointer-events-none z-20">
              {drops.map((drop) => (
                <div
                  key={drop.id}
                  className="absolute text-cyan-400"
                  style={{ transform: `translateY(${drop.y}px)` }}
                >
                  <Droplet size={14} fill="currentColor" className="drop-shadow-md" />
                </div>
              ))}
            </div>

            {/* Buret Container */}
            <div className="w-8 h-40 border-2 border-slate-700 rounded-b-md relative overflow-hidden bg-slate-950 shadow-inner z-10">
                {/* Cairan Basa dalam buret berkurang */}
                <div 
                  className="absolute bottom-0 w-full bg-cyan-500/40 border-t border-cyan-400 transition-all duration-300"
                  style={{ height: `${100 - (volBaseAdded / 50 * 100)}%` }}
                />
                <div className="absolute top-2 right-1 text-[8px] text-slate-500 font-mono">0</div>
                <div className="absolute bottom-2 right-1 text-[8px] text-slate-500 font-mono">50</div>
            </div>
            
            {/* Keran Buret */}
            <div 
              className={`w-12 h-3 rounded-full mt-1 cursor-pointer transition-colors shadow-md z-10 ${isDripping ? 'bg-amber-500 animate-pulse' : 'bg-slate-700 hover:bg-slate-600'}`} 
              onClick={() => setIsDripping(!isDripping)} 
              title="Klik untuk membuka/menutup keran"
            />

            {/* Erlenmeyer Flask SVG with Ripples */}
            <div className="mt-10 relative z-10">
               <svg width="140" height="150" viewBox="0 0 100 120">
                  {/* Glass Outline */}
                  <path d="M40 0 L60 0 L60 40 L95 110 A 5 5 0 0 1 90 120 L10 120 A 5 5 0 0 1 5 110 L40 40 Z" fill="none" stroke="#64748b" strokeWidth="3"/>
                  
                  {/* Cairan Asam + Indikator dalam Erlenmeyer */}
                  <path d="M30 60 L70 60 L93 115 A 2 2 0 0 1 90 118 L10 118 A 2 2 0 0 1 7 115 Z" fill={getFlaskColor()} className="transition-colors duration-500" />

                  {/* Surface Ripple Effect when drop hits */}
                  {ripples.map((r) => (
                    <ellipse
                      key={r.id}
                      cx="50"
                      cy="60"
                      rx={r.radius}
                      ry={r.radius * 0.3}
                      fill="none"
                      stroke="rgba(56, 189, 248, 0.8)"
                      strokeWidth="1.5"
                      opacity={r.alpha}
                    />
                  ))}
               </svg>
            </div>
          </div>

          {/* Panel Kontrol & Variabel Bebas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/80 backdrop-blur p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="flex items-center gap-2 font-bold text-pink-400 text-sm"><Settings size={18}/> Pengaturan Variabel Bebas</h2>
                  <div className="px-4 py-2 bg-slate-950 text-pink-300 font-bold rounded-2xl border border-pink-500/40 font-mono text-xl shadow-lg">
                      pH: {pH.toFixed(2)}
                  </div>
              </div>

              {/* Sliders Variabel Bebas */}
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-2">
                    <span>Volume Asam HCl (<MathFormula formula="V_A" />)</span>
                    <span className="font-mono text-pink-400 font-bold">{volAcid} mL</span>
                  </div>
                  <input 
                    type="range" min="10" max="50" step="5" 
                    value={volAcid} 
                    onChange={(e) => { setVolAcid(Number(e.target.value)); handleReset(); }} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-pink-500 cursor-pointer" 
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-2">
                    <span>Molaritas Asam HCl (<MathFormula formula="M_A" />)</span>
                    <span className="font-mono text-purple-400 font-bold">{concAcid} M</span>
                  </div>
                  <input 
                    type="range" min="0.05" max="0.5" step="0.05" 
                    value={concAcid} 
                    onChange={(e) => { setConcAcid(Number(e.target.value)); handleReset(); }} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-purple-500 cursor-pointer" 
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-2">
                    <span>Molaritas Basa NaOH (<MathFormula formula="M_B" />)</span>
                    <span className="font-mono text-cyan-400 font-bold">{concBase} M</span>
                  </div>
                  <input 
                    type="range" min="0.05" max="0.5" step="0.05" 
                    value={concBase} 
                    onChange={(e) => { setConcBase(Number(e.target.value)); handleReset(); }} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-500 cursor-pointer" 
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-semibold mb-2">
                    <span>Kecepatan Tetesan Pipet/Buret</span>
                    <span className="font-mono text-amber-400 font-bold">{dripRate} mL/tetes</span>
                  </div>
                  <input 
                    type="range" min="0.1" max="0.5" step="0.1" 
                    value={dripRate} 
                    onChange={(e) => setDripRate(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer" 
                  />
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-slate-300 font-semibold mb-2">
                    <span>Volume NaOH Ditambahkan (<MathFormula formula="V_B" />)</span>
                    <span className="font-mono text-cyan-400 font-bold">{volBaseAdded.toFixed(1)} mL</span>
                  </div>
                  <input 
                    type="range" min="0" max="60" step="0.1" 
                    value={volBaseAdded} 
                    onChange={(e) => { setVolBaseAdded(Number(e.target.value)); setIsDripping(false); }} 
                    className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-500 cursor-pointer" 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setIsDripping(!isDripping)} 
                  className={`flex-1 py-3 rounded-2xl font-bold text-xs flex justify-center items-center gap-2 transition-all shadow-lg active:scale-95 ${
                    isDripping ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white'
                  }`}
                >
                  <Droplet size={16}/> {isDripping ? 'Hentikan Tetesan' : 'Buka Keran Pipet (Tetes)'}
                </button>
                <button 
                  onClick={handleReset} 
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
                      {volBaseAdded < equivVolume - 0.2 ? 'Belum Tercapai' : (Math.abs(volBaseAdded - equivVolume) <= 0.2 ? 'Tercapai (pH 7)' : 'Terlampaui')}
                  </span>
                  <span className="block text-[10px] text-slate-400">Target V_B: {equivVolume.toFixed(1)} mL</span>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
