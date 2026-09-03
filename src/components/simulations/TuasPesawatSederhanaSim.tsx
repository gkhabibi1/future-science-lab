'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Scale, Info } from 'lucide-react';

export default function TuasPesawatSederhanaSim() {
  const [loadWeight, setLoadWeight] = useState<number>(100); // Beban w (N)
  const [loadArm, setLoadArm] = useState<number>(2); // Lengan Beban l_w (m)
  const [effortArm, setEffortArm] = useState<number>(4); // Lengan Kuasa l_F (m)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Math Calculations:
  // w * l_w = F * l_F  =>  F = (w * l_w) / l_F
  const requiredForce = (loadWeight * loadArm) / effortArm;
  const mechanicalAdvantage = effortArm / loadArm;

  // Torque Balance Check
  const loadTorque = loadWeight * loadArm;
  const effortTorque = requiredForce * effortArm;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const fulcrumY = canvas.height - 80;

    // Draw Ground Line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, fulcrumY + 20);
    ctx.lineTo(canvas.width - 40, fulcrumY + 20);
    ctx.stroke();

    // Draw Fulcrum Triangle (Titik Tumpu)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(centerX, fulcrumY - 25);
    ctx.lineTo(centerX - 25, fulcrumY + 20);
    ctx.lineTo(centerX + 25, fulcrumY + 20);
    ctx.fill();

    // Fulcrum Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Titik Tumpu (T)', centerX, fulcrumY + 36);

    // Lever Plank (Batang Tuas)
    // Scale: 1 meter = 40 pixels
    const pxPerMeter = 40;
    const leftX = centerX - loadArm * pxPerMeter;
    const rightX = centerX + effortArm * pxPerMeter;

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(leftX - 10, fulcrumY - 27);
    ctx.lineTo(rightX + 10, fulcrumY - 27);
    ctx.stroke();

    // Draw Load Box (w) on Left
    const boxWidth = 50;
    const boxHeight = 40;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(leftX - boxWidth / 2, fulcrumY - 27 - boxHeight, boxWidth, boxHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(leftX - boxWidth / 2, fulcrumY - 27 - boxHeight, boxWidth, boxHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`w = ${loadWeight}N`, leftX, fulcrumY - 27 - boxHeight / 2 + 4);

    // Draw Effort Force Arrow (F) on Right
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rightX, fulcrumY - 27);
    ctx.lineTo(rightX, fulcrumY - 27 + 45);
    ctx.stroke();

    // Arrow Head
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(rightX, fulcrumY - 27 + 52);
    ctx.lineTo(rightX - 7, fulcrumY - 27 + 42);
    ctx.lineTo(rightX + 7, fulcrumY - 27 + 42);
    ctx.fill();

    ctx.fillText(`F = ${requiredForce.toFixed(1)} N`, rightX, fulcrumY - 27 + 68);

    // Dimension Lines for Arms (l_w and l_F)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);

    // Load Arm l_w
    ctx.beginPath();
    ctx.moveTo(centerX, fulcrumY - 45);
    ctx.lineTo(leftX, fulcrumY - 45);
    ctx.stroke();
    ctx.fillText(`l_w = ${loadArm} m`, (centerX + leftX) / 2, fulcrumY - 52);

    // Effort Arm l_F
    ctx.beginPath();
    ctx.moveTo(centerX, fulcrumY - 45);
    ctx.lineTo(rightX, fulcrumY - 45);
    ctx.stroke();
    ctx.fillText(`l_F = ${effortArm} m`, (centerX + rightX) / 2, fulcrumY - 52);

    ctx.setLineDash([]);
  }, [loadWeight, loadArm, effortArm, requiredForce]);

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

        {/* Keuntungan Mekanis Badge */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-amber-500/40 rounded-xl p-3 text-right">
          <div className="text-xs text-slate-400">Keuntungan Mekanis (KM):</div>
          <div className="font-mono text-xl text-amber-400 font-extrabold">{mechanicalAdvantage.toFixed(2)}x</div>
        </div>
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Load Weight Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Berat Beban (w)</label>
            <span className="font-mono text-rose-400 font-bold">{loadWeight} N</span>
          </div>
          <input
            type="range"
            min="20"
            max="400"
            step="10"
            value={loadWeight}
            onChange={(e) => setLoadWeight(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Load Arm Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Lengan Beban (l_w)</label>
            <span className="font-mono text-amber-400 font-bold">{loadArm} m</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={loadArm}
            onChange={(e) => setLoadArm(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Effort Arm Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Lengan Kuasa (l_F)</label>
            <span className="font-mono text-cyan-400 font-bold">{effortArm} m</span>
          </div>
          <input
            type="range"
            min="1"
            max="6"
            step="0.5"
            value={effortArm}
            onChange={(e) => setEffortArm(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* Formula & Live Equation */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-slate-100 font-bold text-sm flex items-center gap-2">
          <Info size={16} className="text-amber-400" /> Rumus Kesetimbangan Momen Gaya (SMP Kelas 8)
        </h4>
        <div className="font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs md:text-sm text-cyan-300 space-y-1">
          <div>w × l_w = F × l_F</div>
          <div className="text-slate-400">
            {loadWeight} N × {loadArm} m = {requiredForce.toFixed(1)} N × {effortArm} m
          </div>
          <div className="text-amber-400 pt-1 border-t border-slate-800">
            Momen Kiri = Momen Kanan ({loadTorque} N·m = {effortTorque.toFixed(0)} N·m)
          </div>
        </div>
      </div>
    </div>
  );
}
