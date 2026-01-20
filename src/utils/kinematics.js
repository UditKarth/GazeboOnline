import * as THREE from 'three';

/**
 * Forward Kinematics for 5-DOF robot arm
 * Calculates end-effector position from joint angles
 */
export function forwardKinematics(jointAngles) {
  // Convert degrees to radians
  const angles = jointAngles.map(deg => THREE.MathUtils.degToRad(deg));
  
  // Link lengths (in meters) - matching RobotModel.jsx
  const L0 = 0.3;  // Base height
  const L1 = 0.8;  // Shoulder link
  const L2 = 0.7;  // Elbow link
  const L3 = 0.3;  // Wrist link
  const L4 = 0.15; // Gripper offset
  
  // Base rotation (around Y-axis)
  const baseRot = angles[0];
  
  // Shoulder, elbow, wrist rotations (around Z-axis)
  const shoulder = angles[1];
  const elbow = angles[2];
  const wrist = angles[3];
  const gripperRot = angles[4];
  
  // Calculate positions
  // Base is at origin, rotates around Y
  const x0 = 0;
  const y0 = L0 / 2; // Base center
  const z0 = 0;
  
  // Shoulder position (after base rotation)
  const x1 = 0;
  const y1 = y0 + L1 * Math.cos(shoulder) / 2;
  const z1 = L1 * Math.sin(shoulder) / 2;
  
  // Elbow position
  const x2 = 0;
  const y2 = y1 + L1 * Math.cos(shoulder) / 2 + L2 * Math.cos(shoulder + elbow) / 2;
  const z2 = z1 + L1 * Math.sin(shoulder) / 2 + L2 * Math.sin(shoulder + elbow) / 2;
  
  // Wrist position
  const x3 = 0;
  const y3 = y2 + L2 * Math.cos(shoulder + elbow) / 2 + L3 * Math.cos(shoulder + elbow + wrist) / 2;
  const z3 = z2 + L2 * Math.sin(shoulder + elbow) / 2 + L3 * Math.sin(shoulder + elbow + wrist) / 2;
  
  // End-effector position
  const x4 = 0;
  const y4 = y3 + L3 * Math.cos(shoulder + elbow + wrist) / 2 + L4 * Math.cos(shoulder + elbow + wrist);
  const z4 = z3 + L3 * Math.sin(shoulder + elbow + wrist) / 2 + L4 * Math.sin(shoulder + elbow + wrist);
  
  // Apply base rotation
  const x = x4 * Math.cos(baseRot) - z4 * Math.sin(baseRot);
  const y = y4;
  const z = x4 * Math.sin(baseRot) + z4 * Math.cos(baseRot);
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Inverse Kinematics solver using Cyclic Coordinate Descent (CCD) algorithm
 * For 5-DOF arm, we fix the gripper rotation and solve for base, shoulder, elbow, wrist
 */
export function inverseKinematics(targetPos, currentAngles = [0, 0, 0, 0, 0], maxIterations = 50, tolerance = 0.01) {
  // Link lengths
  const L0 = 0.3;
  const L1 = 0.8;
  const L2 = 0.7;
  const L3 = 0.3;
  const L4 = 0.15;
  const totalReach = L1 + L2 + L3 + L4;
  
  // Check if target is reachable
  const distance = targetPos.length();
  if (distance > totalReach) {
    // Scale down to maximum reach
    const scale = totalReach / distance;
    targetPos = targetPos.clone().multiplyScalar(scale);
  }
  
  // Initialize with current angles
  let angles = [...currentAngles];
  
  // Convert to radians
  angles = angles.map(deg => THREE.MathUtils.degToRad(deg));
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Forward kinematics to get current end-effector position
    const currentPos = forwardKinematics(currentAngles.map(rad => THREE.MathUtils.radToDeg(rad)));
    
    // Check convergence
    const error = currentPos.distanceTo(targetPos);
    if (error < tolerance) {
      break;
    }
    
    // CCD: Update each joint from end to base
    // Start from wrist and work backwards
    
    // 1. Update base (joint 0) - rotate to face target
    const baseToTarget = Math.atan2(targetPos.x, targetPos.z);
    angles[0] = baseToTarget;
    
    // 2. Project target onto the plane of the arm (after base rotation)
    const baseRot = angles[0];
    const targetX = targetPos.x * Math.cos(-baseRot) - targetPos.z * Math.sin(-baseRot);
    const targetY = targetPos.y - L0 / 2;
    const targetZ = targetPos.x * Math.sin(-baseRot) + targetPos.z * Math.cos(-baseRot);
    const targetInPlane = new THREE.Vector3(targetX, targetY, targetZ);
    
    // 3. Solve 2D IK for shoulder, elbow, wrist in the arm plane
    const targetDist = Math.sqrt(targetInPlane.y * targetInPlane.y + targetInPlane.z * targetInPlane.z);
    const targetDist2D = targetDist - L4; // Account for gripper offset
    
    // Use geometric IK for 2-link chain (shoulder + elbow)
    const L1_2D = L1;
    const L2_2D = L2;
    const L3_2D = L3;
    
    // Calculate elbow angle using cosine law
    const cosElbow = (L1_2D * L1_2D + L2_2D * L2_2D - targetDist2D * targetDist2D) / (2 * L1_2D * L2_2D);
    const elbowAngle = Math.acos(Math.max(-1, Math.min(1, cosElbow)));
    
    // Calculate shoulder angle
    const alpha = Math.atan2(targetInPlane.z, targetInPlane.y);
    const beta = Math.acos((L1_2D * L1_2D + targetDist2D * targetDist2D - L2_2D * L2_2D) / (2 * L1_2D * targetDist2D));
    const shoulderAngle = alpha - beta;
    
    // Calculate wrist angle to align end-effector
    const wristAngle = -shoulderAngle - elbowAngle;
    
    angles[1] = shoulderAngle;
    angles[2] = elbowAngle;
    angles[3] = wristAngle;
    
    // Keep gripper rotation as is (or set to 0)
    angles[4] = currentAngles[4] ? THREE.MathUtils.degToRad(currentAngles[4]) : 0;
    
    // Convert back to degrees for forward kinematics
    currentAngles = angles.map(rad => THREE.MathUtils.radToDeg(rad));
  }
  
  // Convert final angles back to degrees
  const finalAngles = angles.map(rad => THREE.MathUtils.radToDeg(rad));
  
  // Clamp angles to reasonable limits
  finalAngles[0] = THREE.MathUtils.clamp(finalAngles[0], -180, 180); // Base
  finalAngles[1] = THREE.MathUtils.clamp(finalAngles[1], -90, 90);   // Shoulder
  finalAngles[2] = THREE.MathUtils.clamp(finalAngles[2], -150, 150); // Elbow
  finalAngles[3] = THREE.MathUtils.clamp(finalAngles[3], -90, 90);   // Wrist
  finalAngles[4] = THREE.MathUtils.clamp(finalAngles[4], -180, 180); // Gripper rot
  
  return finalAngles;
}

/**
 * Generate trajectory path from current pose to target pose
 * Returns array of intermediate joint angle configurations
 */
export function generateTrajectory(currentAngles, targetAngles, numSteps = 20) {
  const trajectory = [];
  
  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    // Linear interpolation with easing
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    const intermediateAngles = currentAngles.map((current, idx) => {
      const target = targetAngles[idx];
      return current + (target - current) * eased;
    });
    
    trajectory.push(intermediateAngles);
  }
  
  return trajectory;
}
