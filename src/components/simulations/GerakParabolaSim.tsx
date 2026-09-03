'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Play, RotateCcw, Info, Rocket, Zap, CircleDot } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

type ObjectType = 'rocket' | 'plasma' | 'drone';

export default function GerakParabolaSim() {
  const [angleDeg, setAngleDeg] = useState<number>(45); // Launch angle theta (degrees)
  const [v0, setV0] = useState<number>(35); // Initial velocity v0 (m/s)
  const [gravity, setGravity] = useState<number>(9.8); // Gravity g (m/s^2)
  const [height, setHeight] = useState<number>(0); // Initial height h0 (m)
  const [objectType, setObjectType] = useState<ObjectType>('rocket');
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [simTime, setSimTime] = useState<number>(0);
  const [showVectors, setShowVectors] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);

  // Physics Calculations Accounting for Initial Height (h0):
  const angleRad = (angleDeg * Math.PI) / 180;
  const v0x = v0 * Math.cos(angleRad);
  const v0y = v0 * Math.sin(angleRad);

  // Flight time t_total = (v0y + sqrt(v0y^2 + 2*g*h0)) / g
  const flightTime = (v0y + Math.sqrt(v0y * v0y + 2 * gravity * height)) / gravity;
  // Max Height H_max = h0 + v0y^2 / (2g)
  const maxH = height + (v0y * v0y) / (2 * gravity);
  // Max Distance Range R = v0x * t_total
  const maxRange = v0x * flightTime;

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const originX = 50;
    const originY = canvas.height - 40 - height * 3;
    const pxPerM = 3.5;

    // Draw Coordinate Grid & Ground
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Ground Line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 40);
    ctx.lineTo(canvas.width, canvas.height - 40);
    ctx.stroke();

    // Launcher Base & Cannon Barrel
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(-angleRad);

    const barrelGrad = ctx.createLinearGradient(0, -8, 0, 8);
    barrelGrad.addColorStop(0, '#94a3b8');
    barrelGrad.addColorStop(0.5, '#475569');
    barrelGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(0, -8, 38, 16);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, -8, 38, 16);
    ctx.restore();

    // --- ALWAYS DRAW THEORETICAL GUIDE TRAJECTORY LINE ---
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    for (let t = 0; t <= flightTime; t += 0.05) {
      const tx = v0x * t;
      const ty = v0y * t - 0.5 * gravity * t * t;
      ctx.lineTo(originX + tx * pxPerM, originY - ty * pxPerM);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Projectile Object at current position or at nozzle
    const currentT = Math.min(simTime, flightTime);
    const currentX = v0x * currentT;
    const currentY = v0y * currentT - 0.5 * gravity * currentT * currentT;
    const currentVy = v0y - gravity * currentT;

    const ballCanvasX = isFiring || simTime > 0 ? originX + currentX * pxPerM : originX + Math.cos(angleRad) * 35;
    const ballCanvasY = isFiring || simTime > 0 ? originY - currentY * pxPerM : originY - Math.sin(angleRad) * 35;

    ctx.save();
    ctx.translate(ballCanvasX, ballCanvasY);
    const flightAngle = isFiring || simTime > 0 ? Math.atan2(-currentVy, v0x) : -angleRad;
    ctx.rotate(flightAngle);

    if (objectType === 'rocket') {
      if (isFiring && currentY > 0) {
        const flameGlow = ctx.createRadialGradient(-16, 0, 2, -16, 0, 14);
        flameGlow.addColorStop(0, '#ef4444');
        flameGlow.addColorStop(0.5, '#f59e0b');
        flameGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = flameGlow;
        ctx.beginPath();
        ctx.arc(-16, 0, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -6);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (objectType === 'plasma') {
      const plasmaGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
      plasmaGlow.addColorStop(0, '#ffffff');
      plasmaGlow.addColorStop(0.4, '#38bdf8');
      plasmaGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = plasmaGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // Telemetry Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`X = ${currentX.toFixed(1)} m`, ballCanvasX + 10, ballCanvasY - 15);
    ctx.fillText(`Y = ${(height + currentY).toFixed(1)} m`, ballCanvasX + 10, ballCanvasY - 3);
  }, [angleDeg, v0, gravity, height, simTime, flightTime, v0x, v0y, angleRad, objectType, isFiring]);

  useEffect(() => {
    let animationId: number;
    if (isFiring) {
      const startTime = Date.now() - simTime * 1000;
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= flightTime) {
          setSimTime(flightTime);
          setIsFiring(false);
        } else {
          setSimTime(elapsed);
          animationId = requestAnimationFrame(animate);
        }
      };
      animationId = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationId);
  }, [isFiring, flightTime, simTime]);

  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  const handleReset = () => {
    setIsFiring(false);
    setSimTime(0);
  };

  const handleFire = () => {
    setSimTime(0);
    setIsFiring(true);
  };

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

        {/* Controls Overlay */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={handleFire}
            disabled={isFiring}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition"
          >
            <Play size={14} /> Tembak Peluru
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {/* Telemetry Badge */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-purple-500/40 rounded-xl p-3 text-right text-xs">
          <div className="text-slate-400">Jarak Maks (<MathFormula formula="R" />):</div>
          <div className="font-mono text-lg text-purple-400 font-extrabold">{maxRange.toFixed(1)} m</div>
          <div className="text-slate-400 mt-1">Tinggi Maks (<MathFormula formula="H_{\text{max}}" />):</div>
          <div className="font-mono text-cyan-400 font-bold">{maxH.toFixed(1)} m</div>
          <div className="text-slate-400 mt-1">Waktu Udara (<MathFormula formula="t_{\text{total}}" />):</div>
          <div className="font-mono text-amber-400 font-bold">{flightTime.toFixed(2)} s</div>
        </div>
      </div>

      {/* Object Asset Selector & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <label className="text-slate-200 text-xs font-semibold block">Pilih Objek Peluncur</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setObjectType('rocket')}
              className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 border transition ${
                objectType === 'rocket' ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Rocket size={14} />
              <span className="text-[9px]">Roket</span>
            </button>
            <button
              onClick={() => setObjectType('plasma')}
              className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 border transition ${
                objectType === 'plasma' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Zap size={14} />
              <span className="text-[9px]">Plasma</span>
            </button>
            <button
              onClick={() => setObjectType('drone')}
              className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 border transition ${
                objectType === 'drone' ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <CircleDot size={14} />
              <span className="text-[9px]">Drone</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Sudut (θ)</label>
            <span className="font-mono text-purple-400 font-bold">{angleDeg}°</span>
          </div>
          <input
            type="range"
            min="10"
            max="85"
            value={angleDeg}
            onChange={(e) => {
              setAngleDeg(Number(e.target.value));
              setSimTime(0);
            }}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Kecepatan (v₀)</label>
            <span className="font-mono text-cyan-400 font-bold">{v0} m/s</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            value={v0}
            onChange={(e) => {
              setV0(Number(e.target.value));
              setSimTime(0);
            }}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Tinggi Awal (h₀)</label>
            <span className="font-mono text-amber-400 font-bold">{height} m</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={height}
            onChange={(e) => {
              setHeight(Number(e.target.value));
              setSimTime(0);
            }}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
