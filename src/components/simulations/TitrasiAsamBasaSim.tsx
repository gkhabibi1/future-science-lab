'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TestTube, Play, RotateCcw, Info, Droplet } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

export default function TitrasiAsamBasaSim() {
  const [volAcid, setVolAcid] = useState<number>(25); // Volume HCl (mL)
  const [concAcid, setConcAcid] = useState<number>(0.1); // Molaritas HCl (M)
  const [concBase, setConcBase] = useState<number>(0.1); // Molaritas NaOH (M)
  const [titranVolume, setTitranVolume] = useState<number>(0); // Volume NaOH added (mL)
  const [isTitrating, setIsTitrating] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rippleRef = useRef<number>(0);

  // Chemistry Calculations:
  // Equivalence point volume: V_eq = (M_A * V_A) / M_B
  const equivVolume = (concAcid * volAcid) / concBase;

  let currentPH = 7;
  const molesAcidInitial = concAcid * (volAcid / 1000);
  const molesBaseAdded = concBase * (titranVolume / 1000);

  if (molesBaseAdded < molesAcidInitial) {
    const molesUnreactedAcid = molesAcidInitial - molesBaseAdded;
    const totalVolumeLiters = (volAcid + titranVolume) / 1000;
    const concH = molesUnreactedAcid / totalVolumeLiters;
    currentPH = Math.max(0.5, -Math.log10(concH));
  } else if (Math.abs(molesBaseAdded - molesAcidInitial) < 1e-6) {
    currentPH = 7.0;
  } else {
    const molesExcessBase = molesBaseAdded - molesAcidInitial;
    const totalVolumeLiters = (volAcid + titranVolume) / 1000;
    const concOH = molesExcessBase / totalVolumeLiters;
    const pOH = -Math.log10(concOH);
    currentPH = Math.min(13.8, 14 - pOH);
  }

  // Phenolphthalein (PP) indicator color
  let liquidColor = 'rgba(248, 250, 252, 0.3)';
  if (currentPH >= 8.3 && currentPH < 10) {
    const pinkAlpha = 0.3 + ((currentPH - 8.3) / 1.7) * 0.4;
    liquidColor = `rgba(244, 114, 182, ${pinkAlpha})`;
  } else if (currentPH >= 10) {
    liquidColor = 'rgba(236, 72, 153, 0.9)';
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isTitrating) {
      intervalId = setInterval(() => {
        setTitranVolume((prev) => {
          if (prev >= 60) {
            setIsTitrating(false);
            return 60;
          }
          return Number((prev + 0.2).toFixed(1));
        });
      }, 60);
    }
    return () => clearInterval(intervalId);
  }, [isTitrating]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Burette & Flask
    const buretteX = 140;
    const buretteY = 20;
    const buretteW = 24;
    const buretteH = 160;

    // Burette Container (Glass)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(buretteX - buretteW / 2, buretteY, buretteW, buretteH);

    // Titran Liquid level inside burette
    const remainingTitranRatio = Math.max(0, (60 - titranVolume) / 60);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(
      buretteX - buretteW / 2 + 2,
      buretteY + buretteH * (1 - remainingTitranRatio),
      buretteW - 4,
      buretteH * remainingTitranRatio
    );

    // Valve
    ctx.fillStyle = isTitrating ? '#f59e0b' : '#475569';
    ctx.fillRect(buretteX - 18, buretteY + buretteH, 36, 10);

    // Falling Drop animation
    if (isTitrating && titranVolume < 60) {
      const dropY = (Date.now() % 300) * 0.2;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(buretteX, buretteY + buretteH + 15 + dropY, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Erlenmeyer Flask below burette
    const flaskY = buretteY + buretteH + 35;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(buretteX - 12, flaskY);
    ctx.lineTo(buretteX - 12, flaskY + 20);
    ctx.lineTo(buretteX - 55, flaskY + 90);
    ctx.lineTo(buretteX + 55, flaskY + 90);
    ctx.lineTo(buretteX + 12, flaskY + 20);
    ctx.lineTo(buretteX + 12, flaskY);
    ctx.closePath();
    ctx.stroke();

    // Solution Liquid in Flask
    ctx.fillStyle = liquidColor;
    ctx.beginPath();
    ctx.moveTo(buretteX - 25, flaskY + 45);
    ctx.lineTo(buretteX - 53, flaskY + 88);
    ctx.lineTo(buretteX + 53, flaskY + 88);
    ctx.lineTo(buretteX + 25, flaskY + 45);
    ctx.closePath();
    ctx.fill();

    // 2. Live pH Titration Curve (Right side graph)
    const graphX = 260;
    const graphY = 30;
    const graphW = 310;
    const graphH = 240;

    // Graph Background Grid
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(graphX, graphY, graphW, graphH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(graphX, graphY, graphW, graphH);

    // pH 7 Equivalence Line
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.setLineDash([4, 4]);
    const ph7Y = graphY + graphH - (7 / 14) * graphH;
    ctx.beginPath();
    ctx.moveTo(graphX, ph7Y);
    ctx.lineTo(graphX + graphW, ph7Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot pH Curve Line up to current titranVolume
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let v = 0; v <= titranVolume; v += 0.5) {
      const vLiters = v / 1000;
      const mBase = concBase * vLiters;
      let calcPH = 7;
      if (mBase < molesAcidInitial) {
        const concH = (molesAcidInitial - mBase) / ((volAcid + v) / 1000);
        calcPH = Math.max(0.5, -Math.log10(concH));
      } else if (Math.abs(mBase - molesAcidInitial) < 1e-6) {
        calcPH = 7.0;
      } else {
        const concOH = (mBase - molesAcidInitial) / ((volAcid + v) / 1000);
        calcPH = Math.min(13.8, 14 - (-Math.log10(concOH)));
      }

      const px = graphX + (v / 60) * graphW;
      const py = graphY + graphH - (calcPH / 14) * graphH;

      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('0 mL', graphX, graphY + graphH + 15);
    ctx.fillText(`V_eq (${equivVolume.toFixed(1)} mL)`, graphX + (equivVolume / 60) * graphW - 20, graphY + graphH + 15);
    ctx.fillText('60 mL', graphX + graphW - 30, graphY + graphH + 15);
  }, [titranVolume, isTitrating, liquidColor, currentPH, concAcid, volAcid, concBase, molesAcidInitial, equivVolume]);

  const handleReset = () => {
    setIsTitrating(false);
    setTitranVolume(0);
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

        {/* Action Controls */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex gap-1.5 sm:gap-2 z-10">
          <button
            onClick={() => setIsTitrating(!isTitrating)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-white text-[11px] sm:text-xs font-bold shadow-lg transition ${
              isTitrating ? 'bg-amber-600 hover:bg-amber-500' : 'bg-pink-600 hover:bg-pink-500'
            }`}
          >
            <Droplet size={13} /> {isTitrating ? 'Hentikan' : 'Mulai Teteskan'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] sm:text-xs font-semibold border border-slate-700 backdrop-blur transition"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>

        {/* Live Telemetry Badge */}
        <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-slate-900/90 backdrop-blur border border-pink-500/40 rounded-lg sm:rounded-xl p-2 sm:p-3 text-right text-[10px] sm:text-xs z-10">
          <div className="text-slate-400">Titran (<MathFormula formula="V_B" />):</div>
          <div className="font-mono text-base sm:text-lg text-pink-400 font-extrabold">{titranVolume.toFixed(1)} mL</div>
          <div className="text-slate-400 mt-0.5 sm:mt-1">pH Larutan:</div>
          <div className="font-mono text-cyan-400 font-bold">{currentPH.toFixed(2)}</div>
        </div>
      </div>

      {/* Variabel Bebas Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Volume Asam (<MathFormula formula="V_A" />)</label>
            <span className="font-mono text-pink-400 font-bold">{volAcid} mL</span>
          </div>
          <input
            type="range"
            min="10"
            max="50"
            step="5"
            value={volAcid}
            onChange={(e) => {
              setVolAcid(Number(e.target.value));
              handleReset();
            }}
            className="w-full accent-pink-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Molaritas Asam (<MathFormula formula="M_A" />)</label>
            <span className="font-mono text-purple-400 font-bold">{concAcid} M</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={concAcid}
            onChange={(e) => {
              setConcAcid(Number(e.target.value));
              handleReset();
            }}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Molaritas Basa (<MathFormula formula="M_B" />)</label>
            <span className="font-mono text-cyan-400 font-bold">{concBase} M</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={concBase}
            onChange={(e) => {
              setConcBase(Number(e.target.value));
              handleReset();
            }}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
