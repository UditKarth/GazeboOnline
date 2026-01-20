import { useRobotStore } from '../store/robotStore';

const jointNames = ['Base', 'Shoulder', 'Elbow', 'Wrist', 'Gripper Rot'];

export function JointStatePanel() {
  const { 
    jointAngles, 
    jointVelocities, 
    jointEfforts, 
    robotType 
  } = useRobotStore();

  if (robotType !== 'arm') return null;

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
      <h3 className="text-sm font-semibold text-white mb-3">Joint State Feedback</h3>
      <div className="space-y-2">
        {jointAngles.map((angle, index) => (
          <div key={index} className="bg-gray-900 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-300">
                Joint {index}: {jointNames[index]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Angle:</span>
                <span className="text-white ml-2">{angle.toFixed(2)}°</span>
              </div>
              <div>
                <span className="text-gray-400">Velocity:</span>
                <span className={`ml-2 ${
                  Math.abs(jointVelocities[index]) > 0.1 
                    ? 'text-yellow-400' 
                    : 'text-gray-500'
                }`}>
                  {jointVelocities[index].toFixed(2)}°/s
                </span>
              </div>
              <div>
                <span className="text-gray-400">Effort:</span>
                <span className={`ml-2 ${
                  jointEfforts[index] > 0.5 
                    ? 'text-red-400' 
                    : jointEfforts[index] > 0.2
                    ? 'text-yellow-400'
                    : 'text-gray-500'
                }`}>
                  {jointEfforts[index].toFixed(3)} Nm
                </span>
              </div>
            </div>
            {/* Effort bar */}
            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  jointEfforts[index] > 0.5 
                    ? 'bg-red-500' 
                    : jointEfforts[index] > 0.2
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(jointEfforts[index] * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
