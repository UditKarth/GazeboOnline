import { useRobotStore } from '../store/robotStore';

export function RobotTypeToggle() {
  const { robotType, setRobotType } = useRobotStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Robot Type:</span>
      <div className="flex bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setRobotType('arm')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            robotType === 'arm'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          5-DOF Arm
        </button>
        <button
          onClick={() => setRobotType('rover')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            robotType === 'rover'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-600'
          }`}
        >
          4-Wheel Rover
        </button>
      </div>
    </div>
  );
}
