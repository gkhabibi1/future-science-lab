"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Info, MoveHorizontal, ArrowLeft, RotateCcw, Sparkles, Sun } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function LensaSimulation() {
  // --- STATE ---
  const [lensType, setLensType] = useState<'cembung' | 'cekung'>('cembung');
  const [s, setS] = useState(140);   // Jarak benda (cm)
  const [absF, setAbsF] = useState(60); // Jarak fokus mutlak (cm)
  const [h] = useState(45);          // Tinggi benda (cm)

  // Fokus bertanda: Cembung = positif (+), Cekung = negatif (-)
  const f = lensType === 'cembung' ? absF : -absF;

  // --- FISIKA & KALKULASI PERSAMAAN GAUSS ---
  // Rumus: 1/f = 1/s + 1/s' => s' = (s * f) / (s - f)
  let s_aksen = 0;
  const isAtFocus = Math.abs(s - f) < 0.5;

  if (!isAtFocus) {
    s_aksen = (s * f) / (s - f);
  }

  // Perbesaran M = |s'/s|
  const M = isAtFocus ? 0 : Math.abs(s_aksen / s);
  
  // Tinggi bayangan h' = h * (-s'/s)
  const h_aksen = isAtFocus ? 0 : h * (-s_aksen / s);

  // Kuat lensa P (Dioptri) = 100 / f (cm)
  const dioptri = 100 / f;

  // Evaluasi Sifat Bayangan
  const sifat: string[] = [];
  if (isAtFocus) {
    sifat.push("Di Tak Hingga (∞)", "Tidak Terbentuk Bayangan");
  } else {
    if (s_aksen > 0) {
      sifat.push("Nyata", "Terbalik");
    } else {
      sifat.push("Maya", "Tegak");
    }

    if (Math.abs(M - 1) < 0.05) {
      sifat.push("Sama Besar");
    } else if (M > 1) {
      sifat.push("Diperbesar");
    } else {
      sifat.push("Diperkecil");
    }
  }

  // --- SETUP SVG ---
  const svgWidth = 800;
  const svgHeight = 380;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Skala visual agar objek dan bayangan muat proporsional
  const scale = 1.1;
  const getX = (val: number) => centerX + val * scale;
  const getY = (val: number) => centerY - val * scale;

  const resetDefault = () => {
    setLensType('cembung');
    setS(140);
    setAbsF(60);
  };

  const applyPreset = (distance: number) => {
    setS(distance);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* TOP NAVIGATION & HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700 shadow-sm"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-indigo-300 bg-indigo-950/80 border border-indigo-800">
                  SMA • Fisika Optika Geometri
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Hukum Pembiasan & Sinar Istimewa
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Simulasi Optik: Lensa Cembung & Cekung
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Pelacakan berkas sinar istimewa, perbesaran linear, dan karakteristik pembentukan bayangan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={resetDefault}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition shadow-sm w-full md:w-auto"
            >
              <RotateCcw size={15} /> Reset Standar
            </button>
          </div>
        </header>

        {/* BANNER RUMUS FISIKA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Lensa Gauss:</span>
            <MathFormula formula="\frac{1}{f} = \frac{1}{s} + \frac{1}{s'} \iff s' = \frac{s \cdot f}{s - f}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Perbesaran Linear:</span>
            <MathFormula formula="M = \left| \frac{s'}{s} \right| = \left| \frac{h'}{h} \right|" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Kekuatan Lensa:</span>
            <MathFormula formula="P = \frac{100}{f\text{ (cm)}} \text{ Dioptri}" />
          </div>
        </div>

        {/* MAIN 4-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (1 Kolom) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sun size={16} className="text-indigo-400" /> Parameter Optik
            </h3>

            {/* Toggle Jenis Lensa */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Pilih Jenis Lensa:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLensType('cembung')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    lensType === 'cembung'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Cembung (+)
                </button>
                <button
                  type="button"
                  onClick={() => setLensType('cekung')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                    lensType === 'cekung'
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Cekung (-)
                </button>
              </div>
            </div>

            {/* Slider Jarak Benda (s) */}
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-rose-900/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Jarak Benda (<MathFormula formula="s" />):</span>
                <span className="font-mono text-rose-400 font-bold">{s} cm</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="300" 
                value={s} 
                onChange={(e) => setS(Number(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-lg accent-rose-500 cursor-pointer" 
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>10 cm</span>
                <span>150 cm</span>
                <span>300 cm</span>
              </div>
            </div>

            {/* Slider Jarak Fokus (f) */}
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-amber-900/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Jarak Fokus (<MathFormula formula="|f|" />):</span>
                <span className="font-mono text-amber-400 font-bold">{absF} cm</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="120" 
                value={absF} 
                onChange={(e) => setAbsF(Number(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer" 
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>30 cm</span>
                <span>75 cm</span>
                <span>120 cm</span>
              </div>
            </div>

            {/* Preset Posisi Ruang Benda */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Preset Ruang Benda:</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(absF * 0.5)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>Ruang I (s &lt; f) — Kaca Pembesar</span>
                  <span className="font-mono text-indigo-400 text-[9px]">{absF * 0.5} cm</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(absF * 1.5)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>Ruang II (f &lt; s &lt; 2f) — Proyektor</span>
                  <span className="font-mono text-indigo-400 text-[9px]">{absF * 1.5} cm</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(absF * 2)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>Tepat di 2F (s = 2f) — M = 1.0x</span>
                  <span className="font-mono text-indigo-400 text-[9px]">{absF * 2} cm</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(absF * 2.5)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>Ruang III (s &gt; 2f) — Kamera</span>
                  <span className="font-mono text-indigo-400 text-[9px]">{absF * 2.5} cm</span>
                </button>
              </div>
            </div>

          </div>

          {/* AREA KANVAS & DASHBOARD (3 Kolom) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Diagram Berkas Sinar Optik */}
            <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col justify-between overflow-hidden backdrop-blur">
              
              {/* Header Status Optik */}
              <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-2 z-10">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 border border-slate-700 text-slate-200 flex items-center gap-1.5">
                    <Eye size={14} className="text-indigo-400" /> Sifat: <strong className="text-emerald-400">{sifat.join(" • ")}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
                  <span className="text-yellow-400 flex items-center gap-1">── Sinar 1 (Sejajar)</span>
                  <span className="text-rose-400 flex items-center gap-1">── Sinar 2 (Pusat)</span>
                </div>
              </div>

              {/* Area SVG Diagram Berkas Cahaya */}
              <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617] relative">
                <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="block">
                  
                  {/* Grid Halus Sumbu */}
                  <defs>
                    <pattern id="opticsGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#opticsGrid)" />

                  {/* Sumbu Utama Horizontal */}
                  <line x1="0" y1={centerY} x2={svgWidth} y2={centerY} stroke="#64748b" strokeWidth="1.5" strokeDasharray="6,4" />
                  
                  {/* Sumbu Vertikal Lensa */}
                  <line x1={centerX} y1="20" x2={centerX} y2={svgHeight - 20} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />

                  {/* Badan Lensa Transparan Cybernetic */}
                  {lensType === 'cembung' ? (
                    <ellipse 
                      cx={centerX} 
                      cy={centerY} 
                      rx="16" 
                      ry="130" 
                      fill="rgba(56, 189, 248, 0.15)" 
                      stroke="#38bdf8" 
                      strokeWidth="2.5" 
                    />
                  ) : (
                    <path 
                      d={`M ${centerX - 14} ${centerY - 130} Q ${centerX + 2} ${centerY} ${centerX - 14} ${centerY + 130} L ${centerX + 14} ${centerY + 130} Q ${centerX - 2} ${centerY} ${centerX + 14} ${centerY - 130} Z`} 
                      fill="rgba(56, 189, 248, 0.15)" 
                      stroke="#38bdf8" 
                      strokeWidth="2.5" 
                    />
                  )}

                  {/* Tanda Titik Fokus (F, 2F Kiri & Kanan) */}
                  {/* Kiri */}
                  <circle cx={getX(-absF)} cy={centerY} r="4" fill="#fbbf24" />
                  <text x={getX(-absF) - 6} y={centerY + 20} fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">F₁</text>
                  <circle cx={getX(-absF * 2)} cy={centerY} r="4" fill="#fbbf24" />
                  <text x={getX(-absF * 2) - 10} y={centerY + 20} fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">2F₁</text>

                  {/* Kanan */}
                  <circle cx={getX(absF)} cy={centerY} r="4" fill="#fbbf24" />
                  <text x={getX(absF) - 6} y={centerY + 20} fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">F₂</text>
                  <circle cx={getX(absF * 2)} cy={centerY} r="4" fill="#fbbf24" />
                  <text x={getX(absF * 2) - 10} y={centerY + 20} fill="#fbbf24" fontSize="11" fontFamily="monospace" fontWeight="bold">2F₂</text>

                  {/* --- OBJEK BENDA (Merah Neon) --- */}
                  <line 
                    x1={getX(-s)} 
                    y1={centerY} 
                    x2={getX(-s)} 
                    y2={getY(h)} 
                    stroke="#f43f5e" 
                    strokeWidth="5" 
                    strokeLinecap="round" 
                  />
                  <polygon 
                    points={`${getX(-s)},${getY(h) - 7} ${getX(-s) - 6},${getY(h) + 4} ${getX(-s) + 6},${getY(h) + 4}`} 
                    fill="#f43f5e" 
                  />
                  <text x={getX(-s) - 16} y={getY(h) - 10} fill="#f43f5e" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    Benda (s={s}cm)
                  </text>

                  {/* --- SINAR ISTIMEWA 1 (Kuning): Sejajar sumbu -> dibiaskan melalui F2 --- */}
                  <line x1={getX(-s)} y1={getY(h)} x2={centerX} y2={getY(h)} stroke="#facc15" strokeWidth="2.5" />
                  
                  {!isAtFocus && (
                    <>
                      {lensType === 'cembung' ? (
                        <>
                          <line 
                            x1={centerX} 
                            y1={getY(h)} 
                            x2={getX(s_aksen > 0 ? s_aksen * 1.4 : s_aksen)} 
                            y2={getY(h_aksen * 1.4)} 
                            stroke="#facc15" 
                            strokeWidth="2.5" 
                          />
                          {/* Garis putus-putus virtual ke belakang jika bayangan maya */}
                          {s_aksen < 0 && (
                            <line 
                              x1={centerX} 
                              y1={getY(h)} 
                              x2={getX(s_aksen)} 
                              y2={getY(h_aksen)} 
                              stroke="#facc15" 
                              strokeWidth="2" 
                              strokeDasharray="5,5" 
                              opacity="0.8" 
                            />
                          )}
                        </>
                      ) : (
                        <>
                          {/* Sinar bias cekung menyebar seolah berasal dari F1 */}
                          <line 
                            x1={centerX} 
                            y1={getY(h)} 
                            x2={centerX + 280} 
                            y2={getY(h) - 120} 
                            stroke="#facc15" 
                            strokeWidth="2.5" 
                          />
                          <line 
                            x1={getX(-absF)} 
                            y1={centerY} 
                            x2={centerX} 
                            y2={getY(h)} 
                            stroke="#facc15" 
                            strokeWidth="2" 
                            strokeDasharray="5,5" 
                            opacity="0.8" 
                          />
                        </>
                      )}
                    </>
                  )}

                  {/* --- SINAR ISTIMEWA 2 (Merah/Pink): Melalui pusat optik lensa (lurus tanpa bias) --- */}
                  <line 
                    x1={getX(-s)} 
                    y1={getY(h)} 
                    x2={centerX} 
                    y2={centerY} 
                    stroke="#fb7185" 
                    strokeWidth="2.5" 
                  />
                  {!isAtFocus && (
                    <>
                      <line 
                        x1={centerX} 
                        y1={centerY} 
                        x2={getX(s_aksen > 0 ? s_aksen * 1.4 : 260)} 
                        y2={getY(h_aksen * 1.4)} 
                        stroke="#fb7185" 
                        strokeWidth="2.5" 
                      />
                      {s_aksen < 0 && (
                        <line 
                          x1={centerX} 
                          y1={centerY} 
                          x2={getX(s_aksen)} 
                          y2={getY(h_aksen)} 
                          stroke="#fb7185" 
                          strokeWidth="2" 
                          strokeDasharray="5,5" 
                          opacity="0.8" 
                        />
                      )}
                    </>
                  )}

                  {/* --- BAYANGAN HASIL (Biru Cyan Neon) --- */}
                  {!isAtFocus && (
                    <>
                      <line 
                        x1={getX(s_aksen)} 
                        y1={centerY} 
                        x2={getX(s_aksen)} 
                        y2={getY(h_aksen)} 
                        stroke="#38bdf8" 
                        strokeWidth="5" 
                        strokeLinecap="round" 
                        opacity="0.9" 
                      />
                      <polygon 
                        points={
                          h_aksen < 0
                            ? `${getX(s_aksen)},${getY(h_aksen) + 7} ${getX(s_aksen) - 6},${getY(h_aksen) - 4} ${getX(s_aksen) + 6},${getY(h_aksen) - 4}`
                            : `${getX(s_aksen)},${getY(h_aksen) - 7} ${getX(s_aksen) - 6},${getY(h_aksen) + 4} ${getX(s_aksen) + 6},${getY(h_aksen) + 4}`
                        } 
                        fill="#38bdf8" 
                      />
                      <text 
                        x={getX(s_aksen) - 18} 
                        y={h_aksen < 0 ? getY(h_aksen) + 20 : getY(h_aksen) - 10} 
                        fill="#38bdf8" 
                        fontSize="11" 
                        fontFamily="monospace" 
                        fontWeight="bold"
                      >
                        Bayangan (s'={s_aksen.toFixed(1)}cm)
                      </text>
                    </>
                  )}
                </svg>
              </div>

            </div>

            {/* DASHBOARD METRIK OPTIKA (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Jarak Bayangan (s')
                </span>
                <div className="text-2xl font-black text-sky-400 font-mono">
                  {isAtFocus ? '∞ (Tak Hingga)' : `${s_aksen.toFixed(1)} cm`}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {s_aksen > 0 ? 's\' > 0 (Di Belakang Lensa)' : s_aksen < 0 ? 's\' < 0 (Di Depan Lensa)' : ''}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Perbesaran Linear (M)
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {isAtFocus ? '-' : `${M.toFixed(2)}x`}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Tinggi Bayangan: {Math.abs(h_aksen).toFixed(1)} cm
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                  Kekuatan Lensa (P)
                </span>
                <div className="text-2xl font-black text-indigo-300 font-mono">
                  {dioptri > 0 ? `+${dioptri.toFixed(2)}` : dioptri.toFixed(2)} D
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {dioptri > 0 ? 'Lensa Konvergen (Plus)' : 'Lensa Divergen (Minus)'}
                </p>
              </div>

            </div>

            {/* PENJELASAN EDUKATIF KONSEPTUAL */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Pedoman Sinar Istimewa Lensa:</strong>
                <p>
                  1. Sinar datang sejajar sumbu utama akan dibiaskan melalui titik fokus aktif lensa.<br />
                  2. Sinar datang yang melewati titik pusat optik lensa ($O$) akan diteruskan lurus tanpa pembiasan.<br />
                  3. Jika perpanjangan sinar bias berpotongan di sisi yang sama dengan benda ($s' &lt; 0$), bayangan bersifat <strong>Maya dan Tegak</strong> (seperti saat menggunakan lup/kaca pembesar). Jika sinar bias nyata berpotongan di belakang lensa ($s' &gt; 0$), bayangan bersifat <strong>Nyata dan Terbalik</strong> (seperti pada proyektor dan sensor kamera).
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
