"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sun, Zap, Target, Settings2, ArrowLeft, Play, Pause, RotateCcw, Info, Sparkles, Activity } from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface Particle {
  x: number;
  y: number;
  speed: number;
  active: boolean;
}

export default function FotolistrikSimulation() {
  // --- STATE PARAMETER ---
  const [wavelength, setWavelength] = useState(360); // Nanometer (nm)
  const [intensity, setIntensity] = useState(6); // Foton flow
  const [metal, setMetal] = useState('Sodium');
  const [isRunning, setIsRunning] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  
  // Data Logam (Fungsi Kerja dalam eV)
  const metals: Record<string, { wf: number; color: string; symbol: string }> = {
    'Sodium': { wf: 2.36, color: '#facc15', symbol: 'Na' }, // Natrium
    'Zinc': { wf: 4.31, color: '#94a3b8', symbol: 'Zn' },   // Seng
    'Copper': { wf: 4.70, color: '#b45309', symbol: 'Cu' }, // Tembaga
    'Platinum': { wf: 6.35, color: '#e2e8f0', symbol: 'Pt' } // Platina
  };

  // Referensi sistem partikel
  const photons = useRef<Particle[]>([]);
  const electrons = useRef<Particle[]>([]);

  // --- KALKULASI FISIKA KUANTUM ---
  // hc ≈ 1239.84 eV·nm, kita bulatkan 1240 eV·nm
  const photonEnergy = 1240 / wavelength; 
  const workFunction = metals[metal].wf;
  
  // Frekuensi foton c / lambda (Hz)
  const frequencyHz = (3e8 / (wavelength * 1e-9));
  
  // Jika Energi Foton > Fungsi kerja, ada sisa untuk Energi Kinetik
  const isEmitting = photonEnergy >= workFunction;
  const kineticEnergy = isEmitting ? (photonEnergy - workFunction) : 0;
  // Kecepatan elektron v = sqrt(2 * Ek / m_e)
  // Ek dalam Joule: Ek_eV * 1.6e-19 J; m_e = 9.109e-31 kg
  const electronVelocityKmS = isEmitting 
    ? Math.sqrt((2 * kineticEnergy * 1.602e-19) / 9.109e-31) / 1000 
    : 0;

  // Helper untuk warna cahaya (nm -> RGB string)
  const getLightColor = (wl: number) => {
    let r = 0, g = 0, b = 0;
    if (wl >= 380 && wl < 440) { r = -(wl - 440)/(440 - 380); b = 1; }
    else if (wl >= 440 && wl < 490) { g = (wl - 440)/(490 - 440); b = 1; }
    else if (wl >= 490 && wl < 510) { g = 1; b = -(wl - 510)/(510 - 490); }
    else if (wl >= 510 && wl < 580) { r = (wl - 510)/(580 - 510); g = 1; }
    else if (wl >= 580 && wl < 645) { r = 1; g = -(wl - 645)/(645 - 580); }
    else if (wl >= 645 && wl <= 780) { r = 1; }
    
    // Fallback UV jadi ungu neon, IR jadi merah darah
    if (wl < 380) return `rgba(168, 85, 247, 0.9)`; 
    if (wl > 780) return `rgba(225, 29, 72, 0.9)`;
    
    return `rgba(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)}, 0.9)`;
  };

  const resetExperiment = () => {
    photons.current = [];
    electrons.current = [];
    setWavelength(360);
    setIntensity(6);
    setMetal('Sodium');
    setIsRunning(true);
  };

  // --- ANIMASI PARTIKEL ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (isRunning) {
        // Background tabung kaca kuarsa vakum (dark cyber)
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid latar laboratorium
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 40) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Tabung Kaca Vakum Outer Glow
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(25, 20, canvas.width - 50, canvas.height - 40, 20);
        ctx.stroke();

        // Label tabung vakum
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = '10px monospace';
        ctx.fillText('HIGH-VACUUM QUARTZ TUBE (P < 10⁻⁶ Torr)', 38, 38);

        // Gambar Plat Katoda (Logam Target Kiri)
        const targetMetal = metals[metal];
        ctx.fillStyle = targetMetal.color;
        ctx.shadowColor = targetMetal.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(70, 50, 18, 220);
        ctx.shadowBlur = 0;

        // Label Logam Target
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px sans-serif';
        ctx.save();
        ctx.translate(82, 160);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${metal} (${targetMetal.symbol})`, -25, 4);
        ctx.restore();

        // Indikator Kutub Katoda (-)
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('(-) KATODA', 55, 290);

        // Gambar Plat Anoda (Kolektor Kanan)
        ctx.fillStyle = '#475569';
        ctx.fillRect(canvas.width - 90, 50, 18, 220);

        // Indikator Kutub Anoda (+)
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('(+) ANODA', canvas.width - 105, 290);

        // Kabel Sirkuit Penghubung di Bawah
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(79, 270);
        ctx.lineTo(79, 305);
        ctx.lineTo(canvas.width / 2 - 40, 305);
        ctx.moveTo(canvas.width / 2 + 40, 305);
        ctx.lineTo(canvas.width - 81, 305);
        ctx.lineTo(canvas.width - 81, 270);
        ctx.stroke();

        // Mikroamperemeter Indikator
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = isEmitting && intensity > 0 ? '#38bdf8' : '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 305, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isEmitting && intensity > 0 ? '#38bdf8' : '#94a3b8';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('µA', canvas.width / 2 - 7, 309);

        // Sorotan Senter Cahaya Monokromatik dari atas
        const lightColor = getLightColor(wavelength);
        const grad = ctx.createLinearGradient(160, 0, 88, 160);
        grad.addColorStop(0, lightColor.replace('0.9', '0.6'));
        grad.addColorStop(1, lightColor.replace('0.9', '0.05'));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(170, 0);
        ctx.lineTo(210, 0);
        ctx.lineTo(88, 260);
        ctx.lineTo(88, 60);
        ctx.closePath();
        ctx.fill();

        // Spawner Foton Cahaya (Hulu)
        if (Math.random() < (intensity / 8)) {
          photons.current.push({
            x: 180 + (Math.random() * 25 - 12),
            y: 0,
            speed: 6.5,
            active: true
          });
        }

        // Update & Render Foton
        ctx.strokeStyle = lightColor;
        ctx.lineWidth = 2.5;
        for (let i = photons.current.length - 1; i >= 0; i--) {
          const p = photons.current[i];
          p.x -= p.speed * 0.45;
          p.y += p.speed;

          // Lintasan gelombang kuanta foton
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + Math.sin(p.y / 4) * 4, p.y - 12);
          ctx.stroke();

          // Tumbukan Foton dengan Katoda
          if (p.x <= 88 && p.y >= 50 && p.y <= 270) {
            photons.current.splice(i, 1);
            
            // SPAWN ELEKTRON (Hanya jika E foton >= W0)
            if (isEmitting) {
              electrons.current.push({
                x: 88,
                y: p.y,
                speed: 1.5 + (kineticEnergy * 1.8),
                active: true
              });
            }
          } else if (p.y > canvas.height) {
            photons.current.splice(i, 1);
          }
        }

        // Update & Render Fotoelektron Terlontar
        ctx.fillStyle = '#38bdf8';
        for (let i = electrons.current.length - 1; i >= 0; i--) {
          const e = electrons.current[i];
          e.x += e.speed;

          // Jejak partikel elektron
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(e.x, e.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Simbol muatan (-)
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('-', e.x - 2.5, e.y + 3);
          ctx.fillStyle = '#38bdf8';

          // Menabrak Anoda (Kolektor)
          if (e.x >= canvas.width - 90) {
            electrons.current.splice(i, 1);
          }
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => { 
      if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    };
  }, [wavelength, intensity, metal, isEmitting, kineticEnergy, isRunning]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-amber-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition hover:border-slate-700 shadow-sm"
              >
                <ArrowLeft size={16} />
                <span>Kembali ke Beranda</span>
              </Link>
              <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Fisika Modern • Kuanta Foton
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Sparkles className="text-amber-400" size={24} />
              Simulasi Efek Fotolistrik Einstein
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Pembuktian sifat partikel cahaya (foton) dan hukum kekekalan energi kuanta oleh Albert Einstein (Hadiah Nobel Fisika 1921).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                isRunning 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isRunning ? <><Pause size={15} /> Jeda Radiasi</> : <><Play size={15} /> Lanjutkan Radiasi</>}
            </button>
            <button
              onClick={resetExperiment}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shadow-sm"
              title="Reset Simulasi"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </header>

        {/* Formula Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Energi Foton (<MathFormula formula="E" />):</span>
            <MathFormula formula="E = h \cdot f = \frac{hc}{\lambda}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Persamaan Einstein:</span>
            <MathFormula formula="E_k = E - W_0 = hf - W_0" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Arus Foto (<MathFormula formula="I" />):</span>
            <MathFormula formula="I \propto \text{Intensitas Foton}" />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI */}
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl shadow-xl h-fit space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Settings2 size={16} className="text-amber-400"/> Setup Laboratorium
              </span>
            </div>

            <div className="space-y-5">
              {/* Target Plat Logam */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Target Logam Katoda (<MathFormula formula="W_0" />)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.keys(metals).map(m => (
                    <button
                      key={m}
                      onClick={() => setMetal(m)}
                      className={`p-2 rounded-xl text-xs font-medium border text-left transition ${
                        metal === m
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] truncate">{m}</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">{metals[m].wf} eV</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Panjang Gelombang Cahaya */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Panjang Gelombang (<MathFormula formula="\lambda" />)</span>
                  <span className="text-amber-400 font-mono font-bold">{wavelength} nm</span>
                </div>
                <input 
                  type="range" min="150" max="750" step="5"
                  value={wavelength} 
                  onChange={(e) => setWavelength(Number(e.target.value))} 
                  className="w-full h-2.5 rounded-lg appearance-none cursor-pointer" 
                  style={{ background: 'linear-gradient(to right, #a855f7, #3b82f6, #10b981, #eab308, #ef4444, #991b1b)' }}
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1 uppercase font-mono font-bold">
                  <span>UV Ungu</span>
                  <span>Tampak</span>
                  <span>Inframerah</span>
                </div>

                {/* Preset Cepat Gelombang */}
                <div className="grid grid-cols-3 gap-1 mt-2.5">
                  <button 
                    onClick={() => setWavelength(240)}
                    className="py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-purple-300 hover:border-purple-500/40"
                  >
                    UV (240 nm)
                  </button>
                  <button 
                    onClick={() => setWavelength(450)}
                    className="py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-sky-300 hover:border-sky-500/40"
                  >
                    Biru (450 nm)
                  </button>
                  <button 
                    onClick={() => setWavelength(650)}
                    className="py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-rose-300 hover:border-rose-500/40"
                  >
                    Merah (650 nm)
                  </button>
                </div>
              </div>

              {/* Intensitas Cahaya */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                  <span>Intensitas Penyinaran</span>
                  <span className="text-amber-400 font-mono font-bold">{intensity * 10}%</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={intensity} 
                  onChange={(e) => setIntensity(Number(e.target.value))} 
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" 
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Intensitas menentukan laju kuanta foton, bukan energi per partikel.
                </p>
              </div>

              {/* Status Lontaran Kuantum */}
              <div className={`p-3 rounded-xl border text-xs leading-tight ${
                isEmitting 
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {isEmitting ? <Zap size={14} className="text-emerald-400" /> : <Target size={14} className="text-rose-400" />}
                  <span>{isEmitting ? 'Fotoelektron Terpental!' : 'Emisi Gagal (Sub-Ambang)'}</span>
                </div>
                <p className="text-[11px] opacity-80">
                  {isEmitting 
                    ? `Energi foton (${photonEnergy.toFixed(2)} eV) melampaui ambang ${metal} (${workFunction.toFixed(2)} eV).`
                    : `Tingkatkan frekuensi (kurangi panjang gelombang) agar E > ${workFunction.toFixed(2)} eV.`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* AREA KANVAS & TELEMETRI KANAN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Visualisasi Vacuum Chamber Tube */}
            <div className="bg-slate-900/80 backdrop-blur p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-4 right-6 flex flex-col gap-1.5 text-[10px] font-bold bg-slate-950/80 backdrop-blur p-2.5 rounded-xl border border-slate-800 z-10">
                <div className="text-amber-400 flex items-center gap-1.5">⚡ Kuanta Foton (<MathFormula formula="hf" />)</div>
                <div className="text-sky-400 flex items-center gap-1.5">⊖ Fotoelektron (<MathFormula formula="e^-" />)</div>
              </div>

              <canvas 
                ref={canvasRef} 
                width={800} 
                height={330} 
                className="w-full h-auto bg-[#030712] block rounded-xl border border-slate-800/60" 
              />
            </div>

            {/* Dashboard Telemetri Kuantum 3-Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Energi Foton */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sun size={13} className="text-amber-400" /> Energi Foton (<MathFormula formula="E" />)
                </div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {photonEnergy.toFixed(2)} <span className="text-xs font-normal text-slate-400">eV</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  f = {(frequencyHz / 1e14).toFixed(2)} × 10¹⁴ Hz
                </div>
              </div>

              {/* Card 2: Fungsi Kerja */}
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Target size={13} className="text-purple-400" /> Fungsi Kerja (<MathFormula formula="W_0" />)
                </div>
                <div className="text-2xl font-black font-mono text-purple-400">
                  {workFunction.toFixed(2)} <span className="text-xs font-normal text-slate-400">eV</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Ambang batas pelepasan elektron {metal}
                </div>
              </div>

              {/* Card 3: Energi Kinetik & Kecepatan */}
              <div className={`backdrop-blur border p-4 rounded-2xl shadow-md space-y-1 transition ${
                isEmitting 
                  ? 'bg-sky-950/30 border-sky-500/40 text-sky-300' 
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}>
                <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={13} className={isEmitting ? "text-sky-400" : "text-rose-400"} /> 
                  Kinetik Maks (<MathFormula formula="E_{k,\max}" />)
                </div>
                <div className="text-2xl font-black font-mono">
                  {kineticEnergy.toFixed(2)} <span className="text-xs font-normal opacity-70">eV</span>
                </div>
                <div className="text-[10px] opacity-80 font-mono">
                  {isEmitting ? `v ≈ ${electronVelocityKmS.toFixed(1)} km/detik` : 'Elektron tertahan dalam kisi'}
                </div>
              </div>
            </div>

            {/* Kotak Teori Edukasi */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex gap-3.5 items-start">
              <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-400 border border-amber-500/20 shrink-0">
                <Info size={20} />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Paradoks Gelombang vs Postulat Foton Einstein (1905)</h4>
                <p className="leading-relaxed text-slate-400">
                  Fisika klasik memprediksi bahwa gelombang cahaya dengan intensitas tinggi apapun pasti bisa memancarkan elektron jika dipanaskan cukup lama. Namun eksperimen membuktikan: seberkas cahaya merah redup maupun sangat terang <strong>sama sekali tidak dapat melepas elektron</strong> jika frekuensinya di bawah ambang (<MathFormula formula="f < f_0" />).
                </p>
                <p className="leading-relaxed text-slate-400">
                  Einstein menjelaskan bahwa cahaya diserap dalam bentuk paket partikel diskrit bernama <strong>foton</strong>, di mana satu elektron menyerap satu foton utuh: <MathFormula formula="E = hf" />.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
