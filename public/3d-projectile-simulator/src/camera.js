import * as THREE from 'three';

/**
 * Modular Third-Person Camera System.
 * Smoothly follows a target player character, supports pitch and yaw orbiting,
 * prevents flipping upside-down, enforces zoom boundaries, and guarantees
 * ground clearance and player visibility.
 */
export class ThirdPersonCamera {
  /**
   * @param {THREE.PerspectiveCamera} camera - Three.js perspective camera
   * @param {HTMLElement} domElement - Canvas element for pointer/wheel inputs
   * @param {Object} [options] - Configuration parameters
   */
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.domElement = domElement || window;

    // Spherical Coordinate Parameters
    this.distance = options.defaultDistance || 5.8;      // Distance behind player
    this.minDistance = options.minDistance || 1.2;      // Minimum zoom in (closer inspection)
    this.maxDistance = options.maxDistance || 22.0;     // Maximum zoom out
    this.zoomSpeed = options.zoomSpeed || 0.8;

    // Angles (radians)
    this.yaw = options.defaultYaw || Math.PI * 0.95;    // Horizontal angle
    this.pitch = options.defaultPitch || 0.32;          // Vertical angle (~18 degrees)
    
    // Pitch Limits (Allows inspecting ground & hammer from diverse angles while preventing flipping)
    this.minPitch = -0.10;                              // Slightly below horizon for low-angle ground inspection
    this.maxPitch = Math.PI / 2.15;                     // ~85 degrees (top-down view)

    // Sensitivity
    this.mouseSensitivity = options.mouseSensitivity || 0.0035;


    // Damping & Smoothing Rates
    this.followSharpness = 8.5;                         // Smooth position tracking
    this.lookSharpness = 12.0;

    // Internal Target Tracking Vectors
    this.currentTarget = new THREE.Vector3(0, 1.4, 0);
    this.currentPosition = new THREE.Vector3(0, 3.0, 6.0);
    this.targetOffset = new THREE.Vector3(0, 1.42, 0);   // Focus on athlete torso/chest

    // Reusable vectors for zero-allocation per-frame interpolation
    this._desiredTarget = new THREE.Vector3();
    this._desiredPosition = new THREE.Vector3();

    // Camera Modes: 'DEFAULT' | 'FOLLOW_HAMMER' | 'TOP_VIEW' | 'SIDE_VIEW'
    this.cameraMode = 'DEFAULT';

    // Input States
    this.isDragging = false;
    this.dragButton = 0;
    this.previousMousePosition = { x: 0, y: 0 };

    // Aiming Mode State & Callbacks
    this.isAimMode = false;
    this.onAimAdjustment = null;

