import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useRobotStore } from '../store/robotStore';
import * as THREE from 'three';

// Individual joint component
function Joint({ children, rotation, position = [0, 0, 0], axis = 'z' }) {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      const rad = THREE.MathUtils.degToRad(rotation);
      if (axis === 'y') {
        groupRef.current.rotation.y = rad;
      } else {
        groupRef.current.rotation.z = rad;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {children}
    </group>
  );
}

// Link component (the visible parts of the robot)
function Link({ length, width = 0.1, color = '#3b82f6' }) {
  return (
    <mesh>
      <boxGeometry args={[width, length, width]} />
      <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

// Gripper component with animated fingers
function Gripper({ isOpen }) {
  const leftFingerRef = useRef();
  const rightFingerRef = useRef();
  
  useFrame(() => {
    const openAmount = isOpen ? 0.12 : 0.04;
    if (leftFingerRef.current) {
      leftFingerRef.current.position.x = -openAmount;
    }
    if (rightFingerRef.current) {
      rightFingerRef.current.position.x = openAmount;
    }
  });
  
  return (
    <group>
      {/* Left finger */}
      <mesh ref={leftFingerRef} position={[-0.04, 0, 0]}>
        <boxGeometry args={[0.06, 0.15, 0.04]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right finger */}
      <mesh ref={rightFingerRef} position={[0.04, 0, 0]}>
        <boxGeometry args={[0.06, 0.15, 0.04]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.2, 0.08, 0.08]} />
        <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Main Robot Arm Component
export function RobotModel() {
  const { jointAngles, gripperState } = useRobotStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* Grid Helper */}
      <gridHelper args={[10, 10]} />

      {/* Robot Arm Hierarchy */}
      <group position={[0, 0, 0]}>
        {/* Base Joint (Rotation around Y-axis) */}
        <Joint rotation={jointAngles[0]} axis="y">
          {/* Base Link */}
          <Link length={0.3} width={0.2} color="#1e40af" />
          
          {/* Shoulder Joint (Rotation around Z-axis) */}
          <Joint rotation={jointAngles[1]} position={[0, 0.15, 0]}>
            {/* Shoulder Link */}
            <Link length={0.8} color="#3b82f6" />
            
            {/* Elbow Joint */}
            <Joint rotation={jointAngles[2]} position={[0, 0.4, 0]}>
              {/* Elbow Link */}
              <Link length={0.7} color="#60a5fa" />
              
              {/* Wrist Joint */}
              <Joint rotation={jointAngles[3]} position={[0, 0.35, 0]}>
                {/* Wrist Link */}
                <Link length={0.3} color="#93c5fd" />
                
                {/* Gripper Rotation Joint */}
                <Joint rotation={jointAngles[4]} position={[0, 0.15, 0]}>
                  {/* Gripper */}
                  <Gripper isOpen={gripperState === 1} />
                </Joint>
              </Joint>
            </Joint>
          </Joint>
        </Joint>
      </group>

      {/* Axes Helper for debugging */}
      <axesHelper args={[1]} />
    </>
  );
}
