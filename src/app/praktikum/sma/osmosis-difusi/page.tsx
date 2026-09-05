"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Droplet, 
  Layers, 
  Activity, 
  Eye, 
  Info,
  ArrowLeft,
  Sparkles,
  Gauge
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'water' | 'solute';
  radius: number;
}

export default function OsmosisSimulation() {
  // Mode praktikum: Tabung U Osmometer vs Sel Darah
  const [labMode, setLabMode] = useState<'u-tube' | 'cell'>('u-tube');

  // --- STATE TABUNG U OSMOSIS ---
  const [soluteLeft, setSoluteLeft] = useState<number>(5); // Persentase zat terlarut sisi kiri (0 - 40%)
  const [soluteRight, setSoluteRight] = useState<number>(30); // Persentase zat terlarut sisi kanan (0 - 40%)
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // --- STATE SEL DARAH MERAH ---
  const [tonicity, setTonicity] = useState<'hypotonic' | 'isotonic' | 'hypertonic'>('isotonic');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Perbedaan ketinggian kolom air (karena tekanan osmotik)
  // Air mengalir ke sisi dengan solute lebih pekat
  const [waterLevelDiff, setWaterLevelDiff] = useState<number>(0);

  // Inisialisasi partikel tabung U
  const initUTubeParticles = () => {
    const particles: Particle[] = [];
    const countWaterLeft = 70;
    const countWaterRight = 70;
    const countSoluteLeft = soluteLeft * 2;
    const countSoluteRight = soluteRight * 2;

    // Sisi Kiri (x: 70 - 230)
    for (let i = 0; i < countWaterLeft; i++) {
      particles.push({
        x: 75 + Math.random() * 155,
        y: 120 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 2.2,
        type: 'water',
        radius: 3.5,
      });
    }
    for (let i = 0; i < countSoluteLeft; i++) {
      particles.push({
        x: 75 + Math.random() * 155,
        y: 120 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        type: 'solute',
        radius: 8.5,
      });
    }

    // Sisi Kanan (x: 270 - 430)
    for (let i = 0; i < countWaterRight; i++) {
      particles.push({
        x: 275 + Math.random() * 155,
        y: 120 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 2.2,
        vy: (Math.random() - 0.5) * 2.2,
        type: 'water',
        radius: 3.5,
      });
    }
    for (let i = 0; i < countSoluteRight; i++) {
      particles.push({
        x: 275 + Math.random() * 155,
        y: 120 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        type: 'solute',
        radius: 8.5,
      });
    }

    particlesRef.current = particles;
    setWaterLevelDiff(0);
  };

  useEffect(() => {
    if (labMode === 'u-tube') {
      initUTubeParticles();
    }
  }, [soluteLeft, soluteRight, labMode]);

  // Efek kenaikan ketinggian kolom air (Tekanan Osmotik Menuju Kesetimbangan)
  useEffect(() => {
    if (!isRunning || labMode !== 'u-tube') return;

    const targetDiff = (soluteRight - soluteLeft) * 1.5; // Max selisih ~60px
    const interval = setInterval(() => {
      setWaterLevelDiff((prev) => {
        if (Math.abs(prev - targetDiff) < 0.2) return targetDiff;
        return prev + (targetDiff - prev) * 0.05;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [soluteLeft, soluteRight, isRunning, labMode]);

  // --- LOOP ANIMASI CANVAS (TABUNG U OSMOSIS) ---
  useEffect(() => {
    if (labMode !== 'u-tube') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!isRunning) return;

      const w = canvas.width;
      const h = canvas.height;
      const membraneX = w / 2; // Posisi membran tengah

      ctx.clearRect(0, 0, w, h);

      // Ketinggian kolom air kiri dan kanan
      const leftLevelY = 120 + waterLevelDiff; // jika air turun, Y membesar
      const rightLevelY = 120 - waterLevelDiff; // jika air naik, Y mengecil

      // 1. Gambar Tabung U Kaca
      ctx.fillStyle = 'rgba(14, 165, 233, 0.15)'; // Cairan air dasar
      ctx.fillRect(60, leftLevelY, membraneX - 60, 280 - leftLevelY);
      ctx.fillRect(membraneX, rightLevelY, w - 60 - membraneX, 280 - rightLevelY);

      // Garis kontur tabung
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Kiri luar & dasar
      ctx.moveTo(60, 60); ctx.lineTo(60, 280); ctx.lineTo(w - 60, 280); ctx.lineTo(w - 60, 60);
      ctx.stroke();

      // Permukaan air kiri dan kanan
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, leftLevelY); ctx.lineTo(membraneX, leftLevelY);
      ctx.moveTo(membraneX, rightLevelY); ctx.lineTo(w - 60, rightLevelY);
      ctx.stroke();

      // 2. Gambar Membran Selektif Permeabel (Tengah)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.setLineDash([8, 8]); // Pori-pori membran
      ctx.beginPath();
      ctx.moveTo(membraneX, 60);
      ctx.lineTo(membraneX, 280);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('MEMBRAN SEMIPERMEABEL (0.5 nm)', membraneX, 48);

      // 3. Update & Render Partikel
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Batas kiri & kanan tabung
        if (p.x - p.radius < 65) { p.x = 65 + p.radius; p.vx *= -1; }
        if (p.x + p.radius > w - 65) { p.x = w - 65 - p.radius; p.vx *= -1; }

        // Batas bawah tabung
        if (p.y + p.radius > 275) { p.y = 275 - p.radius; p.vy *= -1; }

        // Batas atas permukaan air dinamis
        const isLeft = p.x < membraneX;
        const currentSurfaceY = isLeft ? leftLevelY : rightLevelY;
        if (p.y - p.radius < currentSurfaceY) {
          p.y = currentSurfaceY + p.radius;
          p.vy *= -1;
        }

        // --- ATURAN MEMBRAN SELEKTIF ---
        // Partikel Solute (Besar) TIDAK BISA lewat membran tengah!
        if (p.type === 'solute') {
          if (isLeft && p.x + p.radius > membraneX) {
            p.x = membraneX - p.radius;
            p.vx *= -1;
          } else if (!isLeft && p.x - p.radius < membraneX) {
            p.x = membraneX + p.radius;
            p.vx *= -1;
          }
        } else {
          // Partikel Air (Kecil) BISA tembus pori membran!
          // Sedikit dorongan probabilitas osmotik menuju sisi pekat
          if (Math.abs(p.x - membraneX) < 8) {
            if (soluteRight > soluteLeft && Math.random() < 0.08) {
              p.vx = Math.abs(p.vx); // Ditarik ke kanan
            } else if (soluteLeft > soluteRight && Math.random() < 0.08) {
              p.vx = -Math.abs(p.vx); // Ditarik ke kiri
            }
          }
        }

        // Gambar Partikel
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (p.type === 'water') {
          ctx.fillStyle = '#38bdf8'; // Air (Biru muda)
          ctx.fill();
        } else {
          ctx.fillStyle = '#f97316'; // Zat terlarut sukrosa (Oranye besar)
          ctx.fill();
          ctx.strokeStyle = '#c2410c';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, labMode, waterLevelDiff, soluteLeft, soluteRight]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Biologi & Kimia SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 mb-1">
              Simulasi Osmosis & Transpor Membran
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Eksperimen transpor pasif molekul air melewati membran semipermeabel dan tonisitas sel darah merah.
            </p>
          </div>

          {/* Toggle Mode Praktikum */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLabMode('u-tube')}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                labMode === 'u-tube' 
                  ? 'bg-sky-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={14} /> Tabung-U Osmometer
            </button>
            <button
              type="button"
              onClick={() => setLabMode('cell')}
              className={`px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                labMode === 'cell' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye size={14} /> Mikroskop Sel Darah (Tonisitas)
            </button>
          </div>
        </header>

        {/* BANNER RUMUS OSMOSIS (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-sky-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Tekanan Osmotik (Van &apos;t Hoff):</span>
            <MathFormula formula="\pi = M \cdot R \cdot T \cdot i" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Potensial Air:</span>
            <MathFormula formula="\Psi = \Psi_s + \Psi_p" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Tekanan Hidrostatis Kolom:</span>
            <MathFormula formula="\Delta P = \rho \cdot g \cdot \Delta h" />
          </div>
        </div>

        {labMode === 'u-tube' ? (
          /* ================= MODE 1: TABUNG U OSMOMETER ================= */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {/* Panel Kontrol Kiri */}
            <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <Activity size={16} className="text-sky-400" /> Konsentrasi Larutan
              </h3>

              {/* Slider Kompartemen Kiri */}
              <div className="space-y-2">
                <label className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Zat Terlarut (Kiri):</span>
                  <span className="text-amber-400 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{soluteLeft}% Sukrosa</span>
                </label>
                <input
                  type="range" min="0" max="40" step="5"
                  value={soluteLeft}
                  onChange={(e) => setSoluteLeft(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">
                  {soluteLeft < soluteRight ? 'Hipotonis terhadap kanan' : soluteLeft > soluteRight ? 'Hipertonis terhadap kanan' : 'Isotonis (Seimbang)'}
                </div>
              </div>

              {/* Slider Kompartemen Kanan */}
              <div className="space-y-2">
                <label className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Zat Terlarut (Kanan):</span>
                  <span className="text-orange-400 font-mono font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{soluteRight}% Sukrosa</span>
                </label>
                <input
                  type="range" min="0" max="40" step="5"
                  value={soluteRight}
                  onChange={(e) => setSoluteRight(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="text-[10px] text-slate-400">
                  {soluteRight > soluteLeft ? 'Menarik air dari kiri!' : soluteRight < soluteLeft ? 'Menyerahkan air ke kiri' : 'Isotonis (Seimbang)'}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    isRunning 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30' 
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  }`}
                >
                  {isRunning ? <Pause size={14} /> : <Play size={14} />}
                  {isRunning ? 'Jeda' : 'Lanjutkan'}
                </button>
                <button
                  type="button"
                  onClick={() => { setSoluteLeft(5); setSoluteRight(30); initUTubeParticles(); }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 transition-colors"
                  title="Reset Kondisi"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Legenda Partikel */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span><strong>Molekul Air (H₂O):</strong> Bebas menembus pori.</span>
                </div>
                <div className="flex items-center gap-2 text-amber-300">
                  <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-700 shrink-0" />
                  <span><strong>Sukrosa:</strong> Terlalu besar, tertahan membran.</span>
                </div>
              </div>
            </div>

            {/* Kanvas Animasi Tabung-U & Hasil */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-2xl relative backdrop-blur">
                <div className="flex justify-between items-center mb-2 px-2 text-xs font-mono text-slate-400">
                  <span>KOMPARTEMEN A ({soluteLeft}% Solute)</span>
                  <span className="text-amber-400 font-bold">
                    ALIRAN NETTO AIR: {soluteLeft < soluteRight ? 'KANAN ➔' : soluteLeft > soluteRight ? '⬅ KIRI' : 'SEIMBANG ⇌'}
                  </span>
                  <span>KOMPARTEMEN B ({soluteRight}% Solute)</span>
                </div>

                <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
                  <canvas
                    ref={canvasRef}
                    width={680}
                    height={320}
                    className="w-full h-auto block"
                  />
                </div>
              </div>

              {/* Dashboard Tekanan Osmotik */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Perbedaan Ketinggian (Δh)</span>
                  <div className="text-2xl font-black text-sky-400 font-mono">
                    {Math.abs(waterLevelDiff * 0.8).toFixed(1)} <span className="text-xs font-normal text-slate-400">cm kolom air</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Akibat dorongan tekanan hidrostatis</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tekanan Osmotik (π)</span>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {(Math.abs(soluteRight - soluteLeft) * 0.24).toFixed(2)} <span className="text-xs font-normal text-slate-400">atm</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">π = M · R · T (Rumus Van &apos;t Hoff)</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-center shadow-md">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Kesetimbangan</span>
                  <span className="text-sm font-bold text-amber-300">
                    {Math.abs(soluteRight - soluteLeft) === 0 ? 'Kesetimbangan Dinamis Sempurna' : 'Perpindahan Osmotik Berlangsung'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Air bergerak menuju potensial air lebih rendah</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= MODE 2: MIKROSKOP TONISITAS SEL DARAH ================= */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {/* Panel Pilihan Tonisitas */}
            <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit backdrop-blur">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <Eye size={16} className="text-emerald-400" /> Lingkungan Ekstraseluler
              </h3>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTonicity('hypotonic')}
                  className={`w-full p-3 text-left rounded-xl border text-xs font-bold transition-all ${
                    tonicity === 'hypotonic'
                      ? 'bg-sky-950/80 text-sky-200 border-sky-400 shadow-md ring-1 ring-sky-400/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm text-white font-bold mb-1">Larutan Hipotonis</div>
                  <div className="text-[11px] text-slate-400">Air murni / Salin encer (&lt; 0.9% NaCl)</div>
                  <div className="text-sky-400 font-mono mt-1">Efek: Lisis (Pecah / Hemolisis)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTonicity('isotonic')}
                  className={`w-full p-3 text-left rounded-xl border text-xs font-bold transition-all ${
                    tonicity === 'isotonic'
                      ? 'bg-emerald-950/80 text-emerald-200 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm text-white font-bold mb-1">Larutan Isotonis</div>
                  <div className="text-[11px] text-slate-400">Salin Fisiologis (0.9% NaCl)</div>
                  <div className="text-emerald-400 font-mono mt-1">Efek: Bentuk Normal Bikonkaf</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTonicity('hypertonic')}
                  className={`w-full p-3 text-left rounded-xl border text-xs font-bold transition-all ${
                    tonicity === 'hypertonic'
                      ? 'bg-rose-950/80 text-rose-200 border-rose-400 shadow-md ring-1 ring-rose-400/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm text-white font-bold mb-1">Larutan Hipertonis</div>
                  <div className="text-[11px] text-slate-400">Salin Pekat (&gt; 0.9% NaCl)</div>
                  <div className="text-rose-400 font-mono mt-1">Efek: Krenasi (Mengerut Berkerut)</div>
                </button>
              </div>
            </div>

            {/* Visualisasi Mikroskopis Sel Darah Merah (SVG Terpadu) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden backdrop-blur">
                
                {/* Lingkaran Bidang Pandang Lensa Mikroskop */}
                <div className="w-72 h-72 rounded-full border-4 border-slate-700 bg-slate-950/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex items-center justify-center overflow-hidden">
                  
                  {/* Efek Garis Silang Fokus Mikroskop (Crosshairs) */}
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="w-full h-0.5 bg-slate-400 absolute top-1/2 -translate-y-1/2" />
                    <div className="h-full w-0.5 bg-slate-400 absolute left-1/2 -translate-x-1/2" />
                  </div>

                  {/* MORFOLOGI SEL DARAH MERAH SESUAI TONISITAS */}
                  {tonicity === 'isotonic' && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                      {/* Bikonkaf Sehat Normal */}
                      <div className="w-36 h-36 rounded-full bg-gradient-to-br from-red-600 via-rose-700 to-red-900 border-4 border-rose-500 shadow-2xl flex items-center justify-center relative">
                        <div className="w-16 h-16 rounded-full bg-red-950/60 shadow-inner border border-red-800/60" />
                      </div>
                      <span className="text-xs font-bold text-emerald-400 mt-4">Sel Darah Normal (Bikonkaf)</span>
                    </div>
                  )}

                  {tonicity === 'hypotonic' && (
                    <div className="flex flex-col items-center animate-in zoom-in-110 duration-500">
                      {/* Menggembung & Lisis Pecah */}
                      <div className="w-44 h-44 rounded-full bg-red-500/80 border-4 border-dashed border-rose-300 shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center justify-center animate-pulse relative">
                        <span className="text-white font-black text-xs uppercase tracking-widest bg-red-950/80 px-2 py-1 rounded border border-red-700">
                          HEMOLISIS (PECAH)
                        </span>
                      </div>
                      <span className="text-xs font-bold text-sky-400 mt-4">Air Masuk Berlebihan (Endoosmosis)</span>
                    </div>
                  )}

                  {tonicity === 'hypertonic' && (
                    <div className="flex flex-col items-center animate-in zoom-in-75 duration-500">
                      {/* Mengerut Krenasi Berduri */}
                      <div className="w-28 h-28 bg-red-900 border-2 border-red-700 shadow-lg relative flex items-center justify-center"
                        style={{
                          clipPath: 'polygon(50% 0%, 65% 25%, 98% 35%, 75% 60%, 85% 95%, 50% 75%, 15% 95%, 25% 60%, 2% 35%, 35% 25%)',
                        }}
                      >
                        <div className="w-10 h-10 bg-black/60 rounded-full" />
                      </div>
                      <span className="text-xs font-bold text-rose-400 mt-4">Krenasi (Sel Mengerut Berkerut)</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xs text-slate-300 text-center max-w-md leading-relaxed">
                  {tonicity === 'isotonic' && 'Pada cairan isotonis, laju air keluar dan masuk membran sel berada pada keseimbangan dinamis yang sama.'}
                  {tonicity === 'hypotonic' && 'Karena konsentrasi luar lebih encer, molekul air menyerbu masuk ke dalam eritrosit sampai membran sel pecah (lisis).'}
                  {tonicity === 'hypertonic' && 'Air dari sitoplasma ditarik keluar menuju lingkungan hipertonis, mengakibatkan sitoskeleton kolaps dan sel mengerut (krenasi).'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Catatan Pedagogis */}
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
          <Info size={20} className="text-sky-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-1">Prinsip Termodinamika Potensial Air & Osmosis:</strong>
            Molekul pelarut (air murni) bergerak menuruni gradien konsentrasi airnya sendiri (dari potensial air tinggi ke potensial air rendah). Semakin pekat konsentrasi zat terlarut, semakin rendah potensial airnya, dan semakin besar gaya hisap tekanan osmotiknya (<MathFormula formula="\pi" />). Itulah sebabnya meminum air laut yang hipertonis justru memperparah dehidrasi sel-sel tubuh manusia!
          </div>
        </div>

      </div>
    </div>
  );
}
