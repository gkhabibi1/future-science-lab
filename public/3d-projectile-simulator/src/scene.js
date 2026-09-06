import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Scene Manager for 3D Projectile Motion Simulator.
 * Sets up the WebGLRenderer, PerspectiveCamera, OrbitControls,
 * Ground Plane, Grid Helper, Coordinate Axes, and Basic Lighting.
 */
export class SimulatorScene {
  /**
   * @param {HTMLElement} container - DOM element containing the WebGL canvas
   */
  constructor(container) {
    this.container = container;
    
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.007);

    // 2. Camera: Third-person viewpoint framing the athlete
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(-5, 3.5, 7);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls (Disabled by default as ThirdPersonCamera manages orbital tracking)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 1.4, 0);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.01;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 250;

    // 5. Lighting
    this.setupLighting();

    // 6. Ground & Grid
    this.setupGround();

    // 7. Coordinate Axes
    this.setupAxes();

    // Handle Window Resize and Container Dimension Changes
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => this.onWindowResize());
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * Configures directional, ambient, and hemisphere lighting.
   */
  setupLighting() {
    // Ambient light for ambient visibility
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.45);
    this.scene.add(ambientLight);

    // Hemisphere light simulating sky dome & ground reflection
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.4);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Key Directional Light with soft shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 45, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Subtle rim light
    const rimLight = new THREE.DirectionalLight(0x818cf8, 0.4);
    rimLight.position.set(-20, 20, -20);
    this.scene.add(rimLight);
  }

  /**
   * Creates a 3D ground plane and precision grid.
   */
  setupGround() {
    // Ground Mesh
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0e1726,
      roughness: 0.85,
      metalness: 0.15
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Main Grid (1 meter minor, 10 meter major steps)
    const gridHelper = new THREE.GridHelper(200, 100, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // Range distance markers along +X axis
    this.createDistanceMarkers();
  }

  /**
   * Distance reference tick lines on the ground along the primary launch axis (+X).
   */
  createDistanceMarkers() {
    const markerGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.5 });

    for (let x = 10; x <= 150; x += 10) {
      const points = [
        new THREE.Vector3(x, 0.02, -2),
        new THREE.Vector3(x, 0.02, 2)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      markerGroup.add(line);
    }

    this.scene.add(markerGroup);
  }

  /**
   * Sets up 3D coordinate axes helper.
   */
  setupAxes() {
    // Coordinate Axes Helper (X = Red, Y = Green, Z = Blue)
    const axesHelper = new THREE.AxesHelper(10);
    axesHelper.position.set(0, 0.05, 0);
    axesHelper.renderOrder = 1;
    this.scene.add(axesHelper);
  }

  /**
   * Window resize handler.
   */
  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Updates controls damping and smooth camera follow.
   * @param {THREE.Vector3} [deltaMove] - Vector displacement of the player this frame
   */
  update(deltaMove) {
    if (this.controls && this.controls.enabled) {
      if (deltaMove && deltaMove.lengthSq() > 0.00001) {
        this.camera.position.add(deltaMove);
        this.controls.target.add(deltaMove);
      }
      this.controls.update();
    }
  }

  /**
   * Renders the current frame.
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Helper to reset camera viewpoint to third-person view around player.
   */
  resetCamera(target = new THREE.Vector3(0, 1.4, 0)) {
    this.camera.position.set(target.x - 5, target.y + 2.5, target.z + 6);
    this.controls.target.copy(target);
    this.controls.update();
  }

  /**
   * Disposes renderer and event listeners.
   */
  dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
