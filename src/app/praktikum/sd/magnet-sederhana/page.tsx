"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Magnet, 
  ArrowLeft, 
  RotateCcw, 
  Compass, 
  Sparkles, 
  Eye, 
  Info,
  Layers,
  Zap
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function MagnetSederhanaPage() {
  // --- STATE PARAMETER ---
  const [pole1, setPole1] = useState<'N' | 'S'>('N');
  const [pole2, setPole2] = useState<'N' | 'S'>('S');
  const [distance, setDistance] = useState<number>(180); // 100px - 320px
  const [magnetStrength, setMagnetStrength] = useState<number>(50); // 10 - 100 mT
  const [showFluxLines, setShowFluxLines] = useState<boolean>(true);
  const [showIronFilings, setShowIronFilings] = useState<boolean>(true);
  const [compassPos, setCompassPos] = useState<{ x: number; y: number }>({ x: 400, y: 110 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Status gaya: Berlawanan kutub = Tarik Menarik (Attract), Sejenis = Tolak Menolak (Repel)
  const isAttracting = pole1 !== pole2;

  // Jarak fisik cm (skala piksel: 20px = 1 cm)
  const distanceCm = Number((distance / 20).toFixed(1));

  // Gaya magnet Coulomb F = k * (m1 * m2) / r^2
  // Skala edukasi dalam Newton
  const forceNewtons = Number(((magnetStrength * magnetStrength * 12) / (distance * distance)).toFixed(2));

  // Kuat medan magnet di titik tengah (mT)
  const centerFieldMT = isAttracting 
    ? Number((2 * (magnetStrength * 1000) / Math.pow(distance / 2, 2)).toFixed(1))
    : Number((Math.abs(magnetStrength * 0.1)).toFixed(1));

  const resetParams = () => {
    setPole1('N');
    setPole2('S');
    setDistance(180);
    setMagnetStrength(50);
    setShowFluxLines(true);
    setShowIronFilings(true);
    setCompassPos({ x: 400, y: 110 });
  };

  // --- RENDER CRISP HD RETINA CANVAS ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Bersihkan layar latar laboratorium fisika gelap
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Grid koordinat laboratorium
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const centerY = h / 2;
    const m1X = w / 2 - distance / 2;
    const m2X = w / 2 + distance / 2;
    const magW = 120;
    const magH = 46;

    // --- 1. SERBUK BESI (IRON FILINGS) ---
    if (showIronFilings) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      const step = 16;
      for (let x = 30; x < w - 30; x += step) {
        for (let y = 25; y < h - 25; y += step) {
          // Jangan gambar di dalam badan magnet
          if (
            (x > m1X - magW / 2 - 8 && x < m1X + magW / 2 + 8 && y > centerY - magH / 2 - 8 && y < centerY + magH / 2 + 8) ||
            (x > m2X - magW / 2 - 8 && x < m2X + magW / 2 + 8 && y > centerY - magH / 2 - 8 && y < centerY + magH / 2 + 8)
          ) {
            continue;
          }

          // Hitung vektor medan gabungan dari kutub-kutub
          // Kutub M1: Kiri & Kanan
          const q1_left = pole1 === 'N' ? -1 : 1; // kutub luar
          const q1_right = pole1 === 'N' ? 1 : -1; // kutub dalam (menghadap m2)
          const p1_rx = m1X + magW / 2;
          const p1_lx = m1X - magW / 2;

          const q2_left = pole2 === 'N' ? 1 : -1; // kutub dalam (menghadap m1)
          const q2_right = pole2 === 'N' ? -1 : 1;
          const p2_lx = m2X - magW / 2;
          const p2_rx = m2X + magW / 2;

          // Kontribusi medan Bx dan By
          let Bx = 0;
          let By = 0;

          const poles = [
            { x: p1_rx, y: centerY, q: q1_right },
            { x: p1_lx, y: centerY, q: q1_left },
            { x: p2_lx, y: centerY, q: q2_left },
            { x: p2_rx, y: centerY, q: q2_right }
          ];

          for (const p of poles) {
            const dx = x - p.x;
            const dy = y - p.y;
            const r2 = dx * dx + dy * dy + 150;
            const r3 = Math.pow(r2, 1.5);
            Bx += (p.q * dx) / r3;
            By += (p.q * dy) / r3;
          }

          const angle = Math.atan2(By, Bx);
          const filingLen = 5;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillRect(-filingLen / 2, -0.6, filingLen, 1.2);
          ctx.restore();
        }
      }
    }

    // --- 2. GARIS GAYA MEDAN MAGNET (MAGNETIC FLUX CURVES) ---
    if (showFluxLines) {
      const numLines = 8;
      ctx.lineWidth = 1.8;

      for (let i = 0; i < numLines; i++) {
        const offset = (i - (numLines - 1) / 2) * 14;
        ctx.beginPath();

        if (isAttracting) {
          // Tarik menarik: garis menyambung dari satu kutub ke kutub lainnya
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
          const startX = m1X + magW / 2;
          const endX = m2X - magW / 2;
          const startY = centerY + offset;
          const endY = centerY + offset;

          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(
            startX + distance * 0.45, centerY + offset * 2.8,
            endX - distance * 0.45, centerY + offset * 2.8,
            endX, endY
          );
          ctx.stroke();

          // Panah arah medan N -> S
          const midX = (startX + endX) / 2;
          const midY = centerY + offset * 1.7;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          if (pole1 === 'N') {
            ctx.moveTo(midX + 4, midY);
            ctx.lineTo(midX - 4, midY - 3);
            ctx.lineTo(midX - 4, midY + 3);
          } else {
            ctx.moveTo(midX - 4, midY);
            ctx.lineTo(midX + 4, midY - 3);
            ctx.lineTo(midX + 4, midY + 3);
          }
          ctx.fill();
        } else {
          // Tolak menolak: garis membelok menjauh keluar ke atas & bawah
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
          const startX = m1X + magW / 2;
          const endX = m2X - magW / 2;
          const startY = centerY + offset;
          const endY = centerY + offset;

          // Lengkung magnet 1
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(
            startX + 30, centerY + offset * 2.2,
            w / 2 - 12, centerY + (offset > 0 ? 120 : -120),
            w / 2 - 12, offset > 0 ? h : 0
          );
          ctx.stroke();

          // Lengkung magnet 2
          ctx.moveTo(endX, endY);
          ctx.bezierCurveTo(
            endX - 30, centerY + offset * 2.2,
            w / 2 + 12, centerY + (offset > 0 ? 120 : -120),
            w / 2 + 12, offset > 0 ? h : 0
          );
          ctx.stroke();
        }
      }
    }

    // --- 3. GAMBAR BATANG MAGNET 1 (KIRI) ---
    // Sisi Kiri Magnet 1
    const p1LeftColor = pole1 === 'N' ? '#2563eb' : '#dc2626'; // jika kanan N, kiri S (biru)
    const p1RightColor = pole1 === 'N' ? '#dc2626' : '#2563eb'; // kanan menghadap celah

    // Kutub Kiri M1
    ctx.fillStyle = p1LeftColor;
    ctx.beginPath();
    ctx.roundRect(m1X - magW / 2, centerY - magH / 2, magW / 2, magH, [8, 0, 0, 8]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(pole1 === 'N' ? 'S' : 'N', m1X - magW / 2 + 18, centerY + 6);

    // Kutub Kanan M1
    ctx.fillStyle = p1RightColor;
    ctx.beginPath();
    ctx.roundRect(m1X, centerY - magH / 2, magW / 2, magH, [0, 8, 8, 0]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(pole1, m1X + magW / 2 - 32, centerY + 6);

    // Border & Kilau Metal Magnet 1
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(m1X - magW / 2, centerY - magH / 2, magW, magH, 8);
    ctx.stroke();

    // --- 4. GAMBAR BATANG MAGNET 2 (KANAN) ---
    const p2LeftColor = pole2 === 'N' ? '#dc2626' : '#2563eb'; // kiri menghadap celah
    const p2RightColor = pole2 === 'N' ? '#2563eb' : '#dc2626'; // kanan luar

    // Kutub Kiri M2
    ctx.fillStyle = p2LeftColor;
    ctx.beginPath();
    ctx.roundRect(m2X - magW / 2, centerY - magH / 2, magW / 2, magH, [8, 0, 0, 8]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(pole2, m2X - magW / 2 + 18, centerY + 6);

    // Kutub Kanan M2
    ctx.fillStyle = p2RightColor;
    ctx.beginPath();
    ctx.roundRect(m2X, centerY - magH / 2, magW / 2, magH, [0, 8, 8, 0]);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(pole2 === 'N' ? 'S' : 'N', m2X + magW / 2 - 32, centerY + 6);

    // Border & Kilau Metal Magnet 2
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(m2X - magW / 2, centerY - magH / 2, magW, magH, 8);
    ctx.stroke();

    // --- 5. VEKTOR GAYA ANTARA MAGNET ---
    ctx.lineWidth = 3;
    if (isAttracting) {
      // Panah gaya saling menarik (ke tengah)
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = '#38bdf8';

      // Panah M1 -> kanan
      ctx.beginPath();
      ctx.moveTo(m1X + magW / 2 + 10, centerY - magH / 2 - 14);
      ctx.lineTo(m1X + magW / 2 + 45, centerY - magH / 2 - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m1X + magW / 2 + 50, centerY - magH / 2 - 14);
      ctx.lineTo(m1X + magW / 2 + 42, centerY - magH / 2 - 19);
      ctx.lineTo(m1X + magW / 2 + 42, centerY - magH / 2 - 9);
      ctx.fill();

      // Panah M2 -> kiri
      ctx.beginPath();
      ctx.moveTo(m2X - magW / 2 - 10, centerY - magH / 2 - 14);
      ctx.lineTo(m2X - magW / 2 - 45, centerY - magH / 2 - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m2X - magW / 2 - 50, centerY - magH / 2 - 14);
      ctx.lineTo(m2X - magW / 2 - 42, centerY - magH / 2 - 19);
      ctx.lineTo(m2X - magW / 2 - 42, centerY - magH / 2 - 9);
      ctx.fill();
    } else {
      // Panah gaya saling menolak (menjauh)
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = '#ef4444';

      // Panah M1 <- kiri
      ctx.beginPath();
      ctx.moveTo(m1X - magW / 2 - 10, centerY - magH / 2 - 14);
      ctx.lineTo(m1X - magW / 2 - 45, centerY - magH / 2 - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m1X - magW / 2 - 50, centerY - magH / 2 - 14);
      ctx.lineTo(m1X - magW / 2 - 42, centerY - magH / 2 - 19);
      ctx.lineTo(m1X - magW / 2 - 42, centerY - magH / 2 - 9);
      ctx.fill();

      // Panah M2 -> kanan
      ctx.beginPath();
      ctx.moveTo(m2X + magW / 2 + 10, centerY - magH / 2 - 14);
      ctx.lineTo(m2X + magW / 2 + 45, centerY - magH / 2 - 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m2X + magW / 2 + 50, centerY - magH / 2 - 14);
      ctx.lineTo(m2X + magW / 2 + 42, centerY - magH / 2 - 19);
      ctx.lineTo(m2X + magW / 2 + 42, centerY - magH / 2 - 9);
      ctx.fill();
    }

    // --- 6. KOMPAS UJI INTERAKTIF ---
    // Hitung orientasi jarum kompas di lokasi compassPos
    const q1_right = pole1 === 'N' ? 1 : -1;
    const q1_left = pole1 === 'N' ? -1 : 1;
    const q2_left = pole2 === 'N' ? 1 : -1;
    const q2_right = pole2 === 'N' ? -1 : 1;

    let cBx = 0;
    let cBy = 0;
    const poles = [
      { x: m1X + magW / 2, y: centerY, q: q1_right },
      { x: m1X - magW / 2, y: centerY, q: q1_left },
      { x: m2X - magW / 2, y: centerY, q: q2_left },
      { x: m2X + magW / 2, y: centerY, q: q2_right }
    ];

    for (const p of poles) {
      const dx = compassPos.x - p.x;
      const dy = compassPos.y - p.y;
      const r2 = dx * dx + dy * dy + 100;
      const r3 = Math.pow(r2, 1.5);
      cBx += (p.q * dx) / r3;
      cBy += (p.q * dy) / r3;
    }

    const needleAngle = Math.atan2(cBy, cBx);

    // Rumah Kompas Lingkaran
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(compassPos.x, compassPos.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Jarum Merah (Utara Kompas)
    ctx.save();
    ctx.translate(compassPos.x, compassPos.y);
    ctx.rotate(needleAngle);

    ctx.fillStyle = '#ef4444'; // Merah N
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();

    // Jarum Biru (Selatan Kompas)
    ctx.fillStyle = '#3b82f6'; // Biru S
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(-16, 0);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();

    // Poros tengah jarum
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Label Kompas Uji
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '9px monospace';
    ctx.fillText('KOMPAS UJI', compassPos.x - 28, compassPos.y + 34);

  }, [pole1, pole2, distance, magnetStrength, showFluxLines, showIronFilings, compassPos, isAttracting]);

  // Klik di kanvas untuk memindahkan kompas uji
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    setCompassPos({ x: clickX, y: clickY });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-rose-500 selection:text-white">
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
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Fisika Magnetik • SD / MI
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Magnet className="text-rose-400" size={24} />
              Simulasi Magnet Sederhana &amp; Garis Gaya Medan
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Eksperimen interaksi gaya tarik-menarik dan tolak-menolak antar kutub magnet, pola sebaran serbuk besi, dan arah jarum kompas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetParams}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shadow-sm"
              title="Reset Parameter"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Hukum Gaya Magnet:</span>
            <MathFormula formula="F = \frac{\mu_0}{4\pi} \cdot \frac{m_1 m_2}{r^2}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Arah Fluks Garis Gaya:</span>
            <MathFormula formula="\vec{B}: \text{Utara (N)} \longrightarrow \text{Selatan (S)}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Kaidah Kutub:</span>
            <MathFormula formula="\text{Sejenis: Tolak} \quad | \quad \text{Berlawanan: Tarik}" />
          </div>
        </div>

        {/* 4-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-xl h-fit space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers size={16} className="text-rose-400"/> Pengaturan Magnet
              </h2>
            </div>

            <div className="space-y-5">
              {/* Kutub Magnet 1 (Kiri) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kutub Magnet 1 (Kiri)
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setPole1('N')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      pole1 === 'N' ? 'bg-red-600 text-white shadow font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Utara (N)
                  </button>
                  <button
                    onClick={() => setPole1('S')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      pole1 === 'S' ? 'bg-blue-600 text-white shadow font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Selatan (S)
                  </button>
                </div>
              </div>

              {/* Kutub Magnet 2 (Kanan) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kutub Magnet 2 (Kanan)
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setPole2('N')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      pole2 === 'N' ? 'bg-red-600 text-white shadow font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Utara (N)
                  </button>
                  <button
                    onClick={() => setPole2('S')}
                    className={`py-1.5 rounded-lg font-bold text-xs transition ${
                      pole2 === 'S' ? 'bg-blue-600 text-white shadow font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Selatan (S)
                  </button>
                </div>
              </div>

              {/* Jarak Antar Magnet */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Jarak Pemisah (<MathFormula formula="r" />)</span>
                  <span className="text-rose-400 font-mono font-bold">{distanceCm} cm</span>
                </div>
                <input 
                  type="range" min="110" max="300" step="5"
                  value={distance} 
                  onChange={(e) => setDistance(Number(e.target.value))} 
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                  <span>Dekat (Gaya Kuat)</span>
                  <span>Jauh</span>
                </div>
              </div>

              {/* Kuat Daya Magnet */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Kekuatan Magnet (<MathFormula formula="m" />)</span>
                  <span className="text-rose-400 font-mono font-bold">{magnetStrength} mT</span>
                </div>
                <input 
                  type="range" min="15" max="100" step="5"
                  value={magnetStrength} 
                  onChange={(e) => setMagnetStrength(Number(e.target.value))} 
                  className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
              </div>

              {/* Toggle Visualisasi */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                  <span className="flex items-center gap-1.5"><Eye size={13} /> Garis Gaya Magnet (\(\vec&#123;B&#125;\))</span>
                  <input 
                    type="checkbox" 
                    checked={showFluxLines} 
                    onChange={(e) => setShowFluxLines(e.target.checked)} 
                    className="accent-rose-500 rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                  <span className="flex items-center gap-1.5"><Sparkles size={13} /> Taburan Serbuk Besi</span>
                  <input 
                    type="checkbox" 
                    checked={showIronFilings} 
                    onChange={(e) => setShowIronFilings(e.target.checked)} 
                    className="accent-rose-500 rounded"
                  />
                </label>
              </div>

              {/* Petunjuk Kompas */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Compass size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Tips Interaktif:</strong> Klik pada area kanvas di samping untuk memindahkan posisi kompas uji!</span>
              </div>
            </div>
          </div>

          {/* AREA KANVAS & TELEMETRI KANAN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Kanvas Retina HD */}
            <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
              <canvas 
                ref={canvasRef} 
                width={800} 
                height={360} 
                onClick={handleCanvasClick}
                className="w-full h-auto bg-[#030712] block rounded-xl border border-slate-800/60 shadow-2xl cursor-crosshair" 
              />
            </div>

            {/* Dashboard Telemetri 3-Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Gaya Interaksi */}
              <div className={`backdrop-blur border p-4 rounded-2xl shadow-md space-y-1 transition ${
                isAttracting 
                  ? 'bg-sky-950/30 border-sky-500/40 text-sky-300' 
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}>
                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={13} className={isAttracting ? "text-sky-400" : "text-rose-400"} /> 
                  Gaya Interaksi (<MathFormula formula="F" />)
                </div>
                <div className="text-2xl font-black font-mono">
                  {forceNewtons} <span className="text-xs font-normal opacity-70">N</span>
                </div>
                <div className="text-[10px] font-bold">
                  {isAttracting ? '🧲 Tarik-Menarik (Kutub Berlawanan)' : '⚡ Tolak-Menolak (Kutub Sejenis)'}
                </div>
              </div>

              {/* Card 2: Kuat Medan di Pusat */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Compass size={13} className="text-cyan-400" /> Medan di Titik Tengah (<MathFormula formula="B" />)
                </div>
                <div className="text-2xl font-black font-mono text-cyan-400">
                  {centerFieldMT} <span className="text-xs font-normal text-slate-400">mT</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Superposisi vektor fluks kedua magnet
                </div>
              </div>

              {/* Card 3: Jarak Pemisah */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Magnet size={13} className="text-amber-400" /> Jarak Antar Batang (<MathFormula formula="r" />)
                </div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {distanceCm} <span className="text-xs font-normal text-slate-400">cm</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Gaya berbanding terbalik kuadrat jarak (\(1/r^2\))
                </div>
              </div>
            </div>

            {/* Teori Sains Edukasi */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex gap-3.5 items-start">
              <div className="bg-rose-500/10 p-2.5 rounded-xl text-rose-400 border border-rose-500/20 shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Hukum Gaya Magnetik &amp; Medan Vektor Gauss</h4>
                <p className="leading-relaxed text-slate-400">
                  Setiap magnet permanen selalu memiliki dua kutub yang tak terpisahkan: <strong>Kutub Utara (North)</strong> dan <strong>Kutub Selatan (South)</strong>.
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li><strong>Kaidah Kutub:</strong> Dua kutub yang senama (Utara-Utara atau Selatan-Selatan) akan saling tolak-menolak. Dua kutub berlawanan (Utara-Selatan) akan saling tarik-menarik kuat.</li>
                  <li><strong>Arah Garis Gaya Magnet:</strong> Di luar batang magnet, garis-garis medan magnet selalu memancar keluar dari kutub Utara dan melengkung masuk menuju kutub Selatan.</li>
                  <li><strong>Perilaku Kompas:</strong> Jarum merah penunjuk arah kompas (yang merupakan magnet kecil) akan selalu menyejajarkan diri sejajar dengan garis medan magnet setempat.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
