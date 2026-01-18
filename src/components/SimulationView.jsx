import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RobotModel } from './RobotModel';

export function SimulationView() {
  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">3D Robot Simulation</h2>
        <p className="text-sm text-gray-400 mt-1">5-DOF Robot Arm with Gripper</p>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [3, 3, 3], fov: 50 }}
          gl={{ antialias: true }}
        >
          <RobotModel />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
          />
        </Canvas>
      </div>

      {/* Info Panel */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Use mouse to rotate, zoom, and pan the view</p>
          <p>• Joint 0: Base | Joint 1: Shoulder | Joint 2: Elbow | Joint 3: Wrist | Joint 4: Gripper Rotation</p>
        </div>
      </div>
    </div>
  );
}
