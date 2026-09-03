"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Activity, Car, User, Info, ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

// Struktur data untuk setiap riak gelombang bunyi
interface Wave {
  x: number;
  y: number;
  radius: number;
}

export default function DopplerSimulation() {
  // --- STATE PARAMETER ---
  const v = 340; // Kecepatan bunyi di udara konstan (m/s)
  const fs = 500; // Frekuensi Sumber asli (Hz)
  
  // Kecepatan di UI (Visual scale, bukan aktual 340 m/s agar bisa digambar)
  // Positif = Bergerak ke Kanan, Negatif = Bergerak ke Kiri
  const [vs, setVs] = useState(50); // Kecepatan sumber (Ambulans)
  const [vp, setVp] = useState(0);  // Kecepatan pendengar (Orang)
  const [isSimulating, setIsSimulating] = useState(true);

  // --- STATE FISIKA (HASIL KALKULASI) ---
  const [fp, setFp] = useState(500);

  // Referensi untuk Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Posisi Objek di Layar
  const posSource = useRef({ x: 200, y: 200 });
  const posObserver = useRef({ x: 600, y: 200 });
  const waves = useRef<Wave[]>([]);
  
  // Frame counter untuk timing emisi gelombang
  const frameCount = useRef(0);

  // --- KALKULASI EFEK DOPPLER (REAL TIME) ---
  useEffect(() => {
    // Menentukan tanda berdasarkan posisi relatif
    // Asumsi: Sumber di kiri, Pendengar di kanan
    let signVp = 0; // Tanda kecepatan pendengar
    let signVs = 0; // Tanda kecepatan sumber

    // Pendengar mendekati sumber (bergerak ke kiri) -> (+)
    // Pendengar menjauhi sumber (bergerak ke kanan) -> (-)
    if (vp < 0) signVp = 1; 
    else if (vp > 0) signVp = -1;

    // Sumber mendekati pendengar (bergerak ke kanan) -> (-)
    // Sumber menjauhi pendengar (bergerak ke kiri) -> (+)
    if (vs > 0) signVs = -1;
    else if (vs < 0) signVs = 1;

    // Menghindari error pembagian nol / melebihi kecepatan suara
    let safeVs = Math.abs(vs);
    if (safeVs >= v) safeVs = v - 1; 
    
    let safeVp = Math.abs(vp);

    // Hitung fp menggunakan rumus resmi
    const calculatedFp = fs * ((v + (signVp * safeVp)) / (v + (signVs * safeVs)));
    setFp(calculatedFp);
  }, [vs, vp]);

  // --- ANIMASI CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const animate = () => {
      if (!ctx || !canvas || !isSimulating) return;

      // Bersihkan layar
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#0f172a'; // Latar gelap
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Garis Jalan
      ctx.strokeStyle = '#334155';
      ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(0, 200); ctx.lineTo(canvas.width, 200); ctx.stroke();
      ctx.setLineDash([]);

      // 1. Update Posisi Objek (Skala visual dikecilkan)
      posSource.current.x += (vs * 0.01);
      posObserver.current.x += (vp * 0.01);

      // Wrap around screen (agar tidak hilang dari layar)
      if (posSource.current.x > canvas.width + 50) posSource.current.x = -50;
      if (posSource.current.x < -50) posSource.current.x = canvas.width + 50;
      if (posObserver.current.x > canvas.width + 50) posObserver.current.x = -50;
      if (posObserver.current.x < -50) posObserver.current.x = canvas.width + 50;

      // 2. Pancarkan Gelombang Baru setiap interval tertentu
      frameCount.current++;
      if (frameCount.current % 15 === 0) {
        waves.current.push({
          x: posSource.current.x,
          y: posSource.current.y,
          radius: 0
        });
      }

      // 3. Gambar & Perbesar Gelombang (Mewakili v = 340m/s)
      const waveSpeedVisual = 3.4; // Skala kecepatan rambat bunyi di kanvas
      
      for (let i = waves.current.length - 1; i >= 0; i--) {
        const wave = waves.current[i];
        wave.radius += waveSpeedVisual;

        // Buang gelombang yang sudah terlalu besar
        if (wave.radius > canvas.width) {
          waves.current.splice(i, 1);
          continue;
        }

        // Gambar Lingkaran Gelombang (Makin besar makin transparan)
        const opacity = Math.max(0, 1 - (wave.radius / (canvas.width / 1.5)));
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`; // Biru muda cerah
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 4. Gambar Sumber (Ambulans)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(posSource.current.x, posSource.current.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('S', posSource.current.x, posSource.current.y + 4);

      // 5. Gambar Pendengar (Orang)
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(posObserver.current.x, posObserver.current.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#047857'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = 'bold 11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('P', posObserver.current.x, posObserver.current.y + 4);

      requestRef.current = requestAnimationFrame(animate);
    };

    if (isSimulating) requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isSimulating, vs, vp]);

  const handleResetPos = () => {
    posSource.current = { x: 200, y: 200 };
    posObserver.current = { x: 600, y: 200 };
    waves.current = [];
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <header>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-xs font-bold transition mb-3 border border-slate-300 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Simulasi Efek Doppler</h1>
          <p className="text-slate-500 font-medium">Perubahan frekuensi akibat pergerakan relatif sumber bunyi dan pendengar.</p>
        </header>

        {/* Formula Banner */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-around items-center gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Persamaan Umum Efek Doppler:</span>
            <MathFormula formula="f_p = f_s \cdot \frac{v \pm v_p}{v \mp v_s}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Kecepatan Suara di Udara:</span>
            <span className="font-mono font-bold text-slate-800">v = 340 m/s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel Kontrol Kiri */}
          <div className="space-y-6">
            
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold mb-4 text-red-700 border-b border-red-200 pb-2">
                <Car size={18}/> Kecepatan Sumber (<MathFormula formula="v_s" />)
              </h2>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nilai: <span className="text-red-600 font-bold font-mono">{vs} m/s</span>
              </label>
              <input type="range" min="-150" max="150" step="5" value={vs} onChange={(e) => setVs(Number(e.target.value))} className="w-full accent-red-600 cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-bold uppercase">
                <span>← Kiri</span><span>Diam</span><span>Kanan →</span>
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <h2 className="flex items-center gap-2 font-bold mb-4 text-emerald-700 border-b border-emerald-200 pb-2">
                <User size={18}/> Kecepatan Pendengar (<MathFormula formula="v_p" />)
              </h2>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nilai: <span className="text-emerald-600 font-bold font-mono">{vp} m/s</span>
              </label>
              <input type="range" min="-150" max="150" step="5" value={vp} onChange={(e) => setVp(Number(e.target.value))} className="w-full accent-emerald-600 cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-bold uppercase">
                <span>← Kiri</span><span>Diam</span><span>Kanan →</span>
              </div>
            </div>

            {/* Simulation Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  isSimulating
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    : 'bg-slate-900 hover:bg-black text-white'
                }`}
              >
                {isSimulating ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                {isSimulating ? 'Jeda Simulasi' : 'Lanjutkan'}
              </button>
              <button
                onClick={handleResetPos}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition border border-slate-200"
              >
                <RotateCcw size={16} /> Reset Posisi
              </button>
            </div>

            {/* Insight / Hint Box */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-xs text-blue-800 leading-relaxed">
               <strong className="flex items-center gap-1 mb-1"><Info size={16}/> Konvensi Tanda:</strong>
               Rumus dasar di program ini otomatis mengonversi arah gerak (kiri/kanan) menjadi tanda (+) atau (-) yang sesuai dengan kaidah Efek Doppler (S mendekat = -, P mendekat = +).
            </div>

          </div>

          {/* Area Visualisasi & Hasil */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-800 overflow-hidden relative">
               <div className="absolute top-4 left-4 bg-slate-800/80 text-white px-3 py-1 rounded-lg text-xs font-bold font-mono border border-slate-700 z-10">
                  v (Udara) = {v} m/s
               </div>
               
               {/* Canvas Radar Gelombang */}
               <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto bg-slate-900 rounded-xl cursor-crosshair block" />
               
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-xs font-bold bg-slate-800/90 px-4 py-2 rounded-full border border-slate-700 z-10">
                  <span className="text-red-400">● Sumber (S)</span>
                  <span className="text-emerald-400">● Pendengar (P)</span>
               </div>
            </div>

            {/* Dashboard Hasil Frekuensi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Frekuensi Asli (<MathFormula formula="f_s" />)</span>
                    <span className="text-2xl font-black text-slate-700 font-mono">{fs} Hz</span>
                  </div>
                  <Activity size={32} className="text-slate-300"/>
               </div>
               
               <div className={`border p-5 rounded-xl flex items-center justify-between shadow-sm transition-colors duration-300 ${fp > fs ? 'bg-amber-50 border-amber-300' : fp < fs ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200'}`}>
                  <div>
                    <span className="block text-xs font-bold text-slate-700 uppercase mb-1">Frekuensi Terdengar (<MathFormula formula="f_p" />)</span>
                    <span className="text-3xl font-black text-slate-900 font-mono">{fp.toFixed(1)} Hz</span>
                    <div className="text-xs font-bold mt-1">
                      {fp > fs && <span className="text-amber-700">↑ Frekuensi Naik (Melengking)</span>}
                      {fp < fs && <span className="text-indigo-700">↓ Frekuensi Turun (Mengebas)</span>}
                      {fp === fs && <span className="text-slate-500">= Frekuensi Tetap</span>}
                    </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
