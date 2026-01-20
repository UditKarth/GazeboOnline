import { useRobotStore } from '../store/robotStore';

export function Documentation() {
  const { robotType } = useRobotStore();

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Robot API Documentation</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {robotType === 'arm' ? <ArmDocumentation /> : <RoverDocumentation />}
      </div>
    </div>
  );
}

function ArmDocumentation() {
  return (
    <>
      {/* Introduction */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">Overview</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          Control the 5-DOF robot arm using simple C++ function calls. All movements are animated smoothly, and commands execute sequentially.
        </p>
      </div>

      {/* moveToPose */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">
          <code className="text-blue-400">robot.moveToPose(x, y, z)</code>
        </h3>
        <p className="text-sm text-gray-300 mb-2 leading-relaxed">
          Moves the end-effector to a target position using inverse kinematics. A trajectory path is visualized before movement begins.
        </p>
        <div className="bg-gray-800 rounded p-3 mb-2">
          <p className="text-xs text-gray-400 mb-1">Parameters:</p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
            <li><code className="text-blue-400">x</code> (float): Target X position in meters</li>
            <li><code className="text-blue-400">y</code> (float): Target Y position in meters</li>
            <li><code className="text-blue-400">z</code> (float): Target Z position in meters</li>
          </ul>
        </div>
        <div className="mt-2 bg-gray-800 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Example:</p>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            <code>{`robot.moveToPose(0.5, 1.0, 0.3);  // Move to position (0.5, 1.0, 0.3)`}</code>
          </pre>
        </div>
      </div>

      {/* moveJoint */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">
          <code className="text-blue-400">robot.moveJoint(jointIndex, angle)</code>
        </h3>
        <p className="text-sm text-gray-300 mb-2 leading-relaxed">
          Rotates a specific joint to the target angle. The movement is animated over 1 second.
        </p>
        <div className="bg-gray-800 rounded p-3 mb-2">
          <p className="text-xs text-gray-400 mb-1">Parameters:</p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
            <li><code className="text-blue-400">jointIndex</code> (int): The joint to move (0-4)</li>
            <li><code className="text-blue-400">angle</code> (float): Target angle in degrees (can be negative)</li>
          </ul>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Joint Index Reference:</p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
            <li><code className="text-blue-400">0</code> - Base (rotates around Y-axis)</li>
            <li><code className="text-blue-400">1</code> - Shoulder (rotates around Z-axis)</li>
            <li><code className="text-blue-400">2</code> - Elbow (rotates around Z-axis)</li>
            <li><code className="text-blue-400">3</code> - Wrist (rotates around Z-axis)</li>
            <li><code className="text-blue-400">4</code> - Gripper Rotation (rotates around Z-axis)</li>
          </ul>
        </div>
        <div className="mt-2 bg-gray-800 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Example:</p>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            <code>{`robot.moveJoint(0, 45);   // Rotate base 45°\nrobot.moveJoint(1, -30); // Rotate shoulder -30°`}</code>
          </pre>
        </div>
      </div>

        {/* openGripper */}
        <div>
          <h3 className="text-md font-semibold text-white mb-2">
            <code className="text-blue-400">robot.openGripper()</code>
          </h3>
          <p className="text-sm text-gray-300 mb-2 leading-relaxed">
            Opens the gripper by separating the two fingers. This command completes immediately.
          </p>
          <div className="bg-gray-800 rounded p-3">
            <p className="text-xs text-gray-400 mb-1">Example:</p>
            <pre className="text-xs text-gray-300 overflow-x-auto">
              <code>{`robot.openGripper();`}</code>
            </pre>
          </div>
        </div>

      {/* closeGripper */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">
          <code className="text-blue-400">robot.closeGripper(max_effort)</code>
        </h3>
        <p className="text-sm text-gray-300 mb-2 leading-relaxed">
          Closes the gripper with optional maximum effort. If effort exceeds the threshold (default 0.8), the gripper stops on collision detection.
        </p>
        <div className="bg-gray-800 rounded p-3 mb-2">
          <p className="text-xs text-gray-400 mb-1">Parameters:</p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
            <li><code className="text-blue-400">max_effort</code> (float, optional): Maximum effort threshold (0.0 to 1.0). Default: 0.8</li>
          </ul>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Example:</p>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            <code>{`robot.closeGripper();        // Close with default effort\nrobot.closeGripper(0.9);    // Close with higher effort threshold`}</code>
          </pre>
        </div>
      </div>

      {/* Complete Example */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">Complete Example</h3>
        <div className="bg-gray-800 rounded p-3">
          <pre className="text-xs text-gray-300 overflow-x-auto">
            <code>{`void main() {\n    // Move to position using IK\n    robot.moveToPose(0.5, 1.0, 0.3);\n    robot.openGripper();\n    // Move individual joints\n    robot.moveJoint(1, 30);\n    robot.closeGripper(0.8);  // Close with collision detection\n}`}</code>
          </pre>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-md font-semibold text-white mb-2">Notes</h3>
        <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
          <li>Commands execute sequentially, one after another</li>
          <li>Joint movements are animated smoothly over 1 second</li>
          <li>Use the <code className="text-blue-400">Reset</code> button to return the robot to its initial position</li>
          <li>Joint angles are in degrees and can be positive or negative</li>
        </ul>
      </div>
    </>
  );
}

function RoverDocumentation() {
  return (
    <>
      {/* Introduction */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">Overview</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          Control the 4-wheeled rover using ROS2-style commands. The rover uses velocity-based control similar to ROS2's <code className="text-blue-400">geometry_msgs/Twist</code> message. Commands execute in real-time with physics-based movement.
        </p>
      </div>

      {/* move */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">
          <code className="text-blue-400">robot.move(vx, wz)</code>
        </h3>
        <p className="text-sm text-gray-300 mb-2 leading-relaxed">
          Sets the linear and angular velocity of the rover. Equivalent to ROS2's <code className="text-blue-400">cmd_vel</code> topic. The robot will continue moving at this velocity until a new command is sent or the watchdog timeout (500ms) expires.
        </p>
        <div className="bg-gray-800 rounded p-3 mb-2">
          <p className="text-xs text-gray-400 mb-1">Parameters:</p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
            <li><code className="text-blue-400">vx</code> (float): Linear velocity in m/s (forward/backward)</li>
            <li><code className="text-blue-400">wz</code> (float): Angular velocity in rad/s (rotation)</li>
          </ul>
        </div>
        <div className="bg-gray-800 rounded p-3 mb-2">
          <p className="text-xs text-gray-400 mb-1">ROS2 Mapping:</p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
            <li>Maps to <code className="text-blue-400">geometry_msgs/Twist.linear.x</code> and <code className="text-blue-400">geometry_msgs/Twist.angular.z</code></li>
            <li>Positive vx: forward, Negative vx: backward</li>
            <li>Positive wz: counter-clockwise, Negative wz: clockwise</li>
          </ul>
        </div>
        <div className="mt-2 bg-gray-800 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Example:</p>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            <code>{`robot.move(1.0, 0.0);   // Move forward at 1 m/s\nrobot.move(0.0, 0.5);  // Rotate in place at 0.5 rad/s\nrobot.move(0.0, 0.0);  // Stop`}</code>
          </pre>
        </div>
      </div>

      {/* getDistance */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">
          <code className="text-blue-400">robot.getDistance()</code>
        </h3>
        <p className="text-sm text-gray-300 mb-2 leading-relaxed">
          Returns the distance reading from the frontal distance sensor in meters. The sensor has a maximum range of 5 meters. Returns the distance to the nearest obstacle in front of the robot.
        </p>
        <div className="bg-gray-800 rounded p-3 mb-2">
          <p className="text-xs text-gray-400 mb-1">Return Value:</p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
            <li><code className="text-blue-400">float</code>: Distance in meters (0.0 to 5.0)</li>
            <li>Returns 5.0 if no obstacle detected within range</li>
          </ul>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Example:</p>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            <code>{`float dist = robot.getDistance();\nif (dist < 1.0) {\n    robot.move(0.0, 0.0);  // Stop if obstacle too close\n}`}</code>
          </pre>
        </div>
      </div>

      {/* setLight */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">
          <code className="text-blue-400">robot.setLight(color)</code>
        </h3>
        <p className="text-sm text-gray-300 mb-2 leading-relaxed">
          Changes the color of the LED light on the rover. Accepts color names, hex strings, or numeric color codes.
        </p>
        <div className="bg-gray-800 rounded p-3 mb-2">
          <p className="text-xs text-gray-400 mb-1">Parameters:</p>
          <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
            <li><code className="text-blue-400">color</code> (string): Color name ("red", "blue", "green") or hex string ("#ff0000")</li>
          </ul>
        </div>
        <div className="bg-gray-800 rounded p-3">
          <p className="text-xs text-gray-400 mb-1">Example:</p>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            <code>{`robot.setLight("red");\nrobot.setLight("#00ff00");  // Green\nrobot.setLight("blue");`}</code>
          </pre>
        </div>
      </div>

      {/* Complete Example */}
      <div>
        <h3 className="text-md font-semibold text-white mb-2">Complete Example</h3>
        <div className="bg-gray-800 rounded p-3">
          <pre className="text-xs text-gray-300 overflow-x-auto">
            <code>{`void main() {\n    robot.setLight("green");\n    robot.move(1.0, 0.0);  // Move forward\n    // ... wait ...\n    float dist = robot.getDistance();\n    if (dist < 2.0) {\n        robot.move(0.0, 0.5);  // Turn if obstacle detected\n    }\n    robot.move(0.0, 0.0);  // Stop\n}`}</code>
          </pre>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-md font-semibold text-white mb-2">Notes</h3>
        <ul className="text-xs text-gray-300 space-y-1 ml-4 list-disc">
          <li>Commands execute in real-time with physics-based movement</li>
          <li>Robot automatically stops if no command is received for 500ms (ROS2 watchdog)</li>
          <li>Friction is applied gradually, so the robot will slow down and stop naturally</li>
          <li>Use <code className="text-blue-400">robot.move(0.0, 0.0)</code> to stop immediately</li>
          <li>LiDAR visualization shows 360° scan in real-time</li>
          <li>Check the telemetry panel for velocity graphs and occupancy map</li>
        </ul>
      </div>
    </>
  );
}
