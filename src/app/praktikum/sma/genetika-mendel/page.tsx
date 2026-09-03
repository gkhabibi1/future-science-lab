"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Dna, Calculator, RefreshCw, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function GenetikaSimulation() {
  // --- STATE ---
  const [mode, setMode] = useState<'mono' | 'di'>('di');
  const [population, setPopulation] = useState(100);
  
  // Hasil Observasi (O)
  const [observed, setObserved] = useState<number[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  // --- SETUP DATA TEORITIS ---
  const monoPhenotypes = ['Kuning (Dominan)', 'Hijau (Resesif)'];
  const monoRatios = [3/4, 1/4]; // Rasio 3 : 1
  
  const diPhenotypes = ['Bulat Kuning (B_K_)', 'Bulat Hijau (B_kk)', 'Keriput Kuning (bbK_)', 'Keriput Hijau (bbkk)'];
  const diRatios = [9/16, 3/16, 3/16, 1/16]; // Rasio 9 : 3 : 3 : 1

  const activePhenotypes = mode === 'mono' ? monoPhenotypes : diPhenotypes;
  const activeRatios = mode === 'mono' ? monoRatios : diRatios;

  // --- GENERATOR PERSILANGAN ACAK ---
  const generateCross = () => {
    // Array untuk menampung hitungan [Fenotipe 1, Fenotipe 2, ...]
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
  
  if (hasGenerated) {
    for (let i = 0; i < observed.length; i++) {
      const O = observed[i];
      const E = expected[i];
      chiSquare += Math.pow(O - E, 2) / E;
    }
  }

  // Nilai kritis tabel Chi-Square pada tingkat signifikansi 5% (0.05)
  const criticalValue = mode === 'mono' ? 3.841 : 7.815; 
  const isAccepted = chiSquare <= criticalValue;

  return (
    <div className="min-h-screen bg-green-50 p-6 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-100 hover:bg-green-200 text-green-800 text-xs font-bold transition mb-3 border border-green-200 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-green-900 mb-2">Simulasi Genetika Mendel &amp; Uji Chi-Square</h1>
          <p className="text-green-700 font-medium">Uji Probabilitas, Hukum Segregasi (Hukum I) &amp; Asortasi Bebas (Hukum II) pada Persilangan Ercis.</p>
        </header>

        {/* Formula Banner */}
        <div className="bg-white p-4 rounded-2xl border border-green-200 shadow-sm flex flex-wrap justify-around items-center gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Uji Chi-Square:</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PANEL KONTROL KIRI */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200 h-fit space-y-6">
            <h2 className="font-bold text-green-800 border-b pb-3 flex items-center gap-2">
               <Dna size={18}/> Pengaturan Persilangan
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Persilangan</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => {setMode('mono'); setHasGenerated(false);}} 
                    className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${mode === 'mono' ? 'bg-green-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                  >Monohibrid</button>
                  <button 
                    onClick={() => {setMode('di'); setHasGenerated(false);}} 
                    className={`flex-1 py-2 rounded-lg font-bold text-xs transition ${mode === 'di' ? 'bg-green-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                  >Dihibrid</button>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-sm font-semibold mb-2 text-slate-700">
                  <span>Jumlah Populasi Acak</span>
                  <span className="text-green-700 font-black font-mono">{population} Pohon</span>
                </label>
                <input 
                  type="range" min="10" max="1000" step="10" 
                  value={population} 
                  onChange={(e) => {setPopulation(Number(e.target.value)); setHasGenerated(false);}} 
                  className="w-full accent-green-600 cursor-pointer" 
                />
              </div>

              <button 
                onClick={generateCross} 
                className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-md active:scale-98"
              >
                <RefreshCw size={18} className={hasGenerated ? '' : 'animate-spin'}/> Hasilkan Keturunan (F2)
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
               <span className="block text-xs font-bold text-green-700 uppercase mb-2">Genotipe Induk (<MathFormula formula="F_1 \times F_1" />)</span>
               <div className="text-center font-mono text-xl font-bold text-green-900 tracking-widest">
                 {mode === 'mono' ? 'Kk × Kk' : 'BbKk × BbKk'}
               </div>
            </div>
          </div>

          {/* AREA HASIL & STATISTIK KANAN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabel Punnett / Perbandingan */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-200">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <Calculator size={18} className="text-green-600"/> Distribusi Fenotipe (Rasio Teoritis vs Observasi)
               </h3>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                     <tr>
                       <th className="px-4 py-3">Fenotipe</th>
                       <th className="px-4 py-3">Rasio</th>
                       <th className="px-4 py-3 bg-amber-50 text-amber-800">Harapan (E)</th>
                       <th className="px-4 py-3 bg-blue-50 text-blue-800">Observasi (O)</th>
                     </tr>
                   </thead>
                   <tbody>
                     {activePhenotypes.map((phenotype, idx) => (
                       <tr key={idx} className="border-b border-slate-100">
                         <td className="px-4 py-3 font-semibold text-slate-700">{phenotype}</td>
                         <td className="px-4 py-3 font-mono font-bold text-green-600">
                            {mode === 'mono' ? (idx === 0 ? '3' : '1') : (idx === 0 ? '9' : idx === 3 ? '1' : '3')}
                         </td>
                         <td className="px-4 py-3 bg-amber-50 font-mono font-bold text-amber-700">{expected[idx].toFixed(1)}</td>
                         <td className="px-4 py-3 bg-blue-50 font-mono font-bold text-blue-700">
                            {hasGenerated ? observed[idx] : '-'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

            {/* Kotak Kesimpulan Chi-Square */}
            {hasGenerated && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                 
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Nilai Chi-Square (<MathFormula formula="\chi^2" />)</span>
                      <span className="text-3xl font-black text-slate-800 font-mono">{chiSquare.toFixed(3)}</span>
                      <span className="text-xs text-slate-400 ml-2">(Tabel Kritis: {criticalValue})</span>
                    </div>
                 </div>

                 <div className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center items-center text-center ${isAccepted ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    {isAccepted ? (
                       <>
                         <CheckCircle2 size={32} className="text-emerald-500 mb-1"/>
                         <span className="text-sm font-bold text-emerald-800 leading-tight">Sesuai Hukum Mendel</span>
                       </>
                    ) : (
                       <>
                         <XCircle size={32} className="text-red-500 mb-1"/>
                         <span className="text-sm font-bold text-red-800 leading-tight">Penyimpangan Signifikan</span>
                       </>
                    )}
                 </div>

              </div>
            )}

            {/* Tips Pendidik */}
            <div className="bg-slate-800 text-slate-300 p-5 rounded-xl text-xs leading-relaxed border border-slate-700">
               <strong>Tips Praktikum:</strong> Coba atur populasi di angka kecil (misal 20 pohon). Anda akan sering melihat nilai <MathFormula formula="\chi^2" /> berwarna merah (Penyimpangan Signifikan). Namun saat Anda menaikkan populasi ke 1000 pohon, hasilnya akan selalu hijau. Ini mengajarkan siswa tentang <em>The Law of Large Numbers</em> dalam genetika populasi!
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
