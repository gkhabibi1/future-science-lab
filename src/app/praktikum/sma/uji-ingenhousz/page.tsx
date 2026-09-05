"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sun, 
  Sparkles, 
  RotateCcw, 
  Play, 
  Pause, 
  Clock, 
  Info, 
  Activity, 
  ArrowLeft, 
  Flame, 
  Gauge 
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface Bubble {
  x: number;
  y: number;
  r: number;
  speed: number;
}

export default function IngenhouszSimulation() {
  // --- STATE KONTROL PARAMETER ---
  const [lightIntensity, setLightIntensity] = useState<number>(70); // % Intensitas Cahaya (0 - 100)
  const [lightDistance, setLightDistance] = useState<number>(20); // Jarak Lampu (10 - 80 cm)
  const [nahco3Grams, setNahco3Grams] = useState<number>(4); // Takaran NaHCO3 (0 - 10 gram)
  
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [seconds, setSeconds] = useState<number>(0);
  const [bubbleCount, setBubbleCount] = useState<number>(0);
  const [testedSplint, setTestedSplint] = useState<boolean>(false);
  const [splintResult, setSplintResult] = useState<string | null>(null);

  // Canvas & Animasi
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);

  // --- MODEL FISIOLOGI FOTOSINTESIS (HUKUM BLACKMAN & INVERSE-SQUARE) ---
  // Intensitas efektif berbanding terbalik dengan kuadrat jarak (Inverse-Square Law)
  const effectiveLight = useMemo(() => {
    return (lightIntensity / 100) * Math.pow(30 / Math.max(10, lightDistance), 1.6);
  }, [lightIntensity, lightDistance]);
  
  // Efek substrat CO2 (Kurva saturasi Michaelis-Menten)
  // Km kira-kira pada 2 gram NaHCO3
  const co2Factor = useMemo(() => {
    return (nahco3Grams + 0.3) / (nahco3Grams + 2.5); // 0.12 (tanpa NaHCO3) -> 0.82 (10g)
  }, [nahco3Grams]);

  // Laju Gelembung per Menit (BPM)
  const bubbleRateBPM = useMemo(() => {
    return Math.min(120, Math.round(effectiveLight * co2Factor * 130));
  }, [effectiveLight, co2Factor]);

  // Timer Waktu Praktikum & Akumulasi Gelembung
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning) {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
        // Tambah gelembung terakumulasi sesuai laju BPM
        if (bubbleRateBPM > 0) {
          const bubblesPerSecond = bubbleRateBPM / 60;
          if (Math.random() < bubblesPerSecond) {
            setBubbleCount((c) => c + 1);
          }
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, bubbleRateBPM]);

  // Animasi Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Posisi Gelas Beker Lab
      const beakerX = 140;
      const beakerY = 70;
      const beakerW = 280;
      const beakerH = 270;

      // 1. EFEK CAHAYA LAMPU DARI SISI KIRI
      // Posisi lampu bergeser berdasarkan lightDistance (10 cm = dekat beaker, 80 cm = paling kiri)
      const minLampX = 25;
      const maxLampX = 110;
      // Map lightDistance (80 -> 10) ke lampX (25 -> 110)
      const lampX = maxLampX - ((lightDistance - 10) / (80 - 10)) * (maxLampX - minLampX);
      const lampY = beakerY + beakerH / 2 - 20;
      
      const lightAlpha = (lightIntensity / 100) * (35 / Math.max(12, lightDistance));

      if (lightAlpha > 0.03) {
        const gradLight = ctx.createRadialGradient(lampX + 15, lampY, 8, beakerX + 130, beakerY + 130, 360);
        gradLight.addColorStop(0, `rgba(254, 240, 138, ${Math.min(0.85, lightAlpha * 1.1)})`);
        gradLight.addColorStop(0.3, `rgba(253, 224, 71, ${Math.min(0.5, lightAlpha * 0.7)})`);
        gradLight.addColorStop(0.7, `rgba(250, 204, 21, ${Math.min(0.2, lightAlpha * 0.3)})`);
        gradLight.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradLight;
        ctx.beginPath();
        ctx.moveTo(lampX + 15, lampY - 45);
        ctx.lineTo(beakerX + beakerW, beakerY - 10);
        ctx.lineTo(beakerX + beakerW, beakerY + beakerH + 10);
        ctx.lineTo(lampX + 15, lampY + 45);
        ctx.closePath();
        ctx.fill();
      }

      // Dudukan & Lampu Lab Fisik di Kiri
      ctx.fillStyle = '#334155';
      ctx.fillRect(lampX - 22, lampY - 24, 22, 48);
      // Stand tiang lampu
      ctx.fillStyle = '#475569';
      ctx.fillRect(lampX - 14, lampY + 24, 6, beakerY + beakerH - lampY);
      ctx.fillRect(lampX - 25, beakerY + beakerH, 28, 6);

      // Bohlam & Reflektor Halogen
      ctx.fillStyle = lightIntensity > 0 ? '#fde047' : '#64748b';
      ctx.beginPath();
      ctx.arc(lampX, lampY, 18, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      if (lightIntensity > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(lampX + 6, lampY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Label Jarak Lampu di bawah lampu
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${lightDistance} cm`, lampX - 2, lampY - 30);

      // 2. GELAS BEKER KACA & AIR
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)'; // Air transparan kebiruan
      ctx.fillRect(beakerX, beakerY + 20, beakerW, beakerH - 20);

      // Efek sedikit larutan NaHCO3 terlarut (kabut mikro lembut jika banyak NaHCO3)
      if (nahco3Grams > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.08, nahco3Grams * 0.008)})`;
        ctx.fillRect(beakerX + 5, beakerY + 25, beakerW - 10, beakerH - 30);
      }

      // Dinding Gelas Beker Kaca
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(beakerX, beakerY);
      ctx.lineTo(beakerX, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW, beakerY);
      ctx.stroke();

      // Skala ukur gelas beker
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      for (let markY = beakerY + 60; markY < beakerY + beakerH - 20; markY += 35) {
        ctx.beginPath();
        ctx.moveTo(beakerX + 2, markY);
        ctx.lineTo(beakerX + 16, markY);
        ctx.stroke();
      }

      // Garis Permukaan Air
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(beakerX, beakerY + 20);
      ctx.lineTo(beakerX + beakerW, beakerY + 20);
      ctx.stroke();

      // 3. TANAMAN AIR HYDRILLA (DI BAWAH CORONG)
      const plantBaseX = beakerX + beakerW / 2;
      const plantBaseY = beakerY + beakerH - 20;

      // Batang & Daun Hydrilla Verticillata
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(plantBaseX - 32, plantBaseY);
      ctx.quadraticCurveTo(plantBaseX - 22, plantBaseY - 45, plantBaseX - 16, plantBaseY - 80);
      ctx.moveTo(plantBaseX, plantBaseY);
      ctx.quadraticCurveTo(plantBaseX + 6, plantBaseY - 50, plantBaseX, plantBaseY - 86);
      ctx.moveTo(plantBaseX + 32, plantBaseY);
      ctx.quadraticCurveTo(plantBaseX + 22, plantBaseY - 45, plantBaseX + 16, plantBaseY - 80);
      ctx.stroke();

      // Daun melingkar khas Hydrilla (Whorled leaves)
      ctx.fillStyle = '#22c55e';
      const leafPositions = [
        { x: plantBaseX - 26, y: plantBaseY - 22 },
        { x: plantBaseX - 22, y: plantBaseY - 48 },
        { x: plantBaseX - 16, y: plantBaseY - 74 },
        { x: plantBaseX, y: plantBaseY - 30 },
        { x: plantBaseX, y: plantBaseY - 60 },
        { x: plantBaseX + 26, y: plantBaseY - 22 },
        { x: plantBaseX + 22, y: plantBaseY - 48 },
        { x: plantBaseX + 16, y: plantBaseY - 74 },
        { x: plantBaseX - 10, y: plantBaseY - 40 },
        { x: plantBaseX + 10, y: plantBaseY - 40 },
      ];
      leafPositions.forEach((pos) => {
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, 9, 3.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Potongan pangkal batang Hydrilla (tempat keluarnya gelembung O2)
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(plantBaseX, plantBaseY - 86, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. CORONG KACA TERBALIK (INVERTED FUNNEL)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Dasar corong lebar menutupi Hydrilla
      ctx.moveTo(plantBaseX - 85, plantBaseY - 8);
      ctx.lineTo(plantBaseX - 14, plantBaseY - 95);
      ctx.lineTo(plantBaseX - 14, plantBaseY - 150); // Leher corong ke atas
      ctx.lineTo(plantBaseX + 14, plantBaseY - 150);
      ctx.lineTo(plantBaseX + 14, plantBaseY - 95);
      ctx.lineTo(plantBaseX + 85, plantBaseY - 8);
      ctx.stroke();

      // Kaki penyangga corong (penahan dasar agar ada celah air mengalir)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(plantBaseX - 88, plantBaseY - 8, 7, 10);
      ctx.fillRect(plantBaseX + 81, plantBaseY - 8, 7, 10);

      // 5. TABUNG REAKSI TERBALIK (PENGUMPUL GAS O2)
      const tubeW = 30;
      const tubeH = 115;
      const tubeX = plantBaseX - tubeW / 2;
      const tubeY = plantBaseY - 150 - tubeH + 32; // Bertengger di atas leher corong

      // Rongga udara/gas O2 terkumpul di puncak tabung
      const maxGasHeight = 65;
      const o2GasHeight = Math.min(maxGasHeight, 6 + Math.floor(bubbleCount * 0.8));
      
      // Isi Gas O2 bening
      ctx.fillStyle = 'rgba(240, 249, 255, 0.92)';
      ctx.fillRect(tubeX + 3, tubeY + 3, tubeW - 6, o2GasHeight);

      // Efek air di dalam tabung reaksi di bawah kantung gas
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fillRect(tubeX + 3, tubeY + o2GasHeight, tubeW - 6, tubeH - o2GasHeight - 2);

      // Garis tabung reaksi terbalik
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Puncak bulat tertutup di atas
      ctx.arc(tubeX + tubeW / 2, tubeY + tubeW / 2, tubeW / 2, Math.PI, 0);
      ctx.lineTo(tubeX + tubeW, tubeY + tubeH);
      ctx.moveTo(tubeX, tubeY + tubeW / 2);
      ctx.lineTo(tubeX, tubeY + tubeH);
      ctx.stroke();

      // Garis meniscus pemisah gas O2 dan air di tabung
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tubeX + 3, tubeY + o2GasHeight);
      ctx.lineTo(tubeX + tubeW - 3, tubeY + o2GasHeight);
      ctx.stroke();

      if (o2GasHeight > 14) {
        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Gas O₂', tubeX + tubeW / 2, tubeY + o2GasHeight - 4);
      }

      // 6. GENERASI & GERAKAN GELEMBUNG GAS O2
      if (isRunning && bubbleRateBPM > 0) {
        // Peluang muncul gelembung per frame
        if (Math.random() < bubbleRateBPM / 1200) {
          bubblesRef.current.push({
            x: plantBaseX - 6 + Math.random() * 12,
            y: plantBaseY - 86,
            r: 2 + Math.random() * 2.2,
            speed: 1.2 + Math.random() * 1.4,
          });
        }
      }

      // Render gelembung
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;

      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        b.y -= b.speed;
        b.x += (Math.random() - 0.5) * 0.7; // Sedikit oleng alami

        // Batasi gelembung di dalam leher corong dan tabung
        const funnelNeckY = plantBaseY - 95;
        if (b.y < funnelNeckY && b.y > tubeY + o2GasHeight) {
          if (b.x < plantBaseX - 8) b.x = plantBaseX - 8;
          if (b.x > plantBaseX + 8) b.x = plantBaseX + 8;
        }

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sampai di kantung gas O2 -> lenyap dan menambah volume gas
        if (b.y <= tubeY + o2GasHeight) {
          bubblesRef.current.splice(i, 1);
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [lightIntensity, lightDistance, isRunning, bubbleRateBPM, bubbleCount, nahco3Grams]);

  const resetExperiment = () => {
    setSeconds(0);
    setBubbleCount(0);
    setLightIntensity(70);
    setLightDistance(20);
    setNahco3Grams(4);
    setTestedSplint(false);
    setSplintResult(null);
    bubblesRef.current = [];
  };

  const handleTestSplint = () => {
    setTestedSplint(true);
    if (bubbleCount >= 18) {
      setSplintResult('🔥 BARA API LIDI MENYALA BERKOBAR TERANG! Membuktikan bahwa gas yang terkumpul adalah Oksigen (O₂) murni yang mempercepat reaksi pembakaran.');
    } else if (bubbleCount >= 8) {
      setSplintResult('✨ Bara api lidi berpendar lebih terang sesaat, namun belum cukup kuat menyala karena volume O₂ masih terbatas.');
    } else {
      setSplintResult('💨 Bara api padam atau tidak bereaksi. Volume gas O₂ belum mencukupi untuk uji nyala (butuh lebih dari 15 gelembung).');
    }
  };

  // Titik kurva untuk grafik laju BPM vs Intensitas Lampu
  const curvePoints = useMemo(() => {
    const points: { intensity: number; bpm: number }[] = [];
    for (let i = 0; i <= 100; i += 5) {
      const eff = (i / 100) * Math.pow(30 / Math.max(10, lightDistance), 1.6);
      const bpm = Math.min(120, Math.round(eff * co2Factor * 130));
      points.push({ intensity: i, bpm });
    }
    return points;
  }, [lightDistance, co2Factor]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* BREADCRUMB & HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
              <Link href="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span>/</span>
              <span className="text-emerald-400">Biologi SMA</span>
              <span>/</span>
              <span className="text-slate-200">Uji Ingenhousz (Fotosintesis)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-yellow-300">
              Simulasi Uji Ingenhousz (Fotosintesis Hydrilla)
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Eksperimen pembuktian fotosintesis menghasilkan gas O₂. Analisis pengaruh intensitas cahaya, jarak sumber radiasi, dan penambahan NaHCO₃ sebagai penyuplai CO₂ terlarut.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-lg transition-all ${
                isRunning 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              {isRunning ? <Pause size={16} /> : <Play size={16} />}
              {isRunning ? 'Jeda Pengamatan' : 'Lanjutkan Simulasi'}
            </button>
            <button
              onClick={resetExperiment}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex items-center gap-2 border border-slate-700 transition-all text-sm text-slate-300 hover:text-white"
            >
              <RotateCcw size={16} /> Bersihkan Aparatus
            </button>
          </div>
        </div>

        {/* FORMULA & PERSAMAAN REAKSI BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Persamaan Reaksi Fotosintesis</span>
              <div className="text-sm md:text-base font-serif text-slate-200">
                <MathFormula formula="6\text{CO}_2 + 6\text{H}_2\text{O} \xrightarrow{\text{klorofil, cahaya}} \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2\uparrow" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block mb-1">Hukum Kuadrat Terbalik (Inverse-Square Law)</span>
              <div className="text-sm md:text-base font-serif text-slate-200">
                <MathFormula formula="I_{\text{efektif}} \propto \frac{I_0}{d^2}, \quad \text{Laju } \text{O}_2 \approx f(I_{\text{efektif}}, [\text{CO}_2])" />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PANEL KONTROL KIRI (COL 4) */}
          <div className="lg:col-span-4 space-y-5">
            
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5 shadow-xl">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sun size={16} className="text-yellow-400" /> Pengaturan Variabel Uji
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Hukum Blackman</span>
              </h3>

              {/* Slider Intensitas Cahaya */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Daya Lampu Sorot Halogen:</span>
                  <span className="text-yellow-400 font-mono font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                    {lightIntensity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Gelap Total (0%)</span>
                  <span>Maksimum (100%)</span>
                </div>
              </div>

              {/* Slider Jarak Lampu ke Beaker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300">Jarak Lampu ke Beaker (d):</span>
                  <span className="text-sky-400 font-mono font-bold bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">
                    {lightDistance} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  step="5"
                  value={lightDistance}
                  onChange={(e) => setLightDistance(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10 cm (Sangat Dekat)</span>
                  <span>80 cm (Jauh)</span>
                </div>
              </div>

              {/* Slider Kadar NaHCO3 (Sumber CO2) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-400" /> Takaran Serbuk NaHCO₃:
                  </span>
                  <span className="text-emerald-400 font-mono font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                    {nahco3Grams} gram
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={nahco3Grams}
                  onChange={(e) => setNahco3Grams(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 g (Hanya Air Suling)</span>
                  <span>10 g (Jenuh CO₂)</span>
                </div>
              </div>

              {/* Stopwatch & Bubble Counter */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <Clock size={12} className="text-teal-400" /> Waktu Praktikum:
                  </span>
                  <span className="text-xl font-mono font-black text-white">
                    {seconds} <span className="text-xs font-normal text-slate-400">detik</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                    <Gauge size={12} className="text-emerald-400" /> Total Gelembung:
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-400">
                    {bubbleCount} <span className="text-xs font-normal text-slate-400">butir</span>
                  </span>
                </div>
              </div>

              {/* Presets Uji Cepat */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold block">Kondisi Pengujian Cepat:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setLightIntensity(100); setLightDistance(10); setNahco3Grams(8); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-emerald-300 border border-slate-700 transition-all text-left"
                  >
                    🌟 Terang + Kaya CO₂
                  </button>
                  <button
                    onClick={() => { setLightIntensity(0); setLightDistance(50); setNahco3Grams(5); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-rose-300 border border-slate-700 transition-all text-left"
                  >
                    🌑 Ruang Gelap (0 Lux)
                  </button>
                  <button
                    onClick={() => { setLightIntensity(100); setLightDistance(15); setNahco3Grams(0); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-amber-300 border border-slate-700 transition-all text-left"
                  >
                    💧 Tanpa NaHCO₃
                  </button>
                  <button
                    onClick={() => { setLightIntensity(30); setLightDistance(65); setNahco3Grams(2); }}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg text-xs font-semibold text-sky-300 border border-slate-700 transition-all text-left"
                  >
                    ⛅ Cahaya Redup Jauh
                  </button>
                </div>
              </div>

              {/* Uji Nyala Bara Api (Glowing Splint Test) */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleTestSplint}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 text-xs transition-all"
                >
                  <Flame size={16} /> Lakukan Uji Nyala Bara Api Lidi
                </button>
                {testedSplint && splintResult && (
                  <div className="mt-3 p-3 bg-slate-950/90 rounded-xl border border-amber-500/40 text-xs text-amber-200 leading-relaxed animate-in fade-in duration-300">
                    {splintResult}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* AREA KANVAS APARATUS & GRAFIK (COL 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Visualisasi Aparatus Ingenhousz */}
            <div className="bg-[#070d18] p-6 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col items-center justify-center overflow-hidden">
              
              {/* Badge Kecepatan Gelembung Real-Time (Digital Bubble Counter) */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 sm:gap-3 z-10 shadow-lg">
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Laju O₂</span>
                  <span className="text-base sm:text-xl font-black font-mono text-emerald-400 flex items-center justify-end gap-1">
                    {bubbleRateBPM} <span className="text-[10px] sm:text-xs font-medium text-slate-300">BPM</span>
                  </span>
                </div>
                <div className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                  {bubbleRateBPM > 0 && isRunning && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 ${bubbleRateBPM > 0 ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                </div>
              </div>

              {/* Tag Penjelasan Komponen */}
              <div className="absolute bottom-3 left-4 text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 hidden sm:block">
                Aparatus: Gelas Kimia 1000 mL, Corong Kaca Terbalik, Tabung Reaksi, & Hydrilla verticillata
              </div>

              <canvas
                ref={canvasRef}
                width={560}
                height={370}
                className="w-full max-w-[540px] h-auto bg-[#030712] rounded-xl border border-slate-800/80 shadow-inner"
              />
            </div>

            {/* GRAFIK HUBUNGAN LAJU GELEMBUNG VS INTENSITAS CAHAYA */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Plot Respons: Hubungan Daya Lampu (%) vs Laju Produksi O₂ (BPM)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Jarak Lampu: <span className="text-sky-400 font-bold">{lightDistance} cm</span> | NaHCO₃: <span className="text-emerald-400 font-bold">{nahco3Grams} g</span>
                </span>
              </div>

              {/* SVG Graphic Plot */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <svg viewBox="0 0 500 160" className="w-full h-36">
                  {/* Grid Lines */}
                  <line x1="40" y1="130" x2="480" y2="130" stroke="#334155" strokeWidth="1.5" />
                  <line x1="40" y1="20" x2="40" y2="130" stroke="#334155" strokeWidth="1.5" />

                  {[0, 30, 60, 90, 120].map((bpmVal) => {
                    const y = 130 - (bpmVal / 120) * 105;
                    return (
                      <g key={bpmVal}>
                        <line x1="36" y1={y} x2="480" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="32" y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                          {bpmVal}
                        </text>
                      </g>
                    );
                  })}

                  {[0, 20, 40, 60, 80, 100].map((intVal) => {
                    const x = 40 + (intVal / 100) * 430;
                    return (
                      <g key={intVal}>
                        <line x1={x} y1="130" x2={x} y2="135" stroke="#475569" strokeWidth="1.5" />
                        <text x={x} y="148" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          {intVal}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Curve Path */}
                  <path
                    d={curvePoints.reduce((acc, pt, idx) => {
                      const x = 40 + (pt.intensity / 100) * 430;
                      const y = 130 - (pt.bpm / 120) * 105;
                      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />

                  {/* Shaded Area under Curve */}
                  <path
                    d={`${curvePoints.reduce((acc, pt, idx) => {
                      const x = 40 + (pt.intensity / 100) * 430;
                      const y = 130 - (pt.bpm / 120) * 105;
                      return `${acc} ${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }, '')} L 470 130 L 40 130 Z`}
                    fill="rgba(16, 185, 129, 0.08)"
                  />

                  {/* Active Operating Point */}
                  {(() => {
                    const curX = 40 + (lightIntensity / 100) * 430;
                    const curY = 130 - (bubbleRateBPM / 120) * 105;
                    return (
                      <g>
                        <circle cx={curX} cy={curY} r="7" fill="#fbbf24" opacity="0.3" className="animate-ping" />
                        <circle cx={curX} cy={curY} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                        <line x1={curX} y1={curY} x2={curX} y2="130" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <line x1="40" y1={curY} x2={curX} y2={curY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                        <text x={curX} y={Math.max(16, curY - 10)} fill="#fde047" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                          {bubbleRateBPM} BPM
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* STATUS ANALISIS & KARTU KESIMPULAN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Volume Gas O₂</span>
                  <div className="text-2xl font-black text-sky-400 font-mono mt-1">
                    {(bubbleCount * 0.05).toFixed(2)} <span className="text-xs font-normal text-slate-400">mL estimasi</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Terperangkap di kubah atas tabung reaksi tertutup</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Activity size={12} className="text-emerald-400" /> Faktor Pembatas Reaksi
                  </span>
                  <div className="text-xs font-bold text-slate-200 mt-1">
                    {effectiveLight < 0.25 
                      ? '⚡ Intensitas Cahaya Rendah (Limiting Factor)' 
                      : nahco3Grams <= 1 
                      ? '💨 Konsentrasi Substrat CO₂ Rendah (Perlu NaHCO₃)' 
                      : '✅ Kedua Faktor Optimal (Laju Maksimum)'}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Hukum Toleransi Minimum Liebig & Blackman</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Flame size={12} className="text-amber-400" /> Status Uji Nyala Api
                  </span>
                  <div className="text-xs font-bold text-amber-300 mt-1">
                    {bubbleCount >= 18 
                      ? '🔥 Siap Menyala Terang Berkobar' 
                      : bubbleCount >= 8 
                      ? '✨ Bara Api Berpendar Halus' 
                      : '💨 Gas Belum Cukup Terkumpul'}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Oksigen bersifat gas pembantu pembakaran</p>
              </div>

            </div>

            {/* Catatan Konsep Edukatif */}
            <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={22} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <strong className="text-emerald-300 text-sm block">Wawasan Laboratorium Ingenhousz:</strong>
                <p>
                  1. <strong>Fungsi Penambahan NaHCO₃:</strong> Dalam air, natrium bikarbonat terhidrolisis: <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded">NaHCO₃ + H₂O ⇌ Na⁺ + OH⁻ + H₂O + CO₂</code>. Gas CO₂ terlarut inilah yang berperan sebagai reaktan penangkap elektron pada siklus Calvin (reaksi gelap fotosintesis).
                </p>
                <p>
                  2. <strong>Hukum Blackman (Light-saturation):</strong> Ketika intensitas cahaya ditingkatkan terus-menerus namun konsentrasi CO₂ tetap minim, laju pembentukan gelembung O₂ akan mengalami kurva plateau mendatar (jenuh), karena enzim Rubisco mencapai kapasitas penjenuhan maksimumnya.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
