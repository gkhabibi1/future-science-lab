"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Dna, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Table2, 
  Info, 
  Sparkles, 
  ArrowLeft, 
  Grid3X3, 
  Layers 
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

type CrossMode = 'monohybrid' | 'dihybrid';

interface PhenotypeData {
  id: string;
  name: string;
  genotypePattern: string;
  ratioFraction: number; // e.g. 9/16 or 3/4
  ratioLabel: string;
  colorClass: string;
  renderSeed: () => React.ReactNode;
}

export default function MendelSimulation() {
  const [mode, setMode] = useState<CrossMode>('dihybrid');
  const [sampleSize, setSampleSize] = useState<number>(160); // Jumlah biji yang dipanen (10 - 2.000)
  const [observedCounts, setObservedCounts] = useState<number[]>([]);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'petri' | 'punnett'>('petri');

  // Definisi Fenotipe Monohibrid (Yy x Yy)
  const monoPhenotypes: PhenotypeData[] = [
    {
      id: 'yellow',
      name: 'Biji Kuning',
      genotypePattern: 'Y_',
      ratioFraction: 3 / 4,
      ratioLabel: '3/4 (75%)',
      colorClass: 'bg-amber-400 border-amber-500 text-amber-950',
      renderSeed: () => (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-2 border-amber-600 shadow-md flex items-center justify-center font-bold text-xs text-amber-950">
          Y
        </div>
      ),
    },
    {
      id: 'green',
      name: 'Biji Hijau',
      genotypePattern: 'yy',
      ratioFraction: 1 / 4,
      ratioLabel: '1/4 (25%)',
      colorClass: 'bg-emerald-400 border-emerald-500 text-emerald-950',
      renderSeed: () => (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-300 via-green-500 to-emerald-600 border-2 border-emerald-700 shadow-md flex items-center justify-center font-bold text-xs text-emerald-950">
          y
        </div>
      ),
    },
  ];

  // Definisi Fenotipe Dihibrid (RrYy x RrYy)
  const diPhenotypes: PhenotypeData[] = [
    {
      id: 'round-yellow',
      name: 'Bulat Kuning',
      genotypePattern: 'R_Y_',
      ratioFraction: 9 / 16,
      ratioLabel: '9/16 (56.25%)',
      colorClass: 'bg-amber-400 border-amber-500 text-amber-950',
      renderSeed: () => (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-2 border-amber-600 shadow-md flex items-center justify-center font-black text-[10px] text-amber-900" title="Bulat Kuning">
          RY
        </div>
      ),
    },
    {
      id: 'round-green',
      name: 'Bulat Hijau',
      genotypePattern: 'R_yy',
      ratioFraction: 3 / 16,
      ratioLabel: '3/16 (18.75%)',
      colorClass: 'bg-emerald-400 border-emerald-500 text-emerald-950',
      renderSeed: () => (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-300 via-green-500 to-emerald-600 border-2 border-emerald-700 shadow-md flex items-center justify-center font-black text-[10px] text-emerald-950" title="Bulat Hijau">
          Ry
        </div>
      ),
    },
    {
      id: 'wrinkled-yellow',
      name: 'Keriput Kuning',
      genotypePattern: 'rrY_',
      ratioFraction: 3 / 16,
      ratioLabel: '3/16 (18.75%)',
      colorClass: 'bg-yellow-300 border-yellow-500 text-yellow-950',
      renderSeed: () => (
        <div 
          className="w-8 h-8 bg-amber-400 border-2 border-amber-700 shadow-md flex items-center justify-center font-black text-[9px] text-amber-950"
          style={{ clipPath: 'polygon(50% 0%, 80% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 20% 20%)' }}
          title="Keriput Kuning"
        >
          rY
        </div>
      ),
    },
    {
      id: 'wrinkled-green',
      name: 'Keriput Hijau',
      genotypePattern: 'rryy',
      ratioFraction: 1 / 16,
      ratioLabel: '1/16 (6.25%)',
      colorClass: 'bg-emerald-600 border-emerald-700 text-emerald-100',
      renderSeed: () => (
        <div 
          className="w-8 h-8 bg-emerald-600 border-2 border-emerald-800 shadow-md flex items-center justify-center font-black text-[9px] text-emerald-100"
          style={{ clipPath: 'polygon(50% 0%, 80% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 20% 20%)' }}
          title="Keriput Hijau"
        >
          ry
        </div>
      ),
    },
  ];

  const currentPhenotypes = mode === 'monohybrid' ? monoPhenotypes : diPhenotypes;

  // --- GENERATOR PERSILANGAN MONTE CARLO ---
  const runRandomCross = () => {
    const counts = new Array(currentPhenotypes.length).fill(0);

    for (let i = 0; i < sampleSize; i++) {
      const rand = Math.random();
      let cumulative = 0;

      for (let j = 0; j < currentPhenotypes.length; j++) {
        cumulative += currentPhenotypes[j].ratioFraction;
        if (rand < cumulative) {
          counts[j]++;
          break;
        }
      }
    }

    setObservedCounts(counts);
    setIsGenerated(true);
  };

  // --- KALKULASI STATISTIKA CHI-SQUARE ---
  const expectedCounts = useMemo(() => {
    return currentPhenotypes.map((p) => p.ratioFraction * sampleSize);
  }, [currentPhenotypes, sampleSize]);

  let chiSquareSum = 0;
  if (isGenerated && observedCounts.length === currentPhenotypes.length) {
    for (let i = 0; i < currentPhenotypes.length; i++) {
      const o = observedCounts[i];
      const e = expectedCounts[i];
      chiSquareSum += Math.pow(o - e, 2) / e;
    }
  }

  // Derajat bebas & nilai kritis Chi-Square (alpha = 0.05)
  const df = currentPhenotypes.length - 1;
  const criticalValue = mode === 'monohybrid' ? 3.841 : 7.815;
  const isAccepted = chiSquareSum <= criticalValue;

  const resetExperiment = () => {
    setIsGenerated(false);
    setObservedCounts([]);
  };

  // Data Papan Catur Punnett Square
  const punnettGametes = mode === 'monohybrid' 
    ? ['Y', 'y']
    : ['RY', 'Ry', 'rY', 'ry'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* BREADCRUMB & HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span>/</span>
              <span className="text-emerald-400">Biologi SMA</span>
              <span>/</span>
              <span className="text-slate-200">Persilangan Mendel & Chi-Square</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-400">
              Simulasi Persilangan Mendel & Uji Chi-Square (χ²)
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Eksperimen genetika digital membuktikan Hukum Segregasi Bebas (Hukum I Mendel, 3:1) dan Hukum Asortasi Bebas (Hukum II Mendel, 9:3:3:1) menggunakan generator stokastik Monte Carlo dan uji Goodness-of-Fit χ².
            </p>
          </div>

          {/* Selector Monohibrid vs Dihibrid */}
          <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-bold shrink-0 shadow-lg">
            <button
              onClick={() => { setMode('monohybrid'); resetExperiment(); }}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'monohybrid' 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monohibrid (3 : 1)
            </button>
            <button
              onClick={() => { setMode('dihybrid'); resetExperiment(); }}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                mode === 'dihybrid' 
                  ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dihibrid (9 : 3 : 3 : 1)
            </button>
          </div>
        </div>

        {/* BANNER RUMUS CHI-SQUARE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Statistik Uji Goodness-of-Fit Pearson (Chi-Square)
              </span>
              <div className="text-sm md:text-base font-serif text-slate-200">
                <MathFormula formula="\chi^2 = \sum_{i=1}^{k} \frac{(O_i - E_i)^2}{E_i}, \quad df = k - 1" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Kaidah Uji Hipotesis (Taraf Signifikansi α = 0.05)
              </span>
              <div className="text-sm md:text-base font-serif text-slate-200">
                <MathFormula formula="H_0 \text{ diterima jika } \chi^2_{\text{hitung}} \le \chi^2_{\text{tabel}(\alpha, df)}" />
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
                  <Dna size={16} className="text-emerald-400" /> Konfigurasi Persilangan F₁
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Pisum sativum</span>
              </h3>

              {/* Skema Parental F1 */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Induk Persilangan (Parental F₁ × F₁)
                </span>
                <div className="font-mono font-black text-amber-300 text-base">
                  {mode === 'monohybrid' ? 'Yy (Kuning) × Yy (Kuning)' : 'RrYy × RrYy'}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {mode === 'monohybrid' 
                    ? '1 Karakter: Warna kotiledon biji ercis (Kuning dominan Y over Hijau resesif y).'
                    : '2 Karakter: Bentuk biji (Bulat R / Keriput r) & Warna biji (Kuning Y / Hijau y).'}
                </p>
              </div>

              {/* Slider Populasi Sampel Biji (10 - 2000) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Ukuran Sampel Benih Panen (N):</span>
                  <span className="text-emerald-400 font-mono font-bold bg-emerald-400/10 px-2.5 py-0.5 rounded border border-emerald-400/20">
                    {sampleSize} biji
                  </span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="1600"
                  step="16"
                  value={sampleSize}
                  onChange={(e) => { setSampleSize(Number(e.target.value)); resetExperiment(); }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>16 biji (Mikro / Fluktuasi)</span>
                  <span>1.600 biji (Makro / Presisi)</span>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={runRandomCross}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <Play size={16} fill="currentColor" /> Hasilkan Keturunan F₂ (Monte Carlo)
                </button>

                <button
                  onClick={resetExperiment}
                  className="w-full py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <RotateCcw size={14} /> Bersihkan Cawan Panen
                </button>
              </div>

              {/* Kaidah Keputusan & Kritis Chi-Square */}
              <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                  Nilai Kritis Tabel χ² (α = 0.05)
                </span>
                <div className="flex justify-between items-center text-[11px] text-slate-300">
                  <span>Derajat Bebas (df = k - 1):</span>
                  <span className="font-mono font-bold text-white">{df}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-300">
                  <span>Nilai Kritis (χ²_tabel):</span>
                  <span className="font-mono font-bold text-amber-300">{criticalValue}</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  Jika χ² hitung ≤ {criticalValue}, maka deviasi dianggap semata-mata galat acak (Hukum Mendel terpenuhi).
                </p>
              </div>

              {/* Preset Ukuran Sampel */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block">Uji Ukuran Sampel (Law of Large Numbers):</span>
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                  <button
                    onClick={() => { setSampleSize(16); resetExperiment(); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-rose-300 border border-slate-700"
                  >
                    16 (Mikro)
                  </button>
                  <button
                    onClick={() => { setSampleSize(160); resetExperiment(); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-amber-300 border border-slate-700"
                  >
                    160 (Sedang)
                  </button>
                  <button
                    onClick={() => { setSampleSize(1600); resetExperiment(); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-emerald-300 border border-slate-700"
                  >
                    1600 (Makro)
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* AREA VISUALISASI CAWAN PETRI, PAPAN PUNNETT & TABEL CHI-SQUARE (COL 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Visualisasi Cawan Petri & Papan Punnett Tabs */}
            <div className="bg-[#070d18] p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('petri')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'petri'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Sparkles size={14} className="text-amber-400" /> Cawan Petri Panen F₂
                  </button>
                  <button
                    onClick={() => setActiveTab('punnett')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'punnett'
                        ? 'bg-teal-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <Grid3X3 size={14} className="text-teal-300" /> Papan Punnett Square
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <span>Total Biji Terpanen:</span>
                  <strong className="text-emerald-400 text-sm font-black bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                    {isGenerated ? sampleSize : 0} butir
                  </strong>
                </div>
              </div>

              {/* TAB 1: CAWAN PETRI DIGITAL */}
              {activeTab === 'petri' && (
                <div>
                  {/* Kartu Komparasi Fenotipe */}
                  <div className={`grid gap-4 ${mode === 'monohybrid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
                    {currentPhenotypes.map((pt, idx) => {
                      const count = isGenerated ? observedCounts[idx] : 0;
                      const exp = (pt.ratioFraction * sampleSize).toFixed(1);
                      const percent = isGenerated ? ((count / sampleSize) * 100).toFixed(1) : '0.0';

                      return (
                        <div 
                          key={pt.id}
                          className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-between text-center relative overflow-hidden hover:border-slate-700 transition-all shadow-md"
                        >
                          <div className="mb-2.5">
                            {pt.renderSeed()}
                          </div>
                          <div className="text-sm font-bold text-white mb-0.5">{pt.name}</div>
                          <div className="text-[11px] font-mono text-teal-400 mb-2">Gen: {pt.genotypePattern}</div>

                          <div className="w-full bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Observasi (O)</div>
                            <div className="text-lg font-black font-mono text-amber-300">
                              {isGenerated ? count : '-'} <span className="text-xs text-slate-400 font-normal">({percent}%)</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Harapan (E): <strong className="text-slate-300 font-mono">{exp}</strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Visual Cawan Petri Biji Acak (Canvas Mini Dot Simulation) */}
                  {isGenerated && (
                    <div className="mt-5 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400 mb-2 font-mono flex items-center justify-between">
                        <span>Mikro visual cawan petri (sampel benih proporsional):</span>
                        <span className="text-emerald-400">100 representasi visual</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                        {currentPhenotypes.map((pt, idx) => {
                          const count = Math.round((observedCounts[idx] / sampleSize) * 100);
                          return Array.from({ length: count }).map((_, i) => (
                            <span 
                              key={`${pt.id}-${i}`} 
                              className={`w-3.5 h-3.5 rounded-full inline-block ${
                                pt.id === 'yellow' || pt.id === 'round-yellow' ? 'bg-amber-400 border border-amber-600' :
                                pt.id === 'green' || pt.id === 'round-green' ? 'bg-emerald-500 border border-emerald-700' :
                                pt.id === 'wrinkled-yellow' ? 'bg-yellow-400 border border-amber-600 rounded-sm' :
                                'bg-emerald-700 border border-emerald-900 rounded-sm'
                              }`}
                              title={pt.name}
                            />
                          ));
                        })}
                      </div>
                    </div>
                  )}

                  {!isGenerated && (
                    <div className="mt-6 py-10 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs">
                      <Dna size={32} className="mb-2 opacity-40 animate-pulse text-emerald-400" />
                      <span>Klik tombol <strong>"Hasilkan Keturunan F₂"</strong> untuk melakukan penyerbukan acak dan memanen benih.</span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PAPAN CATUR PUNNETT SQUARE */}
              {activeTab === 'punnett' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 mb-2">
                    Papan catur Punnett Square memetakan kombinasi genetik gamet jantan (♂) dan betina (♀) pada pembuahan F₁:
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center border-collapse font-mono">
                      <thead>
                        <tr>
                          <th className="p-2.5 bg-slate-900 text-slate-400 border border-slate-800">♀ \ ♂</th>
                          {punnettGametes.map((g, i) => (
                            <th key={i} className="p-2.5 bg-slate-900 text-emerald-400 font-black border border-slate-800">
                              {g}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {punnettGametes.map((gFem, r) => (
                          <tr key={r}>
                            <td className="p-2.5 bg-slate-900 text-amber-400 font-black border border-slate-800">
                              {gFem}
                            </td>
                            {punnettGametes.map((gMale, c) => {
                              // Gabungkan alel
                              let combo = '';
                              let fenotypeBg = '';
                              if (mode === 'monohybrid') {
                                const letters = [gFem, gMale].sort().reverse();
                                combo = letters.join('');
                                fenotypeBg = combo.includes('Y') ? 'bg-amber-950/40 text-amber-300' : 'bg-emerald-950/40 text-emerald-300';
                              } else {
                                // RrYy
                                const rAlleles = [gFem[0], gMale[0]].sort().reverse().join('');
                                const yAlleles = [gFem[1], gMale[1]].sort().reverse().join('');
                                combo = `${rAlleles}${yAlleles}`;
                                const hasR = combo.includes('R');
                                const hasY = combo.includes('Y');
                                if (hasR && hasY) fenotypeBg = 'bg-amber-950/40 text-amber-300';
                                else if (hasR && !hasY) fenotypeBg = 'bg-emerald-950/40 text-emerald-300';
                                else if (!hasR && hasY) fenotypeBg = 'bg-yellow-950/40 text-yellow-300';
                                else fenotypeBg = 'bg-emerald-950/60 text-emerald-200';
                              }

                              return (
                                <td key={c} className={`p-2.5 border border-slate-800 font-bold ${fenotypeBg}`}>
                                  {combo}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span className="font-semibold text-slate-300">Legenda Fenotipe:</span>
                    {currentPhenotypes.map((pt) => (
                      <span key={pt.id} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                        {pt.name} ({pt.ratioLabel})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TABEL PERHITUNGAN UJI CHI-SQUARE */}
            {isGenerated && (
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Table2 size={16} className="text-teal-400" /> Lembar Kerja Statistik Uji Goodness-of-Fit (χ²)
                  </h4>
                  <span className="text-xs font-mono text-slate-400">Taraf Signifikansi α = 0.05</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Kategori Fenotipe</th>
                        <th className="p-2.5 text-center">Rasio Teoritis</th>
                        <th className="p-2.5 text-center text-amber-300">Observasi (O)</th>
                        <th className="p-2.5 text-center text-sky-300">Harapan (E)</th>
                        <th className="p-2.5 text-center">Deviasi (O - E)</th>
                        <th className="p-2.5 text-center">(O - E)²</th>
                        <th className="p-2.5 text-right text-emerald-400">(O - E)² / E</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {currentPhenotypes.map((pt, idx) => {
                        const o = observedCounts[idx];
                        const e = expectedCounts[idx];
                        const dev = o - e;
                        const devSq = Math.pow(dev, 2);
                        const chiComponent = devSq / e;

                        return (
                          <tr key={pt.id} className="hover:bg-slate-800/50">
                            <td className="p-2.5 font-sans font-bold text-white">{pt.name} ({pt.genotypePattern})</td>
                            <td className="p-2.5 text-center text-slate-400">{pt.ratioLabel}</td>
                            <td className="p-2.5 text-center font-bold text-amber-300">{o}</td>
                            <td className="p-2.5 text-center font-bold text-sky-300">{e.toFixed(2)}</td>
                            <td className={`p-2.5 text-center font-bold ${dev >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {dev > 0 ? `+${dev.toFixed(2)}` : dev.toFixed(2)}
                            </td>
                            <td className="p-2.5 text-center text-slate-300">{devSq.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-black text-emerald-400">{chiComponent.toFixed(4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700">
                      <tr>
                        <td className="p-2.5 font-sans text-white uppercase">Total / Nilai Akhir</td>
                        <td className="p-2.5 text-center">100%</td>
                        <td className="p-2.5 text-center text-amber-300">{sampleSize}</td>
                        <td className="p-2.5 text-center text-sky-300">{sampleSize.toFixed(2)}</td>
                        <td className="p-2.5 text-center">0.00</td>
                        <td className="p-2.5 text-center">-</td>
                        <td className="p-2.5 text-right text-base text-emerald-400 font-black">
                          χ² = {chiSquareSum.toFixed(4)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Banner Kesimpulan Hipotesis (Badge Verdict) */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isAccepted
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-500 text-rose-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {isAccepted ? (
                      <CheckCircle2 size={26} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle size={26} className="text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {isAccepted
                          ? 'HIPOTESIS DITERIMA (H₀ Diterima): Persilangan Memenuhi Hukum Mendel'
                          : 'HIPOTESIS DITOLAK (H₀ Ditolak): Terjadi Penyimpangan Signifikan'}
                      </div>
                      <p className="text-xs opacity-90 mt-0.5">
                        {isAccepted
                          ? `Nilai χ² hitung (${chiSquareSum.toFixed(3)}) ≤ Nilai Kritis (${criticalValue}). Deviasi data semata-mata dipengaruhi fluktuasi acak binomial biasa.`
                          : `Nilai χ² hitung (${chiSquareSum.toFixed(3)}) > Nilai Kritis (${criticalValue}). Kemungkinan terdapat pautan gen (gene linkage), gen letal, atau ukuran sampel terlalu kecil.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Poin Edukasi Hukum Bilangan Besar */}
            <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={22} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <strong className="text-amber-300 text-sm block">The Law of Large Numbers (Hukum Bilangan Besar):</strong>
                <p>
                  Cobalah atur ukuran sampel benih ke angka kecil (misalnya 16 biji). Anda akan sering mendapati nilai χ² melonjak tinggi dan status berubah menjadi merah (Ditolak) karena fluktuasi acak yang besar. Namun, jika Anda meningkatkan sampel ke 1.600 biji, rasio observasi akan mendekati presisi rasio emas Mendel 9:3:3:1 atau 3:1 dengan nilai χ² yang sangat rendah. Inilah alasan mengapa Gregor Mendel menanam hingga puluhan ribu pohon ercis selama bertahun-tahun demi membuktikan kebenaran teorinya!
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
