import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
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

// Gripper component with animated fingers and collision detection
function Gripper({ isOpen, maxEffort, onCollision }) {
  const leftFingerRef = useRef();
  const rightFingerRef = useRef();
  const { setGripperEffort } = useRobotStore();
  
  useFrame(() => {
    const targetOpenAmount = isOpen ? 0.12 : 0.04;
    const currentLeftX = leftFingerRef.current?.position.x || -0.04;
    const currentRightX = rightFingerRef.current?.position.x || 0.04;
    
    // Calculate effort based on how much we're trying to close
    const currentGap = Math.abs(currentRightX - currentLeftX);
    const targetGap = isOpen ? 0.24 : 0.08;
    const effortRatio = !isOpen ? Math.max(0, (targetGap - currentGap) / targetGap) : 0;
    const currentEffort = effortRatio * (maxEffort || 0.8);
    
    // Update effort in store
    if (!isOpen && setGripperEffort) {
      setGripperEffort(currentEffort);
    } else if (isOpen) {
      setGripperEffort(0);
    }
    
    // Check for collision if closing and effort exceeds threshold
    if (!isOpen && maxEffort > 0 && currentEffort >= maxEffort) {
      // Collision detected - stop movement
      if (onCollision) onCollision();
      return;
    }
    
    // Smoothly move fingers
    const speed = 0.02;
    const newLeftX = currentLeftX > -targetOpenAmount 
      ? Math.max(currentLeftX - speed, -targetOpenAmount)
      : Math.min(currentLeftX + speed, -targetOpenAmount);
    const newRightX = currentRightX < targetOpenAmount
      ? Math.min(currentRightX + speed, targetOpenAmount)
      : Math.max(currentRightX - speed, targetOpenAmount);
    
    if (leftFingerRef.current) {
      leftFingerRef.current.position.x = newLeftX;
    }
    
    if (rightFingerRef.current) {
      rightFingerRef.current.position.x = newRightX;
    }
  });
  
  return (
    <group name="gripper">
      {/* Left finger */}
      <mesh ref={leftFingerRef} position={[-0.04, 0, 0]} name="finger-left">
        <boxGeometry args={[0.06, 0.15, 0.04]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right finger */}
      <mesh ref={rightFingerRef} position={[0.04, 0, 0]} name="finger-right">
        <boxGeometry args={[0.06, 0.15, 0.04]} />
        <meshStandardMaterial color="#ef4444" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.05, 0]} name="gripper-base">
        <boxGeometry args={[0.2, 0.08, 0.08]} />
        <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Path visualization component
function PathVisualization({ pathPoints }) {
  if (!pathPoints || pathPoints.length < 2) return null;
  
  const points = pathPoints.map(point => [point.x, point.y, point.z]).flat();
  const geometry = new THREE.BufferGeometry().setFromPoints(
    pathPoints.map(p => new THREE.Vector3(p.x, p.y, p.z))
  );
  
  return (
    <line name="trajectory-path" geometry={geometry}>
      <lineBasicMaterial color="#00ff00" opacity={0.4} transparent linewidth={2} />
    </line>
  );
}

// Main Robot Arm Component
export function RobotModel() {
  const { 
    jointAngles, 
    gripperState, 
    gripperMaxEffort,
    gripperEffort,
    trajectoryPath,
    robotType,
    setGripperEffort 
  } = useRobotStore();
  
  const handleGripperCollision = () => {
    // Stop gripper movement on collision
    setGripperEffort(gripperMaxEffort);
  };

  if (robotType !== 'arm') return null;

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
                  <Gripper 
                    isOpen={gripperState === 1} 
                    maxEffort={gripperMaxEffort}
                    onCollision={handleGripperCollision}
                  />
                </Joint>
              </Joint>
            </Joint>
          </Joint>
        </Joint>
      </group>

      {/* Path Visualization */}
      <PathVisualization pathPoints={trajectoryPath} />

      {/* Axes Helper for debugging */}
      <axesHelper args={[1]} />
    </>
  );
}
