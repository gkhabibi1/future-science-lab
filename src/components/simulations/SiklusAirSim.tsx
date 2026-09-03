'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sun, Cloud, CloudRain, Thermometer, RefreshCw, Info, Play, Pause } from 'lucide-react';

export default function SiklusAirSim() {
  const [sunIntensity, setSunIntensity] = useState<number>(70); // 0 - 100%
  const [windSpeed, setWindSpeed] = useState<number>(30); // 0 - 100 km/h
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeStage, setActiveStage] = useState<'evaporasi' | 'kondensasi' | 'presipitasi' | 'semua'>('semua');
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculated values
  const evaporationRate = (sunIntensity * 0.8 + windSpeed * 0.2).toFixed(1);
  const cloudDensity = Math.min(100, Math.round(sunIntensity * 0.9));
  const rainRate = cloudDensity > 50 ? Math.round((cloudDensity - 50) * 1.5) : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{ x: number; y: number; speedY: number; opacity: number }> = [];
    let raindrops: Array<{ x: number; y: number; speedY: number; length: number }> = [];

    // Initialize vapor particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height - 70 + Math.random() * 50,
        speedY: 0.5 + Math.random() * 1.5,
        opacity: Math.random() * 0.8
      });
    }

    // Initialize raindrops
    for (let i = 0; i < 60; i++) {
      raindrops.push({
        x: 100 + Math.random() * (canvas.width - 200),
        y: Math.random() * 200,
        speedY: 4 + Math.random() * 4,
        length: 8 + Math.random() * 8
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Sky background gradient based on sun intensity
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
      if (sunIntensity > 60) {
        skyGradient.addColorStop(0, '#38bdf8');
        skyGradient.addColorStop(1, '#bae6fd');
      } else {
        skyGradient.addColorStop(0, '#64748b');
        skyGradient.addColorStop(1, '#94a3b8');
      }
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.75);

      // 2. Ocean / Water body at bottom
      const oceanGradient = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
      oceanGradient.addColorStop(0, '#0284c7');
      oceanGradient.addColorStop(1, '#0369a1');
      ctx.fillStyle = oceanGradient;
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

      // Ocean waves animation
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      const time = Date.now() * 0.003;
      for (let x = 0; x < canvas.width; x += 10) {
        const y = canvas.height * 0.7 + Math.sin(x * 0.02 + time) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.fill();

      // 3. Sun
      const sunX = canvas.width - 80;
      const sunY = 70;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 45 * (sunIntensity / 50));
      sunGlow.addColorStop(0, '#fbbf24');
      sunGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
      sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 25, 0, Math.PI * 2);
      ctx.fill();

      // 4. Evaporation Particles (Uap Air Naik)
      if (isPlaying && (activeStage === 'semua' || activeStage === 'evaporasi')) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();

          p.y -= p.speedY * (sunIntensity / 50);
          p.x += Math.sin(p.y * 0.05) * 0.5 + (windSpeed * 0.02);

          if (p.y < 120) {
            p.y = canvas.height * 0.7 + Math.random() * 20;
            p.x = Math.random() * canvas.width;
          }
        });

        // Evaporation Arrows
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        [120, 250, 380].forEach((xPos) => {
          ctx.beginPath();
          ctx.moveTo(xPos, canvas.height * 0.7 - 10);
          ctx.lineTo(xPos, 140);
          ctx.stroke();
        });
        ctx.setLineDash([]);
      }

      // 5. Clouds (Kondensasi)
      const cloudColor = cloudDensity > 70 ? '#475569' : '#f8fafc';
      ctx.fillStyle = cloudColor;
      // Draw 3 Cloud Clusters
      const drawCloud = (cx: number, cy: number, scale: number) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 25 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 20 * scale, cy - 10 * scale, 30 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 50 * scale, cy, 25 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 25 * scale, cy + 10 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
      };

      drawCloud(140, 110, 1 + cloudDensity * 0.004);
      drawCloud(320, 95, 1.2 + cloudDensity * 0.003);

      // 6. Raindrops (Presipitasi)
      if (isPlaying && rainRate > 0 && (activeStage === 'semua' || activeStage === 'presipitasi')) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 2;
        raindrops.forEach((r) => {
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - windSpeed * 0.05, r.y + r.length);
          ctx.stroke();

          r.y += r.speedY + rainRate * 0.05;
          r.x += windSpeed * 0.03;

          if (r.y > canvas.height * 0.7) {
            r.y = 120 + Math.random() * 30;
            r.x = 80 + Math.random() * 340;
          }
        });
      }

      // Labels on Canvas
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = '#0f172a';

      // Evaporasi label
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(40, canvas.height * 0.7 - 45, 110, 24);
      ctx.fillStyle = '#0284c7';
      ctx.fillText('1. EVAPORASI', 48, canvas.height * 0.7 - 28);

      // Kondensasi label
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(200, 45, 125, 24);
      ctx.fillStyle = '#475569';
      ctx.fillText('2. KONDENSASI', 208, 62);

      // Presipitasi label
      if (rainRate > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(340, 170, 130, 24);
        ctx.fillStyle = '#2563eb';
        ctx.fillText('3. PRESIPITASI', 348, 187);
      }

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [sunIntensity, windSpeed, isPlaying, activeStage, cloudDensity, rainRate]);

  return (
    <div className="space-y-6">
      {/* Visual Canvas Stage */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={600}
          height={360}
          className="w-full h-auto block"
        />

        {/* Overlay Control Bar */}
        <div className="absolute top-4 left-4 flex gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur border border-slate-700 transition"
          >
            {isPlaying ? <Pause size={14} className="text-amber-400" /> : <Play size={14} className="text-emerald-400" />}
            {isPlaying ? 'Jeda Simulasi' : 'Jalankan'}
          </button>
        </div>

        {/* Live Metrics Badge */}
        <div className="absolute bottom-4 right-4 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-xl p-3 text-xs space-y-1 text-slate-300 shadow-xl">
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Laju Evaporasi:</span>
            <span className="font-mono text-cyan-400 font-bold">{evaporationRate} L/m²</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Kerapatan Awan:</span>
            <span className="font-mono text-indigo-400 font-bold">{cloudDensity}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Curah Hujan:</span>
            <span className="font-mono text-blue-400 font-bold">{rainRate > 0 ? `${rainRate} mm/jam` : 'Tidak Ada'}</span>
          </div>
        </div>
      </div>

      {/* Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-medium flex items-center gap-2">
              <Sun size={16} className="text-amber-400" /> Intensitas Sinar Matahari
            </label>
            <span className="font-mono font-bold text-amber-400 text-sm">{sunIntensity}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={sunIntensity}
            onChange={(e) => setSunIntensity(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <p className="text-xs text-slate-400">Semakin panas sinar matahari, semakin cepat penguapan uap air dari laut ke udara.</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <label className="text-slate-200 font-medium flex items-center gap-2">
              <CloudRain size={16} className="text-cyan-400" /> Kecepatan Angin
            </label>
            <span className="font-mono font-bold text-cyan-400 text-sm">{windSpeed} km/j</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={windSpeed}
            onChange={(e) => setWindSpeed(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <p className="text-xs text-slate-400">Mendorong kumpulan uap air dan memfasilitasi pembentukan awan tebal.</p>
        </div>
      </div>

      {/* Tahapan Penjelasan */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-slate-100 font-bold flex items-center gap-2 text-base">
          <Info size={18} className="text-cyan-400" /> Konsep Pembelajaran (SD Kelas 4 - 6)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-cyan-900/40 space-y-1">
            <h4 className="font-bold text-cyan-400 text-sm">1. Evaporasi (Penguapan)</h4>
            <p className="text-slate-300">Air di laut, sungai, dan danau menguap menjadi uap air akibat panas dari sinar matahari.</p>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-indigo-900/40 space-y-1">
            <h4 className="font-bold text-indigo-400 text-sm">2. Kondensasi (Pengembunan)</h4>
            <p className="text-slate-300">Uap air naik ke atmosfer yang dingin, lalu mengembun membentuk titik-titik air menjadi awan.</p>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-blue-900/40 space-y-1">
            <h4 className="font-bold text-blue-400 text-sm">3. Presipitasi (Hujan)</h4>
            <p className="text-slate-300">Ketika awan terlalu berat menampung air, air jatuh kembali ke bumi sebagai hujan.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
