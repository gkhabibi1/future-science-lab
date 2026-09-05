"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Thermometer, 
  Droplet, 
  RotateCcw, 
  Activity, 
  Info, 
  Sparkles,
  ArrowLeft,
  TrendingUp,
  FlaskConical
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function EnzimKatalaseSimulation() {
  // --- STATE KONTROL PARAMETER ---
  const [temperature, setTemperature] = useState<number>(37); // Derajat Celsius (0 - 80)
  const [ph, setPh] = useState<number>(7); // Derajat Keasaman pH (1 - 13)
  const [isTestSplint, setIsTestSplint] = useState<boolean>(false); // Uji bara api lidi

  // Canvas Animasi Tabung
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const bubblesRef = useRef<{ x: number; y: number; r: number; speed: number }[]>([]);

  // --- MODEL MATEMATIKA KURVA ENZIM ---
  // 1. Kurva Suhu: naik bertahap, optimum di ~38°C, anjlok drastis setelah 45°C (denaturasi)
  const calcTempFactor = (t: number) => {
    if (t < 0) return 0;
    if (t <= 38) {
      // Q10 rule approximation up to optimum
      return Math.pow(t / 38, 2.2);
    } else if (t <= 60) {
      // Denaturasi termal cepat
      return Math.max(0, 1 - Math.pow((t - 38) / 18, 1.8));
    }
    return 0; // Rusak total > 60°C
  };

  // 2. Kurva pH: Bell curve simetris di sekitar pH netral 7.0
  const calcPhFactor = (p: number) => {
    // Optimum di pH 7.0, lebar toleransi ~ 2 unit pH
    const diff = Math.abs(p - 7.0);
    return Math.max(0, Math.exp(-Math.pow(diff / 1.8, 2)));
  };

  // Aktivitas Relatif Enzim (%) = TempFactor * PhFactor * 100
  const tempEff = calcTempFactor(temperature);
  const phEff = calcPhFactor(ph);
  const enzymeActivity = Math.round(tempEff * phEff * 100);

  // Status Kondisi Enzim
  let enzymeStatus = 'Optimal Aktif';
  let flameStatus = 'Menyala Terang Berkobar 🔥';
  if (temperature > 52 || ph < 3 || ph > 11) {
    enzymeStatus = 'Denaturasi Permanen (Sisi Aktif Rusak)';
    flameStatus = 'Padam (Tidak Ada O₂)';
  } else if (temperature < 15) {
    enzymeStatus = 'Inaktif Sementara (Kurang Energi Kinetik)';
    flameStatus = 'Hanya Membara Redup';
  } else if (enzymeActivity < 40) {
    enzymeStatus = 'Aktivitas Enzim Rendah';
    flameStatus = 'Menyala Kecil Sedang';
  }

  // Inisialisasi gelembung gas O2
  useEffect(() => {
    const bubbles = [];
    for (let i = 0; i < 40; i++) {
      bubbles.push({
        x: 135 + Math.random() * 50,
        y: 260 + Math.random() * 40,
        r: 1.5 + Math.random() * 3,
        speed: 0.8 + Math.random() * 1.5,
      });
    }
    bubblesRef.current = bubbles;
  }, []);

  // Animasi Canvas Tabung Reaksi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const tubeX = w / 2 - 35;
      const tubeY = 40;
      const tubeW = 70;
      const tubeH = 260;

      // 1. Gambar Ekstrak Hati + H2O2 di Dasar Tabung (Cokelat Keabu-abuan)
      const liquidH = 50;
      ctx.fillStyle = '#78350f'; // Warna ekstrak hati
      ctx.fillRect(tubeX + 4, tubeY + tubeH - liquidH, tubeW - 8, liquidH - 4);
      ctx.beginPath();
      ctx.arc(tubeX + tubeW / 2, tubeY + tubeH - 6, (tubeW - 8) / 2, 0, Math.PI);
      ctx.fill();

      // 2. Kolom Busa O2 (Tinggi busa proporsional dengan enzymeActivity)
      const maxFoamH = 170;
      const currentFoamH = (enzymeActivity / 100) * maxFoamH;

      if (currentFoamH > 4) {
        ctx.fillStyle = 'rgba(241, 245, 249, 0.88)'; // Busa putih
        ctx.fillRect(tubeX + 4, tubeY + tubeH - liquidH - currentFoamH, tubeW - 8, currentFoamH);

        // Tekstur gelembung di permukaan atas busa
        for (let x = tubeX + 8; x < tubeX + tubeW - 8; x += 10) {
          ctx.beginPath();
          ctx.arc(x, tubeY + tubeH - liquidH - currentFoamH, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fill();
        }
      }

      // 3. Gelembung O2 Naik dari Ekstrak Hati
      if (enzymeActivity > 5) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        const bubbleSpeedMultiplier = (enzymeActivity / 100) * 2.5;

        bubblesRef.current.forEach((b) => {
          b.y -= b.speed * bubbleSpeedMultiplier;
          // Loop gelembung kembali ke bawah
          if (b.y < tubeY + tubeH - liquidH - currentFoamH) {
            b.y = tubeY + tubeH - 20;
            b.x = tubeX + 12 + Math.random() * (tubeW - 24);
          }
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // 4. Tabung Reaksi Kaca (Garis Kontur)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(tubeX, tubeY);
      ctx.lineTo(tubeX, tubeY + tubeH - 30);
      // Dasar setengah lingkaran tabung
      ctx.arc(tubeX + tubeW / 2, tubeY + tubeH - 30, tubeW / 2, 0, Math.PI);
      ctx.lineTo(tubeX + tubeW, tubeY);
      ctx.stroke();

      // Mulut tabung dengan bibir kaca
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.strokeRect(tubeX - 4, tubeY - 4, tubeW + 8, 8);

      // Skala tabung reaksi
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
      ctx.lineWidth = 1;
      for (let y = tubeY + 40; y < tubeY + tubeH - 40; y += 25) {
        ctx.beginPath();
        ctx.moveTo(tubeX + 4, y);
        ctx.lineTo(tubeX + 14, y);
        ctx.stroke();
      }

      // 5. UJI BARA API LIDI (JIKA DIAKTIFKAN)
      if (isTestSplint) {
        const splintX = tubeX + tubeW / 2;
        const splintY = tubeY - 10;

        // Batang lidi kayu
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(splintX - 55, splintY - 55);
        ctx.lineTo(splintX, splintY);
        ctx.stroke();

        // Nyala bara api / lidah api
        if (enzymeActivity > 40) {
          // Api berkobar terang
          const flameSize = 12 + (enzymeActivity / 100) * 16;
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(splintX, splintY, flameSize, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = '#fef08a';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(splintX, splintY, flameSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (enzymeActivity > 5) {
          // Bara kecil merah redup
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(splintX, splintY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Padam (titik arang hitam)
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(splintX, splintY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [enzymeActivity, isTestSplint]);

  const resetParams = () => {
    setTemperature(37);
    setPh(7);
    setIsTestSplint(false);
  };

  // Helper untuk menggambar kurva SVG Bell-curve Suhu
  const renderTempPath = () => {
    const points: string[] = [];
    for (let t = 0; t <= 80; t += 2) {
      const x = 35 + (t / 80) * 230;
      const y = 90 - calcTempFactor(t) * 75;
      points.push(`${t === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // Helper untuk menggambar kurva SVG Bell-curve pH
  const renderPhPath = () => {
    const points: string[] = [];
    for (let p = 1; p <= 13; p += 0.5) {
      const x = 35 + ((p - 1) / 12) * 230;
      const y = 90 - calcPhFactor(p) * 75;
      points.push(`${p === 1 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return points.join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Biologi SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 mb-1">
              Simulasi Aktivitas Enzim Katalase
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Penguraian racun 2 H₂O₂ ➔ 2 H₂O + O₂ (gas) oleh enzim katalase hati terhadap variasi temperatur dan derajat keasaman pH.
            </p>
          </div>

          <button
            onClick={resetParams}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600 shadow-sm"
          >
            <RotateCcw size={15} /> Reset Fisiologis (37°C, pH 7)
          </button>
        </header>

        {/* BANNER RUMUS METABOLISME ENZIM (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Reaksi Katalitik Katalase:</span>
            <MathFormula formula="2\text{H}_2\text{O}_2 \xrightarrow{\text{Katalase}} 2\text{H}_2\text{O} + \text{O}_2\uparrow" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Suhu Optimum Tubuh:</span>
            <MathFormula formula="T_{\text{opt}} \approx 37^\circ\text{C} - 40^\circ\text{C}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">pH Optimum Netral:</span>
            <MathFormula formula="\text{pH}_{\text{opt}} \approx 7.0" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (SUHU & pH) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" /> Variabel Uji Katalitik
            </h3>

            {/* Slider Suhu (°C) */}
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Thermometer size={15} /> Suhu Tabung:
                </span>
                <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{temperature}°C</span>
              </label>
              <input
                type="range" min="0" max="80" step="1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0°C (Beku)</span>
                <span className="text-emerald-400 font-bold">37°C</span>
                <span>80°C (Panas)</span>
              </div>
            </div>

            {/* Slider Derajat Keasaman (pH) */}
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <Droplet size={15} /> Derajat Keasaman (pH):
                </span>
                <span className="text-white font-mono font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">pH {ph}</span>
              </label>
              <input
                type="range" min="1" max="13" step="1"
                value={ph}
                onChange={(e) => setPh(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span className="text-rose-400">pH 1 (Asam)</span>
                <span className="text-emerald-400 font-bold">pH 7</span>
                <span className="text-purple-400">pH 13 (Basa)</span>
              </div>
            </div>

            {/* Tombol Uji Bara Api Lidi */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => setIsTestSplint(!isTestSplint)}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                  isTestSplint
                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse shadow-amber-900/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Flame size={16} className={isTestSplint ? 'text-white' : 'text-amber-400'} />
                {isTestSplint ? 'Tarik Lidi Bara Api' : 'Dekatkan Lidi Bara Api'}
              </button>
              <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                Membuktikan keberadaan gas <MathFormula formula="\text{O}_2" /> di mulut tabung reaksi.
              </p>
            </div>

            {/* Presets Cepat */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-bold block">Preset Pengujian Standar:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => { setTemperature(37); setPh(7); }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-[11px] font-semibold text-emerald-300 border border-slate-800 text-left transition-colors"
                >
                  Fisiologis (37°C, pH 7)
                </button>
                <button
                  type="button"
                  onClick={() => { setTemperature(70); setPh(7); }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-[11px] font-semibold text-rose-300 border border-slate-800 text-left transition-colors"
                >
                  Dididihkan (70°C)
                </button>
                <button
                  type="button"
                  onClick={() => { setTemperature(37); setPh(2); }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-[11px] font-semibold text-amber-300 border border-slate-800 text-left transition-colors"
                >
                  Asam Kuat (pH 2)
                </button>
                <button
                  type="button"
                  onClick={() => { setTemperature(4); setPh(7); }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-[11px] font-semibold text-sky-300 border border-slate-800 text-left transition-colors"
                >
                  Air Es (4°C)
                </button>
              </div>
            </div>
          </div>

          {/* AREA KANVAS TABUNG & DASHBOARD HASIL (KANAN) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Ruang Canvas Tabung Reaksi */}
            <div className="bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col items-center justify-center backdrop-blur">
              
              {/* Box Indikator Status di Atas Kanvas */}
              <div className="w-full max-w-[500px] flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 bg-slate-950/85 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-800 backdrop-blur">
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Kondisi Protein Enzim</span>
                    <span className={`font-bold text-xs sm:text-sm ${enzymeActivity > 60 ? 'text-emerald-400' : enzymeActivity > 20 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {enzymeStatus}
                    </span>
                  </div>
                </div>

                {isTestSplint && (
                  <div className="bg-slate-950/85 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-amber-500/50 flex items-center gap-2 backdrop-blur">
                    <Flame size={15} className="text-amber-400 animate-bounce" />
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold tracking-wider">Hasil Bara Api</span>
                      <span className="font-bold text-xs sm:text-sm text-amber-300">{flameStatus}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full max-w-[500px] overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
                <canvas
                  ref={canvasRef}
                  width={550}
                  height={330}
                  className="w-full h-auto block"
                />
              </div>

              <div className="flex justify-between items-center w-full max-w-[500px] mt-2 text-[11px] text-slate-500">
                <span>Ekstrak Hati + H₂O₂ di Dasar</span>
                <span>Busa Putih Gas Oksigen di Mulut Tabung</span>
              </div>
            </div>

            {/* Dashboard Hasil Aktivitas & Produksi O2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aktivitas Katalitik Relatif</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400 font-mono">{enzymeActivity}%</span>
                  <span className="text-xs text-slate-400">dari laju optimum</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-700/60">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                    style={{ width: `${enzymeActivity}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Volume Busa Gas O₂</span>
                <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                  {enzymeActivity > 80 ? '++++ (Sangat Banyak)' : enzymeActivity > 50 ? '+++ (Banyak)' : enzymeActivity > 20 ? '++ (Sedang)' : enzymeActivity > 5 ? '+ (Sedikit)' : '- (Tidak Ada)'}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Mengisi kolom vertikal tabung</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-center shadow-md">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" /> Hasil Reaksi Penguraian
                </span>
                <span className="text-sm font-bold text-slate-200">
                  {enzymeActivity > 0 ? 'Racun H₂O₂ Berhasil Terurai' : 'H₂O₂ Tidak Terurai'}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">2 H₂O₂ ➔ 2 H₂O + O₂</p>
              </div>

            </div>

            {/* Grafik 2D Respons Suhu & pH Real-Time (Bell-shaped Gaussian Curves) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Kurva Suhu */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <TrendingUp size={13} /> Kurva Aktivitas vs Suhu (T)
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">T: {temperature}°C | Eff: {Math.round(tempEff * 100)}%</span>
                </div>

                <div className="w-full bg-slate-950 rounded-lg p-2 border border-slate-800">
                  <svg viewBox="0 0 280 105" className="w-full h-24">
                    {/* Grid */}
                    <line x1="35" y1="15" x2="265" y2="15" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="35" y1="90" x2="265" y2="90" stroke="#334155" />
                    <line x1="35" y1="15" x2="35" y2="90" stroke="#334155" />

                    {/* Sumbu labels */}
                    <text x="30" y="20" fill="#64748b" fontSize="8" textAnchor="end">100%</text>
                    <text x="30" y="92" fill="#64748b" fontSize="8" textAnchor="end">0</text>
                    <text x="35" y="102" fill="#64748b" fontSize="8" textAnchor="middle">0°C</text>
                    <text x="144" y="102" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">38°C</text>
                    <text x="265" y="102" fill="#64748b" fontSize="8" textAnchor="middle">80°C</text>

                    {/* Kurva */}
                    <path
                      d={renderTempPath()}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Titik Saat Ini */}
                    <circle
                      cx={35 + (temperature / 80) * 230}
                      cy={90 - tempEff * 75}
                      r="4"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>

              {/* Kurva pH */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-sky-400 flex items-center gap-1.5">
                    <TrendingUp size={13} /> Kurva Aktivitas vs Derajat pH
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">pH: {ph} | Eff: {Math.round(phEff * 100)}%</span>
                </div>

                <div className="w-full bg-slate-950 rounded-lg p-2 border border-slate-800">
                  <svg viewBox="0 0 280 105" className="w-full h-24">
                    {/* Grid */}
                    <line x1="35" y1="15" x2="265" y2="15" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="35" y1="90" x2="265" y2="90" stroke="#334155" />
                    <line x1="35" y1="15" x2="35" y2="90" stroke="#334155" />

                    {/* Sumbu labels */}
                    <text x="30" y="20" fill="#64748b" fontSize="8" textAnchor="end">100%</text>
                    <text x="30" y="92" fill="#64748b" fontSize="8" textAnchor="end">0</text>
                    <text x="35" y="102" fill="#64748b" fontSize="8" textAnchor="middle">pH 1</text>
                    <text x="150" y="102" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">pH 7</text>
                    <text x="265" y="102" fill="#64748b" fontSize="8" textAnchor="middle">pH 13</text>

                    {/* Kurva */}
                    <path
                      d={renderPhPath()}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Titik Saat Ini */}
                    <circle
                      cx={35 + ((ph - 1) / 12) * 230}
                      cy={90 - phEff * 75}
                      r="4"
                      fill="#ec4899"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>

            </div>

            {/* Catatan Konsep Edukatif */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Penjelasan Denaturasi Termal vs Inaktif Dingin:</strong>
                Saat suhu dinaikkan melampaui <MathFormula formula="55^\circ\text{C} - 70^\circ\text{C}" />, energi kinetik yang terlalu ekstrem memutus ikatan hidrogen dan jembatan disulfida yang menopang struktur tersier sisi aktif enzim (**denaturasi permanen**). Bila didinginkan kembali ke <MathFormula formula="37^\circ\text{C}" />, enzim tetap rusak dan tidak dapat menguraikan <MathFormula formula="\text{H}_2\text{O}_2" />. Sebaliknya, pada air es (<MathFormula formula="4^\circ\text{C}" />), enzim hanya **inaktif sementara** karena rendahnya frekuensi tumbukan molekul; aktivitas enzim akan pulih total secara spontan begitu dihangatkan kembali ke suhu tubuh!
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
