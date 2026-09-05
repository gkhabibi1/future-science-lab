"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  CloudRain, 
  Sun, 
  Wind, 
  Thermometer, 
  Droplets, 
  ArrowLeft, 
  RotateCcw, 
  Play, 
  Pause, 
  Info, 
  Sparkles,
  Layers
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function SiklusAirPage() {
  // --- STATE PARAMETER ---
  const [sunIntensity, setSunIntensity] = useState<number>(75); // 10% - 100%
  const [windSpeed, setWindSpeed] = useState<number>(40); // 0 - 100 km/h
  const [temperature, setTemperature] = useState<number>(30); // 15°C - 42°C
  const [activeFocus, setActiveFocus] = useState<'all' | 'evaporasi' | 'kondensasi' | 'presipitasi'>('all');
  const [isRunning, setIsRunning] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // --- HITUNGAN ILMIAH DAUR AIR ---
  // Laju Evaporasi (mm/hari) bergantung pada radiasi matahari & kecepatan angin
  const evaporationRate = Number((((sunIntensity / 100) * 4.5) * (1 + (windSpeed / 100) * 0.4) * (temperature / 28)).toFixed(2));
  
  // Kelembaban Relatif Udara (RH %)
  const relativeHumidity = Math.min(98, Math.round(40 + (evaporationRate * 7.5) - (windSpeed * 0.15)));
  
  // Curah Hujan Presipitasi (mm/jam) jika RH > 65%
  const precipitationRate = relativeHumidity > 65 
    ? Number(((relativeHumidity - 65) * 0.45 * (sunIntensity / 70)).toFixed(1)) 
    : 0;

  const resetParams = () => {
    setSunIntensity(75);
    setWindSpeed(40);
    setTemperature(30);
    setActiveFocus('all');
    setIsRunning(true);
  };

  // --- ANIMASI SIKLUS AIR CRISP HD RETINA CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Partikel Uap Air (Evaporasi)
    const vaporParticles: Array<{ x: number; y: number; vy: number; vx: number; alpha: number; size: number }> = [];
    for (let i = 0; i < 60; i++) {
      vaporParticles.push({
        x: 400 + Math.random() * 360,
        y: 280 + Math.random() * 80,
        vy: 0.6 + Math.random() * 1.2,
        vx: (Math.random() - 0.5) * 0.4,
        alpha: 0.2 + Math.random() * 0.6,
        size: 2.5 + Math.random() * 3.5
      });
    }

    // Partikel Hujan (Presipitasi)
    const raindrops: Array<{ x: number; y: number; vy: number; vx: number; length: number }> = [];
    for (let i = 0; i < 90; i++) {
      raindrops.push({
        x: 140 + Math.random() * 360,
        y: 110 + Math.random() * 180,
        vy: 5 + Math.random() * 5,
        vx: -0.5 - (windSpeed / 100) * 2,
        length: 8 + Math.random() * 10
      });
    }

    let time = 0;

    const render = () => {
      if (!isRunning) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      // Bersihkan kanvas
      ctx.clearRect(0, 0, w, h);

      // 1. Langit Atmosfer Gradien
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
      if (sunIntensity > 50) {
        skyGrad.addColorStop(0, '#0c4a6e'); // Biru cerah deep
        skyGrad.addColorStop(0.6, '#0284c7');
        skyGrad.addColorStop(1, '#38bdf8');
      } else {
        skyGrad.addColorStop(0, '#1e293b'); // Mendung kelabu
        skyGrad.addColorStop(0.6, '#334155');
        skyGrad.addColorStop(1, '#64748b');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.75);

      // 2. Matahari & Corona Panas
      const sunX = w - 90;
      const sunY = 65;
      const sunRadius = 32;

      // Glow Matahari
      const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.4, sunX, sunY, sunRadius * 2.8 * (sunIntensity / 65));
      sunGlow.addColorStop(0, 'rgba(253, 224, 71, 0.9)');
      sunGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.4)');
      sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Inti Matahari
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Gunung Pegunungan Terjal (Kiri)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.75);
      ctx.lineTo(0, h * 0.35);
      ctx.lineTo(130, h * 0.22); // Puncak gunung
      ctx.lineTo(260, h * 0.52);
      ctx.lineTo(340, h * 0.45);
      ctx.lineTo(440, h * 0.75);
      ctx.closePath();
      ctx.fill();

      // Salju / Es Puncak Gunung
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(95, h * 0.27);
      ctx.lineTo(130, h * 0.22);
      ctx.lineTo(165, h * 0.29);
      ctx.lineTo(150, h * 0.32);
      ctx.lineTo(130, h * 0.30);
      ctx.lineTo(110, h * 0.33);
      ctx.closePath();
      ctx.fill();

      // Aliran Sungai Pegunungan Menuju Laut (Runoff)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(130, h * 0.32);
      ctx.quadraticCurveTo(200, h * 0.5, 230, h * 0.6);
      ctx.quadraticCurveTo(280, h * 0.7, 430, h * 0.76);
      ctx.stroke();

      // 4. Lautan Air Dalam (Kanan)
      const oceanGrad = ctx.createLinearGradient(0, h * 0.72, 0, h);
      oceanGrad.addColorStop(0, '#0369a1');
      oceanGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(400, h * 0.72, w - 400, h * 0.28);

      // Dataran Pantai
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.75);
      ctx.lineTo(400, h * 0.75);
      ctx.lineTo(400, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Ombak Laut Bergerak
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.moveTo(400, h * 0.74);
      for (let x = 400; x <= w; x += 15) {
        const waveY = h * 0.74 + Math.sin((x * 0.03) + (time * 3)) * 4;
        ctx.lineTo(x, waveY);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(400, h);
      ctx.closePath();
      ctx.fill();

      // 5. Tahap 1: EVAPORASI (Uap Air Naik dari Laut)
      if (activeFocus === 'all' || activeFocus === 'evaporasi') {
        for (let i = 0; i < vaporParticles.length; i++) {
          const p = vaporParticles[i];
          p.y -= p.vy * (evaporationRate / 3.5);
          p.x -= (windSpeed / 100) * 1.5;

          // Render partikel uap
          ctx.fillStyle = `rgba(224, 242, 254, ${p.alpha * (sunIntensity / 75)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Reset saat mencapai ketinggian awan
          if (p.y < 120 || p.x < 150) {
            p.y = h * 0.74 + Math.random() * 40;
            p.x = 420 + Math.random() * (w - 440);
          }
        }

        // Teks Penanda Evaporasi
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('1. EVAPORASI & TRANSPIRASI ↑', 510, h * 0.65);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#93c5fd';
        ctx.fillText(`${evaporationRate} mm/hari`, 540, h * 0.68);
      }

      // 6. Tahap 2: KONDENSASI (Pembentukan Awan Kumulus Tebal)
      if (activeFocus === 'all' || activeFocus === 'kondensasi') {
        const cloudX = 220;
        const cloudY = 90;
        const cloudDarkness = Math.min(180, Math.max(70, 240 - (relativeHumidity * 1.8)));

        // Puff 1
        ctx.fillStyle = `rgb(${cloudDarkness}, ${cloudDarkness + 10}, ${cloudDarkness + 25})`;
        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 40, 0, Math.PI * 2);
        ctx.arc(cloudX + 45, cloudY - 15, 48, 0, Math.PI * 2);
        ctx.arc(cloudX + 95, cloudY - 5, 42, 0, Math.PI * 2);
        ctx.arc(cloudX + 140, cloudY + 5, 35, 0, Math.PI * 2);
        ctx.arc(cloudX + 60, cloudY + 20, 40, 0, Math.PI * 2);
        ctx.fill();

        // Teks Penanda Kondensasi
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('2. KONDENSASI (Awan Dingin)', cloudX - 10, cloudY - 45);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#67e8f9';
        ctx.fillText(`RH: ${relativeHumidity}%`, cloudX + 40, cloudY - 30);
      }

      // 7. Tahap 3: PRESIPITASI (Tetesan Hujan Jatuh)
      if ((activeFocus === 'all' || activeFocus === 'presipitasi') && precipitationRate > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < raindrops.length; i++) {
          const r = raindrops[i];
          r.y += r.vy;
          r.x += r.vx;

          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x + r.vx * 1.5, r.y + r.length);
          ctx.stroke();

          // Reset saat jatuh ke tanah/pegunungan
          if (r.y > h * 0.72) {
            r.y = 95 + Math.random() * 20;
            r.x = 180 + Math.random() * 220;
          }
        }

        // Teks Penanda Presipitasi
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('3. PRESIPITASI (Hujan) ↓', 160, 200);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#bae6fd';
        ctx.fillText(`${precipitationRate} mm/jam`, 185, 218);
      }

      // 8. Tahap 4: INFILTRASI & RUNOFF
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('4. INFILTRASI & RUNOFF →', 160, h * 0.85);

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [sunIntensity, windSpeed, temperature, activeFocus, isRunning, evaporationRate, relativeHumidity, precipitationRate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-cyan-500 selection:text-white">
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
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Sains &amp; Lingkungan Hidup • SD / MI
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <CloudRain className="text-cyan-400" size={24} />
              Simulasi Siklus Air &amp; Daur Hidrologi Bumi
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Memvisualisasikan perjalanan molekul air melalui penguapan laut, kondensasi awan, curah hujan ke daratan, hingga aliran air tanah secara dinamis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isRunning 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isRunning ? <><Pause size={15} /> Jeda Daur</> : <><Play size={15} /> Lanjutkan Daur</>}
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

        {/* KaTeX Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Laju Evaporasi:</span>
            <MathFormula formula="E = k \cdot I_{\text{sun}} \cdot (1 + 0.1 v_{\text{wind}})" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Hukum Kesetimbangan Air:</span>
            <MathFormula formula="P = E + R + \Delta S" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Kelembaban Relatif:</span>
            <MathFormula formula="\text{RH} = \frac{e}{e_s(T)} \times 100\%" />
          </div>
        </div>

        {/* 4-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-xl h-fit space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers size={16} className="text-cyan-400"/> Faktor Lingkungan
              </h2>
            </div>

            <div className="space-y-5">
              {/* Fokus Tahapan */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Fokus Tahapan Siklus</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setActiveFocus('all')}
                    className={`py-1.5 rounded-lg font-bold transition ${activeFocus === 'all' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    Semua Tahap
                  </button>
                  <button
                    onClick={() => setActiveFocus('evaporasi')}
                    className={`py-1.5 rounded-lg font-bold transition ${activeFocus === 'evaporasi' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    1. Penguapan
                  </button>
                  <button
                    onClick={() => setActiveFocus('kondensasi')}
                    className={`py-1.5 rounded-lg font-bold transition ${activeFocus === 'kondensasi' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    2. Awan
                  </button>
                  <button
                    onClick={() => setActiveFocus('presipitasi')}
                    className={`py-1.5 rounded-lg font-bold transition ${activeFocus === 'presipitasi' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    3. Hujan
                  </button>
                </div>
              </div>

              {/* Intensitas Sinar Matahari */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5"><Sun size={13} className="text-amber-400" /> Radiasi Matahari</span>
                  <span className="text-amber-400 font-mono font-bold">{sunIntensity}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" step="5"
                  value={sunIntensity} 
                  onChange={(e) => setSunIntensity(Number(e.target.value))} 
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
              </div>

              {/* Kecepatan Angin */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5"><Wind size={13} className="text-teal-400" /> Kecepatan Angin</span>
                  <span className="text-teal-400 font-mono font-bold">{windSpeed} km/h</span>
                </div>
                <input 
                  type="range" min="0" max="90" step="5"
                  value={windSpeed} 
                  onChange={(e) => setWindSpeed(Number(e.target.value))} 
                  className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
              </div>

              {/* Suhu Udara Permukaan */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5"><Thermometer size={13} className="text-rose-400" /> Suhu Udara Laut</span>
                  <span className="text-rose-400 font-mono font-bold">{temperature}°C</span>
                </div>
                <input 
                  type="range" min="18" max="42" step="1"
                  value={temperature} 
                  onChange={(e) => setTemperature(Number(e.target.value))} 
                  className="w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
              </div>

              {/* Status Daur */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-xs">
                <div className="text-[10px] font-bold uppercase text-slate-400">Status Cuaca Terkini:</div>
                <div className="text-white font-medium">
                  {precipitationRate > 2.5 ? '🌧️ Hujan Deras di Pegunungan' : precipitationRate > 0 ? '🌦️ Gerimis Ringan' : '☀️ Cerah Berawan, Evaporasi Tinggi'}
                </div>
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
                className="w-full h-auto bg-[#082f49] block rounded-xl border border-slate-800/60 shadow-2xl" 
              />
            </div>

            {/* Dashboard Telemetri 3-Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Evaporasi */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sun size={13} className="text-amber-400" /> Laju Penguapan (<MathFormula formula="E" />)
                </div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {evaporationRate} <span className="text-xs font-normal text-slate-400">mm/hari</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Air laut berubah wujud menjadi uap gas
                </div>
              </div>

              {/* Card 2: Kelembaban / Awan */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Droplets size={13} className="text-cyan-400" /> Kelembaban Udara (<MathFormula formula="\text{RH}" />)
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {relativeHumidity}%
                </div>
                <div className="text-[10px] text-slate-500">
                  Kerapatan titik-titik embun di atmosfer
                </div>
              </div>

              {/* Card 3: Presipitasi Hujan */}
              <div className={`backdrop-blur border p-4 rounded-2xl shadow-md space-y-1 transition ${
                precipitationRate > 0 
                  ? 'bg-sky-950/40 border-sky-500/40 text-sky-300' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}>
                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CloudRain size={13} className={precipitationRate > 0 ? "text-sky-400" : "text-slate-500"} /> 
                  Curah Hujan (<MathFormula formula="P" />)
                </div>
                <div className="text-2xl font-black font-mono">
                  {precipitationRate} <span className="text-xs font-normal opacity-70">mm/jam</span>
                </div>
                <div className="text-[10px] opacity-80">
                  {precipitationRate > 0 ? 'Air kembali membasahi lereng daratan' : 'Awan belum mencapai titik jenuh'}
                </div>
              </div>
            </div>

            {/* Teori Sains Edukasi */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex gap-3.5 items-start">
              <div className="bg-cyan-500/10 p-2.5 rounded-xl text-cyan-400 border border-cyan-500/20 shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Hukum Kekekalan Massa dalam Siklus Hidrologi Bumi</h4>
                <p className="leading-relaxed text-slate-400">
                  Jumlah total air di planet Bumi bersifat tetap dan tidak pernah hilang atau bertambah; molekul air terus-menerus didaur ulang melalui 4 tahapan berkesinambungan:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li><strong>Evaporasi &amp; Transpirasi:</strong> Radiasi matahari memanaskan laut, danau, serta daun tumbuhan sehingga cairan menguap ke udara.</li>
                  <li><strong>Kondensasi:</strong> Saat uap air naik ke lapisan troposfer yang dingin, ia mengembun membentuk awan kumulus.</li>
                  <li><strong>Presipitasi:</strong> Ketika awan terlalu jenuh dan berat, butiran air jatuh kembali sebagai hujan atau salju.</li>
                  <li><strong>Infiltrasi &amp; Limpasan:</strong> Air diserap akar tanah, membentuk cadangan air tanah, atau mengalir melalui sungai kembali ke laut lepas.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
