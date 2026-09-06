/**
 * ============================================================================
 * 3D Projectile Motion Physics Engine
 * ============================================================================
 * 
 * Independent, numerically stable physics engine for ideal projectile motion
 * under uniform gravity without air resistance.
 * 
 * Coordinate System (SI Units: meters, seconds, m/s, m/s^2):
 * - X: Horizontal axis (forward / lateral)
 * - Y: Vertical axis (altitude / height, +Y points upward, ground at y = 0)
 * - Z: Horizontal axis (depth / lateral)
 * 
 * Standard Equations:
 * 1. Initial Velocity:
 *    v_0x = v_0 * cos(theta) * cos(phi)
 *    v_0y = v_0 * sin(theta)
 *    v_0z = v_0 * cos(theta) * sin(phi)
 *    where theta = elevation angle (pitch), phi = launch/azimuth angle (yaw)
 * 
 * 2. Acceleration:
 *    a_x = 0
 *    a_y = -g
 *    a_z = 0
 * 
 * 3. Velocity as a function of time:
 *    v_x(t) = v_0x
 *    v_y(t) = v_0y - g * t
 *    v_z(t) = v_0z
 * 
 * 4. Position as a function of time:
 *    x(t) = x_0 + v_0x * t
 *    y(t) = y_0 + v_0y * t - 0.5 * g * t^2
 *    z(t) = z_0 + v_0z * t
 * 
 * 5. Time of Flight (to ground level y = groundY):
 *    0.5 * g * t^2 - v_0y * t - (y_0 - groundY) = 0
 *    t_flight = (v_0y + sqrt(v_0y^2 + 2 * g * (y_0 - groundY))) / g
 * 
 * 6. Maximum Height:
 *    H_max = y_0 + (v_0y^2) / (2 * g)  (if v_0y > 0, else y_0)
 * 
 * 7. Horizontal Range:
 *    R = sqrt( (x_land - x_0)^2 + (z_land - z_0)^2 ) = v_0_horizontal * t_flight
 * ============================================================================
 */

/**
 * Converts degrees to radians.
 * @param {number} deg - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 * @param {number} rad - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

/**
 * 1. Calculate Initial Velocity Vector.
 * 
 * @param {number} v0 - Initial speed magnitude (m/s)
 * @param {number} elevationAngleDeg - Elevation angle above horizontal (degrees, theta)
 * @param {number} [azimuthAngleDeg=0] - Horizontal launch angle / heading (degrees, phi, 0 = along +X)
 * @returns {{ x: number, y: number, z: number, v0Horizontal: number }} Initial velocity components
 */
export function calculateInitialVelocity(v0, elevationAngleDeg, azimuthAngleDeg = 0) {
  const theta = degToRad(elevationAngleDeg);
  const phi = degToRad(azimuthAngleDeg);

  // Horizontal speed magnitude on the XZ ground plane
  const v0Horizontal = v0 * Math.cos(theta);

  // Separation into X, Y, Z components
  const vx = v0Horizontal * Math.cos(phi);
  const vy = v0 * Math.sin(theta);
  const vz = v0Horizontal * Math.sin(phi);

  return {
    x: vx,
    y: vy,
    z: vz,
    vx,
    vy,
    vz,
    v0Horizontal: Math.abs(v0Horizontal)
  };
}

/**
 * 2. Position as a function of time.
 * r(t) = r_0 + v_0 * t + 0.5 * a * t^2
 * 
 * @param {number} t - Elapsed time (seconds)
 * @param {{ x: number, y: number, z: number }} initialPos - Initial position (m)
 * @param {{ x: number, y: number, z: number }} initialVel - Initial velocity (m/s)
 * @param {number} [gravity=9.8] - Acceleration due to gravity (m/s^2)
 * @returns {{ x: number, y: number, z: number }} Position at time t
 */
export function getPositionAtTime(t, initialPos, initialVel, gravity = 9.8) {
  if (t < 0) t = 0;
  const vx = initialVel.x !== undefined ? initialVel.x : (initialVel.vx || 0);
  const vy = initialVel.y !== undefined ? initialVel.y : (initialVel.vy || 0);
  const vz = initialVel.z !== undefined ? initialVel.z : (initialVel.vz || 0);
  return {
    x: initialPos.x + vx * t,
    y: initialPos.y + vy * t - 0.5 * gravity * t * t,
    z: initialPos.z + vz * t
  };
}

