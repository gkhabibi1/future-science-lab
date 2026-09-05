"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Waves, 
  ArrowLeft, 
  RotateCcw, 
  Scale, 
  Info, 
  Sparkles,
  Layers,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface MaterialOption {
  name: string;
  density: number; // g/cm³
  color: string;
  borderColor: string;
  textColor: string;
}

interface LiquidOption {
  name: string;
  density: number; // g/cm³
  color: string;
  surfaceColor: string;
}

const MATERIALS: MaterialOption[] = [
  { name: 'Gabus Balsa', density: 0.20, color: '#fef08a', borderColor: '#ca8a04', textColor: '#854d0e' },
  { name: 'Kayu Pinus', density: 0.60, color: '#d97706', borderColor: '#b45309', textColor: '#ffffff' },
  { name: 'Es Batu', density: 0.92, color: '#e0f2fe', borderColor: '#38bdf8', textColor: '#0369a1' },
  { name: 'Plastik Karet', density: 0.95, color: '#10b981', borderColor: '#059669', textColor: '#ffffff' },
  { name: 'Batu Granit', density: 2.50, color: '#64748b', borderColor: '#475569', textColor: '#ffffff' },
  { name: 'Besi / Baja', density: 7.85, color: '#94a3b8', borderColor: '#64748b', textColor: '#0f172a' },
  { name: 'Emas Murni', density: 19.30, color: '#fbbf24', borderColor: '#d97706', textColor: '#78350f' }
];

const LIQUIDS: LiquidOption[] = [
  { name: 'Minyak Goreng', density: 0.88, color: 'rgba(234, 179, 8, 0.45)', surfaceColor: '#facc15' },
  { name: 'Air Murni', density: 1.00, color: 'rgba(56, 189, 248, 0.45)', surfaceColor: '#38bdf8' },
  { name: 'Air Laut Garam', density: 1.08, color: 'rgba(20, 184, 166, 0.50)', surfaceColor: '#2dd4bf' },
  { name: 'Madu Kental', density: 1.42, color: 'rgba(217, 119, 6, 0.60)', surfaceColor: '#fb923c' },
  { name: 'Air Raksa (Merkuri)', density: 13.60, color: 'rgba(148, 163, 184, 0.85)', surfaceColor: '#cbd5e1' }
];

