import { create } from 'zustand';
import * as THREE from 'three';
import { inverseKinematics, generateTrajectory, forwardKinematics } from '../utils/kinematics';

export const useRobotStore = create((set, get) => ({
  // Robot type: 'arm' or 'rover'
  robotType: 'arm',

  // ========== ARM ROBOT STATE ==========
  // Joint angles in degrees (0-4 for base, shoulder, elbow, wrist, gripper rotation)
  jointAngles: [0, 0, 0, 0, 0],
  // Joint velocities in degrees per second
  jointVelocities: [0, 0, 0, 0, 0],
  // Joint efforts in Newton-meters (Nm)
  jointEfforts: [0, 0, 0, 0, 0],
  // Gripper state: 0 = closed, 1 = open
  gripperState: 0,
  // Gripper effort (0.0 to 1.0)
  gripperEffort: 0,
  // Gripper max effort threshold for collision detection
  gripperMaxEffort: 0.8,
  // Path trajectory for visualization
  trajectoryPath: null,
  // Animation queue for smooth movements
  animationQueue: [],
  isAnimating: false,

  // ========== ROVER ROBOT STATE ==========
  // Position in 3D space (x, y, z) - y is height, typically 0.1 for ground
  position: [0, 0.1, 0],
  // Rotation in radians (only y-axis for ground robot)
  rotation: 0,
  // Velocity: vx (linear m/s), wz (angular rad/s)
  velocity: { vx: 0, wz: 0 },
  // LED color (hex string or color name)
  ledColor: '#00ff00',
  // Last command timestamp for watchdog
  lastCommandTime: null,
  // Distance sensor reading (meters)
  distance: 5.0,
  // Velocity history for graph (last 10 seconds at ~30fps = 300 points)
  velocityHistory: [],
  // Occupancy map data (2D grid of detected obstacles)
  occupancyMap: null,

  // ========== ROBOT TYPE MANAGEMENT ==========
  setRobotType: (type) => set({ robotType: type }),

  // ========== ARM ROBOT ACTIONS ==========
  // Update joint angle
  setJointAngle: (jointIndex, angle) => set((state) => {
    const newAngles = [...state.jointAngles];
    newAngles[jointIndex] = angle;
    return { jointAngles: newAngles };
  }),

  // Set gripper state (0 = closed, 1 = open)
  setGripperState: (state) => set({ gripperState: state }),

  // Animate joint to target angle
  animateJoint: (jointIndex, targetAngle, duration = 1000) => {
    return new Promise((resolve) => {
      set({ isAnimating: true });
      // Use get() from the store closure instead of useRobotStore.getState()
      const startAngle = get().jointAngles[jointIndex];
      const startTime = Date.now();
      let lastAngle = startAngle;
      let lastTime = startTime;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentAngle = startAngle + (targetAngle - startAngle) * eased;
        const currentTime = Date.now();
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        
        // Calculate velocity (degrees per second)
        const velocity = deltaTime > 0 ? (currentAngle - lastAngle) / deltaTime : 0;
        
        // Calculate effort (simplified: proportional to velocity and joint index weight)
        const effortWeights = [0.5, 1.0, 0.8, 0.6, 0.3]; // Base, shoulder, elbow, wrist, gripper
        const effort = Math.abs(velocity) * effortWeights[jointIndex] * 0.01; // Scale factor
        
        set((state) => {
          const newAngles = [...state.jointAngles];
          const newVelocities = [...state.jointVelocities];
          const newEfforts = [...state.jointEfforts];
          
          newAngles[jointIndex] = currentAngle;
          newVelocities[jointIndex] = velocity;
          newEfforts[jointIndex] = effort;
          
          return { 
            jointAngles: newAngles,
            jointVelocities: newVelocities,
            jointEfforts: newEfforts
          };
        });

        lastAngle = currentAngle;
        lastTime = currentTime;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Reset velocity and effort when animation completes
          set((state) => {
            const newVelocities = [...state.jointVelocities];
            const newEfforts = [...state.jointEfforts];
            newVelocities[jointIndex] = 0;
            newEfforts[jointIndex] = 0;
            return { 
              jointVelocities: newVelocities,
              jointEfforts: newEfforts,
              isAnimating: false
            };
          });
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  },

  // Move to pose using inverse kinematics
  moveToPose: async (x, y, z, duration = 2000) => {
    const state = get();
    const currentAngles = state.jointAngles;
    
    // Calculate target joint angles
    const targetPos = new THREE.Vector3(x, y, z);
    const targetAngles = inverseKinematics(targetPos, currentAngles);
    
    // Generate trajectory path for visualization
    const trajectory = generateTrajectory(currentAngles, targetAngles, 20);
    const pathPoints = trajectory.map(angles => forwardKinematics(angles));
    set({ trajectoryPath: pathPoints });
    
    // Animate through trajectory
    set({ isAnimating: true });
    
    for (let i = 0; i < trajectory.length; i++) {
      const stepAngles = trajectory[i];
      const stepDuration = duration / trajectory.length;
      
      // Update all joints simultaneously
      await new Promise((resolve) => {
        const startAngles = get().jointAngles;
        const startTime = Date.now();
        let lastAngles = [...startAngles];
        let lastTime = startTime;
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / stepDuration, 1);
          
          const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          
          const currentAngles = startAngles.map((start, idx) => 
            start + (stepAngles[idx] - start) * eased
          );
          
          // Calculate velocities and efforts for all joints
          const currentTime = Date.now();
          const deltaTime = (currentTime - lastTime) / 1000;
          const effortWeights = [0.5, 1.0, 0.8, 0.6, 0.3];
          
          set((state) => {
            const newVelocities = currentAngles.map((angle, idx) => {
              if (deltaTime > 0) {
                return (angle - lastAngles[idx]) / deltaTime;
              }
              return state.jointVelocities[idx];
            });
            
            const newEfforts = newVelocities.map((vel, idx) => 
              Math.abs(vel) * effortWeights[idx] * 0.01
            );
            
            return {
              jointAngles: currentAngles,
              jointVelocities: newVelocities,
              jointEfforts: newEfforts
            };
          });
          
          lastAngles = currentAngles;
          lastTime = currentTime;
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        
        requestAnimationFrame(animate);
      });
    }
    
    // Clear trajectory path after a short delay
    setTimeout(() => {
      set({ trajectoryPath: null, isAnimating: false });
    }, 500);
  },

  // Set gripper with effort
  setGripperWithEffort: (targetState, maxEffort = 0.8) => {
    set({ 
      gripperState: targetState,
      gripperMaxEffort: maxEffort,
      gripperEffort: 0 // Reset effort
    });
  },

  // Update gripper effort (for collision detection)
  setGripperEffort: (effort) => set({ gripperEffort: effort }),

  // ========== ROVER ROBOT ACTIONS ==========
  // Set velocity (vx in m/s, wz in rad/s)
  setVelocity: (vx, wz) => set({ 
    velocity: { vx, wz },
    lastCommandTime: Date.now()
  }),

  // Update position
  setPosition: (x, y, z) => set({ position: [x, y, z] }),

  // Update rotation (y-axis in radians)
  setRotation: (y) => set({ rotation: y }),

  // Set LED color
  setLedColor: (color) => set({ ledColor: color }),

  // Get distance sensor reading
  getDistance: () => {
    return get().distance;
  },

  // Update distance sensor reading
  setDistance: (distance) => set({ distance }),

  // Add velocity point to history
  addVelocityHistory: (vx, wz) => {
    const state = get();
    const now = Date.now();
    const newHistory = [...state.velocityHistory, { time: now, vx, wz }];
    // Keep only last 10 seconds (assuming ~30fps = 300 points)
    const tenSecondsAgo = now - 10000;
    const filtered = newHistory.filter(point => point.time > tenSecondsAgo);
    set({ velocityHistory: filtered });
  },

  // Update occupancy map
  updateOccupancyMap: (mapData) => set({ occupancyMap: mapData }),

  // ========== RESET ==========
  // Reset all joints to initial position
  reset: () => {
    const state = get();
    if (state.robotType === 'arm') {
      set({ 
        jointAngles: [0, 0, 0, 0, 0],
        jointVelocities: [0, 0, 0, 0, 0],
        jointEfforts: [0, 0, 0, 0, 0],
        gripperState: 0,
        gripperEffort: 0,
        trajectoryPath: null,
        animationQueue: [],
        isAnimating: false
      });
    } else {
      set({
        position: [0, 0.1, 0],
        rotation: 0,
        velocity: { vx: 0, wz: 0 },
        ledColor: '#00ff00',
        lastCommandTime: null,
        distance: 5.0,
        velocityHistory: [],
        occupancyMap: null
      });
    }
  },
}));
