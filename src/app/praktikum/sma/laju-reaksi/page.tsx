"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Sparkles, 
  Layers, 
  Users, 
  RotateCcw, 
  Play, 
  Pause, 
  Activity, 
  ArrowLeft, 
  TrendingUp,
  FlaskConical,
  Info
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'A' | 'B' | 'AB'; // A (Merah), B (Biru), AB Produk (Ungu)
  radius: number;
}

interface DataPoint {
  time: number;
  products: number;
}

export default function LajuReaksiSimulation() {
  // --- STATE KONTROL PARAMETER ---
  const [temperature, setTemperature] = useState(300); // Kelvin (250K - 650K)
  const [concentration, setConcentration] = useState(40); // Jumlah partikel awal per jenis (15 - 70)
  const [hasCatalyst, setHasCatalyst] = useState(false); // Toggle Katalis
  const [surfaceArea, setSurfaceArea] = useState<'kepingan' | 'serbuk'>('serbuk'); // Luas Permukaan

  // Status Simulasi
  const [isRunning, setIsRunning] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [dataHistory, setDataHistory] = useState<DataPoint[]>([]);

  // Referensi Canvas & Animasi
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Nilai Energi Aktivasi (Ea dalam skala simulasi)
  // Katalis menurunkan Ea dari 4.5 ke 2.0
  const Ea = hasCatalyst ? 2.0 : 4.5;

  // Inisialisasi Partikel
  const initParticles = () => {
    const particles: Particle[] = [];
    let idCounter = 0;
    const canvasWidth = 650;
    const canvasHeight = 350;

    // Partikel A (Reaktan Merah)
    for (let i = 0; i < concentration; i++) {
      particles.push({
        id: idCounter++,
        x: Math.random() * (canvasWidth - 40) + 20,
        y: Math.random() * (canvasHeight - 40) + 20,
        vx: (Math.random() - 0.5) * (temperature / 100),
        vy: (Math.random() - 0.5) * (temperature / 100),
        type: 'A',
        radius: 6,
      });
    }

    // Partikel B (Reaktan Biru)
    // Jika bentuk 'kepingan', partikel B mengelompok di tengah wadah
    for (let i = 0; i < concentration; i++) {
      let posX = Math.random() * (canvasWidth - 40) + 20;
      let posY = Math.random() * (canvasHeight - 40) + 20;

      if (surfaceArea === 'kepingan') {
        // Mengumpul di area tengah wadah
        posX = 285 + (Math.random() * 80);
        posY = 135 + (Math.random() * 80);
      }

      particles.push({
        id: idCounter++,
        x: posX,
        y: posY,
        vx: surfaceArea === 'kepingan' ? (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * (temperature / 100),
        vy: surfaceArea === 'kepingan' ? (Math.random() - 0.5) * 0.4 : (Math.random() - 0.5) * (temperature / 100),
        type: 'B',
        radius: 6,
      });
    }

    particlesRef.current = particles;
    setProductCount(0);
    setReactionTime(0);
    setDataHistory([{ time: 0, products: 0 }]);
  };

  // Reset saat parameter konsentrasi atau luas permukaan berubah
  useEffect(() => {
    initParticles();
  }, [concentration, surfaceArea]);

  // Timer Reaksi & Perekaman Data Real-Time
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setReactionTime((prev) => {
          const nextTime = +(prev + 0.5).toFixed(1);
          setProductCount((currentProducts) => {
            setDataHistory((history) => {
              const updated = [...history, { time: nextTime, products: currentProducts }];
              return updated.length > 50 ? updated.slice(-50) : updated;
            });
            return currentProducts;
          });
          return nextTime;
        });
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Loop Fisika & Render Partikel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0f172a'; // Latar lab gelap
      ctx.fillRect(0, 0, width, height);

      const particles = particlesRef.current;
      const speedMultiplier = temperature / 300;

      // 1. Update Posisi & Pantulan Dinding
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Pantul dinding
        if (p.x - p.radius < 0) { p.x = p.radius; p.vx *= -1; }
        if (p.x + p.radius > width) { p.x = width - p.radius; p.vx *= -1; }
        if (p.y - p.radius < 0) { p.y = p.radius; p.vy *= -1; }
        if (p.y + p.radius > height) { p.y = height - p.radius; p.vy *= -1; }
      }

      // 2. Deteksi Tumbukan Antar Partikel
      let currentProductsCount = 0;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < p1.radius + p2.radius) {
            // Tumbukan terjadi!
            // Hitung kecepatan relatif (Energi Kinetik Tumbukan)
            const vRelX = p1.vx - p2.vx;
            const vRelY = p1.vy - p2.vy;
            const collisionEnergy = 0.5 * (vRelX * vRelX + vRelY * vRelY) * 10;

            // Cek apakah tumbukan efektif: Reaktan A + B dan Energi >= Ea
            const isReactivePair = (p1.type === 'A' && p2.type === 'B') || (p1.type === 'B' && p2.type === 'A');

            if (isReactivePair && collisionEnergy >= Ea) {
              // Tumbukan Efektif: Reaksi Berhasil -> Jadi Produk AB
              p1.type = 'AB';
              p1.radius = 8; // Produk lebih besar
              // Hapus partikel pasangan (menggabung jadi 1 molekul AB)
              particles.splice(j, 1);
              continue;
            } else {
              // Tumbukan Tidak Efektif: Pantulan elastis sederhana
              const angle = Math.atan2(dy, dx);
              const sin = Math.sin(angle);
              const cos = Math.cos(angle);

              // Pisahkan agar tidak menempel
              p1.x -= cos * 2;
              p1.y -= sin * 2;
              p2.x += cos * 2;
              p2.y += sin * 2;

              // Balik kecepatan
              p1.vx = -p1.vx;
              p1.vy = -p1.vy;
              p2.vx = -p2.vx;
              p2.vy = -p2.vy;
            }
          }
        }
        if (particles[i]?.type === 'AB') currentProductsCount++;
      }

      setProductCount((prev) => (prev !== currentProductsCount ? currentProductsCount : prev));

      // 3. Gambar Semua Partikel
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (p.type === 'A') {
          ctx.fillStyle = '#ef4444'; // Merah Reaktan A
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 5;
        } else if (p.type === 'B') {
          ctx.fillStyle = '#3b82f6'; // Biru Reaktan B
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur = 5;
        } else {
          ctx.fillStyle = '#a855f7'; // Ungu Produk AB
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 10;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => { 
      if (requestRef.current) cancelAnimationFrame(requestRef.current); 
    };
  }, [isRunning, temperature, Ea]);

  // Persentase Konversi Reaksi
  const conversionPercent = concentration > 0 
    ? Math.min(100, Math.round((productCount / concentration) * 100)) 
    : 0;

  // Render SVG Path untuk Grafik Real-Time
  const renderGraphPath = () => {
    if (dataHistory.length < 2) return '';
    const maxTime = Math.max(10, dataHistory[dataHistory.length - 1].time);
    const maxVal = Math.max(10, concentration);
    const graphWidth = 580;
    const graphHeight = 120;

    return dataHistory.map((d, index) => {
      const x = 40 + (d.time / maxTime) * graphWidth;
      const y = 140 - (d.products / maxVal) * graphHeight;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Kimia SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400 mb-1">
              Simulasi Teori Tumbukan & Laju Reaksi
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Eksperimen mikroskopis pengaruh Suhu, Konsentrasi, Luas Permukaan, dan Katalis terhadap laju pembentukan produk.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                isRunning 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              }`}
            >
              {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'Jeda Simulasi' : 'Lanjut Simulasi'}
            </button>
            <button 
              onClick={initParticles}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600"
            >
              <RotateCcw size={16}/> Reset
            </button>
          </div>
        </header>

        {/* BANNER RUMUS FISIKA-KIMIA (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-purple-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Laju:</span>
            <MathFormula formula="v = k [A]^m [B]^n" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Persamaan Arrhenius:</span>
            <MathFormula formula="k = A \cdot e^{-\frac{E_a}{R T}}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Syarat Tumbukan Efektif:</span>
            <MathFormula formula="E_{\text{kinetik}} \ge E_a" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL FAKTOR LAJU REAKSI */}
          <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 h-fit backdrop-blur">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider flex items-center gap-1.5">
                <FlaskConical size={14} className="text-purple-400" /> Faktor Pengubah Laju
              </h3>
            </div>

            {/* 1. Suhu */}
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-red-400"><Flame size={15}/> Suhu (T)</span>
                <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{temperature} K</span>
              </label>
              <input 
                type="range" min="250" max="650" step="25"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Dingin (Lambat)</span>
                <span>Panas (Cepat)</span>
              </div>
            </div>

            {/* 2. Konsentrasi */}
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-400"><Users size={15}/> Konsentrasi A & B</span>
                <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{concentration} partikel</span>
              </label>
              <input 
                type="range" min="15" max="70" step="5"
                value={concentration}
                onChange={(e) => setConcentration(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Encer (15)</span>
                <span>Pekat (70)</span>
              </div>
            </div>

            {/* 3. Luas Permukaan */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <Layers size={15}/> Bentuk Fisik B
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSurfaceArea('kepingan')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    surfaceArea === 'kepingan' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gumpalan
                </button>
                <button
                  type="button"
                  onClick={() => setSurfaceArea('serbuk')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    surfaceArea === 'serbuk' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Serbuk Halus
                </button>
              </div>
            </div>

            {/* 4. Katalis */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                  <Sparkles size={15}/> Tambah Katalis
                </span>
                <input 
                  type="checkbox" 
                  checked={hasCatalyst} 
                  onChange={(e) => setHasCatalyst(e.target.checked)}
                  className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
                />
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                {hasCatalyst 
                  ? '✨ Katalis aktif! Energi Aktivasi (Ea) turun drastis ke 2.0 eV. Frekuensi reaksi melonjak!' 
                  : 'Tanpa katalis, Ea tinggi (4.5 eV). Hanya partikel bertumbukan sangat cepat yang bereaksi.'}
              </p>
            </div>
          </div>

          {/* AREA KANVAS PARTIKEL & DASHBOARD */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Wadah Reaktor Partikel */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-2xl relative backdrop-blur">
              <div className="flex flex-wrap justify-between items-center mb-3 px-2 gap-2">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50"></span> Reaktan A
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50"></span> Reaktan B
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-300">
                    <span className="w-3 h-3 rounded-full bg-purple-500 inline-block shadow-sm shadow-purple-500/50"></span> Produk (AB)
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  Waktu: <strong className="text-white">{reactionTime.toFixed(1)}s</strong>
                </div>
              </div>

              <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
                <canvas 
                  ref={canvasRef} 
                  width={650} 
                  height={350} 
                  className="w-full h-auto block"
                />
              </div>
            </div>

            {/* Panel Hasil & Konversi Produk */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Produk Terbentuk</span>
                <span className="text-3xl font-black text-purple-400">{productCount} <span className="text-xs font-normal text-slate-400">molekul</span></span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Konversi Reaksi</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-400">{conversionPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden border border-slate-700/60">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${conversionPercent}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-center">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Activity size={14} className="text-amber-400"/> Laju Reaksi Relatif
                </span>
                <span className="text-2xl font-black text-slate-100">
                  {reactionTime > 0 ? (productCount / reactionTime).toFixed(2) : '0.00'}{' '}
                  <span className="text-xs font-normal text-slate-400">produk/detik</span>
                </span>
              </div>
            </div>

            {/* Grafik Pembentukan Produk Real-Time */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={15} className="text-purple-400" /> Kurva Kinetika: Pembentukan Produk AB terhadap Waktu
                </h4>
                <span className="text-[11px] text-slate-500">
                  Data: {dataHistory.length} titik
                </span>
              </div>

              <div className="w-full overflow-hidden bg-slate-950 rounded-xl border border-slate-800 p-2">
                <svg viewBox="0 0 640 160" className="w-full h-36">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="620" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="40" y1="80" x2="620" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="40" y1="140" x2="620" y2="140" stroke="#334155" />
                  <line x1="40" y1="20" x2="40" y2="140" stroke="#334155" />

                  {/* Sumbu Label */}
                  <text x="35" y="24" textAnchor="end" fill="#64748b" fontSize="10">{concentration}</text>
                  <text x="35" y="84" textAnchor="end" fill="#64748b" fontSize="10">{Math.round(concentration / 2)}</text>
                  <text x="35" y="144" textAnchor="end" fill="#64748b" fontSize="10">0</text>
                  <text x="615" y="154" textAnchor="end" fill="#64748b" fontSize="10">Waktu (s)</text>
                  <text x="10" y="15" fill="#a855f7" fontSize="10" fontWeight="bold">[Produk AB]</text>

                  {/* Kurva Grafik */}
                  {dataHistory.length >= 2 && (
                    <path
                      d={renderGraphPath()}
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Titik Terakhir */}
                  {dataHistory.length > 0 && (
                    <circle
                      cx={(40 + (dataHistory[dataHistory.length - 1].time / Math.max(10, dataHistory[dataHistory.length - 1].time)) * 580)}
                      cy={(140 - (dataHistory[dataHistory.length - 1].products / Math.max(10, concentration)) * 120)}
                      r="4"
                      fill="#ec4899"
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* Penjelasan Edukasi Otomatis */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
              <Info size={18} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Fakta Kimia & Teori Tumbukan:</strong>
                Ketika Anda memilih opsi <em>Gumpalan</em>, partikel reaktan B terkunci di tengah wadah sehingga reaktan A hanya dapat menabrak bagian luar gumpalan. Saat Anda mengubahnya menjadi <em>Serbuk Halus</em>, partikel B menyebar merata ke seluruh ruang, melipatgandakan bidang sentuh efektif. Dikombinasikan dengan suhu tinggi (kecepatan molekul meningkat) atau penambahan katalis (menurunkan energi aktivasi <MathFormula formula="E_a" />), frekuensi tumbukan efektif melonjak tajam dan produk ungu (AB) terbentuk dengan laju reaksi eksponensial!
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
