"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Rotate3d, 
  Compass, 
  Atom, 
  Sparkles, 
  Info, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  MousePointer,
  Layers
} from 'lucide-react';
import MathFormula from '@/components/MathFormula';

interface AtomNode {
  x: number;
  y: number;
  z: number;
  symbol: string;
  color: string;
  isLonePair?: boolean;
}

interface MoleculeSpec {
  name: string;
  formula: string;
  notation: string; // AXmEn
  geometryName: string;
  bondAngle: string;
  hybridization: string;
  polarity: 'Non-polar' | 'Polar';
  pei: number;
  peb: number;
  nodes: AtomNode[];
}

export default function VSEPRSimulation() {
  // Database bentuk VSEPR lengkap
  const molecules: Record<string, MoleculeSpec> = {
    CO2: {
      name: 'Karbon Dioksida',
      formula: 'CO₂',
      notation: 'AX₂',
      geometryName: 'Linear',
      bondAngle: '180.0°',
      hybridization: 'sp',
      polarity: 'Non-polar',
      pei: 2,
      peb: 0,
      nodes: [
        { x: 0, y: 0, z: 0, symbol: 'C', color: '#334155' }, // Pusat
        { x: -95, y: 0, z: 0, symbol: 'O', color: '#dc2626' },
        { x: 95, y: 0, z: 0, symbol: 'O', color: '#dc2626' },
      ],
    },
    BF3: {
      name: 'Boron Trifluorida',
      formula: 'BF₃',
      notation: 'AX₃',
      geometryName: 'Trigonal Planar (Segitiga Datar)',
      bondAngle: '120.0°',
      hybridization: 'sp²',
      polarity: 'Non-polar',
      pei: 3,
      peb: 0,
      nodes: [
        { x: 0, y: 0, z: 0, symbol: 'B', color: '#ec4899' },
        { x: 0, y: -90, z: 0, symbol: 'F', color: '#06b6d4' },
        { x: 78, y: 45, z: 0, symbol: 'F', color: '#06b6d4' },
        { x: -78, y: 45, z: 0, symbol: 'F', color: '#06b6d4' },
      ],
    },
    CH4: {
      name: 'Metana',
      formula: 'CH₄',
      notation: 'AX₄',
      geometryName: 'Tetrahedral',
      bondAngle: '109.5°',
      hybridization: 'sp³',
      polarity: 'Non-polar',
      pei: 4,
      peb: 0,
      nodes: [
        { x: 0, y: 0, z: 0, symbol: 'C', color: '#334155' }, // Pusat
        { x: 0, y: -90, z: 0, symbol: 'H', color: '#f8fafc' },
        { x: 85, y: 30, z: -30, symbol: 'H', color: '#f8fafc' },
        { x: -85, y: 30, z: -30, symbol: 'H', color: '#f8fafc' },
        { x: 0, y: 30, z: 85, symbol: 'H', color: '#f8fafc' },
      ],
    },
    NH3: {
      name: 'Amonia',
      formula: 'NH₃',
      notation: 'AX₃E',
      geometryName: 'Trigonal Piramida',
      bondAngle: '107.0°',
      hybridization: 'sp³',
      polarity: 'Polar',
      pei: 3,
      peb: 1,
      nodes: [
        { x: 0, y: 15, z: 0, symbol: 'N', color: '#2563eb' }, // Pusat
        { x: 75, y: 65, z: -40, symbol: 'H', color: '#f8fafc' },
        { x: -75, y: 65, z: -40, symbol: 'H', color: '#f8fafc' },
        { x: 0, y: 65, z: 80, symbol: 'H', color: '#f8fafc' },
        { x: 0, y: -70, z: 0, symbol: 'PEB', color: 'rgba(234, 179, 8, 0.45)', isLonePair: true },
      ],
    },
    H2O: {
      name: 'Air',
      formula: 'H₂O',
      notation: 'AX₂E₂',
      geometryName: 'Bengkok (Huruf V)',
      bondAngle: '104.5°',
      hybridization: 'sp³',
      polarity: 'Polar',
      pei: 2,
      peb: 2,
      nodes: [
        { x: 0, y: 10, z: 0, symbol: 'O', color: '#dc2626' }, // Pusat
        { x: 65, y: 60, z: 0, symbol: 'H', color: '#f8fafc' },
        { x: -65, y: 60, z: 0, symbol: 'H', color: '#f8fafc' },
        { x: 45, y: -65, z: 45, symbol: 'PEB', color: 'rgba(234, 179, 8, 0.45)', isLonePair: true },
        { x: -45, y: -65, z: -45, symbol: 'PEB', color: 'rgba(234, 179, 8, 0.45)', isLonePair: true },
      ],
    },
    PCl5: {
      name: 'Fosfor Pentaklorida',
      formula: 'PCl₅',
      notation: 'AX₅',
      geometryName: 'Trigonal Bipiramida',
      bondAngle: '90° & 120°',
      hybridization: 'sp³d',
      polarity: 'Non-polar',
      pei: 5,
      peb: 0,
      nodes: [
        { x: 0, y: 0, z: 0, symbol: 'P', color: '#ea580c' }, // Pusat
        { x: 0, y: -95, z: 0, symbol: 'Cl', color: '#16a34a' }, // Aksial Atas
        { x: 0, y: 95, z: 0, symbol: 'Cl', color: '#16a34a' }, // Aksial Bawah
        { x: 85, y: 0, z: 0, symbol: 'Cl', color: '#16a34a' }, // Ekuatorial 1
        { x: -42, y: 0, z: 73, symbol: 'Cl', color: '#16a34a' }, // Ekuatorial 2
        { x: -42, y: 0, z: -73, symbol: 'Cl', color: '#16a34a' }, // Ekuatorial 3
      ],
    },
    SF4: {
      name: 'Belerang Tetrafluorida',
      formula: 'SF₄',
      notation: 'AX₄E',
      geometryName: 'Jungkat-Jungkit (Seesaw)',
      bondAngle: '102° & 173°',
      hybridization: 'sp³d',
      polarity: 'Polar',
      pei: 4,
      peb: 1,
      nodes: [
        { x: 0, y: 0, z: 0, symbol: 'S', color: '#ca8a04' },
        { x: 0, y: -92, z: 0, symbol: 'F', color: '#06b6d4' }, // Aksial 1
        { x: 0, y: 92, z: 0, symbol: 'F', color: '#06b6d4' },  // Aksial 2
        { x: 75, y: 25, z: 30, symbol: 'F', color: '#06b6d4' }, // Ekuatorial 1
        { x: -75, y: 25, z: 30, symbol: 'F', color: '#06b6d4' },// Ekuatorial 2
        { x: 0, y: -30, z: -75, symbol: 'PEB', color: 'rgba(234, 179, 8, 0.45)', isLonePair: true }, // PEB Ekuatorial
      ],
    },
    ClF3: {
      name: 'Klorin Trifluorida',
      formula: 'ClF₃',
      notation: 'AX₃E₂',
      geometryName: 'Bentuk Huruf T (T-Shaped)',
      bondAngle: '87.5°',
      hybridization: 'sp³d',
      polarity: 'Polar',
      pei: 3,
      peb: 2,
      nodes: [
        { x: 0, y: 0, z: 0, symbol: 'Cl', color: '#16a34a' },
        { x: 0, y: -90, z: 0, symbol: 'F', color: '#06b6d4' }, // Aksial Atas
        { x: 0, y: 90, z: 0, symbol: 'F', color: '#06b6d4' },  // Aksial Bawah
        { x: 85, y: 0, z: 0, symbol: 'F', color: '#06b6d4' },  // Ekuatorial
        { x: -50, y: 0, z: 60, symbol: 'PEB', color: 'rgba(234, 179, 8, 0.45)', isLonePair: true },
        { x: -50, y: 0, z: -60, symbol: 'PEB', color: 'rgba(234, 179, 8, 0.45)', isLonePair: true },
      ],
    },
    SF6: {
      name: 'Belerang Heksafluorida',
      formula: 'SF₆',
      notation: 'AX₆',
      geometryName: 'Oktahedral',
      bondAngle: '90.0°',
      hybridization: 'sp³d²',
      polarity: 'Non-polar',
      pei: 6,
      peb: 0,
      nodes: [
        { x: 0, y: 0, z: 0, symbol: 'S', color: '#ca8a04' }, // Pusat
        { x: 0, y: -90, z: 0, symbol: 'F', color: '#06b6d4' },
        { x: 0, y: 90, z: 0, symbol: 'F', color: '#06b6d4' },
        { x: 90, y: 0, z: 0, symbol: 'F', color: '#06b6d4' },
        { x: -90, y: 0, z: 0, symbol: 'F', color: '#06b6d4' },
        { x: 0, y: 0, z: 90, symbol: 'F', color: '#06b6d4' },
        { x: 0, y: 0, z: -90, symbol: 'F', color: '#06b6d4' },
      ],
    },
    XeF4: {
      name: 'Xenon Tetrafluorida',
      formula: 'XeF₄',
      notation: 'AX₄E₂',
      geometryName: 'Segi Empat Datar (Square Planar)',
      bondAngle: '90.0°',
      hybridization: 'sp³d²',
      polarity: 'Non-polar',
      pei: 4,
      peb: 2,
      nodes: [
        { x: 0, y: 0, z: 0, symbol: 'Xe', color: '#8b5cf6' },
        { x: 80, y: 0, z: 80, symbol: 'F', color: '#06b6d4' },
        { x: -80, y: 0, z: 80, symbol: 'F', color: '#06b6d4' },
        { x: 80, y: 0, z: -80, symbol: 'F', color: '#06b6d4' },
        { x: -80, y: 0, z: -80, symbol: 'F', color: '#06b6d4' },
        { x: 0, y: -75, z: 0, symbol: 'PEB', color: 'rgba(234, 179, 8, 0.45)', isLonePair: true },
        { x: 0, y: 75, z: 0, symbol: 'PEB', color: 'rgba(234, 179, 8, 0.45)', isLonePair: true },
      ],
    },
  };

  const [selectedKey, setSelectedKey] = useState<string>('CH4');
  const [showLonePairs, setShowLonePairs] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // Rotasi 3D dalam radian
  const [rotX, setRotX] = useState<number>(0.3);
  const [rotY, setRotY] = useState<number>(0.5);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentMolecule = molecules[selectedKey] || molecules['CH4'];

  // Handler Drag Mouse / Touch untuk rotasi 3D manual
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => prev + dy * 0.01);

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setAutoRotate(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePos.current.x;
    const dy = e.touches[0].clientY - lastMousePos.current.y;

    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => prev + dy * 0.01);

    lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  // Render Loop 3D Matrix Projection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (autoRotate && !isDragging.current) {
        setRotY((r) => r + 0.008);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Transformasi 3D Matrix Rotasi
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Proyeksi koordinat setiap node
      const projectedNodes = currentMolecule.nodes
        .filter((node) => showLonePairs || !node.isLonePair)
        .map((node) => {
          // Rotasi terhadap sumbu Y
          const x1 = node.x * cosY + node.z * sinY;
          const z1 = -node.x * sinY + node.z * cosY;

          // Rotasi terhadap sumbu X
          const y2 = node.y * cosX - z1 * sinX;
          const z2 = node.y * sinX + z1 * cosX;

          // Proyeksi perspektif
          const fov = 360;
          const scale = fov / (fov + z2);
          const px = cx + x1 * scale;
          const py = cy + y2 * scale;

          return {
            ...node,
            px,
            py,
            scale,
            depthZ: z2,
          };
        });

      // Sortir berdasarkan kedalaman Z (Z-buffering sederhana agar yang di depan menimpa yang di belakang)
      projectedNodes.sort((a, b) => a.depthZ - b.depthZ);

      const centerNode = projectedNodes.find((n) => n.x === 0 && n.y === 0 && n.z === 0) || projectedNodes[0];

      // 1. Gambar Garis Ikatan Kimia (Chemical Bonds)
      projectedNodes.forEach((node) => {
        if (node === centerNode) return;

        if (node.isLonePair) {
          // Gambar awan elektron bebas (Lobe transparan putus-putus)
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(centerNode.px, centerNode.py);
          ctx.lineTo(node.px, node.py);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Ikatan Kovalen Padat (Silinder berkilau)
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 5 * node.scale;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(centerNode.px, centerNode.py);
          ctx.lineTo(node.px, node.py);
          ctx.stroke();

          // Highlight ikatan
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2 * node.scale;
          ctx.beginPath();
          ctx.moveTo(centerNode.px, centerNode.py);
          ctx.lineTo(node.px, node.py);
          ctx.stroke();
        }
      });

      // 2. Gambar Bola Atom / Awan PEB
      projectedNodes.forEach((node) => {
        const radius = node.isLonePair ? 22 * node.scale : (node === centerNode ? 24 : 16) * node.scale;

        if (node.isLonePair) {
          // Awan elektron PEB (Lobe kuning lembut berdenyut)
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Simbol titik pasangan elektron
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(node.px - 4, node.py, 2.5, 0, Math.PI * 2);
          ctx.arc(node.px + 4, node.py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Bola Atom 3D dengan Shading Gradien Radial
          const grad = ctx.createRadialGradient(
            node.px - radius * 0.3,
            node.py - radius * 0.3,
            radius * 0.1,
            node.px,
            node.py,
            radius
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, node.color);
          grad.addColorStop(1, '#020617');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
          ctx.fill();

          // Label Simbol Unsur
          ctx.fillStyle = node.symbol === 'H' || node.color === '#f8fafc' ? '#0f172a' : '#ffffff';
          ctx.font = `bold ${Math.max(10, Math.round(13 * node.scale))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.symbol, node.px, node.py);
        }
      });

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentMolecule, rotX, rotY, autoRotate, showLonePairs]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER NAVIGASI */}
        <header className="bg-slate-900/80 backdrop-blur border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
              >
                <ArrowLeft size={14} /> Beranda Praktikum
              </Link>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Kimia SMA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-400 mb-1">
              Simulasi Geometri Molekul 3D (Teori VSEPR)
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Eksplorasi 3D interaktif susunan domain elektron, hibridisasi orbital, awan PEB, dan sudut ikatan kimia.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowLonePairs(!showLonePairs)}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all shadow-sm ${
                showLonePairs 
                  ? 'bg-amber-600 border-amber-500 text-white shadow-amber-900/30' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {showLonePairs ? <Eye size={15} /> : <EyeOff size={15} />}
              {showLonePairs ? 'Sembunyikan PEB' : 'Tampilkan PEB'}
            </button>
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all shadow-sm ${
                autoRotate 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-900/30' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Rotate3d size={15} /> {autoRotate ? 'Hentikan Putar' : 'Auto Putar 3D'}
            </button>
          </div>
        </header>

        {/* BANNER RUMUS VSEPR (KaTeX LaTeX) */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex flex-wrap justify-around items-center gap-4 text-xs text-teal-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Rumus Tipe Domain:</span>
            <MathFormula formula="\text{AX}_m\text{E}_n" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Kekuatan Tolakan VSEPR:</span>
            <MathFormula formula="\text{PEB-PEB} > \text{PEB-PEI} > \text{PEI-PEI}" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Momen Dipol Total:</span>
            <MathFormula formula="\vec{\mu}_{\text{total}} = \sum \vec{\mu}_i \implies \begin{cases} = 0 & \text{Non-polar} \\ \neq 0 & \text{Polar} \end{cases}" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* PANEL KONTROL KIRI (KATALOG MOLEKUL VSEPR) */}
          <div className="lg:col-span-1 bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4 h-fit backdrop-blur max-h-[640px] overflow-y-auto">
            <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Compass size={16} className="text-teal-400" /> Katalog Geometri VSEPR
            </h3>

            <div className="space-y-1.5">
              {Object.keys(molecules).map((key) => {
                const mol = molecules[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedKey(key);
                      setRotX(0.3);
                      setRotY(0.5);
                    }}
                    className={`w-full p-2.5 text-left rounded-xl border text-xs font-bold transition-all ${
                      selectedKey === key
                        ? 'bg-teal-950/70 text-teal-200 border-teal-500 shadow-md ring-1 ring-teal-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-xs font-bold">{mol.name} ({mol.formula})</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-teal-400 border border-slate-700">
                        {mol.notation}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex justify-between">
                      <span className="truncate pr-1">{mol.geometryName}</span>
                      <span className="font-mono text-amber-300 shrink-0">{mol.bondAngle}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <MousePointer size={14} className="text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Interaksi 3D:</strong> Klik/sentuh & geser kanvas untuk merotasi molekul 360° secara bebas!</span>
            </div>
          </div>

          {/* AREA 3D CANVAS & DASHBOARD SPESIFIKASI (KANAN) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Ruang Canvas 3D Interaktif */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col items-center backdrop-blur">
              
              {/* Header Info & Legenda */}
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <div className="flex flex-col gap-0.5 bg-slate-950/85 p-2.5 sm:p-3 rounded-xl border border-slate-800 backdrop-blur w-full sm:w-auto">
                  <div className="text-sm sm:text-lg font-black text-white flex items-center gap-2">
                    <Atom size={16} className="text-teal-400" /> {currentMolecule.formula} — {currentMolecule.name}
                  </div>
                  <div className="text-[11px] sm:text-xs font-mono text-teal-300">
                    Bentuk: <strong>{currentMolecule.geometryName}</strong>
                  </div>
                </div>

                <div className="bg-slate-950/85 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-[10px] sm:text-[11px] flex sm:flex-col gap-3 sm:gap-1 backdrop-blur w-full sm:w-auto justify-start">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Atom Ikatan
                  </div>
                  {currentMolecule.peb > 0 && showLonePairs && (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Awan PEB
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={380}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                  className="w-full h-auto block cursor-grab active:cursor-grabbing touch-none"
                />
              </div>
            </div>

            {/* Dashboard Parameter VSEPR & Hibridisasi */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-center shadow-md">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sudut Ikatan</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {currentMolecule.bondAngle}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Tolakan Minimum</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-center shadow-md">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Domain</span>
                <div className="text-lg sm:text-xl font-black text-sky-400 font-mono mt-0.5">
                  {currentMolecule.pei} PEI + {currentMolecule.peb} PEB
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Total {currentMolecule.pei + currentMolecule.peb} Domain</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-center shadow-md">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <Sparkles size={12} className="text-teal-400" /> Hibridisasi
                </span>
                <span className="text-2xl font-black text-teal-300 font-mono">
                  {currentMolecule.hybridization}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Orbital Hibrida</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-center flex flex-col justify-center shadow-md">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kepolaran</span>
                <span className={`text-lg font-black ${currentMolecule.polarity === 'Polar' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {currentMolecule.polarity}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {currentMolecule.polarity === 'Polar' ? 'Momen Dipol μ ≠ 0' : 'Momen Dipol μ = 0'}
                </p>
              </div>

            </div>

            {/* Catatan Konsep Edukatif */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed flex gap-3.5 items-start">
              <Info size={20} className="text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-1">Efek Distorsi Tolakan Pasangan Elektron Bebas (PEB):</strong>
                Bandingkan molekul <MathFormula formula="\text{CH}_4" /> (tanpa PEB, sudut <MathFormula formula="109.5^\circ" />) dengan <MathFormula formula="\text{NH}_3" /> (1 PEB, sudut menyempit ke <MathFormula formula="107^\circ" />) dan <MathFormula formula="\text{H}_2\text{O}" /> (2 PEB, sudut makin tertekan ke <MathFormula formula="104.5^\circ" />). Ketiganya memiliki jumlah domain elektron yang sama (4 domain, orbital hibrida <MathFormula formula="sp^3" />). Namun, awan elektron bebas (PEB) yang hanya diikat oleh satu inti atom memerlukan ruang gerak lebih besar, sehingga memberikan gaya tolak elektrostatik yang jauh lebih kuat dan memeras sudut ikatan ikatan kovalen (PEI).
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
