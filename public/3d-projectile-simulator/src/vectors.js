import * as THREE from 'three';

/**
 * Visual Projectile Vector System for Three.js.
 * 
 * Manages 5 physics vectors starting directly from the hammer position:
 * 1. Initial Velocity Vector (v0) - Cyan (#06b6d4)
 * 2. Current Velocity Vector (v) - Emerald Green (#10b981)
 * 3. Gravity Acceleration Vector (g) - Crimson Red (#f43f5e)
 * 4. Horizontal Velocity Component (v_h) - Electric Amber (#f59e0b)
 * 5. Vertical Velocity Component (v_y) - Vivid Violet (#a855f7)
 * 
 * Features:
 * - Proportional arrow lengths scaled to physical magnitudes.
 * - Dynamic flight updates every animation frame.
 * - 3D billboard sprite badges displaying vector name and numeric magnitude.
 * - Master visibility toggle ("Show Vectors").
 */
export class VectorVisualizer {
  /**
   * @param {THREE.Scene} scene - The Three.js scene
   */
  constructor(scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'VectorVisualizerGroup';
    this.scene.add(this.rootGroup);

    // Master visibility switch (controlled by UI "Show Vectors" toggle)
    this.masterVisible = true;
    this.currentState = 'HOLDING';

    // Color Palette
    this.colors = {
      v0: 0x06b6d4, // Cyan
      v: 0x10b981,  // Emerald Green
      g: 0xf43f5e,  // Crimson Red
      vh: 0xf59e0b, // Electric Amber
      vy: 0xa855f7  // Vivid Violet
    };

    // 1. Create Arrow Helpers
    this.arrows = {
      v0: this.createArrow(this.colors.v0),
      v: this.createArrow(this.colors.v),
      g: this.createArrow(this.colors.g),
      vh: this.createArrow(this.colors.vh),
      vy: this.createArrow(this.colors.vy)
    };

    // 2. Create Dynamic 3D Billboard Sprite Labels
    this.labels = {
      v0: this.createLabelSprite('#06b6d4', 'v₀ = 0.00 m/s'),
      v: this.createLabelSprite('#10b981', 'v = 0.00 m/s'),
      g: this.createLabelSprite('#f43f5e', 'g = 9.81 m/s²'),
      vh: this.createLabelSprite('#f59e0b', 'vₕ = 0.00 m/s'),
      vy: this.createLabelSprite('#a855f7', 'vᵧ = 0.00 m/s')
    };

    // Pre-allocated reusable vectors to prevent GC allocations in animation loop
    this._origin = new THREE.Vector3();
    this._v0Dir = new THREE.Vector3();
    this._vDir = new THREE.Vector3();
    this._vhDir = new THREE.Vector3();
    this._vyDir = new THREE.Vector3();
    this._gDir = new THREE.Vector3(0, -1, 0);
    this._tempPos = new THREE.Vector3();

    // Attach arrows and labels to root group
    Object.values(this.arrows).forEach(arrow => this.rootGroup.add(arrow));
    Object.values(this.labels).forEach(labelObj => {
      if (labelObj && labelObj.sprite) {
        this.rootGroup.add(labelObj.sprite);
      }
    });

    // Default hidden until activated
    this.setAllVisible(false);
  }

