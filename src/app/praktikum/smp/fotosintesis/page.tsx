"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Leaf, 
  Sun, 
  ArrowLeft, 
  RotateCcw, 
  Play, 
  Pause, 
  Flame, 
  Sparkles, 
  Info, 
  Layers, 
  Activity,
  Gauge
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface Bubble {
  x: number;
  y: number;
  vy: number;
  size: number;
  alpha: number;
}

export default function FotosintesisPage() {
  // --- STATE PARAMETER ---
  const [lightIntensity, setLightIntensity] = useState<number>(80); // 0 - 100%
  const [lightDistance, setLightDistance] = useState<number>(25); // 10 - 80 cm
  const [colorFilter, setColorFilter] = useState<'white' | 'blue' | 'red' | 'green'>('white');
  const [nahco3Grams, setNahco3Grams] = useState<number>(5); // 0 - 10 gram
  const [isRunning, setIsRunning] = useState<boolean>(true);
  
  // Akumulasi Gas & Uji Bara Api
  const [o2VolumeMl, setO2VolumeMl] = useState<number>(0);
  const [testedSplint, setTestedSplint] = useState<boolean>(false);
  const [splintFlare, setSplintFlare] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // --- MODEL FISIOLOGI PENYERAPAN SPEKTRUM KLOROFIL (ENGELMANN) ---
  const filterEfficiencies = {
    white: { eff: 1.0, hex: '#fef08a', name: 'Putih (Lengkap)' },
    blue: { eff: 0.95, hex: '#38bdf8', name: 'Biru (450 nm)' },
    red: { eff: 0.85, hex: '#f87171', name: 'Merah (660 nm)' },
    green: { eff: 0.12, hex: '#4ade80', name: 'Hijau (530 nm)' } // Dipantulkan klorofil!
  };

  const currentFilter = filterEfficiencies[colorFilter];

  // Hukum Kuadrat Terbalik Jarak Cahaya: I_efektif = I0 / r^2
  const distanceFactor = Math.pow(30 / Math.max(10, lightDistance), 1.5);
  const lightEffect = (lightIntensity / 100) * distanceFactor * currentFilter.eff;

  // Efek Konsentrasi CO2 (Michaelis-Menten)
  const co2Factor = (nahco3Grams + 0.5) / (nahco3Grams + 3.0);

  // Laju Produksi Gelembung O2 per Menit (BPM)
  const bubbleRateBPM = Math.min(120, Math.round(lightEffect * co2Factor * 135));

  // Efisiensi Fotosintetik Total (%)
  const photosyntheticEfficiencyPct = Math.min(100, Math.round((bubbleRateBPM / 120) * 100));

  const resetParams = () => {
    setLightIntensity(80);
    setLightDistance(25);
    setColorFilter('white');
    setNahco3Grams(5);
    setO2VolumeMl(0);
    setTestedSplint(false);
    setSplintFlare(false);
    setIsRunning(true);
  };

  const handleTestSplint = () => {
    if (o2VolumeMl < 0.2) return;
    setTestedSplint(true);
    setSplintFlare(true);
    setTimeout(() => {
      setSplintFlare(false);
    }, 2800);
  };

  // --- ANIMASI BUBBLES HD RETINA CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bubbles: Bubble[] = [];

    // Akumulasi gas O2 perlahan tiap interval
    const gasInterval = setInterval(() => {
      if (isRunning && bubbleRateBPM > 0) {
        setO2VolumeMl(prev => Math.min(3.5, Number((prev + (bubbleRateBPM * 0.0008)).toFixed(3))));
      }
    }, 500);

    const render = () => {
      if (!isRunning) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Bersihkan kanvas ruang laboratorium gelap
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Grid latar laboratorium
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // --- 1. SOROTAN LAMPU DENGAN FILTER WARNA ---
      const lampX = 90;
      const lampY = 160;
      const targetX = 460;
      const targetY = 220;

      // Sinar kerucut lampu
      const beamGrad = ctx.createLinearGradient(lampX, lampY, targetX, targetY);
      beamGrad.addColorStop(0, currentFilter.hex);
      beamGrad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = beamGrad;
      ctx.globalAlpha = (lightIntensity / 100) * 0.38;
      ctx.beginPath();
      ctx.moveTo(lampX + 30, lampY - 20);
      ctx.lineTo(targetX + 80, targetY - 100);
      ctx.lineTo(targetX + 80, targetY + 120);
      ctx.lineTo(lampX + 30, lampY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Rumah Lampu Reflektor
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lampX - 25, lampY - 35);
      ctx.lineTo(lampX + 25, lampY - 20);
      ctx.lineTo(lampX + 25, lampY + 20);
      ctx.lineTo(lampX - 25, lampY + 35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bohlam Lampu Berpijar
      ctx.fillStyle = currentFilter.hex;
      ctx.shadowColor = currentFilter.hex;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(lampX + 22, lampY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Tiang Penyangga Lampu
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lampX - 10, lampY + 35);
      ctx.lineTo(lampX - 10, h - 30);
      ctx.lineTo(lampX - 40, h - 30);
      ctx.lineTo(lampX + 20, h - 30);
      ctx.stroke();

      // Label Jarak Lampu
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`JARAK: ${lightDistance} cm`, lampX - 25, lampY - 45);

      // --- 2. GELAS BEAKER KACA BESAR ---
      const beakerX = targetX - 110;
      const beakerY = 80;
      const beakerW = 240;
      const beakerH = 260;
      const waterTopY = beakerY + 35;

      // Air Beker
      ctx.fillStyle = 'rgba(14, 116, 144, 0.25)';
      ctx.fillRect(beakerX + 5, waterTopY, beakerW - 10, beakerH - (waterTopY - beakerY) - 5);

      // Permukaan Air
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(beakerX + 5, waterTopY);
      ctx.lineTo(beakerX + beakerW - 5, waterTopY);
      ctx.stroke();

      // Gelas Beker Luar
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(beakerX, beakerY, beakerW, beakerH, [0, 0, 16, 16]);
      ctx.stroke();

      // --- 3. CORONG KACA TERBALIK (FUNNEL) ---
      const funnelCenterX = beakerX + beakerW / 2;
      const funnelBaseY = beakerY + beakerH - 25;
      const funnelTopY = beakerY + 120;
      const funnelStemTopY = beakerY + 65;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2;

      // Badan Segitiga Corong
      ctx.beginPath();
      ctx.moveTo(funnelCenterX - 85, funnelBaseY);
      ctx.lineTo(funnelCenterX - 14, funnelTopY);
      ctx.lineTo(funnelCenterX - 14, funnelStemTopY);
      ctx.lineTo(funnelCenterX + 14, funnelStemTopY);
      ctx.lineTo(funnelCenterX + 14, funnelTopY);
      ctx.lineTo(funnelCenterX + 85, funnelBaseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // --- 4. TABUNG REAKSI TERBALIK PENGUMPUL GAS O2 ---
      const tubeW = 24;
      const tubeH = 85;
      const tubeX = funnelCenterX - tubeW / 2;
      const tubeY = beakerY + 20;

      // Tabung Reaksi
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tubeX, tubeY, tubeW, tubeH, [10, 10, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Akumulasi Gas Oksigen di Ujung Atas Tabung Reaksi
      const gasHeightPx = Math.min(tubeH - 15, o2VolumeMl * 18);
      if (gasHeightPx > 0) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.beginPath();
        ctx.roundRect(tubeX + 2, tubeY + 2, tubeW - 4, gasHeightPx, [8, 8, 2, 2]);
        ctx.fill();

        // Label Oksigen Terkumpul
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`O₂`, tubeX + 5, tubeY + 16);
      }

      // --- 5. TUMBUHAN HYDRILLA VERTICILLATA ---
      ctx.strokeStyle = '#22c55e';
      ctx.fillStyle = '#16a34a';
      ctx.lineWidth = 2.5;

      // Batang utama
      for (let s = -1; s <= 1; s++) {
        const stemX = funnelCenterX + s * 30;
        ctx.beginPath();
        ctx.moveTo(stemX, funnelBaseY - 5);
        ctx.quadraticCurveTo(stemX + s * 10, funnelBaseY - 40, funnelCenterX + s * 12, funnelTopY + 15);
        ctx.stroke();

        // Daun-daun Hydrilla melingkar (whorled leaves)
        for (let ly = funnelBaseY - 15; ly > funnelTopY + 20; ly -= 14) {
          ctx.beginPath();
          ctx.ellipse(stemX - 10, ly, 7, 2.5, -0.4, 0, Math.PI * 2);
          ctx.ellipse(stemX + 10, ly, 7, 2.5, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Label Tanaman
      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('Hydrilla verticillata', funnelCenterX - 52, funnelBaseY + 16);

      // --- 6. GELEMBUNG GAS O2 NAIK KE ATAS ---
      // Spawn gelembung baru sesuai bubbleRateBPM
      if (Math.random() < (bubbleRateBPM / 180)) {
        bubbles.push({
          x: funnelCenterX + (Math.random() * 20 - 10),
          y: funnelTopY + 25,
          vy: 1.2 + Math.random() * 1.5,
          size: 2.2 + Math.random() * 2.5,
          alpha: 0.8
        });
      }

      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.vy;
        b.x += (Math.random() - 0.5) * 0.4;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Jika sampai di ujung atas tabung reaksi
        if (b.y <= tubeY + gasHeightPx + 4) {
          bubbles.splice(i, 1);
        }
      }

      // --- 7. UJI BARA API LIDI OKSIGEN ---
      if (splintFlare) {
        // Lidi membara di atas mulut tabung
        const splintX = tubeX + tubeW / 2;
        const splintY = tubeY - 8;

        // Batang Lidi Kayu
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(splintX - 35, splintY - 45);
        ctx.lineTo(splintX, splintY);
        ctx.stroke();

        // Kobaran Nyala Api Membara Terang
        const flameGrad = ctx.createRadialGradient(splintX, splintY, 4, splintX, splintY, 26);
        flameGrad.addColorStop(0, '#ffffff');
        flameGrad.addColorStop(0.3, '#fde047');
        flameGrad.addColorStop(0.7, '#f97316');
        flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.arc(splintX, splintY, 26, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('🔥 BARA MENYALA KOBAR (TERBUKTI GAS O₂!)', splintX - 120, splintY - 55);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      clearInterval(gasInterval);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [lightIntensity, lightDistance, colorFilter, nahco3Grams, isRunning, bubbleRateBPM, currentFilter, o2VolumeMl, splintFlare]);

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
                Fisiologi Tumbuhan • SMP / MTs
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Leaf className="text-emerald-400" size={24} />
              Simulasi Fotosintesis &amp; Pembentukan Gas Oksigen (\(O_2\))
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Uji Ingenhousz menggunakan tumbuhan air <em>Hydrilla verticillata</em> untuk mengamati laju produksi gelembung gas oksigen berdasarkan spektrum warna dan substrat \(CO_2\).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isRunning 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
              }`}
            >
              {isRunning ? <><Pause size={15} /> Jeda Proses</> : <><Play size={15} /> Lanjutkan Proses</>}
            </button>
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
            <span className="text-slate-400 font-bold">Reaksi Kimiawi Fotosintesis:</span>
            <MathFormula formula="6\text{CO}_2 + 6\text{H}_2\text{O} \xrightarrow{\text{cahaya + klorofil}} \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2\uparrow" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Kuadrat Terbalik Intensitas:</span>
            <MathFormula formula="I_{\text{efektif}} = \frac{I_0}{r^2}" />
          </div>
        </div>

        {/* 4-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-xl h-fit space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers size={16} className="text-emerald-400"/> Faktor Fotosintesis
              </h2>
            </div>

            <div className="space-y-5">
              {/* Filter Spektrum Warna Lampu */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Spektrum Filter Cahaya
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => setColorFilter('white')}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-left ${
                      colorFilter === 'white'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ☀️ Putih (Penuh)
                  </button>
                  <button
                    onClick={() => setColorFilter('blue')}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-left ${
                      colorFilter === 'blue'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🔵 Biru (450 nm)
                  </button>
                  <button
                    onClick={() => setColorFilter('red')}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-left ${
                      colorFilter === 'red'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🔴 Merah (660 nm)
                  </button>
                  <button
                    onClick={() => setColorFilter('green')}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition text-left ${
                      colorFilter === 'green'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🟢 Hijau (530 nm)
                  </button>
                </div>
                {colorFilter === 'green' && (
                  <p className="text-[10px] text-amber-400/90 mt-1.5 leading-tight">
                    ⚠️ Klorofil memantulkan warna hijau, sehingga laju fotosintesis turun drastis!
                  </p>
                )}
              </div>

              {/* Intensitas Cahaya Lampu */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5"><Sun size={13} className="text-amber-400" /> Daya Lampu</span>
                  <span className="text-amber-400 font-mono font-bold">{lightIntensity}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="5"
                  value={lightIntensity} 
                  onChange={(e) => setLightIntensity(Number(e.target.value))} 
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
              </div>

              {/* Jarak Lampu ke Beaker */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Jarak Lampu (<MathFormula formula="r" />)</span>
                  <span className="text-emerald-400 font-mono font-bold">{lightDistance} cm</span>
                </div>
                <input 
                  type="range" min="10" max="75" step="5"
                  value={lightDistance} 
                  onChange={(e) => setLightDistance(Number(e.target.value))} 
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                  <span>10 cm (Sangat Terang)</span>
                  <span>75 cm (Redup)</span>
                </div>
              </div>

              {/* Takaran NaHCO3 (Sumber CO2) */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Suplemen \(NaHCO_3\) (\(CO_2\))</span>
                  <span className="text-cyan-400 font-mono font-bold">{nahco3Grams} gram</span>
                </div>
                <input 
                  type="range" min="0" max="10" step="1"
                  value={nahco3Grams} 
                  onChange={(e) => setNahco3Grams(Number(e.target.value))} 
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Menyediakan gas Karbon Dioksida terlarut di air bagi tanaman.
                </p>
              </div>

              {/* Tombol Uji Bara Api Lidi Oksigen */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  onClick={handleTestSplint}
                  disabled={o2VolumeMl < 0.2 || splintFlare}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                    o2VolumeMl >= 0.2 
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Flame size={16} className={splintFlare ? 'animate-bounce text-red-600' : ''} />
                  <span>{splintFlare ? 'Bara Api Menyala!' : 'Uji Bara Api Lidi (\(O_2\))'}</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  {o2VolumeMl < 0.2 ? 'Tunggu sampai gas O₂ terkumpul minimal 0.2 mL' : 'Gas O₂ siap diuji dengan bara api!'}
                </p>
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
                height={380} 
                className="w-full h-auto bg-[#030712] block rounded-xl border border-slate-800/60 shadow-2xl" 
              />
            </div>

            {/* Dashboard Telemetri 3-Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Laju Gelembung */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Activity size={13} className="text-emerald-400" /> Laju Oksigen (BPM)
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {bubbleRateBPM} <span className="text-xs font-normal text-slate-400">gelembung/menit</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Frekuensi pembentukan gas oleh klorofil
                </div>
              </div>

              {/* Card 2: Akumulasi Gas O2 */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Gauge size={13} className="text-cyan-400" /> Gas Terkumpul di Tabung
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {o2VolumeMl.toFixed(3)} <span className="text-xs font-normal text-slate-400">mL</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Akumulasi murni gas Oksigen (\(O_2\))
                </div>
              </div>

              {/* Card 3: Efisiensi Fotosintesis */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" /> Efisiensi Penyerapan
                </div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {photosyntheticEfficiencyPct}%
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentFilter.name} (Bobot: {(currentFilter.eff * 100).toFixed(0)}%)
                </div>
              </div>
            </div>

            {/* Teori Sains Edukasi */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex gap-3.5 items-start">
              <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-400 border border-emerald-500/20 shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Eksperimen Historis Jan Ingenhousz &amp; T.W. Engelmann</h4>
                <p className="leading-relaxed text-slate-400">
                  Pada tahun 1779, fisikawan Belanda <strong>Jan Ingenhousz</strong> membuktikan bahwa tumbuhan hanya melepaskan gelembung gas oksigen saat terpapar cahaya matahari secara langsung, dan bukan di tempat gelap.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li><strong>Uji Pembuktian Gas Oksigen:</strong> Tabung reaksi diletakkan terbalik di atas corong untuk menampung gas. Ketika bara api lidi didekatkan, bara api akan menyala berkobar karena sifat oksigen yang mendukung pembakaran.</li>
                  <li><strong>Eksperimen Spektrum Engelmann (1883):</strong> Klorofil menyerap cahaya secara efektif pada panjang gelombang <strong>biru (±450 nm)</strong> dan <strong>merah (±660 nm)</strong>. Sebaliknya, warna hijau hampir tidak diserap melainkan dipantulkan kembali, sehingga daun tampak berwarna hijau bagi mata kita.</li>
                  <li><strong>Peran Natrium Bikarbonat (\(NaHCO_3\)):</strong> Di dalam air, \(NaHCO_3\) terurai menghasilkan \(CO_2\) terlarut yang berperan sebagai bahan baku esensial dalam reaksi gelap fotosintesis (Siklus Calvin).</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
