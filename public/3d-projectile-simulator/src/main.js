import * as THREE from 'three';
import { SimulatorScene } from './scene.js';
import { ProjectileHammer } from './projectile.js';
import { PlayerController } from './player.js';
import { ThirdPersonCamera } from './camera.js';
import { AimingSystem } from './aiming.js';
import { VectorVisualizer } from './vectors.js';
import { ExperimentVisualizer } from './experiment.js';
import { ChallengeSystem } from './challenge.js';
import { SimulatorUI } from './ui.js';
import {
  analyzeProjectileMotion,
  generateTrajectoryPoints,
  getPositionAtTime,
  getVelocityAtTime
} from './physics.js';

/**
 * Main Application Orchestrator for 3D Projectile Motion Simulator.
 * Integrates Player Character with Hammer and an Intuitive 3D Aiming System:
 * - HOLDING: Character walks freely holding hammer in hand.
 * - AIMING / THROW MODE: Movement locked; displays horizontal direction ground ring,
 *   vertical elevation protractor, aiming arrow, velocity power vector, predicted trajectory,
 *   and predicted landing point; allows interactive adjustment via mouse drag, wheel, and W/A/S/D keys.
 * - THROWING: Hammer detached, launched with v0, tumble animation, real-time vectors.
 * - LANDED: Hammer rests on ground, displays final data, athlete walks toward hammer to retrieve.
 */
class ProjectileApp {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.uiContainer = document.getElementById('ui-container');

    // State Machine: 'HOLDING' | 'AIMING' | 'THROWING' | 'LANDED'
    this.state = 'HOLDING';
    this.isSimulating = false;
    this.simTime = 0;
    this.lastTimestamp = performance.now();
    this.currentAnalysis = null;

    // Throwing & Charging Power Mechanics
    this.isCharging = false;
    this.chargePower = 1.0;
    this.chargeRate = 22.0; // m/s per second, smooth ramp from 1 to 50 in ~2.2 seconds
    this.isThrowingAnim = false;

    // 1. Initialize Scene & 3D Environment
    this.scene = new SimulatorScene(this.canvasContainer);

    // 2. Initialize Third-Person Athlete Character
    this.player = new PlayerController(this.scene.scene, this.scene.camera);
    this.player.setPosition(0, 0, 0);

    // 3. Initialize Modular Third-Person Follow Camera
    this.thirdPersonCamera = new ThirdPersonCamera(this.scene.camera, this.canvasContainer);
    this.thirdPersonCamera.reset(this.player.getPosition());

    // Connect mouse drag, wheel aiming, and charging delegation from camera to app
    this.thirdPersonCamera.setOnAimAdjustment((adj) => {
      if (this.state !== 'AIMING' || this.isThrowingAnim) return;

      // Start holding mouse button to charge power
      if (adj.startCharge) {
        this.startCharging();
        return;
      }

      // Release mouse button to execute throw
      if (adj.releaseCharge) {
        this.releaseAndThrow();
        return;
      }

      const params = this.ui.getParameters();
      let changed = false;

      // Horizontal launch direction: Left mouse drag
      if (adj.deltaAzimuth !== undefined) {
        params.azimuthAngleDeg = ((params.azimuthAngleDeg + adj.deltaAzimuth) % 360 + 360) % 360;
        changed = true;
      }

      // Vertical elevation angle: Up/Down mouse drag
      if (adj.deltaElevation !== undefined) {
        params.elevationAngleDeg = Math.max(5, Math.min(85, params.elevationAngleDeg + adj.deltaElevation));
        changed = true;
      }

      // Initial velocity: Mouse wheel
      if (adj.deltaV0 !== undefined) {
        params.v0 = Math.max(1, Math.min(50, params.v0 + adj.deltaV0));
        changed = true;
      }

      if (changed) {
        this.ui.syncAimParameters(params.azimuthAngleDeg, params.elevationAngleDeg, params.v0);
        this.ui.updatePowerMeter(params.v0, false);
        this.recalculatePhysics();
      }
    });

    // 4. Initialize Projectile Hammer & Trajectory
    this.projectile = new ProjectileHammer(this.scene.scene);

    // 5. Initialize 3D Intuitive Aiming System
    this.aimingSystem = new AimingSystem(this.scene.scene);

