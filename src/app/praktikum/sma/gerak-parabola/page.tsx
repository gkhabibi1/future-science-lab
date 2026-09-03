"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Save, Settings2, Sparkles, ArrowLeft, Rocket, Zap, CircleDot } from 'lucide-react';
import Link from 'next/link';
import MathFormula from '@/components/MathFormula';

type ObjectType = 'rocket' | 'plasma' | 'drone';

export default function GerakParabola() {
  // State Parameter Fisika
  const [v0, setV0] = useState(50);
  const [angle, setAngle] = useState(45);
  const [height, setHeight] = useState(0);
  const [objectType, setObjectType] = useState<ObjectType>('rocket');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);

  // Accurate Physics Math Accounting for Initial Height (h0):
  const g = 9.8;
  const angleRad = (angle * Math.PI) / 180;
  const v0x = v0 * Math.cos(angleRad);
  const v0y = v0 * Math.sin(angleRad);

  // Total Flight Time accounting for h0:
  const flightTime = (v0y + Math.sqrt(v0y * v0y + 2 * g * height)) / g;
  // Maximum Horizontal Distance (Range R):
  const maxRange = v0x * flightTime;
  // Maximum Height (H_max):
  const maxH = height + (v0y * v0y) / (2 * g);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, heightCanvas: number) => {
    // Sci-Fi Dark Grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, heightCanvas); ctx.stroke();
    }
    for (let i = 0; i < heightCanvas; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // High-tech Ground Base
    const groundY = heightCanvas - 15;
    const grad = ctx.createLinearGradient(0, groundY, 0, heightCanvas);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundY, width, 15);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
  };

  const drawObjectAsset = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    currVx: number,
    currVy: number,
    inFlight: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Orientation Angle along flight trajectory
    const flightAngle = inFlight ? Math.atan2(-currVy, currVx) : -angleRad;
    ctx.rotate(flightAngle);

    if (objectType === 'rocket') {
      // --- 🚀 ROKET SCI-FI ASSET ---
      if (inFlight) {
        const flameGlow = ctx.createRadialGradient(-18, 0, 2, -18, 0, 16);
        flameGlow.addColorStop(0, '#ef4444');
        flameGlow.addColorStop(0.5, '#f59e0b');
        flameGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = flameGlow;
        ctx.beginPath();
        ctx.arc(-18, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-24 - Math.random() * 8, -5);
        ctx.lineTo(-24 - Math.random() * 8, 5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, -7);
      ctx.lineTo(-12, 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(8, -5);
      ctx.lineTo(8, 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-10, -8, 6, 16);
    } else if (objectType === 'plasma') {
      // --- 🔮 PLASMA ENERGY ORB ASSET ---
      const plasmaGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
      plasmaGlow.addColorStop(0, '#ffffff');
      plasmaGlow.addColorStop(0.3, '#38bdf8');
      plasmaGlow.addColorStop(0.7, '#818cf8');
      plasmaGlow.addColorStop(1, 'rgba(129, 140, 248, 0)');
      ctx.fillStyle = plasmaGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // --- 🛸 DRONE SCI-FI ASSET ---
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      const ringTime = Date.now() * 0.01;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, Math.abs(5 * Math.sin(ringTime)) + 0.1, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, -2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas.width, canvas.height);

    const scale = 2.2;
    const originX = 50;
    const originY = canvas.height - 15 - height * scale;

    // --- 1. Draw Launcher Cannon ---
    ctx.save();
    ctx.translate(originX, originY);

    // Launcher Base Support Pillar
    ctx.fillStyle = '#334155';
    ctx.fillRect(-15, 0, 30, originY < canvas.height - 15 ? canvas.height - 15 - originY : 15);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Turret Barrel (Rotated)
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

    // --- 2. ALWAYS DRAW THEORETICAL GUIDE TRAJECTORY LINE ---
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);

    const step = flightTime / 40;
    for (let t = 0; t <= flightTime; t += step) {
      const tx = originX + v0x * t * scale;
      const ty = originY - (v0y * t - 0.5 * g * t * t) * scale;
      ctx.lineTo(tx, ty);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Current Simulated Position
    const currT = Math.min(tRef.current, flightTime);
    const currVx = v0x;
    const currVy = v0y - g * currT;
    const x = originX + v0x * currT * scale;
    const y = originY - (v0y * currT - 0.5 * g * currT * currT) * scale;

    // --- 3. DRAW ACTUAL TRAIL SO FAR ---
    if (trailRef.current.length > 1) {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);
      for (let i = 1; i < trailRef.current.length; i++) {
        ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
      }
      ctx.stroke();
    }

    // --- 4. DRAW PROJECTILE OBJECT ---
    const nozzleX = originX + Math.cos(angleRad) * 35;
    const nozzleY = originY - Math.sin(angleRad) * 35;

    const renderX = tRef.current > 0 ? x : nozzleX;
    const renderY = tRef.current > 0 ? y : nozzleY;

    drawObjectAsset(ctx, renderX, renderY, currVx, currVy, tRef.current > 0);

    // --- 5. DRAW VELOCITY VECTORS & METRICS ---
    if (showVectors && tRef.current > 0 && renderY < canvas.height - 15) {
      // Horizontal Vx Vector Arrow (Cyan)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(renderX, renderY);
      ctx.lineTo(renderX + currVx * 0.8, renderY);
      ctx.stroke();

      // Vertical Vy Vector Arrow (Rose)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(renderX, renderY);
      ctx.lineTo(renderX, renderY - currVy * 0.8);
      ctx.stroke();

      // Position Tag
      const currentDistanceM = v0x * currT;
      const currentHeightM = height + (v0y * currT - 0.5 * g * currT * currT);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`X = ${currentDistanceM.toFixed(1)} m`, renderX + 15, renderY - 15);
      ctx.fillText(`Y = ${Math.max(0, currentHeightM).toFixed(1)} m`, renderX + 15, renderY - 3);
    }
  }, [v0x, v0y, g, height, angleRad, flightTime, objectType, showVectors]);

  // Main Animation Loop
  useEffect(() => {
    let animId: number;
    if (isSimulating) {
      const loop = () => {
        tRef.current += 0.04;
        const currT = Math.min(tRef.current, flightTime);
        const scale = 2.2;
        const originX = 50;
        const originY = (canvasRef.current?.height || 450) - 15 - height * scale;
        const x = originX + v0x * currT * scale;
        const y = originY - (v0y * currT - 0.5 * g * currT * currT) * scale;
        
        trailRef.current.push({ x, y });
        renderCanvas();

        if (tRef.current >= flightTime || y >= (canvasRef.current?.height || 450) - 15) {
          setIsSimulating(false);
        } else {
          animId = requestAnimationFrame(loop);
        }
      };
      animId = requestAnimationFrame(loop);
    } else {
      renderCanvas();
    }
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, flightTime, v0x, v0y, g, height, renderCanvas]);

  // Reset when sliders or parameters change
  useEffect(() => {
    tRef.current = 0;
    trailRef.current = [];
    setIsSimulating(false);
    renderCanvas();
  }, [v0, angle, height, objectType, renderCanvas]);

  const handleStartPause = () => {
    if (isSimulating) {
      setIsSimulating(false);
    } else {
      if (tRef.current >= flightTime) {
        tRef.current = 0;
        trailRef.current = [];
      }
      setIsSimulating(true);
    }
  };

  const handleReset = () => {
    tRef.current = 0;
    trailRef.current = [];
    setIsSimulating(false);
    renderCanvas();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline">
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-purple-400">Tingkat SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Simulasi Gerak Parabola Interaktif</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Laboratorium Virtual Fisika Presisi (Preview Lintasan & Telemetri Lengkap)</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles size={14} /> Enhanced Physics Engine
          </div>
        </header>

        {/* LaTeX Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-purple-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Lintasan:</span>
            <MathFormula formula="y(t) = h_0 + v_0 \sin\theta \cdot t - \frac{1}{2}g t^2" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Jarak Maksimum (R):</span>
            <MathFormula formula="R = v_0 \cos\theta \cdot t_{\text{total}}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Tinggi Maksimum (H):</span>
            <MathFormula formula="H_{\text{max}} = h_0 + \frac{(v_0 \sin\theta)^2}{2g}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Panel Kontrol */}
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur p-6 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Settings2 size={18} />
              <span>Parameter & Objek</span>
            </div>

            {/* Object Asset Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Pilih Aset Objek Peluncur</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setObjectType('rocket')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                    objectType === 'rocket'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Rocket size={18} />
                  <span className="text-[10px]">Roket</span>
                </button>

                <button
                  onClick={() => setObjectType('plasma')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                    objectType === 'plasma'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Zap size={18} />
                  <span className="text-[10px]">Plasma</span>
                </button>

                <button
                  onClick={() => setObjectType('drone')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                    objectType === 'drone'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <CircleDot size={18} />
                  <span className="text-[10px]">Drone</span>
                </button>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="space-y-5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-2">
                  <span>Kecepatan Awal (v₀)</span>
                  <span className="font-mono text-cyan-400 font-bold">{v0} m/s</span>
                </div>
                <input type="range" min="10" max="100" value={v0} onChange={(e) => setV0(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-500 cursor-pointer" />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-2">
                  <span>Sudut Elevasi (θ)</span>
                  <span className="font-mono text-purple-400 font-bold">{angle}°</span>
                </div>
                <input type="range" min="0" max="90" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-purple-500 cursor-pointer" />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-2">
                  <span>Ketinggian Awal (h₀)</span>
                  <span className="font-mono text-amber-400 font-bold">{height} m</span>
                </div>
                <input type="range" min="0" max="200" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300 font-semibold">Tampilkan Vektor Kecepatan</span>
                <button
                  onClick={() => setShowVectors(!showVectors)}
                  className={`w-10 h-5 rounded-full p-0.5 transition ${
                    showVectors ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition transform ${showVectors ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button onClick={handleStartPause} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 rounded-2xl font-bold text-xs shadow-lg transition-all active:scale-95">
                <Play size={16} fill="currentColor" /> {isSimulating ? 'Pause Simulasi' : 'Mulai Tembak Peluru'}
              </button>
              <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl font-bold text-xs transition-all border border-slate-700 active:scale-95">
                <RotateCcw size={16} /> Reset Lintasan
              </button>
            </div>
          </div>

          {/* Area Visualisasi */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
               <canvas ref={canvasRef} width={800} height={450} className="w-full h-auto rounded-2xl cursor-crosshair block" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-slate-900/80 p-4 rounded-2xl border border-indigo-500/30 text-xs space-y-1">
                  <span className="block font-bold text-indigo-400 uppercase tracking-wide">Jarak Max Tempuh (R)</span>
                  <span className="text-xl font-mono font-black text-indigo-300">{maxRange.toFixed(2)} m</span>
                  <span className="block text-[10px] text-slate-400">Total Waktu: {flightTime.toFixed(2)} s</span>
               </div>
               <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30 text-xs space-y-1">
                  <span className="block font-bold text-emerald-400 uppercase tracking-wide">Tinggi Max (H)</span>
                  <span className="text-xl font-mono font-black text-emerald-300">{maxH.toFixed(2)} m</span>
                  <span className="block text-[10px] text-slate-400">Tinggi Awal (h₀): {height} m</span>
               </div>
               <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-2xl font-bold text-xs transition-all">
                  <Save size={16} /> Simpan Data Praktikum
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
