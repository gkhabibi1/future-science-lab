/**
 * User Interface Controller for 3D Projectile Motion Simulator.
 * 
 * Clean, modern, scientific, educational interface for students and teachers:
 * - Desktop Layout: Hero 3D Viewport on the left, Controls & Telemetry on the right.
 * - Mobile Layout: 3D Viewport on top, Controls below, Results below controls.
 * - Tabbed Modes: Simulation Mode (Interactive sandbox) & Educational Experiment Mode.
 * - High-Performance: Cached DOM elements, zero string thrashing, zero GC allocations.
 */
export class SimulatorUI {
  /**
   * @param {HTMLElement} container - Sidebar container element
   * @param {Object} callbacks - Application callbacks
   */
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.currentState = 'HOLDING';
    this.currentTab = 'sim'; // 'sim' | 'exp'

    // Active Experiment Settings
    this.activeExperimentPreset = 'angle'; // 'angle' | 'velocity' | 'gravity'
    this.experimentConfig = {
      angle: { constantV0: 25, constantG: 9.81 },
      velocity: { constantElevation: 45, constantG: 9.81 },
      gravity: { constantV0: 25, constantElevation: 45 }
    };

    this.render();
    this.cacheDomElements();
    this.bindEvents();
  }

  /**
   * Renders the complete application layout.
   */
  render() {
    // 1. Render Floating HUD on Canvas Viewport
    const hudContainer = document.getElementById('viewport-hud');
    if (hudContainer) {
      hudContainer.innerHTML = `
        <!-- Top Status Pill -->
        <div class="hud-top-bar">
          <div id="state-banner" class="hud-state-pill state-holding">
            <span class="hud-pulse-dot"></span>
            <span id="state-title">HOLDING</span>
          </div>

          <div class="hud-actions">
            <!-- Camera View Controls -->
            <div class="hud-cam-modes">
              <button id="hud-cam-orbit" class="hud-cam-btn active" type="button" title="Orbit Athlete View">Orbit</button>
              <button id="hud-cam-follow" class="hud-cam-btn" type="button" title="Follow Hammer in Flight">Follow</button>
              <button id="hud-cam-top" class="hud-cam-btn" type="button" title="Birds-Eye Top View">Top</button>
              <button id="hud-cam-side" class="hud-cam-btn" type="button" title="Side Profile Parabolic View">Side</button>
              <button id="btn-reset-cam" class="hud-cam-btn reset" type="button" title="Reset Camera View">↺ Reset</button>
            </div>

            <!-- 3D Vectors Toggle -->
            <label class="hud-toggle" title="Tampilkan / Sembunyikan Panah Vektor 3D">
              <input type="checkbox" id="toggle-show-vectors" checked />
              <span class="hud-toggle-slider"></span>
              <span class="hud-toggle-text">Vectors</span>
            </label>
          </div>
        </div>

        <!-- Floating Throw Power Meter (Active during AIMING & Charging) -->
        <div id="hud-power-meter" class="hud-power-meter" style="display: none;">
          <div class="hud-power-header">
            <span class="hud-power-title">⚡ THROW POWER</span>
            <span class="hud-power-val"><span id="hud-power-val">25.0</span> m/s (<span id="hud-power-pct">50%</span>)</span>
          </div>
          <div class="hud-power-track">
            <div id="hud-power-bar" class="hud-power-bar" style="width: 50%;"></div>
          </div>
          <div id="hud-power-hint" class="hud-power-hint">
            Tahan Klik Kiri / Spasi untuk Mengisi Tenaga • Lepaskan untuk Melempar
          </div>
        </div>

        <!-- Simulation Progress Indicator (Active during flight) -->
        <div id="sim-progress-wrap" class="hud-progress-card" style="display: none;">
          <div class="hud-progress-header">
            <span class="hud-progress-title">⏱️ SIMULATION TIME</span>
            <span class="hud-progress-stats">
              <span id="sim-progress-current">0.00</span>s / <span id="sim-progress-total">0.00</span>s
              (<span id="sim-progress-pct">0%</span>)
            </span>
          </div>
          <div class="hud-progress-track">
            <div id="sim-progress-bar" class="hud-progress-bar" style="width: 0%;"></div>
          </div>
        </div>
      `;
    }

    // 2. Render Sidebar Layout
    this.container.innerHTML = `
      <!-- Brand & Title Header -->
      <header class="app-header">
        <div class="header-badge">PHYSICS LABORATORY</div>
        <h1 class="app-title">3D Projectile Motion</h1>
        <p class="app-subtitle">Interactive Hammer Throw Physics Simulator</p>
      </header>

      <!-- Navigation Mode Tabs -->
      <nav class="app-nav-tabs" role="tablist">
        <button id="tab-btn-sim" class="nav-tab active" type="button" role="tab">
          <span class="tab-icon">🎮</span> Simulation
        </button>
        <button id="tab-btn-exp" class="nav-tab" type="button" role="tab">
          <span class="tab-icon">🔬</span> Experiment
        </button>
        <button id="tab-btn-challenge" class="nav-tab" type="button" role="tab">
          <span class="tab-icon">🎯</span> Challenge
        </button>
      </nav>

      <!-- TAB 1: SIMULATION VIEW -->
      <div id="tab-view-sim" class="tab-view active">
        <!-- Primary Action Buttons Group -->
        <section class="card action-card">
          <button id="btn-simulate" class="btn-simulate" type="button" title="Mulai Simulasi Peluncuran Palu">
            <span class="btn-icon">▶</span>
            <span id="btn-simulate-text">SIMULATE</span>
          </button>

          <div class="action-secondary-row">
            <button id="btn-mode-toggle" class="btn-secondary" type="button" title="Masuk Mode Bidik Lemparan">
              <span id="btn-mode-icon" class="btn-icon">🎯</span>
              <span id="btn-mode-text">AIM MODE</span>
            </button>
            <button id="btn-throw" class="btn-accent" type="button" title="Lempar Palu" disabled>
              <span class="btn-icon">🚀</span>
              <span id="btn-throw-text">THROW</span>
            </button>
            <button id="btn-reset" class="btn-outline" type="button" title="Reset Karakter dan Palu">
              <span class="btn-icon">🔄</span>
              <span>RESET</span>
            </button>
          </div>
        </section>

        <!-- Camera Perspectives Card -->
        <section class="card camera-card">
          <div class="card-header">
            <span class="card-icon">📷</span>
            <h2 class="card-title">Camera Perspectives</h2>
            <span class="badge-mode">VIEW</span>
          </div>
          <div class="camera-pill-row">
            <button id="cam-btn-orbit" class="btn-cam active" type="button" title="Default Orbital Follow">Default</button>
            <button id="cam-btn-follow" class="btn-cam" type="button" title="Follow Hammer in Real Time">Follow</button>
            <button id="cam-btn-top" class="btn-cam" type="button" title="Top-Down Bird's Eye View">Top View</button>
            <button id="cam-btn-side" class="btn-cam" type="button" title="Perpendicular Side Profile">Side View</button>
          </div>
        </section>

        <!-- Launch Parameters Card -->
        <section class="card">
          <div class="card-header">
            <span class="card-icon">⚙️</span>
            <h2 class="card-title">Launch Parameters</h2>
          </div>

          <!-- Azimuth Angle (0° to 360°) -->
          <div class="param-row">
            <div class="param-label-group">
              <label for="num-azimuth">Direction / Azimuth (φ)</label>
              <div class="input-with-unit">
                <input id="num-azimuth" type="number" min="0" max="360" step="1" value="0" class="num-input" />
                <span class="unit-text">°</span>
              </div>
            </div>
            <input id="slider-azimuth" type="range" min="0" max="360" step="1" value="0" class="range-slider" />
            <div class="range-ticks">
              <span>0° (East/+X)</span>
              <span>90° (+Z)</span>
              <span>180° (-X)</span>
              <span>270° (-Z)</span>
            </div>
          </div>

          <!-- Elevation Angle (5° to 85°) -->
          <div class="param-row">
            <div class="param-label-group">
              <label for="num-elevation">Elevation Angle (θ)</label>
              <div class="input-with-unit">
                <input id="num-elevation" type="number" min="5" max="85" step="1" value="45" class="num-input" />
                <span class="unit-text">°</span>
              </div>
            </div>
            <input id="slider-elevation" type="range" min="5" max="85" step="1" value="45" class="range-slider" />
            <div class="range-ticks">
              <span>5° (Low)</span>
              <span>45° (Optimal)</span>
              <span>85° (Steep)</span>
            </div>
          </div>

          <!-- Initial Velocity (1 to 50 m/s) -->
          <div class="param-row">
            <div class="param-label-group">
              <label for="num-v0">Initial Velocity (v₀)</label>
              <div class="input-with-unit">
                <input id="num-v0" type="number" min="1" max="50" step="0.5" value="25" class="num-input" />
                <span class="unit-text">m/s</span>
              </div>
            </div>
            <input id="slider-v0" type="range" min="1" max="50" step="0.5" value="25" class="range-slider" />
            <div class="range-ticks">
              <span>1 m/s</span>
              <span>25 m/s</span>
              <span>50 m/s</span>
            </div>
          </div>

          <!-- Gravity Acceleration (1 to 25 m/s²) -->
          <div class="param-row">
            <div class="param-label-group">
              <label for="num-gravity">Gravity (g)</label>
              <div class="input-with-unit">
                <input id="num-gravity" type="number" min="1" max="25" step="0.01" value="9.81" class="num-input" />
                <span class="unit-text">m/s²</span>
              </div>
            </div>
            <input id="slider-gravity" type="range" min="1" max="25" step="0.01" value="9.81" class="range-slider" />
            
            <!-- Quick Celestial Presets -->
            <div class="preset-pill-row">
              <button type="button" class="btn-preset" data-g="9.81">Earth (9.81)</button>
              <button type="button" class="btn-preset" data-g="1.62">Moon (1.62)</button>
              <button type="button" class="btn-preset" data-g="3.71">Mars (3.71)</button>
              <button type="button" class="btn-preset" data-g="24.79">Jupiter (24.79)</button>
            </div>
          </div>
        </section>

        <!-- Real-Time Physics Telemetry Card -->
        <section class="card">
          <div class="card-header">
            <span class="card-icon">⚡</span>
            <h2 class="card-title">Real-Time Physics Data</h2>
            <span id="phys-status-badge" class="badge-status">READY</span>
          </div>

          <!-- TIME & SPEED Hero Metrics -->
          <div class="telemetry-hero-grid">
            <div class="telemetry-hero-box cyan">
              <span class="hero-label">TIME (t)</span>
              <div class="hero-val-wrap">
                <span id="phys-time" class="hero-num">0.00</span>
                <span class="hero-unit">s</span>
              </div>
              <span class="hero-desc">Flight time elapsed</span>
            </div>

            <div class="telemetry-hero-box emerald">
              <span class="hero-label">SPEED (|v|)</span>
              <div class="hero-val-wrap">
                <span id="phys-speed" class="hero-num">0.00</span>
                <span class="hero-unit">m/s</span>
              </div>
              <span class="hero-desc">Instantaneous velocity</span>
            </div>
          </div>

          <!-- 3D POSITION (X, Y, Z) -->
          <div class="telemetry-group">
            <div class="group-title"><span class="dot cyan"></span> POSITION (3D Coordinates)</div>
            <div class="grid-3">
              <div class="data-box">
                <span class="data-label">X (Forward)</span>
                <span id="phys-pos-x" class="data-val">0.00</span>
                <span class="data-unit">m</span>
              </div>
              <div class="data-box highlight">
                <span class="data-label">Y (Altitude)</span>
                <span id="phys-pos-y" class="data-val">0.00</span>
                <span class="data-unit">m</span>
              </div>
              <div class="data-box">
                <span class="data-label">Z (Lateral)</span>
                <span id="phys-pos-z" class="data-val">0.00</span>
                <span class="data-unit">m</span>
              </div>
            </div>
          </div>

          <!-- VELOCITY (Vx, Vy, Vz) -->
          <div class="telemetry-group">
            <div class="group-title"><span class="dot emerald"></span> VELOCITY (Components)</div>
            <div class="grid-3">
              <div class="data-box">
                <span class="data-label">Vx</span>
                <span id="phys-vel-x" class="data-val">0.00</span>
                <span class="data-unit">m/s</span>
              </div>
              <div class="data-box highlight-vy">
                <span class="data-label">Vy (Vertical)</span>
                <span id="phys-vel-y" class="data-val">0.00</span>
                <span class="data-unit">m/s</span>
              </div>
              <div class="data-box">
                <span class="data-label">Vz</span>
                <span id="phys-vel-z" class="data-val">0.00</span>
                <span class="data-unit">m/s</span>
              </div>
            </div>
          </div>

          <!-- ACCELERATION (Ax, Ay, Az) -->
          <div class="telemetry-group">
            <div class="group-title"><span class="dot rose"></span> ACCELERATION (Ax, Ay, Az)</div>
            <div class="grid-3">
              <div class="data-box">
                <span class="data-label">Ax</span>
                <span id="phys-acc-x" class="data-val">0.00</span>
                <span class="data-unit">m/s²</span>
              </div>
              <div class="data-box highlight">
                <span class="data-label">Ay (Gravity)</span>
                <span id="phys-acc-y" class="data-val">-9.81</span>
                <span class="data-unit">m/s²</span>
              </div>
              <div class="data-box">
                <span class="data-label">Az</span>
                <span id="phys-acc-z" class="data-val">0.00</span>
                <span class="data-unit">m/s²</span>
              </div>
            </div>
          </div>

          <!-- DIRECTION (Azimuth φ, Elevation θ) -->
          <div class="telemetry-group">
            <div class="group-title"><span class="dot amber"></span> DIRECTION (Arah & Elevasi)</div>
            <div class="grid-2">
              <div class="data-box">
                <span class="data-label">Azimuth (φ)</span>
                <span id="phys-dir-azimuth" class="data-val">0.00</span>
                <span class="data-unit">°</span>
              </div>
              <div class="data-box">
                <span class="data-label">Elevation (θ)</span>
                <span id="phys-dir-elevation" class="data-val">45.00</span>
                <span class="data-unit">°</span>
              </div>
            </div>
          </div>

          <!-- PREDICTED TRAJECTORY TOTALS -->
          <div class="totals-summary-row">
            <div class="totals-box purple">
              <span class="totals-label">Predicted Range (R)</span>
              <span id="stat-range" class="totals-val">0.00 m</span>
            </div>
            <div class="totals-box cyan">
              <span class="totals-label">Peak Height (H_max)</span>
              <span id="stat-max-h" class="totals-val">0.00 m</span>
            </div>
          </div>

          <!-- Landed Frozen Results (Displays upon landing) -->
          <div id="landed-freeze-card" class="landed-freeze-card" style="display: none;">
            <div class="freeze-header">
              <span class="badge-landed">LANDED</span>
              <span class="freeze-title">Final Landing Data</span>
            </div>
            <div class="freeze-grid">
              <div class="freeze-item">
                <span class="freeze-label">Actual Flight Time:</span>
                <span id="freeze-flight-time" class="freeze-val">0.00 s</span>
              </div>
              <div class="freeze-item">
                <span class="freeze-label">Actual Range:</span>
                <span id="freeze-range" class="freeze-val">0.00 m</span>
              </div>
              <div class="freeze-item full">
                <span class="freeze-label">Final Coordinates:</span>
                <span id="freeze-landing-pos" class="freeze-val">X = 0.00 m, Y = 0.00 m, Z = 0.00 m</span>
              </div>
              <div class="freeze-item full">
                <span class="freeze-label">Distance to Hammer:</span>
                <span id="stat-player-dist" class="freeze-val highlight">0.00 m</span>
              </div>
            </div>

            <div class="freeze-actions">
              <button id="btn-landed-simulate" type="button" class="btn-simulate-sm" title="Simulasi lagi">
                <span>▶ Simulate Again</span>
              </button>
              <button id="btn-landed-return" type="button" class="btn-outline-sm" title="Kembali ke Mode Bidik">
                <span>🎯 Return to Throw</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Vector Legend Card -->
        <section class="card">
          <div class="card-header">
            <span class="card-icon">📐</span>
            <h2 class="card-title">3D Vectors Legend</h2>
          </div>
          <div class="legend-list">
            <div class="legend-row">
              <span class="legend-dot cyan"></span>
              <div class="legend-content">
                <span class="legend-name">v₀ (Initial Velocity)</span>
                <span class="legend-desc">Vector at release defining launch speed and initial 3D heading.</span>
              </div>
            </div>
            <div class="legend-row">
              <span class="legend-dot emerald"></span>
              <div class="legend-content">
                <span class="legend-name">v (Instantaneous Velocity)</span>
                <span class="legend-desc">Tangential flight velocity vector updating every frame.</span>
              </div>
            </div>
            <div class="legend-row">
              <span class="legend-dot rose"></span>
              <div class="legend-content">
                <span class="legend-name">g (Gravity Acceleration)</span>
                <span class="legend-desc">Constant downward gravitational pull: Ay = -g.</span>
              </div>
            </div>
            <div class="legend-row">
              <span class="legend-dot amber"></span>
              <div class="legend-content">
                <span class="legend-name">vₕ (Horizontal Velocity)</span>
                <span class="legend-desc">Horizontal ground plane velocity (constant throughout flight).</span>
              </div>
            </div>
            <div class="legend-row">
              <span class="legend-dot purple"></span>
              <div class="legend-content">
                <span class="legend-name">vᵧ (Vertical Velocity)</span>
                <span class="legend-desc">Vertical speed component (decreases upward, zero at apex).</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Educational Physics Explanation & Formulas Card -->
        <section class="card edu-card">
          <div class="card-header">
            <span class="card-icon">📚</span>
            <h2 class="card-title">Physics Principles</h2>
          </div>
          <div class="edu-body">
            <div class="formula-box">
              <div class="formula-line">Horizontal: <code>x(t) = x₀ + (v₀ cos θ cos φ) t</code></div>
              <div class="formula-line">Vertical: <code>y(t) = y₀ + (v₀ sin θ) t - ½ g t²</code></div>
              <div class="formula-line highlight">Range: <code>R = (v₀² sin 2θ) / g</code></div>
            </div>
            <p class="edu-text">
              In uniform gravity without air drag, horizontal velocity remains strictly constant while vertical velocity decreases linearly. The optimal angle for maximum range on flat terrain is <b>45°</b>.
            </p>
          </div>
        </section>
      </div>

      <!-- TAB 2: EDUCATIONAL EXPERIMENT VIEW -->
      <div id="tab-view-exp" class="tab-view" style="display: none;">
        <!-- Experiment Preset Selection Card -->
        <section class="card">
          <div class="card-header">
            <span class="card-icon">🔬</span>
            <h2 class="card-title">Experiment Presets</h2>
          </div>
          <p class="card-desc">Isolate one variable at a time to observe its exact physical effect across multiple simultaneous 3D trajectories.</p>

          <div class="exp-preset-selector">
            <button id="exp-preset-angle" class="btn-exp-preset active" type="button">
              <span class="exp-icon">📐</span>
              <span class="exp-name">1. Launch Angle</span>
              <span class="exp-sub">Compare 15°, 30°, 45°, 60°, 75°</span>
            </button>
            <button id="exp-preset-velocity" class="btn-exp-preset" type="button">
              <span class="exp-icon">⚡</span>
              <span class="exp-name">2. Initial Velocity</span>
              <span class="exp-sub">Compare 10, 20, 30, 40, 50 m/s</span>
            </button>
            <button id="exp-preset-gravity" class="btn-exp-preset" type="button">
              <span class="exp-icon">🪐</span>
              <span class="exp-name">3. Gravity</span>
              <span class="exp-sub">Earth vs Moon vs Mars vs Jupiter</span>
            </button>
          </div>

          <!-- Dynamic Constant Parameter Adjuster -->
          <div id="exp-constants-wrap" class="exp-constants-wrap">
            <!-- Populated dynamically based on active preset -->
          </div>

          <!-- Multi-Projectile Race Button -->
          <button id="btn-exp-race" class="btn-simulate mt-3" type="button" title="Luncurkan proyektil bersamaan di semua trajektori">
            <span class="btn-icon">🏁</span>
            <span>SIMULATE COMPARISON RACE</span>
          </button>
        </section>

        <!-- Side-by-Side Comparison Data Table Card -->
        <section class="card">
          <div class="card-header">
            <span class="card-icon">📊</span>
            <h2 class="card-title">Comparison Results Table</h2>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Variable</th>
                  <th>Range (R)</th>
                  <th>H_max</th>
                  <th>Flight Time</th>
                </tr>
              </thead>
              <tbody id="exp-table-body">
                <!-- Dynamically populated rows -->
              </tbody>
            </table>
          </div>
        </section>

        <!-- Educational Insight Explanation Card -->
        <section class="card edu-card">
          <div class="card-header">
            <span class="card-icon">💡</span>
            <h2 id="exp-insight-title" class="card-title">Educational Insight</h2>
          </div>
          <div class="edu-body">
            <p id="exp-insight-text" class="edu-text">
              Selecting an experiment preset will display analytical comparisons and physical insights here.
            </p>
          </div>
        </section>
      </div>

      <!-- TAB 3: CHALLENGE MODE VIEW -->
      <div id="tab-view-challenge" class="tab-view" style="display: none;">
        <!-- Target Goal Card -->
        <section class="card challenge-target-card">
          <div class="card-header">
            <span class="card-icon">🎯</span>
            <h2 class="card-title">Target Goal</h2>
            <span class="badge-mode">CHALLENGE</span>
          </div>

          <div class="ch-target-display">
            <div class="ch-target-label">TARGET DISTANCE</div>
            <div class="ch-target-val"><span id="ch-target-dist">65.0</span> <span class="unit">m</span></div>
          </div>

          <!-- Difficulty Presets -->
          <div class="ch-difficulty-row">
            <button type="button" class="btn-ch-diff" data-diff="easy">Easy (32m)</button>
            <button type="button" class="btn-ch-diff active" data-diff="medium">Medium (65m)</button>
            <button type="button" class="btn-ch-diff" data-diff="hard">Hard (110m)</button>
            <button type="button" class="btn-ch-diff" data-diff="random">🎲 Random</button>
          </div>
        </section>

        <!-- Physics Helper Strategy Card -->
        <section class="card physics-helper-card">
          <div class="card-header">
            <span class="card-icon">📐</span>
            <h2 class="card-title">Physics Guidance</h2>
          </div>
          <div class="formula-box">
            <div class="formula-title">Theoretical Range Formula:</div>
            <div class="formula-code">R = (v₀² · sin 2θ) / g</div>
            <p class="formula-tip">
              For maximum distance at any velocity, choose <strong>θ = 45°</strong>. To hit distance R, solve for v₀: <code>v₀ = √[ (R · g) / sin(2θ) ]</code>.
            </p>
          </div>
        </section>

        <!-- Challenge Parameters & Fire Button -->
        <section class="card challenge-controls-card">
          <div class="card-header">
            <span class="card-icon">⚙️</span>
            <h2 class="card-title">Challenge Controls</h2>
            <span class="badge-calc">PREDICTED: <span id="ch-pred-range">63.71</span>m</span>
          </div>

          <div class="param-row">
            <div class="param-label-group">
              <label for="ch-num-elevation">Elevation Angle (θ)</label>
              <div class="input-with-unit">
                <input id="ch-num-elevation" type="number" min="5" max="85" step="0.5" value="45" class="num-input" />
                <span class="unit-text">°</span>
              </div>
            </div>
            <input id="ch-slider-elevation" type="range" min="5" max="85" step="0.5" value="45" class="range-slider" />
          </div>

          <div class="param-row">
            <div class="param-label-group">
              <label for="ch-num-v0">Initial Velocity (v₀)</label>
              <div class="input-with-unit">
                <input id="ch-num-v0" type="number" min="1" max="50" step="0.5" value="25" class="num-input" />
                <span class="unit-text">m/s</span>
              </div>
            </div>
            <input id="ch-slider-v0" type="range" min="1" max="50" step="0.5" value="25" class="range-slider" />
          </div>

          <button id="btn-ch-fire" class="btn-simulate" type="button" title="Luncurkan Palu ke Target">
            <span class="btn-icon">🎯</span>
            <span id="btn-ch-fire-text">FIRE AT TARGET</span>
          </button>
        </section>

        <!-- Score & Accuracy Card -->
        <section class="card challenge-score-card">
          <div class="card-header">
            <span class="card-icon">🏆</span>
            <h2 class="card-title">Score & Accuracy</h2>
            <span class="badge-points"><span id="ch-score-badge">0</span> PTS</span>
          </div>

          <div class="score-grid">
            <div class="score-item">
              <span class="s-label">ATTEMPTS</span>
              <span id="ch-stat-attempts" class="s-val">0</span>
            </div>
            <div class="score-item">
              <span class="s-label">DIRECT HITS</span>
              <span id="ch-stat-hits" class="s-val">0</span>
            </div>
            <div class="score-item">
              <span class="s-label">STREAK</span>
              <span id="ch-stat-streak" class="s-val">0 🔥</span>
            </div>
          </div>

          <div class="ch-feedback-box">
            <div id="ch-result-badge" class="ch-result-badge ready">READY TO FIRE</div>
            <div class="ch-error-row">
              <span>Distance Error:</span>
              <span id="ch-error-dist" class="error-val">-</span>
            </div>
            <p id="ch-feedback-text" class="ch-feedback-text">
              Adjust your launch angle and initial velocity to hit the target marker!
            </p>
          </div>
        </section>
      </div>
    `;
  }

  /**
   * Caches all critical DOM elements once for zero-allocation performance.
   */
  cacheDomElements() {
    this.dom = {
      // Tab Buttons & Views
      tabBtnSim: document.getElementById('tab-btn-sim'),
      tabBtnExp: document.getElementById('tab-btn-exp'),
      tabBtnChallenge: document.getElementById('tab-btn-challenge'),
      tabViewSim: document.getElementById('tab-view-sim'),
      tabViewExp: document.getElementById('tab-view-exp'),
      tabViewChallenge: document.getElementById('tab-view-challenge'),

      // Canvas Floating HUD
      stateBanner: document.getElementById('state-banner'),
      stateTitle: document.getElementById('state-title'),
      toggleVectors: document.getElementById('toggle-show-vectors'),
      btnResetCam: document.getElementById('btn-reset-cam'),
      hudCamOrbit: document.getElementById('hud-cam-orbit'),
      hudCamFollow: document.getElementById('hud-cam-follow'),
      hudCamTop: document.getElementById('hud-cam-top'),
      hudCamSide: document.getElementById('hud-cam-side'),
      hudPowerMeter: document.getElementById('hud-power-meter'),
      hudPowerVal: document.getElementById('hud-power-val'),
      hudPowerPct: document.getElementById('hud-power-pct'),
      hudPowerBar: document.getElementById('hud-power-bar'),
      hudPowerHint: document.getElementById('hud-power-hint'),
      simProgressWrap: document.getElementById('sim-progress-wrap'),
      simProgressCurrent: document.getElementById('sim-progress-current'),
      simProgressTotal: document.getElementById('sim-progress-total'),
      simProgressPct: document.getElementById('sim-progress-pct'),
      simProgressBar: document.getElementById('sim-progress-bar'),

      // Camera Sidebar Buttons
      camBtnOrbit: document.getElementById('cam-btn-orbit'),
      camBtnFollow: document.getElementById('cam-btn-follow'),
      camBtnTop: document.getElementById('cam-btn-top'),
      camBtnSide: document.getElementById('cam-btn-side'),

      // Action Buttons
      btnSimulate: document.getElementById('btn-simulate'),
      btnSimulateText: document.getElementById('btn-simulate-text'),
      btnModeToggle: document.getElementById('btn-mode-toggle'),
      btnModeIcon: document.getElementById('btn-mode-icon'),
      btnModeText: document.getElementById('btn-mode-text'),
      btnThrow: document.getElementById('btn-throw'),
      btnReset: document.getElementById('btn-reset'),
      btnLandedSimulate: document.getElementById('btn-landed-simulate'),
      btnLandedReturn: document.getElementById('btn-landed-return'),

      // Inputs & Sliders
      sliderAzimuth: document.getElementById('slider-azimuth'),
      numAzimuth: document.getElementById('num-azimuth'),
      sliderElevation: document.getElementById('slider-elevation'),
      numElevation: document.getElementById('num-elevation'),
      sliderV0: document.getElementById('slider-v0'),
      numV0: document.getElementById('num-v0'),
      sliderGravity: document.getElementById('slider-gravity'),
      numGravity: document.getElementById('num-gravity'),
      presetButtons: document.querySelectorAll('.btn-preset'),

      // Telemetry Numbers
      physTime: document.getElementById('phys-time'),
      physSpeed: document.getElementById('phys-speed'),
      physPosX: document.getElementById('phys-pos-x'),
      physPosY: document.getElementById('phys-pos-y'),
      physPosZ: document.getElementById('phys-pos-z'),
      physVelX: document.getElementById('phys-vel-x'),
      physVelY: document.getElementById('phys-vel-y'),
      physVelZ: document.getElementById('phys-vel-z'),
      physAccX: document.getElementById('phys-acc-x'),
      physAccY: document.getElementById('phys-acc-y'),
      physAccZ: document.getElementById('phys-acc-z'),
      physDirAzimuth: document.getElementById('phys-dir-azimuth'),
      physDirElevation: document.getElementById('phys-dir-elevation'),
      physStatusBadge: document.getElementById('phys-status-badge'),
      statRange: document.getElementById('stat-range'),
      statMaxH: document.getElementById('stat-max-h'),

      // Landed Card Elements
      landedFreezeCard: document.getElementById('landed-freeze-card'),
      freezeFlightTime: document.getElementById('freeze-flight-time'),
      freezeRange: document.getElementById('freeze-range'),
      freezeLandingPos: document.getElementById('freeze-landing-pos'),
      statPlayerDist: document.getElementById('stat-player-dist'),

      // Experiment Mode Elements
      expPresetAngle: document.getElementById('exp-preset-angle'),
      expPresetVelocity: document.getElementById('exp-preset-velocity'),
      expPresetGravity: document.getElementById('exp-preset-gravity'),
      expConstantsWrap: document.getElementById('exp-constants-wrap'),
      btnExpRace: document.getElementById('btn-exp-race'),
      expTableBody: document.getElementById('exp-table-body'),
      expInsightTitle: document.getElementById('exp-insight-title'),
      expInsightText: document.getElementById('exp-insight-text'),

      // Challenge Mode Elements
      chTargetDist: document.getElementById('ch-target-dist'),
      chDiffBtns: document.querySelectorAll('.btn-ch-diff'),
      chPredRange: document.getElementById('ch-pred-range'),
      chSliderElevation: document.getElementById('ch-slider-elevation'),
      chNumElevation: document.getElementById('ch-num-elevation'),
      chSliderV0: document.getElementById('ch-slider-v0'),
      chNumV0: document.getElementById('ch-num-v0'),
      btnChFire: document.getElementById('btn-ch-fire'),
      btnChFireText: document.getElementById('btn-ch-fire-text'),
      chScoreBadge: document.getElementById('ch-score-badge'),
      chStatAttempts: document.getElementById('ch-stat-attempts'),
      chStatHits: document.getElementById('ch-stat-hits'),
      chStatStreak: document.getElementById('ch-stat-streak'),
      chResultBadge: document.getElementById('ch-result-badge'),
      chErrorDist: document.getElementById('ch-error-dist'),
      chFeedbackText: document.getElementById('ch-feedback-text')
    };
  }

  /**
   * Binds dual inputs, mode switching, action buttons, and keyboard controls.
   */
  bindEvents() {
    const d = this.dom;

    // Helper for syncing dual inputs
    const sync = (source, target, min, max) => {
      let val = parseFloat(source.value);
      if (isNaN(val)) return;
      if (min !== undefined && val < min) val = min;
      if (max !== undefined && val > max) val = max;
      target.value = val;

      if (this.callbacks.onParameterChange) {
        this.callbacks.onParameterChange(this.getParameters());
      }
    };

    if (d.sliderAzimuth && d.numAzimuth) {
      d.sliderAzimuth.addEventListener('input', () => sync(d.sliderAzimuth, d.numAzimuth, 0, 360));
      d.numAzimuth.addEventListener('input', () => sync(d.numAzimuth, d.sliderAzimuth, 0, 360));
    }

    if (d.sliderElevation && d.numElevation) {
      d.sliderElevation.addEventListener('input', () => sync(d.sliderElevation, d.numElevation, 5, 85));
      d.numElevation.addEventListener('input', () => sync(d.numElevation, d.sliderElevation, 5, 85));
    }

    if (d.sliderV0 && d.numV0) {
      d.sliderV0.addEventListener('input', () => sync(d.sliderV0, d.numV0, 1, 50));
      d.numV0.addEventListener('input', () => sync(d.numV0, d.sliderV0, 1, 50));
    }

    if (d.sliderGravity && d.numGravity) {
      d.sliderGravity.addEventListener('input', () => sync(d.sliderGravity, d.numGravity, 1, 25));
      d.numGravity.addEventListener('input', () => sync(d.numGravity, d.sliderGravity, 1, 25));
    }

    // Celestial Presets
    if (d.presetButtons) {
      d.presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const gVal = parseFloat(btn.getAttribute('data-g'));
          if (d.numGravity && d.sliderGravity) {
            d.numGravity.value = gVal;
            d.sliderGravity.value = gVal;
            if (this.callbacks.onParameterChange) {
              this.callbacks.onParameterChange(this.getParameters());
            }
          }
        });
      });
    }

    // Navigation Tabs Switching
    if (d.tabBtnSim) d.tabBtnSim.addEventListener('click', () => this.switchTab('sim'));
    if (d.tabBtnExp) d.tabBtnExp.addEventListener('click', () => this.switchTab('exp'));
    if (d.tabBtnChallenge) d.tabBtnChallenge.addEventListener('click', () => this.switchTab('challenge'));

    // Camera Perspective Controls
    const setCamMode = (mode) => {
      this.activeCameraMode = mode;
      this.setCameraModeUI(mode);
      if (this.callbacks.onCameraModeChange) this.callbacks.onCameraModeChange(mode);
    };

    if (d.hudCamOrbit) d.hudCamOrbit.addEventListener('click', () => setCamMode('DEFAULT'));
    if (d.hudCamFollow) d.hudCamFollow.addEventListener('click', () => setCamMode('FOLLOW_HAMMER'));
    if (d.hudCamTop) d.hudCamTop.addEventListener('click', () => setCamMode('TOP_VIEW'));
    if (d.hudCamSide) d.hudCamSide.addEventListener('click', () => setCamMode('SIDE_VIEW'));

    if (d.camBtnOrbit) d.camBtnOrbit.addEventListener('click', () => setCamMode('DEFAULT'));
    if (d.camBtnFollow) d.camBtnFollow.addEventListener('click', () => setCamMode('FOLLOW_HAMMER'));
    if (d.camBtnTop) d.camBtnTop.addEventListener('click', () => setCamMode('TOP_VIEW'));
    if (d.camBtnSide) d.camBtnSide.addEventListener('click', () => setCamMode('SIDE_VIEW'));

    // Reset Camera button
    if (d.btnResetCam) {
      d.btnResetCam.addEventListener('click', () => {
        setCamMode('DEFAULT');
        if (this.callbacks.onResetCamera) this.callbacks.onResetCamera();
      });
    }

    // SIMULATE button
    if (d.btnSimulate) {
      d.btnSimulate.addEventListener('click', () => {
        if (this.callbacks.onSimulate) this.callbacks.onSimulate();
      });
    }

    // Landed Simulate Again button
    if (d.btnLandedSimulate) {
      d.btnLandedSimulate.addEventListener('click', () => {
        if (this.callbacks.onSimulate) this.callbacks.onSimulate();
      });
    }

    // Mode Toggle button
    if (d.btnModeToggle) {
      d.btnModeToggle.addEventListener('click', () => {
        if (this.callbacks.onModeToggle) this.callbacks.onModeToggle();
      });
    }

    // Throw button (click & hold)
    if (d.btnThrow) {
      d.btnThrow.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (this.callbacks.onStartCharge) this.callbacks.onStartCharge();
      });
      d.btnThrow.addEventListener('mouseup', (e) => {
        e.preventDefault();
        if (this.callbacks.onReleaseCharge) this.callbacks.onReleaseCharge();
      });
      d.btnThrow.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.callbacks.onStartCharge) this.callbacks.onStartCharge();
      });
      d.btnThrow.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (this.callbacks.onReleaseCharge) this.callbacks.onReleaseCharge();
      });
    }

    // Reset button
    if (d.btnReset) {
      d.btnReset.addEventListener('click', () => {
        setCamMode('DEFAULT');
        if (this.callbacks.onReset) this.callbacks.onReset();
      });
    }

    // Landed Return button
    if (d.btnLandedReturn) {
      d.btnLandedReturn.addEventListener('click', () => {
        if (this.callbacks.onReturnToThrowMode) this.callbacks.onReturnToThrowMode();
      });
    }

    // Toggle Show Vectors
    if (d.toggleVectors) {
      d.toggleVectors.addEventListener('change', (e) => {
        if (this.callbacks.onToggleVectors) {
          const isChecked = e && e.target ? e.target.checked : d.toggleVectors.checked;
          this.callbacks.onToggleVectors(isChecked);
        }
      });
    }

    // Experiment Presets Buttons
    if (d.expPresetAngle) {
      d.expPresetAngle.addEventListener('click', () => this.selectExperimentPreset('angle'));
    }
    if (d.expPresetVelocity) {
      d.expPresetVelocity.addEventListener('click', () => this.selectExperimentPreset('velocity'));
    }
    if (d.expPresetGravity) {
      d.expPresetGravity.addEventListener('click', () => this.selectExperimentPreset('gravity'));
    }

    // Experiment Comparison Race Button
    if (d.btnExpRace) {
      d.btnExpRace.addEventListener('click', () => {
        if (this.callbacks.onExperimentRace) this.callbacks.onExperimentRace();
      });
    }

    // Challenge Mode Event Bindings
    if (d.chDiffBtns) {
      d.chDiffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const diff = btn.dataset.diff;
          d.chDiffBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (this.callbacks.onChallengeDifficultyChange) {
            this.callbacks.onChallengeDifficultyChange(diff);
          }
        });
      });
    }

    const syncChallenge = () => {
      const theta = parseFloat(d.chSliderElevation.value);
      const v0 = parseFloat(d.chSliderV0.value);
      d.chNumElevation.value = theta;
      d.chNumV0.value = v0;
      // Predicted range: R = v0^2 * sin(2*theta) / g
      const g = 9.81;
      const predR = (v0 * v0 * Math.sin((2 * theta * Math.PI) / 180)) / g;
      if (d.chPredRange) d.chPredRange.textContent = predR.toFixed(2);
      if (this.callbacks.onChallengeParamChange) {
        this.callbacks.onChallengeParamChange({ elevationAngleDeg: theta, v0, gravity: g });
      }
    };

    if (d.chSliderElevation && d.chNumElevation) {
      d.chSliderElevation.addEventListener('input', () => {
        d.chNumElevation.value = d.chSliderElevation.value;
        syncChallenge();
      });
      d.chNumElevation.addEventListener('input', () => {
        d.chSliderElevation.value = d.chNumElevation.value;
        syncChallenge();
      });
    }

    if (d.chSliderV0 && d.chNumV0) {
      d.chSliderV0.addEventListener('input', () => {
        d.chNumV0.value = d.chSliderV0.value;
        syncChallenge();
      });
      d.chNumV0.addEventListener('input', () => {
        d.chSliderV0.value = d.chNumV0.value;
        syncChallenge();
      });
    }

    if (d.btnChFire) {
      d.btnChFire.addEventListener('click', () => {
        const theta = parseFloat(d.chSliderElevation.value);
        const v0 = parseFloat(d.chSliderV0.value);
        if (this.callbacks.onChallengeFire) {
          this.callbacks.onChallengeFire({ elevationAngleDeg: theta, v0, gravity: 9.81 });
        }
      });
    }

    // Keyboard Shortcuts
    let spaceCharging = false;
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space' && !spaceCharging && this.currentState === 'AIMING') {
        e.preventDefault();
        spaceCharging = true;
        if (this.callbacks.onStartCharge) this.callbacks.onStartCharge();
      }
      if (e.code === 'KeyT' && this.currentState === 'AIMING') {
        e.preventDefault();
        if (this.callbacks.onThrow) this.callbacks.onThrow();
      }
      if (e.code === 'KeyR' && this.currentState === 'LANDED') {
        e.preventDefault();
        if (this.callbacks.onReturnToThrowMode) this.callbacks.onReturnToThrowMode();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && spaceCharging && this.currentState === 'AIMING') {
        e.preventDefault();
        spaceCharging = false;
        if (this.callbacks.onReleaseCharge) this.callbacks.onReleaseCharge();
      }
    });

    // Initialize Experiment Constants UI
    this.renderExperimentConstants();
  }

  /**
   * Switches between Simulation Mode, Experiment Mode, and Challenge Mode.
   * @param {'sim'|'exp'|'challenge'} tab
   */
  switchTab(tab) {
    this.currentTab = tab;
    const d = this.dom;

    [d.tabBtnSim, d.tabBtnExp, d.tabBtnChallenge].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (d.tabViewSim) d.tabViewSim.style.display = 'none';
    if (d.tabViewExp) d.tabViewExp.style.display = 'none';
    if (d.tabViewChallenge) d.tabViewChallenge.style.display = 'none';

    if (tab === 'sim') {
      if (d.tabBtnSim) d.tabBtnSim.classList.add('active');
      if (d.tabViewSim) d.tabViewSim.style.display = 'block';
      if (this.callbacks.onTabChange) this.callbacks.onTabChange('sim');
    } else if (tab === 'exp') {
      if (d.tabBtnExp) d.tabBtnExp.classList.add('active');
      if (d.tabViewExp) d.tabViewExp.style.display = 'block';
      this.selectExperimentPreset(this.activeExperimentPreset);
      if (this.callbacks.onTabChange) this.callbacks.onTabChange('exp');
    } else if (tab === 'challenge') {
      if (d.tabBtnChallenge) d.tabBtnChallenge.classList.add('active');
      if (d.tabViewChallenge) d.tabViewChallenge.style.display = 'block';
      if (this.callbacks.onTabChange) this.callbacks.onTabChange('challenge');
    }
  }

  /**
   * Updates camera mode UI state across HUD and sidebar buttons.
   * @param {'DEFAULT'|'FOLLOW_HAMMER'|'TOP_VIEW'|'SIDE_VIEW'} mode
   */
  setCameraModeUI(mode) {
    const d = this.dom;
    const hudBtns = {
      'DEFAULT': d.hudCamOrbit,
      'FOLLOW_HAMMER': d.hudCamFollow,
      'TOP_VIEW': d.hudCamTop,
      'SIDE_VIEW': d.hudCamSide
    };
    const sideBtns = {
      'DEFAULT': d.camBtnOrbit,
      'FOLLOW_HAMMER': d.camBtnFollow,
      'TOP_VIEW': d.camBtnTop,
      'SIDE_VIEW': d.camBtnSide
    };

    Object.values(hudBtns).forEach(b => { if (b) b.classList.remove('active'); });
    Object.values(sideBtns).forEach(b => { if (b) b.classList.remove('active'); });

    if (hudBtns[mode]) hudBtns[mode].classList.add('active');
    if (sideBtns[mode]) sideBtns[mode].classList.add('active');
  }

  /**
   * Updates the target distance displayed in Challenge Mode.
   * @param {number} dist
   */
  setChallengeTarget(dist) {
    if (this.dom.chTargetDist) {
      this.dom.chTargetDist.textContent = dist.toFixed(1);
    }
  }

  /**
   * Displays Challenge hit evaluation result, score, and educational tips.
   * @param {Object} result
   */
  updateChallengeEvaluation(result) {
    const d = this.dom;
    if (!d.chScoreBadge || !result) return;

    d.chScoreBadge.textContent = result.score;
    if (d.chStatAttempts) d.chStatAttempts.textContent = result.attempts;
    if (d.chStatHits) d.chStatHits.textContent = result.directHits !== undefined ? result.directHits : (result.zone === 'bullseye' ? '1' : '0');
    if (d.chStatStreak) d.chStatStreak.textContent = `${result.streak} 🔥`;

    if (d.chErrorDist) {
      const sign = result.diffSigned > 0 ? '+' : '';
      d.chErrorDist.textContent = `${sign}${result.diffSigned.toFixed(2)} m (Error: ${result.errorDist.toFixed(2)} m)`;
    }

    if (d.chResultBadge) {
      d.chResultBadge.className = `ch-result-badge zone-${result.zone}`;
      if (result.zone === 'bullseye') d.chResultBadge.textContent = '🌟 BULLSEYE! (+100 PTS)';
      else if (result.zone === 'great') d.chResultBadge.textContent = '🎯 GREAT HIT! (+50 PTS)';
      else if (result.zone === 'close') d.chResultBadge.textContent = '👍 CLOSE! (+25 PTS)';
      else d.chResultBadge.textContent = '❌ MISS (0 PTS)';
    }

    if (d.chFeedbackText) {
      d.chFeedbackText.textContent = result.feedback;
    }
  }

  /**
   * Selects an experiment preset and triggers trajectory update.
   * @param {'angle'|'velocity'|'gravity'} presetKey
   */
  selectExperimentPreset(presetKey) {
    this.activeExperimentPreset = presetKey;
    const d = this.dom;

    [d.expPresetAngle, d.expPresetVelocity, d.expPresetGravity].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    if (presetKey === 'angle' && d.expPresetAngle) d.expPresetAngle.classList.add('active');
    if (presetKey === 'velocity' && d.expPresetVelocity) d.expPresetVelocity.classList.add('active');
    if (presetKey === 'gravity' && d.expPresetGravity) d.expPresetGravity.classList.add('active');

    this.renderExperimentConstants();

    const configs = this.getExperimentTrajectoriesConfig();
    if (this.callbacks.onExperimentPresetChange) {
      this.callbacks.onExperimentPresetChange(presetKey, configs);
    }
  }

  /**
   * Renders the constant parameter controls and educational insights for the active experiment.
   */
  renderExperimentConstants() {
    const d = this.dom;
    if (!d.expConstantsWrap) return;

    if (this.activeExperimentPreset === 'angle') {
      const cfg = this.experimentConfig.angle;
      d.expConstantsWrap.innerHTML = `
        <div class="exp-constant-box">
          <div class="exp-constant-header">
            <span class="constant-label">Constant Parameters (Kecepatan & Gravitasi Tetap):</span>
          </div>
          <div class="exp-constant-row">
            <label for="exp-const-v0">Constant Velocity (v₀):</label>
            <div class="input-with-unit">
              <input id="exp-const-v0" type="number" min="5" max="50" step="1" value="${cfg.constantV0}" class="num-input-sm" />
              <span class="unit-text">m/s</span>
            </div>
            <span class="badge-fixed">g = ${cfg.constantG} m/s² (Earth)</span>
          </div>
        </div>
      `;

      d.expInsightTitle.textContent = '💡 Insight: Efek Sudut Elevasi (Launch Angle)';
      d.expInsightText.innerHTML = `
        Pada kecepatan awal konstan, jarak lemparan horizontal <code>R = (v₀² sin 2θ) / g</code> mencapai <b>maksimum mutlak pada sudut 45°</b>.<br/>
        Perhatikan bahwa sudut komplementer (seperti <b>30° dan 60°</b>, atau <b>15° dan 75°</b>) menghasilkan <b>jarak pendaratan yang sama</b> karena <code>sin(2θ) = sin(2(90°-θ))</code>, namun sudut yang lebih tinggi menghasilkan ketinggian puncak yang jauh lebih tinggi dan waktu melayang yang lebih lama!
      `;

      const inputV0 = document.getElementById('exp-const-v0');
      if (inputV0) {
        inputV0.addEventListener('input', () => {
          const val = parseFloat(inputV0.value) || 25;
          this.experimentConfig.angle.constantV0 = Math.max(5, Math.min(50, val));
          if (this.callbacks.onExperimentParamChange) {
            this.callbacks.onExperimentParamChange(this.getExperimentTrajectoriesConfig());
          }
        });
      }
    } else if (this.activeExperimentPreset === 'velocity') {
      const cfg = this.experimentConfig.velocity;
      d.expConstantsWrap.innerHTML = `
        <div class="exp-constant-box">
          <div class="exp-constant-header">
            <span class="constant-label">Constant Parameters (Sudut & Gravitasi Tetap):</span>
          </div>
          <div class="exp-constant-row">
            <label for="exp-const-theta">Constant Angle (θ):</label>
            <div class="input-with-unit">
              <input id="exp-const-theta" type="number" min="15" max="75" step="1" value="${cfg.constantElevation}" class="num-input-sm" />
              <span class="unit-text">°</span>
            </div>
            <span class="badge-fixed">g = ${cfg.constantG} m/s² (Earth)</span>
          </div>
        </div>
      `;

      d.expInsightTitle.textContent = '💡 Insight: Efek Kecepatan Awal (Initial Velocity)';
      d.expInsightText.innerHTML = `
        Jarak horizontal dan tinggi maksimum memiliki hubungan kuadratis terhadap kecepatan awal: <code>R ∝ v₀²</code> dan <code>H_max ∝ v₀²</code>.<br/>
        Menggandakan kecepatan awal (misalnya dari 20 m/s ke 40 m/s) akan <b>meningkatkan jarak jangkauan sejauh 4 KALI LIPAT</b>!
      `;

      const inputTheta = document.getElementById('exp-const-theta');
      if (inputTheta) {
        inputTheta.addEventListener('input', () => {
          const val = parseFloat(inputTheta.value) || 45;
          this.experimentConfig.velocity.constantElevation = Math.max(15, Math.min(75, val));
          if (this.callbacks.onExperimentParamChange) {
            this.callbacks.onExperimentParamChange(this.getExperimentTrajectoriesConfig());
          }
        });
      }
    } else if (this.activeExperimentPreset === 'gravity') {
      const cfg = this.experimentConfig.gravity;
      d.expConstantsWrap.innerHTML = `
        <div class="exp-constant-box">
          <div class="exp-constant-header">
            <span class="constant-label">Constant Parameters (Kecepatan & Sudut Tetap):</span>
          </div>
          <div class="exp-constant-row">
            <label for="exp-const-v0-g">Constant v₀:</label>
            <div class="input-with-unit">
              <input id="exp-const-v0-g" type="number" min="5" max="50" step="1" value="${cfg.constantV0}" class="num-input-sm" />
              <span class="unit-text">m/s</span>
            </div>
            <span class="badge-fixed">θ = ${cfg.constantElevation}°</span>
          </div>
        </div>
      `;

      d.expInsightTitle.textContent = '💡 Insight: Efek Gravitasi (Earth vs Celestion Bodies)';
      d.expInsightText.innerHTML = `
        Gravitasi berbanding terbalik terhadap jarak jangkauan dan waktu melayang: <code>R ∝ 1/g</code> dan <code>t_flight ∝ 1/g</code>.<br/>
        Di <b>Bulan (g = 1.62 m/s²)</b>, gravitasi yang lemah membuat palu melambung sangat tinggi dan mendarat berkali-kali lipat lebih jauh dibanding di <b>Bumi</b>, sedangkan di <b>Jupiter (g = 24.79 m/s²)</b> gravitasi masif menekan trajektori menjadi sangat pendek.
      `;

      const inputV0G = document.getElementById('exp-const-v0-g');
      if (inputV0G) {
        inputV0G.addEventListener('input', () => {
          const val = parseFloat(inputV0G.value) || 25;
          this.experimentConfig.gravity.constantV0 = Math.max(5, Math.min(50, val));
          if (this.callbacks.onExperimentParamChange) {
            this.callbacks.onExperimentParamChange(this.getExperimentTrajectoriesConfig());
          }
        });
      }
    }
  }

  /**
   * Generates comparison trajectory configuration arrays for the active preset.
   * @returns {Array<Object>}
   */
  getExperimentTrajectoriesConfig() {
    if (this.activeExperimentPreset === 'angle') {
      const { constantV0, constantG } = this.experimentConfig.angle;
      return [
        { v0: constantV0, elevationAngleDeg: 15, gravity: constantG, label: '15° (Flat)', paramValue: '15°' },
        { v0: constantV0, elevationAngleDeg: 30, gravity: constantG, label: '30°', paramValue: '30°' },
        { v0: constantV0, elevationAngleDeg: 45, gravity: constantG, label: '45° (Optimal)', paramValue: '45° ⭐' },
        { v0: constantV0, elevationAngleDeg: 60, gravity: constantG, label: '60°', paramValue: '60°' },
        { v0: constantV0, elevationAngleDeg: 75, gravity: constantG, label: '75° (Steep)', paramValue: '75°' }
      ];
    } else if (this.activeExperimentPreset === 'velocity') {
      const { constantElevation, constantG } = this.experimentConfig.velocity;
      return [
        { v0: 10, elevationAngleDeg: constantElevation, gravity: constantG, label: '10 m/s', paramValue: '10 m/s' },
        { v0: 20, elevationAngleDeg: constantElevation, gravity: constantG, label: '20 m/s', paramValue: '20 m/s' },
        { v0: 30, elevationAngleDeg: constantElevation, gravity: constantG, label: '30 m/s', paramValue: '30 m/s' },
        { v0: 40, elevationAngleDeg: constantElevation, gravity: constantG, label: '40 m/s', paramValue: '40 m/s' },
        { v0: 50, elevationAngleDeg: constantElevation, gravity: constantG, label: '50 m/s', paramValue: '50 m/s' }
      ];
    } else {
      const { constantV0, constantElevation } = this.experimentConfig.gravity;
      return [
        { v0: constantV0, elevationAngleDeg: constantElevation, gravity: 1.62, label: 'Moon (1.62)', paramValue: 'Moon (1.62 m/s²)' },
        { v0: constantV0, elevationAngleDeg: constantElevation, gravity: 3.71, label: 'Mars (3.71)', paramValue: 'Mars (3.71 m/s²)' },
        { v0: constantV0, elevationAngleDeg: constantElevation, gravity: 9.81, label: 'Earth (9.81)', paramValue: 'Earth (9.81 m/s²)' },
        { v0: constantV0, elevationAngleDeg: constantElevation, gravity: 24.79, label: 'Jupiter (24.79)', paramValue: 'Jupiter (24.79 m/s²)' }
      ];
    }
  }

  /**
   * Updates comparison table rows with computed physics analyses.
   * @param {Array<Object>} analyses
   */
  updateExperimentTable(analyses) {
    const d = this.dom;
    if (!d.expTableBody) return;

    let rowsHtml = '';
    analyses.forEach(a => {
      rowsHtml += `
        <tr>
          <td><span class="table-color-dot" style="background-color: ${a.color};"></span></td>
          <td><b>${a.paramValue || a.label}</b></td>
          <td><span class="num-cell purple">${a.horizontalRange.toFixed(2)} m</span></td>
          <td><span class="num-cell cyan">${a.maxHeight.toFixed(2)} m</span></td>
          <td><span class="num-cell">${a.flightTime.toFixed(2)} s</span></td>
        </tr>
      `;
    });

    d.expTableBody.innerHTML = rowsHtml;
  }

  /**
   * Reads current parameter values from DOM.
   * @returns {{ v0: number, elevationAngleDeg: number, azimuthAngleDeg: number, gravity: number, initialHeight: number }}
   */
  getParameters() {
    const d = this.dom;
    return {
      azimuthAngleDeg: parseFloat(d.numAzimuth ? d.numAzimuth.value : 0) || 0,
      elevationAngleDeg: parseFloat(d.numElevation ? d.numElevation.value : 45) || 45,
      v0: parseFloat(d.numV0 ? d.numV0.value : 25) || 25,
      gravity: parseFloat(d.numGravity ? d.numGravity.value : 9.81) || 9.81,
      initialHeight: 1.5
    };
  }

  /**
   * Synchronizes input fields and sliders with real-time mouse/keyboard aim adjustments.
   * @param {number} [azimuth]
   * @param {number} [elevation]
   * @param {number} [v0]
   */
  syncAimParameters(azimuth, elevation, v0) {
    const d = this.dom;
    if (azimuth !== undefined) {
      const clampedAzimuth = ((azimuth % 360) + 360) % 360;
      const rounded = Math.round(clampedAzimuth);
      if (d.numAzimuth) d.numAzimuth.value = rounded;
      if (d.sliderAzimuth) d.sliderAzimuth.value = rounded;
    }

    if (elevation !== undefined) {
      const clampedElevation = Math.max(5, Math.min(85, elevation));
      const rounded = Math.round(clampedElevation);
      if (d.numElevation) d.numElevation.value = rounded;
      if (d.sliderElevation) d.sliderElevation.value = rounded;
    }

    if (v0 !== undefined) {
      const clampedV0 = Math.max(1, Math.min(50, v0));
      const formatted = (Math.round(clampedV0 * 2) / 2).toFixed(1);
      if (d.numV0) d.numV0.value = formatted;
      if (d.sliderV0) d.sliderV0.value = formatted;
    }
  }

  /**
   * Updates state badge and UI mode styling.
   * @param {'HOLDING'|'AIMING'|'THROWING'|'LANDED'} state
   */
  setState(state) {
    this.currentState = state;
    const d = this.dom;
    if (!d.stateBanner) return;

    d.stateBanner.className = 'hud-state-pill';

    if (state === 'HOLDING') {
      d.stateBanner.classList.add('state-holding');
      d.stateTitle.textContent = 'HOLDING';
      d.btnModeToggle.disabled = false;
      d.btnModeToggle.className = 'btn-secondary';
      d.btnModeIcon.textContent = '🎯';
      d.btnModeText.textContent = 'AIM MODE';
      d.btnThrow.disabled = true;
      d.btnThrow.classList.remove('active');
      d.landedFreezeCard.style.display = 'none';
      d.hudPowerMeter.style.display = 'none';
      d.physStatusBadge.textContent = 'HOLDING';
      d.physStatusBadge.className = 'badge-status';
      this.setSimulatingState(false);
    } else if (state === 'AIMING') {
      d.stateBanner.classList.add('state-aiming');
      d.stateTitle.textContent = 'AIMING';
      d.btnModeToggle.disabled = false;
      d.btnModeToggle.className = 'btn-secondary';
      d.btnModeIcon.textContent = '🚶';
      d.btnModeText.textContent = 'CANCEL';
      d.btnThrow.disabled = false;
      d.btnThrow.classList.add('active');
      d.landedFreezeCard.style.display = 'none';
      d.hudPowerMeter.style.display = 'block';
      this.updatePowerMeter(this.getParameters().v0, false);
      d.physStatusBadge.textContent = 'AIMING';
      d.physStatusBadge.className = 'badge-status aiming';
      this.setSimulatingState(false);
    } else if (state === 'THROWING') {
      d.stateBanner.classList.add('state-throwing');
      d.stateTitle.textContent = 'SIMULATING';
      d.btnModeToggle.disabled = true;
      d.btnThrow.disabled = true;
      d.btnThrow.classList.remove('active');
      d.landedFreezeCard.style.display = 'none';
      d.hudPowerMeter.style.display = 'none';
      d.physStatusBadge.textContent = 'SIMULATING';
      d.physStatusBadge.className = 'badge-status simulating';
      this.setSimulatingState(true);
    } else if (state === 'LANDED') {
      d.stateBanner.classList.add('state-landed');
      d.stateTitle.textContent = 'LANDED';
      d.btnModeToggle.disabled = false;
      d.btnModeToggle.className = 'btn-secondary';
      d.btnModeIcon.textContent = '🎯';
      d.btnModeText.textContent = 'RETURN TO THROW';
      d.btnThrow.disabled = true;
      d.landedFreezeCard.style.display = 'block';
      d.hudPowerMeter.style.display = 'none';
      d.physStatusBadge.textContent = 'LANDED';
      d.physStatusBadge.className = 'badge-status landed';
      this.setSimulatingState(false);
    }
  }

  /**
   * Sets UI state for active simulation: disables SIMULATE button, shows progress.
   * @param {boolean} isSimulating
   */
  setSimulatingState(isSimulating) {
    const d = this.dom;
    if (d.btnSimulate) {
      d.btnSimulate.disabled = isSimulating;
      if (isSimulating) {
        d.btnSimulate.classList.add('disabled-simulating');
        if (d.btnSimulateText) d.btnSimulateText.textContent = 'SIMULATING...';
      } else {
        d.btnSimulate.classList.remove('disabled-simulating');
        if (d.btnSimulateText) d.btnSimulateText.textContent = 'SIMULATE';
      }
    }

    if (d.btnLandedSimulate) {
      d.btnLandedSimulate.disabled = isSimulating;
    }

    if (d.simProgressWrap) {
      d.simProgressWrap.style.display = isSimulating ? 'block' : 'none';
      if (isSimulating) {
        this.updateSimulationProgress(0, 1);
      }
    }
  }

  /**
   * Updates real-time simulation progress bar with zero DOM layout thrashing.
   * @param {number} currentTime
   * @param {number} totalTime
   */
  updateSimulationProgress(currentTime, totalTime) {
    const d = this.dom;
    const tClamped = Math.min(currentTime, totalTime);
    const ratio = totalTime > 0 ? Math.min(1, Math.max(0, tClamped / totalTime)) : 0;
    const pct = Math.round(ratio * 100);

    const curStr = tClamped.toFixed(2);
    const totStr = totalTime.toFixed(2);
    const pctStr = `${pct}%`;

    if (d.simProgressCurrent && d.simProgressCurrent.textContent !== curStr) d.simProgressCurrent.textContent = curStr;
    if (d.simProgressTotal && d.simProgressTotal.textContent !== totStr) d.simProgressTotal.textContent = totStr;
    if (d.simProgressPct && d.simProgressPct.textContent !== pctStr) d.simProgressPct.textContent = pctStr;
    if (d.simProgressBar) d.simProgressBar.style.width = pctStr;
  }

  /**
   * Updates static calculated telemetry whenever parameters change.
   * @param {Object} analysis
   */
  updateAnalysisStats(analysis) {
    const d = this.dom;
    if (!analysis) return;

    if (d.statRange) d.statRange.textContent = `${analysis.horizontalRange.toFixed(2)} m`;
    if (d.statMaxH) d.statMaxH.textContent = `${analysis.maxHeight.toFixed(2)} m`;

    if (d.physTime) d.physTime.textContent = '0.00';
    if (d.physSpeed) d.physSpeed.textContent = analysis.v0.toFixed(2);

    if (d.physPosX) d.physPosX.textContent = analysis.initialPos.x.toFixed(2);
    if (d.physPosY) d.physPosY.textContent = analysis.initialPos.y.toFixed(2);
    if (d.physPosZ) d.physPosZ.textContent = analysis.initialPos.z.toFixed(2);

    if (d.physVelX) d.physVelX.textContent = analysis.initialVel.vx.toFixed(2);
    if (d.physVelY) d.physVelY.textContent = analysis.initialVel.vy.toFixed(2);
    if (d.physVelZ) d.physVelZ.textContent = analysis.initialVel.vz.toFixed(2);

    if (d.physAccX) d.physAccX.textContent = '0.00';
    if (d.physAccY) d.physAccY.textContent = (-analysis.gravity).toFixed(2);
    if (d.physAccZ) d.physAccZ.textContent = '0.00';
    if (d.physDirAzimuth) d.physDirAzimuth.textContent = analysis.azimuthAngleDeg.toFixed(2);
    if (d.physDirElevation) d.physDirElevation.textContent = analysis.elevationAngleDeg.toFixed(2);
  }

  /**
   * High-performance per-frame telemetry updates: writes directly to cached elements
   * and avoids layout recalculation if strings haven't changed.
   * 
   * @param {number} t
   * @param {{x: number, y: number, z: number}} pos
   * @param {{vx: number, vy: number, vz: number, speed: number}} vel
   * @param {number} gravity
   * @param {number} azimuthDeg
   * @param {number} elevationDeg
   */
  updateRealtimePhysics(t, pos, vel, gravity, azimuthDeg, elevationDeg) {
    const d = this.dom;

    const tStr = t.toFixed(2);
    const speedStr = vel.speed.toFixed(2);
    const posXStr = pos.x.toFixed(2);
    const posYStr = pos.y.toFixed(2);
    const posZStr = pos.z.toFixed(2);
    const velXStr = vel.vx.toFixed(2);
    const velYStr = vel.vy.toFixed(2);
    const velZStr = vel.vz.toFixed(2);

    if (d.physTime && d.physTime.textContent !== tStr) d.physTime.textContent = tStr;
    if (d.physSpeed && d.physSpeed.textContent !== speedStr) d.physSpeed.textContent = speedStr;
    if (d.physPosX && d.physPosX.textContent !== posXStr) d.physPosX.textContent = posXStr;
    if (d.physPosY && d.physPosY.textContent !== posYStr) d.physPosY.textContent = posYStr;
    if (d.physPosZ && d.physPosZ.textContent !== posZStr) d.physPosZ.textContent = posZStr;
    if (d.physVelX && d.physVelX.textContent !== velXStr) d.physVelX.textContent = velXStr;
    if (d.physVelY && d.physVelY.textContent !== velYStr) d.physVelY.textContent = velYStr;
    if (d.physVelZ && d.physVelZ.textContent !== velZStr) d.physVelZ.textContent = velZStr;

    if (d.physAccX && d.physAccX.textContent !== '0.00') d.physAccX.textContent = '0.00';
    const ayStr = (-gravity).toFixed(2);
    if (d.physAccY && d.physAccY.textContent !== ayStr) d.physAccY.textContent = ayStr;
    if (d.physAccZ && d.physAccZ.textContent !== '0.00') d.physAccZ.textContent = '0.00';

    if (azimuthDeg !== undefined && d.physDirAzimuth) {
      const azStr = azimuthDeg.toFixed(2);
      if (d.physDirAzimuth.textContent !== azStr) d.physDirAzimuth.textContent = azStr;
    }
    if (elevationDeg !== undefined && d.physDirElevation) {
      const elStr = elevationDeg.toFixed(2);
      if (d.physDirElevation.textContent !== elStr) d.physDirElevation.textContent = elStr;
    }
  }

  /**
   * Freezes final values upon hammer landing.
   * @param {Object} analysis
   * @param {{vx: number, vy: number, vz: number, speed: number}} impactVel
   */
  freezeLandedPhysics(analysis, impactVel) {
    const d = this.dom;

    d.physTime.textContent = analysis.flightTime.toFixed(2);
    d.physSpeed.textContent = impactVel.speed.toFixed(2);

    if (analysis.landingPos) {
      d.physPosX.textContent = analysis.landingPos.x.toFixed(2);
      d.physPosY.textContent = analysis.landingPos.y.toFixed(2);
      d.physPosZ.textContent = analysis.landingPos.z.toFixed(2);
    }

    d.physVelX.textContent = impactVel.vx.toFixed(2);
    d.physVelY.textContent = impactVel.vy.toFixed(2);
    d.physVelZ.textContent = impactVel.vz.toFixed(2);

    if (d.physAccX) d.physAccX.textContent = '0.00';
    if (d.physAccY) d.physAccY.textContent = (-analysis.gravity).toFixed(2);
    if (d.physAccZ) d.physAccZ.textContent = '0.00';

    if (d.freezeFlightTime) d.freezeFlightTime.textContent = `${analysis.flightTime.toFixed(2)} s`;
    if (d.freezeRange) d.freezeRange.textContent = `${analysis.horizontalRange.toFixed(2)} m`;
    if (d.freezeLandingPos && analysis.landingPos) {
      d.freezeLandingPos.textContent = `X = ${analysis.landingPos.x.toFixed(2)} m, Y = ${analysis.landingPos.y.toFixed(2)} m, Z = ${analysis.landingPos.z.toFixed(2)} m`;
    }

    if (d.physStatusBadge) {
      d.physStatusBadge.textContent = 'LANDED';
      d.physStatusBadge.className = 'badge-status landed';
    }
  }

  /**
   * Updates distance from player to landed hammer.
   * @param {number} dist
   */
  updatePlayerDistance(dist) {
    const d = this.dom;
    if (d.statPlayerDist) {
      d.statPlayerDist.textContent = `${dist.toFixed(2)} m`;
    }
  }

  /**
   * Updates HUD Power Meter bar and text values during charging.
   * @param {number} v0
   * @param {boolean} isCharging
   */
  updatePowerMeter(v0, isCharging = false) {
    const d = this.dom;
    const clampedV0 = Math.max(1, Math.min(50, v0));
    const ratio = (clampedV0 - 1) / (50 - 1);
    const pct = Math.round(ratio * 100);

    if (d.hudPowerVal) d.hudPowerVal.textContent = clampedV0.toFixed(1);
    if (d.hudPowerPct) d.hudPowerPct.textContent = `${pct}%`;

    if (d.hudPowerBar) {
      d.hudPowerBar.style.width = `${pct}%`;
      if (ratio < 0.33) {
        d.hudPowerBar.style.background = 'linear-gradient(90deg, #38bdf8, #06b6d4)';
      } else if (ratio < 0.70) {
        d.hudPowerBar.style.background = 'linear-gradient(90deg, #10b981, #eab308)';
      } else if (ratio < 0.95) {
        d.hudPowerBar.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
      } else {
        d.hudPowerBar.style.background = 'linear-gradient(90deg, #ef4444, #f43f5e)';
      }
    }

    if (d.hudPowerHint) {
      if (isCharging) {
        if (ratio >= 0.98) {
          d.hudPowerHint.innerHTML = '<span style="color: #f43f5e; font-weight: 800;">⚡ MAXIMUM POWER (50.0 m/s)! Lepaskan untuk melempar!</span>';
        } else {
          d.hudPowerHint.innerHTML = '<span style="color: #f59e0b; font-weight: 700;">⚡ Mengisi tenaga... Lepaskan untuk melempar!</span>';
        }
      } else {
        d.hudPowerHint.textContent = 'Tahan Klik Kiri / Spasi untuk Mengisi Tenaga • Lepaskan untuk Melempar';
      }
    }
  }
}