    // 5b. Initialize 3D Vector Visualizer (5 dynamic vectors starting from hammer)
    this.vectorVisualizer = new VectorVisualizer(this.scene.scene);

    // 5c. Initialize Educational Experiment Visualizer (Multi-trajectory comparisons)
    this.experimentVisualizer = new ExperimentVisualizer(this.scene.scene);

    // 5d. Initialize Educational Challenge System (Target Distance Scoring)
    this.challengeSystem = new ChallengeSystem(this.scene.scene);
    this.activeTab = 'sim';

    // 6. Initialize UI Controller
    this.ui = new SimulatorUI(this.uiContainer, {
      onParameterChange: (params) => this.handleParameterChange(params),
      onSimulate: () => this.handleSimulate(),
      onToggleVectors: (show) => this.vectorVisualizer.setVisible(show),
      onModeToggle: () => this.handleModeToggle(),
      onReturnToThrowMode: () => this.handleReturnToThrowMode(),
      onStartCharge: () => this.startCharging(),
      onReleaseCharge: () => this.releaseAndThrow(),
      onThrow: () => this.releaseAndThrow(),
      onReset: () => this.handleReset(),
      onResetCamera: () => this.handleResetCamera(),
      onCameraModeChange: (mode) => this.handleCameraModeChange(mode),
      onExperimentPresetChange: (presetKey, configs) => this.handleExperimentPresetChange(presetKey, configs),
      onExperimentParamChange: (configs) => this.handleExperimentParamChange(configs),
      onExperimentRace: () => this.experimentVisualizer.startRace(),
      onChallengeDifficultyChange: (diff) => this.handleChallengeDifficultyChange(diff),
      onChallengeParamChange: (params) => this.handleChallengeParamChange(params),
      onChallengeFire: (params) => this.handleChallengeFire(params),
      onTabChange: (tab) => this.handleTabChange(tab)
    });

    // 7. Start initially in HOLDING state: Hammer attached to hand
    this.enterHoldingMode();

    // 8. Initial physics recalculation
    this.recalculatePhysics();

    // 9. Start Animation Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /**
   * Begins charging throwing power (minimum 1 m/s).
   */
  startCharging() {
    if (this.state !== 'AIMING' || this.isThrowingAnim) return;
    this.isCharging = true;
    this.chargePower = 1.0;
    this.ui.syncAimParameters(undefined, undefined, this.chargePower);
    this.ui.updatePowerMeter(this.chargePower, true);
    this.player.setCharging(true, 0);
    this.recalculatePhysics();
  }

  /**
   * Releases charging button, freezes final velocity, plays throwing animation,
   * and launches hammer at forward swing apex.
   */
  releaseAndThrow() {
    if (this.state !== 'AIMING' || this.isThrowingAnim) return;

    // 1. Calculate final velocity (clamped 1 to 50 m/s)
    const finalV0 = this.isCharging
      ? Math.max(1.0, Math.min(50.0, this.chargePower))
      : this.ui.getParameters().v0;

    this.isCharging = false;
    this.isThrowingAnim = true;
    this.player.setCharging(false, 0);

    // 2. Sync final velocity to UI and recalculate physics
    this.ui.syncAimParameters(undefined, undefined, finalV0);
    this.ui.updatePowerMeter(finalV0, false);
    this.recalculatePhysics();

    // 3. Play realistic throwing animation with exact apex release callback
    this.player.playThrowAnimation(() => {
      this.executeThrowLaunch();
    });
  }

  /**
   * Detaches hammer from athlete hand and starts projectile simulation.
   */
  executeThrowLaunch() {
    if (this.state !== 'AIMING' || !this.currentAnalysis) return;

    this.state = 'THROWING';
    this.isThrowingAnim = false;

    // 1. Release hammer from hand into world coordinates
    this.player.releaseFromHand(this.projectile.hammerGroup);

    // 2. Deactivate aiming indicators and camera aim mode
    this.thirdPersonCamera.setAimMode(false);
    this.aimingSystem.setVisible(false);

    // 3. Start projectile physics flight
    this.projectile.setThrowingMode();
    this.simTime = 0;
    this.lastTimestamp = performance.now();
    this.ui.setState('THROWING');
  }

