import * as THREE from 'three';

/**
 * Third-Person Player Character Controller.
 * Represents a stylized human athlete holding the hammer with smooth movement,
 * sprinting, jumping, procedural limb animation, and camera-relative controls.
 */
export class PlayerController {
  /**
   * @param {THREE.Scene} scene - The 3D scene
   * @param {THREE.Camera} camera - Main perspective camera
   * @param {HTMLElement} [domElement=window] - Input event target
   */
  constructor(scene, camera, domElement = window) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // Kinematics & Physics Properties
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.moveDirection = new THREE.Vector3(0, 0, 0);

    // Tuning Parameters
    this.walkSpeed = 4.8;       // m/s
    this.sprintSpeed = 8.8;     // m/s
    this.acceleration = 22.0;   // m/s^2 (smooth ramp up)
    this.deceleration = 16.0;   // m/s^2 (smooth braking)
    this.jumpForce = 6.4;       // m/s (gives ~1.1m jump height)
    this.gravity = 18.0;        // m/s^2 (character gravity for athletic feel)
    this.rotationSpeed = 12.0;  // rad/s (smooth turning)
    this.isGrounded = true;

    // Field Boundaries (Collision)
    this.arenaRadius = 140;     // meters

    // Input States
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    // Procedural Animation Clock
    this.animTime = 0;
    this.limbs = {};

    // Aiming, Charging, and Throw State
    this.isAiming = false;
    this.isCharging = false;
    this.chargeRatio = 0.0;
    this.onReleaseCallback = null;
    this.hasReleased = false;

