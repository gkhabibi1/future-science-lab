'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Magnet, RefreshCw, Zap, Info } from 'lucide-react';

export default function MagnetSederhanaSim() {
  const [magnet1Pole, setMagnet1Pole] = useState<'N' | 'S'>('N');
  const [magnet2Pole, setMagnet2Pole] = useState<'N' | 'S'>('S');
  const [distance, setDistance] = useState<number>(150); // distance in pixels between magnets
  const [showFieldLines, setShowFieldLines] = useState<boolean>(true);
  const [showIronFilings, setShowIronFilings] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Attraction or Repulsion
  const isAttracting = magnet1Pole !== magnet2Pole;
  // Force magnitude estimation (Coulomb's Law for magnetic poles)
  const forceMagnitude = Math.round(50000 / (distance * distance));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const m1X = canvas.width / 2 - distance / 2;
    const m2X = canvas.width / 2 + distance / 2;
    const centerY = canvas.height / 2;

    // Draw Background Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Magnetic Field Lines (Garis Gaya Magnet)
    if (showFieldLines) {
      ctx.lineWidth = 1.5;
      const numLines = 8;

      for (let i = 0; i < numLines; i++) {
        const offsetY = (i - numLines / 2 + 0.5) * 25;
        ctx.beginPath();

        if (isAttracting) {
          // Attracting field curve between magnets
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.moveTo(m1X, centerY + offsetY);
          ctx.bezierCurveTo(
            m1X + distance * 0.4, centerY + offsetY * 2,
            m2X - distance * 0.4, centerY + offsetY * 2,
            m2X, centerY + offsetY
          );
        } else {
          // Repelling field curves bending away
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.moveTo(m1X, centerY + offsetY);
          ctx.bezierCurveTo(
            m1X + 40, centerY + offsetY * 2,
            canvas.width / 2 - 10, centerY + offsetY * 3,
            canvas.width / 2 - 10, offsetY > 0 ? canvas.height : 0
          );

          ctx.moveTo(m2X, centerY + offsetY);
          ctx.bezierCurveTo(
            m2X - 40, centerY + offsetY * 2,
            canvas.width / 2 + 10, centerY + offsetY * 3,
            canvas.width / 2 + 10, offsetY > 0 ? canvas.height : 0
          );
        }
        ctx.stroke();
      }
    }

    // Draw Iron Filings (Serbuk Besi)
    if (showIronFilings) {
      ctx.fillStyle = '#cbd5e1';
      for (let i = 0; i < 120; i++) {
        const angle = (i * 137.5) * (Math.PI / 180);
        const radius = 20 + (i * 1.5);
        const ix = canvas.width / 2 + Math.cos(angle) * radius;
        const iy = centerY + Math.sin(angle) * (radius * 0.5);

        if (ix > 20 && ix < canvas.width - 20 && iy > 20 && iy < canvas.height - 20) {
          ctx.fillRect(ix, iy, 2, 2);
        }
      }
    }

    // Function to draw a Bar Magnet
    const drawMagnet = (x: number, y: number, facingPole: 'N' | 'S', label: string) => {
      const magWidth = 100;
      const magHeight = 36;
      const startX = x - magWidth / 2;
      const startY = y - magHeight / 2;

      // Pole 1 (Left side of bar)
      const p1Color = facingPole === 'N' ? '#ef4444' : '#3b82f6';
      const p2Color = facingPole === 'N' ? '#3b82f6' : '#ef4444';

      // Left half
      ctx.fillStyle = p1Color;
      ctx.fillRect(startX, startY, magWidth / 2, magHeight);

      // Right half
      ctx.fillStyle = p2Color;
      ctx.fillRect(startX + magWidth / 2, startY, magWidth / 2, magHeight);

      // Border & shine
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, magWidth, magHeight);

      // Pole Labels
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(facingPole, startX + magWidth * 0.25, y + 5);
      ctx.fillText(facingPole === 'N' ? 'S' : 'N', startX + magWidth * 0.75, y + 5);

      // Magnet Name Tag
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(label, x, y + magHeight / 2 + 18);
    };

    drawMagnet(m1X, centerY, magnet1Pole, 'Magnet 1');
    drawMagnet(m2X, centerY, magnet2Pole, 'Magnet 2');

    // Draw Force Indicator Arrows in center
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px Inter, sans-serif';

    if (isAttracting) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`TARIK-MENARIK (${forceMagnitude} N)`, canvas.width / 2, centerY - 45);

      // Left arrow ->
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(m1X + 65, centerY);
      ctx.lineTo(m1X + 85, centerY - 10);
      ctx.lineTo(m1X + 85, centerY + 10);
      ctx.fill();

      // Right arrow <-
      ctx.beginPath();
      ctx.moveTo(m2X - 65, centerY);
      ctx.lineTo(m2X - 85, centerY - 10);
      ctx.lineTo(m2X - 85, centerY + 10);
      ctx.fill();
    } else {
      ctx.fillStyle = '#f87171';
      ctx.fillText(`TOLAK-MENOMBAK / TOLAK (${forceMagnitude} N)`, canvas.width / 2, centerY - 45);

      // Left arrow <-
      ctx.beginPath();
      ctx.moveTo(m1X + 40, centerY);
      ctx.lineTo(m1X + 20, centerY - 10);
      ctx.lineTo(m1X + 20, centerY + 10);
      ctx.fill();

      // Right arrow ->
      ctx.beginPath();
      ctx.moveTo(m2X - 40, centerY);
      ctx.lineTo(m2X - 20, centerY - 10);
      ctx.lineTo(m2X - 20, centerY + 10);
      ctx.fill();
    }
  }, [magnet1Pole, magnet2Pole, distance, showFieldLines, showIronFilings, isAttracting, forceMagnitude]);

  return (
    <div className="space-y-6">
      {/* Canvas View */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={320}
          className="w-full h-auto block"
        />

        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setShowFieldLines(!showFieldLines)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur border transition ${
              showFieldLines ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
          >
            Garis Medan
          </button>
          <button
            onClick={() => setShowIronFilings(!showIronFilings)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur border transition ${
              showIronFilings ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-900/80 text-slate-400 border-slate-700'
            }`}
          >
            Serbuk Besi
          </button>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Magnet 1 Pole Selector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-slate-200 text-sm font-semibold block">Kutub Magnet 1 (Kiri)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMagnet1Pole('N')}
              className={`py-2 rounded-lg text-xs font-bold transition border ${
                magnet1Pole === 'N' ? 'bg-red-500 text-white border-red-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Kutub Utara (N)
            </button>
            <button
              onClick={() => setMagnet1Pole('S')}
              className={`py-2 rounded-lg text-xs font-bold transition border ${
                magnet1Pole === 'S' ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Kutub Selatan (S)
            </button>
          </div>
        </div>

        {/* Distance Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Jarak Antar Magnet</label>
            <span className="font-mono text-cyan-400 font-bold">{distance} px</span>
          </div>
          <input
            type="range"
            min="110"
            max="260"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <p className="text-xs text-slate-400">Semakin dekat jaraknya, semakin kuat gaya magnetnya.</p>
        </div>

        {/* Magnet 2 Pole Selector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-slate-200 text-sm font-semibold block">Kutub Magnet 2 (Kanan)</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMagnet2Pole('N')}
              className={`py-2 rounded-lg text-xs font-bold transition border ${
                magnet2Pole === 'N' ? 'bg-red-500 text-white border-red-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Kutub Utara (N)
            </button>
            <button
              onClick={() => setMagnet2Pole('S')}
              className={`py-2 rounded-lg text-xs font-bold transition border ${
                magnet2Pole === 'S' ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Kutub Selatan (S)
            </button>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
        <h4 className="text-slate-100 font-bold text-sm flex items-center gap-2">
          <Info size={16} className="text-red-400" /> Aturan Dasar Magnet (SD Kelas 4 - 6)
        </h4>
        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li><strong>Kutub Senama (Utara-Utara / Selatan-Selatan):</strong> Akan saling <em>TOLAK-MENOLAK</em>.</li>
          <li><strong>Kutub Tidak Senama (Utara-Selatan):</strong> Akan saling <em>TARIK-MENARIK</em>.</li>
          <li>Garis medan magnet selalu keluar dari Kutub Utara (N) menuju Kutub Selatan (S).</li>
        </ul>
      </div>
    </div>
  );
}
