import * as THREE from 'three';
import {
  analyzeProjectileMotion,
  generateTrajectoryPoints,
  getPositionAtTime
} from './physics.js';

/**
 * Educational Experiment Visualizer for Three.js.
 * 
 * Manages simultaneous multi-trajectory 3D rendering for scientific comparisons:
 * 1. Effect of Launch Angle (e.g. 15°, 30°, 45°, 60°, 75°)
 * 2. Effect of Initial Velocity (e.g. 10, 20, 30, 40, 50 m/s)
 * 3. Effect of Gravity (e.g. Moon, Mars, Earth, Jupiter)
 * 
 * Includes:
 * - Color-coded 3D lines and volumetric glowing tubes
 * - Peak altitude (apex) markers
 * - Landing target ground rings
 * - 3D billboard labels with analytical (R, H_max) readouts
 * - Simultaneous multi-projectile flight race animation
 */
export class ExperimentVisualizer {
  /**
   * @param {THREE.Scene} scene - Three.js scene
   */
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'ExperimentVisualizerGroup';
    this.rootGroup.visible = false;
    this.scene.add(this.rootGroup);

    // Active visual objects list for disposal
    this.trajectoryMeshes = [];
    this.landingMarkers = [];
    this.apexMarkers = [];
    this.labelSprites = [];
    this.raceProjectiles = [];

    // Race animation state
    this.isRacing = false;
    this.raceTime = 0;
    this.maxRaceTime = 0;
    this.activeAnalyses = [];

    // Reusable Color Palette for Multi-Trajectory comparison
    this.palette = [
      { hex: 0xf43f5e, css: '#f43f5e', name: 'Rose / Red' },
      { hex: 0xf59e0b, css: '#f59e0b', name: 'Amber / Orange' },
      { hex: 0x10b981, css: '#10b981', name: 'Emerald / Green' },
      { hex: 0x06b6d4, css: '#06b6d4', name: 'Cyan / Blue' },
      { hex: 0x8b5cf6, css: '#8b5cf6', name: 'Purple / Violet' },
      { hex: 0xec4899, css: '#ec4899', name: 'Pink' }
    ];

