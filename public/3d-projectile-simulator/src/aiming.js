import * as THREE from 'three';

/**
 * 3D Intuitive Aiming System for 3D Projectile Motion Simulator.
 * Provides interactive visual indicators around the player character during THROW MODE:
 * 1. Horizontal Direction Indicator (Azimuth Compass Ground Ring)
 * 2. Vertical Elevation Indicator (Protractor Arc aligned with throw plane)
 * 3. Visible 3D Aiming Arrow extending from release point
 * 4. Initial Velocity Vector (proportional to v0)
 */
export class AimingSystem {
  /**
   * @param {THREE.Scene} scene - The 3D scene
   */
  constructor(scene) {
    this.scene = scene;
    this.visible = false;

    // Root container group
    this.rootGroup = new THREE.Group();
    this.rootGroup.visible = false;
    this.scene.add(this.rootGroup);

    // 1. Build Horizontal Direction Indicator (Ground Azimuth Ring)
    this.horizontalGroup = this.createHorizontalIndicator();
    this.rootGroup.add(this.horizontalGroup);

    // 2. Build Vertical Elevation Indicator (Elevation Protractor Arc)
    this.verticalGroup = this.createVerticalElevationIndicator();
    this.rootGroup.add(this.verticalGroup);

    // 3. Build Aiming Direction Arrow
    this.aimArrow = this.createAimingArrow();
    this.rootGroup.add(this.aimArrow);

    // 4. Build Initial Velocity Power Vector
    this.velocityArrow = this.createVelocityPowerVector();
    this.rootGroup.add(this.velocityArrow);
  }

  /**
   * Creates the horizontal direction indicator on the ground (Azimuth compass ring).
   * @returns {THREE.Group}
   */
  createHorizontalIndicator() {
    const group = new THREE.Group();
    group.position.y = 0.03; // Just above ground

    // Main Outer Circular Compass Ring (Radius 2.2m)
    const ringGeo = new THREE.RingGeometry(2.12, 2.26, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Electric cyan
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    // Inner subtle ring
    const innerRingGeo = new THREE.RingGeometry(1.6, 1.64, 48);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    group.add(innerRing);

    // Cardinal Direction Spoke Ticks (0° East/+X, 90° South/+Z, 180° West/-X, 270° North/-Z)
    const spokeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75
    });

    const spokePoints = [
      // Major axes
      new THREE.Vector3(1.6, 0.005, 0), new THREE.Vector3(2.35, 0.005, 0),     // 0° (+X)
      new THREE.Vector3(-1.6, 0.005, 0), new THREE.Vector3(-2.35, 0.005, 0),   // 180° (-X)
      new THREE.Vector3(0, 0.005, 1.6), new THREE.Vector3(0, 0.005, 2.35),     // 90° (+Z)
      new THREE.Vector3(0, 0.005, -1.6), new THREE.Vector3(0, 0.005, -2.35),   // 270° (-Z)
      // 45° Minor axes
      new THREE.Vector3(1.15, 0.005, 1.15), new THREE.Vector3(1.58, 0.005, 1.58),
      new THREE.Vector3(-1.15, 0.005, 1.15), new THREE.Vector3(-1.58, 0.005, 1.58),
      new THREE.Vector3(1.15, 0.005, -1.15), new THREE.Vector3(1.58, 0.005, -1.58),
      new THREE.Vector3(-1.15, 0.005, -1.15), new THREE.Vector3(-1.58, 0.005, -1.58),
    ];
    const spokeGeo = new THREE.BufferGeometry().setFromPoints(spokePoints);
    const spokes = new THREE.LineSegments(spokeGeo, spokeMat);
    group.add(spokes);

    // Rotating Direction Pointer Arrow on the ground
    this.azimuthPointer = new THREE.Group();

    // Arrow shaft on ground
    const shaftGeo = new THREE.PlaneGeometry(1.9, 0.08);
    const pointerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const shaft = new THREE.Mesh(shaftGeo, pointerMat);
    shaft.rotation.x = -Math.PI / 2;
    shaft.position.x = 0.95; // Extends in +X direction initially
    this.azimuthPointer.add(shaft);

    // Arrow head (Chevron/Triangle on ground)
    const headGeo = new THREE.ConeGeometry(0.24, 0.55, 3);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.rotation.x = -Math.PI / 2;
    head.rotation.z = -Math.PI / 2; // Pointing along +X
    head.position.set(2.05, 0.01, 0);
    this.azimuthPointer.add(head);

