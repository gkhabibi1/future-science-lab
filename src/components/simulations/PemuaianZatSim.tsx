'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flame, Info } from 'lucide-react';

interface MetalMaterial {
  name: string;
  alpha: number; // Coeff of linear expansion (x 10^-6 /°C)
  color: string;
  initialLength: number; // cm
}

const METALS: MetalMaterial[] = [
  { name: 'Aluminium', alpha: 24e-6, color: '#94a3b8', initialLength: 100 },
  { name: 'Kuningan / Brass', alpha: 19e-6, color: '#eab308', initialLength: 100 },
  { name: 'Tembaga / Copper', alpha: 17e-6, color: '#f97316', initialLength: 100 },
  { name: 'Besi / Iron', alpha: 12e-6, color: '#64748b', initialLength: 100 }
];

export default function PemuaianZatSim() {
  const [selectedMetal, setSelectedMetal] = useState<MetalMaterial>(METALS[0]);
  const [temperatureDelta, setTemperatureDelta] = useState<number>(150); // °C increase
  const [initialTemp, setInitialTemp] = useState<number>(25); // °C

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Math Calculations:
  // Delta L = L_0 * alpha * Delta T (in cm)
  const deltaL_cm = selectedMetal.initialLength * selectedMetal.alpha * temperatureDelta;
  const deltaL_mm = deltaL_cm * 10;
  const finalLength_cm = selectedMetal.initialLength + deltaL_cm;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startX = 80;
    const rodY = canvas.height / 2 - 10;
    const baseWidth = 360; // Represents L_0 = 100 cm
    // Exaggerated visual expansion factor so students can clearly see the expansion!
    const visualExpansion = deltaL_cm * 2500; 
    const currentWidth = baseWidth + visualExpansion;

    // Draw Clamp Base (Pencekam Kiri Fixed)
    ctx.fillStyle = '#334155';
    ctx.fillRect(startX - 25, rodY - 35, 25, 80);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX - 25, rodY - 35, 25, 80);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText('FIXED', startX - 22, rodY + 5);

    // Draw Metal Rod
    const rodHeight = 30;
    ctx.fillStyle = selectedMetal.color;
    ctx.fillRect(startX, rodY - rodHeight / 2, currentWidth, rodHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, rodY - rodHeight / 2, currentWidth, rodHeight);

    // Initial Length Marker L_0
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX + baseWidth, rodY - 50);
    ctx.lineTo(startX + baseWidth, rodY + 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Delta L Extension Highlights
    if (visualExpansion > 2) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fillRect(startX + baseWidth, rodY - rodHeight / 2, visualExpansion, rodHeight);
      ctx.strokeStyle = '#ef4444';
      ctx.strokeRect(startX + baseWidth, rodY - rodHeight / 2, visualExpansion, rodHeight);
    }

    // Dial Gauge / Jarum Ukur (Right side)
    const gaugeX = startX + currentWidth + 20;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gaugeX + 30, rodY, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Needle rotation based on delta L
    const needleAngle = (deltaL_mm * 2) * (Math.PI / 180);
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(gaugeX + 30, rodY);
    ctx.lineTo(
      gaugeX + 30 + Math.cos(needleAngle - Math.PI / 2) * 22,
      rodY + Math.sin(needleAngle - Math.PI / 2) * 22
    );
    ctx.stroke();

    // Flame Effect under rod
    if (temperatureDelta > 0) {
      const numFlames = 5;
      for (let i = 0; i < numFlames; i++) {
        const fx = startX + 40 + i * 60;
        const fy = rodY + rodHeight / 2 + 10;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(fx, fy + 10, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(fx, fy + 6, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Text Labels on Canvas
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`L₀ = 100 cm`, startX + baseWidth / 2, rodY - 25);
    if (deltaL_mm > 0) {
      ctx.fillStyle = '#f87171';
      ctx.fillText(`ΔL = +${deltaL_mm.toFixed(2)} mm`, startX + baseWidth + visualExpansion / 2, rodY + 45);
    }
  }, [selectedMetal, temperatureDelta, deltaL_cm, deltaL_mm]);

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
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-amber-500/40 rounded-xl p-3 text-right text-xs">
          <div className="text-slate-400">Pertambahan Panjang (ΔL):</div>
          <div className="font-mono text-lg text-amber-400 font-extrabold">+{deltaL_mm.toFixed(3)} mm</div>
          <div className="text-slate-400 mt-1">Panjang Akhir (L):</div>
          <div className="font-mono text-cyan-400 font-bold">{finalLength_cm.toFixed(4)} cm</div>
        </div>
      </div>

      {/* Control Sliders & Material Select */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metal Selection */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-slate-200 text-sm font-semibold block">Pilih Material Batang Logam</label>
          <div className="grid grid-cols-2 gap-2">
            {METALS.map((metal) => (
              <button
                key={metal.name}
                onClick={() => setSelectedMetal(metal)}
                className={`p-2.5 rounded-lg text-xs font-semibold border transition text-left ${
                  selectedMetal.name === metal.name
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>{metal.name}</div>
                <div className="font-mono text-[10px] text-slate-400">α = {(metal.alpha * 1e6).toFixed(0)} × 10⁻⁶ /°C</div>
              </button>
            ))}
          </div>
        </div>

        {/* Temperature Delta Slider */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-semibold flex items-center gap-2">
              <Flame size={16} className="text-orange-500" /> Kenaikan Suhu (ΔT)
            </label>
            <span className="font-mono text-orange-400 font-bold">+{temperatureDelta} °C</span>
          </div>
          <input
            type="range"
            min="0"
            max="400"
            step="10"
            value={temperatureDelta}
            onChange={(e) => setTemperatureDelta(Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Suhu Awal: {initialTemp} °C</span>
            <span>Suhu Akhir: {initialTemp + temperatureDelta} °C</span>
          </div>
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-2">
        <h4 className="text-slate-100 font-bold text-sm flex items-center gap-2">
          <Info size={16} className="text-orange-400" /> Rumus Pemuaian Panjang Logam (SMP Kelas 7)
        </h4>
        <div className="font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-orange-300 space-y-1">
          <div>ΔL = L₀ × α × ΔT</div>
          <div className="text-slate-400">
            ΔL = 100 cm × {(selectedMetal.alpha * 1e6).toFixed(0)}×10⁻⁶ /°C × {temperatureDelta} °C = {deltaL_cm.toFixed(5)} cm ({deltaL_mm.toFixed(3)} mm)
          </div>
        </div>
      </div>
    </div>
  );
}
