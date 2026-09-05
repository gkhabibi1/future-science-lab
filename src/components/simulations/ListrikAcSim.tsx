'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Activity, Info } from 'lucide-react';

export default function ListrikAcSim() {
  const [resistance, setResistance] = useState<number>(50); // R (Ohm)
  const [inductance, setInductance] = useState<number>(0.1); // L (Henry)
  const [capacitance, setCapacitance] = useState<number>(50); // C (microFarad)
  const [frequency, setFrequency] = useState<number>(50); // f (Hz)
  const [voltagePeak] = useState<number>(220); // V_max (Volt)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Electrical AC Calculations:
  // omega = 2 * pi * f
  const omega = 2 * Math.PI * frequency;
  // X_L = omega * L
  const xL = omega * inductance;
  // X_C = 1 / (omega * C)
  const xC = 1 / (omega * capacitance * 1e-6);
  // Impedance Z = sqrt( R^2 + (X_L - X_C)^2 )
  const impedance = Math.sqrt(resistance * resistance + (xL - xC) * (xL - xC));
  // Peak Current I_max = V_max / Z
  const iMax = voltagePeak / impedance;
  // Phase angle phi = atan( (X_L - X_C) / R )
  const phaseAngleRad = Math.atan((xL - xC) / resistance);
  const phaseAngleDeg = (phaseAngleRad * 180) / Math.PI;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phaseOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;

      // Draw Oscilloscope Screen Grid (Tampilan Osiloskop)
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center Axis Lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();

      // Waveform 1: Voltage V(t) = V_max * sin(omega*t) [Cyan Wave]
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const t = (x * 0.02) + phaseOffset;
        const v = Math.sin(t * (frequency / 25)) * 90;
        const y = centerY - v;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Waveform 2: Current I(t) = I_max * sin(omega*t - phase) [Amber Wave]
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const currentAmplitudeScale = Math.min(100, iMax * 25);
      for (let x = 0; x < canvas.width; x++) {
        const t = (x * 0.02) + phaseOffset - phaseAngleRad;
        const i = Math.sin(t * (frequency / 25)) * currentAmplitudeScale;
        const y = centerY - i;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phaseOffset += 0.05;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [frequency, resistance, inductance, capacitance, iMax, phaseAngleRad]);

  return (
    <div className="space-y-6">
      {/* Oscilloscope Canvas View */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={320}
          className="w-full h-auto block"
        />

        {/* Oscilloscope Legend */}
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col sm:flex-row gap-1 sm:gap-4 text-[10px] sm:text-xs font-bold z-10">
          <div className="flex items-center gap-1.5 bg-cyan-950/80 backdrop-blur border border-cyan-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-cyan-300">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-cyan-400"></span> V(t) Tegangan
          </div>
          <div className="flex items-center gap-1.5 bg-amber-950/80 backdrop-blur border border-amber-800 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-amber-300">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400"></span> I(t) Arus
          </div>
        </div>

        {/* Telemetry Badge (Desktop) */}
        <div className="hidden sm:block absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-cyan-500/40 rounded-xl p-3 text-right text-xs z-10">
          <div className="text-slate-400">Impedansi Rangkaian (Z):</div>
          <div className="font-mono text-lg text-cyan-400 font-extrabold">{impedance.toFixed(1)} Ω</div>
          <div className="text-slate-400 mt-1">Arus Puncak (I_maks):</div>
          <div className="font-mono text-amber-400 font-bold">{iMax.toFixed(2)} A</div>
          <div className="text-slate-400 mt-1">Beda Fase (φ):</div>
          <div className="font-mono text-purple-400 font-bold">{phaseAngleDeg.toFixed(1)}°</div>
        </div>

        {/* Mobile Telemetry Strip Below Canvas */}
        <div className="sm:hidden grid grid-cols-3 gap-2 bg-slate-900/95 border-t border-slate-800 p-2 text-center text-[10px]">
          <div>
            <div className="text-slate-400">Impedansi Z:</div>
            <div className="font-mono text-xs text-cyan-400 font-bold">{impedance.toFixed(1)} Ω</div>
          </div>
          <div>
            <div className="text-slate-400">I_maks:</div>
            <div className="font-mono text-xs text-amber-400 font-bold">{iMax.toFixed(2)} A</div>
          </div>
          <div>
            <div className="text-slate-400">Beda Fase φ:</div>
            <div className="font-mono text-xs text-purple-400 font-bold">{phaseAngleDeg.toFixed(1)}°</div>
          </div>
        </div>
      </div>

      {/* R-L-C Component Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Hambatan (R)</label>
            <span className="font-mono text-cyan-400 font-bold">{resistance} Ω</span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            value={resistance}
            onChange={(e) => setResistance(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Induktansi (L)</label>
            <span className="font-mono text-purple-400 font-bold">{inductance} H</span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.5"
            step="0.02"
            value={inductance}
            onChange={(e) => setInductance(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Kapasitansi (C)</label>
            <span className="font-mono text-emerald-400 font-bold">{capacitance} μF</span>
          </div>
          <input
            type="range"
            min="10"
            max="150"
            value={capacitance}
            onChange={(e) => setCapacitance(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label className="text-slate-200 font-semibold">Frekuensi (f)</label>
            <span className="font-mono text-amber-400 font-bold">{frequency} Hz</span>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
