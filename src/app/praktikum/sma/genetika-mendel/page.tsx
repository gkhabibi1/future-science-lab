"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Dna, Calculator, RefreshCw, CheckCircle2, XCircle, ArrowLeft, Info, BarChart2 } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function GenetikaSimulation() {
  // --- STATE ---
  const [mode, setMode] = useState<'mono' | 'di'>('di');
  const [population, setPopulation] = useState(200);
  
  // Hasil Observasi (O)
  const [observed, setObserved] = useState<number[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  // --- SETUP DATA TEORITIS ---
  const monoPhenotypes = ['Kuning Dominan (K_)', 'Hijau Resesif (kk)'];
  const monoRatios = [3/4, 1/4]; // Rasio 3 : 1
  const monoColors = ['#eab308', '#22c55e'];
  
  const diPhenotypes = [
    'Bulat Kuning (B_K_)', 
    'Bulat Hijau (B_kk)', 
    'Keriput Kuning (bbK_)', 
    'Keriput Hijau (bbkk)'
  ];
  const diRatios = [9/16, 3/16, 3/16, 1/16]; // Rasio 9 : 3 : 3 : 1
  const diColors = ['#eab308', '#22c55e', '#f97316', '#06b6d4'];

  const activePhenotypes = mode === 'mono' ? monoPhenotypes : diPhenotypes;
  const activeRatios = mode === 'mono' ? monoRatios : diRatios;
  const activeColors = mode === 'mono' ? monoColors : diColors;

  // --- GENERATOR PERSILANGAN ACAK ---
  const generateCross = () => {
    const counts = new Array(activePhenotypes.length).fill(0);
    
    for (let i = 0; i < population; i++) {
      const rand = Math.random();
      let cumulativeProbability = 0;
      
      for (let j = 0; j < activeRatios.length; j++) {
        cumulativeProbability += activeRatios[j];
        if (rand < cumulativeProbability) {
          counts[j]++;
          break;
        }
      }
    }
    
    setObserved(counts);
    setHasGenerated(true);
  };

  // --- UJI STATISTIK CHI-SQUARE ---
  let chiSquare = 0;
  const expected = activeRatios.map(r => r * population); // Nilai Harapan (E)
  
  if (hasGenerated && observed.length > 0) {
    for (let i = 0; i < observed.length; i++) {
      const O = observed[i];
      const E = expected[i];
      chiSquare += Math.pow(O - E, 2) / E;
    }
  }

  // Nilai kritis tabel Chi-Square pada tingkat signifikansi alpha = 5% (0.05)
  // df = n - 1 (df=1 -> 3.841, df=3 -> 7.815)
  const criticalValue = mode === 'mono' ? 3.841 : 7.815; 
  const isAccepted = chiSquare <= criticalValue;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-emerald-500 selection:text-white">
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
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Biologi Modern • Genetika Mendel
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Dna className="text-emerald-400" size={24} />
              Simulasi Hukum Mendel &amp; Uji Chi-Square (\(\chi^2\))
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Eksperimen probabilitas pewarisan sifat tanaman ercis (Gregor Mendel): Hukum Segregasi Bebas (Hukum I) dan Asortasi Bebas (Hukum II).
            </p>
          </div>

          <button
            onClick={generateCross}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <RefreshCw size={15} />
            <span>Silangkan Keturunan (F2)</span>
          </button>
        </header>

        {/* Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Uji Goodness-of-Fit:</span>
            <MathFormula formula="\chi^2 = \sum \frac{(O - E)^2}{E}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Rasio Monohibrid (F2):</span>
            <MathFormula formula="3 : 1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Rasio Dihibrid (F2):</span>
            <MathFormula formula="9 : 3 : 3 : 1" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-xl h-fit space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Dna size={16} className="text-emerald-400"/> Parameter Persilangan
              </h2>
            </div>
            
            <div className="space-y-5">
              {/* Mode Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Tipe Persilangan</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button 
                    onClick={() => { setMode('mono'); setHasGenerated(false); }} 
                    className={`py-2 rounded-lg font-bold text-xs transition ${
                      mode === 'mono' 
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monohibrid
                  </button>
                  <button 
                    onClick={() => { setMode('di'); setHasGenerated(false); }} 
                    className={`py-2 rounded-lg font-bold text-xs transition ${
                      mode === 'di' 
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dihibrid
                  </button>
                </div>
              </div>

              {/* Ukuran Sampel Populasi */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-300">Ukuran Populasi (N)</span>
                  <span className="text-emerald-400 font-black font-mono">{population} Tanaman</span>
                </div>
                <input 
                  type="range" min="20" max="1000" step="20" 
                  value={population} 
                  onChange={(e) => { setPopulation(Number(e.target.value)); setHasGenerated(false); }} 
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                  <span>20 (Deviasi Tinggi)</span>
                  <span>1000 (Presisi)</span>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={generateCross} 
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs flex justify-center items-center gap-2 transition shadow-lg shadow-emerald-500/20 active:scale-98"
              >
                <RefreshCw size={15} /> 
                Hasilkan Sampel Acak (F2)
              </button>

              {/* Genotipe Induk */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Genotipe Induk (<MathFormula formula="F_1 \times F_1" />)
                </span>
                <div className="text-center font-mono text-lg font-bold text-emerald-400 tracking-widest bg-slate-900/90 py-2 rounded-lg border border-slate-800">
                  {mode === 'mono' ? 'Kk × Kk' : 'BbKk × BbKk'}
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-1.5">
                  {mode === 'mono' ? 'Heterozigot 1 Sifat Beda' : 'Heterozigot 2 Sifat Beda'}
                </p>
              </div>
            </div>
          </div>

          {/* AREA HASIL & STATISTIK KANAN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Distribusi Batang Proporsional */}
            {hasGenerated && (
              <div className="bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <BarChart2 size={14} className="text-emerald-400" /> Proporsi Fenotipe Sampel Teramati
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">Total: {population}</span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-950 border border-slate-800">
                  {activePhenotypes.map((p, idx) => {
                    const count = observed[idx] || 0;
                    const pct = (count / population) * 100;
                    return (
                      <div 
                        key={idx} 
                        style={{ width: `${pct}%`, backgroundColor: activeColors[idx] }}
                        className="h-full transition-all duration-500 relative group"
                        title={`${p}: ${count} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {activePhenotypes.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColors[idx] }} />
                      <span className="text-slate-300">{p}:</span>
                      <span className="font-mono font-bold text-white">{observed[idx] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabel Punnett / Perbandingan Frekuensi */}
            <div className="bg-slate-900/80 backdrop-blur p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Calculator size={16} className="text-emerald-400"/> Tabel Distribusi Frekuensi (Teoritis vs Observasi)
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/70 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Fenotipe Tanaman</th>
                      <th className="px-4 py-3">Rasio Teori</th>
                      <th className="px-4 py-3 text-amber-400">Harapan (E)</th>
                      <th className="px-4 py-3 text-sky-400">Observasi (O)</th>
                      <th className="px-4 py-3 text-emerald-400">Deviasi (O - E)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {activePhenotypes.map((phenotype, idx) => {
                      const obs = hasGenerated ? observed[idx] : 0;
                      const exp = expected[idx];
                      const dev = obs - exp;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-sans font-medium text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColors[idx] }} />
                            {phenotype}
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-400">
                            {mode === 'mono' ? (idx === 0 ? '3/4' : '1/4') : (idx === 0 ? '9/16' : idx === 3 ? '1/16' : '3/16')}
                          </td>
                          <td className="px-4 py-3 text-amber-300 font-bold">{exp.toFixed(1)}</td>
                          <td className="px-4 py-3 text-sky-300 font-bold">
                            {hasGenerated ? obs : '-'}
                          </td>
                          <td className={`px-4 py-3 font-bold ${
                            !hasGenerated ? 'text-slate-500' : dev >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {hasGenerated ? (dev >= 0 ? `+${dev.toFixed(1)}` : dev.toFixed(1)) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dashboard Telemetri Chi-Square (3-Card) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Nilai Chi-Square */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calculator size={13} className="text-cyan-400" /> Nilai Chi-Square (<MathFormula formula="\chi^2" />)
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {hasGenerated ? chiSquare.toFixed(3) : '---'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Derajat kebebasan (df) = {activePhenotypes.length - 1}
                </div>
              </div>

              {/* Card 2: Batas Kritis */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <BarChart2 size={13} className="text-purple-400" /> Nilai Kritis (<MathFormula formula="\chi^2_{0.05}" />)
                </div>
                <div className="text-2xl font-black font-mono text-purple-400">
                  {criticalValue.toFixed(3)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Taraf signifikansi <MathFormula formula="\alpha = 5\%" />
                </div>
              </div>

              {/* Card 3: Kesimpulan Hipotesis */}
              <div className={`backdrop-blur border p-4 rounded-2xl shadow-md space-y-1 transition ${
                !hasGenerated 
                  ? 'bg-slate-900/80 border-slate-800 text-slate-400' 
                  : isAccepted 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}>
                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  {hasGenerated && isAccepted ? (
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  ) : hasGenerated ? (
                    <XCircle size={13} className="text-rose-400" />
                  ) : (
                    <Info size={13} className="text-slate-400" />
                  )}
                  Uji Hipotesis Mendel
                </div>
                <div className="text-base font-black leading-tight pt-1">
                  {!hasGenerated 
                    ? 'Menunggu Sampel' 
                    : isAccepted 
                      ? 'Sesuai Rasio Mendel' 
                      : 'Penyimpangan Semu'}
                </div>
                <div className="text-[10px] opacity-80">
                  {!hasGenerated 
                    ? 'Klik tombol silangkan di kiri' 
                    : isAccepted 
                      ? 'H₀ diterima (deviasi karena faktor kebetulan acak semata)' 
                      : 'H₀ ditolak (deviasi melampaui toleransi statistik)'}
                </div>
              </div>
            </div>

            {/* Kotak Edukasi / Teori Biologi */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex gap-3.5 items-start">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/20 shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Prinsip Hukum Besar Angka (Law of Large Numbers)</h4>
                <p className="leading-relaxed text-slate-400">
                  Dalam persilangan nyata, Anda tidak akan pernah mendapatkan tepat 75 tanaman kuning dan 25 tanaman hijau dari 100 sampel (rasio teoritis 3:1), melainkan angka acak seperti 73:27 atau 78:22.
                </p>
                <p className="leading-relaxed text-slate-400">
                  Uji Chi-Square (<MathFormula formula="\chi^2" />) digunakan ilmuwan genetika untuk memastikan apakah perbedaan antara data observasi dan ekspektasi teoritis masih dalam batas wajar kebetulan statistik, atau terdapat tautan gen (<em>gene linkage</em>) dan letalitas. Semakin besar populasi sampel yang disilangkan, semakin mendekati rasio teoritis Mendel!
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
