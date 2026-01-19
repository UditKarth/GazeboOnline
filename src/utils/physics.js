import * as THREE from 'three';

/**
 * Physics engine for rover movement
 * Updates position and rotation based on velocity commands
 * Implements friction and ROS2 watchdog behavior
 */

const FRICTION_COEFFICIENT = 0.95; // Velocity decay per frame
const WATCHDOG_TIMEOUT = 500; // ms (ROS2 standard)
const MAX_LINEAR_VELOCITY = 2.0; // m/s
const MAX_ANGULAR_VELOCITY = 1.5; // rad/s
const DISTANCE_SENSOR_RANGE = 5.0; // meters
const DISTANCE_SENSOR_UPDATE_RATE = 10; // Hz

let lastDistanceUpdate = 0;

/**
 * Update rover physics based on velocity commands
 * @param {Object} robotStore - Zustand store instance
 * @param {number} deltaTime - Time since last frame in seconds
 */
export function updateRoverPhysics(robotStore, deltaTime) {
  const state = robotStore.getState();
  
  if (state.robotType !== 'rover') return;

  let { velocity, position, rotation, lastCommandTime } = state;
  let { vx, wz } = velocity;

  // Apply watchdog: if no command for 500ms, stop the robot
  const now = Date.now();
  if (lastCommandTime && (now - lastCommandTime) > WATCHDOG_TIMEOUT) {
    vx = 0;
    wz = 0;
    robotStore.setVelocity(0, 0);
  }

  // Apply friction (gradual velocity decay)
  if (vx !== 0 || wz !== 0) {
    vx *= Math.pow(FRICTION_COEFFICIENT, deltaTime * 60); // Normalize to 60fps
    wz *= Math.pow(FRICTION_COEFFICIENT, deltaTime * 60);
    
    // Stop if velocity is very small
    if (Math.abs(vx) < 0.01) vx = 0;
    if (Math.abs(wz) < 0.01) wz = 0;

    robotStore.setVelocity(vx, wz);
  }

  // Update rotation based on angular velocity
  if (wz !== 0) {
    const newRotation = rotation + wz * deltaTime;
    robotStore.setRotation(newRotation);
  }

  // Update position based on linear velocity and current rotation
  if (vx !== 0) {
    const [x, y, z] = position;
    const newX = x + vx * Math.sin(rotation) * deltaTime;
    const newZ = z + vx * Math.cos(rotation) * deltaTime;
    robotStore.setPosition(newX, y, newZ);
  }
}

/**
 * Calculate distance sensor reading using raycast
 * @param {Object} robotStore - Zustand store instance
 * @param {THREE.Scene} scene - Three.js scene for raycasting
 * @param {THREE.Vector3} robotPosition - Current robot position
 * @param {number} robotRotation - Current robot rotation (y-axis)
 * @returns {number} Distance in meters (0 to DISTANCE_SENSOR_RANGE)
 */
export function updateDistanceSensor(robotStore, scene, robotPosition, robotRotation) {
  const now = Date.now();
  const timeSinceUpdate = now - lastDistanceUpdate;
  const updateInterval = 1000 / DISTANCE_SENSOR_UPDATE_RATE; // 100ms for 10Hz

  // Only update at specified rate
  if (timeSinceUpdate < updateInterval) {
    return robotStore.getState().distance;
  }

  lastDistanceUpdate = now;

  // Create raycast from front of robot
  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3(
    Math.sin(robotRotation),
    0,
    Math.cos(robotRotation)
  );
  
  const rayOrigin = new THREE.Vector3(...robotPosition);
  raycaster.set(rayOrigin, direction);
  raycaster.far = DISTANCE_SENSOR_RANGE;

  // Find intersections with obstacles (grid, walls, etc.)
  // For now, we'll use a simple ground plane check
  // In a full implementation, you'd check against actual obstacles
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  let distance = DISTANCE_SENSOR_RANGE; // Default to max range
  
  // Filter out the robot itself and helpers
  const validIntersects = intersects.filter(obj => {
    const name = obj.object.name || '';
    return !name.includes('robot') && 
           !name.includes('helper') && 
           !name.includes('grid') &&
           !name.includes('lidar');
  });

  if (validIntersects.length > 0) {
    distance = Math.min(validIntersects[0].distance, DISTANCE_SENSOR_RANGE);
  }

  robotStore.setDistance(distance);
  return distance;
}

