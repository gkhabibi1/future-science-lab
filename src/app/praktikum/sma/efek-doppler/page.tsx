"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Activity, Car, User, Info, ArrowLeft, Play, Pause, RotateCcw, Volume2, Sparkles } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface Wave {
  x: number;
  y: number;
  radius: number;
}

export default function DopplerSimulation() {
  // --- STATE PARAMETER ---
  const v = 340; // Kecepatan bunyi di udara konstan (m/s)
  const fs = 500; // Frekuensi Sumber asli (Hz)
  
  // Kecepatan sumber (vs) dan pendengar (vp)
  // Positif = Bergerak ke Kanan (→), Negatif = Bergerak ke Kiri (←)
  const [vs, setVs] = useState(60); 
  const [vp, setVp] = useState(0);  
  const [isSimulating, setIsSimulating] = useState(true);

  // --- STATE FISIKA (HASIL KALKULASI) ---
  const [fp, setFp] = useState(500);

  // Referensi untuk Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Posisi Objek di Layar
  const posSource = useRef({ x: 220, y: 160 });
  const posObserver = useRef({ x: 580, y: 160 });
  const waves = useRef<Wave[]>([]);
  
  // Frame counter untuk timing emisi gelombang
  const frameCount = useRef(0);

  // --- KALKULASI EFEK DOPPLER (REAL TIME) ---
  useEffect(() => {
    // Menentukan tanda berdasarkan posisi relatif
    // Asumsi: Sumber di kiri, Pendengar di kanan
    let signVp = 0; 
    let signVs = 0; 

    // Pendengar mendekati sumber (bergerak ke kiri) -> (+)
    // Pendengar menjauhi sumber (bergerak ke kanan) -> (-)
    if (vp < 0) signVp = 1; 
    else if (vp > 0) signVp = -1;

    // Sumber mendekati pendengar (bergerak ke kanan) -> (-)
    // Sumber menjauhi pendengar (bergerak ke kiri) -> (+)
    if (vs > 0) signVs = -1;
    else if (vs < 0) signVs = 1;

    let safeVs = Math.abs(vs);
    if (safeVs >= v) safeVs = v - 1; // Menghindari singularitas pembagian nol
    let safeVp = Math.abs(vp);

    const calculatedFp = fs * ((v + (signVp * safeVp)) / (v + (signVs * safeVs)));
    setFp(calculatedFp);
  }, [vs, vp]);

  // --- ANIMASI CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const animate = () => {
      if (!ctx || !canvas || !isSimulating) return;

      // Bersihkan latar
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid Halus Latar Belakang
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Garis Jalan / Lintasan Akustik
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(0, 160); ctx.lineTo(canvas.width, 160); ctx.stroke();
      ctx.setLineDash([]);

      // 1. Update Posisi Objek
      posSource.current.x += (vs * 0.012);
      posObserver.current.x += (vp * 0.012);

      // Wrap around screen
      if (posSource.current.x > canvas.width + 60) posSource.current.x = -60;
      if (posSource.current.x < -60) posSource.current.x = canvas.width + 60;
      if (posObserver.current.x > canvas.width + 60) posObserver.current.x = -60;
      if (posObserver.current.x < -60) posObserver.current.x = canvas.width + 60;

      // 2. Pancarkan Gelombang Baru
      frameCount.current++;
      if (frameCount.current % 12 === 0) {
        waves.current.push({
          x: posSource.current.x,
          y: posSource.current.y,
          radius: 0
        });
      }

      // 3. Render Muka Gelombang Bunyi Konsentris (Wavefronts)
      const waveSpeedVisual = 3.2; 
      
      for (let i = waves.current.length - 1; i >= 0; i--) {
        const wave = waves.current[i];
        wave.radius += waveSpeedVisual;

        if (wave.radius > canvas.width) {
          waves.current.splice(i, 1);
          continue;
        }

        const opacity = Math.max(0, 1 - (wave.radius / (canvas.width * 0.75)));
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${opacity * 0.8})`; 
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 4. Gambar Sumber Bunyi (Ambulans Merah Neon)
      const sx = posSource.current.x;
      const sy = posSource.current.y;

      ctx.save();
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      
      // Lampu Sirine Berkedip
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(sx, sy - 18, 4, 0, Math.PI * 2); ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SUMBER', sx, sy + 4);
      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`${vs > 0 ? '+' : ''}${vs}m/s`, sx, sy + 28);
      ctx.restore();

      // 5. Gambar Pendengar / Observer (Hijau Emerald Neon)
      const ox = posObserver.current.x;
      const oy = posObserver.current.y;

      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(ox, oy, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OBS', ox, oy + 4);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`${vp > 0 ? '+' : ''}${vp}m/s`, ox, oy + 28);
      ctx.restore();

      requestRef.current = requestAnimationFrame(animate);
    };

    if (isSimulating) requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isSimulating, vs, vp]);

  const handleResetPos = () => {
    posSource.current = { x: 220, y: 160 };
    posObserver.current = { x: 580, y: 160 };
    waves.current = [];
    setVs(60);
    setVp(0);
  };

  const applyPreset = (newVs: number, newVp: number) => {
    setVs(newVs);
    setVp(newVp);
  };

  const pitchShiftPercent = ((fp - fs) / fs) * 100;
  const machNumber = Math.abs(vs) / v;
  // Panjang gelombang terkompresi di depan sumber: lambda = (v - vs) / fs
  const lambdaFront = Math.max(0.01, (v - vs) / fs);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-amber-500 selection:text-white">
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-amber-300 bg-amber-950/80 border border-amber-800">
                  SMA • Fisika Gelombang Bunyi
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Akustik &amp; Efek Pergeseran Frekuensi
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Simulasi Efek Doppler Gelombang Bunyi
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Perubahan nada frekuensi akibat gerak relatif sumber bunyi ambulans dan pengamat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border shadow-sm w-full md:w-auto cursor-pointer ${
                isSimulating
                  ? 'bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600/30'
                  : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
              }`}
            >
              {isSimulating ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
              {isSimulating ? 'Jeda' : 'Lanjutkan'}
            </button>
            <button
              onClick={handleResetPos}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition shadow-sm w-full md:w-auto cursor-pointer"
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>
        </header>

        {/* BANNER RUMUS FISIKA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Efek Doppler:</span>
            <MathFormula formula="f_p = f_s \cdot \frac{v \pm v_p}{v \mp v_s}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Cepat Rambat Suara Udara:</span>
            <MathFormula formula="v = 340\text{ m/s}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Kompresi Panjang Gelombang:</span>
            <MathFormula formula="\lambda_{\text{depan}} = \frac{v - v_s}{f_s}" />
          </div>
        </div>

        {/* MAIN 4-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (1 Kolom) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur shadow-xl">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Volume2 size={16} className="text-amber-400" /> Variabel Gerak Relatif
            </h3>

            {/* Kecepatan Sumber (vs) */}
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-rose-900/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Car size={14} className="text-rose-400" /> Kecepatan Sumber (<MathFormula formula="v_s" />):
                </span>
                <span className="font-mono text-rose-400 font-bold">{vs} m/s</span>
              </div>
              <input 
                type="range" min="-150" max="150" step="5" 
                value={vs} onChange={(e) => setVs(Number(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-lg accent-rose-500 cursor-pointer" 
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>← Kiri (-150)</span>
                <span>Diam (0)</span>
                <span>Kanan (+150) →</span>
              </div>
            </div>

            {/* Kecepatan Pendengar (vp) */}
            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-emerald-900/40">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <User size={14} className="text-emerald-400" /> Kecepatan Pendengar (<MathFormula formula="v_p" />):
                </span>
                <span className="font-mono text-emerald-400 font-bold">{vp} m/s</span>
              </div>
              <input 
                type="range" min="-150" max="150" step="5" 
                value={vp} onChange={(e) => setVp(Number(e.target.value))} 
                className="w-full h-2 bg-slate-800 rounded-lg accent-emerald-500 cursor-pointer" 
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>← Kiri (-150)</span>
                <span>Diam (0)</span>
                <span>Kanan (+150) →</span>
              </div>
            </div>

            {/* Preset Skenario Doppler */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Preset Skenario:</span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset(70, 0)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>1. Ambulans Mendekat (vs &gt; 0)</span>
                  <span className="font-mono text-emerald-400 text-[9px]">Nada Tinggi</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(-70, 0)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>2. Ambulans Menjauh (vs &lt; 0)</span>
                  <span className="font-mono text-rose-400 text-[9px]">Nada Rendah</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(90, -40)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition flex items-center justify-between"
                >
                  <span>3. Saling Mendekati Cepat</span>
                  <span className="font-mono text-amber-400 text-[9px]">fp Maksimum</span>
                </button>
              </div>
            </div>

          </div>

          {/* AREA KANVAS & DASHBOARD (3 Kolom) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Kanvas Akustik Gelombang Suara */}
            <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col justify-between overflow-hidden backdrop-blur">
              
              {/* Header Status Akustik */}
              <div className="w-full flex flex-wrap justify-between items-center gap-2 mb-2 z-10">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    fp > fs 
                      ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300' 
                      : fp < fs 
                      ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                      : 'bg-slate-950/80 border-slate-700 text-slate-300'
                  }`}>
                    <Activity size={14} /> 
                    {fp > fs ? 'Pitch Naik (Frekuensi Lebih Tinggi)' : fp < fs ? 'Pitch Turun (Frekuensi Lebih Rendah)' : 'Frekuensi Stabil'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Frekuensi Sumber Asli:</span>
                  <span className="text-amber-400 font-bold">{fs} Hz</span>
                </div>
              </div>

              {/* Kanvas Animasi */}
              <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617] relative">
                <canvas 
                  ref={canvasRef} 
                  width={800} 
                  height={320} 
                  className="w-full h-auto block" 
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
                <span>DOPPLER ACOUSTIC WAVE CHAMBER // MEDIUM: AIR</span>
                <span>WAVEFRONT COMPRESSION DETECTED</span>
              </div>
            </div>

            {/* DASHBOARD METRIK FREKUENSI (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Frekuensi Terdengar (fp)
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {fp.toFixed(1)} <span className="text-xs font-normal text-slate-400">Hz</span>
                </div>
                <p className={`text-[10px] font-mono mt-1 ${pitchShiftPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pitchShiftPercent >= 0 ? `+${pitchShiftPercent.toFixed(1)}%` : `${pitchShiftPercent.toFixed(1)}%`} dari nada asli
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                  Panjang Gelombang Depan (λ)
                </span>
                <div className="text-2xl font-black text-sky-400 font-mono">
                  {lambdaFront.toFixed(3)} <span className="text-xs font-normal text-slate-400">m</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Muka gelombang memampat di depan sumber
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                  Bilangan Mach (M)
                </span>
                <div className="text-2xl font-black text-indigo-300 font-mono">
                  {machNumber.toFixed(2)} Mach
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {machNumber < 1 ? 'Subsonik (Kurang dari kecepatan suara)' : 'Supersonik (Sonic Boom)'}
                </p>
              </div>

            </div>

            {/* PENJELASAN EDUKATIF KONSEPTUAL */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Hukum Efek Doppler &amp; Fenomena Akustik:</strong>
                <p>
                  Ketika sumber bunyi bergerak mendekati pendengar, muka-muka gelombang bunyi di depannya <strong>terdesak dan merapat (<MathFormula formula="\lambda_{\text{depan}} < \lambda_0" />)</strong>, sehingga frekuensi yang diterima telinga menjadi lebih tinggi (suara sirine terdengar melengking). Sebaliknya, saat sumber bergerak menjauh, gelombang bunyi merenggang di belakangnya (<MathFormula formula="\lambda_{\text{belakang}} > \lambda_0" />), menghasilkan frekuensi yang lebih rendah (suara lebih berat/bass).
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
