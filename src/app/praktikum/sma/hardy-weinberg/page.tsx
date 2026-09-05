"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  Info, 
  Users, 
  ArrowLeft, 
  Bug, 
  TrendingUp, 
  Scale 
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface GenotypeRecord {
  gen: number;
  p: number;
  q: number;
  countAA: number;
  countAa: number;
  countaa: number;
}

interface BeetleVisual {
  x: number;
  y: number;
  type: 'AA' | 'Aa' | 'aa';
  angle: number;
}

export default function HardyWeinbergSimulation() {
  // --- STATE PARAMETER POPULASI ---
  const [initialP, setInitialP] = useState<number>(0.5); // Frekuensi awal alel A (0.1 - 0.9)
  const [populationSize, setPopulationSize] = useState<number>(100); // Ukuran populasi N (20 - 1000)
  const [selectionS, setSelectionS] = useState<number>(0.0); // Koefisien seleksi terhadap aa (0.0 = netral, 0.8 = seleksi ketat)
  
  // Status Simulasi
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [generation, setGeneration] = useState<number>(0);
  const [history, setHistory] = useState<GenotypeRecord[]>([]);

  // Canvas untuk plot grafik pergeseran alel & koloni kumbang
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  const beetleCanvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Inisialisasi Populasi Generasi 0
  const initPopulation = () => {
    setIsRunning(false);
    const p = initialP;
    const q = 1 - p;
    
    // Distribusi teoritis awal H-W
    const expectedAA = Math.round(p * p * populationSize);
    const expectedAa = Math.round(2 * p * q * populationSize);
    const expectedaa = Math.max(0, populationSize - expectedAA - expectedAa);

    const initialRecord: GenotypeRecord = {
      gen: 0,
      p,
      q,
      countAA: expectedAA,
      countAa: expectedAa,
      countaa: expectedaa,
    };

    setGeneration(0);
    setHistory([initialRecord]);
  };

  useEffect(() => {
    initPopulation();
  }, [initialP, populationSize]);

  // --- LANGKAH SIMULASI SATU GENERASI (GENETIC DRIFT + SELEKSI ALAM) ---
  const stepGeneration = () => {
    setHistory((prevHistory) => {
      if (prevHistory.length === 0) return prevHistory;
      const current = prevHistory[prevHistory.length - 1];
      
      // Jika alel sudah fiksasi total (p = 1 atau p = 0)
      if (current.p === 1 || current.p === 0) {
        setIsRunning(false);
        return prevHistory;
      }

      // 1. Kebugaran Relatif (Relative Fitness) akibat Seleksi Alam
      // w(AA) = 1, w(Aa) = 1, w(aa) = 1 - s
      const wAA = 1.0;
      const wAa = 1.0;
      const waa = Math.max(0, 1.0 - selectionS);

      // Bobot reproduksi populasi
      const effectiveAA = current.countAA * wAA;
      const effectiveAa = current.countAa * wAa;
      const effectiveaa = current.countaa * waa;
      const totalEffective = effectiveAA + effectiveAa + effectiveaa;

      if (totalEffective === 0) {
        setIsRunning(false);
        return prevHistory;
      }

      // Frekuensi alel setelah seleksi alam (sebelum sampling generasi baru)
      const postSelP = (2 * effectiveAA + effectiveAa) / (2 * totalEffective);

      // 2. Pembentukan Generasi Baru lewat Pengambilan Sampel Acak (Genetic Drift)
      // Setiap individu baru mendapatkan 2 alel hasil undian independen dari pool gen
      let nextAA = 0;
      let nextAa = 0;
      let nextaa = 0;

      for (let i = 0; i < populationSize; i++) {
        // Ambil alel pertama (A atau a)
        const allele1 = Math.random() < postSelP ? 'A' : 'a';
        // Ambil alel kedua (A atau a)
        const allele2 = Math.random() < postSelP ? 'A' : 'a';

        if (allele1 === 'A' && allele2 === 'A') nextAA++;
        else if (allele1 === 'a' && allele2 === 'a') nextaa++;
        else nextAa++;
      }

      // Hitung frekuensi alel generasi baru
      const totalAlleles = 2 * populationSize;
      const newP = (2 * nextAA + nextAa) / totalAlleles;
      const newQ = 1 - newP;
      const nextGenNum = current.gen + 1;

      const newRecord: GenotypeRecord = {
        gen: nextGenNum,
        p: parseFloat(newP.toFixed(4)),
        q: parseFloat(newQ.toFixed(4)),
        countAA: nextAA,
        countAa: nextAa,
        countaa: nextaa,
      };

      setGeneration(nextGenNum);
      if (nextGenNum >= 50) setIsRunning(false);

      return [...prevHistory, newRecord];
    });
  };

  // Loop Otomatis Simulasi
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        stepGeneration();
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, selectionS, populationSize]);

  // Data Terkini
  const currentRecord = history[history.length - 1] || {
    gen: 0,
    p: initialP,
    q: 1 - initialP,
    countAA: 0,
    countAa: 0,
    countaa: 0,
  };

  // Prediksi Hardy-Weinberg Teoritis berdasarkan p saat ini
  const expAA = Math.round(currentRecord.p * currentRecord.p * populationSize);
  const expAa = Math.round(2 * currentRecord.p * currentRecord.q * populationSize);
  const expaa = Math.max(0, populationSize - expAA - expAa);

  // Uji Deviasi Chi-Square antara observasi nyata dan prediksi H-W
  const devChiSquare = useMemo(() => {
    let chi = 0;
    const items = [
      { o: currentRecord.countAA, e: expAA },
      { o: currentRecord.countAa, e: expAa },
      { o: currentRecord.countaa, e: expaa },
    ];
    items.forEach(({ o, e }) => {
      if (e > 0) chi += Math.pow(o - e, 2) / e;
    });
    return chi;
  }, [currentRecord, expAA, expAa, expaa]);

  // --- RENDER GRAFIK FREKUENSI ALEL (CANVAS) ---
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const padX = 40;
    const padY = 25;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Garis Grid Sumbu Y (Frekuensi 0.0 - 1.0)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.8;
    for (let f = 0; f <= 1.0; f += 0.2) {
      const y = h - padY - f * (h - padY * 2);
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(f.toFixed(1), padX - 8, y + 3);
    }

    // Garis Keseimbangan Netral Tengah (0.5)
    const midY = h - padY - 0.5 * (h - padY * 2);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, midY);
    ctx.lineTo(w - padX, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Garis Grid Sumbu X (Generasi 0 - 50)
    const maxGen = Math.max(50, history.length);
    for (let g = 0; g <= maxGen; g += 10) {
      const x = padX + (g / maxGen) * (w - padX * 2);
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, h - padY);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`F${g}`, x, h - padY + 16);
    }

    // Plot Garis Frekuensi
    if (history.length > 1) {
      // 1. Kurva Frekuensi Alel A (p) - Oranye
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = padX + (history[i].gen / maxGen) * (w - padX * 2);
        const y = h - padY - history[i].p * (h - padY * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Kurva Frekuensi Alel a (q) - Cyan
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = padX + (history[i].gen / maxGen) * (w - padX * 2);
        const y = h - padY - history[i].q * (h - padY * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Titik Posisi Terkini
      const last = history[history.length - 1];
      const lastX = padX + (last.gen / maxGen) * (w - padX * 2);
      const lastY_p = h - padY - last.p * (h - padY * 2);
      const lastY_q = h - padY - last.q * (h - padY * 2);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); 
      ctx.arc(lastX, lastY_p, 5.5, 0, Math.PI * 2); 
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath(); 
      ctx.arc(lastX, lastY_q, 5.5, 0, Math.PI * 2); 
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [history]);

  // --- RENDER VISUALISASI KOLONI KUMBANG (CANVAS) ---
  useEffect(() => {
    const canvas = beetleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Latar habitat pulau pasir & rumput
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(1, '#022c22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Efek tekstur habitat (bintik tanah pulau)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 60; i++) {
      const rx = (Math.sin(i * 99) * 0.5 + 0.5) * w;
      const ry = (Math.cos(i * 33) * 0.5 + 0.5) * h;
      ctx.beginPath();
      ctx.arc(rx, ry, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tampilkan representasi kumbang (maks 100 ekor di kanvas untuk performa)
    const maxVisual = Math.min(100, populationSize);
    const scale = maxVisual / populationSize;
    const numAA = Math.round(currentRecord.countAA * scale);
    const numAa = Math.round(currentRecord.countAa * scale);
    const numaa = Math.max(0, maxVisual - numAA - numAa);

    const beetles: ('AA' | 'Aa' | 'aa')[] = [
      ...Array(numAA).fill('AA'),
      ...Array(numAa).fill('Aa'),
      ...Array(numaa).fill('aa'),
    ];

    // Gambar setiap kumbang pada posisi terdistribusi acak semi-stabil
    beetles.forEach((type, idx) => {
      // Hitung koordinat pseudo-random berbasis indeks
      const px = 25 + ((idx * 59 + 17) % (w - 50));
      const py = 25 + ((idx * 83 + 31) % (h - 50));
      const radius = 6;

      ctx.save();
      ctx.translate(px, py);

      // Warna Kumbang sesuai Genotipe:
      // AA = Oranye Terang
      // Aa = Belang Cokelat-Kuning
      // aa = Putih Krem (resesif / mudah terlihat predator jika ada seleksi)
      if (type === 'AA') {
        ctx.fillStyle = '#f59e0b'; // Oranye
      } else if (type === 'Aa') {
        ctx.fillStyle = '#d97706'; // Cokelat emas
      } else {
        ctx.fillStyle = '#f8fafc'; // Putih terang
      }

      // Tubuh Kumbang
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Garis sayap tengah
      ctx.strokeStyle = type === 'aa' ? '#94a3b8' : '#78350f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 1.1);
      ctx.lineTo(0, radius * 1.1);
      ctx.stroke();

      // Kepala kumbang
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -radius * 1.1, radius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }, [currentRecord, populationSize]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-teal-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* BREADCRUMB & HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/" className="hover:text-teal-400 transition-colors flex items-center gap-1">
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span>/</span>
              <span className="text-teal-400">Biologi SMA</span>
              <span>/</span>
              <span className="text-slate-200">Hukum Hardy-Weinberg & Mikroevolusi</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-teal-300 to-cyan-400">
              Simulasi Hukum Hardy-Weinberg & Mikroevolusi
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Eksperimen stokastik genetika populasi: Pengaruh ukuran populasi (Hanyutan Genetik / *Genetic Drift*) dan tekanan seleksi alam ($s$) terhadap dinamika frekuensi alel dari generasi ke generasi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsRunning(!isRunning)}
              disabled={generation >= 50 || currentRecord.p === 1 || currentRecord.p === 0}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg transition-all disabled:opacity-50 ${
                isRunning 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Jeda Simulasi' : 'Jalankan Evolusi'}
            </button>
            <button
              onClick={stepGeneration}
              disabled={isRunning || generation >= 50 || currentRecord.p === 1 || currentRecord.p === 0}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-all text-slate-300 hover:text-white"
            >
              <FastForward size={14} /> +1 Generasi
            </button>
            <button
              onClick={initPopulation}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex items-center gap-2 border border-slate-700 transition-all text-sm text-slate-300 hover:text-white"
            >
              <RotateCcw size={16} /> Reset Populasi
            </button>
          </div>
        </div>

        {/* PERSAMAAN MATEMATIKA HARDY-WEINBERG BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Keseimbangan Frekuensi Alel & Genotipe (Hukum Hardy-Weinberg)
              </span>
              <div className="text-sm md:text-base font-serif text-slate-200">
                <MathFormula formula="p + q = 1, \\quad p^2 + 2pq + q^2 = 1" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                Kebugaran Relatif (Relative Fitness) Seleksi Alam
              </span>
              <div className="text-sm md:text-base font-serif text-slate-200">
                <MathFormula formula="w_{AA} = 1, \\quad w_{Aa} = 1, \\quad w_{aa} = 1 - s" />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PANEL KONTROL KIRI (COL 4) */}
          <div className="lg:col-span-4 space-y-5">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5 shadow-xl">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity size={16} className="text-teal-400" /> Parameter Gene Pool
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Faktor Evolusi</span>
              </h3>

              {/* Slider Frekuensi Awal Alel A (p) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Frekuensi Awal Alel Dominan A (p):</span>
                  <span className="text-amber-400 font-mono font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {initialP.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={initialP}
                  disabled={generation > 0}
                  onChange={(e) => setInitialP(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>p = 0.10 (Langka)</span>
                  <span>p = 0.90 (Melimpah)</span>
                </div>
              </div>

              {/* Slider Ukuran Populasi (Genetic Drift Factor) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Users size={14} className="text-sky-400" /> Ukuran Populasi Pulau (N):
                  </span>
                  <span className="text-sky-400 font-mono font-bold bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">
                    {populationSize} ekor
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="600"
                  step="20"
                  value={populationSize}
                  disabled={generation > 0}
                  onChange={(e) => setPopulationSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-40"
                />
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-rose-400 font-bold">20 (Drift Ekstrem)</span>
                  <span className="text-emerald-400 font-bold">600 (Stabil)</span>
                </div>
              </div>

              {/* Slider Seleksi Alam terhadap homozigot resesif (aa) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert size={14} className="text-rose-400" /> Tekanan Seleksi thd Kumbang Putih (aa):
                  </span>
                  <span className="text-rose-400 font-mono font-bold bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20">
                    s = {selectionS.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.05"
                  value={selectionS}
                  onChange={(e) => setSelectionS(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>s = 0.0 (Netral / Aman)</span>
                  <span>s = 0.8 (Tekanan Predator Kuat)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kebugaran fenotipe resesif: <strong className="text-slate-300 font-mono">w(aa) = {(1 - selectionS).toFixed(2)}</strong>
                </p>
              </div>

              {/* Display Generasi Terkini */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Generasi Berjalan:</span>
                <span className="text-xl font-black font-mono text-white">
                  F{generation} <span className="text-xs font-normal text-slate-400">/ F50</span>
                </span>
              </div>

              {/* Kondisi Status Fiksasi Alel */}
              <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">Status Polimorfisme Gene Pool:</div>
                {currentRecord.p === 1.0 ? (
                  <div className="text-amber-400 font-bold">
                    🔥 FIKSASI ALEL A! Alel a telah punah permanen dari populasi.
                  </div>
                ) : currentRecord.p === 0.0 ? (
                  <div className="text-cyan-400 font-bold">
                    ❄️ FIKSASI ALEL a! Alel A telah lenyap permanen dari populasi.
                  </div>
                ) : (
                  <div className="text-emerald-400 font-medium">
                    ✅ Polimorfisme Terjaga (Kedua alel masih eksis dalam gene pool).
                  </div>
                )}
              </div>

              {/* Skenario Eksperimen Cepat */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block">Skenario Uji Cepat:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setPopulationSize(20); setSelectionS(0); initPopulation(); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-rose-300 border border-slate-700 text-left"
                  >
                    🎲 Hanyutan Genetik Murni (N = 20)
                  </button>
                  <button
                    onClick={() => { setPopulationSize(500); setSelectionS(0); initPopulation(); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-emerald-300 border border-slate-700 text-left"
                  >
                    ⚖️ Kesetimbangan Stabil (N = 500)
                  </button>
                  <button
                    onClick={() => { setPopulationSize(300); setSelectionS(0.6); initPopulation(); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-amber-300 border border-slate-700 text-left"
                  >
                    🦅 Seleksi Alam Predator (s = 0.6)
                  </button>
                  <button
                    onClick={() => { setInitialP(0.2); setPopulationSize(100); setSelectionS(0); initPopulation(); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-sky-300 border border-slate-700 text-left"
                  >
                    🌱 Founder Effect (Alel A Langka)
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* AREA CANVAS PLOT & DASHBOARD GENOTIPE (COL 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Visualisasi Kurva Fluktuasi Frekuensi Alel */}
            <div className="bg-[#070d18] p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3 border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <TrendingUp size={16} className="text-teal-400" /> Dinamika Frekuensi Alel vs Waktu Generasi
                </span>
                <div className="flex gap-4 text-xs font-bold font-mono">
                  <span className="text-amber-400 flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Alel A (p) = {currentRecord.p.toFixed(3)}
                  </span>
                  <span className="text-cyan-400 flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Alel a (q) = {currentRecord.q.toFixed(3)}
                  </span>
                </div>
              </div>

              <canvas
                ref={graphCanvasRef}
                width={700}
                height={260}
                className="w-full h-auto rounded-xl bg-[#020617] border border-slate-800/90 shadow-inner"
              />
            </div>

            {/* Visualisasi Koloni Kumbang di Habitat Pulau */}
            <div className="bg-[#070d18] p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Bug size={16} className="text-emerald-400" /> Koloni Kumbang Habitat Pulau (Visualisasi Fenotipe Nyata)
                </span>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> AA (Oranye)
                  </span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span> Aa (Belang)
                  </span>
                  <span className="flex items-center gap-1 text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-100 inline-block"></span> aa (Putih)
                  </span>
                </div>
              </div>

              <canvas
                ref={beetleCanvasRef}
                width={700}
                height={160}
                className="w-full h-36 rounded-xl border border-slate-800 shadow-inner"
              />
            </div>

            {/* Dashboard Komposisi Genotipe Nyata vs Teoritis H-W */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* KELOMPOK HOMOZIGOT DOMINAN (AA) */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-amber-400 uppercase">Homozigot Dominan (AA)</span>
                    <span className="text-[10px] font-mono text-slate-400">p²</span>
                  </div>
                  <div className="text-2xl font-black text-amber-300 font-mono mt-1">
                    {currentRecord.countAA} <span className="text-xs font-normal text-slate-400">ekor ({((currentRecord.countAA / populationSize) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Prediksi H-W (p²·N):</span>
                  <strong className="text-slate-200 font-mono">{expAA} ekor</strong>
                </div>
              </div>

              {/* KELOMPOK HETEROZIGOT (Aa) */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-teal-400 uppercase">Heterozigot Carrier (Aa)</span>
                    <span className="text-[10px] font-mono text-slate-400">2pq</span>
                  </div>
                  <div className="text-2xl font-black text-teal-300 font-mono mt-1">
                    {currentRecord.countAa} <span className="text-xs font-normal text-slate-400">ekor ({((currentRecord.countAa / populationSize) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Prediksi H-W (2pq·N):</span>
                  <strong className="text-slate-200 font-mono">{expAa} ekor</strong>
                </div>
              </div>

              {/* KELOMPOK HOMOZIGOT RESESIF (aa) */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase">Homozigot Resesif (aa)</span>
                    <span className="text-[10px] font-mono text-slate-400">q²</span>
                  </div>
                  <div className="text-2xl font-black text-cyan-300 font-mono mt-1">
                    {currentRecord.countaa} <span className="text-xs font-normal text-slate-400">ekor ({((currentRecord.countaa / populationSize) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Prediksi H-W (q²·N):</span>
                  <strong className="text-slate-200 font-mono">{expaa} ekor</strong>
                </div>
              </div>

            </div>

            {/* Penjelasan Edukatif Konseptual */}
            <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={22} className="text-teal-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <strong className="text-teal-300 text-sm block">Wawasan Praktikum Genetika Populasi:</strong>
                <p>
                  1. <strong>Uji Hanyutan Genetik (Genetic Drift):</strong> Atur populasi pada angka kecil (N = 20) tanpa seleksi alam (s = 0). Jalankan simulasi beberapa kali; Anda akan melihat garis oranye dan biru bergelombang liar dan sering kali salah satu alel punah secara tak terduga dalam waktu kurang dari 20 generasi murni karena faktor keberuntungan acak!
                </p>
                <p>
                  2. <strong>Uji Kestabilan Hardy-Weinberg:</strong> Atur populasi pada angka besar (N = 600) dan seleksi alam nol (s = 0). Garis frekuensi alel akan membentuk garis lurus mendatar yang stabil dari generasi ke generasi, membuktikan keabsahan Hukum Keseimbangan Hardy-Weinberg.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
