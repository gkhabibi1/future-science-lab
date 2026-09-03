'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sun, Info } from 'lucide-react';

export default function CerminLensaSim() {
  const [opticsType, setOpticsType] = useState<'lensa-cembung' | 'cermin-cekung'>('lensa-cembung');
  const [focalLength, setFocalLength] = useState<number>(60); // f in pixels (e.g. 60px = 15 cm)
  const [objectDistance, setObjectDistance] = useState<number>(120); // s in pixels (e.g. 120px = 30 cm)
  const [objectHeight, setObjectHeight] = useState<number>(40); // h in pixels

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Math Optics Formulas:
  // 1/f = 1/s + 1/s' => s' = (s * f) / (s - f)
  // Magnification M = -s' / s => h' = M * h
  let imageDistance = 0;
  let imageDistanceText = '∞';
  let magnification = 0;
  let isRealImage = true;

  if (objectDistance === focalLength) {
    imageDistanceText = 'Tak Hingga (∞)';
  } else {
    imageDistance = (objectDistance * focalLength) / (objectDistance - focalLength);
    imageDistanceText = `${(imageDistance / 4).toFixed(1)} cm`;
    magnification = -imageDistance / objectDistance;
    isRealImage = imageDistance > 0;
  }

  const imageHeight = magnification * objectHeight;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Principal Axis (Sumbu Utama)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, centerY);
    ctx.lineTo(canvas.width - 20, centerY);
    ctx.stroke();

    // Focal Points F1, F2 & 2F Points
    const drawPoint = (x: number, label: string) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, centerY + 18);
    };

    drawPoint(centerX - focalLength, 'F₁');
    drawPoint(centerX - focalLength * 2, '2F₁');
    drawPoint(centerX + focalLength, 'F₂');
    drawPoint(centerX + focalLength * 2, '2F₂');

    // Draw Optical Device (Lensa Cembung vs Cermin Cekung)
    if (opticsType === 'lensa-cembung') {
      // Convex Lens Shape
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 12, 110, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Concave Mirror Arc
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX + 150, centerY, 150, Math.PI * 0.85, Math.PI * 1.15);
      ctx.stroke();
    }

    // Draw Object Arrow (Benda B)
    const objX = centerX - objectDistance;
    const objY = centerY - objectHeight;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(objX, centerY);
    ctx.lineTo(objX, objY);
    ctx.stroke();
    // Arrowhead for Object
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(objX, objY - 6);
    ctx.lineTo(objX - 6, objY + 4);
    ctx.lineTo(objX + 6, objY + 4);
    ctx.fill();
    ctx.fillText('Benda', objX, objY - 12);

    // Draw Light Rays (Sinar-sinar Istimewa)
    if (objectDistance !== focalLength && Math.abs(imageDistance) < 400) {
      const imgX = centerX + imageDistance;
      const imgY = centerY + imageHeight;

      // Ray 1: Parallel to Principal Axis -> Passes through F2
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(objX, objY);
      ctx.lineTo(centerX, objY);
      ctx.lineTo(imgX, imgY);
      ctx.stroke();

      // Ray 2: Passes through Optical Center -> Continues straight
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      ctx.beginPath();
      ctx.moveTo(objX, objY);
      ctx.lineTo(centerX, centerY);
      ctx.lineTo(imgX, imgY);
      ctx.stroke();

      // Draw Image Arrow (Bayangan B')
      ctx.strokeStyle = isRealImage ? '#38bdf8' : '#e11d48';
      ctx.lineWidth = 4;
      if (!isRealImage) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(imgX, centerY);
      ctx.lineTo(imgX, imgY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead for Image
      ctx.fillStyle = isRealImage ? '#38bdf8' : '#e11d48';
      ctx.beginPath();
      const arrowDir = imageHeight < 0 ? 1 : -1;
      ctx.moveTo(imgX, imgY + arrowDir * 6);
      ctx.lineTo(imgX - 6, imgY - arrowDir * 4);
      ctx.lineTo(imgX + 6, imgY - arrowDir * 4);
      ctx.fill();

      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('Bayangan', imgX, imgY + arrowDir * 16);
    }
  }, [opticsType, focalLength, objectDistance, objectHeight, imageDistance, imageHeight, isRealImage]);

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

        {/* Telemetry Badge */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-indigo-500/40 rounded-xl p-3 text-right text-xs">
          <div className="text-slate-400">Jarak Bayangan (s'):</div>
          <div className="font-mono text-lg text-cyan-400 font-extrabold">{imageDistanceText}</div>
          <div className="text-slate-400 mt-1">Perbesaran (M):</div>
          <div className="font-mono text-amber-400 font-bold">{Math.abs(magnification).toFixed(2)}x</div>
          <div className="text-slate-400 mt-1">Sifat Bayangan:</div>
          <div className="font-bold text-emerald-400">
            {isRealImage ? 'Nyata, Terbalik' : 'Maya, Tegak'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Device Switch */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-slate-200 text-sm font-semibold block">Jenis Alat Optik</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOpticsType('lensa-cembung')}
              className={`py-2 rounded-lg text-xs font-bold transition border ${
                opticsType === 'lensa-cembung' ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Lensa Cembung
            </button>
            <button
              onClick={() => setOpticsType('cermin-cekung')}
              className={`py-2 rounded-lg text-xs font-bold transition border ${
                opticsType === 'cermin-cekung' ? 'bg-purple-500 text-white border-purple-400' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Cermin Cekung
            </button>
          </div>
        </div>

        {/* Object Distance Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Jarak Benda (s)</label>
            <span className="font-mono text-emerald-400 font-bold">{(objectDistance / 4).toFixed(1)} cm</span>
          </div>
          <input
            type="range"
            min="30"
            max="220"
            value={objectDistance}
            onChange={(e) => setObjectDistance(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Focal Length Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Jarak Fokus (f)</label>
            <span className="font-mono text-amber-400 font-bold">{(focalLength / 4).toFixed(1)} cm</span>
          </div>
          <input
            type="range"
            min="30"
            max="100"
            value={focalLength}
            onChange={(e) => setFocalLength(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
        <h4 className="text-slate-100 font-bold text-sm flex items-center gap-2">
          <Info size={16} className="text-indigo-400" /> Rumus Lensa & Cermin (SMP Kelas 8)
        </h4>
        <div className="font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-indigo-300 space-y-1">
          <div>1/f = 1/s + 1/s'</div>
          <div>M = |s' / s|</div>
        </div>
      </div>
    </div>
  );
}
