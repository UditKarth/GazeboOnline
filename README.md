# Gazebo Online - Robot IDE & Simulator

A React-based web application featuring a side-by-side IDE and 3D Robot Simulation with support for multiple robot types.

## Features

- **Dual Robot Types**: Switch between a 5-DOF robot arm with gripper and a 4-wheel rover
- **3D Simulation**: Real-time 3D visualization using Three.js and React Three Fiber
- **Code Editor**: Monaco Editor with C++ syntax support and robot-specific code templates
- **Robot Controller API**: Simple C++ API for controlling robots with ROS2-style commands
- **Physics Engine**: Realistic physics simulation for the rover with friction and watchdog behavior
- **LiDAR Visualization**: 360° LiDAR scan visualization for the rover
- **Telemetry Dashboard**: Real-time velocity graphs and occupancy maps for the rover
- **Animated Movements**: Smooth interpolated joint rotations for the arm
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

Use the robot type toggle in the top right to switch between the 5-DOF Arm and 4-Wheel Rover. Write C++ code in the editor using the robot API for your selected robot type.

### 5-DOF Robot Arm

```cpp
void main() {
    robot.moveJoint(0, 45);      // Move base joint to 45 degrees
    robot.moveJoint(1, 30);      // Move shoulder joint to 30 degrees
    robot.openGripper();          // Open the gripper
    robot.closeGripper();         // Close the gripper
}
```

#### Arm Commands

- `robot.moveJoint(jointIndex, angle)` - Move a joint to a specific angle
  - `jointIndex`: 0 (Base), 1 (Shoulder), 2 (Elbow), 3 (Wrist), 4 (Gripper Rotation)
  - `angle`: Angle in degrees (can be negative)
- `robot.openGripper()` - Open the gripper
- `robot.closeGripper()` - Close the gripper

### 4-Wheel Rover

```cpp
void main() {
    robot.setLight("green");
    robot.move(1.0, 0.0);  // Move forward at 1 m/s
    float dist = robot.getDistance();
    if (dist < 2.0) {
        robot.move(0.0, 0.5);  // Turn if obstacle detected
    }
    robot.move(0.0, 0.0);  // Stop
}
```

#### Rover Commands (ROS2-style)

- `robot.move(vx, wz)` - Set linear and angular velocity (ROS2 `cmd_vel` equivalent)
  - `vx`: Linear velocity in m/s (forward/backward)
  - `wz`: Angular velocity in rad/s (rotation)
  - Robot automatically stops if no command received for 500ms (ROS2 watchdog)
- `robot.getDistance()` - Returns frontal distance sensor reading in meters (0-5m)
- `robot.setLight(color)` - Change LED color (e.g., "red", "#00ff00", "blue")

#### Rover Features

- **Physics-based Movement**: Realistic velocity-based control with friction
- **LiDAR Visualization**: 360° scan pattern with red lines showing detected obstacles
- **Distance Sensor**: Frontal raycast sensor with 5m range
- **Telemetry Panel**: 
  - Real-time velocity graph (vx and wz over time)
  - Occupancy map showing robot position and detected obstacles

## Project Structure

```
src/
  ├── components/
  │   ├── Editor.jsx           # Monaco code editor component
  │   ├── RobotModel.jsx       # 3D robot arm component
  │   ├── RoverModel.jsx       # 3D rover component with LiDAR
  │   ├── SimulationView.jsx   # 3D canvas wrapper
  │   ├── Documentation.jsx    # Robot API documentation
  │   ├── RobotTypeToggle.jsx  # Robot type selector
  │   └── TelemetryPanel.jsx   # Velocity graph and occupancy map
  ├── store/
  │   └── robotStore.js        # Zustand state management for both robots
  ├── utils/
  │   ├── cppParser.js         # C++ code parser and executor
  │   └── physics.js           # Physics engine for rover movement
  ├── App.jsx                  # Main application component
  ├── main.jsx                 # React entry point
  └── index.css                # Tailwind CSS imports
```

## Technologies

- React 18
- Three.js & @react-three/fiber
- @react-three/drei (3D helpers)
- Monaco Editor
- Zustand (State Management)
- Tailwind CSS
- Vite

## Robot Types

### 5-DOF Robot Arm
- 5 degrees of freedom (base, shoulder, elbow, wrist, gripper rotation)
- Animated gripper with open/close functionality
- Smooth joint animations with easing

### 4-Wheel Rover
- Physics-based movement with velocity control
- 360° LiDAR visualization
- Frontal distance sensor
- LED indicator
- Real-time telemetry (velocity graphs, occupancy maps)
- ROS2-style command interface
