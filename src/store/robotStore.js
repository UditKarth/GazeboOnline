import { create } from 'zustand';

export const useRobotStore = create((set, get) => ({
  // Robot type: 'arm' or 'rover'
  robotType: 'arm',

  // ========== ARM ROBOT STATE ==========
  // Joint angles in degrees (0-4 for base, shoulder, elbow, wrist, gripper rotation)
  jointAngles: [0, 0, 0, 0, 0],
  // Gripper state: 0 = closed, 1 = open
  gripperState: 0,
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

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentAngle = startAngle + (targetAngle - startAngle) * eased;
        
        set((state) => {
          const newAngles = [...state.jointAngles];
          newAngles[jointIndex] = currentAngle;
          return { jointAngles: newAngles };
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          set({ isAnimating: false });
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  },

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
        gripperState: 0,
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