    // Pre-allocated reusable vectors for zero-allocation update loop
    this._camForward = new THREE.Vector3();
    this._camRight = new THREE.Vector3();
    this._desiredDir = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);

    // 1. Build the stylized 3D Athlete Mesh
    this.mesh = this.createAthleteMesh();
    this.scene.add(this.mesh);

    // 2. Setup Input Listeners
    this.setupInputs();
  }

  /**
   * Constructs a stylized 3D human athlete model using Three.js geometric primitives.
   * Height: ~1.8m.
   * @returns {THREE.Group}
   */
  createAthleteMesh() {
    const root = new THREE.Group();

    // -------------------------------------------------------------
    // Materials
    // -------------------------------------------------------------
    // Athletic Jersey / Uniform (Electric Cyan & Navy Blue)
    const jerseyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant athletic cyan
      roughness: 0.5,
      metalness: 0.1
    });

    const shortsMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Slate navy shorts
      roughness: 0.6,
      metalness: 0.1
    });

    // Human Skin Tone
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf6c8a4, // Warm stylized skin
      roughness: 0.7,
      metalness: 0.05
    });

    // Hair / Headband
    const headbandMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Crimson headband
      roughness: 0.4
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8
    });

    // Footwear / Sneakers
    const sneakerMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.2
    });

    // -------------------------------------------------------------
    // Torso / Body (Center around y = 1.15m)
    // -------------------------------------------------------------
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.46, 0.22);
    const torso = new THREE.Mesh(torsoGeo, jerseyMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    torso.receiveShadow = true;
    root.add(torso);

    // Belt / Waist Trim
    const beltGeo = new THREE.BoxGeometry(0.39, 0.06, 0.23);
    const belt = new THREE.Mesh(beltGeo, shortsMat);
    belt.position.y = 0.93;
    belt.castShadow = true;
    root.add(belt);

    // Athletic Number Badge on Chest
    const badgeGeo = new THREE.BoxGeometry(0.16, 0.14, 0.02);
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 1.20, 0.115);
    root.add(badge);

    // -------------------------------------------------------------
    // Head & Neck
    // -------------------------------------------------------------
    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.08, 16);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.42;
    neck.castShadow = true;
    root.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(0.13, 18, 18);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.56;
    head.castShadow = true;
    root.add(head);

    // Hair Top
    const hairGeo = new THREE.SphereGeometry(0.132, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.58;
    root.add(hair);

    // Sports Headband
    const bandGeo = new THREE.TorusGeometry(0.125, 0.016, 8, 24);
    const band = new THREE.Mesh(bandGeo, headbandMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = 1.57;
    root.add(band);

    // -------------------------------------------------------------
    // Left & Right Arms (Pivoting at Shoulders)
    // -------------------------------------------------------------
    // Left Arm Pivot
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.25, 1.34, 0);
    const leftArmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.44, 12);
    const leftArm = new THREE.Mesh(leftArmGeo, skinMat);
    leftArm.position.y = -0.22;
    leftArm.castShadow = true;
    leftArmPivot.add(leftArm);
    root.add(leftArmPivot);
    this.limbs.leftArm = leftArmPivot;

    // Right Arm Pivot (Holds Hammer Socket)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.25, 1.34, 0);
    const rightArmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.44, 12);
    const rightArm = new THREE.Mesh(rightArmGeo, skinMat);
    rightArm.position.y = -0.22;
    rightArm.castShadow = true;
    rightArmPivot.add(rightArm);

    // Right Hand Socket (where hammer is attached when held)
    this.handSocket = new THREE.Group();
    this.handSocket.position.set(0, -0.42, 0.08);
    rightArmPivot.add(this.handSocket);

    root.add(rightArmPivot);
    this.limbs.rightArm = rightArmPivot;

    // -------------------------------------------------------------
    // Left & Right Legs (Pivoting at Hips)
    // -------------------------------------------------------------
    // Left Leg Pivot
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.11, 0.88, 0);

    // Shorts Thigh
    const leftThighGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.38, 12);
    const leftThigh = new THREE.Mesh(leftThighGeo, shortsMat);
    leftThigh.position.y = -0.19;
    leftThigh.castShadow = true;
    leftLegPivot.add(leftThigh);

    // Shin & Calf
    const leftShinGeo = new THREE.CylinderGeometry(0.048, 0.042, 0.38, 12);
    const leftShin = new THREE.Mesh(leftShinGeo, skinMat);
    leftShin.position.y = -0.55;
    leftShin.castShadow = true;
    leftLegPivot.add(leftShin);

    // Sneaker
    const sneakerGeo = new THREE.BoxGeometry(0.10, 0.08, 0.22);
    const leftSneaker = new THREE.Mesh(sneakerGeo, sneakerMat);
    leftSneaker.position.set(0, -0.74, 0.04);
    leftSneaker.castShadow = true;
    leftLegPivot.add(leftSneaker);

    root.add(leftLegPivot);
    this.limbs.leftLeg = leftLegPivot;

    // Right Leg Pivot
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.11, 0.88, 0);

    const rightThigh = new THREE.Mesh(leftThighGeo, shortsMat);
    rightThigh.position.y = -0.19;
    rightThigh.castShadow = true;
    rightLegPivot.add(rightThigh);

    const rightShin = new THREE.Mesh(leftShinGeo, skinMat);
    rightShin.position.y = -0.55;
    rightShin.castShadow = true;
    rightLegPivot.add(rightShin);

    const rightSneaker = new THREE.Mesh(sneakerGeo, sneakerMat);
    rightSneaker.position.set(0, -0.74, 0.04);
    rightSneaker.castShadow = true;
    rightLegPivot.add(rightSneaker);

    root.add(rightLegPivot);
    this.limbs.rightLeg = rightLegPivot;

    return root;
  }

  /**
   * Sets up keyboard event listeners for W/A/S/D, Arrows, Shift, and Space.
   */
  setupInputs() {
    this.onKeyDown = (e) => {
      // Don't intercept if user is typing in an input field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'Space':
          if (this.isGrounded && !this.isAiming) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
          }
          e.preventDefault();
          break;
      }
    };

    this.onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  /**
   * Sets aiming mode. When aiming, normal player movement stops.
   * @param {boolean} isAiming
   */
  setAiming(isAiming) {
    this.isAiming = isAiming;
    if (isAiming) {
      // Immediately cancel horizontal velocities
      this.velocity.x = 0;
      this.velocity.z = 0;
    }
  }

  /**
   * Sets the character orientation angle directly.
   * @param {number} radAngle - Yaw angle in radians
   */
  setFacingAngle(radAngle) {
    if (this.mesh) {
      this.mesh.rotation.y = radAngle;
    }
  }

  /**
   * Sets power charging state and ratio (0 to 1).
   * @param {boolean} isCharging
   * @param {number} [ratio=0] - 0.0 (min power) to 1.0 (max power)
   */
  setCharging(isCharging, ratio = 0) {
    this.isCharging = isCharging;
    this.chargeRatio = Math.max(0, Math.min(1, ratio));
  }

  /**
   * Initiates multi-phase athletic throwing animation with exact release timing callback.
   * @param {Function} onRelease - Triggered at the forward release apex of the swing
   */
  playThrowAnimation(onRelease) {
    this.throwAnimTimer = 0.0;
    this.onReleaseCallback = onRelease;
    this.hasReleased = false;
    this.isCharging = false;
  }

  /**
   * Triggers a fast throw follow-through arm swing animation (legacy fallback).
   */
  triggerThrowAnimation() {
    this.throwFollowThroughTimer = 0.4;
  }

  /**
   * Calculates 2D horizontal distance to a target position.
   * @param {{x: number, z: number}} targetPos
   * @returns {number}
   */
  getDistanceTo(targetPos) {
    if (!targetPos) return Infinity;
    const dx = this.position.x - targetPos.x;
    const dz = this.position.z - targetPos.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Gets the world position of the right hand launch socket.
   * @returns {THREE.Vector3}
   */
  getReleasePosition() {
    const pos = new THREE.Vector3();
    if (this.handSocket) {
      this.handSocket.getWorldPosition(pos);
    } else {
      pos.copy(this.position).add(new THREE.Vector3(0.25, 1.5, 0.1));
    }
    return pos;
  }

  /**
   * Attaches an object (such as the hammer) to the player's right hand.
   * @param {THREE.Object3D} object
   */
  attachToHand(object) {
    if (this.handSocket && object) {
      this.handSocket.add(object);
      object.position.set(0, 0, 0);
      object.rotation.set(-Math.PI / 4, 0, 0);
    }
  }

  /**
   * Releases an attached object from the hand into the global scene.
   * @param {THREE.Object3D} object
   * @returns {THREE.Vector3} World release position
   */
  releaseFromHand(object) {
    const worldPos = new THREE.Vector3();
    if (object) {
      object.getWorldPosition(worldPos);
      this.scene.attach(object);
    }
    return worldPos;
  }

  /**
   * Main per-frame update loop.
   * Calculates movement, acceleration, deceleration, jump/gravity,
   * ground detection, environment collision, and limb animations.
   * 
   * @param {number} deltaTime - Time step in seconds
   */
  update(deltaTime) {
    const dt = Math.min(deltaTime, 0.05);

    // 1. Calculate Target Movement Direction relative to Camera Yaw
    // If aiming, normal translation movement is locked!
    let inputX = 0;
    let inputZ = 0;
    if (!this.isAiming) {
      if (this.keys.forward) inputZ += 1;
      if (this.keys.backward) inputZ -= 1;
      if (this.keys.left) inputX -= 1;
      if (this.keys.right) inputX += 1;
    }

    const hasInput = inputX !== 0 || inputZ !== 0;

    // Determine target speed (sprint vs walk)
    const targetSpeed = this.keys.sprint ? this.sprintSpeed : this.walkSpeed;

    // Get horizontal camera heading without allocations
    this.camera.getWorldDirection(this._camForward);
    this._camForward.y = 0;
    this._camForward.normalize();

    this._camRight.crossVectors(this._camForward, this._up).normalize();

    // Direction vector on ground plane
    this._desiredDir.set(0, 0, 0);
    this._desiredDir.addScaledVector(this._camForward, inputZ);
    this._desiredDir.addScaledVector(this._camRight, inputX);
    if (this._desiredDir.lengthSq() > 0.001) {
      this._desiredDir.normalize();
    }

    // 2. Smooth Acceleration & Deceleration
    const targetVx = this._desiredDir.x * (hasInput ? targetSpeed : 0);
    const targetVz = this._desiredDir.z * (hasInput ? targetSpeed : 0);

    const accelRate = hasInput ? this.acceleration : this.deceleration;
    this.velocity.x += (targetVx - this.velocity.x) * Math.min(1, accelRate * dt);
    this.velocity.z += (targetVz - this.velocity.z) * Math.min(1, accelRate * dt);

    // 3. Gravity & Vertical Kinematics
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // 4. Integrate Position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // 5. Ground Detection
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // 6. Basic Environment Collision & Arena Boundaries
    const distFromOrigin = Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z);
    if (distFromOrigin > this.arenaRadius) {
      const angle = Math.atan2(this.position.z, this.position.x);
      this.position.x = Math.cos(angle) * this.arenaRadius;
      this.position.z = Math.sin(angle) * this.arenaRadius;
    }

    // Update Mesh Position
    this.mesh.position.copy(this.position);

    // 7. Smooth Character Orientation toward Movement Direction (when walking and not aiming)
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (!this.isAiming && horizontalSpeed > 0.2) {
      const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
      // Smoothly rotate character toward movement heading
      let diff = targetAngle - this.mesh.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.mesh.rotation.y += diff * Math.min(1, this.rotationSpeed * dt);
    }

    // 8. Procedural Walk / Run / Aim / Charge / Throw Limb Animation
    this.animateLimbs(dt, horizontalSpeed);
  }

  /**
   * Procedural arm and leg swing animation including charging windup tension
   * and explosive throwing animation with exact release apex.
   * @param {number} dt
   * @param {number} speed
   */
  animateLimbs(dt, speed) {
    if (this.throwAnimTimer >= 0) {
      // Dynamic Throwing Sequence
      this.throwAnimTimer += dt;
      const t = this.throwAnimTimer;
      const driveDuration = 0.12;

      if (t < driveDuration) {
        // Phase 1: Explosive Forward Arm Drive!
        const p = t / driveDuration;
        const armAngle = -1.65 + p * 2.75; // Fast whip from -1.65 to +1.10
        if (this.limbs.rightArm) this.limbs.rightArm.rotation.set(armAngle, 0.1, -0.15);
        if (this.limbs.leftArm) this.limbs.leftArm.rotation.set(-0.85 * p, -0.1, 0.1);
        if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = -0.28 * p;
        if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = 0.28 * p;

        // Release apex trigger (at 0.08s into swing)
        if (t >= 0.075 && !this.hasReleased) {
          this.hasReleased = true;
          if (this.onReleaseCallback) {
            this.onReleaseCallback();
          }
        }
      } else if (t < 0.40) {
        // Phase 2: Follow-Through & Weight Balance
        const p = (t - driveDuration) / (0.40 - driveDuration);
        if (this.limbs.rightArm) {
          this.limbs.rightArm.rotation.set(1.10 - 0.25 * p, 0.1, -0.15);
        }
        if (this.limbs.leftArm) {
          this.limbs.leftArm.rotation.set(-0.85 + 0.35 * p, 0, 0);
        }
        if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = -0.28 * (1 - p);
        if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = 0.28 * (1 - p);
      } else {
        // Throw animation complete
        this.throwAnimTimer = -1;
      }
    } else if (this.throwFollowThroughTimer > 0) {
      // Legacy fallback throw follow-through swing
      this.throwFollowThroughTimer -= dt;
      if (this.limbs.rightArm) this.limbs.rightArm.rotation.set(0.95, 0.1, -0.15);
      if (this.limbs.leftArm) this.limbs.leftArm.rotation.set(-0.8, -0.1, 0.1);
      if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = -0.25;
      if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = 0.25;
    } else if (this.isCharging) {
      // High-Tension Athletic Windup Pose while Charging:
      // Right arm draws further back proportionally to power, with subtle muscular jitter
      const tensionJitter = (Math.random() - 0.5) * 0.02 * this.chargeRatio;
      const pullBack = -1.45 - 0.45 * this.chargeRatio + tensionJitter;
      if (this.limbs.rightArm) {
        this.limbs.rightArm.rotation.set(
          pullBack,
          -0.25 - 0.15 * this.chargeRatio,
          0.40 + 0.25 * this.chargeRatio
        );
      }
      if (this.limbs.leftArm) {
        this.limbs.leftArm.rotation.set(
          0.85 + 0.30 * this.chargeRatio,
          0.35,
          -0.30
        );
      }
      if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = -0.12 - 0.12 * this.chargeRatio;
      if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = 0.18 + 0.14 * this.chargeRatio;
    } else if (this.isAiming) {
      // Athletic Throwing Windup Pose: Right arm drawn back, left arm raised forward for aiming/balance
      if (this.limbs.rightArm) {
        this.limbs.rightArm.rotation.set(-1.45, -0.25, 0.4);
      }
      if (this.limbs.leftArm) {
        this.limbs.leftArm.rotation.set(0.85, 0.35, -0.3);
      }
      if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = -0.12, 0, 0;
      if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = 0.18, 0, 0;
    } else if (this.isGrounded && speed > 0.3) {
      const strideFreq = speed * 1.8;
      this.animTime += dt * strideFreq;

      const swingAngle = Math.sin(this.animTime) * 0.65;

      // Legs swing in opposite phases
      if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = swingAngle;
      if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = -swingAngle;

      // Arms swing opposite to legs
      if (this.limbs.leftArm) this.limbs.leftArm.rotation.x = -swingAngle * 0.7;
      if (this.limbs.rightArm) this.limbs.rightArm.rotation.x = swingAngle * 0.4;
    } else if (!this.isGrounded) {
      // Jump Pose
      if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = -0.3;
      if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = 0.4;
      if (this.limbs.leftArm) this.limbs.leftArm.rotation.x = 0.5;
      if (this.limbs.rightArm) this.limbs.rightArm.rotation.x = 0.3;
    } else {
      // Idle Pose: Smoothly return to natural stance
      if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x *= 0.85;
      if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x *= 0.85;
      if (this.limbs.leftArm) this.limbs.leftArm.rotation.x *= 0.85;
      if (this.limbs.rightArm) this.limbs.rightArm.rotation.x *= 0.85;
    }
  }

  /**
   * Gets the current character position.
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.position.clone();
  }

  /**
   * Sets the character position.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  setPosition(x, y, z) {
    this.position.set(x, y, z);
    this.mesh.position.copy(this.position);
  }

  /**
   * Cleanup listeners.
   */
  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.scene.remove(this.mesh);
  }
}
