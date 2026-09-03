"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, RotateCcw, ArrowLeft } from 'lucide-react';

export default function TuasSimulation() {
  // State Beban Kiri
  const [massLeft, setMassLeft] = useState(50); // kg
  const [distLeft, setDistLeft] = useState(2);  // meter
  
  // State Beban Kanan (Kuasa)
  const [massRight, setMassRight] = useState(25); // kg
  const [distRight, setDistRight] = useState(4);  // meter

  const [tiltAngle, setTiltAngle] = useState(0);

  // Efek untuk menghitung rotasi papan setiap kali nilai berubah
  useEffect(() => {
    // Torsi = Massa * Jarak (Sederhananya kita abaikan g=9.8 untuk perbandingan)
    const torqueLeft = massLeft * distLeft;
    const torqueRight = massRight * distRight;
    const netTorque = torqueRight - torqueLeft;

    // Batasi sudut maksimal kemiringan papan (misal max 20 derajat)
    let newAngle = netTorque * 0.5; 
    if (newAngle > 20) newAngle = 20;
    if (newAngle < -20) newAngle = -20;
    
    setTiltAngle(newAngle);
  }, [massLeft, distLeft, massRight, distRight]);

  return (
    <div className="min-h-screen bg-sky-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-bold transition border border-sky-200 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda Praktikum</span>
          </Link>
        </div>

        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-sky-900 mb-2">Laboratorium: Tuas Pengungkit</h1>
          <p className="text-sky-700 font-medium">Praktikum Fisika SMP - Pesawat Sederhana</p>
        </header>

        {/* AREA VISUALISASI JUNGKAT-JUNGKIT */}
        <div className="bg-white p-12 rounded-3xl shadow-xl shadow-sky-100 border border-sky-100 mb-8 relative overflow-hidden h-[400px] flex flex-col justify-end items-center">
          
          {/* Awan Dekorasi */}
          <div className="absolute top-10 left-10 text-sky-200 select-none">☁️ ☁️</div>
          <div className="absolute top-20 right-20 text-sky-200 text-2xl select-none">☁️</div>

          {/* Wrapper Papan & Beban (di-rotasi bersamaan) */}
          <div 
            className="relative w-full max-w-3xl flex justify-center origin-bottom transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${tiltAngle}deg)`, marginBottom: '-10px' }}
          >
            {/* Papan Kayu */}
            <div className="w-full h-6 bg-amber-700 rounded-full shadow-inner border-b-4 border-amber-900 absolute bottom-0"></div>
            
            {/* Beban Kiri (Merah) */}
            <div 
              className="absolute bottom-6 bg-red-500 rounded-t-lg shadow-lg flex items-center justify-center text-white font-bold transition-all duration-300"
              style={{ 
                left: `calc(50% - ${distLeft * 10}% - 30px)`, // Konversi meter ke posisi %
                width: `${Math.max(40, massLeft)}px`, 
                height: `${Math.max(40, massLeft)}px` 
              }}
            >
              {massLeft}kg
            </div>

            {/* Beban Kanan (Biru) */}
            <div 
              className="absolute bottom-6 bg-blue-500 rounded-t-lg shadow-lg flex items-center justify-center text-white font-bold transition-all duration-300"
              style={{ 
                right: `calc(50% - ${distRight * 10}% - 30px)`,
                width: `${Math.max(40, massRight)}px`, 
                height: `${Math.max(40, massRight)}px` 
              }}
            >
              {massRight}kg
            </div>
          </div>

          {/* Titik Tumpu (Fulkrum) - Tidak ikut berputar */}
          <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[60px] border-b-slate-700 z-10"></div>
          
          {/* Rumput Tanah */}
          <div className="w-full h-8 bg-green-500 absolute bottom-0"></div>
          
          {/* Notifikasi Seimbang */}
          {tiltAngle === 0 && (
             <div className="absolute top-10 bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full font-bold animate-bounce flex items-center gap-2 border border-emerald-200">
               <Scale size={20}/> Torsi Seimbang!
             </div>
          )}
        </div>

        {/* PANEL KONTROL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Kontrol Sisi Kiri */}
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <h3 className="font-bold text-red-700 mb-4 uppercase text-sm tracking-wider">Sisi Beban (Kiri)</h3>
            <label className="block mb-4 text-slate-700 font-medium">
              Massa: <span className="font-bold text-red-600">{massLeft} kg</span>
              <input type="range" min="10" max="100" value={massLeft} onChange={(e) => setMassLeft(Number(e.target.value))} className="w-full mt-2 accent-red-500 cursor-pointer" />
            </label>
            <label className="block mb-2 text-slate-700 font-medium">
              Jarak dari Tumpuan: <span className="font-bold text-red-600">{distLeft} meter</span>
              <input type="range" min="1" max="5" step="0.5" value={distLeft} onChange={(e) => setDistLeft(Number(e.target.value))} className="w-full mt-2 accent-red-500 cursor-pointer" />
            </label>
            <div className="mt-4 text-xs font-bold text-red-400 bg-red-100/50 p-2 rounded">
              Torsi Kiri: {massLeft * distLeft}
            </div>
          </div>

          {/* Kontrol Sisi Kanan */}
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h3 className="font-bold text-blue-700 mb-4 uppercase text-sm tracking-wider">Sisi Kuasa (Kanan)</h3>
            <label className="block mb-4 text-slate-700 font-medium">
              Massa: <span className="font-bold text-blue-600">{massRight} kg</span>
              <input type="range" min="10" max="100" value={massRight} onChange={(e) => setMassRight(Number(e.target.value))} className="w-full mt-2 accent-blue-500 cursor-pointer" />
            </label>
            <label className="block mb-2 text-slate-700 font-medium">
              Jarak dari Tumpuan: <span className="font-bold text-blue-600">{distRight} meter</span>
              <input type="range" min="1" max="5" step="0.5" value={distRight} onChange={(e) => setDistRight(Number(e.target.value))} className="w-full mt-2 accent-blue-500 cursor-pointer" />
            </label>
            <div className="mt-4 text-xs font-bold text-blue-400 bg-blue-100/50 p-2 rounded">
              Torsi Kanan: {massRight * distRight}
            </div>
          </div>

        </div>
        
        <div className="mt-6 flex justify-center">
            <button 
                onClick={() => {setMassLeft(50); setDistLeft(2); setMassRight(25); setDistRight(4);}}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors"
            >
                <RotateCcw size={16}/> Kembalikan ke Posisi Awal
            </button>
        </div>

      </div>
    </div>
  );
}
