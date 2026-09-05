"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Droplet, 
  RotateCcw, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  Plus, 
  Minus,
  ArrowLeft,
  Info,
  Beaker,
  Gauge
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function BufferSimulation() {
  // Volume awal kedua gelas: 100 mL
  const initialVol = 100; // mL
  const reagentConc = 0.1; // 0.1 M HCl atau NaOH

  // State kuantitatif reagen yang ditambahkan
  // Positif = penambahan NaOH (mL), Negatif = penambahan HCl (mL)
  const [netReagentAdded, setNetReagentAdded] = useState(0.0);
  const [history, setHistory] = useState<{ step: number; waterPH: number; bufferPH: number }[]>([
    { step: 0, waterPH: 7.0, bufferPH: 4.76 }
  ]);

  // Canvas untuk plot kurva
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- KALKULASI pH AIR MURNI ---
  const calcWaterPH = (netReagentML: number) => {
    const totalVolL = (initialVol + Math.abs(netReagentML)) / 1000;
    const molReagent = (Math.abs(netReagentML) / 1000) * reagentConc;

    if (netReagentML === 0) return 7.0;

    if (netReagentML < 0) {
      // Ditambah HCl (Asam Kuat)
      const hPlus = (1e-7 * (initialVol / 1000) + molReagent) / totalVolL;
      return Math.max(1.0, Math.min(6.99, -Math.log10(hPlus)));
    } else {
      // Ditambah NaOH (Basa Kuat)
      const ohMinus = (1e-7 * (initialVol / 1000) + molReagent) / totalVolL;
      const pOH = -Math.log10(ohMinus);
      return Math.min(13.5, Math.max(7.01, 14 - pOH));
    }
  };

  // --- KALKULASI pH LARUTAN PENYANGGA (Asetat 0.1 M) ---
  const calcBufferPH = (netReagentML: number) => {
    const pKa = 4.76;
    // Awal: 100 mL buffer mengandung 0.01 mol CH3COOH dan 0.01 mol CH3COO-
    let molHA = 0.01;
    let molA = 0.01;
    const molReagent = (Math.abs(netReagentML) / 1000) * reagentConc;

    if (netReagentML < 0) {
      // Ditambah HCl: A- + H+ -> HA
      molA = Math.max(0.0001, molA - molReagent);
      molHA = molHA + molReagent;
    } else if (netReagentML > 0) {
      // Ditambah NaOH: HA + OH- -> A- + H2O
      molHA = Math.max(0.0001, molHA - molReagent);
      molA = molA + molReagent;
    }

    const calculated = pKa + Math.log10(molA / molHA);
    return Math.max(1.5, Math.min(12.5, calculated));
  };

  const currentWaterPH = calcWaterPH(netReagentAdded);
  const currentBufferPH = calcBufferPH(netReagentAdded);

  // Penambahan Tetes Reagen
  const handleAddReagent = (amount: number) => {
    setNetReagentAdded((prev) => {
      const next = parseFloat((prev + amount).toFixed(1));
      const wPH = calcWaterPH(next);
      const bPH = calcBufferPH(next);

      setHistory((h) => [...h, { step: next, waterPH: wPH, bufferPH: bPH }]);
      return next;
    });
  };

  // Reset Praktikum
  const resetExperiment = () => {
    setNetReagentAdded(0.0);
    setHistory([{ step: 0, waterPH: 7.0, bufferPH: 4.76 }]);
  };

  // --- SPEKTRUM WARNA INDIKATOR UNIVERSAL (RGB) ---
  const getUniversalIndicatorColor = (ph: number) => {
    // 1-3: Merah, 4-5: Oranye/Kuning, 6-7: Hijau cerah, 8-9: Cyan/Biru, 10-14: Ungu
    if (ph <= 3) return 'rgba(239, 68, 68, 0.75)'; // Merah tua
    if (ph <= 5) return 'rgba(249, 115, 22, 0.75)'; // Oranye
    if (ph <= 6.5) return 'rgba(234, 179, 8, 0.75)'; // Kuning
    if (ph <= 7.5) return 'rgba(34, 197, 94, 0.7)'; // Hijau (Netral)
    if (ph <= 9) return 'rgba(6, 182, 212, 0.75)'; // Cyan
    if (ph <= 11) return 'rgba(59, 130, 246, 0.75)'; // Biru
    return 'rgba(168, 85, 247, 0.8)'; // Ungu pekat
  };

  // --- RENDER GRAFIK CANVAS KOMPARASI ---
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const pad = 40;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Sumbu & Grid Sumbu Y (pH 0 - 14)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    for (let ph = 0; ph <= 14; ph += 2) {
      const y = h - pad - (ph / 14) * (h - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(ph.toString(), pad - 8, y + 3);
    }

    // Label Sumbu Y
    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('pH Larutan', 0, 0);
    ctx.restore();

    // Garis Tengah pH 7 (Netral)
    const neutralY = h - pad - (7 / 14) * (h - pad * 2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad, neutralY);
    ctx.lineTo(w - pad, neutralY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label Titik Netral
    ctx.fillStyle = '#22c55e';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('pH 7.0 Netral', pad + 8, neutralY - 6);

    // Label Sumbu X
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Riwayat Langkah Penetesan Reagen', w / 2, h - 8);

    if (history.length > 1) {
      // 1. Plot Air Murni (Garis Putus-putus Merah/Rose)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = pad + (i / (history.length - 1)) * (w - pad * 2);
        const y = h - pad - (history[i].waterPH / 14) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Plot Larutan Penyangga (Garis Solid Cyan/Biru)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = pad + (i / (history.length - 1)) * (w - pad * 2);
        const y = h - pad - (history[i].bufferPH / 14) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Titik Aktif Terakhir (Air Murni)
      const last = history[history.length - 1];
      const lastX = pad + (w - pad * 2);
      const waterY = h - pad - (last.waterPH / 14) * (h - pad * 2);
      const bufferY = h - pad - (last.bufferPH / 14) * (h - pad * 2);

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(lastX, waterY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Titik Aktif Terakhir (Penyangga)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(lastX, bufferY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Kimia SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400 mb-1">
              Laboratorium Larutan Penyangga (Buffer)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Eksperimen komparatif ketahanan pH berdampingan: Larutan Penyangga Asetat vs Air Murni terhadap asam kuat & basa kuat.
            </p>
          </div>

          <button
            onClick={resetExperiment}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600 shadow-sm"
          >
            <RotateCcw size={15} /> Kalibrasi Ulang (Reset)
          </button>
        </header>

        {/* BANNER FORMULA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Henderson-Hasselbalch:</span>
            <MathFormula formula="\text{pH} = pK_a + \log\frac{[\text{CH}_3\text{COO}^-]}{[\text{CH}_3\text{COOH}]}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Konstanta Asetat:</span>
            <MathFormula formula="pK_a = 4.76" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Kapasitas Penyangga:</span>
            <MathFormula formula="\beta = \frac{dC_{\text{basa}}}{d\text{pH}}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (PIPET REAGEN) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Droplet size={16} className="text-sky-400" /> Pipet Tetes Reagen
            </h3>

            {/* Tombol Tambah Asam Kuat (HCl) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-rose-400 block">
                Penambahan Asam Kuat (HCl 0.1 M):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddReagent(-0.5)}
                  className="py-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <Minus size={14} /> 0.5 mL (10 tetes)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddReagent(-2.0)}
                  className="py-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <Minus size={14} /> 2.0 mL
                </button>
              </div>
            </div>

            {/* Tombol Tambah Basa Kuat (NaOH) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-sky-400 block">
                Penambahan Basa Kuat (NaOH 0.1 M):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddReagent(0.5)}
                  className="py-2.5 bg-sky-950/60 hover:bg-sky-900 border border-sky-700/60 text-sky-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <Plus size={14} /> 0.5 mL (10 tetes)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddReagent(2.0)}
                  className="py-2.5 bg-sky-950/60 hover:bg-sky-900 border border-sky-700/60 text-sky-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <Plus size={14} /> 2.0 mL
                </button>
              </div>
            </div>

            {/* Status Total Reagen */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Netto Reagen:</span>
                <span className="font-bold text-white">
                  {netReagentAdded < 0 
                    ? `${Math.abs(netReagentAdded).toFixed(1)} mL HCl` 
                    : netReagentAdded > 0 
                    ? `${netReagentAdded.toFixed(1)} mL NaOH` 
                    : 'Netral (0.0 mL)'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Uji Tetes:</span>
                <span className="font-bold text-slate-300">{history.length - 1} kali</span>
              </div>
            </div>

            {/* Spektrum Warna Indikator Universal */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-2">
              <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider">
                Spektrum Indikator Universal:
              </span>
              <div className="h-3.5 rounded-md w-full bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-600 shadow-inner" />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>pH 1 (Merah)</span>
                <span>pH 7 (Hijau)</span>
                <span>pH 14 (Ungu)</span>
              </div>
            </div>
          </div>

          {/* AREA KOMPARASI DUA BEAKER & KURVA GRAFIK (KANAN) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Dua Beaker Berdampingan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
              
              {/* GELAS A: AIR MURNI */}
              <div className="flex flex-col items-center bg-slate-950/60 p-5 rounded-xl border border-slate-800 relative">
                <div className="w-full flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert size={15} /> Gelas A: Air Murni
                  </span>
                  <div className="bg-black/90 px-3 py-1 rounded-lg border border-rose-500/50 text-rose-400 font-mono text-base font-black shadow-inner">
                    pH {currentWaterPH.toFixed(2)}
                  </div>
                </div>

                {/* Beaker Kaca (Air) */}
                <div className="w-44 h-52 border-x-2 border-b-2 border-slate-500 rounded-b-xl relative overflow-hidden flex flex-col justify-end bg-slate-950/40 shadow-xl">
                  {/* Cairan dengan Warna Indikator */}
                  <div 
                    className="w-full h-40 transition-colors duration-500 relative"
                    style={{ backgroundColor: getUniversalIndicatorColor(currentWaterPH) }}
                  >
                    <div className="w-full h-1.5 bg-white/25 border-b border-white/10" />
                  </div>

                  {/* pH Probe Electrode (Tercelup) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-44 bg-slate-700 border-x border-slate-500 flex flex-col items-center justify-end shadow-md">
                    <div className="w-2.5 h-6 bg-sky-400/90 rounded-b-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  </div>

                  {/* Skala Ukur Beaker */}
                  <div className="absolute left-2 top-16 text-[9px] font-mono text-slate-300 font-bold drop-shadow">100 mL</div>
                  <line className="absolute left-0 top-20 w-3 h-0.5 bg-slate-400" />
                  <div className="absolute left-2 top-28 text-[9px] font-mono text-slate-300 font-bold drop-shadow">50 mL</div>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-xs text-slate-400">
                    Pergeseran ΔpH: <strong className="text-rose-400 font-mono">{Math.abs(currentWaterPH - 7.0).toFixed(2)}</strong>
                  </span>
                  <p className="text-[11px] text-rose-400/90 mt-0.5 font-medium">
                    {Math.abs(currentWaterPH - 7.0) > 0.5 ? '⚠️ pH berubah drastis tanpa ketahanan!' : 'Kondisi netral awal'}
                  </p>
                </div>
              </div>

              {/* GELAS B: LARUTAN PENYANGGA */}
              <div className="flex flex-col items-center bg-slate-950/60 p-5 rounded-xl border border-slate-800 relative">
                <div className="w-full flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={15} /> Gelas B: Penyangga Asetat
                  </span>
                  <div className="bg-black/90 px-3 py-1 rounded-lg border border-sky-500/50 text-sky-400 font-mono text-base font-black shadow-inner">
                    pH {currentBufferPH.toFixed(2)}
                  </div>
                </div>

                {/* Beaker Kaca (Buffer) */}
                <div className="w-44 h-52 border-x-2 border-b-2 border-slate-500 rounded-b-xl relative overflow-hidden flex flex-col justify-end bg-slate-950/40 shadow-xl">
                  {/* Cairan dengan Warna Indikator */}
                  <div 
                    className="w-full h-40 transition-colors duration-500 relative"
                    style={{ backgroundColor: getUniversalIndicatorColor(currentBufferPH) }}
                  >
                    <div className="w-full h-1.5 bg-white/25 border-b border-white/10" />
                  </div>

                  {/* pH Probe Electrode (Tercelup) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-44 bg-slate-700 border-x border-slate-500 flex flex-col items-center justify-end shadow-md">
                    <div className="w-2.5 h-6 bg-sky-400/90 rounded-b-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  </div>

                  {/* Skala Ukur Beaker */}
                  <div className="absolute left-2 top-16 text-[9px] font-mono text-slate-300 font-bold drop-shadow">100 mL</div>
                  <div className="absolute left-2 top-28 text-[9px] font-mono text-slate-300 font-bold drop-shadow">50 mL</div>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-xs text-slate-400">
                    Pergeseran ΔpH: <strong className="text-sky-400 font-mono">{Math.abs(currentBufferPH - 4.76).toFixed(2)}</strong>
                  </span>
                  <p className="text-[11px] text-emerald-400/90 mt-0.5 font-medium">
                    🛡️ Sangat stabil mempertahankan pH!
                  </p>
                </div>
              </div>

            </div>

            {/* Kurva Grafik Respons Perubahan pH */}
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur">
              <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-400" /> Kurva Komparasi Respons pH Terhadap Penambahan Reagen
                </span>
                <div className="flex gap-4 text-xs font-bold">
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block border border-rose-300" /> Air Murni (Garis Putus)
                  </span>
                  <span className="text-sky-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block border border-sky-200" /> Penyangga Asetat (Garis Solid)
                  </span>
                </div>
              </div>

              <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
                <canvas
                  ref={graphCanvasRef}
                  width={700}
                  height={220}
                  className="w-full h-auto block"
                />
              </div>
            </div>

            {/* Ringkasan Konsep Pembelajaran */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Mekanisme Kimiawi Larutan Penyangga:</strong>
                Hanya dengan menambahkan <MathFormula formula="0.5\text{ mL}" /> asam kuat (<MathFormula formula="\text{HCl}" />), <MathFormula formula="\text{pH}" /> air murni langsung anjlok bebas dari <MathFormula formula="7.0" /> ke kisaran <MathFormula formula="3.3" /> (warna indikator seketika berubah dari hijau ke merah). Sebaliknya, pada larutan penyangga asetat, basa konjugasi (<MathFormula formula="\text{CH}_3\text{COO}^-" />) bertindak sebagai penyerap ion <MathFormula formula="\text{H}^+" />, dan asam asetat (<MathFormula formula="\text{CH}_3\text{COOH}" />) menyerap ion <MathFormula formula="\text{OH}^-" /> saat ditetesi basa, sehingga <MathFormula formula="\text{pH}" /> tetap stabil di kisaran <MathFormula formula="\approx 4.76" />.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
