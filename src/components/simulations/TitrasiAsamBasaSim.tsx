'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TestTube, Play, RotateCcw, Info } from 'lucide-react';

export default function TitrasiAsamBasaSim() {
  const [titranVolume, setTitranVolume] = useState<number>(0); // Volume NaOH added (mL)
  const [acidConcentration] = useState<number>(0.1); // Molaritas HCl (M)
  const [acidVolume] = useState<number>(25); // Volume HCl (mL)
  const [baseConcentration] = useState<number>(0.1); // Molaritas NaOH (M)
  const [isTitrating, setIsTitrating] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Chemistry Calculations for Strong Acid (HCl) vs Strong Base (NaOH):
  // Equivalence point volume: V_eq = (M_A * V_A) / M_B = (0.1 * 25) / 0.1 = 25 mL
  const equivVolume = (acidConcentration * acidVolume) / baseConcentration;

  let currentPH = 7;
  const molesAcidInitial = acidConcentration * (acidVolume / 1000);
  const molesBaseAdded = baseConcentration * (titranVolume / 1000);

  if (molesBaseAdded < molesAcidInitial) {
    // Before equivalence point: excess H+
    const molesUnreactedAcid = molesAcidInitial - molesBaseAdded;
    const totalVolumeLiters = (acidVolume + titranVolume) / 1000;
    const concH = molesUnreactedAcid / totalVolumeLiters;
    currentPH = Math.max(1, -Math.log10(concH));
  } else if (Math.abs(molesBaseAdded - molesAcidInitial) < 1e-6) {
    // At equivalence point: neutral pH 7
    currentPH = 7.0;
  } else {
    // After equivalence point: excess OH-
    const molesExcessBase = molesBaseAdded - molesAcidInitial;
    const totalVolumeLiters = (acidVolume + titranVolume) / 1000;
    const concOH = molesExcessBase / totalVolumeLiters;
    const pOH = -Math.log10(concOH);
    currentPH = Math.min(13.8, 14 - pOH);
  }

  // Phenolphthalein (PP) indicator color:
  // pH < 8.2: colorless (transparent / slight acid pink)
  // pH 8.2 - 10: pale pink to vibrant magenta pink!
  let liquidColor = 'rgba(248, 250, 252, 0.4)'; // Clear solution
  if (currentPH >= 8.2 && currentPH < 10) {
    const pinkAlpha = 0.3 + (currentPH - 8.2) * 0.3;
    liquidColor = `rgba(244, 114, 182, ${pinkAlpha})`;
  } else if (currentPH >= 10) {
    liquidColor = 'rgba(236, 72, 153, 0.85)'; // Deep magenta
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isTitrating) {
      intervalId = setInterval(() => {
        setTitranVolume((prev) => {
          if (prev >= 50) {
            setIsTitrating(false);
            return 50;
          }
          return Number((prev + 0.2).toFixed(1));
        });
      }, 50);
    }
    return () => clearInterval(intervalId);
  }, [isTitrating]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Burette & Flask (Left side)
    const buretteX = 140;
    const buretteY = 20;
    const buretteW = 24;
    const buretteH = 160;

    // Burette Container (Glass)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(buretteX - buretteW / 2, buretteY, buretteW, buretteH);

    // Titran (NaOH) Liquid level inside burette
    const remainingTitranRatio = Math.max(0, (50 - titranVolume) / 50);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(
      buretteX - buretteW / 2 + 2,
      buretteY + buretteH * (1 - remainingTitranRatio),
      buretteW - 4,
      buretteH * remainingTitranRatio
    );

    // Stopcock Valve
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(buretteX - 18, buretteY + buretteH, 36, 10);

    // Falling Drop animation if titrating
    if (isTitrating && titranVolume < 50) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(buretteX, buretteY + buretteH + 20, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Erlenmeyer Flask (Labub Alas Datar) below burette
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

    // 2. Draw Live pH Titration Curve (Right side graph)
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
      // Calculate historical pH at volume v
      const vLiters = v / 1000;
      const mBase = baseConcentration * vLiters;
      let calcPH = 7;
      if (mBase < molesAcidInitial) {
        const concH = (molesAcidInitial - mBase) / ((acidVolume + v) / 1000);
        calcPH = Math.max(1, -Math.log10(concH));
      } else if (Math.abs(mBase - molesAcidInitial) < 1e-6) {
        calcPH = 7.0;
      } else {
        const concOH = (mBase - molesAcidInitial) / ((acidVolume + v) / 1000);
        calcPH = Math.min(13.8, 14 - (-Math.log10(concOH)));
      }

      const px = graphX + (v / 50) * graphW;
      const py = graphY + graphH - (calcPH / 14) * graphH;

      if (v === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('0 mL', graphX, graphY + graphH + 15);
    ctx.fillText('25 mL (Equiv)', graphX + graphW * 0.5 - 25, graphY + graphH + 15);
    ctx.fillText('50 mL', graphX + graphW - 30, graphY + graphH + 15);
    ctx.fillText('pH 14', graphX - 25, graphY + 10);
    ctx.fillText('pH 7', graphX - 25, ph7Y + 3);
    ctx.fillText('pH 0', graphX - 25, graphY + graphH);
  }, [titranVolume, isTitrating, liquidColor, currentPH, acidConcentration, acidVolume, baseConcentration, molesAcidInitial]);

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
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={() => setIsTitrating(!isTitrating)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition ${
              isTitrating ? 'bg-amber-600 hover:bg-amber-500' : 'bg-pink-600 hover:bg-pink-500'
            }`}
          >
            <Play size={14} /> {isTitrating ? 'Hentikan Tetesan' : 'Mulai Teteskan NaOH'}
          </button>
          <button
            onClick={() => {
              setIsTitrating(false);
              setTitranVolume(0);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RotateCcw size={14} /> Reset Titrasi
          </button>
        </div>

        {/* Live Telemetry Badge */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-pink-500/40 rounded-xl p-3 text-right text-xs">
          <div className="text-slate-400">Volume Titran Added (V_B):</div>
          <div className="font-mono text-lg text-pink-400 font-extrabold">{titranVolume.toFixed(1)} mL</div>
          <div className="text-slate-400 mt-1">Nilai pH Larutan:</div>
          <div className="font-mono text-cyan-400 font-bold">{currentPH.toFixed(2)}</div>
        </div>
      </div>

      {/* Titran Volume Manual Slider */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <label className="text-slate-200 font-semibold">Volume NaOH yang Ditambahkan</label>
          <span className="font-mono text-pink-400 font-bold">{titranVolume} mL</span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          step="0.1"
          value={titranVolume}
          onChange={(e) => setTitranVolume(Number(e.target.value))}
          className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />
      </div>
    </div>
  );
}
