"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Info, MoveHorizontal, ArrowLeft } from 'lucide-react';

export default function LensaSimulation() {
  // --- STATE ---
  const [s, setS] = useState(150); // Jarak benda (pixel visual)
  const [f, setF] = useState(50);  // Jarak fokus (pixel visual)
  const [h] = useState(40);        // Tinggi benda (konstan untuk kesederhanaan)

  // --- FISIKA & KALKULASI ---
  // Rumus: 1/f = 1/s + 1/s' => s' = (s * f) / (s - f)
  let s_aksen = 0;
  if (s !== f) {
    s_aksen = (s * f) / (s - f);
  }

  // Perbesaran M = |s'/s|
  const M = Math.abs(s_aksen / s);
  
  // Tinggi bayangan h' = h * (-s'/s) -> negatif artinya terbalik
  const h_aksen = h * (-s_aksen / s);

  // Evaluasi Sifat Bayangan
  let sifat = [];
  if (s_aksen > 0) {
      sifat.push("Nyata");
      sifat.push("Terbalik");
  } else if (s_aksen < 0) {
      sifat.push("Maya");
      sifat.push("Tegak");
  } else {
      sifat.push("Tidak Terbentuk (Tak Hingga)");
  }

  if (M > 1) sifat.push("Diperbesar");
  else if (M < 1 && M > 0) sifat.push("Diperkecil");
  else if (M === 1) sifat.push("Sama Besar");

  // --- SETUP SVG ---
  const svgWidth = 800;
  const svgHeight = 400;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Fungsi helper untuk mengubah koordinat kartesius fisika ke koordinat SVG (dimana Y ke bawah)
  const getX = (val: number) => centerX + val;
  const getY = (val: number) => centerY - val; 

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
        </div>

        <header className="mb-6 border-b border-slate-700 pb-4">
          <h1 className="text-3xl font-extrabold text-blue-400 mb-1">Simulasi Optik: Lensa Cembung</h1>
          <p className="text-slate-400 font-medium">Melacak jejak sinar istimewa dan pembentukan bayangan.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Panel Visualisasi SVG */}
          <div className="lg:col-span-3 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bg-[#0f172a]">
              
              {/* Sumbu Utama */}
              <line x1="0" y1={centerY} x2={svgWidth} y2={centerY} stroke="#475569" strokeWidth="2" strokeDasharray="5,5" />
              
              {/* Lensa Cembung (Simbol) */}
              <ellipse cx={centerX} cy={centerY} rx="15" ry="120" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2" />
              <line x1={centerX} y1={centerY - 130} x2={centerX} y2={centerY + 130} stroke="#38bdf8" strokeWidth="1" strokeDasharray="4,4" />

              {/* Titik Fokus (F dan 2F) */}
              <circle cx={getX(f)} cy={centerY} r="4" fill="#fbbf24" />
              <text x={getX(f) - 5} y={centerY + 20} fill="#fbbf24" fontSize="14" fontWeight="bold">F</text>
              
              <circle cx={getX(f * 2)} cy={centerY} r="4" fill="#fbbf24" />
              <text x={getX(f * 2) - 10} y={centerY + 20} fill="#fbbf24" fontSize="14" fontWeight="bold">2F</text>

              <circle cx={getX(-f)} cy={centerY} r="4" fill="#fbbf24" />
              <text x={getX(-f) - 5} y={centerY + 20} fill="#fbbf24" fontSize="14" fontWeight="bold">F</text>
              
              <circle cx={getX(-f * 2)} cy={centerY} r="4" fill="#fbbf24" />
              <text x={getX(-f * 2) - 10} y={centerY + 20} fill="#fbbf24" fontSize="14" fontWeight="bold">2F</text>

              {/* --- BENDA (Merah) --- */}
              <line x1={getX(-s)} y1={centerY} x2={getX(-s)} y2={getY(h)} stroke="#ef4444" strokeWidth="6" strokeLinecap="round"/>
              {/* Panah atas benda */}
              <polygon points={`${getX(-s)},${getY(h)-5} ${getX(-s)-5},${getY(h)+5} ${getX(-s)+5},${getY(h)+5}`} fill="#ef4444" />

              {/* --- SINAR ISTIMEWA --- */}
              {/* 1. Sejajar Sumbu Utama lalu ke F */}
              <line x1={getX(-s)} y1={getY(h)} x2={centerX} y2={getY(h)} stroke="#facc15" strokeWidth="2" />
              <line x1={centerX} y1={getY(h)} x2={getX(s_aksen)} y2={getY(h_aksen)} stroke="#facc15" strokeWidth="2" />
              
              {/* 2. Menuju Pusat Optik Lensa (Garis Lurus) */}
              <line x1={getX(-s)} y1={getY(h)} x2={centerX} y2={centerY} stroke="#f87171" strokeWidth="2" />
              <line x1={centerX} y1={centerY} x2={getX(s_aksen)} y2={getY(h_aksen)} stroke="#f87171" strokeWidth="2" />

              {/* Sinar Maya (Jika bayangan Maya, tarik garis putus-putus ke belakang) */}
              {s_aksen < 0 && (
                <>
                  <line x1={centerX} y1={getY(h)} x2={getX(s_aksen)} y2={getY(h_aksen)} stroke="#facc15" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1={centerX} y1={centerY} x2={getX(s_aksen)} y2={getY(h_aksen)} stroke="#f87171" strokeWidth="2" strokeDasharray="5,5" />
                </>
              )}

              {/* --- BAYANGAN (Biru) --- */}
              {s !== f && (
                <>
                  <line x1={getX(s_aksen)} y1={centerY} x2={getX(s_aksen)} y2={getY(h_aksen)} stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" opacity="0.8"/>
                  {/* Panah ujung bayangan */}
                  <polygon 
                    points={h_aksen < 0 
                      ? `${getX(s_aksen)},${getY(h_aksen)+5} ${getX(s_aksen)-5},${getY(h_aksen)-5} ${getX(s_aksen)+5},${getY(h_aksen)-5}` 
                      : `${getX(s_aksen)},${getY(h_aksen)-5} ${getX(s_aksen)-5},${getY(h_aksen)+5} ${getX(s_aksen)+5},${getY(h_aksen)+5}`
                    } 
                    fill="#3b82f6" 
                  />
                </>
              )}
            </svg>
          </div>

          {/* Panel Kontrol & Data */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
            
            <div>
              <h3 className="font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-600 pb-2">
                <MoveHorizontal size={18} className="text-blue-400"/> Variabel Input
              </h3>

              <div className="mb-6">
                <label className="flex justify-between text-sm font-semibold text-slate-300 mb-2">
                  <span>Jarak Benda (s)</span>
                  <span className="text-red-400 font-bold">{s} cm</span>
                </label>
                <input 
                  type="range" min="10" max="350" value={s} 
                  onChange={(e) => setS(Number(e.target.value))} 
                  className="w-full accent-red-500 cursor-pointer" 
                />
              </div>

              <div className="mb-8">
                <label className="flex justify-between text-sm font-semibold text-slate-300 mb-2">
                  <span>Jarak Fokus Lensa (f)</span>
                  <span className="text-yellow-400 font-bold">{f} cm</span>
                </label>
                <input 
                  type="range" min="20" max="150" value={f} 
                  onChange={(e) => setF(Number(e.target.value))} 
                  className="w-full accent-yellow-400 cursor-pointer" 
                />
              </div>
            </div>

            {/* Kotak Analisis */}
            <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
              <h4 className="text-xs uppercase font-bold text-slate-400 mb-3 flex items-center gap-2">
                 <Info size={14}/> Analisis Bayangan
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                   <span className="text-slate-300">Jarak Bayangan (s'):</span>
                   <span className="font-bold text-blue-400">{s === f ? 'Tak Hingga' : `${s_aksen.toFixed(1)} cm`}</span>
                </div>
                <div className="flex justify-between">
                   <span className="text-slate-300">Perbesaran (M):</span>
                   <span className="font-bold text-blue-400">{s === f ? '-' : `${M.toFixed(2)}x`}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-600">
                   <span className="block text-slate-400 text-xs mb-1">Sifat Bayangan:</span>
                   <div className="font-bold text-emerald-400 text-base leading-tight">
                      {sifat.join(" • ")}
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