/**
 * Generate LiDAR scan data (360° scan)
 * @param {THREE.Scene} scene - Three.js scene
 * @param {THREE.Vector3} robotPosition - Current robot position
 * @param {number} numRays - Number of rays in 360° scan (default 36)
 * @param {number} maxRange - Maximum range in meters
 * @returns {Array} Array of {angle, distance} objects
 */
export function generateLidarScan(scene, robotPosition, numRays = 36, maxRange = 5.0) {
  const raycaster = new THREE.Raycaster();
  const scanData = [];
  const angleStep = (2 * Math.PI) / numRays;

  for (let i = 0; i < numRays; i++) {
    const angle = i * angleStep;
    const direction = new THREE.Vector3(
      Math.sin(angle),
      0,
      Math.cos(angle)
    );

    raycaster.set(robotPosition, direction);
    raycaster.far = maxRange;

    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Filter out robot itself
    const validIntersects = intersects.filter(obj => {
      const name = obj.object.name || '';
      return !name.includes('robot') && 
             !name.includes('helper') && 
             !name.includes('grid') &&
             !name.includes('lidar') &&
             !name.includes('wheel');
    });

    let distance = maxRange;
    if (validIntersects.length > 0) {
      distance = Math.min(validIntersects[0].distance, maxRange);
    }

    scanData.push({ angle, distance });
  }

  return scanData;
}

/**
 * Update occupancy map based on LiDAR scan
 * @param {Object} robotStore - Zustand store instance
 * @param {Array} lidarScan - Array of {angle, distance} from generateLidarScan
 * @param {THREE.Vector3} robotPosition - Current robot position
 * @param {number} mapSize - Size of map in meters (default 10m)
 * @param {number} resolution - Grid cells per meter (default 5 = 50x50 for 10m)
 */
export function updateOccupancyMap(robotStore, lidarScan, robotPosition, mapSize = 10, resolution = 5) {
  const gridSize = mapSize * resolution;
  const cellSize = mapSize / gridSize;
  
  // Initialize or get existing map
  let map = robotStore.getState().occupancyMap;
  if (!map || map.length !== gridSize * gridSize) {
    map = new Array(gridSize * gridSize).fill(0); // 0 = unknown, 1 = free, 2 = occupied
  }

  const [robotX, , robotZ] = robotPosition;
  const mapCenterX = gridSize / 2;
  const mapCenterZ = gridSize / 2;

  // Update map based on LiDAR scan
  lidarScan.forEach(({ angle, distance }) => {
    // Calculate world position of obstacle
    const obstacleX = robotX + Math.sin(angle) * distance;
    const obstacleZ = robotZ + Math.cos(angle) * distance;

    // Convert to grid coordinates
    const gridX = Math.floor(mapCenterX + (obstacleX / cellSize));
    const gridZ = Math.floor(mapCenterZ + (obstacleZ / cellSize));

    // Mark cells along the ray as free
    const steps = Math.floor(distance / cellSize);
    for (let step = 0; step < steps; step++) {
      const stepX = Math.floor(mapCenterX + (robotX + Math.sin(angle) * step * cellSize) / cellSize);
      const stepZ = Math.floor(mapCenterZ + (robotZ + Math.cos(angle) * step * cellSize) / cellSize);
      
      if (stepX >= 0 && stepX < gridSize && stepZ >= 0 && stepZ < gridSize) {
        const idx = stepZ * gridSize + stepX;
        if (map[idx] !== 2) map[idx] = 1; // Free space
      }
    }

    // Mark obstacle cell as occupied
    if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
      const idx = gridZ * gridSize + gridX;
      if (distance < DISTANCE_SENSOR_RANGE * 0.95) {
        map[idx] = 2; // Occupied
      }
    }
  });

  robotStore.updateOccupancyMap(map);
}
