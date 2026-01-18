/**
 * Simple C++ code parser for robot commands
 * Extracts robot.moveJoint() and robot.closeGripper() / robot.openGripper() calls
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
      });
    }

    // Extract robot.openGripper() calls
    const openGripperRegex = /robot\.openGripper\s*\(\s*\)/g;
    while ((match = openGripperRegex.exec(code)) !== null) {
      this.commands.push({
        type: 'openGripper',
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
  for (const command of commands) {
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
  }
}
