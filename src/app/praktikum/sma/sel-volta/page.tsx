"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Power, 
  RotateCcw, 
  Zap, 
  ArrowRight, 
  Info, 
  BatteryCharging,
  ArrowLeft,
  Activity,
  Gauge
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface PairConfig {
  name: string;
  anodeMetal: string;
  anodeE0: number;
  anodeColor: string;
  anodeSol: string;
  anodeSolColor: string;
  cathodeMetal: string;
  cathodeE0: number;
  cathodeColor: string;
  cathodeSol: string;
  cathodeSolColor: string;
}

export default function SelVoltaSimulation() {
  // Pilihan pasangan elektroda
  const pairs: Record<string, PairConfig> = {
    'Zn-Cu': {
      name: 'Seng - Tembaga (Sel Daniell)',
      anodeMetal: 'Seng (Zn)',
      anodeE0: -0.76,
      anodeColor: '#94a3b8', // Perak abu-abu
      anodeSol: 'ZnSO₄ (Bening)',
      anodeSolColor: 'rgba(226, 232, 240, 0.35)',
      cathodeMetal: 'Tembaga (Cu)',
      cathodeE0: 0.34,
      cathodeColor: '#b45309', // Cokelat tembaga
      cathodeSol: 'CuSO₄ (Biru Cerah)',
      cathodeSolColor: 'rgba(56, 189, 248, 0.55)',
    },
    'Mg-Cu': {
      name: 'Magnesium - Tembaga',
      anodeMetal: 'Magnesium (Mg)',
      anodeE0: -2.37,
      anodeColor: '#cbd5e1',
      anodeSol: 'MgSO₄ (Bening)',
      anodeSolColor: 'rgba(226, 232, 240, 0.35)',
      cathodeMetal: 'Tembaga (Cu)',
      cathodeE0: 0.34,
      cathodeColor: '#b45309',
      cathodeSol: 'CuSO₄ (Biru Cerah)',
      cathodeSolColor: 'rgba(56, 189, 248, 0.55)',
    },
    'Fe-Cu': {
      name: 'Besi - Tembaga',
      anodeMetal: 'Besi (Fe)',
      anodeE0: -0.44,
      anodeColor: '#64748b',
      anodeSol: 'FeSO₄ (Hijau Muda)',
      anodeSolColor: 'rgba(187, 247, 208, 0.4)',
      cathodeMetal: 'Tembaga (Cu)',
      cathodeE0: 0.34,
      cathodeColor: '#b45309',
      cathodeSol: 'CuSO₄ (Biru Cerah)',
      cathodeSolColor: 'rgba(56, 189, 248, 0.55)',
    },
    'Zn-Ag': {
      name: 'Seng - Perak (Ag)',
      anodeMetal: 'Seng (Zn)',
      anodeE0: -0.76,
      anodeColor: '#94a3b8',
      anodeSol: 'Zn(NO₃)₂ (Bening)',
      anodeSolColor: 'rgba(226, 232, 240, 0.35)',
      cathodeMetal: 'Perak (Ag)',
      cathodeE0: 0.80,
      cathodeColor: '#e2e8f0',
      cathodeSol: 'AgNO₃ (Bening)',
      cathodeSolColor: 'rgba(241, 245, 249, 0.45)',
    },
  };

  const [selectedPairKey, setSelectedPairKey] = useState<string>('Zn-Cu');
  const [isSwitchClosed, setIsSwitchClosed] = useState(true); // Saklar on/off
  const [elapsedTime, setElapsedTime] = useState(0); // Waktu reaksi berjalan

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const electronOffset = useRef(0);
  const saltIonOffset = useRef(0);

  const activePair = pairs[selectedPairKey];
  // E° sel = E° katode - E° anode
  const eSel = activePair.cathodeE0 - activePair.anodeE0;
  const measuredVoltage = isSwitchClosed ? eSel : 0.0;

  // Efek pengikisan elektroda (skala visual)
  const erosionAmount = Math.min(10, Math.floor(elapsedTime / 3));

  // Timer reaksi
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSwitchClosed) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSwitchClosed]);

  // Reset Simulasi
  const resetCell = () => {
    setElapsedTime(0);
    setIsSwitchClosed(true);
  };

  // --- ANIMASI ALIRAN ELEKTRON & ION CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // 1. BEAKER KIRI (ANODE)
      // Cairan Larutan Anode
      ctx.fillStyle = activePair.anodeSolColor;
      ctx.fillRect(80, 200, 160, 130);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(80, 180, 160, 150);

      // Label Nama Larutan
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(activePair.anodeSol, 160, 310);

      // Elektroda Anode - Terkikis seiring waktu
      const anodeWidth = Math.max(8, 22 - erosionAmount);
      ctx.fillStyle = activePair.anodeColor;
      ctx.fillRect(140, 130, anodeWidth, 140);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(140, 130, anodeWidth, 140);

      // Label Anode
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`(-) Anode: ${activePair.anodeMetal}`, 160, 355);

      // 2. BEAKER KANAN (KATODE)
      // Cairan Larutan Katode
      ctx.fillStyle = activePair.cathodeSolColor;
      ctx.fillRect(w - 240, 200, 160, 130);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(w - 240, 180, 160, 150);

      // Label Nama Larutan
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(activePair.cathodeSol, w - 160, 310);

      // Elektroda Katode - Menebal akibat endapan
      const cathodeWidth = 22 + erosionAmount;
      ctx.fillStyle = activePair.cathodeColor;
      ctx.fillRect(w - 180, 130, cathodeWidth, 140);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w - 180, 130, cathodeWidth, 140);

      // Label Katode
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`(+) Katode: ${activePair.cathodeMetal}`, w - 160, 355);

      // 3. JEMBATAN GARAM (U-TUBE TERBALIK)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(190, 260);
      ctx.lineTo(190, 170);
      ctx.lineTo(w - 190, 170);
      ctx.lineTo(w - 190, 260);
      ctx.stroke();

      // Pipa dalam agar-agar garam
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(190, 255);
      ctx.lineTo(190, 170);
      ctx.lineTo(w - 190, 170);
      ctx.lineTo(w - 190, 255);
      ctx.stroke();

      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Jembatan Garam (KNO₃)', w / 2, 155);

      // 4. SIRKUIT KAWAT LUAR & SAKLAR PISAU
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Dari anode ke saklar
      ctx.moveTo(150, 130);
      ctx.lineTo(150, 60);
      ctx.lineTo(260, 60);
      ctx.stroke();

      // Visual Saklar Pisau (Knife Switch) di x = 260 -> 300
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(256, 54, 10, 12); // Kontak kiri
      ctx.fillRect(296, 54, 10, 12); // Kontak kanan

      // Pisau saklar
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(260, 60);
      if (isSwitchClosed) {
        ctx.lineTo(300, 60); // Tertutup horizontal
      } else {
        ctx.lineTo(290, 35); // Terbuka miring 45 derajat
      }
      ctx.stroke();

      // Sambungan dari saklar ke Voltmeter
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(300, 60);
      ctx.lineTo(w / 2 - 45, 60);

      // Dari Voltmeter ke katode
      ctx.moveTo(w / 2 + 45, 60);
      ctx.lineTo(w - 170, 60);
      ctx.lineTo(w - 170, 130);
      ctx.stroke();

      // Label Status Saklar
      ctx.fillStyle = isSwitchClosed ? '#10b981' : '#f43f5e';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(isSwitchClosed ? 'SAKLAR [ON]' : 'SAKLAR [OFF]', 280, 78);

      // 5. ALIRAN ELEKTRON (Hanya jika saklar tertutup)
      if (isSwitchClosed) {
        electronOffset.current = (electronOffset.current + 1.2) % 25;
        saltIonOffset.current = (saltIonOffset.current + 0.5) % 30;

        ctx.fillStyle = '#facc15'; // Partikel kuning elektron
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 6;

        // Elektron di kawat kiri naik
        for (let y = 120 - electronOffset.current; y >= 60; y -= 25) {
          ctx.beginPath(); ctx.arc(150, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        // Elektron di kawat horizontal ke kanan (Anode -> Katode)
        for (let x = 150 + electronOffset.current; x <= w - 170; x += 25) {
          // Lompat melewati kotak voltmeter di tengah
          if (x < w / 2 - 48 || x > w / 2 + 48) {
            ctx.beginPath(); ctx.arc(x, 60, 3.5, 0, Math.PI * 2); ctx.fill();
          }
        }
        // Elektron di kawat kanan turun ke katode
        for (let y = 60 + electronOffset.current; y <= 130; y += 25) {
          ctx.beginPath(); ctx.arc(w - 170, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Ion di jembatan garam
        // K+ (Kation) mengalir ke Katode (kanan)
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('K⁺ →', w / 2 + 30 + saltIonOffset.current, 172);

        // NO3- (Anion) mengalir ke Anode (kiri)
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('← NO₃⁻', w / 2 - 30 - saltIonOffset.current, 172);
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [activePair, isSwitchClosed, erosionAmount]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Kimia SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-sky-400 mb-1">
              Simulasi Sel Volta (Elektrokimia)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Aliran elektron spontan, reaksi redoks kutub elektroda, fungsi jembatan garam, dan pembacaan voltmeter virtual real-time.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsSwitchClosed(!isSwitchClosed)}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                isSwitchClosed 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              <Power size={15} /> {isSwitchClosed ? 'Buka Saklar (OFF)' : 'Tutup Saklar (ON)'}
            </button>
            <button
              onClick={resetCell}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600 shadow-sm"
            >
              <RotateCcw size={15} /> Reset Elektroda
            </button>
          </div>
        </header>

        {/* BANNER RUMUS ELEKTROKIMIA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Potensial Sel Standar:</span>
            <MathFormula formula="E^\circ_{\text{sel}} = E^\circ_{\text{katode}} - E^\circ_{\text{anode}}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Syarat Reaksi Spontan:</span>
            <MathFormula formula="\Delta G^\circ = -n F E^\circ_{\text{sel}} < 0 \iff E^\circ_{\text{sel}} > 0" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Notasi Sel:</span>
            <MathFormula formula="\text{Anode} \mid \text{Ion Anode} \parallel \text{Ion Katode} \mid \text{Katode}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <BatteryCharging size={16} className="text-amber-400" /> Konfigurasi Sel Elektroda
            </h3>

            {/* Pilihan Pasangan Logam */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Pilih Pasangan Elektroda:</label>
              <div className="space-y-2">
                {Object.keys(pairs).map((key) => {
                  const p = pairs[key];
                  const pot = p.cathodeE0 - p.anodeE0;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setSelectedPairKey(key); setElapsedTime(0); }}
                      className={`w-full p-3 text-left rounded-xl border text-xs font-bold transition-all ${
                        selectedPairKey === key
                          ? 'bg-amber-950/60 text-amber-200 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-white text-xs mb-0.5 font-sans">{p.name}</div>
                      <div className="text-amber-400 font-mono text-[11px]">E° sel = +{pot.toFixed(2)} V</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Setengah Reaksi Anode */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-rose-900/40 text-xs space-y-1.5">
              <span className="font-bold text-rose-400 block text-[11px] uppercase tracking-wider">
                Oksidasi di Anode (-):
              </span>
              <p className="font-mono text-slate-200 text-xs">
                {selectedPairKey === 'Zn-Cu' && 'Zn(s) → Zn²⁺(aq) + 2e⁻'}
                {selectedPairKey === 'Mg-Cu' && 'Mg(s) → Mg²⁺(aq) + 2e⁻'}
                {selectedPairKey === 'Fe-Cu' && 'Fe(s) → Fe²⁺(aq) + 2e⁻'}
                {selectedPairKey === 'Zn-Ag' && 'Zn(s) → Zn²⁺(aq) + 2e⁻'}
              </p>
              <span className="text-[10px] text-slate-400 font-mono block">E° = {activePair.anodeE0.toFixed(2)} V</span>
            </div>

            {/* Setengah Reaksi Katode */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-sky-900/40 text-xs space-y-1.5">
              <span className="font-bold text-sky-400 block text-[11px] uppercase tracking-wider">
                Reduksi di Katode (+):
              </span>
              <p className="font-mono text-slate-200 text-xs">
                {selectedPairKey === 'Zn-Cu' && 'Cu²⁺(aq) + 2e⁻ → Cu(s)'}
                {selectedPairKey === 'Mg-Cu' && 'Cu²⁺(aq) + 2e⁻ → Cu(s)'}
                {selectedPairKey === 'Fe-Cu' && 'Cu²⁺(aq) + 2e⁻ → Cu(s)'}
                {selectedPairKey === 'Zn-Ag' && 'Ag⁺(aq) + e⁻ → Ag(s)'}
              </p>
              <span className="text-[10px] text-slate-400 font-mono block">E° = {activePair.cathodeE0.toFixed(2)} V</span>
            </div>

            {/* Waktu Reaksi & Erosi */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Waktu Reaksi Aktif:</span>
                <strong className="text-white font-mono">{elapsedTime} detik</strong>
              </div>
              <div className="flex justify-between">
                <span>Perubahan Massa Fisik:</span>
                <strong className="text-amber-400 font-mono">{(erosionAmount * 10)}% skala</strong>
              </div>
            </div>
          </div>

          {/* AREA CANVAS & VOLTMETER DIGITAL (KANAN) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Animasi Sel Daniell */}
            <div className="bg-slate-900/90 p-3 sm:p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col items-center backdrop-blur">
              
              {/* Voltmeter Digital Display (Mobile: Di atas kanvas, Desktop: Overlay di kawat) */}
              <div className="mb-3 sm:mb-0 sm:absolute sm:top-7 sm:left-1/2 sm:-translate-x-1/2 bg-slate-950/95 border sm:border-2 border-amber-500/80 rounded-xl sm:rounded-2xl px-4 py-2 sm:px-6 sm:py-2.5 text-center shadow-[0_0_20px_rgba(245,158,11,0.25)] z-10 backdrop-blur-md">
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1">
                  <Gauge size={10} className="text-amber-400 sm:w-3 sm:h-3" /> DIGITAL VOLTMETER
                </div>
                <div className="text-lg sm:text-3xl font-black font-mono text-amber-400 tracking-wider my-0.5">
                  {measuredVoltage.toFixed(2)} <span className="text-xs sm:text-base font-normal">V</span>
                </div>
                <div className={`text-[8px] sm:text-[9px] font-bold ${isSwitchClosed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isSwitchClosed ? '● AKTIF' : '○ OFF (0.00 V)'}
                </div>
              </div>

              <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-[#020617]">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={370}
                  className="w-full min-w-[500px] sm:min-w-full h-auto block"
                />
              </div>

              <div className="flex justify-between items-center mt-3 text-[11px] text-slate-400">
                <span>Gelas Kimia Kiri: Oksidasi Anode</span>
                <span>Gelas Kimia Kanan: Reduksi Katode</span>
              </div>
            </div>

            {/* Dashboard Hasil & Notasi Sel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notasi Sel Volta</span>
                <span className="text-sm font-bold font-mono text-yellow-300 block">
                  {selectedPairKey === 'Zn-Cu' && 'Zn | Zn²⁺ || Cu²⁺ | Cu'}
                  {selectedPairKey === 'Mg-Cu' && 'Mg | Mg²⁺ || Cu²⁺ | Cu'}
                  {selectedPairKey === 'Fe-Cu' && 'Fe | Fe²⁺ || Cu²⁺ | Cu'}
                  {selectedPairKey === 'Zn-Ag' && 'Zn | Zn²⁺ || Ag⁺ | Ag'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Anode (Kiri) || Katode (Kanan)</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Arah Aliran Elektron</span>
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mt-1">
                  <span>Anode (-)</span>
                  <ArrowRight size={15} className="animate-pulse" />
                  <span>Katode (+)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Mengalir melalui kawat sirkuit luar</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-center">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Zap size={13} className="text-amber-400" /> Sifat Reaksi Redoks
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  Spontan (E° sel &gt; 0)
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Menghasilkan energi listrik searah (DC)</p>
              </div>

            </div>

            {/* Penjelasan Edukatif Konseptual */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Peran Krusial Jembatan Garam & Sirkuit Tertutup:</strong>
                Jika saklar dibuka atau jembatan garam diangkat, reaksi redoks seketika terhenti dan pembacaan voltmeter jatuh ke <MathFormula formula="0.00\text{ V}" />. Di anoda, logam melarut menjadi kation (misal <MathFormula formula="\text{Zn}^{2+}" />) sehingga plat terkikis menipis. Di katoda, kation larutan menerima elektron menjadi endapan logam padat sehingga plat menebal. Jembatan garam (<MathFormula formula="\text{KNO}_3" />) secara konstan mengalirkan kation <MathFormula formula="\text{K}^+" /> ke katoda dan anion <MathFormula formula="\text{NO}_3^-" /> ke anoda untuk menetralkan kelebihan muatan, menjaga siklus arus listrik mengalir tanpa hambatan.
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
