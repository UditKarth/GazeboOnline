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

    // Extract robot.closeGripper() calls
    const closeGripperRegex = /robot\.closeGripper\s*\(\s*\)/g;
    while ((match = closeGripperRegex.exec(code)) !== null) {
      this.commands.push({
        type: 'closeGripper',
        robotType: 'arm',
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
  const currentRobotType = robotStore.getState().robotType;
  
  for (const command of commands) {
    // Skip commands that don't match current robot type
    if (command.robotType && command.robotType !== currentRobotType) {
      continue;
    }

    // ========== ARM ROBOT COMMANDS ==========
    if (command.type === 'moveJoint') {
      await robotStore.animateJoint(command.jointIndex, command.angle, 1000);
    } else if (command.type === 'closeGripper') {
      robotStore.setGripperState(0);
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));
    } else if (command.type === 'openGripper') {
      robotStore.setGripperState(1);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    // ========== ROVER ROBOT COMMANDS ==========
    else if (command.type === 'move') {
      // Set velocity (vx in m/s, wz in rad/s)
      robotStore.setVelocity(command.vx, command.wz);
      // Small delay to allow physics to process
      await new Promise(resolve => setTimeout(resolve, 50));
    } else if (command.type === 'getDistance') {
      // Get distance sensor reading
      const distance = robotStore.getDistance();
      // In a real implementation, this might be used in the code
      // For now, we just read the value from the store
      console.log(`Distance sensor reading: ${distance.toFixed(2)}m`);
      await new Promise(resolve => setTimeout(resolve, 100));
    } else if (command.type === 'setLight') {
      // Set LED color
      robotStore.setLedColor(command.color);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