  /**
   * Recalculates projectile trajectory based on current UI parameters and player launch socket.
   * Real-time updates:
   * 1. Horizontal direction indicator (Azimuth)
   * 2. Vertical elevation indicator (Protractor arc)
   * 3. Visible aiming arrow
   * 4. Initial velocity vector
   * 5. Predicted trajectory arc
   * 6. Predicted landing point
   */
  recalculatePhysics() {
    const params = this.ui.getParameters();
    const playerPos = this.player.getPosition();
    const releasePos = this.player.getReleasePosition();

    // Orient character towards launch azimuth if aiming
    if (this.state === 'AIMING') {
      const radAzimuth = (params.azimuthAngleDeg * Math.PI) / 180;
      this.player.setFacingAngle(Math.PI / 2 - radAzimuth);
    }

    // Physics analysis from release origin
    this.currentAnalysis = analyzeProjectileMotion({
      initialPos: {
        x: releasePos.x,
        y: releasePos.y,
        z: releasePos.z
      },
      v0: params.v0,
      elevationAngleDeg: params.elevationAngleDeg,
      azimuthAngleDeg: params.azimuthAngleDeg,
      gravity: params.gravity,
      groundY: 0
    });

    // 5. Predicted Projectile Trajectory
    const points = generateTrajectoryPoints(this.currentAnalysis, 100);
    this.projectile.setTrajectory(this.currentAnalysis, points, releasePos);

    // 1-4. 3D Aiming Indicators & Vector Visualizer
    if (this.state === 'AIMING') {
      this.projectile.setAimMode(releasePos);
      this.aimingSystem.update(
        playerPos,
        releasePos,
        params.azimuthAngleDeg,
        params.elevationAngleDeg,
        params.v0
      );
      this.vectorVisualizer.update(releasePos, this.currentAnalysis, 0, false, 'AIMING');
    } else if (this.state === 'HOLDING') {
      this.projectile.setHoldingMode();
      this.aimingSystem.setVisible(false);
      this.vectorVisualizer.update(null, null, 0, false, 'HOLDING');
    }

    // Update Telemetry & Coordinates in UI
    this.ui.updateAnalysisStats(this.currentAnalysis);
  }

  /**
   * Enters the HOLDING state:
   * - Attach hammer to athlete hand socket.
   * - Hammer follows player movement and body orientation.
   * - Normal movement is enabled.
   * - Trajectory and aiming indicators hidden.
   */
  enterHoldingMode() {
    this.state = 'HOLDING';
    this.isCharging = false;
    this.isThrowingAnim = false;
    this.player.setCharging(false, 0);
    this.player.attachToHand(this.projectile.hammerGroup);
    this.player.setAiming(false);
    this.thirdPersonCamera.setAimMode(false);
    this.aimingSystem.setVisible(false);
    this.vectorVisualizer.update(null, null, 0, false, 'HOLDING');
    this.projectile.setHoldingMode();
    this.ui.setState('HOLDING');
  }

  /**
   * Enters the AIMING / THROW MODE state:
   * - Stop normal player movement.
   * - Lock athlete in throwing stance.
   * - Enable 3D Aiming System (horizontal ring, elevation protractor, aim arrow, v0 vector).
   * - Enable mouse and keyboard aiming controls.
   */
  enterAimMode() {
    this.state = 'AIMING';
    this.isCharging = false;
    this.isThrowingAnim = false;
    this.player.setCharging(false, 0);
    this.player.setAiming(true);
    this.thirdPersonCamera.setAimMode(true);
    this.aimingSystem.setVisible(true);

    const params = this.ui.getParameters();
    const radAzimuth = (params.azimuthAngleDeg * Math.PI) / 180;
    this.player.setFacingAngle(Math.PI / 2 - radAzimuth);

    const releasePos = this.player.getReleasePosition();
    this.recalculatePhysics();
    this.projectile.setAimMode(releasePos);
    this.vectorVisualizer.update(releasePos, this.currentAnalysis, 0, false, 'AIMING');
    this.ui.setState('AIMING');
    this.ui.updatePowerMeter(params.v0, false);
  }

