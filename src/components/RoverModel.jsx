import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRobotStore } from '../store/robotStore';
import * as THREE from 'three';
import { updateRoverPhysics, updateDistanceSensor, generateLidarScan, updateOccupancyMap } from '../utils/physics';

// Wheel component
function Wheel({ position, rotation = 0 }) {
  const wheelRef = useRef();
  const { velocity } = useRobotStore();

  useFrame(() => {
    if (wheelRef.current) {
      // Rotate wheel based on linear velocity
      // Wheel circumference ~0.2m, so 1 m/s = 5 rotations per second
      wheelRef.current.rotation.x += velocity.vx * 5 * 0.016; // 0.016 is approximate frame time
    }
  });

  return (
    <group ref={wheelRef} position={position} rotation={[0, rotation, 0]}>
      <mesh name="wheel">
        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wheel rim */}
      <mesh position={[0, 0, 0.025]}>
        <ringGeometry args={[0.06, 0.08, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      <mesh position={[0, 0, -0.025]}>
        <ringGeometry args={[0.06, 0.08, 16]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    </group>
  );
}

// LED light component
function LED({ color }) {
  return (
    <mesh position={[0, 0.15, 0.2]} name="led">
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.8}
      />
      {/* Light glow */}
      <pointLight color={color} intensity={0.5} distance={1} />
    </mesh>
  );
}

// LiDAR visualization component
function LidarVisualization({ scanData, robotPosition }) {
  if (!scanData || scanData.length === 0) return null;

  return (
    <group name="lidar">
      {scanData.map(({ angle, distance }, index) => {
        const endX = Math.sin(angle) * distance;
        const endZ = Math.cos(angle) * distance;
        
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0.1, 0),
          new THREE.Vector3(endX, 0.1, endZ)
        ]);
        
        return (
          <line key={index} geometry={geometry}>
            <lineBasicMaterial color="#ff0000" linewidth={2} />
          </line>
        );
      })}
    </group>
  );
}

// Main Rover Component
export function RoverModel() {
  const roverRef = useRef();
  const lidarScanRef = useRef([]);
  const { 
    position, 
    rotation, 
    velocity, 
    ledColor,
    robotType 
  } = useRobotStore();
  
  const { scene } = useThree();
  const lastLidarUpdate = useRef(0);

  // Update physics every frame
  useFrame((state, delta) => {
    if (robotType !== 'rover') return;

    // Update physics
    updateRoverPhysics(useRobotStore, delta);

    // Get current state after physics update
    const currentState = useRobotStore.getState();
    const [x, y, z] = currentState.position;
    const currentRotation = currentState.rotation;

    // Update rover position and rotation
    if (roverRef.current) {
      roverRef.current.position.set(x, y, z);
      roverRef.current.rotation.y = currentRotation;
    }

    // Update distance sensor (10Hz)
    const now = Date.now();
    if (now - lastLidarUpdate.current > 100) {
      const robotPos = new THREE.Vector3(x, y, z);
      updateDistanceSensor(useRobotStore, scene, robotPos, currentRotation);
      
      // Update LiDAR scan (10Hz)
      const scanData = generateLidarScan(scene, robotPos, 36, 5.0);
      lidarScanRef.current = scanData;
      
      // Update occupancy map
      updateOccupancyMap(useRobotStore, scanData, robotPos, 10, 5);
      
      lastLidarUpdate.current = now;
    }
  });

  if (robotType !== 'rover') return null;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* Grid Helper */}
      <gridHelper args={[10, 10]} />

      {/* Rover Body */}
      <group ref={roverRef} name="robot" position={position}>
        {/* Main body */}
        <mesh name="rover-body">
          <boxGeometry args={[0.4, 0.15, 0.3]} />
          <meshStandardMaterial color="#2d5aa0" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Wheels - positioned at corners */}
        <Wheel position={[-0.15, -0.075, 0.12]} />
        <Wheel position={[0.15, -0.075, 0.12]} />
        <Wheel position={[-0.15, -0.075, -0.12]} />
        <Wheel position={[0.15, -0.075, -0.12]} />

        {/* LED Light */}
        <LED color={ledColor} />

        {/* LiDAR Visualization */}
        <LidarVisualization 
          scanData={lidarScanRef.current} 
          robotPosition={position}
        />
      </group>

      {/* Axes Helper */}
      <axesHelper args={[1]} />
    </>
  );
}