/**
 * 3. Velocity as a function of time.
 * v(t) = v_0 + a * t
 * 
 * @param {number} t - Elapsed time (seconds)
 * @param {{ x: number, y: number, z: number }} initialVel - Initial velocity (m/s)
 * @param {number} [gravity=9.8] - Acceleration due to gravity (m/s^2)
 * @returns {{ x: number, y: number, z: number, vx: number, vy: number, vz: number, speed: number }} Velocity components and speed at time t
 */
export function getVelocityAtTime(t, initialVel, gravity = 9.8) {
  if (t < 0) t = 0;
  const vx0 = initialVel.x !== undefined ? initialVel.x : (initialVel.vx || 0);
  const vy0 = initialVel.y !== undefined ? initialVel.y : (initialVel.vy || 0);
  const vz0 = initialVel.z !== undefined ? initialVel.z : (initialVel.vz || 0);

  const vx = vx0;
  const vy = vy0 - gravity * t;
  const vz = vz0;
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

  return {
    x: vx,
    y: vy,
    z: vz,
    vx,
    vy,
    vz,
    speed
  };
}

/**
 * 4. Acceleration due to gravity.
 * Ideal projectile motion has zero horizontal acceleration.
 * 
 * @param {number} [gravity=9.8] - Magnitude of gravitational acceleration (m/s^2)
 * @returns {{ x: number, y: number, z: number }} Acceleration vector (m/s^2)
 */
export function getAcceleration(gravity = 9.8) {
  return {
    x: 0,
    y: -Math.abs(gravity),
    z: 0
  };
}

/**
 * 5. Flight time until the projectile reaches ground level.
 * Derived from quadratic formula on y(t) = groundY:
 * 0.5 * g * t^2 - v0y * t - (y0 - groundY) = 0
 * 
 * @param {number} initialY - Initial vertical position (m)
 * @param {number} v0y - Initial vertical velocity component (m/s)
 * @param {number} [gravity=9.8] - Gravity (m/s^2)
 * @param {number} [groundY=0] - Ground elevation level (m)
 * @returns {number} Total flight time in seconds (returns 0 if already below or invalid)
 */
export function calculateFlightTime(initialY, v0y, gravity = 9.8, groundY = 0) {
  const g = Math.abs(gravity);
  if (g <= 0) return 0;

  const deltaY = initialY - groundY;
  
  // If already below or at ground with downward/zero velocity
  if (deltaY <= 0 && v0y <= 0) {
    return 0;
  }

  // Discriminant: b^2 - 4ac -> v0y^2 + 2 * g * deltaY
  const discriminant = v0y * v0y + 2 * g * deltaY;
  
  if (discriminant < 0) {
    return 0; // Does not intersect ground level
  }

  // Numerically stable positive root:
  return (v0y + Math.sqrt(discriminant)) / g;
}

/**
 * 6. Maximum height reached during flight.
 * Peak occurs when vy(t) = 0 => t_peak = v0y / g.
 * H_max = y0 + v0y^2 / (2 * g)
 * 
 * @param {number} initialY - Initial vertical position (m)
 * @param {number} v0y - Initial vertical velocity (m/s)
 * @param {number} [gravity=9.8] - Gravity (m/s^2)
 * @returns {{ maxHeight: number, timeToPeak: number }} Maximum height and time to reach it
 */
export function calculateMaxHeight(initialY, v0y, gravity = 9.8) {
  const g = Math.abs(gravity);
  if (g <= 0 || v0y <= 0) {
    return {
      maxHeight: initialY,
      timeToPeak: 0
    };
  }

  const timeToPeak = v0y / g;
  const maxHeight = initialY + (v0y * v0y) / (2 * g);

  return {
    maxHeight,
    timeToPeak
  };
}

/**
 * 7. Horizontal range traveled over the flight duration.
 * Range = v_horizontal * t_flight
 * 
 * @param {{ x: number, y: number, z: number }} initialVel - Initial velocity (m/s)
 * @param {number} flightTime - Duration of flight (s)
 * @returns {number} Horizontal distance traveled in meters
 */
