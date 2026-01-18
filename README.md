# Gazebo Online - Robot IDE & Simulator

A React-based web application featuring a side-by-side IDE and 3D Robot Simulation.

## Features

- **3D Simulation**: 5-DOF robot arm with gripper using Three.js and React Three Fiber
- **Code Editor**: Monaco Editor with C++ syntax support
- **Robot Controller API**: Simple C++ API for controlling the robot
- **Animated Movements**: Smooth interpolated joint rotations
- **Dark Theme**: Professional engineering interface with Tailwind CSS

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Usage

Write C++ code in the editor using the robot API:

```cpp
void main() {
    robot.moveJoint(0, 45);      // Move base joint to 45 degrees
    robot.moveJoint(1, 30);      // Move shoulder joint to 30 degrees
    robot.openGripper();          // Open the gripper
    robot.closeGripper();         // Close the gripper
}
```

### Available Commands

- `robot.moveJoint(jointIndex, angle)` - Move a joint to a specific angle
  - `jointIndex`: 0 (Base), 1 (Shoulder), 2 (Elbow), 3 (Wrist), 4 (Gripper Rotation)
  - `angle`: Angle in degrees (can be negative)
- `robot.openGripper()` - Open the gripper
- `robot.closeGripper()` - Close the gripper

## Project Structure

```
src/
  ├── components/
  │   ├── Editor.jsx          # Monaco code editor component
  │   ├── RobotModel.jsx      # 3D robot arm component
  │   └── SimulationView.jsx  # 3D canvas wrapper
  ├── store/
  │   └── robotStore.js       # Zustand state management
  ├── utils/
  │   └── cppParser.js        # C++ code parser and executor
  ├── App.jsx                 # Main application component
  ├── main.jsx                # React entry point
  └── index.css               # Tailwind CSS imports
```

## Technologies

- React 18
- Three.js & @react-three/fiber
- Monaco Editor
- Zustand (State Management)
- Tailwind CSS
- Vite
