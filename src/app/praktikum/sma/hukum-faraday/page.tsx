"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Power, 
  RotateCcw, 
  Scale, 
  Zap, 
  Clock, 
  Info, 
  Layers, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface MetalOption {
  name: string;
  symbol: string;
  ion: string;
  ar: number;
  valency: number;
  solColor: string;
  depositColor: string;
  ionColor: string;
  solName: string;
}

export default function FaradaySimulation() {
  const metals: Record<string, MetalOption> = {
    Cu: {
      name: 'Tembaga (Cu²⁺)',
      symbol: 'Cu',
      ion: 'Cu²⁺',
      ar: 63.5,
      valency: 2,
      solColor: 'rgba(56, 189, 248, 0.45)', // Biru muda cerah
      depositColor: '#b45309', // Cokelat tembaga kemerahan
      ionColor: '#38bdf8',
      solName: 'Larutan CuSO₄ 1.0 M',
    },
    Ag: {
      name: 'Perak (Ag⁺)',
      symbol: 'Ag',
      ion: 'Ag⁺',
      ar: 108.0,
      valency: 1,
      solColor: 'rgba(241, 245, 249, 0.25)', // Bening transparan
      depositColor: '#cbd5e1', // Putih perak mengilap
      ionColor: '#e2e8f0',
      solName: 'Larutan AgNO₃ 1.0 M',
    },
    Ni: {
      name: 'Nikel (Ni²⁺)',
      symbol: 'Ni',
      ion: 'Ni²⁺',
      ar: 58.7,
      valency: 2,
      solColor: 'rgba(52, 211, 153, 0.4)', // Hijau zamrud
      depositColor: '#64748b', // Abu-abu baja
      ionColor: '#34d399',
      solName: 'Larutan NiSO₄ 1.0 M',
    },
  };

  // --- STATE PARAMETER ---
  const [selectedMetalKey, setSelectedMetalKey] = useState<string>('Cu');
  const [currentI, setCurrentI] = useState<number>(2.0); // Kuat Arus (Ampere)
  const [isElectrolyzing, setIsElectrolyzing] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0); // Waktu t dalam sekon

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const bubblesRef = useRef<{ x: number; y: number; r: number; speed: number }[]>([]);
  const cationsRef = useRef<{ x: number; y: number; speed: number }[]>([]);
  const wireElectronOffset = useRef(0);

  const metal = metals[selectedMetalKey];

  // --- RUMUS HUKUM FARADAY I ---
  // w = (Ar / n) * (I * t) / 96500
  const eVal = metal.ar / metal.valency;
  const coulombsQ = currentI * seconds;
  const faradayF = coulombsQ / 96500;
  const molElectrons = faradayF; // 1 F = 1 mol elektron
  const molDeposited = faradayF / metal.valency;
  const depositedMass = (eVal * currentI * seconds) / 96500; // gram

  // Timer Waktu Elektrolisis
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isElectrolyzing) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isElectrolyzing]);

  // Inisialisasi gelembung gas O2 di anode & kation migran
  useEffect(() => {
    const bubbles = [];
    for (let i = 0; i < 25; i++) {
      bubbles.push({
        x: 145 + Math.random() * 20,
        y: 180 + Math.random() * 120,
        r: 1.5 + Math.random() * 2.5,
        speed: 0.8 + Math.random() * 1.5,
      });
    }
    bubblesRef.current = bubbles;

    const cations = [];
    for (let i = 0; i < 15; i++) {
      cations.push({
        x: 220 + Math.random() * 280,
        y: 160 + Math.random() * 120,
        speed: 0.6 + Math.random() * 0.9,
      });
    }
    cationsRef.current = cations;
  }, [selectedMetalKey]);

  // Animasi Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // 1. BEAKER KACA & LARUTAN ELEKTROLIT
      ctx.fillStyle = metal.solColor;
      ctx.fillRect(80, 150, w - 160, 180);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 130, w - 160, 200);

      // Label Nama Larutan di Beaker
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(metal.solName, w / 2, 318);

      // 2. ELEKTRODE ANODE (KIRI - ELEKTRODA KARBON/INERT)
      ctx.fillStyle = '#1e293b'; // Karbon hitam
      ctx.fillRect(145, 90, 20, 170);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.strokeRect(145, 90, 20, 170);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('(+) Anode Karbon', 155, 275);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#f87171';
      ctx.fillText('2H₂O → O₂↑ + 4H⁺ + 4e⁻', 155, 290);

      // 3. ELEKTRODE KATODE (KANAN - LOGAM KATODE)
      // Inti plat katode
      ctx.fillStyle = '#475569';
      ctx.fillRect(w - 165, 90, 20, 170);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(w - 165, 90, 20, 170);

      // Lapisan Endapan Logam yang Mengendap (Menebal seiring waktu)
      const coatThickness = Math.min(14, Math.floor(depositedMass * 15) + (isElectrolyzing ? 2 : 0));
      if (coatThickness > 0) {
        ctx.fillStyle = metal.depositColor;
        // Melapisi sisi kiri, kanan, dan bawah katode
        ctx.fillRect(w - 165 - coatThickness, 130, coatThickness, 130);
        ctx.fillRect(w - 145, 130, coatThickness, 130);
        ctx.fillRect(w - 165 - coatThickness, 260, 20 + coatThickness * 2, coatThickness);

        // Efek tekstur butiran kristal endapan
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.strokeRect(w - 165 - coatThickness, 130, coatThickness, 130);
      }

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('(-) Katode', w - 155, 275);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#7dd3fc';
      ctx.fillText(`${metal.ion} + ${metal.valency}e⁻ → ${metal.symbol}(s)`, w - 155, 290);

      // 4. KAWAT LISTRIK KE CATU DAYA DC
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Anode (+) kabel merah ke Catu Daya (sisi positif)
      ctx.moveTo(155, 90); ctx.lineTo(155, 45); ctx.lineTo(w / 2 - 80, 45);
      // Katode (-) kabel hitam ke Catu Daya (sisi negatif)
      ctx.moveTo(w - 155, 90); ctx.lineTo(w - 155, 45); ctx.lineTo(w / 2 + 80, 45);
      ctx.stroke();

      // Label polaritas kabel
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('[+] KUTUB POSITIF', w / 2 - 120, 36);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('[-] KUTUB NEGATIF', w / 2 + 120, 36);

      // 5. ANIMASI DINAMIS SAAT ELEKTROLISIS AKTIF
      if (isElectrolyzing) {
        // A. Gelembung gas O2 di Anode
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        bubblesRef.current.forEach((b) => {
          b.y -= b.speed * (currentI / 2);
          if (b.y < 140) {
            b.y = 250 + Math.random() * 20;
            b.x = 145 + Math.random() * 20;
          }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // B. Migrasi Kation Logam ke Katode (Kanan)
        ctx.fillStyle = metal.ionColor;
        ctx.font = 'bold 9px monospace';
        cationsRef.current.forEach((cat) => {
          cat.x += cat.speed * (currentI / 1.5);
          if (cat.x > w - 170) {
            cat.x = 200 + Math.random() * 60;
            cat.y = 160 + Math.random() * 100;
          }
          ctx.beginPath();
          ctx.arc(cat.x, cat.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillText(metal.ion, cat.x - 6, cat.y - 6);
        });

        // C. Aliran Elektron di Kawat Luar
        wireElectronOffset.current = (wireElectronOffset.current + 1.2 * (currentI / 2)) % 25;
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 5;

        // Elektron naik dari anode ke kabel horizontal
        for (let y = 85 - wireElectronOffset.current; y >= 45; y -= 25) {
          ctx.beginPath(); ctx.arc(155, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        // Elektron melewati kabel horizontal menuju catu daya
        for (let x = 155 + wireElectronOffset.current; x <= w / 2 - 80; x += 25) {
          ctx.beginPath(); ctx.arc(x, 45, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        // Elektron keluar dari catu daya menuju katode
        for (let x = w / 2 + 80 + wireElectronOffset.current; x <= w - 155; x += 25) {
          ctx.beginPath(); ctx.arc(x, 45, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        // Elektron turun ke katode
        for (let y = 45 + wireElectronOffset.current; y <= 90; y += 25) {
          ctx.beginPath(); ctx.arc(w - 155, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [metal, isElectrolyzing, depositedMass, currentI]);

  const resetExperiment = () => {
    setIsElectrolyzing(false);
    setSeconds(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Kimia SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-sky-400 mb-1">
              Simulasi Hukum Faraday (Elektrolisis & Pelapisan Logam)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Kuantifikasi stoikiometri mol elektron, penimbangan analitik massa endapan katode, dan kinetika reaksi sel elektrolisis.
            </p>
          </div>

          <button
            onClick={resetExperiment}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600 shadow-sm"
          >
            <RotateCcw size={15} /> Ganti Katode Baru (Reset)
          </button>
        </header>

        {/* BANNER RUMUS HUKUM FARADAY (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Hukum Faraday I:</span>
            <MathFormula formula="w = e \cdot F = \frac{A_r}{n} \cdot \frac{I \cdot t}{96500}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Muatan Listrik:</span>
            <MathFormula formula="Q = I \cdot t \implies F = \frac{Q}{96500}\text{ mol } e^-" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Massa Ekuivalen:</span>
            <MathFormula formula="e = \frac{A_r}{n}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (DC POWER SUPPLY) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> Catu Daya DC (Power Supply)
            </h3>

            {/* Tombol Daya Listrik ON/OFF */}
            <button
              type="button"
              onClick={() => setIsElectrolyzing(!isElectrolyzing)}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                isElectrolyzing
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              <Power size={17} /> {isElectrolyzing ? 'Matikan Catu Daya (OFF)' : 'Nyalakan Arus Listrik (ON)'}
            </button>

            {/* Pilihan Logam Endapan */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Pilih Kation Logam Elektrolisis:</label>
              <div className="space-y-1.5">
                {Object.keys(metals).map((key) => {
                  const m = metals[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setSelectedMetalKey(key); setSeconds(0); setIsElectrolyzing(false); }}
                      className={`w-full p-2.5 text-left rounded-xl border text-xs font-bold transition-all ${
                        selectedMetalKey === key
                          ? 'bg-amber-950/60 text-amber-200 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-white text-xs mb-0.5">{m.name}</div>
                      <div className="text-amber-400 font-mono text-[11px]">
                        Ar = {m.ar} | Valensi (n) = {m.valency}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider Kuat Arus (Ampere) */}
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Kuat Arus (I)</span>
                <span className="text-amber-400 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{currentI.toFixed(1)} A</span>
              </label>
              <input
                type="range" min="0.5" max="5.0" step="0.5"
                value={currentI}
                onChange={(e) => setCurrentI(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5 A (Lambat)</span>
                <span>5.0 A (Cepat)</span>
              </div>
            </div>

            {/* Stopwatch Waktu Reaksi */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-sky-400" /> Waktu Elektrolisis (t):
              </span>
              <span className="text-lg font-mono font-black text-white">
                {seconds} <span className="text-xs font-normal text-slate-400">detik</span>
              </span>
            </div>
          </div>

          {/* AREA CANVAS & TIMBANGAN ANALITIK (KANAN) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Beaker Elektrolisis */}
            <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col items-center backdrop-blur">
              
              {/* Box Tampilan Tegangan & Arus Catu Daya di Tengah Atas (Mobile: Di atas kanvas, Desktop: Absolute overlay) */}
              <div className="mb-3 sm:mb-0 sm:absolute sm:top-5 sm:left-1/2 sm:-translate-x-1/2 bg-slate-950 border border-slate-700 sm:border-2 rounded-xl sm:rounded-2xl px-4 py-2 sm:px-6 sm:py-2.5 flex gap-4 sm:gap-6 text-center shadow-xl z-10">
                <div>
                  <div className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 tracking-wider">AMPEREMETER DC</div>
                  <div className="text-base sm:text-xl font-black font-mono text-amber-400">
                    {isElectrolyzing ? currentI.toFixed(2) : '0.00'} A
                  </div>
                </div>
                <div className="border-l border-slate-800 pl-4 sm:pl-6">
                  <div className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 tracking-wider">STATUS CATU DAYA</div>
                  <div className={`text-[11px] sm:text-xs font-bold mt-0.5 sm:mt-1 ${isElectrolyzing ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                    {isElectrolyzing ? '⚡ ARUS MENGALIR' : '○ STANDBY'}
                  </div>
                </div>
              </div>

              <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={350}
                  className="w-full h-auto block"
                />
              </div>

              <div className="flex justify-between items-center mt-3 text-[11px] text-slate-400">
                <span>Anode Karbon: Oksidasi Air menghasilkan Gas O₂ ↑</span>
                <span>Katode Logam: Reduksi Kation menjadi Endapan {metal.name}</span>
              </div>
            </div>

            {/* Dashboard Hasil Perhitungan Hukum Faraday */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Hasil 1: Timbangan Analitik Massa Endapan (w) */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5">
                      <Scale size={15} className="text-emerald-400" /> Timbangan Analitik
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80">±0.0001 g</span>
                  </div>
                  <div className="text-3xl font-black text-emerald-400 font-mono mt-2">
                    {depositedMass.toFixed(4)} <span className="text-base font-normal text-slate-400">gram</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                  w = (e · I · t) / 96.500
                </p>
              </div>

              {/* Hasil 2: Muatan Listrik (Q) & Faraday (F) */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-md">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Muatan Listrik & Mol Elektron</span>
                  <div className="text-lg font-bold font-mono text-sky-400 mt-1">
                    {coulombsQ.toLocaleString()} <span className="text-xs font-normal text-slate-400">Coulomb (Q)</span>
                  </div>
                  <div className="text-xs font-mono text-slate-300 mt-1">
                    = {faradayF.toFixed(5)} <span className="text-slate-400">Faraday (mol e⁻)</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                  Q = I · t | 1 F = 96.500 C
                </p>
              </div>

              {/* Hasil 3: Massa Ekuivalen (e) & Mol Endapan */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between shadow-md">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                    <Layers size={14} className="text-amber-400" /> Massa Ekuivalen (e)
                  </span>
                  <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {eVal.toFixed(2)}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Mol endapan = {molDeposited.toFixed(6)} mol
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                  e = Ar / valensi ({metal.ar} / {metal.valency})
                </p>
              </div>

            </div>

            {/* Diagram Alur Stoikiometri Konversi */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-2">
                Alur Konversi Stoikiometri Hukum Faraday I:
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2 text-center">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex-1 min-w-[100px]">
                  <span className="text-[10px] text-slate-500 block">Kuat Arus & Waktu</span>
                  <span className="font-mono text-amber-400 font-bold">{currentI} A × {seconds} s</span>
                </div>
                <ArrowRight size={14} className="text-slate-600 shrink-0" />
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex-1 min-w-[100px]">
                  <span className="text-[10px] text-slate-500 block">Muatan Listrik (Q)</span>
                  <span className="font-mono text-sky-400 font-bold">{coulombsQ} C</span>
                </div>
                <ArrowRight size={14} className="text-slate-600 shrink-0" />
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex-1 min-w-[100px]">
                  <span className="text-[10px] text-slate-500 block">Mol Elektron (F)</span>
                  <span className="font-mono text-purple-400 font-bold">{faradayF.toFixed(5)} F</span>
                </div>
                <ArrowRight size={14} className="text-slate-600 shrink-0" />
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex-1 min-w-[100px]">
                  <span className="text-[10px] text-slate-500 block">Massa Terendapkan (w)</span>
                  <span className="font-mono text-emerald-400 font-bold">{depositedMass.toFixed(4)} g</span>
                </div>
              </div>
            </div>

            {/* Catatan Konsep Edukatif */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Analisis Komparatif Hukum Faraday:</strong>
                Perhatikan logam <strong>Perak (<MathFormula formula="\text{Ag}^+" />)</strong>! Meskipun <MathFormula formula="A_r" /> tembaga (<MathFormula formula="63.5" />) dan perak (<MathFormula formula="108" />) berbeda, ion perak bervalensi <MathFormula formula="+1" />, sehingga massa ekuivalennya mencapai <MathFormula formula="e = 108.0" />. Pada kuat arus (<MathFormula formula="I" />) dan durasi waktu (<MathFormula formula="t" />) yang sama persis, massa endapan perak yang terbentuk di katode berbobot lebih dari 3 kali lipat dibandingkan tembaga (<MathFormula formula="e = 31.75" />). Fenomena ini menjadi fondasi utama dalam industri penyepuhan emas dan perak (*electroplating*).
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
