"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Play, RotateCcw, Zap, ArrowLeft } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function TumbukanSimulation() {
  // --- STATE PARAMETER ---
  const [m1, setM1] = useState(2); // Massa Bola 1 (Merah)
  const [v1, setV1] = useState(5); // Kecepatan awal Bola 1
  
  const [m2, setM2] = useState(3); // Massa Bola 2 (Biru)
  const [v2, setV2] = useState(-3); // Kecepatan awal Bola 2 (negatif = ke kiri)
  
  const [e, setE] = useState(1); // Koefisien Restitusi

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
  const pos1 = useRef({ x: 120, radius: 24 });
  const pos2 = useRef({ x: 680, radius: 26 });
  
  const currentV1Ref = useRef(v1);
  const currentV2Ref = useRef(v2);
  const hasCollidedRef = useRef(false);

  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, p1x: number, p2x: number) => {
    ctx.clearRect(0, 0, width, height);

    // Garis lintasan (Track)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath(); 
    ctx.moveTo(0, height / 2 + 30); 
    ctx.lineTo(width, height / 2 + 30); 
    ctx.stroke();

    // Shadow / Bayangan Bola 1
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.beginPath();
    ctx.ellipse(p1x, height / 2 + 30, pos1.current.radius, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shadow / Bayangan Bola 2
    ctx.beginPath();
    ctx.ellipse(p2x, height / 2 + 30, pos2.current.radius, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bola 1 (Merah)
    const grad1 = ctx.createRadialGradient(
      p1x - pos1.current.radius * 0.3,
      height / 2 - pos1.current.radius * 0.3,
      pos1.current.radius * 0.1,
      p1x,
      height / 2,
      pos1.current.radius
    );
    grad1.addColorStop(0, '#fca5a5');
    grad1.addColorStop(0.7, '#ef4444');
    grad1.addColorStop(1, '#991b1b');

    ctx.fillStyle = grad1;
    ctx.beginPath(); 
    ctx.arc(p1x, height / 2, pos1.current.radius, 0, Math.PI * 2); 
    ctx.fill();
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'white'; 
    ctx.font = 'bold 13px Inter, sans-serif'; 
    ctx.textAlign = 'center';
    ctx.fillText(`${m1}kg`, p1x, height / 2 + 4);

    // Bola 2 (Biru)
    const grad2 = ctx.createRadialGradient(
      p2x - pos2.current.radius * 0.3,
      height / 2 - pos2.current.radius * 0.3,
      pos2.current.radius * 0.1,
      p2x,
      height / 2,
      pos2.current.radius
    );
    grad2.addColorStop(0, '#93c5fd');
    grad2.addColorStop(0.7, '#3b82f6');
    grad2.addColorStop(1, '#1e40af');

    ctx.fillStyle = grad2;
    ctx.beginPath(); 
    ctx.arc(p2x, height / 2, pos2.current.radius, 0, Math.PI * 2); 
    ctx.fill();
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'white'; 
    ctx.font = 'bold 13px Inter, sans-serif'; 
    ctx.textAlign = 'center';
    ctx.fillText(`${m2}kg`, p2x, height / 2 + 4);
  }, [m1, m2]);

  const updateSimulasi = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update posisi (gerak smooth)
    pos1.current.x += currentV1Ref.current * 0.6;
    pos2.current.x += currentV2Ref.current * 0.6;

    // Deteksi Tumbukan
    const distance = Math.abs(pos2.current.x - pos1.current.x);
    const minDistance = pos1.current.radius + pos2.current.radius;

    if (distance <= minDistance && !hasCollidedRef.current) {
      hasCollidedRef.current = true;
      setHasCollided(true);
      
      // Rumus Tumbukan 1 Dimensi dengan koefisien restitusi (e)
      const v1_new = (m1 * v1 + m2 * v2 + m2 * e * (v2 - v1)) / (m1 + m2);
      const v2_new = (m1 * v1 + m2 * v2 + m1 * e * (v1 - v2)) / (m1 + m2);
      
      currentV1Ref.current = v1_new;
      currentV2Ref.current = v2_new;
      setCurrentV1(v1_new);
      setCurrentV2(v2_new);

      // Hitung Energi Kinetik (Ek = 1/2 m v^2)
      const ekAwal = (0.5 * m1 * Math.pow(v1, 2)) + (0.5 * m2 * Math.pow(v2, 2));
      const ekAkhir = (0.5 * m1 * Math.pow(v1_new, 2)) + (0.5 * m2 * Math.pow(v2_new, 2));
      
      setEkTotal(ekAkhir);
      setEkLost(Math.max(0, ekAwal - ekAkhir));
      
      // Pisahkan bola agar tidak overlap / menyerap
      if (pos1.current.x < pos2.current.x) {
        const overlap = minDistance - distance;
        pos1.current.x -= overlap / 2 + 1;
        pos2.current.x += overlap / 2 + 1;
      }
    }

    drawCanvas(ctx, canvas.width, canvas.height, pos1.current.x, pos2.current.x);

    // Continue loop if balls inside canvas bounds
    if (pos1.current.x > -50 && pos1.current.x < canvas.width + 50 && 
        pos2.current.x > -50 && pos2.current.x < canvas.width + 50) {
       requestRef.current = requestAnimationFrame(updateSimulasi);
    } else {
       setIsSimulating(false);
    }
  }, [m1, v1, m2, v2, e, drawCanvas]);

  const resetSimulasi = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setIsSimulating(false);
    setHasCollided(false);
    hasCollidedRef.current = false;
    
    // Set ukuran radius visual berdasarkan massa
    pos1.current.radius = 20 + (m1 * 2);
    pos2.current.radius = 20 + (m2 * 2);
    
    // Reset posisi awal
    pos1.current.x = 120;
    pos2.current.x = 680;
    
    currentV1Ref.current = v1;
    currentV2Ref.current = v2;
    setCurrentV1(v1);
    setCurrentV2(v2);
    
    // Hitung Ek Awal
    const ekAwal = (0.5 * m1 * Math.pow(v1, 2)) + (0.5 * m2 * Math.pow(v2, 2));
    setEkTotal(ekAwal);
    setEkLost(0);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) drawCanvas(ctx, canvas.width, canvas.height, pos1.current.x, pos2.current.x);
    }
  }, [m1, v1, m2, v2, drawCanvas]);

  // Inisialisasi awal & update saat parameter berubah
  useEffect(() => {
    resetSimulasi();
  }, [m1, v1, m2, v2, e, resetSimulasi]);

  const startSimulasi = () => {
    if (!isSimulating) {
      setIsSimulating(true);
      updateSimulasi();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-200/80 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition mb-4 border border-zinc-300 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">Simulasi Tumbukan & Kekekalan Momentum</h1>
          <p className="text-zinc-500 font-medium">Uji coba koefisien restitusi (e) dan hilangnya Energi Kinetik pada tumbukan 1 dimensi.</p>
        </div>

        {/* Formula Card */}
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-wrap justify-around items-center gap-4 text-xs text-zinc-700">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold">Hukum Kekekalan Momentum:</span>
            <MathFormula formula="m_1 v_1 + m_2 v_2 = m_1 v_1' + m_2 v_2'" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold">Koefisien Restitusi (e):</span>
            <MathFormula formula="e = -\frac{v_2' - v_1'}{v_2 - v_1}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Panel Kontrol Kiri */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
              <h3 className="font-bold text-red-700 mb-4 border-b border-red-200 pb-2">Benda 1 (Merah)</h3>
              <label className="block text-sm font-semibold mb-2 text-zinc-700">Massa: {m1} kg</label>
              <input type="range" min="1" max="15" value={m1} onChange={(e) => setM1(Number(e.target.value))} className="w-full mb-4 accent-red-500 cursor-pointer" disabled={isSimulating} />
              
              <label className="block text-sm font-semibold mb-2 text-zinc-700">Kecepatan Awal: {v1} m/s</label>
              <input type="range" min="1" max="10" value={v1} onChange={(e) => setV1(Number(e.target.value))} className="w-full accent-red-500 cursor-pointer" disabled={isSimulating} />
            </div>

            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-700 mb-4 border-b border-blue-200 pb-2">Benda 2 (Biru)</h3>
              <label className="block text-sm font-semibold mb-2 text-zinc-700">Massa: {m2} kg</label>
              <input type="range" min="1" max="15" value={m2} onChange={(e) => setM2(Number(e.target.value))} className="w-full mb-4 accent-blue-500 cursor-pointer" disabled={isSimulating} />
              
              <label className="block text-sm font-semibold mb-2 text-zinc-700">Kecepatan Awal: {v2} m/s</label>
              <input type="range" min="-10" max="-1" value={v2} onChange={(e) => setV2(Number(e.target.value))} className="w-full accent-blue-500 cursor-pointer" disabled={isSimulating} />
            </div>
          </div>

          {/* Panel Visualisasi Tengah */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center">
               
               {/* Slider Restitusi di atas Canvas */}
               <div className="w-full max-w-md mb-6 p-4 bg-zinc-100 rounded-xl">
                 <label className="flex justify-between font-bold text-zinc-800 mb-2">
                   <span>Koefisien Restitusi (e)</span>
                   <span className="text-emerald-600 font-mono">{e.toFixed(1)}</span>
                 </label>
                 <input type="range" min="0" max="1" step="0.1" value={e} onChange={(e) => setE(Number(e.target.value))} className="w-full accent-emerald-500 cursor-pointer" disabled={isSimulating} />
                 <div className="flex justify-between text-xs text-zinc-500 mt-1 font-medium">
                    <span>(Tidak Lenting)</span> <span>(Lenting Sebagian)</span> <span>(Lenting Sempurna)</span>
                 </div>
               </div>

               <canvas ref={canvasRef} width={800} height={200} className="w-full bg-zinc-50 rounded-lg border border-zinc-200 mb-6" />

               <div className="flex gap-4 w-full">
                  <button onClick={startSimulasi} disabled={isSimulating} className="flex-1 bg-zinc-900 hover:bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-md active:scale-98">
                    <Play size={18} fill="currentColor"/> Mulai Tabrakan
                  </button>
                  <button onClick={resetSimulasi} className="px-6 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors active:scale-98">
                    <RotateCcw size={18} /> Reset
                  </button>
               </div>
            </div>

            {/* Panel Hasil & Transfer Energi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="block text-xs font-bold text-zinc-400 uppercase mb-2">Kecepatan Pasca Tumbukan</span>
                  <div className="text-sm font-semibold text-red-600">v1&apos; = {currentV1.toFixed(2)} m/s</div>
                  <div className="text-sm font-semibold text-blue-600">v2&apos; = {currentV2.toFixed(2)} m/s</div>
               </div>
               
               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <span className="block text-xs font-bold text-emerald-500 uppercase mb-1">Total Energi Kinetik</span>
                  <span className="text-2xl font-black text-emerald-700">{ekTotal.toFixed(1)} Joule</span>
               </div>

               <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
                  <Zap className={`absolute right-2 top-4 text-amber-200 opacity-50 ${ekLost > 0 ? 'animate-pulse' : ''}`} size={48} />
                  <span className="block text-xs font-bold text-amber-500 uppercase mb-1 z-10">Energi Hilang (Panas/Bunyi)</span>
                  <span className="text-2xl font-black text-amber-700 z-10">{ekLost.toFixed(1)} Joule</span>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
