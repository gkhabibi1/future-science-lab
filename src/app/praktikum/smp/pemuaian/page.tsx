"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, Ruler, AlertCircle, ArrowLeft } from 'lucide-react';

export default function PemuaianSimulation() {
  // --- STATE ---
  const [temperature, setTemperature] = useState(25); // Suhu awal ruangan (°C)
  const [selectedMetal, setSelectedMetal] = useState('aluminium');
  
  // Panjang Awal = 100 cm (1 meter)
  const L0 = 100; 

  // Database Material (Koefisien Muai Panjang per °C)
  const metals = {
    aluminium: { name: 'Aluminium', alpha: 0.000024, color: 'bg-slate-300' },
    tembaga: { name: 'Tembaga', alpha: 0.000017, color: 'bg-orange-600' },
    besi: { name: 'Besi / Baja', alpha: 0.000012, color: 'bg-zinc-600' },
  };

  // --- KALKULASI FISIKA ---
  const currentMetal = metals[selectedMetal as keyof typeof metals];
  const deltaT = temperature - 25; // Asumsi suhu awal 25°C
  
  // Delta L dalam cm
  const deltaL = L0 * currentMetal.alpha * Math.max(0, deltaT); 
  
  // Skala Visual: Karena muai panjang aslinya sangat kecil (milimeter), 
  // kita perbesar 50x lipat HANYA untuk kebutuhan visual di layar.
  const visualScale = 50; 
  const visualAddedWidth = deltaL * visualScale;

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Simulasi Pemuaian Zat Padat</h1>
          <p className="text-slate-500 font-medium">Praktikum Fisika - Suhu & Kalor</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel Kontrol */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
               <AlertCircle size={18} /> Parameter Pengujian
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-600 mb-2">Pilih Material Logam:</label>
              <select 
                className="w-full border border-slate-300 p-3 rounded-lg bg-slate-50 font-medium text-slate-800"
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
              >
                <option value="aluminium">Aluminium (α = 24 × 10⁻⁶ /°C)</option>
                <option value="tembaga">Tembaga (α = 17 × 10⁻⁶ /°C)</option>
                <option value="besi">Besi (α = 12 × 10⁻⁶ /°C)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
                <span>Pemanas Ruangan (Suhu)</span>
                <span className="text-red-600 font-bold">{temperature} °C</span>
              </label>
              <input 
                type="range" min="25" max="500" 
                value={temperature} 
                onChange={(e) => setTemperature(Number(e.target.value))} 
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500" 
              />
            </div>
            
            {/* Animasi Api menyala tergantung suhu */}
            <div className={`mt-8 flex justify-center text-red-500 transition-opacity duration-300 ${temperature > 30 ? 'opacity-100 animate-pulse' : 'opacity-20'}`}>
                <Flame size={48} fill="currentColor" />
            </div>
          </div>

          {/* Panel Visualisasi */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stage Simulasi */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-[300px] flex flex-col justify-center relative overflow-hidden">
                
                {/* Dinding Kiri (Penahan) */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-700 border-r-4 border-slate-800 z-10"></div>

                <div className="pl-8 relative w-full pr-12">
                   {/* Batang Logam Utama */}
                   <div className="relative h-12 flex items-center">
                       {/* Bagian Panjang Awal (Tetap) */}
                       <div className={`h-12 w-[60%] ${currentMetal.color} rounded-r-md transition-colors shadow-inner relative z-20`}></div>
                       
                       {/* Bagian Muai (Pemanjangan Animasi) */}
                       <div 
                           className={`h-12 ${currentMetal.color} opacity-75 border-y border-r border-slate-900/20 shadow-inner rounded-r-md transition-all duration-300 ease-out z-10 -ml-1`}
                           style={{ width: `${visualAddedWidth}px` }}
                       ></div>
                   </div>

                   {/* Penggaris Bawah */}
                   <div className="w-[60%] mt-4 border-t-2 border-slate-400 relative">
                       <div className="absolute top-2 left-0 text-xs text-slate-500 font-bold">0 cm</div>
                       <div className="absolute top-2 right-0 text-xs text-slate-500 font-bold">L₀ (100 cm)</div>
                       <div className="absolute -top-1 right-0 w-0.5 h-3 bg-slate-500"></div>
                   </div>
                </div>

                {/* Efek Kemerahan akibat panas */}
                {temperature > 100 && (
                   <div 
                      className="absolute inset-0 bg-red-500 pointer-events-none transition-opacity duration-700 mix-blend-color"
                      style={{ opacity: (temperature - 100) / 1000 }}
                   ></div>
                )}
            </div>

            {/* Panel Hasil Data */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                  <span className="block text-xs font-bold text-blue-400 uppercase flex items-center gap-1 mb-1"><Ruler size={14}/> Pertambahan (ΔL)</span>
                  <span className="text-2xl font-black text-blue-700">{deltaL.toFixed(4)} cm</span>
               </div>
               <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                  <span className="block text-xs font-bold text-emerald-400 uppercase mb-1">Panjang Akhir (Lt)</span>
                  <span className="text-2xl font-black text-emerald-700">{(L0 + deltaL).toFixed(4)} cm</span>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
