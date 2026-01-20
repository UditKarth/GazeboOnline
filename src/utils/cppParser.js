/**
 * Simple C++ code parser for robot commands
 * Extracts robot commands for both arm and rover robots
 */

export class RobotCommandParser {
  constructor() {
    this.commands = [];
  }

  parse(code) {
    this.commands = [];
    
    // Remove comments (single-line and multi-line)
    code = code.replace(/\/\/.*$/gm, '');
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');

    // ========== ARM ROBOT COMMANDS ==========
    // Extract robot.moveJoint(jointIndex, angle) calls
    const moveJointRegex = /robot\.moveJoint\s*\(\s*(\d+)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
    let match;
    
    while ((match = moveJointRegex.exec(code)) !== null) {
      const jointIndex = parseInt(match[1], 10);
      const angle = parseFloat(match[2]);
      
      // Validate joint index (0-4 for 5-DOF)
      if (jointIndex >= 0 && jointIndex <= 4) {
        this.commands.push({
          type: 'moveJoint',
          robotType: 'arm',
          jointIndex,
          angle,
        });
      }
    }

    // Extract robot.closeGripper() calls (with optional max_effort parameter)
    const closeGripperRegex = /robot\.closeGripper\s*\(\s*(-?\d+(?:\.\d+)?)?\s*\)/g;
    while ((match = closeGripperRegex.exec(code)) !== null) {
      const effort = match[1] ? parseFloat(match[1]) : undefined;
      this.commands.push({
        type: 'closeGripper',
        robotType: 'arm',
        maxEffort: effort,
      });
    }

    // Extract robot.openGripper() calls
    const openGripperRegex = /robot\.openGripper\s*\(\s*\)/g;
    while ((match = openGripperRegex.exec(code)) !== null) {
      this.commands.push({
        type: 'openGripper',
        robotType: 'arm',
      });
    }

    // Extract robot.moveToPose(x, y, z) calls
    const moveToPoseRegex = /robot\.moveToPose\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
    while ((match = moveToPoseRegex.exec(code)) !== null) {
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      const z = parseFloat(match[3]);
      
      this.commands.push({
        type: 'moveToPose',
        robotType: 'arm',
        x,
        y,
        z,
      });
    }

    // ========== ROVER ROBOT COMMANDS ==========
    // Extract robot.move(vx, wz) calls - ROS2 cmd_vel equivalent
    const moveRegex = /robot\.move\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
    while ((match = moveRegex.exec(code)) !== null) {
      const vx = parseFloat(match[1]);
      const wz = parseFloat(match[2]);
      
      this.commands.push({
        type: 'move',
        robotType: 'rover',
        vx,
        wz,
      });
    }

    // Extract robot.getDistance() calls
    const getDistanceRegex = /robot\.getDistance\s*\(\s*\)/g;
    while ((match = getDistanceRegex.exec(code)) !== null) {
      this.commands.push({
        type: 'getDistance',
        robotType: 'rover',
      });
    }

    // Extract robot.setLight(color) calls
    // Supports: color names ("red", "blue"), hex strings ("#ff0000"), or numbers
    const setLightRegex = /robot\.setLight\s*\(\s*(["']?)([^"',)]+)\1\s*\)/g;
    while ((match = setLightRegex.exec(code)) !== null) {
      let color = match[2].trim();
      
      // Try to parse as number (for numeric color codes)
      const numColor = parseFloat(color);
      if (!isNaN(numColor)) {
        // Convert number to hex color (simple mapping)
        const hex = '#' + Math.floor(numColor).toString(16).padStart(6, '0');
        color = hex;
      }
      
      this.commands.push({
        type: 'setLight',
        robotType: 'rover',
        color,
      });
    }

    return this.commands;
  }

  getCommands() {
    return this.commands;
  }
}

/**
 * Execute parsed commands with animation
 */
export async function executeCommands(commands, robotStore) {
  // robotStore is the Zustand store object (useRobotStore)
  // In Zustand v4, methods are directly on the store object
  if (!robotStore || typeof robotStore.getState !== 'function') {
    console.error('Invalid robotStore passed to executeCommands');
    return;
  }
  
  // Get the state object which also has all the methods
  const storeState = robotStore.getState();
  const currentRobotType = storeState.robotType;
  
  for (const command of commands) {
    // Skip commands that don't match current robot type
    if (command.robotType && command.robotType !== currentRobotType) {
      continue;
    }

    // ========== ARM ROBOT COMMANDS ==========
    if (command.type === 'moveJoint') {
      // In Zustand v4, methods are on both the store object and the state object
      const animateJointFn = robotStore.animateJoint || storeState.animateJoint;
      if (animateJointFn && typeof animateJointFn === 'function') {
        await animateJointFn(command.jointIndex, command.angle, 1000);
      } else {
        console.error('animateJoint not found. Available methods on store:', Object.keys(robotStore).filter(k => typeof robotStore[k] === 'function'));
        console.error('Available methods on state:', Object.keys(storeState).filter(k => typeof storeState[k] === 'function'));
      }
    } else if (command.type === 'moveToPose') {
      const moveToPoseFn = robotStore.moveToPose || storeState.moveToPose;
      if (moveToPoseFn && typeof moveToPoseFn === 'function') {
        await moveToPoseFn(command.x, command.y, command.z, 2000);
      }
    } else if (command.type === 'closeGripper') {
      // Check if maxEffort is provided
      if (command.maxEffort !== undefined) {
        const setGripperWithEffortFn = robotStore.setGripperWithEffort || storeState.setGripperWithEffort;
        if (setGripperWithEffortFn) {
          setGripperWithEffortFn(0, command.maxEffort);
        }
      } else {
        const setGripperFn = robotStore.setGripperState || storeState.setGripperState;
        if (setGripperFn) setGripperFn(0);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    } else if (command.type === 'openGripper') {
      const setGripperFn = robotStore.setGripperState || storeState.setGripperState;
      if (setGripperFn) setGripperFn(1);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    // ========== ROVER ROBOT COMMANDS ==========
    else if (command.type === 'move') {
      const setVelocityFn = robotStore.setVelocity || storeState.setVelocity;
      if (setVelocityFn) setVelocityFn(command.vx, command.wz);
      await new Promise(resolve => setTimeout(resolve, 50));
    } else if (command.type === 'getDistance') {
      const getDistanceFn = robotStore.getDistance || storeState.getDistance;
      if (getDistanceFn) {
        const distance = getDistanceFn();
        console.log(`Distance sensor reading: ${distance.toFixed(2)}m`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    } else if (command.type === 'setLight') {
      const setLedColorFn = robotStore.setLedColor || storeState.setLedColor;
      if (setLedColorFn) setLedColorFn(command.color);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
