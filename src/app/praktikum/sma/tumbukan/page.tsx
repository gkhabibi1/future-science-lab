"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Play, RotateCcw, Zap, ArrowLeft, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function TumbukanSimulation() {
  // --- STATE PARAMETER ---
  const [m1, setM1] = useState(3); // Massa Bola 1 (Merah, kg)
  const [v1, setV1] = useState(5); // Kecepatan awal Bola 1 (m/s)
  
  const [m2, setM2] = useState(4); // Massa Bola 2 (Biru, kg)
  const [v2, setV2] = useState(-3); // Kecepatan awal Bola 2 (m/s)
  
  const [e, setE] = useState(1); // Koefisien Restitusi (0 s/d 1)

  // --- STATE ANIMASI & DATA ---
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasCollided, setHasCollided] = useState(false);
  
  // Data real-time untuk UI
  const [currentV1, setCurrentV1] = useState(v1);
  const [currentV2, setCurrentV2] = useState(v2);
  const [ekTotal, setEkTotal] = useState(0);
  const [ekLost, setEkLost] = useState(0);

  // --- REFERENSI KANVAS & ANIMASI ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Posisi fisik bola & ref data internal untuk RAF loop
  const pos1 = useRef({ x: 120, radius: 26 });
  const pos2 = useRef({ x: 680, radius: 28 });
  
  const currentV1Ref = useRef(v1);
  const currentV2Ref = useRef(v2);
  const hasCollidedRef = useRef(false);
  const sparkAnimRef = useRef(0);

  // Total momentum awal (P = m1*v1 + m2*v2)
  const initialMomentum = m1 * v1 + m2 * v2;

  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, p1x: number, p2x: number) => {
    ctx.clearRect(0, 0, width, height);

    // 1. Grid Background Sci-Fi
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const trackY = height / 2 + 35;

    // 2. Rel Presisi / Air Track
    const trackGrad = ctx.createLinearGradient(0, trackY, 0, trackY + 12);
    trackGrad.addColorStop(0, '#334155');
    trackGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = trackGrad;
    ctx.fillRect(0, trackY, width, 12);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath(); 
    ctx.moveTo(0, trackY); 
    ctx.lineTo(width, trackY); 
    ctx.stroke();

    // Tanda Skala Meteran
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    for (let x = 40; x < width; x += 60) {
      ctx.fillRect(x, trackY, 1.5, 6);
      ctx.fillText(`${(x / 60).toFixed(0)}m`, x - 6, trackY + 18);
    }

    // 3. Efek Percikan Kilat Tabrakan (Sparks on Collision)
    if (sparkAnimRef.current > 0) {
      ctx.save();
      const sparkX = (p1x + p2x) / 2;
      const sparkY = trackY - 26;
      ctx.fillStyle = `rgba(251, 191, 36, ${sparkAnimRef.current})`;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 18 * sparkAnimRef.current, 0, Math.PI * 2);
      ctx.fill();
      sparkAnimRef.current = Math.max(0, sparkAnimRef.current - 0.05);
      ctx.restore();
    }

    // 4. Benda 1 (Merah Neon)
    const r1 = Math.min(34, Math.max(20, 16 + m1 * 1.2));
    pos1.current.radius = r1;
    const y1 = trackY - r1;

    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 15;
    const grad1 = ctx.createRadialGradient(p1x - 5, y1 - 5, 2, p1x, y1, r1);
    grad1.addColorStop(0, '#fda4af');
    grad1.addColorStop(1, '#e11d48');
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.arc(p1x, y1, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label m1
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${m1}kg`, p1x, y1 + 4);

    // Vektor Kecepatan Benda 1
    const v1Vec = currentV1Ref.current;
    if (Math.abs(v1Vec) > 0.1) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p1x, y1 - r1 - 10);
      ctx.lineTo(p1x + v1Vec * 8, y1 - r1 - 10);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`${v1Vec > 0 ? '+' : ''}${v1Vec.toFixed(1)}m/s`, p1x, y1 - r1 - 16);
    }
    ctx.restore();

    // 5. Benda 2 (Biru Neon)
    const r2 = Math.min(34, Math.max(20, 16 + m2 * 1.2));
    pos2.current.radius = r2;
    const y2 = trackY - r2;

    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;
    const grad2 = ctx.createRadialGradient(p2x - 5, y2 - 5, 2, p2x, y2, r2);
    grad2.addColorStop(0, '#bae6fd');
    grad2.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(p2x, y2, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label m2
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${m2}kg`, p2x, y2 + 4);

    // Vektor Kecepatan Benda 2
    const v2Vec = currentV2Ref.current;
    if (Math.abs(v2Vec) > 0.1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p2x, y2 - r2 - 10);
      ctx.lineTo(p2x + v2Vec * 8, y2 - r2 - 10);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`${v2Vec > 0 ? '+' : ''}${v2Vec.toFixed(1)}m/s`, p2x, y2 - r2 - 16);
    }
    ctx.restore();

  }, [m1, m2]);

  const updateSimulasi = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let p1 = pos1.current.x;
    let p2 = pos2.current.x;
    const r1 = pos1.current.radius;
    const r2 = pos2.current.radius;

    // Gerakkan objek berdasarkan kecepatan saat ini
    p1 += currentV1Ref.current * 0.45;
    p2 += currentV2Ref.current * 0.45;

    // Deteksi Tabrakan Antar Bola
    if (!hasCollidedRef.current && (p1 + r1 >= p2 - r2)) {
      hasCollidedRef.current = true;
      setHasCollided(true);
      sparkAnimRef.current = 1.0;

      // FISIKA TUMBUKAN 1D DENGAN RESTITUSI e:
      // v1' = (m1*v1 + m2*v2 - m2*e*(v1 - v2)) / (m1 + m2)
      // v2' = (m1*v1 + m2*v2 + m1*e*(v1 - v2)) / (m1 + m2)
      const u1 = currentV1Ref.current;
      const u2 = currentV2Ref.current;
      
      const v1_prime = ((m1 * u1 + m2 * u2) - m2 * e * (u1 - u2)) / (m1 + m2);
      const v2_prime = ((m1 * u1 + m2 * u2) + m1 * e * (u1 - u2)) / (m1 + m2);

      currentV1Ref.current = v1_prime;
      currentV2Ref.current = v2_prime;

      setCurrentV1(v1_prime);
      setCurrentV2(v2_prime);

      // Hitung Hilangnya Energi Kinetik:
      const ekAwal = 0.5 * m1 * (v1 * v1) + 0.5 * m2 * (v2 * v2);
      const ekAkhir = 0.5 * m1 * (v1_prime * v1_prime) + 0.5 * m2 * (v2_prime * v2_prime);
      
      setEkTotal(ekAkhir);
      setEkLost(Math.max(0, ekAwal - ekAkhir));
    }

    // Pantulan Dinding Luar
    if (p1 - r1 <= 20) {
      currentV1Ref.current = Math.abs(currentV1Ref.current);
    }
    if (p2 + r2 >= canvas.width - 20) {
      currentV2Ref.current = -Math.abs(currentV2Ref.current);
    }

    pos1.current.x = p1;
    pos2.current.x = p2;

    drawCanvas(ctx, canvas.width, canvas.height, p1, p2);

    requestRef.current = requestAnimationFrame(updateSimulasi);
  }, [m1, m2, e, v1, v2, drawCanvas]);

  const resetSimulasi = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setIsSimulating(false);
    setHasCollided(false);
    hasCollidedRef.current = false;
    sparkAnimRef.current = 0;
    
    pos1.current.x = 120;
    pos2.current.x = 680;
    currentV1Ref.current = v1;
    currentV2Ref.current = v2;

    setCurrentV1(v1);
    setCurrentV2(v2);

    const ekInitial = 0.5 * m1 * (v1 * v1) + 0.5 * m2 * (v2 * v2);
    setEkTotal(ekInitial);
    setEkLost(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawCanvas(ctx, canvas.width, canvas.height, 120, 680);
    }
  }, [m1, v1, m2, v2, drawCanvas]);

  useEffect(() => {
    resetSimulasi();
  }, [m1, v1, m2, v2, e, resetSimulasi]);

  const startSimulasi = () => {
    if (!isSimulating) {
      setIsSimulating(true);
      updateSimulasi();
    }
  };

  const applyPreset = (pm1: number, pv1: number, pm2: number, pv2: number, pe: number) => {
    setM1(pm1);
    setV1(pv1);
    setM2(pm2);
    setV2(pv2);
    setE(pe);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-rose-500 selection:text-white">
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-rose-300 bg-rose-950/80 border border-rose-800">
                  SMA • Fisika Dinamika &amp; Impuls
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Hukum Kekekalan Momentum 1 Dimensi
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Simulasi Tumbukan &amp; Kekekalan Momentum
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Eksperimen elastisitas tumbukan, koefisien restitusi (e), dan analisis konversi energi kinetik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={startSimulasi}
              disabled={isSimulating}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95 w-full md:w-auto cursor-pointer"
            >
              <Play size={15} fill="currentColor" /> {isSimulating ? 'Sedang Bergerak...' : 'Mulai Tumbukan'}
            </button>
            <button
              onClick={resetSimulasi}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition shadow-sm w-full md:w-auto cursor-pointer"
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>
        </header>

        {/* BANNER RUMUS FISIKA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Kekekalan Momentum:</span>
            <MathFormula formula="m_1 v_1 + m_2 v_2 = m_1 v_1' + m_2 v_2'" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Koefisien Restitusi:</span>
            <MathFormula formula="e = -\frac{v_2' - v_1'}{v_2 - v_1}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Disipasi Energi:</span>
            <MathFormula formula="\Delta E_k = E_{k,\text{awal}} - E_{k,\text{akhir}}" />
          </div>
        </div>

        {/* MAIN 4-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (1 Kolom) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Zap size={16} className="text-rose-400" /> Parameter Massa &amp; Kecepatan
            </h3>

            {/* Benda 1 (Merah) */}
            <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-rose-900/40">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Bola 1 (Merah)
              </span>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Massa (<MathFormula formula="m_1" />):</span>
                  <span className="font-mono text-rose-400 font-bold">{m1} kg</span>
                </div>
                <input 
                  type="range" min="1" max="15" value={m1} 
                  onChange={(e) => setM1(Number(e.target.value))} 
                  disabled={isSimulating}
                  className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50" 
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Kecepatan Awal (<MathFormula formula="v_1" />):</span>
                  <span className="font-mono text-rose-300 font-bold">+{v1} m/s</span>
                </div>
                <input 
                  type="range" min="1" max="12" value={v1} 
                  onChange={(e) => setV1(Number(e.target.value))} 
                  disabled={isSimulating}
                  className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50" 
                />
              </div>
            </div>

            {/* Benda 2 (Biru) */}
            <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-sky-900/40">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Bola 2 (Biru)
              </span>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Massa (<MathFormula formula="m_2" />):</span>
                  <span className="font-mono text-sky-400 font-bold">{m2} kg</span>
                </div>
                <input 
                  type="range" min="1" max="15" value={m2} 
                  onChange={(e) => setM2(Number(e.target.value))} 
                  disabled={isSimulating}
                  className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50" 
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Kecepatan Awal (<MathFormula formula="v_2" />):</span>
                  <span className="font-mono text-sky-300 font-bold">{v2} m/s</span>
                </div>
                <input 
                  type="range" min="-12" max="0" value={v2} 
                  onChange={(e) => setV2(Number(e.target.value))} 
                  disabled={isSimulating}
                  className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50" 
                />
              </div>
            </div>

            {/* Koefisien Restitusi Slider */}
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-emerald-900/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Koefisien Restitusi (<MathFormula formula="e" />):</span>
                <span className="font-mono text-emerald-400 font-bold">{e.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.1" value={e} 
                onChange={(e) => setE(Number(e.target.value))} 
                disabled={isSimulating}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50" 
              />
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0.0 (Tak Lenting)</span>
                <span>0.5</span>
                <span>1.0 (Lenting Sempurna)</span>
              </div>
            </div>

            {/* Preset Skenario */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Preset Skenario:</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => applyPreset(3, 6, 3, -6, 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>1. Lenting Sempurna Simetris</span>
                  <span className="font-mono text-emerald-400 text-[9px]">e=1.0</span>
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => applyPreset(4, 8, 2, 0, 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>2. Tabrak Bola Diam (v₂=0)</span>
                  <span className="font-mono text-emerald-400 text-[9px]">v₂=0 m/s</span>
                </button>
                <button
                  type="button"
                  disabled={isSimulating}
                  onClick={() => applyPreset(5, 6, 3, -4, 0)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>3. Menempel Jadi Satu (e=0)</span>
                  <span className="font-mono text-rose-400 text-[9px]">ΔEk Max</span>
                </button>
              </div>
            </div>

          </div>

          {/* AREA KANVAS & DASHBOARD (3 Kolom) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Kanvas Rel Tumbukan */}
            <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col justify-between overflow-hidden backdrop-blur">
              
              {/* Header Status Tumbukan */}
              <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-3 z-10">
                <div className="flex items-center gap-2">
                  {hasCollided ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/60 text-amber-400 flex items-center gap-1.5 animate-pulse">
                      <Sparkles size={14} /> Fase Pasca-Tumbukan (Momentum Kekal)
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-950/80 border border-slate-700 text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" /> Menuju Titik Tumbukan
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Total Momentum:</span>
                  <span className="text-cyan-400 font-bold">{initialMomentum.toFixed(1)} kg·m/s</span>
                </div>
              </div>

              {/* Kanvas Animasi */}
              <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617] relative">
                <canvas 
                  ref={canvasRef} 
                  width={800} 
                  height={220} 
                  className="w-full h-auto block" 
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
                <span>COLLISION CHAMBER 1D // AIR TRACK SIMULATOR</span>
                <span>STATUS ELASTISITAS: {e === 1 ? 'ELASTIK SEMPURNA' : e === 0 ? 'TAK ELASTIK SAMA SEKALI' : 'ELASTIK SEBAGIAN'}</span>
              </div>
            </div>

            {/* DASHBOARD METRIK PASCA TUMBUKAN (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                  Kecepatan Akhir Bola
                </span>
                <div className="flex justify-between items-baseline text-lg font-black font-mono mt-1">
                  <span className="text-rose-400">v₁' = {currentV1.toFixed(2)} m/s</span>
                  <span className="text-sky-400">v₂' = {currentV2.toFixed(2)} m/s</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Arah: {currentV1 >= 0 ? 'Kanan (→)' : 'Kiri (←)'} &amp; {currentV2 >= 0 ? 'Kanan (→)' : 'Kiri (←)'}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Total Energi Kinetik (<MathFormula formula="E_k" />)
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {ekTotal.toFixed(1)} <span className="text-xs font-normal text-slate-400">Joule</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {e === 1 ? 'Energi Kinetik Kekal Utuh (100%)' : `Tersisa ${((ekTotal / (ekTotal + ekLost)) * 100).toFixed(0)}% energi kinetik`}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Disipasi Energi Hilang (<MathFormula formula="\Delta E_k" />)
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {ekLost.toFixed(1)} <span className="text-xs font-normal text-slate-400">Joule</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Dikonversi jadi energi panas &amp; deformasi bunyi
                </p>
              </div>

            </div>

            {/* PENJELASAN EDUKATIF KONSEPTUAL */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Hukum Kekekalan Momentum &amp; Klasifikasi Tumbukan:</strong>
                <p>
                  Pada seluruh peristiwa tumbukan terisolasi tanpa gaya luar, <strong>total momentum sistem selalu kekal (<MathFormula formula="\sum P_{\text{awal}} = \sum P_{\text{akhir}}" />)</strong>. Namun, Energi Kinetik (<MathFormula formula="E_k" />) hanya kekal sempurna pada <strong>tumbukan lenting sempurna (<MathFormula formula="e = 1" />)</strong>. Pada tumbukan tidak lenting (<MathFormula formula="e = 0" />), kedua benda menempel dan bergerak dengan kecepatan yang sama, menyebabkan disipasi energi mekanik maksimum menjadi energi panas dan deformasi bentuk.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