    // Shared sphere geometry for race runners
    this.sharedSphereGeo = new THREE.SphereGeometry(0.24, 16, 16);
    this.sharedApexGeo = new THREE.SphereGeometry(0.12, 12, 12);
  }

  /**
   * Sets visibility of experiment 3D visualizations.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this.rootGroup.visible = visible;
    if (!visible) {
      this.stopRace();
    }
  }

  /**
   * Cleans up and disposes all current 3D experiment objects to prevent memory leaks.
   */
  clear() {
    this.stopRace();

    // Dispose trajectory lines and tubes
    this.trajectoryMeshes.forEach(mesh => {
      this.rootGroup.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) mesh.material.forEach(m => m.dispose());
        else mesh.material.dispose();
      }
    });
    this.trajectoryMeshes = [];

    // Dispose landing target rings
    this.landingMarkers.forEach(group => {
      this.rootGroup.remove(group);
      group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    });
    this.landingMarkers = [];

    // Dispose apex markers
    this.apexMarkers.forEach(group => {
      this.rootGroup.remove(group);
      group.traverse(obj => {
        if (obj.geometry && obj.geometry !== this.sharedApexGeo) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    });
    this.apexMarkers = [];

    // Dispose billboard sprites
    this.labelSprites.forEach(sprite => {
      this.rootGroup.remove(sprite);
      if (sprite.material) {
        if (sprite.material.map) sprite.material.map.dispose();
        sprite.material.dispose();
      }
    });
    this.labelSprites = [];

    // Dispose race projectiles
    this.raceProjectiles.forEach(mesh => {
      this.rootGroup.remove(mesh);
      if (mesh.material) mesh.material.dispose();
    });
    this.raceProjectiles = [];
    this.activeAnalyses = [];
  }

  /**
   * Renders multiple projectile trajectories simultaneously for comparison.
   * 
   * @param {Array<Object>} trajectoriesConfig - Array of config objects for physics analysis
   * @param {THREE.Vector3} [launchOrigin] - World launch coordinate
   * @returns {Array<Object>} Computed analyses array for UI table display
   */
  renderTrajectories(trajectoriesConfig, launchOrigin = new THREE.Vector3(0, 1.5, 0)) {
    this.clear();
    const analyses = [];

    let overallMaxFlightTime = 0;

    trajectoriesConfig.forEach((cfg, index) => {
      const colorInfo = this.palette[index % this.palette.length];

      // 1. Calculate analytical physics
      const analysis = analyzeProjectileMotion({
        initialPos: { x: launchOrigin.x, y: launchOrigin.y, z: launchOrigin.z },
        v0: cfg.v0,
        elevationAngleDeg: cfg.elevationAngleDeg,
        azimuthAngleDeg: cfg.azimuthAngleDeg || 0,
        gravity: cfg.gravity || 9.81,
        groundY: 0
      });

      analysis.color = colorInfo.css;
      analysis.colorHex = colorInfo.hex;
      analysis.label = cfg.label || `Case ${index + 1}`;
      analysis.paramValue = cfg.paramValue;
      analyses.push(analysis);

      if (analysis.flightTime > overallMaxFlightTime) {
        overallMaxFlightTime = analysis.flightTime;
      }

      // 2. Generate 3D Trajectory Curve
      const points = generateTrajectoryPoints(analysis, 80);
      const vectors = points.map(p => new THREE.Vector3(p.x, p.y, p.z));

      if (vectors.length >= 2) {
        // Line
        const lineGeo = new THREE.BufferGeometry().setFromPoints(vectors);
        const lineMat = new THREE.LineBasicMaterial({
          color: colorInfo.hex,
          transparent: true,
          opacity: 0.95,
          linewidth: 2
        });
        const lineMesh = new THREE.Line(lineGeo, lineMat);
        this.rootGroup.add(lineMesh);
        this.trajectoryMeshes.push(lineMesh);

        // Volumetric glowing tube
        try {
          const sampleStride = Math.max(1, Math.floor(vectors.length / 16));
          const controlVectors = vectors.filter((_, i) => i % sampleStride === 0 || i === vectors.length - 1);
          const curve = new THREE.CatmullRomCurve3(controlVectors);
          const tubeGeo = new THREE.TubeGeometry(curve, 60, 0.024, 6, false);
          const tubeMat = new THREE.MeshBasicMaterial({
            color: colorInfo.hex,
            transparent: true,
            opacity: 0.70
          });
          const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
          this.rootGroup.add(tubeMesh);
          this.trajectoryMeshes.push(tubeMesh);
        } catch (e) {
          // Fallback line
        }
      }

      // 3. Peak Altitude (Apex) Marker
      const tApex = analysis.timeToPeak;
      const apexPos = getPositionAtTime(tApex, analysis.initialPos, analysis.initialVel, analysis.gravity);

      const apexGroup = new THREE.Group();
      // Glowing sphere at apex
      const apexMat = new THREE.MeshBasicMaterial({ color: colorInfo.hex });
      const apexMesh = new THREE.Mesh(this.sharedApexGeo, apexMat);
      apexMesh.position.set(apexPos.x, apexPos.y, apexPos.z);
      apexGroup.add(apexMesh);

      // Vertical guideline drop down to ground
      const dropPoints = [
        new THREE.Vector3(apexPos.x, apexPos.y, apexPos.z),
        new THREE.Vector3(apexPos.x, 0.02, apexPos.z)
      ];
      const dropGeo = new THREE.BufferGeometry().setFromPoints(dropPoints);
      const dropMat = new THREE.LineDashedMaterial({
        color: colorInfo.hex,
        dashSize: 0.25,
        gapSize: 0.15,
        transparent: true,
        opacity: 0.65
      });
      const dropLine = new THREE.Line(dropGeo, dropMat);
      dropLine.computeLineDistances();
      apexGroup.add(dropLine);

      this.rootGroup.add(apexGroup);
      this.apexMarkers.push(apexGroup);

      // 4. Ground Landing Target Ring
      if (analysis.landingPos) {
        const ringGroup = new THREE.Group();
        ringGroup.position.set(analysis.landingPos.x, 0.02, analysis.landingPos.z);

        const ringGeo = new THREE.RingGeometry(0.35, 0.55, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: colorInfo.hex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringGroup.add(ringMesh);

        // Center dot
        const dotGeo = new THREE.CircleGeometry(0.12, 16);
        const dotMesh = new THREE.Mesh(dotGeo, ringMat);
        dotMesh.rotation.x = -Math.PI / 2;
        dotMesh.position.y = 0.002;
        ringGroup.add(dotMesh);

        this.rootGroup.add(ringGroup);
        this.landingMarkers.push(ringGroup);

        // 5. 3D Billboard Sprite Label at Landing Spot
        const sprite = this.createBillboardLabel(
          colorInfo.css,
          `${analysis.label}: R=${analysis.horizontalRange.toFixed(1)}m, H=${analysis.maxHeight.toFixed(1)}m`
        );
        if (sprite) {
          sprite.position.set(analysis.landingPos.x, 1.2, analysis.landingPos.z);
          this.rootGroup.add(sprite);
          this.labelSprites.push(sprite);
        }
      }

      // 6. Create Race Projectile Sphere
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colorInfo.hex,
        roughness: 0.3,
        metalness: 0.8,
        emissive: colorInfo.hex,
        emissiveIntensity: 0.35
      });
      const sphere = new THREE.Mesh(this.sharedSphereGeo, sphereMat);
      sphere.position.copy(launchOrigin);
      sphere.visible = false;
      this.rootGroup.add(sphere);
      this.raceProjectiles.push(sphere);
    });

    this.activeAnalyses = analyses;
    this.maxRaceTime = overallMaxFlightTime;
    this.rootGroup.visible = true;

    return analyses;
  }

  /**
   * Generates a 3D billboard sprite for text labels.
   * @param {string} colorCss
   * @param {string} text
   * @returns {THREE.Sprite|null}
   */
  createBillboardLabel(colorCss, text) {
    if (typeof document === 'undefined' || !document.createElement) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 440;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Dark card background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.beginPath();
      ctx.roundRect(4, 4, 432, 72, 14);
      ctx.fill();

      // Border with color
      ctx.strokeStyle = colorCss;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Text
      ctx.font = 'bold 26px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 220, 40);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(2.8, 0.52, 1.0);
      return sprite;
    } catch (e) {
      return null;
    }
  }

  /**
   * Starts simultaneous flight race of all comparison projectiles.
   */
  startRace() {
    if (this.activeAnalyses.length === 0) return;
    this.isRacing = true;
    this.raceTime = 0;
    this.raceProjectiles.forEach((p, i) => {
      const a = this.activeAnalyses[i];
      if (a) {
        p.position.set(a.initialPos.x, a.initialPos.y, a.initialPos.z);
        p.visible = true;
      }
    });
  }

  /**
   * Stops active flight race.
   */
  stopRace() {
    this.isRacing = false;
    this.raceTime = 0;
    this.raceProjectiles.forEach(p => {
      p.visible = false;
    });
  }

  /**
   * Per-frame animation update for multi-projectile comparison race.
   * @param {number} dt - Elapsed frame delta time
   * @param {Function} [onProgress] - Optional callback with race progress
   */
  update(dt, onProgress) {
    if (!this.isRacing || this.activeAnalyses.length === 0) return;

    this.raceTime += dt;
    let allFinished = true;

    this.raceProjectiles.forEach((proj, i) => {
      const a = this.activeAnalyses[i];
      if (!a) return;

      const t = Math.min(this.raceTime, a.flightTime);
      if (this.raceTime < a.flightTime) {
        allFinished = false;
      }

      const pos = getPositionAtTime(t, a.initialPos, a.initialVel, a.gravity);
      const groundY = 0.12;
      proj.position.set(pos.x, Math.max(groundY, pos.y), pos.z);
    });

    if (onProgress) {
      onProgress(this.raceTime, this.maxRaceTime);
    }

    if (allFinished && this.raceTime >= this.maxRaceTime + 1.2) {
      // Keep completed runners on ground
      this.isRacing = false;
    }
  }

  /**
   * Clean up all assets.
   */
  dispose() {
    this.clear();
    this.scene.remove(this.rootGroup);
    if (this.sharedSphereGeo) this.sharedSphereGeo.dispose();
    if (this.sharedApexGeo) this.sharedApexGeo.dispose();
  }
}
