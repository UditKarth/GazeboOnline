import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRobotStore } from '../store/robotStore';
import { RobotModel } from './RobotModel';
import { RoverModel } from './RoverModel';
import { TelemetryPanel } from './TelemetryPanel';

export function SimulationView() {
  const { robotType } = useRobotStore();

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">3D Robot Simulation</h2>
        <p className="text-sm text-gray-400 mt-1">
          {robotType === 'arm' ? '5-DOF Robot Arm with Gripper' : '4-Wheel Rover with LiDAR'}
        </p>
      </div>

      {/* 3D Canvas */}
      <div className={robotType === 'rover' ? 'flex-1 relative' : 'flex-1 relative'}>
        <Canvas
          camera={robotType === 'arm' 
            ? { position: [3, 3, 3], fov: 50 }
            : { position: [5, 5, 5], fov: 50 }
          }
          gl={{ antialias: true }}
        >
          {robotType === 'arm' ? <RobotModel /> : <RoverModel />}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={robotType === 'arm' ? 2 : 1}
            maxDistance={robotType === 'arm' ? 10 : 15}
          />
        </Canvas>
      </div>

      {/* Telemetry Panel for Rover */}
      {robotType === 'rover' && <TelemetryPanel />}

      {/* Info Panel */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Use mouse to rotate, zoom, and pan the view</p>
          {robotType === 'arm' ? (
            <p>• Joint 0: Base | Joint 1: Shoulder | Joint 2: Elbow | Joint 3: Wrist | Joint 4: Gripper Rotation</p>
          ) : (
            <p>• Red lines show LiDAR scan | Blue dot on map shows robot position | Check telemetry panel for velocity and occupancy map</p>
          )}
        </div>
      </div>
    </div>
  );
}
