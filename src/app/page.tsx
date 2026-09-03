'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { SIMULATION_LIST } from '@/data/simulations';
import { SimulationItem, EducationLevel } from '@/types/simulation';
import SimulationRunner from '@/components/SimulationRunner';
import MathFormula from '@/components/MathFormula';
import {
  CloudRain,
  Magnet,
  Waves,
  Scale,
  Flame,
  Sun,
  Target,
  Zap,
  TestTube,
  Activity,
  Search,
  Sparkles,
  GraduationCap,
  FlaskConical,
  Database,
  Play,
  ArrowRight,
  Filter
} from 'lucide-react';

export default function Home() {
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | 'ALL'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSimulation, setActiveSimulation] = useState<SimulationItem | null>(null);

  // Icon Resolver
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain': return <CloudRain className="w-6 h-6 text-cyan-400" />;
      case 'Magnet': return <Magnet className="w-6 h-6 text-rose-400" />;
      case 'Waves': return <Waves className="w-6 h-6 text-teal-400" />;
      case 'Scale': return <Scale className="w-6 h-6 text-amber-400" />;
      case 'Flame': return <Flame className="w-6 h-6 text-orange-400" />;
      case 'Sun': return <Sun className="w-6 h-6 text-yellow-400" />;
      case 'Target': return <Target className="w-6 h-6 text-purple-400" />;
      case 'Zap': return <Zap className="w-6 h-6 text-blue-400" />;
      case 'TestTube': return <TestTube className="w-6 h-6 text-pink-400" />;
      case 'Activity': return <Activity className="w-6 h-6 text-emerald-400" />;
      default: return <FlaskConical className="w-6 h-6 text-indigo-400" />;
    }
  };

  // Filtered Simulations
  const filteredSimulations = useMemo(() => {
    return SIMULATION_LIST.filter((sim) => {
      const matchLevel = selectedLevel === 'ALL' || sim.level === selectedLevel;
      const matchSubject = selectedSubject === 'ALL' || sim.subject === selectedSubject;
      const matchSearch =
        sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sim.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchLevel && matchSubject && matchSearch;
    });
  }, [selectedLevel, selectedSubject, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white pb-20">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header Navbar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white">
              <FlaskConical size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">LABSAINS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Virtual Lab v2.0
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Simulasi Praktikum Science
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <Database size={14} className="text-emerald-400" />
              <span>Supabase Connected</span>
            </div>
          </div>
        </header>

        {/* If Active Simulation is open, render Runner */}
        {activeSimulation ? (
          <main className="mt-8">
            <SimulationRunner
              simulation={activeSimulation}
              onBack={() => setActiveSimulation(null)}
            />
          </main>
        ) : (
          <main className="mt-8 space-y-8">
            {/* Hero AI Generated Visual Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 shadow-2xl group min-h-[300px] flex items-center">
              <Image
                src="/images/lab_hero_banner.jpg"
                alt="AI Science Laboratory Banner"
                fill
                priority
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>

              <div className="relative z-10 p-8 sm:p-12 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 backdrop-blur border border-cyan-400/40 text-cyan-300 text-xs font-bold shadow-lg">
                  <Sparkles size={14} className="text-amber-400" /> Virtual Science Lab (Presisi LaTeX)
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                  Eksplorasi Sains Digital Interaktif Berbasis AI
                </h2>
                <p className="text-slate-200 text-sm sm:text-base leading-relaxed drop-shadow">
                  Pilih kurikulum simulasi berdasarkan tingkat pendidikan Anda: <strong className="text-cyan-300">SD (Pengenalan & Visual)</strong>, <strong className="text-amber-300">SMP (Hubungan Antar Variabel)</strong>, atau <strong className="text-purple-300">SMA (Analisis Data & Rumus LaTeX)</strong>.
                </p>
              </div>
            </div>

            {/* Level Selector Tabs */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur">
                  <button
                    onClick={() => setSelectedLevel('ALL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                      selectedLevel === 'ALL'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Semua Tingkat ({SIMULATION_LIST.length})
                  </button>
                  <button
                    onClick={() => setSelectedLevel('SD')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      selectedLevel === 'SD'
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <GraduationCap size={14} />
                    SD (Pengenalan & Visual)
                  </button>
                  <button
                    onClick={() => setSelectedLevel('SMP')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      selectedLevel === 'SMP'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <GraduationCap size={14} />
                    SMP (Hubungan Variabel)
                  </button>
                  <button
                    onClick={() => setSelectedLevel('SMA')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      selectedLevel === 'SMA'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <GraduationCap size={14} />
                    SMA (Analisis & Rumus)
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari simulasi sains..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Simulations Grid */}
            {filteredSimulations.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/80 space-y-3">
                <Filter className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-white font-bold">Tidak ada simulasi yang ditemukan</h3>
                <p className="text-slate-400 text-xs">Coba ubah kata kunci pencarian atau filter tingkat pendidikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSimulations.map((sim) => (
                  <div
                    key={sim.id}
                    className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-5 border border-slate-800/80 group"
                  >
                    <div className="space-y-4">
                      {/* Top Header & Badge */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 transition">
                          {getIcon(sim.iconName)}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white bg-gradient-to-r ${sim.badgeColor}`}
                        >
                          {sim.level} • {sim.focus}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-extrabold text-white group-hover:text-cyan-300 transition">
                          {sim.title}
                        </h3>
                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                          {sim.description}
                        </p>
                      </div>
                    </div>

                    {/* KaTeX LaTeX Formula & Launch Button */}
                    <div className="space-y-4 pt-4 border-t border-slate-800/80">
                      {sim.formula && (
                        <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/80 text-[11px] text-cyan-300 truncate">
                          <MathFormula formula={sim.formula} />
                        </div>
                      )}

                      <button
                        onClick={() => setActiveSimulation(sim)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-600 text-white text-xs font-bold border border-slate-700 hover:border-cyan-500 transition duration-200 group-hover:shadow-lg group-hover:shadow-cyan-500/20"
                      >
                        <Play size={14} className="fill-current" />
                        <span>Mulai Simulasi Praktikum</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500">
          <p>© 2026 LABSAINS - Platform Simulasi Praktikum Virtual Interaktif (SD, SMP, SMA).</p>
        </footer>
      </div>
    </div>
  );
}