  /**
   * Handles toggle button click:
   * - If HOLDING -> enters AIM MODE
   * - If AIMING -> cancels and returns to HOLDING
   * - If LANDED -> returns to THROW MODE to prepare another throw
   */
  handleModeToggle() {
    if (this.state === 'HOLDING') {
      this.enterAimMode();
    } else if (this.state === 'AIMING') {
      this.enterHoldingMode();
    } else if (this.state === 'LANDED') {
      this.handleReturnToThrowMode();
    }
  }

  /**
   * Primary Simulation Trigger (SIMULATE):
   * 1. Calculates the projectile parameters.
   * 2. Resets the hammer to the launch position.
   * 3. Shows the predicted trajectory.
   * 4. Shows the predicted landing point.
   * 5. Starts the animation.
   * 6. Moves the hammer according to the physics equations.
   * 7. Updates all vectors in real time.
   * 8. Updates the real-time physics panel.
   * 9. Stops the animation when the hammer reaches ground level.
   * 10. Marks the actual landing point.
   */
  handleSimulate() {
    // Prevent multiple simulations from running simultaneously
    if (this.isSimulating) return;

    // If athlete had walked away or landed from previous throw, reset athlete to launch platform
    if (this.state === 'LANDED' || this.player.getPosition().lengthSq() > 0.05) {
      this.player.setPosition(0, 0, 0);
      this.player.velocity.set(0, 0, 0);
      const params = this.ui.getParameters();
      const radAzimuth = (params.azimuthAngleDeg * Math.PI) / 180;
      this.player.setFacingAngle(Math.PI / 2 - radAzimuth);
      this.thirdPersonCamera.reset(this.player.getPosition());
    }

    // 1. Calculate projectile parameters
    this.recalculatePhysics();
    if (!this.currentAnalysis) return;

    // 2. Reset hammer to launch position
    this.simTime = 0;
    this.player.attachToHand(this.projectile.hammerGroup);
    const releasePos = this.player.getReleasePosition();

    // 3. Show predicted trajectory
    // 4. Show predicted landing point
    const points = generateTrajectoryPoints(this.currentAnalysis, 100);
    this.projectile.setTrajectory(this.currentAnalysis, points, releasePos);

    // 5. Start animation
    this.isSimulating = true;
    this.state = 'THROWING';
    this.ui.setState('THROWING');
    this.ui.setSimulatingState(true);
    this.thirdPersonCamera.setAimMode(false);
    this.aimingSystem.setVisible(false);

    // Detach hammer from athlete hand into flight
    this.player.releaseFromHand(this.projectile.hammerGroup);
    this.projectile.setThrowingMode();
    this.vectorVisualizer.update(releasePos, this.currentAnalysis, 0, true, 'THROWING');
  }

  /**
   * Returns player to Throw Mode to prepare another throw:
   * Re-attaches hammer to player's hand and enters AIM MODE.
   */
  handleReturnToThrowMode() {
    this.isSimulating = false;
    this.simTime = 0;
    this.player.attachToHand(this.projectile.hammerGroup);
    this.enterAimMode();
  }

  /**
   * Legacy throw trigger: redirects to releaseAndThrow.
   */
  handleThrow() {
    this.releaseAndThrow();
  }

  /**
   * Enters the LANDED state:
   * - Keeps hammer resting at the landing position on ground.
   * - Displays final landing telemetry and coordinates.
   * - Returns player to normal movement mode so athlete can walk toward and inspect the hammer.
   * - Keeps landing marker visible.
   */
  enterLandedMode() {
    this.state = 'LANDED';
    this.isSimulating = false;
    this.ui.setSimulatingState(false);
    this.thirdPersonCamera.setAimMode(false);
    this.aimingSystem.setVisible(false);
    this.projectile.setLandedMode();
    this.vectorVisualizer.update(null, null, 0, false, 'LANDED');
    this.player.setAiming(false); // Player returns to normal movement mode!

    if (this.currentAnalysis) {
      const impactVel = getVelocityAtTime(
        this.currentAnalysis.flightTime,
        this.currentAnalysis.initialVel,
        this.currentAnalysis.gravity
      );
      this.ui.freezeLandedPhysics(this.currentAnalysis, impactVel);

      // Display distance between player and hammer
      const dist = this.player.getDistanceTo(this.currentAnalysis.landingPos);
      this.ui.updatePlayerDistance(dist);

      // If in Challenge mode, evaluate hit against 3D target
      if (this.activeTab === 'challenge') {
        const evalResult = this.challengeSystem.evaluateHit(
          this.currentAnalysis.landingPos,
          this.currentAnalysis.initialPos,
          this.currentAnalysis
        );
        this.ui.updateChallengeEvaluation(evalResult);
      }
    }

    this.ui.setState('LANDED');
  }


