import { create } from 'zustand';

export const useRobotStore = create((set) => ({
  // Joint angles in degrees (0-4 for base, shoulder, elbow, wrist, gripper rotation)
  jointAngles: [0, 0, 0, 0, 0],
  // Gripper state: 0 = closed, 1 = open
  gripperState: 0,
  // Animation queue for smooth movements
  animationQueue: [],
  isAnimating: false,

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
      const startAngle = useRobotStore.getState().jointAngles[jointIndex];
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

  // Reset all joints to initial position
  reset: () => set({ 
    jointAngles: [0, 0, 0, 0, 0], 
    gripperState: 0,
    animationQueue: [],
    isAnimating: false
  }),
}));
