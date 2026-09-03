"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Settings, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import MathFormula from '@/components/MathFormula';

export default function NewtonSimulation() {
  const [mass, setMass] = useState(10); // kg
  const [force, setForce] = useState(50); // Newton
  const [mu, setMu] = useState(0.3); // Koefisien gesek kinetis
  const [isSimulating, setIsSimulating] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // State untuk pergerakan
  const velocity = useRef(0);
  const positionX = useRef(50);

  const g = 9.8;
  const frictionForce = mu * mass * g;
  const netForce = force - frictionForce;
  // Jika gaya tidak kuat melawan gesekan, percepatan = 0
  const acceleration = netForce > 0 ? netForce / mass : 0;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gambar ulang layar
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background Grid Sci-Fi
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Gambar Lantai Bergesekan
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 300, canvas.width, 25);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 325);
      ctx.lineTo(x + 8, 300);
      ctx.stroke();
    }

    // Gambar Balok Metalik (Dark theme & glow)
    const posX = positionX.current;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(posX, 245, 60, 55);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(posX, 245, 60, 55);

    // Teks Informasi di atas balok
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${mass} kg`, posX + 30, 275);

    // Vektor Gaya Dorong (F -> Kanan)
    if (force > 0) {
      const arrowLen = Math.min(120, force * 0.5);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(posX + 60, 272);
      ctx.lineTo(posX + 60 + arrowLen, 272);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(posX + 60 + arrowLen + 6, 272);
      ctx.lineTo(posX + 60 + arrowLen, 267);
      ctx.lineTo(posX + 60 + arrowLen, 277);
      ctx.fill();
      ctx.fillText(`F = ${force} N`, posX + 60 + arrowLen / 2, 260);
    }

    // Vektor Gaya Gesek (f_k <- Kiri)
    if (frictionForce > 0 && posX > 50) {
      const fArrowLen = Math.min(100, frictionForce * 0.5);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(posX, 272);
      ctx.lineTo(posX - fArrowLen, 272);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.moveTo(posX - fArrowLen - 6, 272);
      ctx.lineTo(posX - fArrowLen, 267);
      ctx.lineTo(posX - fArrowLen, 277);
      ctx.fill();
      ctx.fillText(`f_k = ${frictionForce.toFixed(1)} N`, posX - fArrowLen / 2, 260);
    }
  }, [mass, force, frictionForce]);

  // Main Loop Frame Animation
  useEffect(() => {
    let animId: number;
    if (isSimulating) {
      const loop = () => {
        const dt = 0.05;
        velocity.current += acceleration * dt;
        positionX.current += velocity.current * dt * 10; // Skala visual

        renderCanvas();

        const canvas = canvasRef.current;
        if (canvas && positionX.current < canvas.width - 60) {
          animId = requestAnimationFrame(loop);
        } else {
          setIsSimulating(false);
        }
      };
      animId = requestAnimationFrame(loop);
    } else {
      renderCanvas();
    }
    return () => cancelAnimationFrame(animId);
  }, [isSimulating, acceleration, renderCanvas]);

  const startStop = () => {
    if (isSimulating) {
      setIsSimulating(false);
    } else {
      const canvas = canvasRef.current;
      if (canvas && positionX.current >= canvas.width - 60) {
        positionX.current = 50;
        velocity.current = 0;
      }
      setIsSimulating(true);
    }
  };

  const reset = useCallback(() => {
    positionX.current = 50;
    velocity.current = 0;
    setIsSimulating(false);
    renderCanvas();
  }, [renderCanvas]);

  // Render awal & reset saat parameter berubah
  useEffect(() => {
    reset();
  }, [mass, force, mu, reset]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/" className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline">
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-blue-400">Tingkat SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Simulasi Hukum II Newton & Gesekan</h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Laboratorium Virtual Dinamika Gerak Benda & Gaya Gesek (Formulasi Presisi LaTeX)</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
            <Sparkles size={14} /> Newton Mechanics Engine
          </div>
        </header>

        {/* LaTeX Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-cyan-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Hukum II Newton:</span>
            <MathFormula formula="\sum F = m \cdot a \implies a = \frac{\sum F}{m}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Gaya Gesek Kinetis:</span>
            <MathFormula formula="f_k = \mu_k \cdot N = \mu_k m g" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 backdrop-blur p-6 rounded-3xl border border-slate-800 space-y-6">
            <h2 className="flex items-center gap-2 font-bold text-cyan-400 text-sm"><Settings size={18}/> Parameter Input</h2>
            
            <div className="space-y-5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-2">
                  <span>Massa Balok (m)</span>
                  <span className="font-mono text-cyan-400 font-bold">{mass} kg</span>
                </div>
                <input type="range" min="1" max="50" value={mass} onChange={(e) => setMass(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-500 cursor-pointer" />
              </div>
              
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-2">
                  <span>Gaya Dorong (F)</span>
                  <span className="font-mono text-blue-400 font-bold">{force} N</span>
                </div>
                <input type="range" min="0" max="500" value={force} onChange={(e) => setForce(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer" />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-2 flex items-center gap-1">
                  <span>Koefisien Gesek (<MathFormula formula="\mu_k" />)</span>
                  <span className="font-mono text-rose-400 font-bold">{mu}</span>
                </div>
                <input type="range" min="0" max="1" step="0.1" value={mu} onChange={(e) => setMu(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg accent-rose-500 cursor-pointer" />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button onClick={startStop} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-3 rounded-2xl font-bold text-xs shadow-lg transition-all flex justify-center items-center gap-2 active:scale-95">
                <Play size={16} fill="currentColor"/> {isSimulating ? 'Pause' : 'Dorong!'}
              </button>
              <button onClick={reset} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-2xl font-bold text-xs transition-all border border-slate-700 flex justify-center items-center gap-2 active:scale-95">
                <RotateCcw size={16}/> Reset
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-950 p-3 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
               <canvas ref={canvasRef} width={600} height={360} className="w-full bg-slate-950 rounded-2xl block" />
            </div>
            
            {/* Panel Hasil Kalkulasi Real-time */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-rose-500/30 space-y-1">
                <div className="text-slate-400 font-semibold">Gaya Gesek (<MathFormula formula="f_k" />)</div>
                <div className="text-xl font-mono font-bold text-rose-400">{frictionForce.toFixed(1)} N</div>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-blue-500/30 space-y-1">
                <div className="text-slate-400 font-semibold">Gaya Total (<MathFormula formula="\sum F" />)</div>
                <div className="text-xl font-mono font-bold text-cyan-400">{netForce > 0 ? netForce.toFixed(1) : 0} N</div>
              </div>
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
                <div className="text-slate-400 font-semibold">Percepatan (<MathFormula formula="a" />)</div>
                <div className="text-xl font-mono font-bold text-emerald-400">{acceleration.toFixed(2)} m/s²</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
