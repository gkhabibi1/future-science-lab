'use client';

import React from 'react';
import { SimulationItem } from '@/types/simulation';
import SiklusAirSim from './simulations/SiklusAirSim';
import MagnetSederhanaSim from './simulations/MagnetSederhanaSim';
import MengapungTenggelamSim from './simulations/MengapungTenggelamSim';
import TuasPesawatSederhanaSim from './simulations/TuasPesawatSederhanaSim';
import PemuaianZatSim from './simulations/PemuaianZatSim';
import CerminLensaSim from './simulations/CerminLensaSim';
import GerakParabolaSim from './simulations/GerakParabolaSim';
import HukumNewtonSim from './simulations/HukumNewtonSim';
import TitrasiAsamBasaSim from './simulations/TitrasiAsamBasaSim';
import ListrikAcSim from './simulations/ListrikAcSim';
import MathFormula from '@/components/MathFormula';
import { ArrowLeft, BookOpen, Sparkles, Award } from 'lucide-react';

interface Props {
  simulation: SimulationItem;
  onBack: () => void;
}

export default function SimulationRunner({ simulation, onBack }: Props) {
  const renderEngine = () => {
    switch (simulation.id) {
      case 'siklus-air':
        return <SiklusAirSim />;
      case 'magnet-sederhana':
        return <MagnetSederhanaSim />;
      case 'mengapung-tenggelam':
        return <MengapungTenggelamSim />;
      case 'tuas-pesawat-sederhana':
        return <TuasPesawatSederhanaSim />;
      case 'pemuaian-zat':
        return <PemuaianZatSim />;
      case 'cermin-lensa':
        return <CerminLensaSim />;
      case 'gerak-parabola':
        return <GerakParabolaSim />;
      case 'hukum-newton':
        return <HukumNewtonSim />;
      case 'titrasi-asam-basa':
        return <TitrasiAsamBasaSim />;
      case 'listrik-ac':
        return <ListrikAcSim />;
      default:
        return <SiklusAirSim />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
            title="Kembali ke Daftar Simulasi"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide text-white bg-gradient-to-r ${simulation.badgeColor}`}
              >
                Tingkat {simulation.level}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {simulation.subject} • {simulation.focus}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {simulation.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {simulation.formula && (
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-cyan-400">
              <MathFormula formula={simulation.formula} />
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Engine Container */}
      <div className="bg-slate-950/70 border border-slate-800 p-6 rounded-3xl backdrop-blur shadow-2xl">
        {renderEngine()}
      </div>

      {/* Explanation & Practical Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <BookOpen size={16} className="text-cyan-400" /> Deskripsi Praktikum
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">{simulation.description}</p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {simulation.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Award size={16} className="text-amber-400" /> Capaian Pembelajaran Kurikulum
          </h3>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            <li>Memahami konsep hubungan variabel independen dan dependen.</li>
            <li>Melakukan pengamatan visual data eksperimen secara konseptual.</li>
            <li>Mengembangkan pemikiran analitis sains berbasis data interaktif dengan formulasi LaTeX presisi.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