    group.add(this.azimuthPointer);
    return group;
  }

  /**
   * Creates the 3D Vertical Elevation Indicator (Protractor Arc).
   * Aligned with the current throw plane and centered at release height.
   * @returns {THREE.Group}
   */
  createVerticalElevationIndicator() {
    const group = new THREE.Group();

    // 1. Horizontal Reference Baseline (0° elevation line)
    const baseMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.15,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.7
    });
    const basePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(2.4, 0, 0)
    ];
    const baseGeo = new THREE.BufferGeometry().setFromPoints(basePoints);
    const baseLine = new THREE.Line(baseGeo, baseMat);
    baseLine.computeLineDistances();
    group.add(baseLine);

    // 2. Full Protractor Guide Arc (5° to 85° outline)
    const arcRadius = 1.8; // meters
    const guidePoints = [];
    for (let deg = 5; deg <= 85; deg += 2) {
      const rad = (deg * Math.PI) / 180;
      guidePoints.push(new THREE.Vector3(
        arcRadius * Math.cos(rad),
        arcRadius * Math.sin(rad),
        0
      ));
    }
    const guideGeo = new THREE.BufferGeometry().setFromPoints(guidePoints);
    const guideMat = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.5
    });
    const guideArc = new THREE.Line(guideGeo, guideMat);
    group.add(guideArc);

    // 3. Elevation Ticks (15°, 30°, 45°, 60°, 75°)
    const tickMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85
    });
    const tickPoints = [];
    [15, 30, 45, 60, 75].forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      const rInner = arcRadius - 0.15;
      const rOuter = arcRadius + 0.15;
      tickPoints.push(
        new THREE.Vector3(rInner * Math.cos(rad), rInner * Math.sin(rad), 0),
        new THREE.Vector3(rOuter * Math.cos(rad), rOuter * Math.sin(rad), 0)
      );
    });
    const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPoints);
    const ticks = new THREE.LineSegments(tickGeo, tickMat);
    group.add(ticks);

    // 4. Dynamic Active Elevation Arc (fills from 0° to current θ)
    this.activeArcMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b, // Vibrant Gold / Amber
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });
    this.maxArcVertices = 80;
    this.arcPositions = new Float32Array(this.maxArcVertices * 3);
    this.activeArcGeo = new THREE.BufferGeometry();
    this.activeArcGeo.setAttribute('position', new THREE.BufferAttribute(this.arcPositions, 3));
    this.activeArcGeo.setDrawRange(0, 0);
    this.activeArc = new THREE.Line(this.activeArcGeo, this.activeArcMat);
    group.add(this.activeArc);

    // 5. Dynamic Radial Needle pointing at current θ
    this.elevationNeedleMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });
    this.needlePositions = new Float32Array(6);
    this.needleGeo = new THREE.BufferGeometry();
    this.needleGeo.setAttribute('position', new THREE.BufferAttribute(this.needlePositions, 3));
    this.elevationNeedle = new THREE.Line(this.needleGeo, this.elevationNeedleMat);
    group.add(this.elevationNeedle);

    // 6. Needle Pointer Tip Dot
    const dotGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.needleTipDot = new THREE.Mesh(dotGeo, dotMat);
    group.add(this.needleTipDot);

    // Reusable internal vectors for zero allocation
    this._dir3D = new THREE.Vector3();
    this._origin = new THREE.Vector3();

    return group;
  }

  /**
   * Creates the primary 3D Aiming Arrow extending from the release point.
   * @returns {THREE.ArrowHelper}
   */
  createAimingArrow() {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      3.2,
      0x38bdf8,
      0.65,
      0.35
    );
    return arrow;
  }

  /**
   * Creates the Initial Velocity Power Vector representing v0.
   * Length dynamically scales with velocity magnitude (1 to 50 m/s).
   * @returns {THREE.ArrowHelper}
   */
  createVelocityPowerVector() {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      4.5,
      0x10b981, // Emerald Green
      0.75,
      0.4
    );
    return arrow;
  }

  /**
   * Updates all aiming indicators in real time based on player position,
   * launch origin, azimuth, elevation, and initial velocity.
   * 
   * @param {THREE.Vector3} playerPosition - Player ground coordinates
   * @param {THREE.Vector3} releaseOrigin - Hand release position
   * @param {number} azimuthDeg - Horizontal azimuth angle (0° to 360°)
   * @param {number} elevationDeg - Vertical elevation angle (5° to 85°)
   * @param {number} v0 - Initial launch velocity (1 to 50 m/s)
   */
  update(playerPosition, releaseOrigin, azimuthDeg, elevationDeg, v0) {
    if (!this.visible) return;

    const radAzimuth = (azimuthDeg * Math.PI) / 180;
    const radElevation = (elevationDeg * Math.PI) / 180;

    // 1. Update Horizontal Direction Indicator (At Player's Feet)
    if (playerPosition) {
      this.horizontalGroup.position.set(playerPosition.x, 0.03, playerPosition.z);
    }
    // Azimuth rotation: 0° is +X, 90° is +Z (rotation around Y is -radAzimuth)
    if (this.azimuthPointer) {
      this.azimuthPointer.rotation.y = -radAzimuth;
    }

    // 2. Update Vertical Elevation Indicator (At Release Shoulder)
    const origin = releaseOrigin ? this._origin.copy(releaseOrigin) : (playerPosition ? this._origin.set(playerPosition.x, 1.5, playerPosition.z) : this._origin.set(0, 1.5, 0));
    this.verticalGroup.position.copy(origin);
    this.verticalGroup.rotation.y = -radAzimuth; // Align protractor plane with launch azimuth

    // Rebuild active elevation arc from 0° to θ in preallocated buffer
    const arcRadius = 1.8;
    const step = 1.5;
    let vIdx = 0;
    for (let a = 0; a <= elevationDeg && vIdx < (this.maxArcVertices - 1) * 3; a += step) {
      const r = (a * Math.PI) / 180;
      this.arcPositions[vIdx++] = arcRadius * Math.cos(r);
      this.arcPositions[vIdx++] = arcRadius * Math.sin(r);
      this.arcPositions[vIdx++] = 0;
    }
    // Ensure final point reaches exact θ
    this.arcPositions[vIdx++] = arcRadius * Math.cos(radElevation);
    this.arcPositions[vIdx++] = arcRadius * Math.sin(radElevation);
    this.arcPositions[vIdx++] = 0;

    const vertexCount = vIdx / 3;
    this.activeArcGeo.setDrawRange(0, vertexCount);
    this.activeArcGeo.attributes.position.needsUpdate = true;

    // Update needle line in preallocated buffer
    this.needlePositions[0] = 0;
    this.needlePositions[1] = 0;
    this.needlePositions[2] = 0;
    this.needlePositions[3] = (arcRadius + 0.12) * Math.cos(radElevation);
    this.needlePositions[4] = (arcRadius + 0.12) * Math.sin(radElevation);
    this.needlePositions[5] = 0;
    this.needleGeo.attributes.position.needsUpdate = true;

    if (this.needleTipDot) {
      this.needleTipDot.position.set(
        (arcRadius + 0.12) * Math.cos(radElevation),
        (arcRadius + 0.12) * Math.sin(radElevation),
        0
      );
    }

    // 3. Update 3D Aiming Arrow & Velocity Vector
    // Calculate 3D unit launch direction vector without allocation
    this._dir3D.set(
      Math.cos(radElevation) * Math.cos(radAzimuth),
      Math.sin(radElevation),
      Math.cos(radElevation) * Math.sin(radAzimuth)
    ).normalize();

    // Aiming arrow extending from player hand
    this.aimArrow.position.copy(origin);
    this.aimArrow.setDirection(this._dir3D);
    this.aimArrow.setLength(3.2, 0.65, 0.35);

    // Initial Velocity Vector (scales directly with v0: 1 to 50 m/s)
    this.velocityArrow.position.copy(origin);
    this.velocityArrow.setDirection(this._dir3D);
    // Scale length from 1.8m (at 1 m/s) up to 7.0m (at 50 m/s)
    const vLen = 1.8 + (v0 / 50) * 5.2;
    this.velocityArrow.setLength(vLen, vLen * 0.18, vLen * 0.09);
  }

  /**
   * Sets visibility of the entire 3D aiming indicator system.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this.visible = visible;
    this.rootGroup.visible = visible;
  }

  /**
   * Cleanup Three.js geometries and materials.
   */
  dispose() {
    this.scene.remove(this.rootGroup);
    this.rootGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }
}
