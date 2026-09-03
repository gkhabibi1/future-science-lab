import { SimulationItem } from '@/types/simulation';

export const SIMULATION_LIST: SimulationItem[] = [
  // --- TINGKAT SD ---
  {
    id: 'siklus-air',
    title: 'Siklus Air & Daur Hidrologi',
    level: 'SD',
    subject: 'Pengenalan Sains',
    focus: 'Pengenalan & Visual',
    description: 'Pelajari proses Evaporasi (Penguapan), Kondensasi (Pembentukan Awan), dan Presipitasi (Hujan) secara visual dan interaktif.',
    iconName: 'CloudRain',
    badgeColor: 'from-blue-500 to-cyan-400',
    formula: 'E = k \\cdot I_{\\text{sun}} \\cdot (1 + v_{\\text{wind}})',
    tags: ['SD', 'Awan', 'Hujan', 'Air', 'Lingkungan']
  },
  {
    id: 'magnet-sederhana',
    title: 'Magnet Sederhana & Garis Gaya',
    level: 'SD',
    subject: 'Fisika',
    focus: 'Pengenalan & Visual',
    description: 'Eksperimen gaya tarik-menarik dan tolak-menolak antar kutub magnet (Utara & Selatan) serta serbuk besi pada medan magnet.',
    iconName: 'Magnet',
    badgeColor: 'from-red-500 to-rose-400',
    formula: 'F = \\frac{\\mu_0}{4\\pi} \\cdot \\frac{q_{m1} q_{m2}}{r^2}',
    tags: ['SD', 'Magnet', 'Gaya Tarik', 'Kutub Magnet']
  },
  {
    id: 'mengapung-tenggelam',
    title: 'Mengapung, Melayang & Tenggelam',
    level: 'SD',
    subject: 'Fisika',
    focus: 'Pengenalan & Visual',
    description: 'Uji berbagai benda (kayu, besi, plastik) dalam berbagai cairan (air, minyak, madu) dan amati gaya apung Archimedes.',
    iconName: 'Waves',
    badgeColor: 'from-teal-500 to-emerald-400',
    formula: 'F_a = \\rho_{\\text{cairan}} \\cdot g \\cdot V_{\\text{tercelup}}',
    tags: ['SD', 'Massa Jenis', 'Archimedes', 'Air', 'Fluida']
  },

  // --- TINGKAT SMP ---
  {
    id: 'tuas-pesawat-sederhana',
    title: 'Pesawat Sederhana: Tuas (Pengungkit)',
    level: 'SMP',
    subject: 'Fisika',
    focus: 'Hubungan Antar Variabel',
    description: 'Atur posisi beban, kuasa, dan titik tumpu untuk memahami hukum kesetimbangan momen gaya dan keuntungan mekanis (KM).',
    iconName: 'Scale',
    badgeColor: 'from-amber-500 to-yellow-400',
    formula: 'w \\cdot l_w = F \\cdot l_F \\implies \\text{KM} = \\frac{w}{F} = \\frac{l_F}{l_w}',
    path: '/praktikum/smp/tuas',
    tags: ['SMP', 'Tuas', 'Pengungkit', 'Momen Gaya', 'Mekanis']
  },
  {
    id: 'pemuaian-zat',
    title: 'Pemuaian Zat Padat (Termal)',
    level: 'SMP',
    subject: 'Fisika',
    focus: 'Hubungan Antar Variabel',
    description: 'Amati pertambahan panjang batang logam (Tembaga, Besi, Aluminium) ketika dipanaskan pada suhu tertentu.',
    iconName: 'Flame',
    badgeColor: 'from-orange-500 to-amber-600',
    formula: '\\Delta L = L_0 \\cdot \\alpha \\cdot \\Delta T \\implies L_t = L_0 (1 + \\alpha \\Delta T)',
    path: '/praktikum/smp/pemuaian',
    tags: ['SMP', 'Kalor', 'Suhu', 'Pemuaian', 'Logam']
  },
  {
    id: 'cermin-lensa',
    title: 'Pembentukan Bayangan: Cermin & Lensa',
    level: 'SMP',
    subject: 'Fisika',
    focus: 'Hubungan Antar Variabel',
    description: 'Simulasi sinar-sinar istimewa pada Cermin Cekung/Cembung dan Lensa Cembung/Cekung untuk menentukan sifat bayangan.',
    iconName: 'Sun',
    badgeColor: 'from-indigo-500 to-purple-400',
    formula: '\\frac{1}{f} = \\frac{1}{s} + \\frac{1}{s\'} \\implies M = \\left| \\frac{s\'}{s} \\right|',
    path: '/praktikum/sma/lensa',
    tags: ['SMP', 'Optika', 'Lensa', 'Cermin', 'Bayangan']
  },

  // --- TINGKAT SMA ---
  {
    id: 'gerak-parabola',
    title: 'Gerak Parabola (Projectile Motion)',
    level: 'SMA',
    subject: 'Fisika',
    focus: 'Analisis Data & Rumus',
    description: 'Simulasi peluncuran meriam dengan variasi sudut elevasi, kecepatan awal, dan gravitasi. Dilengkapi telemetry lintasan real-time.',
    iconName: 'Target',
    badgeColor: 'from-violet-600 to-indigo-500',
    formula: 'R = \\frac{v_0^2 \\sin(2\\theta)}{g}, \\quad H_{\\text{max}} = h_0 + \\frac{v_0^2 \\sin^2\\theta}{2g}',
    path: '/praktikum/sma/gerak-parabola',
    tags: ['SMA', 'Kinematika', 'Parabola', 'Vektor', 'Grafik']
  },
  {
    id: 'hukum-newton',
    title: 'Hukum II Newton & Gaya Gesek',
    level: 'SMA',
    subject: 'Fisika',
    focus: 'Analisis Data & Rumus',
    description: 'Hitung percepatan benda pada bidang datar bergesekan (kinetis & statis) berdasarkan gaya tarik dan massa benda.',
    iconName: 'Zap',
    badgeColor: 'from-blue-600 to-cyan-500',
    formula: 'a = \\frac{\\sum F}{m} = \\frac{F - \\mu_k m g}{m}',
    path: '/praktikum/sma/hukum-newton',
    tags: ['SMA', 'Dinamika', 'Newton', 'Gaya Gesek', 'Percepatan']
  },
  {
    id: 'titrasi-asam-basa',
    title: 'Titrasi Asam Basa & Kurva pH',
    level: 'SMA',
    subject: 'Kimia',
    focus: 'Analisis Data & Rumus',
    description: 'Teteskan titran NaOH dari buret ke asam HCl, amati perubahan warna indikator PP dan kurva perubahan pH secara real-time.',
    iconName: 'TestTube',
    badgeColor: 'from-pink-500 to-rose-500',
    formula: 'M_A V_A n_A = M_B V_B n_B \\implies \\text{pH} = -\\log[\\text{H}^+]',
    path: '/praktikum/sma/titrasi',
    tags: ['SMA', 'Kimia', 'Titrasi', 'pH', 'Stokiometri']
  },
  {
    id: 'listrik-ac',
    title: 'Rangkaian Listrik AC R-L-C',
    level: 'SMA',
    subject: 'Fisika',
    focus: 'Analisis Data & Rumus',
    description: 'Eksperimen tegangan bolak-balik pada resistor, induktor, dan kapasitor. Visualisasi bentuk gelombang osiloskop & kurva resonansi.',
    iconName: 'Activity',
    badgeColor: 'from-cyan-500 to-blue-600',
    formula: 'Z = \\sqrt{R^2 + (X_L - X_C)^2}, \\quad \\tan\\phi = \\frac{X_L - X_C}{R}',
    path: '/praktikum/sma/rangkaian-rlc',
    tags: ['SMA', 'Listrik AC', 'RLC', 'Impedansi', 'Gelombang']
  }
];
