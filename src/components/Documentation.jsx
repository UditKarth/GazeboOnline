export function Documentation() {
  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Robot API Documentation</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Introduction */}
        <div>
          <h3 className="text-md font-semibold text-white mb-2">Overview</h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            Control the 5-DOF robot arm using simple C++ function calls. All movements are animated smoothly, and commands execute sequentially.
          </p>
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
            <code className="text-blue-400">robot.closeGripper()</code>
          </h3>
          <p className="text-sm text-gray-300 mb-2 leading-relaxed">
            Closes the gripper by bringing the two fingers together. This command completes immediately.
          </p>
          <div className="bg-gray-800 rounded p-3">
            <p className="text-xs text-gray-400 mb-1">Example:</p>
            <pre className="text-xs text-gray-300 overflow-x-auto">
              <code>{`robot.closeGripper();`}</code>
            </pre>
          </div>
        </div>

        {/* Complete Example */}
        <div>
          <h3 className="text-md font-semibold text-white mb-2">Complete Example</h3>
          <div className="bg-gray-800 rounded p-3">
            <pre className="text-xs text-gray-300 overflow-x-auto">
              <code>{`void main() {\n    robot.moveJoint(0, 45);\n    robot.moveJoint(1, 30);\n    robot.openGripper();\n    robot.moveJoint(2, -20);\n    robot.closeGripper();\n}`}</code>
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
      </div>
    </div>
  );
}