  /**
   * Resets simulation and returns player and hammer to origin in HOLDING state.
   */
  handleReset() {
    this.isSimulating = false;
    this.simTime = 0;
    this.player.setPosition(0, 0, 0);
    this.player.velocity.set(0, 0, 0);
    this.enterHoldingMode();
    this.recalculatePhysics();
    this.thirdPersonCamera.reset(this.player.getPosition());
    this.ui.setSimulatingState(false);
  }

  /**
   * Resets camera view behind the athlete.
   */
  handleResetCamera() {
    this.thirdPersonCamera.reset(this.player.getPosition());
  }

  /**
   * Handles user adjusting launch parameters:
   * Automatically updates trajectory, indicators, and aligns athlete facing azimuth.
   */
  handleParameterChange(params) {
    if (this.isSimulating) {
      // Do not interrupt active flight simulation
      return;
    }

    if (this.state === 'HOLDING') {
      this.enterAimMode();
    } else {
      this.recalculatePhysics();
    }
  }

  /**
   * Handles switching to a different experiment preset (Angle, Velocity, Gravity).
   * @param {'angle'|'velocity'|'gravity'} presetKey
   * @param {Array<Object>} configs
   */
  handleExperimentPresetChange(presetKey, configs) {
    if (this.activeTab !== 'exp') return;
    const releasePos = this.player.getReleasePosition();
    const analyses = this.experimentVisualizer.renderTrajectories(configs, releasePos);
    this.ui.updateExperimentTable(analyses);
  }

  /**
   * Handles user adjusting constant parameters in Experiment Mode.
   * @param {Array<Object>} configs
   */
  handleExperimentParamChange(configs) {
    if (this.activeTab !== 'exp') return;
    const releasePos = this.player.getReleasePosition();
    const analyses = this.experimentVisualizer.renderTrajectories(configs, releasePos);
    this.ui.updateExperimentTable(analyses);
  }

  /**
   * Handles camera view mode switching (DEFAULT, FOLLOW_HAMMER, TOP_VIEW, SIDE_VIEW).
   * @param {'DEFAULT'|'FOLLOW_HAMMER'|'TOP_VIEW'|'SIDE_VIEW'} mode
   */
  handleCameraModeChange(mode) {
    this.thirdPersonCamera.setCameraMode(mode);
  }

  /**
   * Handles challenge difficulty preset change.
   * @param {'easy'|'medium'|'hard'|'random'} diff
   */
  handleChallengeDifficultyChange(diff) {
    this.challengeSystem.setDifficulty(diff);
    this.ui.setChallengeTarget(this.challengeSystem.targetDistance);
    this.recalculatePhysics();
  }

  /**
   * Handles challenge launch parameter slider changes.
   */
  handleChallengeParamChange(params) {
    this.ui.syncAimParameters(0, params.elevationAngleDeg, params.v0);
    this.recalculatePhysics();
  }

  /**
   * Handles Challenge mode "FIRE AT TARGET" action button.
   */
  handleChallengeFire(params) {
    this.ui.syncAimParameters(0, params.elevationAngleDeg, params.v0);
    this.handleSimulate();
  }