export default function MengapungTenggelamPage() {
  const [material, setMaterial] = useState<MaterialOption>(MATERIALS[1]); // Kayu Pinus
  const [liquid, setLiquid] = useState<LiquidOption>(LIQUIDS[1]); // Air Murni
  const [volumeCm3, setVolumeCm3] = useState<number>(150); // cm³
  const [showVectors, setShowVectors] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- KALKULASI HUKUM ARCHIMEDES ---
  // Massa benda: m = rho_b * V (gram)
  const massGrams = material.density * volumeCm3;
  // Berat sebenarnya di udara: W = m * g (Newton, g = 9.8 m/s²)
  const weightTrueN = Number(((massGrams / 1000) * 9.80).toFixed(3));

  // Rasio massa jenis untuk menentukan kedalaman apung
  const densityRatio = material.density / liquid.density;

  // Status Archimedes
  let state: 'Mengapung' | 'Melayang' | 'Tenggelam' = 'Mengapung';
  let submergedFraction = 0;

  if (Math.abs(material.density - liquid.density) <= 0.05) {
    state = 'Melayang';
    submergedFraction = 1.0;
  } else if (material.density < liquid.density) {
    state = 'Mengapung';
    submergedFraction = densityRatio;
  } else {
    state = 'Tenggelam';
    submergedFraction = 1.0;
  }

  // Volume tercelup dalam cm³
  const submergedVolCm3 = volumeCm3 * submergedFraction;
  // Gaya Apung Archimedes: Fa = rho_f * g * V_celup
  const buoyantForceN = Number((((liquid.density * 1000) * 9.80 * (submergedVolCm3 * 1e-6))).toFixed(3));

  // Berat semu terbaca di neraca pegas: W' = max(0, W - Fa)
  const apparentWeightN = Math.max(0, Number((weightTrueN - buoyantForceN).toFixed(3)));

  const resetParams = () => {
    setMaterial(MATERIALS[1]);
    setLiquid(LIQUIDS[1]);
    setVolumeCm3(150);
    setShowVectors(true);
  };

  // --- RENDER CRISP HD RETINA CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Bersihkan layar latar laboratorium
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Garis grid lembut
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // --- 1. BEAKER KACA GELAS UKUR BESAR ---
    const beakerX = w / 2 - 140;
    const beakerY = 60;
    const beakerW = 280;
    const beakerH = 260;
    const baseWaterLevelY = beakerY + 80;

    // Kenaikan volume cairan akibat celupan benda (displaced liquid)
    const deltaWaterRise = (submergedVolCm3 / 250) * 22;
    const currentWaterLevelY = baseWaterLevelY - deltaWaterRise;

    // Latar Belakang Beaker Kaca
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(beakerX, beakerY, beakerW, beakerH, [0, 0, 16, 16]);
    ctx.fill();

    // Isi Cairan Fluida
    ctx.fillStyle = liquid.color;
    ctx.beginPath();
    ctx.roundRect(beakerX + 6, currentWaterLevelY, beakerW - 12, beakerH - (currentWaterLevelY - beakerY) - 6, [0, 0, 12, 12]);
    ctx.fill();

    // Permukaan Meniskus Cairan Fluida
    ctx.strokeStyle = liquid.surfaceColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(beakerX + 6, currentWaterLevelY);
    ctx.lineTo(beakerX + beakerW - 6, currentWaterLevelY);
    ctx.stroke();

    // Skala Ukuran Mililiter di Beaker Kaca
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '9px monospace';
    ctx.lineWidth = 1.2;
    for (let ml = 100; ml <= 800; ml += 100) {
      const markY = beakerY + beakerH - ((ml / 800) * (beakerH - 30));
      ctx.beginPath();
      ctx.moveTo(beakerX + 8, markY);
      ctx.lineTo(beakerX + (ml % 200 === 0 ? 24 : 16), markY);
      ctx.stroke();
      if (ml % 200 === 0) {
        ctx.fillText(`${ml} ml`, beakerX + 28, markY + 3);
      }
    }

    // Border Beaker Kaca Kristal
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(beakerX, beakerY, beakerW, beakerH, [0, 0, 16, 16]);
    ctx.stroke();

    // --- 2. POSISI BENDA TENGGELAM / MELAYANG / MENGAPUNG ---
    // Ukuran balok kubus (px) sebanding dengan volume
    const boxSize = Math.max(45, Math.min(80, Math.cbrt(volumeCm3) * 11));
    const objX = w / 2 - boxSize / 2;

    let objY = 0;
    if (state === 'Mengapung') {
      // Sebagian tercelup, sebagian timbul di atas air
      objY = currentWaterLevelY - (boxSize * (1 - submergedFraction));
    } else if (state === 'Melayang') {
      // Pas di tengah-tengah volume cairan
      objY = currentWaterLevelY + (beakerH - (currentWaterLevelY - beakerY)) / 2 - boxSize / 2;
    } else {
      // Tenggelam menyentuh dasar beaker
      objY = beakerY + beakerH - boxSize - 6;
    }

    // Render Balok Benda Uji
    ctx.fillStyle = material.color;
    ctx.beginPath();
    ctx.roundRect(objX, objY, boxSize, boxSize, 6);
    ctx.fill();
    ctx.strokeStyle = material.borderColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Label di dalam balok
    ctx.fillStyle = material.textColor;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(material.name, w / 2, objY + boxSize / 2 - 2);
    ctx.font = '9px monospace';
    ctx.fillText(`${material.density} g/cm³`, w / 2, objY + boxSize / 2 + 10);
    ctx.textAlign = 'left';

    // --- 3. VEKTOR GAYA (W & Fa) ---
    if (showVectors) {
      const centerX = w / 2;
      const centerY = objY + boxSize / 2;

      // Gaya Berat W (Panah Merah ke Bawah)
      const arrowWLen = Math.min(65, Math.max(20, weightTrueN * 18));
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY + arrowWLen);
      ctx.stroke();
      // Kepala panah ke bawah
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + arrowWLen + 6);
      ctx.lineTo(centerX - 4, centerY + arrowWLen);
      ctx.lineTo(centerX + 4, centerY + arrowWLen);
      ctx.fill();

      ctx.font = 'bold 10px monospace';
      ctx.fillText(`W = ${weightTrueN} N`, centerX + 10, centerY + arrowWLen);

      // Gaya Apung Fa (Panah Hijau / Cyan ke Atas)
      const arrowFaLen = Math.min(65, Math.max(20, buoyantForceN * 18));
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY - arrowFaLen);
      ctx.stroke();
      // Kepala panah ke atas
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - arrowFaLen - 6);
      ctx.lineTo(centerX - 4, centerY - arrowFaLen);
      ctx.lineTo(centerX + 4, centerY - arrowFaLen);
      ctx.fill();

      ctx.fillText(`Fa = ${buoyantForceN} N`, centerX + 10, centerY - arrowFaLen + 4);
    }

    // Neraca Pegas Pengukur di Atas
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, 28);
    ctx.stroke();
    // Kotak dinamometer
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(w / 2 - 20, 28, 40, 24, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`${apparentWeightN}N`, w / 2 - 14, 44);

  }, [material, liquid, volumeCm3, state, submergedFraction, submergedVolCm3, weightTrueN, buoyantForceN, apparentWeightN, showVectors]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-teal-500 selection:text-white">
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
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Mekanika Fluida • SD / MI
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Waves className="text-teal-400" size={24} />
              Simulasi Mengapung, Melayang &amp; Tenggelam
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Uji perbandingan massa jenis zat padat terhadap fluida cair berdasarkan Hukum Archimedes dan neraca berat semu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetParams}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shadow-sm"
              title="Reset Simulasi"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Gaya Apung Archimedes:</span>
            <MathFormula formula="F_A = \rho_{\text{fluida}} \cdot g \cdot V_{\text{celup}}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Berat Semu di Air:</span>
            <MathFormula formula="W' = W - F_A" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Kondisi Apung:</span>
            <MathFormula formula="\rho_b < \rho_f \implies \text{Terapung} \quad | \quad \rho_b > \rho_f \implies \text{Tenggelam}" />
          </div>
        </div>

        {/* 4-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-xl h-fit space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers size={16} className="text-teal-400"/> Pemilihan Bahan
              </h2>
            </div>

            <div className="space-y-5">
              {/* Material Benda Uji */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Benda Padat Uji</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {MATERIALS.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => setMaterial(m)}
                      className={`p-2 rounded-xl text-xs font-medium border text-left flex justify-between items-center transition ${
                        material.name === m.name
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-bold'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.borderColor }} />
                        {m.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{m.density} g/cm³</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cairan Fluida Beaker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Zat Cair Fluida</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {LIQUIDS.map((l) => (
                    <button
                      key={l.name}
                      onClick={() => setLiquid(l)}
                      className={`p-2 rounded-xl text-xs font-medium border text-left flex justify-between items-center transition ${
                        liquid.name === l.name
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.surfaceColor }} />
                        {l.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{l.density} g/cm³</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume Benda (cm³) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Volume Benda (<MathFormula formula="V" />)</span>
                  <span className="text-teal-400 font-mono font-bold">{volumeCm3} cm³</span>
                </div>
                <input 
                  type="range" min="50" max="350" step="25"
                  value={volumeCm3} 
                  onChange={(e) => setVolumeCm3(Number(e.target.value))} 
                  className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
              </div>

              {/* Toggle Vektor Gaya */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300 hover:text-white">
                  <span>Tampilkan Vektor Gaya (\(W\) &amp; \(F_A\))</span>
                  <input 
                    type="checkbox" 
                    checked={showVectors} 
                    onChange={(e) => setShowVectors(e.target.checked)} 
                    className="accent-teal-500 rounded"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* AREA KANVAS STAGE & TELEMETRI KANAN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Kanvas Retina HD */}
            <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={360} 
                className="w-full h-auto bg-[#030712] block rounded-xl border border-slate-800/60 shadow-2xl" 
              />
            </div>

            {/* Dashboard Telemetri 3-Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Gaya Apung */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ArrowUp size={13} className="text-cyan-400" /> Gaya Apung (<MathFormula formula="F_A" />)
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {buoyantForceN} <span className="text-xs font-normal text-slate-400">N</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Volume tercelup: {submergedVolCm3.toFixed(1)} cm³ ({(submergedFraction * 100).toFixed(0)}%)
                </div>
              </div>

              {/* Card 2: Berat Semu di Cairan */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Scale size={13} className="text-amber-400" /> Berat Semu (<MathFormula formula="W'" />)
                </div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {apparentWeightN} <span className="text-xs font-normal text-slate-400">N</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Berat di udara: {weightTrueN} N
                </div>
              </div>

              {/* Card 3: Status Archimedes */}
              <div className={`backdrop-blur border p-4 rounded-2xl shadow-md space-y-1 transition ${
                state === 'Mengapung' 
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                  : state === 'Melayang'
                    ? 'bg-sky-950/30 border-sky-500/40 text-sky-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}>
                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Waves size={13} /> Status Keadaan Benda
                </div>
                <div className="text-xl font-black">
                  {state === 'Mengapung' ? '🌊 Terapung' : state === 'Melayang' ? '⚖️ Melayang Sempurna' : '⚓ Tenggelam di Dasar'}
                </div>
                <div className="text-[10px] opacity-80">
                  {material.density < liquid.density 
                    ? `\u03C1 benda (${material.density}) < \u03C1 zat cair (${liquid.density})`
                    : material.density === liquid.density
                      ? `\u03C1 benda sama dengan \u03C1 zat cair`
                      : `\u03C1 benda (${material.density}) > \u03C1 zat cair (${liquid.density})`
                  }
                </div>
              </div>
            </div>

            {/* Teori Sains Edukasi */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex gap-3.5 items-start">
              <div className="bg-teal-500/10 p-2.5 rounded-xl text-teal-400 border border-teal-500/20 shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Prinsip Archimedes &amp; Kerapatan Relatif</h4>
                <p className="leading-relaxed text-slate-400">
                  Suatu benda yang dicelupkan sebagian atau seluruhnya ke dalam zat cair akan mengalami gaya ke atas (<MathFormula formula="F_A" />) yang besarnya sama dengan berat zat cair yang dipindahkan oleh benda tersebut.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li><strong>Mengapung:</strong> Terjadi jika massa jenis benda lebih kecil dari massa jenis cairan (<MathFormula formula="\rho_b < \rho_f" />). Bagian yang tercelup memenuhi rasio <MathFormula formula="\frac{V_{\text{celup}}}{V_b} = \frac{\rho_b}{\rho_f}" />.</li>
                  <li><strong>Melayang:</strong> Terjadi jika massa jenis benda persis sama dengan massa jenis cairan (<MathFormula formula="\rho_b = \rho_f" />). Benda melayang di kedalaman manapun tanpa menyentuh dasar.</li>
                  <li><strong>Tenggelam:</strong> Terjadi jika massa jenis benda lebih besar dari massa jenis cairan (<MathFormula formula="\rho_b > \rho_f" />). Gaya berat ke bawah mengalahkan gaya apung maksimal sehingga benda turun ke dasar wadah.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
