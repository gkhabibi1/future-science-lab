import * as THREE from 'three';
import { getPositionAtTime, getVelocityAtTime } from './physics.js';

/**
 * Projectile Manager representing a stylized 3D Hammer thrown through the air,
 * built entirely with Three.js geometric primitives, along with its trajectory path,
 * ground landing marker, launch direction arrow, and dynamic velocity/gravity vectors.
 */
export class ProjectileHammer {
  /**
   * @param {THREE.Scene} scene - The Three.js scene to add elements to
   */
  constructor(scene) {
    this.scene = scene;
    this.analysis = null;
    this.trajectoryLine = null;
    this.landingMarker = null;
    this.launchPedestal = null;

    // Build the 3D Stylized Hammer with Root & Center-of-Mass Tumble Pivot
    this.hammerPivot = null;
    this.hammerGroup = this.createHammerMesh();
    this.scene.add(this.hammerGroup);

    // Build Landing Target Ring
    this.createLandingMarker();

    // Build Launch Pedestal
    this.createLaunchPedestal();

    // Vector visualizers are managed modularly by VectorVisualizer
    this.launchArrow = null;
    this.velocityArrow = null;
    this.gravityArrow = null;

    // Initial pitch offset
    this.initialPitchAngle = 0;
  }

  /**
   * Creates a recognizable, stylized craftsman hammer using Three.js primitives.
   * Scaled realistically relative to human height (0.7m length, ~0.26m head).
   * 
   * @returns {THREE.Group} Root group containing the tumble pivot
   */
  createHammerMesh() {
    const rootGroup = new THREE.Group();
    const pivot = new THREE.Group();

    // -------------------------------------------------------------
    // 1. Materials & Finishes
    // -------------------------------------------------------------
    const forgedSteelMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Slate dark steel
      metalness: 0.92,
      roughness: 0.28
    });

    const polishedSteelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Polished silver metal
      metalness: 0.96,
      roughness: 0.15
    });

    const woodHandleMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21, // Warm hardwood
      roughness: 0.55,
      metalness: 0.05
    });

    const rubberGripMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Matte black ergonomic grip
      roughness: 0.9,
      metalness: 0.1
    });

    const brassAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Polished brass accents
      metalness: 0.88,
      roughness: 0.25
    });

    // -------------------------------------------------------------
    // 2. Handle Construction (Length ~0.65m)
    // -------------------------------------------------------------
    const handleGroup = new THREE.Group();

    // Main Hardwood Shaft (Tapered Cylinder)
    const shaftGeo = new THREE.CylinderGeometry(0.018, 0.023, 0.35, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, woodHandleMat);
    shaftMesh.position.y = -0.05;
    shaftMesh.castShadow = true;
    handleGroup.add(shaftMesh);

    // Ergonomic Grip (Lower Section)
    const gripGeo = new THREE.CylinderGeometry(0.024, 0.026, 0.28, 16);
    const gripMesh = new THREE.Mesh(gripGeo, rubberGripMat);
    gripMesh.position.y = -0.32;
    gripMesh.castShadow = true;
    handleGroup.add(gripMesh);

    // Grip Ribs (Ring Ridges)
    for (let i = -0.42; i <= -0.22; i += 0.05) {
      const ribGeo = new THREE.TorusGeometry(0.025, 0.0025, 8, 24);
      const ribMesh = new THREE.Mesh(ribGeo, brassAccentMat);
      ribMesh.rotation.x = Math.PI / 2;
      ribMesh.position.y = i;
      handleGroup.add(ribMesh);
    }

    // Pommel Base (Metallic Butt Cap)
    const pommelGeo = new THREE.CylinderGeometry(0.027, 0.033, 0.04, 16);
    const pommelMesh = new THREE.Mesh(pommelGeo, polishedSteelMat);
    pommelMesh.position.y = -0.47;
    pommelMesh.castShadow = true;
    handleGroup.add(pommelMesh);

    // Pommel End Rounded Dome
    const domeGeo = new THREE.SphereGeometry(0.027, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMesh = new THREE.Mesh(domeGeo, brassAccentMat);
    domeMesh.rotation.x = Math.PI;
    domeMesh.position.y = -0.49;
    handleGroup.add(domeMesh);

    // Neck Collar / Ferrule (Joining Shaft to Head)
    const collarGeo = new THREE.CylinderGeometry(0.025, 0.020, 0.06, 16);
    const collarMesh = new THREE.Mesh(collarGeo, polishedSteelMat);
    collarMesh.position.y = 0.12;
    collarMesh.castShadow = true;
    handleGroup.add(collarMesh);

    // Brass Transition Ring at Collar Base
    const ringGeo = new THREE.TorusGeometry(0.023, 0.003, 8, 24);
    const ringMesh = new THREE.Mesh(ringGeo, brassAccentMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.09;
    handleGroup.add(ringMesh);

    // Protective Steel Langets (Side Straps)
    const langetGeo = new THREE.BoxGeometry(0.005, 0.12, 0.026);
    const langetLeft = new THREE.Mesh(langetGeo, forgedSteelMat);
    langetLeft.position.set(-0.016, 0.07, 0);
    handleGroup.add(langetLeft);

    const langetRight = new THREE.Mesh(langetGeo, forgedSteelMat);
    langetRight.position.set(0.016, 0.07, 0);
    handleGroup.add(langetRight);

    pivot.add(handleGroup);

    // -------------------------------------------------------------
    // 3. Metallic Hammer Head (Eye, Striking Face, and Claw)
    // -------------------------------------------------------------
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.17; // Position head near the top

    // Central Eye / Socket Block (Forged Steel)
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.075, 0.065);
    const eyeMesh = new THREE.Mesh(eyeGeo, forgedSteelMat);
    eyeMesh.castShadow = true;
    headGroup.add(eyeMesh);

    // Top Eye Wedge Pin
    const wedgeGeo = new THREE.BoxGeometry(0.024, 0.006, 0.016);
    const wedgeMesh = new THREE.Mesh(wedgeGeo, brassAccentMat);
    wedgeMesh.position.y = 0.04;
    headGroup.add(wedgeMesh);

    // --- Striking Face Section (+X direction) ---
    // Neck extension toward striking face
    const strikeNeckGeo = new THREE.CylinderGeometry(0.030, 0.033, 0.05, 16);
    const strikeNeck = new THREE.Mesh(strikeNeckGeo, forgedSteelMat);
    strikeNeck.rotation.z = -Math.PI / 2;
    strikeNeck.position.set(0.065, 0, 0);
    strikeNeck.castShadow = true;
    headGroup.add(strikeNeck);

    // Beveled Collar
    const strikeCollarGeo = new THREE.TorusGeometry(0.032, 0.004, 8, 24);
    const strikeCollar = new THREE.Mesh(strikeCollarGeo, brassAccentMat);
    strikeCollar.rotation.y = Math.PI / 2;
    strikeCollar.position.set(0.09, 0, 0);
    headGroup.add(strikeCollar);

    // Hardened Polished Striking Face
    const faceGeo = new THREE.CylinderGeometry(0.036, 0.034, 0.03, 16);
    const faceMesh = new THREE.Mesh(faceGeo, polishedSteelMat);
    faceMesh.rotation.z = -Math.PI / 2;
    faceMesh.position.set(0.105, 0, 0);
    faceMesh.castShadow = true;
    headGroup.add(faceMesh);

    // Striking Crown Dome (Slight Convex Crowning on Hammer Face)
    const crownGeo = new THREE.SphereGeometry(0.036, 16, 8, 0, Math.PI * 2, 0, Math.PI / 6);
    const crownMesh = new THREE.Mesh(crownGeo, polishedSteelMat);
    crownMesh.rotation.z = -Math.PI / 2;
    crownMesh.position.set(0.12, 0, 0);
    crownMesh.castShadow = true;
    headGroup.add(crownMesh);

    // --- Curved Split Claw Section (-X direction) ---
    // The curved claw sweeps backward and downward
    const clawRootGeo = new THREE.BoxGeometry(0.04, 0.06, 0.06);
    const clawRoot = new THREE.Mesh(clawRootGeo, forgedSteelMat);
    clawRoot.position.set(-0.055, -0.005, 0);
    clawRoot.castShadow = true;
    headGroup.add(clawRoot);

    // Upper & Lower Tines of the Claw (Left & Right with nail-puller slot)
    const tineGeo = new THREE.BoxGeometry(0.06, 0.016, 0.02);
    
    // Left Claw Tine
    const leftTine = new THREE.Mesh(tineGeo, polishedSteelMat);
    leftTine.position.set(-0.09, -0.02, 0.016);
    leftTine.rotation.z = Math.PI / 7; // Curved downward
    leftTine.rotation.y = -0.08;
    leftTine.castShadow = true;
    headGroup.add(leftTine);

    // Right Claw Tine
    const rightTine = new THREE.Mesh(tineGeo, polishedSteelMat);
    rightTine.position.set(-0.09, -0.02, -0.016);
    rightTine.rotation.z = Math.PI / 7; // Curved downward
    rightTine.rotation.y = 0.08;
    rightTine.castShadow = true;
    headGroup.add(rightTine);

    // Claw Curved Tips
    const tipGeo = new THREE.ConeGeometry(0.012, 0.04, 8);
    const leftTip = new THREE.Mesh(tipGeo, polishedSteelMat);
    leftTip.rotation.z = -Math.PI / 2.6;
    leftTip.position.set(-0.12, -0.035, 0.018);
    leftTip.castShadow = true;
    headGroup.add(leftTip);

    const rightTip = new THREE.Mesh(tipGeo, polishedSteelMat);
    rightTip.rotation.z = -Math.PI / 2.6;
    rightTip.position.set(-0.12, -0.035, -0.018);
    rightTip.castShadow = true;
    headGroup.add(rightTip);

    pivot.add(headGroup);

    // -------------------------------------------------------------
    // 4. Center of Mass Placement
    // -------------------------------------------------------------
    // Heavy head is at +0.17m, long handle extends to -0.49m.
    // The true center of gravity is near y = +0.06m.
    // Offsetting pivot so rotation happens precisely around Center of Mass:
    pivot.position.set(0, -0.06, 0);
    rootGroup.add(pivot);

    this.hammerPivot = pivot;
    return rootGroup;
  }

  /**
   * Creates an interactive 3D landing marker at the predicted landing position.
   * Includes:
   * 1. Circular ground target (bullseye disc, concentric rings, and crosshairs).
   * 2. Vertical marker / flagpole with golden finial and waving pennant flag.
   * 3. 3D Billboard text sprite displaying the predicted range (e.g. "🎯 R = 45.20 m").
   */
  createLandingMarker() {
    const markerGroup = new THREE.Group();

    // -------------------------------------------------------------
    // 1. Circular Ground Target
    // -------------------------------------------------------------
    const groundGroup = new THREE.Group();

    // Outer glow ring
    const outerRingGeo = new THREE.RingGeometry(0.85, 1.25, 48);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, // Neon Cyan
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.025;
    groundGroup.add(outerRing);

    // Inner target ring
    const innerRingGeo = new THREE.RingGeometry(0.35, 0.55, 36);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan Accent
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.028;
    groundGroup.add(innerRing);

    // Crosshairs
    const crossMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85
    });
    const crossPoints = [
      new THREE.Vector3(-1.6, 0.03, 0), new THREE.Vector3(1.6, 0.03, 0),
      new THREE.Vector3(0, 0.03, -1.6), new THREE.Vector3(0, 0.03, 1.6)
    ];
    const crossGeo = new THREE.BufferGeometry().setFromPoints(crossPoints);
    const crossLine = new THREE.LineSegments(crossGeo, crossMat);
    groundGroup.add(crossLine);

    // Center bullseye disc
    const dotGeo = new THREE.CircleGeometry(0.24, 32);
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e, // Crimson Red
      side: THREE.DoubleSide
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.rotation.x = -Math.PI / 2;
    dot.position.y = 0.032;
    groundGroup.add(dot);

    markerGroup.add(groundGroup);
    this.landingGroundRings = groundGroup;

    // -------------------------------------------------------------
    // 2. Vertical Marker & Pennant Flag
    // -------------------------------------------------------------
    const flagGroup = new THREE.Group();

    // Base collar mount
    const collarGeo = new THREE.CylinderGeometry(0.08, 0.14, 0.08, 16);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.3
    });
    const collar = new THREE.Mesh(collarGeo, collarMat);
    collar.position.y = 0.04;
    collar.castShadow = true;
    flagGroup.add(collar);

    // Vertical Flagpole Mast (Height: 2.8m)
    const poleHeight = 2.8;
    const poleGeo = new THREE.CylinderGeometry(0.022, 0.026, poleHeight, 16);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Metallic Chrome
      metalness: 0.92,
      roughness: 0.15
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = poleHeight / 2;
    pole.castShadow = true;
    flagGroup.add(pole);

    // Golden sphere finial on top of flagpole
    const finialGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const finialMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Gold Accent
      metalness: 0.95,
      roughness: 0.15
    });
    const finial = new THREE.Mesh(finialGeo, finialMat);
    finial.position.y = poleHeight + 0.05;
    finial.castShadow = true;
    flagGroup.add(finial);

    // Triangular Pennant Flag
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(0.85, 0.22);
    flagShape.lineTo(0, 0.44);
    flagShape.closePath();

    const flagGeo = new THREE.ShapeGeometry(flagShape);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Vibrant Crimson Red
      side: THREE.DoubleSide,
      roughness: 0.4
    });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(0.02, poleHeight - 0.48, 0);
    flagMesh.castShadow = true;
    flagGroup.add(flagMesh);
    this.pennantFlag = flagMesh;

    markerGroup.add(flagGroup);
    this.landingFlagGroup = flagGroup;

    // -------------------------------------------------------------
    // 3. Small Range Label Sprite (Billboard facing camera)
    // -------------------------------------------------------------
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        this.rangeCanvas = document.createElement('canvas');
        this.rangeCanvas.width = 512;
        this.rangeCanvas.height = 140;
        this.rangeCtx = this.rangeCanvas.getContext('2d');

        if (this.rangeCtx) {
          this.rangeTexture = new THREE.CanvasTexture(this.rangeCanvas);
          this.rangeTexture.minFilter = THREE.LinearFilter;
          this.rangeTexture.magFilter = THREE.LinearFilter;

          const spriteMat = new THREE.SpriteMaterial({
            map: this.rangeTexture,
            transparent: true,
            depthTest: false
          });
          this.rangeSprite = new THREE.Sprite(spriteMat);
          this.rangeSprite.scale.set(3.4, 0.95, 1.0);
          this.rangeSprite.position.set(0, poleHeight + 0.65, 0);
          markerGroup.add(this.rangeSprite);

          this.updateRangeLabel(0);
        }
      } catch (err) {
        // Safe fallback for headless tests without canvas context
      }
    }

    this.landingMarker = markerGroup;
    this.scene.add(this.landingMarker);
  }

  /**
   * Redraws the 3D billboard range label sprite with crisp typography.
   * @param {number} rangeMeters - Predicted or actual range in meters
   * @param {string} [labelPrefix='🎯 Predicted'] - Prefix tag (e.g. '🎯 Predicted' or '🏁 Landed')
   */
  updateRangeLabel(rangeMeters, labelPrefix = '🎯 Predicted') {
    if (!this.rangeCtx || !this.rangeTexture) return;

    const ctx = this.rangeCtx;
    const w = this.rangeCanvas.width;
    const h = this.rangeCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Draw rounded badge background
    const radius = 24;
    const pad = 8;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.95)';
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, radius);
    ctx.fill();
    ctx.stroke();

    // Subtle inner accent line
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Target Icon + Range Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '900 44px "Inter", -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${labelPrefix}: ${rangeMeters.toFixed(2)} m`, w / 2, h / 2 - 2);

    this.rangeTexture.needsUpdate = true;
  }

  /**
   * Pedestal representing the launch platform height.
   */
  createLaunchPedestal() {
    const pedestalGeo = new THREE.CylinderGeometry(0.5, 0.65, 1, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });
    this.launchPedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    this.launchPedestal.castShadow = true;
    this.launchPedestal.receiveShadow = true;
    this.scene.add(this.launchPedestal);
  }

  /**
   * Updates or generates the projectile trajectory line and 3D tube in the scene.
   * Uses exact physics calculations from launch origin to predicted landing point.
   * 
   * @param {Object} analysis - Analysis object from physics.analyzeProjectileMotion
   * @param {Array<{x: number, y: number, z: number}>} points - Sample points
   * @param {THREE.Vector3} [launchOrigin] - World position of release point
   */
  setTrajectory(analysis, points, launchOrigin) {
    this.analysis = analysis;

    // 1. Remove previous trajectory line and tube
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      this.trajectoryLine.geometry.dispose();
      this.trajectoryLine.material.dispose();
      this.trajectoryLine = null;
    }
    if (this.trajectoryTube) {
      this.scene.remove(this.trajectoryTube);
      this.trajectoryTube.geometry.dispose();
      this.trajectoryTube.material.dispose();
      this.trajectoryTube = null;
    }

    // 2. Build 3D Trajectory Curve
    const vectors = points.map(p => new THREE.Vector3(p.x, p.y, p.z));

    if (vectors.length >= 2) {
      // Primary Crisp Line
      const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
      const material = new THREE.LineBasicMaterial({
        color: 0xc084fc, // Vibrant Purple Neon
        transparent: true,
        opacity: 0.95
      });
      this.trajectoryLine = new THREE.Line(geometry, material);
      this.scene.add(this.trajectoryLine);

      // Glowing 3D Tube with physical thickness
      try {
        const sampleStride = Math.max(1, Math.floor(vectors.length / 16));
        const controlVectors = vectors.filter((_, i) => i % sampleStride === 0 || i === vectors.length - 1);
        const curve = new THREE.CatmullRomCurve3(controlVectors);
        const tubeSegments = Math.min(80, vectors.length * 2);
        const tubeGeo = new THREE.TubeGeometry(curve, tubeSegments, 0.035, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          transparent: true,
          opacity: 0.85
        });
        this.trajectoryTube = new THREE.Mesh(tubeGeo, tubeMat);
        this.scene.add(this.trajectoryTube);
      } catch (err) {
        // Fallback to line only if curve generation fails
      }
    }


    // 3. Update Landing Target Position, Flag & Range Label
    if (this.landingMarker && analysis.landingPos) {
      this.landingMarker.position.set(
        analysis.landingPos.x,
        analysis.landingPos.y,
        analysis.landingPos.z
      );
      this.landingMarker.visible = true;
      this.updateRangeLabel(analysis.horizontalRange, '🎯 Predicted');
    }

    // 4. Update Launch Pedestal
    if (this.launchPedestal) {
      this.launchPedestal.visible = false;
    }

    // 5. Update Launch Direction Vector Arrow
    this.updateLaunchArrow(launchOrigin);
  }

  /**
   * Updates the 3D Launch Direction Vector Arrow.
   * @param {THREE.Vector3} [launchOrigin]
   */
  updateLaunchArrow(launchOrigin) {
    if (!this.analysis || !this.launchArrow) return;
    const { initialVel, initialPos, v0 } = this.analysis;

    const origin = launchOrigin || new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z);
    this.launchArrow.position.copy(origin);

    const dir = new THREE.Vector3(initialVel.vx, initialVel.vy, initialVel.vz);
    const speed = dir.length();
    if (speed > 0.001) {
      dir.normalize();
      this.launchArrow.setDirection(dir);
    }

    // Length proportional to initial velocity
    const len = Math.min(6.5, Math.max(1.8, v0 * 0.14));
    this.launchArrow.setLength(len, len * 0.22, len * 0.12);
  }

  /**
   * Configures visuals for HOLDING state:
   * Displays the predicted parabolic trajectory and landing marker before launch!
   */
  setHoldingMode() {
    if (this.launchArrow) this.launchArrow.visible = false;
    if (this.velocityArrow) this.velocityArrow.visible = false;
    if (this.gravityArrow) this.gravityArrow.visible = false;
    if (this.trajectoryLine) this.trajectoryLine.visible = true;
    if (this.trajectoryTube) this.trajectoryTube.visible = true;
    if (this.landingMarker) this.landingMarker.visible = true;
  }

  /**
   * Configures visuals for AIMING / THROW MODE:
   * Displays launch direction arrow, trajectory curve, and predicted landing target.
   * @param {THREE.Vector3} [launchOrigin]
   */
  setAimMode(launchOrigin) {
    if (this.launchArrow) {
      this.updateLaunchArrow(launchOrigin);
      this.launchArrow.visible = true;
    }
    if (this.velocityArrow) this.velocityArrow.visible = false;
    if (this.gravityArrow) this.gravityArrow.visible = false;
    if (this.trajectoryLine) this.trajectoryLine.visible = true;
    if (this.trajectoryTube) this.trajectoryTube.visible = true;
    if (this.landingMarker) this.landingMarker.visible = true;
  }


  /**
   * Configures visuals for THROWING state:
   * Enables dynamic velocity vector and gravity vector.
   */
  setThrowingMode() {
    if (this.launchArrow) this.launchArrow.visible = false;
    if (this.velocityArrow) this.velocityArrow.visible = true;
    if (this.gravityArrow) this.gravityArrow.visible = true;
    if (this.trajectoryLine) this.trajectoryLine.visible = true;
    if (this.trajectoryTube) this.trajectoryTube.visible = true;
    if (this.landingMarker) this.landingMarker.visible = true;
  }

  /**
   * Configures visuals for LANDED state:
   * Freezes hammer at landing spot, hides flight vectors, keeps landing marker visible.
   */
  setLandedMode() {
    if (this.launchArrow) this.launchArrow.visible = false;
    if (this.velocityArrow) this.velocityArrow.visible = false;
    if (this.gravityArrow) this.gravityArrow.visible = false;
    if (this.trajectoryLine) this.trajectoryLine.visible = true;
    if (this.trajectoryTube) this.trajectoryTube.visible = true;
    if (this.landingMarker) this.landingMarker.visible = true;

    if (this.analysis && this.analysis.landingPos) {
      this.hammerGroup.position.set(
        this.analysis.landingPos.x,
        0.08,
        this.analysis.landingPos.z
      );
      if (this.hammerPivot) {
        this.hammerPivot.rotation.set(0, 0, -Math.PI / 2 + 0.12);
      }
      this.updateRangeLabel(this.analysis.horizontalRange, '🏁 Landed');
    }
  }

  /**
   * Resets hammer orientation and coordinates to launch state.
   */
  reset() {
    if (!this.analysis) return;
    const { initialPos, elevationAngleDeg, azimuthAngleDeg } = this.analysis;

    // Place at initial position
    this.hammerGroup.position.set(initialPos.x, initialPos.y, initialPos.z);

    // Orient toward launch direction
    const radAzimuth = (azimuthAngleDeg * Math.PI) / 180;
    const radElevation = (elevationAngleDeg * Math.PI) / 180;

    this.hammerGroup.rotation.set(0, -radAzimuth, 0);

    // Ready stance: hammer striking face angled upward along the launch vector
    this.initialPitchAngle = -radElevation + Math.PI / 4;
    if (this.hammerPivot) {
      this.hammerPivot.rotation.set(0, 0, this.initialPitchAngle);
    }

    if (this.velocityArrow) this.velocityArrow.visible = false;
    if (this.gravityArrow) this.gravityArrow.visible = false;
  }

  /**
   * Animates the hammer along the projectile trajectory with natural tumbling
   * and real-time velocity & gravity vector updates.
   * 
   * @param {number} currentTime - Elapsed simulation time (seconds)
   * @param {boolean} isSimulating - True if active throw in progress
   */
  update(currentTime, isSimulating) {
    if (!this.analysis) return;

    // Subtle wind wave animation on the landing marker's pennant flag
    if (this.pennantFlag) {
      this.pennantFlag.rotation.y = Math.sin(currentTime * 4.5) * 0.22;
    }

    const flightTime = this.analysis.flightTime;
    const t = Math.min(currentTime, flightTime);

    // Calculate position and velocity at time t from the independent physics engine
    const pos = getPositionAtTime(
      t,
      this.analysis.initialPos,
      this.analysis.initialVel,
      this.analysis.gravity
    );

    const vel = getVelocityAtTime(
      t,
      this.analysis.initialVel,
      this.analysis.gravity
    );

    // Set 3D position
    const groundClearance = 0.08;
    const currentY = Math.max(groundClearance, pos.y);
    this.hammerGroup.position.set(pos.x, currentY, pos.z);

    // Real-Time Dynamic Vectors during flight
    if (isSimulating && t < flightTime) {
      // 1. Instantaneous Velocity Vector v(t) (Emerald Green)
      if (this.velocityArrow) {
        this.velocityArrow.position.set(pos.x, currentY, pos.z);
        const vDir = new THREE.Vector3(vel.vx, vel.vy, vel.vz);
        const speed = vel.speed;
        if (speed > 0.01) {
          vDir.normalize();
          this.velocityArrow.setDirection(vDir);
          const vLen = Math.min(5.5, Math.max(1.2, speed * 0.13));
          this.velocityArrow.setLength(vLen, vLen * 0.22, vLen * 0.12);
        }
        this.velocityArrow.visible = true;
      }

      // 2. Gravity Acceleration Vector g (Crimson Red)
      if (this.gravityArrow) {
        this.gravityArrow.position.set(pos.x, currentY, pos.z);
        this.gravityArrow.setDirection(new THREE.Vector3(0, -1, 0));
        const gLen = Math.min(4.0, Math.max(1.0, this.analysis.gravity * 0.18));
        this.gravityArrow.setLength(gLen, gLen * 0.22, gLen * 0.12);
        this.gravityArrow.visible = true;
      }

      // Natural tumbling rotation around center of mass during flight
      if (this.hammerPivot) {
        const totalRotations = Math.max(1.5, flightTime * 1.8);
        const angularSpeed = (totalRotations * 2 * Math.PI) / flightTime;
        this.hammerPivot.rotation.z = this.initialPitchAngle - angularSpeed * t;
      }
    } else if (t >= flightTime) {
      // Landed state: Keep hammer at rest on ground
      this.setLandedMode();
    }
  }

  /**
   * Disposes all Three.js geometries, materials, and textures for ProjectileHammer.
   */
  dispose() {
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      if (this.trajectoryLine.geometry) this.trajectoryLine.geometry.dispose();
      if (this.trajectoryLine.material) this.trajectoryLine.material.dispose();
    }
    if (this.trajectoryTube) {
      this.scene.remove(this.trajectoryTube);
      if (this.trajectoryTube.geometry) this.trajectoryTube.geometry.dispose();
      if (this.trajectoryTube.material) this.trajectoryTube.material.dispose();
    }
    if (this.landingMarker) {
      this.scene.remove(this.landingMarker);
      this.landingMarker.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    }
    if (this.rangeTexture) this.rangeTexture.dispose();
    if (this.hammerGroup) {
      this.scene.remove(this.hammerGroup);
      this.hammerGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    }
    if (this.launchPedestal) {
      this.scene.remove(this.launchPedestal);
      if (this.launchPedestal.geometry) this.launchPedestal.geometry.dispose();
      if (this.launchPedestal.material) this.launchPedestal.material.dispose();
    }
  }
}