  /**
   * Creates a stylized 3D ArrowHelper.
   * @param {number} hexColor
   * @returns {THREE.ArrowHelper}
   */
  createArrow(hexColor) {
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      1.5,
      hexColor,
      0.45,
      0.24
    );
    arrow.visible = false;
    return arrow;
  }

  /**
   * Creates a dynamic 3D billboard sprite with high-DPI HTML5 canvas badge.
   * @param {string} colorCss
   * @param {string} initialText
   * @returns {{ sprite: THREE.Sprite|null, canvas: HTMLCanvasElement|null, ctx: CanvasRenderingContext2D|null, texture: THREE.CanvasTexture|null, currentText: string }}
   */
  createLabelSprite(colorCss, initialText) {
    if (typeof document === 'undefined' || !document.createElement) {
      return { sprite: null, canvas: null, ctx: null, texture: null, currentText: initialText };
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return { sprite: null, canvas: null, ctx: null, texture: null, currentText: initialText };
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      });

      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.9, 0.57, 1.0);
      sprite.visible = false;

      const labelObj = {
        sprite,
        canvas,
        ctx,
        texture,
        colorCss,
        currentText: ''
      };

      this.updateSpriteCanvas(labelObj, initialText);
      return labelObj;
    } catch (e) {
      return { sprite: null, canvas: null, ctx: null, texture: null, currentText: initialText };
    }
  }

  /**
   * Redraws the billboard label canvas with high-contrast glowing pill badge.
   * @param {Object} labelObj
   * @param {string} text
   */
  updateSpriteCanvas(labelObj, text) {
    if (!labelObj || !labelObj.ctx || !labelObj.canvas) return;
    if (labelObj.currentText === text) return; // Prevent unnecessary GPU uploads
    labelObj.currentText = text;

    const { ctx, canvas, colorCss } = labelObj;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Pill background
    const pad = 6;
    const rx = 18;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, rx);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.90)'; // Dark slate glass
    ctx.fill();

    // Colored border & glow
    ctx.lineWidth = 4;
    ctx.strokeStyle = colorCss;
    ctx.shadowColor = colorCss;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();

    // Dot indicator
    ctx.save();
    ctx.beginPath();
    ctx.arc(38, h / 2, 9, 0, Math.PI * 2);
    ctx.fillStyle = colorCss;
    ctx.shadowColor = colorCss;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    // Typography
    ctx.save();
    ctx.font = 'bold 36px "Segoe UI", Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 60, h / 2 + 1);
    ctx.restore();

    if (labelObj.texture) {
      labelObj.texture.needsUpdate = true;
    }
  }

  /**
   * Sets master visibility for all vector arrows and label sprites.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this.masterVisible = visible;
    this.rootGroup.visible = visible;
  }

  /**
   * Sets visibility on all individual vector components.
   * @param {boolean} visible
   */
  setAllVisible(visible) {
    Object.values(this.arrows).forEach(arrow => {
      arrow.visible = visible;
    });
    Object.values(this.labels).forEach(labelObj => {
      if (labelObj && labelObj.sprite) {
        labelObj.sprite.visible = visible;
      }
    });
  }

  /**
   * Updates vector visuals based on simulation state and current physics data.
   * 
   * @param {THREE.Vector3} hammerPos - Current 3D position of the hammer
   * @param {Object} analysis - Full projectile motion analysis
   * @param {number} currentTime - Elapsed flight time in seconds
   * @param {boolean} isSimulating - True if hammer is actively flying
   * @param {string} state - 'HOLDING' | 'AIMING' | 'THROWING' | 'LANDED'
   */
  update(hammerPos, analysis, currentTime, isSimulating, state) {
    this.currentState = state || this.currentState;

    if (!this.masterVisible || !analysis) {
      this.setAllVisible(false);
      return;
    }

    // When HOLDING: Vectors are hidden to keep character view clean
    if (this.currentState === 'HOLDING') {
      this.setAllVisible(false);
      return;
    }

    // When LANDED: Hide motion vectors
    if (this.currentState === 'LANDED') {
      this.setAllVisible(false);
      return;
    }

    const { initialVel, initialPos, gravity, v0 } = analysis;
    const origin = hammerPos ? this._origin.copy(hammerPos) : this._origin.set(initialPos.x, initialPos.y, initialPos.z);

    // Calculate current velocity and components at time t
    let vx = initialVel.vx !== undefined ? initialVel.vx : initialVel.x;
    let vy = initialVel.vy !== undefined ? initialVel.vy : initialVel.y;
    let vz = initialVel.vz !== undefined ? initialVel.vz : initialVel.z;

    if (isSimulating && currentTime > 0) {
      const t = Math.min(currentTime, analysis.flightTime);
      vy = (initialVel.vy !== undefined ? initialVel.vy : initialVel.y) - gravity * t;
    }

    const currentSpeed = Math.sqrt(vx * vx + vy * vy + vz * vz);
    const vHorizontal = Math.sqrt(vx * vx + vz * vz);

    // Scaling factors for lengths (proportional to physical magnitude)
    // Speed (1 to 50 m/s) -> length ~ 0.5m to 6.5m
    const v0Len = Math.min(6.5, Math.max(0.6, v0 * 0.12));
    const vLen = Math.min(6.5, Math.max(0.6, currentSpeed * 0.12));
    const vhLen = Math.min(6.5, Math.max(0.5, vHorizontal * 0.12));
    const vyLen = Math.min(6.5, Math.max(0.2, Math.abs(vy) * 0.12));
    // Gravity (1 to 25 m/s^2) -> length ~ 0.8m to 4.5m
    const gLen = Math.min(4.5, Math.max(0.8, gravity * 0.18));

    // ------------------------------------------------------------------------
    // 1. Initial Velocity Vector (v0) - Sky Blue / Cyan
    // ------------------------------------------------------------------------
    this._v0Dir.set(initialVel.vx, initialVel.vy, initialVel.vz).normalize();
    this.arrows.v0.position.copy(origin);
    this.arrows.v0.setDirection(this._v0Dir);
    this.arrows.v0.setLength(v0Len, v0Len * 0.22, v0Len * 0.12);
    this.arrows.v0.visible = true;

    this.updateSpriteCanvas(this.labels.v0, `v₀ = ${v0.toFixed(2)} m/s`);
    if (this.labels.v0.sprite) {
      this.labels.v0.sprite.position.copy(origin).addScaledVector(this._v0Dir, v0Len + 0.55);
      this.labels.v0.sprite.visible = true;
    }

    // ------------------------------------------------------------------------
    // 2. Current Velocity Vector (v) - Emerald Green
    // ------------------------------------------------------------------------
    if (this.currentState === 'THROWING') {
      if (currentSpeed > 0.01) {
        this._vDir.set(vx, vy, vz).normalize();
        this.arrows.v.position.copy(origin);
        this.arrows.v.setDirection(this._vDir);
        this.arrows.v.setLength(vLen, vLen * 0.22, vLen * 0.12);
        this.arrows.v.visible = true;

        this.updateSpriteCanvas(this.labels.v, `v = ${currentSpeed.toFixed(2)} m/s`);
        if (this.labels.v.sprite) {
          this.labels.v.sprite.position.copy(origin).addScaledVector(this._vDir, vLen + 0.55);
          this.labels.v.sprite.visible = true;
        }
      } else {
        this.arrows.v.visible = false;
        if (this.labels.v.sprite) this.labels.v.sprite.visible = false;
      }
    } else {
      // In AIMING mode, v equals v0, so hide redundant current v arrow
      this.arrows.v.visible = false;
      if (this.labels.v.sprite) this.labels.v.sprite.visible = false;
    }

    // ------------------------------------------------------------------------
    // 3. Gravity Acceleration Vector (g) - Crimson Red
    // ------------------------------------------------------------------------
    this._gDir.set(0, -1, 0);
    this.arrows.g.position.copy(origin);
    this.arrows.g.setDirection(this._gDir);
    this.arrows.g.setLength(gLen, gLen * 0.22, gLen * 0.12);
    this.arrows.g.visible = true;

    this.updateSpriteCanvas(this.labels.g, `g = ${gravity.toFixed(2)} m/s²`);
    if (this.labels.g.sprite) {
      // Offset slightly to side of downward arrow so it doesn't overlap
      this.labels.g.sprite.position.copy(origin);
      this.labels.g.sprite.position.x += 0.65;
      this.labels.g.sprite.position.y += -gLen * 0.85;
      this.labels.g.sprite.visible = true;
    }

    // ------------------------------------------------------------------------
    // 4. Horizontal Velocity Component (v_h) - Electric Amber
    // ------------------------------------------------------------------------
    if (vHorizontal > 0.01) {
      this._vhDir.set(vx, 0, vz).normalize();
      this.arrows.vh.position.copy(origin);
      this.arrows.vh.setDirection(this._vhDir);
      this.arrows.vh.setLength(vhLen, vhLen * 0.22, vhLen * 0.12);
      this.arrows.vh.visible = true;

      this.updateSpriteCanvas(this.labels.vh, `vₕ = ${vHorizontal.toFixed(2)} m/s`);
      if (this.labels.vh.sprite) {
        this.labels.vh.sprite.position.copy(origin).addScaledVector(this._vhDir, vhLen + 0.5);
        this.labels.vh.sprite.position.y += 0.25;
        this.labels.vh.sprite.visible = true;
      }
    } else {
      this.arrows.vh.visible = false;
      if (this.labels.vh.sprite) this.labels.vh.sprite.visible = false;
    }

    // ------------------------------------------------------------------------
    // 5. Vertical Velocity Component (v_y) - Vivid Violet
    // ------------------------------------------------------------------------
    if (Math.abs(vy) > 0.08) {
      this._vyDir.set(0, vy >= 0 ? 1 : -1, 0);
      this.arrows.vy.position.copy(origin);
      this.arrows.vy.setDirection(this._vyDir);
      this.arrows.vy.setLength(vyLen, Math.min(vyLen * 0.35, 0.45), 0.22);
      this.arrows.vy.visible = true;

      const vySign = vy >= 0 ? '+' : '';
      this.updateSpriteCanvas(this.labels.vy, `vᵧ = ${vySign}${vy.toFixed(2)} m/s`);
      if (this.labels.vy.sprite) {
        this.labels.vy.sprite.position.copy(origin).addScaledVector(this._vyDir, vyLen + 0.45);
        this.labels.vy.sprite.position.x += 0.4;
        this.labels.vy.sprite.visible = true;
      }
    } else {
      // Apex point: vertical velocity momentarily passes through zero
      this.arrows.vy.visible = false;
      this.updateSpriteCanvas(this.labels.vy, 'vᵧ = 0.00 m/s (Apex)');
      if (this.labels.vy.sprite) {
        this.labels.vy.sprite.position.copy(origin);
        this.labels.vy.sprite.position.y += 0.4;
        this.labels.vy.sprite.visible = true;
      }
    }
  }

  /**
   * Disposes all Three.js arrows, sprites, geometries, materials, and canvas textures
   * to guarantee zero memory leaks on tear down.
   */
  dispose() {
    this.scene.remove(this.rootGroup);
    Object.values(this.arrows).forEach(arrow => {
      if (arrow.line) {
        if (arrow.line.geometry) arrow.line.geometry.dispose();
        if (arrow.line.material) arrow.line.material.dispose();
      }
      if (arrow.cone) {
        if (arrow.cone.geometry) arrow.cone.geometry.dispose();
        if (arrow.cone.material) arrow.cone.material.dispose();
      }
    });
    Object.values(this.labels).forEach(labelObj => {
      if (labelObj && labelObj.texture) labelObj.texture.dispose();
      if (labelObj && labelObj.sprite && labelObj.sprite.material) {
        labelObj.sprite.material.dispose();
      }
    });
  }
}
