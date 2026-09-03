'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap, Info } from 'lucide-react';

export default function HukumNewtonSim() {
  const [mass, setMass] = useState<number>(10); // Mass m (kg)
  const [pullForce, setPullForce] = useState<number>(80); // Applied force F (N)
  const [muK, setMuK] = useState<number>(0.2); // Coefficient of kinetic friction
  const [gravity] = useState<number>(9.8); // g (m/s^2)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics Calculations:
  // Normal Force N = m * g
  const normalForce = mass * gravity;
  // Kinetic Friction Force f_k = mu_k * N
  const frictionForce = muK * normalForce;
  // Net Force F_net = F - f_k
  const netForce = Math.max(0, pullForce - frictionForce);
  // Acceleration a = F_net / m
  const acceleration = netForce / mass;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2 + 20;
    const boxX = canvas.width / 2 - 50;
    const boxW = 100;
    const boxH = 70;

    // Surface Ground with friction texture
    ctx.fillStyle = '#334155';
    ctx.fillRect(40, centerY + boxH / 2, canvas.width - 80, 15);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let x = 45; x < canvas.width - 85; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, centerY + boxH / 2 + 15);
      ctx.lineTo(x + 8, centerY + boxH / 2);
      ctx.stroke();
    }

    // Draw Main Object (Block)
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(boxX, centerY - boxH / 2, boxW, boxH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, centerY - boxH / 2, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`m = ${mass} kg`, boxX + boxW / 2, centerY + 5);

    // Vector Arrow 1: Applied Pull Force (F -> Right)
    const arrowScale = 1.2;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(boxX + boxW, centerY);
    ctx.lineTo(boxX + boxW + pullForce * arrowScale, centerY);
    ctx.stroke();
    // Arrow head
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(boxX + boxW + pullForce * arrowScale + 8, centerY);
    ctx.lineTo(boxX + boxW + pullForce * arrowScale, centerY - 6);
    ctx.lineTo(boxX + boxW + pullForce * arrowScale, centerY + 6);
    ctx.fill();
    ctx.fillText(`F = ${pullForce} N`, boxX + boxW + pullForce * arrowScale / 2, centerY - 12);

    // Vector Arrow 2: Friction Force (f_k <- Left)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(boxX, centerY);
    ctx.lineTo(boxX - frictionForce * arrowScale, centerY);
    ctx.stroke();
    // Arrow head
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(boxX - frictionForce * arrowScale - 8, centerY);
    ctx.lineTo(boxX - frictionForce * arrowScale, centerY - 6);
    ctx.lineTo(boxX - frictionForce * arrowScale, centerY + 6);
    ctx.fill();
    ctx.fillText(`f_k = ${frictionForce.toFixed(1)} N`, boxX - frictionForce * arrowScale / 2, centerY - 12);

    // Normal Force N (Up) & Weight W (Down)
    // Down W
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(boxX + boxW / 2, centerY + boxH / 2);
    ctx.lineTo(boxX + boxW / 2, centerY + boxH / 2 + 35);
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.fillText(`W = ${normalForce.toFixed(0)} N`, boxX + boxW / 2 + 35, centerY + boxH / 2 + 30);

    // Up N
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(boxX + boxW / 2, centerY - boxH / 2);
    ctx.lineTo(boxX + boxW / 2, centerY - boxH / 2 - 35);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillText(`N = ${normalForce.toFixed(0)} N`, boxX + boxW / 2 + 35, centerY - boxH / 2 - 25);
  }, [mass, pullForce, muK, normalForce, frictionForce, netForce, acceleration]);

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
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-blue-500/40 rounded-xl p-3 text-right text-xs">
          <div className="text-slate-400">Percepatan Benda (a):</div>
          <div className="font-mono text-xl text-cyan-400 font-extrabold">{acceleration.toFixed(2)} m/s²</div>
          <div className="text-slate-400 mt-1">Gaya Bersih (ΣF):</div>
          <div className="font-mono text-amber-400 font-bold">{netForce.toFixed(1)} N</div>
        </div>
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Massa Benda (m)</label>
            <span className="font-mono text-blue-400 font-bold">{mass} kg</span>
          </div>
          <input
            type="range"
            min="2"
            max="50"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Gaya Tarik (F)</label>
            <span className="font-mono text-cyan-400 font-bold">{pullForce} N</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={pullForce}
            onChange={(e) => setPullForce(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold">Kuisien Gesek (μ_k)</label>
            <span className="font-mono text-rose-400 font-bold">{muK}</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={muK}
            onChange={(e) => setMuK(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