  /**
   * Switches view between Simulation Mode, Educational Experiment Mode, and Challenge Mode.
   * @param {'sim'|'exp'|'challenge'} tab
   */
  handleTabChange(tab) {
    this.activeTab = tab;
    if (tab === 'exp') {
      this.challengeSystem.setVisible(false);
      // 1. Reset athlete position to launch platform as instructor
      this.player.setPosition(0, 0, 0);
      this.player.velocity.set(0, 0, 0);
      this.player.setAiming(false);
      this.player.setCharging(false, 0);
      this.player.setFacingAngle(0);
      this.player.attachToHand(this.projectile.hammerGroup);

      // 2. Hide single-simulation indicators
      this.thirdPersonCamera.setAimMode(false);
      this.aimingSystem.setVisible(false);
      this.vectorVisualizer.setVisible(false);
      if (this.projectile.trajectoryLine) this.projectile.trajectoryLine.visible = false;
      if (this.projectile.trajectoryTube) this.projectile.trajectoryTube.visible = false;
      if (this.projectile.landingMarker) this.projectile.landingMarker.visible = false;

      // 3. Render multi-trajectory curves in 3D
      const configs = this.ui.getExperimentTrajectoriesConfig();
      const releasePos = this.player.getReleasePosition();
      const analyses = this.experimentVisualizer.renderTrajectories(configs, releasePos);
      this.ui.updateExperimentTable(analyses);
      this.experimentVisualizer.setVisible(true);

      // 4. Position camera for broad educational comparison
      this.thirdPersonCamera.reset(this.player.getPosition());
      this.thirdPersonCamera.distance = 12.0;
      this.thirdPersonCamera.pitch = 0.35;
    } else if (tab === 'challenge') {
      this.experimentVisualizer.setVisible(false);
      this.challengeSystem.setVisible(true);
      this.ui.setChallengeTarget(this.challengeSystem.targetDistance);
      this.enterHoldingMode();
      this.recalculatePhysics();
      this.thirdPersonCamera.reset(this.player.getPosition());
      this.thirdPersonCamera.distance = 9.0;
      this.thirdPersonCamera.pitch = 0.32;
    } else {
      // Return to standard simulation mode
      this.experimentVisualizer.setVisible(false);
      this.challengeSystem.setVisible(false);
      this.enterHoldingMode();
      this.recalculatePhysics();
      this.thirdPersonCamera.reset(this.player.getPosition());
      this.thirdPersonCamera.distance = 5.8;
      this.thirdPersonCamera.pitch = 0.32;
    }
  }