    // Setup Event Listeners
    this.setupInputs();
  }

  /**
   * Switches camera mode.
   * @param {'DEFAULT'|'FOLLOW_HAMMER'|'TOP_VIEW'|'SIDE_VIEW'} mode
   */
  setCameraMode(mode) {
    this.cameraMode = mode || 'DEFAULT';
  }

  /**
   * Toggles aiming mode for input routing.
   * @param {boolean} isAimMode
   */
  setAimMode(isAimMode) {
    this.isAimMode = isAimMode;
  }

  /**
   * Sets callback for aim adjustments (azimuth, elevation, v0).
   * @param {Function} callback
   */
  setOnAimAdjustment(callback) {
    this.onAimAdjustment = callback;
  }

  /**
   * Attaches pointer and mouse-wheel event listeners.
   */
  setupInputs() {
    this.onMouseDown = (e) => {
      // Allow drag on left click (0) or right click (2) on the canvas
      if (e.button === 0 || e.button === 2) {
        this.isDragging = true;
        this.dragButton = e.button;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
        if (e.button === 2) e.preventDefault();

        // Left button down in THROW MODE starts power charging
        if (this.isAimMode && e.button === 0 && this.onAimAdjustment) {
          this.onAimAdjustment({ startCharge: true });
        }
      }
    };

    this.onMouseMove = (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };

      // In THROW MODE: Left-drag adjusts Azimuth (horizontal) and Elevation (vertical)!
      // Right-drag continues to orbit the camera freely around the athlete.
      if (this.isAimMode && this.dragButton === 0 && this.onAimAdjustment) {
        const aimSensitivityX = 0.35; // degrees per pixel
        const aimSensitivityY = 0.30; // degrees per pixel
        this.onAimAdjustment({
          deltaAzimuth: deltaX * aimSensitivityX,
          deltaElevation: -deltaY * aimSensitivityY
        });
      } else {
        // Yaw: Horizontal rotation around player (left/right)
        this.yaw -= deltaX * this.mouseSensitivity;

        // Keep yaw within [-PI, PI] for numerical elegance
        while (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
        while (this.yaw < -Math.PI) this.yaw += Math.PI * 2;

        // Pitch: Vertical elevation angle (up/down)
        this.pitch += deltaY * this.mouseSensitivity;

        // Clamp pitch to prevent flipping upside down
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
      }
    };

    this.onMouseUp = (e) => {
      // Left button release in THROW MODE triggers throw release
      if (this.isAimMode && this.dragButton === 0 && this.onAimAdjustment) {
        this.onAimAdjustment({ releaseCharge: true });
      }
      this.isDragging = false;
    };

    this.onWheel = (e) => {
      e.preventDefault();

      // In THROW MODE: Mouse wheel adjusts Initial Velocity v0!
      // When not in throw mode: Mouse wheel zooms the third-person camera.
      if (this.isAimMode && this.onAimAdjustment) {
        const deltaV0 = -Math.sign(e.deltaY) * 1.0;
        this.onAimAdjustment({ deltaV0 });
      } else {
        const zoomDelta = Math.sign(e.deltaY) * this.zoomSpeed;
        this.distance += zoomDelta;
        // Clamp zoom distance to prevent excessive zoom
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
      }
    };

    this.onContextMenu = (e) => {
      e.preventDefault(); // Prevent browser context menu on right click
    };

    // Touch support for mobile devices
    let initialTouchDist = null;
    let prevTouch = null;

    this.onTouchStart = (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        prevTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    this.onTouchMove = (e) => {
      if (e.touches.length === 1 && prevTouch) {
        const deltaX = e.touches[0].clientX - prevTouch.x;
        const deltaY = e.touches[0].clientY - prevTouch.y;
        prevTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        if (this.isAimMode && this.onAimAdjustment) {
          this.onAimAdjustment({
            deltaAzimuth: deltaX * 0.45,
            deltaElevation: -deltaY * 0.35
          });
        } else {
          this.yaw -= deltaX * this.mouseSensitivity * 1.3;
          this.pitch += deltaY * this.mouseSensitivity * 1.3;
          this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        }
      } else if (e.touches.length === 2 && initialTouchDist) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const pinchDelta = (initialTouchDist - currentDist) * 0.02;
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + pinchDelta));
        initialTouchDist = currentDist;
      }
    };

    this.onTouchEnd = () => {
      this.isDragging = false;
      prevTouch = null;
      initialTouchDist = null;
    };

    const targetEl = this.domElement;
    targetEl.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    targetEl.addEventListener('wheel', this.onWheel, { passive: false });
    targetEl.addEventListener('contextmenu', this.onContextMenu);

    targetEl.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
  }

  /**
   * Main per-frame camera update.
   * Supports multiple camera view modes:
   * - DEFAULT: Smoothly orbits and follows player character
   * - FOLLOW_HAMMER: Smoothly follows flying projectile in real time
   * - TOP_VIEW: Birds-eye view positioned high directly above trajectory midpoint
   * - SIDE_VIEW: Orthogonal side profile view perpendicular to launch azimuth
   * 
   * @param {number} deltaTime - Time step (seconds)
   * @param {THREE.Vector3} playerPosition - Current position of the player
   * @param {THREE.Vector3} [hammerPosition] - Current position of the projectile
   * @param {Object} [analysis] - Current projectile motion analysis
   */
  update(deltaTime, playerPosition, hammerPosition, analysis) {
    const dt = Math.min(deltaTime, 0.05);

    if (this.cameraMode === 'FOLLOW_HAMMER' && hammerPosition) {
      // 1. Follow Hammer View: Track projectile in flight
      this._desiredTarget.set(hammerPosition.x, hammerPosition.y + 0.2, hammerPosition.z);
      const targetLerp = 1 - Math.exp(-14.0 * dt);
      this.currentTarget.lerp(this._desiredTarget, targetLerp);

      // Follow behind and above hammer based on current yaw
      const followDist = 5.2;
      const followPitch = 0.28;
      const hDist = followDist * Math.cos(followPitch);
      const vDist = followDist * Math.sin(followPitch);

      this._desiredPosition.set(
        this.currentTarget.x + hDist * Math.sin(this.yaw),
        Math.max(0.4, this.currentTarget.y + vDist),
        this.currentTarget.z + hDist * Math.cos(this.yaw)
      );

      const posLerp = 1 - Math.exp(-10.0 * dt);
      this.currentPosition.lerp(this._desiredPosition, posLerp);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentTarget);
      return;
    }

    if (this.cameraMode === 'TOP_VIEW') {
      // 2. Birds-Eye Top View: Looking straight down at entire trajectory
      let midX = 0, midZ = 0, range = 35;
      if (analysis && analysis.landingPos && analysis.initialPos) {
        midX = (analysis.initialPos.x + analysis.landingPos.x) * 0.5;
        midZ = (analysis.initialPos.z + analysis.landingPos.z) * 0.5;
        range = analysis.horizontalRange || 35;
      } else if (playerPosition) {
        midX = playerPosition.x + 15;
        midZ = playerPosition.z;
      }

      const camHeight = Math.max(26.0, range * 0.95 + 14.0);
      this._desiredTarget.set(midX, 0, midZ);
      this._desiredPosition.set(midX, camHeight, midZ + 0.08); // Tiny Z offset to avoid gimbal lock

      const lerpFactor = 1 - Math.exp(-6.0 * dt);
      this.currentTarget.lerp(this._desiredTarget, lerpFactor);
      this.currentPosition.lerp(this._desiredPosition, lerpFactor);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentTarget);
      return;
    }

    if (this.cameraMode === 'SIDE_VIEW') {
      // 3. Orthogonal Side Profile View: Perpendicular to launch azimuth
      let midX = 0, midZ = 0, range = 35, maxHeight = 10, azimuthDeg = 0;
      if (analysis && analysis.landingPos && analysis.initialPos) {
        midX = (analysis.initialPos.x + analysis.landingPos.x) * 0.5;
        midZ = (analysis.initialPos.z + analysis.landingPos.z) * 0.5;
        range = analysis.horizontalRange || 35;
        maxHeight = analysis.maxHeight || 10;
        azimuthDeg = analysis.azimuthAngleDeg || 0;
      } else if (playerPosition) {
        midX = playerPosition.x + 15;
        midZ = playerPosition.z;
      }

      const phi = (azimuthDeg * Math.PI) / 180;
      // Perpendicular normal vector (-sin phi, cos phi)
      const normX = -Math.sin(phi);
      const normZ = Math.cos(phi);

      const sideDist = Math.max(16.0, range * 0.76 + 8.0);
      const camHeight = Math.max(4.5, maxHeight * 0.55 + 2.5);

      this._desiredTarget.set(midX, maxHeight * 0.45, midZ);
      this._desiredPosition.set(midX + normX * sideDist, camHeight, midZ + normZ * sideDist);

      const lerpFactor = 1 - Math.exp(-6.0 * dt);
      this.currentTarget.lerp(this._desiredTarget, lerpFactor);
      this.currentPosition.lerp(this._desiredPosition, lerpFactor);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentTarget);
      return;
    }

    // 4. DEFAULT: Smooth orbital follow around player
    if (!playerPosition) return;

    this._desiredTarget.set(
      playerPosition.x + this.targetOffset.x,
      playerPosition.y + this.targetOffset.y,
      playerPosition.z + this.targetOffset.z
    );

    const targetLerpFactor = 1 - Math.exp(-this.lookSharpness * dt);
    this.currentTarget.lerp(this._desiredTarget, targetLerpFactor);

    const horizontalDistance = this.distance * Math.cos(this.pitch);
    const verticalHeight = this.distance * Math.sin(this.pitch);

    this._desiredPosition.set(
      this.currentTarget.x + horizontalDistance * Math.sin(this.yaw),
      this.currentTarget.y + verticalHeight,
      this.currentTarget.z + horizontalDistance * Math.cos(this.yaw)
    );

    const minGroundY = 0.35;
    if (this._desiredPosition.y < minGroundY) {
      this._desiredPosition.y = minGroundY;
    }

    const posLerpFactor = 1 - Math.exp(-this.followSharpness * dt);
    this.currentPosition.lerp(this._desiredPosition, posLerpFactor);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);
  }

  /**
   * Gets the camera's horizontal forward direction vector on the XZ plane.
   * Useful for camera-relative player movement controls.
   * @returns {THREE.Vector3}
   */
  getForwardDirection() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    return forward;
  }

  /**
   * Gets the camera's horizontal right direction vector on the XZ plane.
   * @returns {THREE.Vector3}
   */
  getRightDirection() {
    const forward = this.getForwardDirection();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    return right;
  }

  /**
   * Returns current yaw angle in radians.
   * @returns {number}
   */
  getYaw() {
    return this.yaw;
  }

  /**
   * Resets camera to standard behind-the-player perspective and switches to DEFAULT mode.
   * @param {THREE.Vector3} playerPosition
   */
  reset(playerPosition = new THREE.Vector3(0, 0, 0)) {
    this.cameraMode = 'DEFAULT';
    this.distance = 5.8;
    this.pitch = 0.32;
    this.yaw = Math.PI * 0.95;

    this.currentTarget.set(playerPosition.x, playerPosition.y + 1.42, playerPosition.z);
    
    const horizontalDistance = this.distance * Math.cos(this.pitch);
    const verticalHeight = this.distance * Math.sin(this.pitch);
    
    this.currentPosition.set(
      this.currentTarget.x + horizontalDistance * Math.sin(this.yaw),
      this.currentTarget.y + verticalHeight,
      this.currentTarget.z + horizontalDistance * Math.cos(this.yaw)
    );

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentTarget);
  }

  /**
   * Cleans up event listeners.
   */
  dispose() {
    const targetEl = this.domElement;
    targetEl.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    targetEl.removeEventListener('wheel', this.onWheel);
    targetEl.removeEventListener('contextmenu', this.onContextMenu);
    targetEl.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
  }
}
