"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Droplets, 
  FlaskConical, 
  CheckCircle, 
  Info, 
  ArrowLeft,
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

type IndicatorType = 'PP' | 'BTB' | 'MO';

export default function TitrasiAsamBasaSimulation() {
  // --- SPESIFIKASI TITRASI ---
  const vAcid = 25.0; // 25 mL HCl
  const cAcid = 0.10; // 0.10 M HCl
  const cBase = 0.10; // 0.10 M NaOH di buret

  // --- STATE KONTROL ---
  const [vBase, setVBase] = useState(0.0); // Volume titran yang sudah diteteskan (mL)
  const [indicator, setIndicator] = useState<IndicatorType>('PP');
  const [isDripping, setIsDripping] = useState(false);
  const [dripSpeed, setDripSpeed] = useState<'slow' | 'fast'>('fast');
  const [stirrerActive, setStirrerActive] = useState(true);

  // Titik data untuk kurva titrasi
  const [history, setHistory] = useState<{ v: number; ph: number }[]>([{ v: 0, ph: 1.0 }]);

  // Ref Canvas Kurva
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  const dripIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- KALKULASI pH TITRASI KUAT - KUAT ---
  const calculatePH = (vb: number) => {
    const molA = (vAcid / 1000) * cAcid;
    const molB = (vb / 1000) * cBase;
    const vTot = (vAcid + vb) / 1000;

    if (molA > molB) {
      const hPlus = (molA - molB) / vTot;
      return Math.min(6.9, Math.max(1.0, -Math.log10(hPlus)));
    } else if (molB > molA) {
      const ohMinus = (molB - molA) / vTot;
      const pOH = -Math.log10(ohMinus);
      return Math.min(13.0, Math.max(7.1, 14 - pOH));
    } else {
      return 7.0; // Titik Ekuivalen tepat
    }
  };

  const currentPH = calculatePH(vBase);

  // --- WARNA LARUTAN BERDASARKAN INDIKATOR ---
  const getSolutionColor = (ph: number, ind: IndicatorType) => {
    if (ind === 'PP') {
      // Trayek 8.3 - 10.0 (Bening -> Pink -> Magenta)
      if (ph < 8.3) return 'rgba(248, 250, 252, 0.25)'; // Bening / air
      if (ph >= 8.3 && ph <= 10.0) {
        const factor = (ph - 8.3) / 1.7;
        return `rgba(244, 114, 182, ${0.3 + factor * 0.55})`; // Pink lembut
      }
      return 'rgba(219, 39, 119, 0.9)'; // Magenta pekat
    }

    if (ind === 'BTB') {
      // Trayek 6.0 - 7.6 (Kuning -> Hijau -> Biru)
      if (ph < 6.0) return 'rgba(234, 179, 8, 0.8)'; // Kuning
      if (ph >= 6.0 && ph <= 7.6) {
        const factor = (ph - 6.0) / 1.6;
        const r = Math.round(234 * (1 - factor) + 14 * factor);
        const g = Math.round(179 * (1 - factor) + 165 * factor);
        const b = Math.round(8 * (1 - factor) + 233 * factor);
        return `rgba(${r}, ${g}, ${b}, 0.8)`; // Hijau transisi
      }
      return 'rgba(2, 132, 199, 0.85)'; // Biru
    }

    if (ind === 'MO') {
      // Trayek 3.1 - 4.4 (Merah -> Oranye -> Kuning)
      if (ph < 3.1) return 'rgba(239, 68, 68, 0.85)'; // Merah
      if (ph >= 3.1 && ph <= 4.4) {
        const factor = (ph - 3.1) / 1.3;
        const r = Math.round(239 * (1 - factor) + 245 * factor);
        const g = Math.round(68 * (1 - factor) + 158 * factor);
        const b = Math.round(68 * (1 - factor) + 11 * factor);
        return `rgba(${r}, ${g}, ${b}, 0.85)`; // Oranye transisi
      }
      return 'rgba(234, 179, 8, 0.85)'; // Kuning terang
    }

    return 'rgba(248, 250, 252, 0.25)';
  };

  // --- FUNGSI PENETESAN ---
  const addDrop = (amount: number) => {
    setVBase((prev) => {
      const next = Math.min(50.0, parseFloat((prev + amount).toFixed(2)));
      const newPH = calculatePH(next);
      setHistory((h) => [...h, { v: next, ph: newPH }]);
      if (next >= 50.0) setIsDripping(false);
      return next;
    });
  };

  // Loop penetesan otomatis
  useEffect(() => {
    if (isDripping && vBase < 50.0) {
      const intervalMs = dripSpeed === 'fast' ? 120 : 350;
      dripIntervalRef.current = setInterval(() => {
        addDrop(0.2);
      }, intervalMs);
    } else {
      if (dripIntervalRef.current) clearInterval(dripIntervalRef.current);
    }
    return () => {
      if (dripIntervalRef.current) clearInterval(dripIntervalRef.current);
    };
  }, [isDripping, vBase, dripSpeed]);

  // Reset Praktikum
  const resetTitrasi = () => {
    setIsDripping(false);
    setVBase(0.0);
    setHistory([{ v: 0, ph: 1.0 }]);
  };

  // --- RENDER KURVA TITRASI CANVAS ---
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padX = 45;
    const padY = 30;

    ctx.clearRect(0, 0, width, height);

    // Background Grid
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Garis Grid Sumbu Y (pH 0 - 14)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    for (let ph = 0; ph <= 14; ph += 2) {
      const y = height - padY - (ph / 14) * (height - padY * 2);
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(width - padX, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(ph.toString(), padX - 8, y + 3);
    }

    // Label Sumbu Y
    ctx.save();
    ctx.translate(14, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('pH Larutan', 0, 0);
    ctx.restore();

    // Garis Grid Sumbu X (Volume 0 - 50 mL)
    for (let v = 0; v <= 50; v += 10) {
      const x = padX + (v / 50) * (width - padX * 2);
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, height - padY);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(v.toString(), x, height - padY + 16);
    }

    // Label Sumbu X
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Volume NaOH Ditambahkan (mL)', width / 2, height - 6);

    // Garis Titik Ekuivalen pH 7 (Garis Hijau Putus-putus)
    const eqY = height - padY - (7.0 / 14) * (height - padY * 2);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padX, eqY);
    ctx.lineTo(width - padX, eqY);
    ctx.stroke();

    // Garis Ekuivalen Vertikal (V = 25 mL)
    const eqX = padX + (25.0 / 50) * (width - padX * 2);
    ctx.beginPath();
    ctx.moveTo(eqX, padY);
    ctx.lineTo(eqX, height - padY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Penanda Titik Ekuivalen
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(eqX, eqY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Plot Riwayat Titrasi
    if (history.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let i = 0; i < history.length; i++) {
        const pt = history[i];
        const x = padX + (pt.v / 50) * (width - padX * 2);
        const y = height - padY - (pt.ph / 14) * (height - padY * 2);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Titik Posisi Terkini
      const last = history[history.length - 1];
      const curX = padX + (last.v / 50) * (width - padX * 2);
      const curY = height - padY - (last.ph / 14) * (height - padY * 2);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [history]);

  const currentColor = getSolutionColor(currentPH, indicator);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Kimia SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-sky-400 to-emerald-400 mb-1">
              Laboratorium Titrasi Asam-Basa
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Analisis kurva pH real-time, penentuan titik ekuivalen presisi, dan visualisasi pengaduk magnetik vortex dengan indikator sintetis.
            </p>
          </div>

          <button
            onClick={resetTitrasi}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600 shadow-sm"
          >
            <RotateCcw size={15} /> Bersihkan Alat & Reset
          </button>
        </header>

        {/* BANNER RUMUS STOKIOMETRI & pH (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-pink-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Stoikiometri Netralisasi:</span>
            <MathFormula formula="V_A \cdot M_A \cdot n_A = V_B \cdot M_B \cdot n_B" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Hubungan pH & pOH:</span>
            <MathFormula formula="\text{pH} = -\log[\text{H}^+], \quad \text{pH} + \text{pOH} = 14" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Titik Netral:</span>
            <MathFormula formula="[\text{H}^+] = [\text{OH}^-] = 10^{-7}\text{ M} \implies \text{pH} = 7.0" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <FlaskConical size={16} className="text-pink-400" /> Pengaturan Reagen & Buret
            </h3>

            {/* Pilihan Indikator Sintetis */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Indikator Sintetis Asam-Basa:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['PP', 'BTB', 'MO'] as IndicatorType[]).map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => setIndicator(ind)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      indicator === ind
                        ? 'bg-pink-600 text-white border-pink-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono">
                {indicator === 'PP' && 'PP: 8.3 - 10.0 (Bening ⇌ Pink/Magenta)'}
                {indicator === 'BTB' && 'BTB: 6.0 - 7.6 (Kuning ⇌ Hijau ⇌ Biru)'}
                {indicator === 'MO' && 'MO: 3.1 - 4.4 (Merah ⇌ Oranye ⇌ Kuning)'}
              </p>
            </div>

            {/* Kontrol Penetesan Buret */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Metode Penetesan Titran NaOH:</label>
              
              <button
                type="button"
                onClick={() => setIsDripping(!isDripping)}
                disabled={vBase >= 50.0}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  isDripping
                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse shadow-amber-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 shadow-emerald-900/30'
                }`}
              >
                {isDripping ? <Pause size={16} /> : <Play size={16} />}
                {isDripping ? 'Tutup Keran Buret (Stop)' : 'Buka Keran Otomatis (Continuous)'}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => addDrop(0.1)}
                  disabled={isDripping || vBase >= 50.0}
                  className="py-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl text-xs font-bold border border-slate-800 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors"
                >
                  <Droplets size={14} className="text-sky-400" /> +0.1 mL
                </button>
                <button
                  type="button"
                  onClick={() => addDrop(1.0)}
                  disabled={isDripping || vBase >= 50.0}
                  className="py-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl text-xs font-bold border border-slate-800 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors"
                >
                  <Droplets size={14} className="text-sky-400" /> +1.0 mL
                </button>
              </div>

              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Kecepatan Tetes:</span>
                <button
                  type="button"
                  onClick={() => setDripSpeed(dripSpeed === 'fast' ? 'slow' : 'fast')}
                  className="text-pink-400 font-bold hover:underline"
                >
                  {dripSpeed === 'fast' ? '⚡ Cepat (0.2 mL)' : '💧 Presisi (Lambat)'}
                </button>
              </div>

              {/* Toggle Stirrer */}
              <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Pengaduk Magnetik:</span>
                <button
                  type="button"
                  onClick={() => setStirrerActive(!stirrerActive)}
                  className={`font-bold transition ${stirrerActive ? 'text-emerald-400' : 'text-slate-500'}`}
                >
                  {stirrerActive ? '🌀 Aktif (Vortex ON)' : '⏹️ Mati'}
                </button>
              </div>
            </div>

            {/* Info Reagen */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
              <div><strong className="text-pink-400">Titrat (Labu):</strong> 25.0 mL HCl 0.10 M</div>
              <div><strong className="text-sky-400">Titran (Buret):</strong> NaOH 0.10 M</div>
              <div><strong className="text-emerald-400">Titik Ekuivalen:</strong> 25.0 mL (pH = 7.0)</div>
            </div>
          </div>

          {/* VISUALISASI ALAT & KURVA (KANAN) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Buret & Erlenmeyer */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
              
              {/* Kolom Visual Alat Laboratorium (Buret + Labu) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
                
                {/* Tabung Buret Kaca */}
                <div className="w-9 h-48 bg-slate-950/80 border-2 border-slate-700 rounded-t-sm relative overflow-hidden flex flex-col justify-end shadow-inner">
                  {/* Cairan Titran Berkurang */}
                  <div 
                    className="w-full bg-sky-400/30 border-t-2 border-sky-300 transition-all duration-200"
                    style={{ height: `${Math.max(0, 100 - (vBase / 50) * 100)}%` }}
                  />
                  {/* Garis Skala Buret */}
                  <div className="absolute top-2 right-1 text-[8px] font-mono text-slate-400">0 mL</div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-1 text-[8px] font-mono text-slate-500">25 mL</div>
                  <div className="absolute bottom-2 right-1 text-[8px] font-mono text-slate-400">50 mL</div>
                  
                  {/* Indikator Volume Sisa */}
                  <div className="absolute top-2 left-1.5 text-[8px] font-mono text-sky-400 font-bold">
                    {(50 - vBase).toFixed(1)}
                  </div>
                </div>

                {/* Keran Buret (Stopcock) */}
                <div className="w-14 h-3.5 bg-slate-700 rounded-full my-1.5 flex items-center justify-center border border-slate-600 shadow-sm">
                  <div className={`w-3 h-7 rounded-sm bg-amber-400 shadow-md transition-transform duration-200 ${isDripping ? 'rotate-90' : 'rotate-0'}`} />
                </div>

                {/* Tip Nozzle & Animasi Tetesan Air */}
                <div className="w-2.5 h-6 bg-slate-700 relative flex justify-center">
                  {isDripping && (
                    <div className="w-2.5 h-3 bg-sky-300 rounded-full animate-bounce absolute top-4 shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                  )}
                </div>

                {/* Labu Erlenmeyer Kaca & Pengaduk Vortex */}
                <div className="w-40 h-40 relative mt-3 flex items-end justify-center">
                  <svg width="150" height="150" viewBox="0 0 150 150" className="absolute inset-0">
                    <defs>
                      <linearGradient id="flaskGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                      </linearGradient>
                    </defs>

                    {/* Kaca Labu Erlenmeyer */}
                    <path
                      d="M 60 12 L 90 12 L 90 48 L 132 130 A 8 8 0 0 1 124 140 L 26 140 A 8 8 0 0 1 18 130 L 60 48 Z"
                      fill="url(#flaskGlass)"
                      stroke="#94a3b8"
                      strokeWidth="3.5"
                    />

                    {/* Cairan dengan Warna Indikator Bergradasi */}
                    <path
                      d="M 44 80 L 106 80 L 128 132 A 4 4 0 0 1 124 137 L 26 137 A 4 4 0 0 1 22 132 Z"
                      fill={currentColor}
                      className="transition-colors duration-300"
                    />

                    {/* Pusaran (Vortex) Pengaduk Magnetik */}
                    {stirrerActive && (
                      <ellipse
                        cx="75"
                        cy="82"
                        rx="16"
                        ry="4"
                        fill="none"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="1.5"
                        className="animate-pulse"
                      />
                    )}

                    {/* Garis Skala Labu Erlenmeyer */}
                    <line x1="32" y1="108" x2="48" y2="108" stroke="#cbd5e1" strokeWidth="1.5" />
                    <text x="52" y="111" fill="#94a3b8" fontSize="8" fontFamily="monospace">25mL</text>

                    <line x1="44" y1="88" x2="56" y2="88" stroke="#cbd5e1" strokeWidth="1.5" />
                    <text x="60" y="91" fill="#94a3b8" fontSize="8" fontFamily="monospace">50mL</text>

                    {/* Bibir Erlenmeyer */}
                    <rect x="56" y="8" width="38" height="4" rx="2" fill="#cbd5e1" />
                  </svg>

                  {/* Pengaduk Magnetik Berputar (Magnetic Stir Bar) */}
                  <div className="flex flex-col items-center mb-3.5 z-10">
                    <div 
                      className={`w-7 h-2 bg-white rounded-full shadow-lg border border-slate-300 ${
                        stirrerActive ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '0.25s' }}
                    />
                  </div>
                </div>

                {/* Alas Pemanas & Magnetic Stirrer Plate */}
                <div className="w-44 h-5 bg-slate-800 rounded-lg border-t-2 border-slate-600 mt-1 shadow-xl flex items-center justify-between px-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${stirrerActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    <span className="text-[9px] font-mono text-slate-400">STIRRER</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">LAB-EQUIP</span>
                </div>
              </div>

              {/* Kolom Kurva Titrasi Real-Time */}
              <div className="md:col-span-8 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} className="text-pink-400" />
                      Kurva Titrasi (pH vs Volume NaOH)
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-800/80">
                      Titik Ekuivalen: 25.0 mL | pH 7.0
                    </span>
                  </div>

                  <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
                    <canvas
                      ref={graphCanvasRef}
                      width={520}
                      height={260}
                      className="w-full h-auto block"
                    />
                  </div>
                </div>

                {/* Display Angka Terkini */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Volume Ditambahkan</span>
                    <span className="text-2xl font-black text-sky-400 font-mono">
                      {vBase.toFixed(1)} <span className="text-xs font-normal text-slate-400">mL</span>
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">pH Larutan</span>
                    <span className="text-2xl font-black text-pink-400 font-mono">
                      {currentPH.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl text-center flex flex-col justify-center items-center">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Status Larutan</span>
                    {currentPH < 6.8 && (
                      <span className="text-xs font-bold text-amber-400">Asam (Belum Ekuivalen)</span>
                    )}
                    {currentPH >= 6.8 && currentPH <= 7.2 && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={13} /> Titik Ekuivalen Tepat!
                      </span>
                    )}
                    {currentPH > 7.2 && (
                      <span className="text-xs font-bold text-fuchsia-400">Basa (Lewat Ekuivalen)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Penjelasan Edukatif Konseptual */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-pink-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Analisis Titik Akhir vs Titik Ekuivalen:</strong>
                Titik ekuivalen teoritis tercapai tepat pada volume <MathFormula formula="V_{\text{NaOH}} = 25.0\text{ mL}" /> (<MathFormula formula="\text{pH} = 7.0" />). Namun, jika siswa menggunakan indikator <strong>Fenolftalein (PP)</strong>, perubahan warna baru mulai tampak saat larutan mencapai <MathFormula formula="\text{pH} = 8.3" /> (merah muda pudar). Selisih antara titik ekuivalen teoritis dan titik akhir titrasi ini disebut sebagai <em>kesalahan titrasi (titration error)</em>, konsep fundamental dalam kimia analitik kuantitatif!
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