  /**
   * Main per-frame animation and update loop.
   * @param {number} timestamp
   */
  animate(timestamp) {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;

    // 1. Update Player Character Movement & Kinematics
    this.player.update(deltaTime);
    const currPlayerPos = this.player.getPosition();

    // 2. Third-Person Follow Camera tracks player/hammer/trajectory
    this.thirdPersonCamera.update(
      deltaTime,
      currPlayerPos,
      this.projectile.hammerGroup ? this.projectile.hammerGroup.position : null,
      this.currentAnalysis
    );

    // 3. State-Specific Frame Logic
    if (this.state === 'HOLDING') {
      // Hammer is attached in handSocket and moves naturally with body
      // Recalculate trajectory so curve continuously originates from athlete hand as they move
      if (this.player.velocity.lengthSq() > 0.01) {
        this.recalculatePhysics();
      }
    } else if (this.state === 'AIMING') {
      const params = this.ui.getParameters();
      const releasePos = this.player.getReleasePosition();


      if (this.isCharging) {
        // Continuous power charge accumulation while left mouse / space button is held
        this.chargePower = Math.min(50.0, this.chargePower + this.chargeRate * deltaTime);
        this.ui.syncAimParameters(undefined, undefined, this.chargePower);
        this.ui.updatePowerMeter(this.chargePower, true);
        const ratio = (this.chargePower - 1.0) / 49.0;
        this.player.setCharging(true, ratio);
        this.recalculatePhysics(); // Continuously update trajectory while charging!
      } else if (!this.isThrowingAnim) {
        // Continuous keyboard aiming controls while in THROW MODE:
        // - A / D: Horizontal launch direction (Azimuth 0° to 360°)
        // - W / S: Elevation angle (5° to 85°)
        const aimRate = 55.0; // degrees per second
        let keyAimChanged = false;

        // Horizontal launch direction: A / D or Left / Right arrow keys
        if (this.player.keys.left) {
          params.azimuthAngleDeg = ((params.azimuthAngleDeg - aimRate * deltaTime) % 360 + 360) % 360;
          keyAimChanged = true;
        }
        if (this.player.keys.right) {
          params.azimuthAngleDeg = ((params.azimuthAngleDeg + aimRate * deltaTime) % 360 + 360) % 360;
          keyAimChanged = true;
        }

        // Vertical elevation angle: W / S or Up / Down arrow keys
        if (this.player.keys.forward) { // W increases elevation
          params.elevationAngleDeg = Math.min(85, params.elevationAngleDeg + (aimRate * 0.75) * deltaTime);
          keyAimChanged = true;
        }
        if (this.player.keys.backward) { // S decreases elevation
          params.elevationAngleDeg = Math.max(5, params.elevationAngleDeg - (aimRate * 0.75) * deltaTime);
          keyAimChanged = true;
        }

        if (keyAimChanged) {
          this.ui.syncAimParameters(params.azimuthAngleDeg, params.elevationAngleDeg, params.v0);
          this.recalculatePhysics();
        } else {
          // Smoothly update 3D aiming indicators to follow athlete posture
          this.aimingSystem.update(
            currPlayerPos,
            releasePos,
            params.azimuthAngleDeg,
            params.elevationAngleDeg,
            params.v0
          );
        }
      }
    } else if (this.state === 'THROWING' && this.currentAnalysis) {
      this.simTime += deltaTime;
      const totalFlightTime = this.currentAnalysis.flightTime;

      // Update simulation time progress indicator
      this.ui.updateSimulationProgress(this.simTime, totalFlightTime);

      if (this.simTime >= totalFlightTime) {
        this.simTime = totalFlightTime;
        this.isSimulating = false;
        this.ui.setSimulatingState(false);
        this.ui.updateSimulationProgress(totalFlightTime, totalFlightTime);

        // 9. Stop the animation when the hammer reaches ground level
        this.projectile.update(this.simTime, true);

        // 10. Mark the actual landing point
        this.enterLandedMode();
      } else {
        // 6. Move hammer according to physics equations
        this.projectile.update(this.simTime, true);

        // 7. Update all vectors in real time
        this.vectorVisualizer.update(
          this.projectile.hammerGroup.position,
          this.currentAnalysis,
          this.simTime,
          true,
          'THROWING'
        );

        // 8. Update real-time physics panel
        const currentPos = getPositionAtTime(
          this.simTime,
          this.currentAnalysis.initialPos,
          this.currentAnalysis.initialVel,
          this.currentAnalysis.gravity
        );
        const currentVel = getVelocityAtTime(
          this.simTime,
          this.currentAnalysis.initialVel,
          this.currentAnalysis.gravity
        );

        const vHorizontal = Math.sqrt(currentVel.vx * currentVel.vx + currentVel.vz * currentVel.vz);
        const azimuthDeg = ((Math.atan2(currentVel.vz, currentVel.vx) * 180 / Math.PI) % 360 + 360) % 360;
        const elevationDeg = (Math.atan2(currentVel.vy, vHorizontal) * 180 / Math.PI);

        // Update Real-Time Physics Information Panel every animation frame (rounded to 2 decimal places)
        this.ui.updateRealtimePhysics(
          this.simTime,
          currentPos,
          currentVel,
          this.currentAnalysis.gravity,
          azimuthDeg,
          elevationDeg
        );
      }
    } else if (this.state === 'LANDED' && this.currentAnalysis) {
      // Player is walking around freely: continuously update distance to landed hammer
      const dist = this.player.getDistanceTo(this.currentAnalysis.landingPos);
      this.ui.updatePlayerDistance(dist);
      // Allows approaching, walking around, and inspecting the hammer without auto-pickup interruption
    }


    // 4. Subtle wind wave animation for the landing marker's pennant flag
    if (this.projectile.pennantFlag) {
      this.projectile.pennantFlag.rotation.y = Math.sin((timestamp / 1000) * 4.5) * 0.22;
    }

    // 4b. Update Educational Experiment race animation if in Experiment mode
    if (this.activeTab === 'exp') {
      this.experimentVisualizer.update(deltaTime);
    }

    // 4c. Update Educational Challenge flag animation if in Challenge mode
    if (this.activeTab === 'challenge') {
      this.challengeSystem.update(timestamp / 1000);
    }

    // 5. Render Scene
    this.scene.render();
  }
}


// Bootstrap once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new ProjectileApp();
});
