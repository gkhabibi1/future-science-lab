import * as THREE from 'three';

/**
 * Educational Challenge Mode System for 3D Projectile Motion.
 * 
 * Features:
 * - 3D Target Marker with concentric scoring zones (Bullseye <=1.5m, Inner <=3.5m, Outer <=6.0m).
 * - Difficulty presets (Easy: 32m, Medium: 65m, Hard: 110m, Random).
 * - Real-time physics scoring, streak tracking, accuracy error computation, and educational feedback.
 * - Complete GPU memory disposal.
 */
export class ChallengeSystem {
  /**
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'ChallengeSystemGroup';
    this.scene.add(this.rootGroup);

    // Game state
    this.targetDistance = 65.0; // meters from launch platform
    this.targetAzimuthDeg = 0;   // along +X axis
    this.difficulty = 'medium';  // 'easy' | 'medium' | 'hard' | 'random'
    this.score = 0;
    this.attempts = 0;
    this.directHits = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.lastResult = null;

    // Build 3D visual target
    this.createTargetVisual();
    this.updateTargetPosition();

    // Default hidden until Challenge Mode is activated
    this.setVisible(false);
  }

  /**
   * Builds the 3D Target concentric rings and beacon flag.
   */
  createTargetVisual() {
    this.targetGroup = new THREE.Group();

    // 1. Concentric Ground Rings
    // Outer Ring (Radius 6.0m - Magenta)
    const outerGeo = new THREE.RingGeometry(5.8, 6.0, 64);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.rotation.x = -Math.PI / 2;
    outerMesh.position.y = 0.02;
    this.targetGroup.add(outerMesh);

    // Inner Ring (Radius 3.5m - Cyan)
    const innerGeo = new THREE.RingGeometry(3.35, 3.5, 64);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.rotation.x = -Math.PI / 2;
    innerMesh.position.y = 0.03;
    this.targetGroup.add(innerMesh);

    // Bullseye Ring (Radius 1.5m - Gold)
    const bullseyeGeo = new THREE.CircleGeometry(1.5, 48);
    const bullseyeMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88
    });
    const bullseyeMesh = new THREE.Mesh(bullseyeGeo, bullseyeMat);
    bullseyeMesh.rotation.x = -Math.PI / 2;
    bullseyeMesh.position.y = 0.04;
    this.targetGroup.add(bullseyeMesh);

    // Center White Bullseye Dot (Radius 0.35m)
    const centerDotGeo = new THREE.CircleGeometry(0.35, 32);
    const centerDotMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    const centerDotMesh = new THREE.Mesh(centerDotGeo, centerDotMat);
    centerDotMesh.rotation.x = -Math.PI / 2;
    centerDotMesh.position.y = 0.05;
    this.targetGroup.add(centerDotMesh);

    // 2. Vertical Target Beacon Flagpole
    const poleHeight = 4.2;
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, poleHeight, 16);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.9,
      roughness: 0.2
    });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = poleHeight / 2;
    this.targetGroup.add(pole);

    // Glowing Beacon Light / Finial
    const beaconGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = poleHeight + 0.1;
    this.targetGroup.add(beacon);

    // Target Pennant Flag
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(1.1, 0.28);
    flagShape.lineTo(0, 0.56);
    flagShape.closePath();

    const flagGeo = new THREE.ShapeGeometry(flagShape);
    const flagMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide
    });
    this.pennantFlag = new THREE.Mesh(flagGeo, flagMat);
    this.pennantFlag.position.set(0.04, poleHeight - 0.65, 0);
    this.targetGroup.add(this.pennantFlag);

    // 3. Dynamic Billboard Text Sprite
    if (typeof document !== 'undefined' && document.createElement) {
      try {
        this.labelCanvas = document.createElement('canvas');
        this.labelCanvas.width = 480;
        this.labelCanvas.height = 120;
        this.labelCtx = this.labelCanvas.getContext('2d');
        if (this.labelCtx) {
          this.labelTexture = new THREE.CanvasTexture(this.labelCanvas);
          const spriteMat = new THREE.SpriteMaterial({
            map: this.labelTexture,
            transparent: true,
            depthTest: false
          });
          this.labelSprite = new THREE.Sprite(spriteMat);
          this.labelSprite.scale.set(3.8, 0.95, 1.0);
          this.labelSprite.position.set(0, poleHeight + 0.8, 0);
          this.targetGroup.add(this.labelSprite);
        }
      } catch (err) {
        // Fallback for non-browser testing
      }
    }

    this.rootGroup.add(this.targetGroup);
  }

  /**
   * Sets target distance and updates 3D position and billboard label.
   * @param {number} distanceMeters
   * @param {number} [azimuthDeg=0]
   */
  setTarget(distanceMeters, azimuthDeg = 0) {
    this.targetDistance = Math.max(10, Math.min(250, distanceMeters));
    this.targetAzimuthDeg = azimuthDeg;
    this.updateTargetPosition();
    this.updateLabel();
  }

  /**
   * Selects difficulty preset.
   * @param {'easy'|'medium'|'hard'|'random'} difficulty
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    let dist = 65.0;
    if (difficulty === 'easy') dist = 32.0;
    else if (difficulty === 'medium') dist = 65.0;
    else if (difficulty === 'hard') dist = 110.0;
    else if (difficulty === 'random') {
      dist = Math.round(20 + Math.random() * 110);
    }
    this.setTarget(dist, 0);
  }

  /**
   * Repositions the 3D target mesh on the ground plane.
   */
  updateTargetPosition() {
    if (!this.targetGroup) return;
    const rad = (this.targetAzimuthDeg * Math.PI) / 180;
    const x = this.targetDistance * Math.cos(rad);
    const z = this.targetDistance * Math.sin(rad);
    this.targetGroup.position.set(x, 0, z);
  }

  /**
   * Updates billboard canvas sprite label.
   */
  updateLabel() {
    if (!this.labelCtx || !this.labelTexture) return;
    const ctx = this.labelCtx;
    const w = this.labelCanvas.width;
    const h = this.labelCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Pill container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.95)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(6, 6, w - 12, h - 12, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 38px "Inter", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`🎯 TARGET: ${this.targetDistance.toFixed(1)} m`, w / 2, h / 2);

    this.labelTexture.needsUpdate = true;
  }

  /**
   * Evaluates landing accuracy against current target.
   * 
   * @param {{ x: number, y: number, z: number }} actualLandingPos
   * @param {{ x: number, y: number, z: number }} launchPos
   * @param {Object} currentAnalysis
   * @returns {Object} Evaluation report
   */
  evaluateHit(actualLandingPos, launchPos, currentAnalysis) {
    this.attempts++;

    // Compute actual horizontal range from launch platform
    const dx = actualLandingPos.x - launchPos.x;
    const dz = actualLandingPos.z - launchPos.z;
    const actualRange = Math.sqrt(dx * dx + dz * dz);

    const errorDist = Math.abs(actualRange - this.targetDistance);
    const diffSigned = actualRange - this.targetDistance; // >0 overshot, <0 undershot

    let zone = 'miss';
    let points = 0;
    let stars = 0;
    let feedback = '';

    if (errorDist <= 1.5) {
      zone = 'bullseye';
      points = 100;
      stars = 3;
      this.directHits++;
      this.streak++;
      feedback = '🌟 BULLSEYE! Direct hit on target center! Perfect calculations!';
    } else if (errorDist <= 3.5) {
      zone = 'great';
      points = 50;
      stars = 2;
      this.streak++;
      feedback = '🎯 GREAT HIT! Inside the inner ring! Very close to center!';
    } else if (errorDist <= 6.0) {
      zone = 'close';
      points = 25;
      stars = 1;
      this.streak++;
      feedback = '👍 NEAR HIT! On target edge. Fine-tune launch velocity or angle!';
    } else {
      zone = 'miss';
      points = 0;
      stars = 0;
      this.streak = 0;
      if (diffSigned > 0) {
        feedback = `❌ OVERSHOT by ${diffSigned.toFixed(1)}m. Try lowering launch angle θ or initial velocity v₀.`;
      } else {
        feedback = `❌ UNDERSHOT by ${Math.abs(diffSigned).toFixed(1)}m. Increase velocity v₀ or angle towards 45°.`;
      }
    }

    if (this.streak > this.bestStreak) {
      this.bestStreak = this.streak;
    }
    this.score += points;

    this.lastResult = {
      actualRange,
      targetDistance: this.targetDistance,
      errorDist,
      diffSigned,
      zone,
      points,
      stars,
      feedback,
      score: this.score,
      attempts: this.attempts,
      streak: this.streak,
      bestStreak: this.bestStreak
    };

    return this.lastResult;
  }

  /**
   * Resets score and attempts statistics.
   */
  resetStats() {
    this.score = 0;
    this.attempts = 0;
    this.directHits = 0;
    this.streak = 0;
    this.lastResult = null;
  }

  /**
   * Sets visibility of target marker in scene.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this.rootGroup.visible = visible;
  }

  /**
   * Per-frame animation for pennant flag.
   * @param {number} timeSec
   */
  update(timeSec) {
    if (this.pennantFlag && this.rootGroup.visible) {
      this.pennantFlag.rotation.y = Math.sin(timeSec * 4.0) * 0.25;
    }
  }

  /**
   * Cleans up all Three.js resources.
   */
  dispose() {
    this.scene.remove(this.rootGroup);
    this.targetGroup.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    if (this.labelTexture) this.labelTexture.dispose();
  }
}