export function calculateHorizontalRange(initialVel, flightTime) {
  if (flightTime <= 0) return 0;
  const vHorizontal = Math.sqrt(initialVel.x * initialVel.x + initialVel.z * initialVel.z);
  return vHorizontal * flightTime;
}

/**
 * 8. Predicted landing position at the end of flight.
 * 
 * @param {{ x: number, y: number, z: number }} initialPos - Initial position (m)
 * @param {{ x: number, y: number, z: number }} initialVel - Initial velocity (m/s)
 * @param {number} flightTime - Duration of flight (s)
 * @param {number} [groundY=0] - Ground plane elevation (m)
 * @returns {{ x: number, y: number, z: number }} Predicted landing coordinates (m)
 */
export function calculateLandingPosition(initialPos, initialVel, flightTime, groundY = 0) {
  return {
    x: initialPos.x + initialVel.x * flightTime,
    y: groundY,
    z: initialPos.z + initialVel.z * flightTime
  };
}

/**
 * Comprehensive projectile motion analysis.
 * Solves all parameters and returns a complete, immutable telemetry packet.
 * 
 * @param {Object} config - Configuration parameters
 * @param {{ x: number, y: number, z: number }} [config.initialPos={ x: 0, y: 0, z: 0 }]
 * @param {number} config.v0 - Initial speed (m/s)
 * @param {number} config.elevationAngleDeg - Launch angle above horizontal (degrees)
 * @param {number} [config.azimuthAngleDeg=0] - Heading angle on ground plane (degrees)
 * @param {number} [config.gravity=9.8] - Gravity (m/s^2)
 * @param {number} [config.groundY=0] - Ground elevation (m)
 * @returns {Object} Complete trajectory physics summary
 */
export function analyzeProjectileMotion({
  initialPos = { x: 0, y: 0, z: 0 },
  v0 = 25,
  elevationAngleDeg = 45,
  azimuthAngleDeg = 0,
  gravity = 9.8,
  groundY = 0
}) {
  const initialVel = calculateInitialVelocity(v0, elevationAngleDeg, azimuthAngleDeg);
  const flightTime = calculateFlightTime(initialPos.y, initialVel.y, gravity, groundY);
  const { maxHeight, timeToPeak } = calculateMaxHeight(initialPos.y, initialVel.y, gravity);
  const horizontalRange = calculateHorizontalRange(initialVel, flightTime);
  const landingPos = calculateLandingPosition(initialPos, initialVel, flightTime, groundY);
  const landingVel = getVelocityAtTime(flightTime, initialVel, gravity);

  return {
    initialPos,
    initialVel,
    v0,
    elevationAngleDeg,
    azimuthAngleDeg,
    gravity,
    groundY,
    flightTime,
    maxHeight,
    timeToPeak,
    horizontalRange,
    landingPos,
    landingSpeed: landingVel.speed,
    landingImpactAngleDeg: radToDeg(Math.atan2(Math.abs(landingVel.y), initialVel.v0Horizontal))
  };
}

/**
 * Generates an array of 3D sample points along the entire trajectory.
 * Suitable for rendering trajectory curves/lines in 3D.
 * 
 * @param {Object} analysis - Output from analyzeProjectileMotion
 * @param {number} [samples=80] - Number of subdivisions along the path
 * @returns {Array<{ x: number, y: number, z: number, t: number }>}
 */
export function generateTrajectoryPoints(analysis, samples = 80) {
  const points = [];
  const totalTime = analysis.flightTime;
  
  if (totalTime <= 0) {
    points.push({ ...analysis.initialPos, t: 0 });
    return points;
  }

  const dt = totalTime / samples;
  for (let i = 0; i <= samples; i++) {
    const t = i === samples ? totalTime : i * dt;
    const pos = getPositionAtTime(t, analysis.initialPos, analysis.initialVel, analysis.gravity);
    points.push({
      x: pos.x,
      y: Math.max(analysis.groundY, pos.y),
      z: pos.z,
      t
    });
  }

  return points;
}
