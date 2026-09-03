'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Waves, Info } from 'lucide-react';

interface MaterialOption {
  name: string;
  density: number; // in g/cm³
  color: string;
}

const MATERIALS: MaterialOption[] = [
  { name: 'Kayu Pinus', density: 0.6, color: '#d97706' },
  { name: 'Plastik ABS', density: 0.95, color: '#10b981' },
  { name: 'Batu / Keramik', density: 1.5, color: '#64748b' },
  { name: 'Besi / Baja', density: 7.8, color: '#475569' },
  { name: 'Emas', density: 19.3, color: '#f59e0b' }
];

const LIQUIDS = [
  { name: 'Minyak Goreng', density: 0.8, color: 'rgba(250, 204, 21, 0.4)' },
  { name: 'Air Murni', density: 1.0, color: 'rgba(56, 189, 248, 0.4)' },
  { name: 'Madu Pekat', density: 1.42, color: 'rgba(217, 119, 6, 0.5)' }
];

export default function MengapungTenggelamSim() {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption>(MATERIALS[0]);
  const [selectedLiquid, setSelectedLiquid] = useState(LIQUIDS[1]);
  const [objectVolume, setObjectVolume] = useState<number>(100); // cm³

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Math Calculations
  const objectMass = selectedMaterial.density * objectVolume; // grams
  const liquidDensity = selectedLiquid.density;

  // Status Archimedes
  let stateStatus: 'Mengapung' | 'Melayang' | 'Tenggelam' = 'Mengapung';
  if (Math.abs(selectedMaterial.density - liquidDensity) < 0.05) {
    stateStatus = 'Melayang';
  } else if (selectedMaterial.density > liquidDensity) {
    stateStatus = 'Tenggelam';
  }

  // Buoyant force calculation F_a = rho * g * V
  // g = 9.8 m/s^2, V converted to m^3
  const buoyantForceNewtons = ((liquidDensity * 1000) * 9.8 * (objectVolume * 1e-6)).toFixed(3);
  const weightNewtons = ((objectMass / 1000) * 9.8).toFixed(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Beaker / Tank Dimensions
    const tankX = canvas.width / 2 - 120;
    const tankY = 50;
    const tankW = 240;
    const tankH = 220;
    const waterLevel = tankY + 60;

    // Background Tank Container
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tankX, tankY, tankW, tankH);

    // Liquid Fill
    ctx.fillStyle = selectedLiquid.color;
    ctx.fillRect(tankX, waterLevel, tankW, tankH - (waterLevel - tankY));

    // Liquid surface line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tankX, waterLevel);
    ctx.lineTo(tankX + tankW, waterLevel);
    ctx.stroke();

    // Beaker Glass Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(tankX, tankY, tankW, tankH);

    // Position of Object based on floating state
    const boxSize = Math.max(35, Math.min(65, Math.sqrt(objectVolume) * 4));
    const objX = canvas.width / 2 - boxSize / 2;
    let objY = waterLevel - boxSize / 2;

    if (stateStatus === 'Tenggelam') {
      objY = tankY + tankH - boxSize - 5;
    } else if (stateStatus === 'Melayang') {
      objY = waterLevel + (tankH - (waterLevel - tankY)) / 2 - boxSize / 2;
    } else {
      // Mengapung: fraction submerged = rho_obj / rho_liquid
      const submergedRatio = Math.min(1, selectedMaterial.density / liquidDensity);
      objY = waterLevel - boxSize * (1 - submergedRatio);
    }

    // Draw Submerged Block
    ctx.fillStyle = selectedMaterial.color;
    ctx.fillRect(objX, objY, boxSize, boxSize);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(objX, objY, boxSize, boxSize);

    // Label on Object
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${objectMass.toFixed(0)}g`, objX + boxSize / 2, objY + boxSize / 2 + 4);

    // Draw Vector Arrows: Gravity (W) vs Buoyancy (F_a)
    // Down Arrow (W)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(objX + boxSize / 2, objY + boxSize);
    ctx.lineTo(objX + boxSize / 2, objY + boxSize + 30);
    ctx.stroke();
    // Arrow head
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(objX + boxSize / 2, objY + boxSize + 35);
    ctx.lineTo(objX + boxSize / 2 - 5, objY + boxSize + 28);
    ctx.lineTo(objX + boxSize / 2 + 5, objY + boxSize + 28);
    ctx.fill();

    // Up Arrow (F_a)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(objX + boxSize / 2, objY);
    ctx.lineTo(objX + boxSize / 2, objY - 30);
    ctx.stroke();
    // Arrow head
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(objX + boxSize / 2, objY - 35);
    ctx.lineTo(objX + boxSize / 2 - 5, objY - 28);
    ctx.lineTo(objX + boxSize / 2 + 5, objY - 28);
    ctx.fill();

  }, [selectedMaterial, selectedLiquid, objectVolume, objectMass, stateStatus, liquidDensity]);

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

        {/* State Badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg backdrop-blur ${
              stateStatus === 'Mengapung'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : stateStatus === 'Melayang'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            Benda {stateStatus}
          </span>
        </div>

        {/* Force Telemetry */}
        <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl p-3 text-xs space-y-1 text-slate-300">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Berat Benda (W):</span>
            <span className="font-mono text-rose-400 font-bold">{weightNewtons} N</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Gaya Apung (Fₐ):</span>
            <span className="font-mono text-cyan-400 font-bold">{buoyantForceNewtons} N</span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Material Selection */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-slate-200 text-sm font-semibold block">Jenis Benda Padat</label>
          <div className="space-y-1.5">
            {MATERIALS.map((mat) => (
              <button
                key={mat.name}
                onClick={() => setSelectedMaterial(mat)}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-xs font-semibold transition border ${
                  selectedMaterial.name === mat.name
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{mat.name}</span>
                <span className="font-mono text-slate-400">{mat.density} g/cm³</span>
              </button>
            ))}
          </div>
        </div>

        {/* Liquid Selection */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="text-slate-200 text-sm font-semibold block">Cairan Wadah</label>
          <div className="space-y-2">
            {LIQUIDS.map((liq) => (
              <button
                key={liq.name}
                onClick={() => setSelectedLiquid(liq)}
                className={`w-full flex justify-between items-center px-3 py-2.5 rounded-lg text-xs font-semibold transition border ${
                  selectedLiquid.name === liq.name
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{liq.name}</span>
                <span className="font-mono text-slate-400">{liq.density} g/cm³</span>
              </button>
            ))}
          </div>
        </div>

        {/* Volume Slider & Summary */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
          <div>
            <div className="flex justify-between items-center text-sm mb-2">
              <label className="text-slate-200 font-semibold">Volume Benda</label>
              <span className="font-mono text-teal-400 font-bold">{objectVolume} cm³</span>
            </div>
            <input
              type="range"
              min="20"
              max="250"
              value={objectVolume}
              onChange={(e) => setObjectVolume(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Massa Jenis Benda:</span>
              <span className="font-mono text-white">{selectedMaterial.density} g/cm³</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Massa Jenis Cairan:</span>
              <span className="font-mono text-white">{selectedLiquid.density} g/cm³</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-1.5">
              <span className="text-slate-400">Total Massa:</span>
              <span className="font-mono text-teal-300 font-bold">{objectMass.toFixed(1)} gram</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
