"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Snowflake, 
  ArrowDownUp, 
  RefreshCcw, 
  Info, 
  Activity, 
  ArrowLeft,
  Gauge,
  Layers,
  Sparkles
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface GasMolecule {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'NO2' | 'N2O4';
}

export default function LeChatelierSimulation() {
  // --- STATE KONTROL PARAMETER ---
  const [volume, setVolume] = useState(50); // Volume tabung (20 mL - 100 mL)
  const [temperature, setTemperature] = useState(298); // Suhu (260 K - 380 K)

  // Canvas & Partikel
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moleculesRef = useRef<GasMolecule[]>([]);
  const requestRef = useRef<number | null>(null);

  // Tekanan berbanding terbalik dengan Volume dan sebanding dengan Suhu (Hukum Gas Ideal P = nRT/V)
  const relativePressure = (temperature / 298) * (50 / volume);

  // --- HITUNG DERAJAT DISOSIASI & KESETIMBANGAN ---
  // Reaksi: N2O4 <-> 2 NO2 (Endoterm ke kanan, Delta H = +57.2 kJ)
  // Suhu tinggi -> ke kanan (banyak NO2, cokelat merah)
  // Volume kecil (P tinggi) -> ke kiri (banyak N2O4, bening)
  const tempFactor = (temperature - 260) / (380 - 260); // 0 (dingin) -> 1 (panas)
  const volumeFactor = (volume - 20) / (100 - 20); // 0 (sempit/P tinggi) -> 1 (luas/P rendah)

  // Fraksi NO2 dalam campuran gas (0.0 = 100% N2O4, 1.0 = 100% NO2)
  const fractionNO2 = Math.min(0.95, Math.max(0.05, 0.2 + (0.5 * tempFactor) + (0.3 * volumeFactor)));
  const fractionN2O4 = 1 - fractionNO2;

  // Rasio warna cokelat gas (semakin pekat konsentrasi NO2, warna cokelat kian kuat)
  // Konsentrasi = mol / volume
  const brownIntensity = Math.min(1, Math.max(0.08, (fractionNO2 * 50) / volume));

  // Inisialisasi molekul partikel dalam batas silinder piston
  useEffect(() => {
    const totalMolecules = 60;
    const molecules: GasMolecule[] = [];
    const no2Count = Math.round(totalMolecules * fractionNO2);

    // Hitung posisi kanan piston
    const canvasWidth = 700;
    const maxChamberWidth = (volume / 100) * (canvasWidth - 80) + 40;
    const spawnWidth = Math.max(40, maxChamberWidth - 70);

    for (let i = 0; i < totalMolecules; i++) {
      molecules.push({
        x: Math.random() * spawnWidth + 48,
        y: Math.random() * 180 + 35,
        vx: (Math.random() - 0.5) * (temperature / 150),
        vy: (Math.random() - 0.5) * (temperature / 150),
        type: i < no2Count ? 'NO2' : 'N2O4'
      });
    }
    moleculesRef.current = molecules;
  }, [temperature, volume, fractionNO2]);

  // Animasi Canvas partikel di dalam piston
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      // Posisi kepala piston
      const chamberWidth = (volume / 100) * (width - 80) + 40;

      ctx.clearRect(0, 0, width, height);

      // 1. Gambar latar belakang gas dengan warna cokelat sesuai konsentrasi NO2
      const grad = ctx.createLinearGradient(40, 0, chamberWidth, 0);
      grad.addColorStop(0, `rgba(180, 83, 9, ${brownIntensity * 0.9})`);
      grad.addColorStop(1, `rgba(217, 119, 6, ${brownIntensity * 0.75})`);
      ctx.fillStyle = grad;
      ctx.fillRect(40, 25, chamberWidth - 40, height - 50);

      // 2. Skala & Garis Kalibrasi Tabung Suntik (Milliliter Marks)
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      for (let v = 20; v <= 100; v += 10) {
        const markX = (v / 100) * (width - 80) + 40;
        // Garis atas
        ctx.beginPath();
        ctx.moveTo(markX, 22);
        ctx.lineTo(markX, v % 20 === 0 ? 34 : 28);
        ctx.stroke();

        // Garis bawah
        ctx.beginPath();
        ctx.moveTo(markX, height - 22);
        ctx.lineTo(markX, v % 20 === 0 ? height - 34 : height - 28);
        ctx.stroke();

        // Angka mililiter
        if (v % 20 === 0) {
          ctx.fillText(`${v}mL`, markX - 12, height - 8);
        }
      }

      // 3. Gambar dinding silinder kaca
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, 20); ctx.lineTo(width - 20, 20); // Dinding atas
      ctx.moveTo(40, height - 20); ctx.lineTo(width - 20, height - 20); // Dinding bawah
      ctx.moveTo(40, 20); ctx.lineTo(40, height - 20); // Tutup kiri
      ctx.stroke();

      // Ujung nozzle jarum kiri
      ctx.fillStyle = '#64748b';
      ctx.fillRect(12, height / 2 - 8, 28, 16);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, height / 2 - 3, 12, 6);

      // 4. Gambar Piston (bergerak kiri-kanan sesuai slider volume)
      // Karet penyegel kepala piston (Seal gasket)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(chamberWidth - 6, 22, 6, height - 44);

      // Kepala piston logam
      ctx.fillStyle = '#334155';
      ctx.fillRect(chamberWidth, 22, 16, height - 44);

      // Batang piston
      const pistonGrad = ctx.createLinearGradient(0, height / 2 - 8, 0, height / 2 + 8);
      pistonGrad.addColorStop(0, '#94a3b8');
      pistonGrad.addColorStop(0.5, '#64748b');
      pistonGrad.addColorStop(1, '#475569');
      ctx.fillStyle = pistonGrad;
      ctx.fillRect(chamberWidth + 16, height / 2 - 8, width - chamberWidth, 16);

      // Pegangan belakang piston
      ctx.fillStyle = '#475569';
      ctx.fillRect(width - 12, height / 2 - 24, 12, 48);

      // 5. Update dan render partikel gas
      const molecules = moleculesRef.current;
      const speedScale = temperature / 280;

      for (let i = 0; i < molecules.length; i++) {
        const m = molecules[i];
        m.x += m.vx * speedScale;
        m.y += m.vy * speedScale;

        // Pantulan dinding tabung kaca & Kepala Piston
        if (m.x < 48) { 
          m.x = 48; 
          m.vx = Math.abs(m.vx); 
        }
        if (m.x > chamberWidth - 12) { 
          m.x = chamberWidth - 12; 
          m.vx = -Math.abs(m.vx); 
        }
        if (m.y < 35) { 
          m.y = 35; 
          m.vy = Math.abs(m.vy); 
        }
        if (m.y > height - 35) { 
          m.y = height - 35; 
          m.vy = -Math.abs(m.vy); 
        }

        if (m.type === 'NO2') {
          // NO2: Partikel Cokelat Kemerahan Tunggal (Monomer)
          ctx.beginPath();
          ctx.arc(m.x, m.y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#dc2626';
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // N2O4: Dua partikel menempel (Dimer) transparan abu-abu kebiruan
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(m.x - 3.5, m.y, 4, 0, Math.PI * 2);
          ctx.arc(m.x + 3.5, m.y, 4, 0, Math.PI * 2);
          ctx.fill();

          // Ikatan kimia antar atom dimer
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(m.x - 3, m.y);
          ctx.lineTo(m.x + 3, m.y);
          ctx.stroke();
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [volume, brownIntensity, temperature]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Kimia SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 mb-1">
              Simulasi Azas Le Chatelier (Kesetimbangan Gas)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Eksperimen tabung piston jarum suntik N₂O₄ (tidak berwarna) ⇌ 2 NO₂ (cokelat merah) dengan manipulasi volume, tekanan, dan suhu.
            </p>
          </div>

          <button
            onClick={() => { setVolume(50); setTemperature(298); }}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600 shadow-sm"
          >
            <RefreshCcw size={15} /> Reset Standar (STP 298K, 50mL)
          </button>
        </header>

        {/* BANNER RUMUS KESETIMBANGAN (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Kesetimbangan:</span>
            <MathFormula formula="\text{N}_2\text{O}_4(g) \rightleftharpoons 2\text{NO}_2(g)" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Entalpi Reaksi:</span>
            <MathFormula formula="\Delta H = +57.2\text{ kJ (Endoterm)}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Hukum Gas Ideal:</span>
            <MathFormula formula="P \propto \frac{T}{V}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Activity size={16} className="text-amber-400" /> Variabel Aksi Sistem
            </h3>

            {/* Kontrol Volume & Tekanan */}
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-sky-400">
                  <ArrowDownUp size={15} /> Volume Silinder Piston
                </span>
                <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{volume} mL</span>
              </label>
              <input
                type="range" min="20" max="100" step="5"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>20 mL (Tekanan ↑)</span>
                <span>100 mL (Tekanan ↓)</span>
              </div>
            </div>

            {/* Kontrol Suhu */}
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-orange-400">
                  {temperature > 298 ? <Flame size={15} className="text-red-500" /> : <Snowflake size={15} className="text-blue-400" />} 
                  Suhu Sistem (T)
                </span>
                <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{temperature} K</span>
              </label>
              <input
                type="range" min="260" max="380" step="5"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>260 K (-13°C Es)</span>
                <span>380 K (107°C Panas)</span>
              </div>
            </div>

            {/* Kotak Informasi Arah Pergeseran */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Info size={15} /> Prediksi Azas Le Chatelier:
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {fractionNO2 > 0.6 
                  ? "🔥 Reaksi bergeser ke KANAN (pembentukan NO₂ meningkat). Warna gas cokelat pekat karena suhu tinggi atau volume ekspansi."
                  : fractionNO2 < 0.4
                  ? "❄️ Reaksi bergeser ke KIRI (pembentukan N₂O₄ meningkat). Gas memudar menuju bening karena pendinginan atau kompresi tekanan."
                  : "⚖️ Sistem berada dalam kesetimbangan dinamis yang seimbang."}
              </p>
            </div>
          </div>

          {/* AREA TABUNG VISUAL & DASHBOARD KANAN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visual Tabung Suntik Gas */}
            <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-2xl relative backdrop-blur">
              <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
                <div className="flex gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-red-300">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50"></span> NO₂ (Monomer Cokelat-Merah)
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-4 h-2.5 rounded-full bg-slate-400 inline-block"></span> N₂O₄ (Dimer Bening)
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-2">
                  <Gauge size={14} className="text-sky-400" />
                  Tekanan Relatif: <strong className="text-white">{relativePressure.toFixed(2)} atm</strong>
                </div>
              </div>

              <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={260}
                  className="w-full h-auto block"
                />
              </div>

              <div className="flex justify-between items-center mt-3 text-[11px] text-slate-400">
                <span>◀ Nozzle Tertutup (Sistem Terisolasi)</span>
                <span>Posisi Batang Piston: <strong>{volume} mL</strong> ▶</span>
              </div>
            </div>

            {/* Panel Hasil Komposisi & Rasio */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fraksi Mol NO₂ (Cokelat)</span>
                <span className="text-3xl font-black text-red-400">{(fractionNO2 * 100).toFixed(1)}%</span>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-700/60">
                  <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${fractionNO2 * 100}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fraksi Mol N₂O₄ (Bening)</span>
                <span className="text-3xl font-black text-slate-200">{(fractionN2O4 * 100).toFixed(1)}%</span>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-700/60">
                  <div className="bg-slate-400 h-full transition-all duration-300" style={{ width: `${fractionN2O4 * 100}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-center">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Layers size={13} className="text-amber-400" /> Warna Gas Campuran
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <div 
                    className="w-9 h-9 rounded-xl border border-slate-700 shadow-inner transition-colors duration-300" 
                    style={{ backgroundColor: `rgba(180, 83, 9, ${brownIntensity})` }}
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-200 block">
                      {brownIntensity > 0.6 ? 'Cokelat Gelap Pekat' : brownIntensity > 0.3 ? 'Cokelat Jingga Muda' : 'Hampir Bening Transparan'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Intensitas: {(brownIntensity * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rangkuman Konsep Pembelajaran */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
              <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Prinsip Termodinamika & Azas Le Chatelier:</strong>
                Karena reaksi pembentukan gas <MathFormula formula="\text{NO}_2" /> bersifat <em>endoterm</em> (<MathFormula formula="\Delta H = +57.2\text{ kJ}" />), menaikkan temperatur akan memaksa sistem menyerap kalor dengan menggeser kesetimbangan ke arah produk kanan (warna gas cokelat makin pekat). Sebaliknya, saat piston ditekan ke kiri (volume diperkecil menjadi 20 mL), partikel gas merapat tajam sehingga tekanan melonjak; sistem meredam gangguan tekanan dengan menggabungkan dua molekul <MathFormula formula="\text{NO}_2" /> menjadi satu molekul dimer <MathFormula formula="\text{N}_2\text{O}_4" /> (bergeser ke sisi koefisien/mol terkecil, sehingga warna gas memudar).
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
