'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SIMULATION_LIST } from '@/data/simulations';
import { SimulationItem, EducationLevel, SubjectCategory } from '@/types/simulation';
import SimulationRunner from '@/components/SimulationRunner';
import ParallaxHero from '@/components/ParallaxHero';
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
  Play,
  ArrowRight,
  Filter,
  ExternalLink,
  Atom,
  Dna,
  Leaf,
  Microscope,
  BookOpen
} from 'lucide-react';

export default function Home() {
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | 'ALL'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<SubjectCategory | 'ALL'>('ALL');
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
      case 'Leaf': return <Leaf className="w-6 h-6 text-emerald-400" />;
      case 'Microscope': return <Microscope className="w-6 h-6 text-teal-400" />;
      case 'FlaskConical': return <FlaskConical className="w-6 h-6 text-rose-400" />;
      default: return <FlaskConical className="w-6 h-6 text-indigo-400" />;
    }
  };

  // Helper Badge Mata Pelajaran
  const getSubjectBadge = (subject: SubjectCategory) => {
    switch (subject) {
      case 'Fisika':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Atom size={12} className="text-blue-400" /> Fisika
          </span>
        );
      case 'Kimia':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
            <FlaskConical size={12} className="text-pink-400" /> Kimia
          </span>
        );
      case 'Biologi':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Dna size={12} className="text-emerald-400" /> Biologi
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <BookOpen size={12} className="text-cyan-400" /> Sains Dasar
          </span>
        );
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

  // Total counts per subject
  const subjectCounts = useMemo(() => {
    return {
      Fisika: SIMULATION_LIST.filter((s) => s.subject === 'Fisika').length,
      Kimia: SIMULATION_LIST.filter((s) => s.subject === 'Kimia').length,
      Biologi: SIMULATION_LIST.filter((s) => s.subject === 'Biologi').length,
    };
  }, []);

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
          <div className="flex items-center gap-4">
            <div className="relative p-2 rounded-2xl bg-gradient-to-tr from-cyan-950/60 via-slate-900/80 to-blue-950/60 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-center group overflow-hidden">
              <div className="absolute inset-0 bg-cyan-400/10 rounded-2xl blur-md group-hover:bg-cyan-400/20 transition-all"></div>
              <Image 
                src="https://ik.imagekit.io/e2yna5qg8/ChatGPT_Image_Sep_5__2026__11_56_23_AM-removebg-preview.png"
                alt="LABSAINS Logo"
                width={46}
                height={46}
                className="relative z-10 object-contain drop-shadow-[0_0_12px_rgba(34,211,238,0.6)] brightness-110 contrast-125 hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                  LABSAINS
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/90 text-slate-300 border border-slate-700 shadow-sm">
                  Virtual Lab v2.0
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Simulasi Praktikum Science
              </h1>
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
            {/* Parallax Hero (Inspired by wagerfield/parallax) */}
            <div id="catalog-section">
              <ParallaxHero 
                totalSimulations={SIMULATION_LIST.length}
                onExploreClick={() => {
                  const filterEl = document.getElementById('filter-section');
                  if (filterEl) {
                    filterEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            </div>

            {/* Filter Section: Mata Pelajaran & Level */}
            <div id="filter-section" className="space-y-4 pt-4">
              
              {/* Row 1: Subject Category Filters (Pemisah Fisika, Biologi, Kimia) */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">
                  Pilih Disiplin / Mata Pelajaran:
                </span>
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 backdrop-blur">
                  <button
                    onClick={() => setSelectedSubject('ALL')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      selectedSubject === 'ALL'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <BookOpen size={14} />
                    Semua Sains ({SIMULATION_LIST.length})
                  </button>

                  <button
                    onClick={() => setSelectedSubject('Fisika')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      selectedSubject === 'Fisika'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Atom size={14} className="text-blue-400" />
                    Fisika ({subjectCounts.Fisika})
                  </button>

                  <button
                    onClick={() => setSelectedSubject('Kimia')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      selectedSubject === 'Kimia'
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <FlaskConical size={14} className="text-pink-400" />
                    Kimia ({subjectCounts.Kimia})
                  </button>

                  <button
                    onClick={() => setSelectedSubject('Biologi')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      selectedSubject === 'Biologi'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Dna size={14} className="text-emerald-400" />
                    Biologi ({subjectCounts.Biologi})
                  </button>
                </div>
              </div>

              {/* Row 2: Level Filters & Search Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur">
                  <button
                    onClick={() => setSelectedLevel('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedLevel === 'ALL'
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua Tingkat
                  </button>
                  <button
                    onClick={() => setSelectedLevel('SD')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedLevel === 'SD'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap size={13} />
                    SD
                  </button>
                  <button
                    onClick={() => setSelectedLevel('SMP')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedLevel === 'SMP'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap size={13} />
                    SMP
                  </button>
                  <button
                    onClick={() => setSelectedLevel('SMA')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedLevel === 'SMA'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <GraduationCap size={13} />
                    SMA
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari fisika, kimia, biologi..."
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
                <p className="text-slate-400 text-xs">Coba sesuaikan filter mata pelajaran (Fisika, Kimia, Biologi) atau kata kunci pencarian.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSimulations.map((sim) => (
                  <div
                    key={sim.id}
                    className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-5 border border-slate-800/80 group"
                  >
                    <div className="space-y-4">
                      {/* Top Header & Badges */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 transition">
                          {getIcon(sim.iconName)}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getSubjectBadge(sim.subject)}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white bg-gradient-to-r ${sim.badgeColor}`}
                          >
                            {sim.level}
                          </span>
                        </div>
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

                      {sim.path ? (
                        <Link
                          href={sim.path}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition duration-200 group-hover:shadow-purple-500/40"
                        >
                          <ExternalLink size={14} />
                          <span>Mulai Simulasi Halaman Khusus</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => setActiveSimulation(sim)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-cyan-600 text-white text-xs font-bold border border-slate-700 hover:border-cyan-500 transition duration-200 group-hover:shadow-lg group-hover:shadow-cyan-500/20"
                        >
                          <Play size={14} className="fill-current" />
                          <span>Mulai Simulasi Praktikum</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-800/80 flex flex-col items-center justify-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Image
              src="https://ik.imagekit.io/e2yna5qg8/ChatGPT_Image_Sep_5__2026__11_56_23_AM-removebg-preview.png"
              alt="LABSAINS Logo"
              width={26}
              height={26}
              className="object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] opacity-80"
            />
            <span className="font-bold text-slate-400">LABSAINS Virtual Laboratory</span>
          </div>
          <p>© 2026 LABSAINS - Platform Simulasi Praktikum Virtual Interaktif (Fisika, Kimia, Biologi).</p>
        </footer>
      </div>
    </div>
  );
}
