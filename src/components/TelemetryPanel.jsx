import { useRef, useEffect } from 'react';
import { useRobotStore } from '../store/robotStore';

export function TelemetryPanel() {
  const { velocity, velocityHistory, occupancyMap, position, rotation, robotType } = useRobotStore();
  const velocityCanvasRef = useRef(null);
  const mapCanvasRef = useRef(null);

  // Draw velocity graph
  useEffect(() => {
    const canvas = velocityCanvasRef.current;
    if (!canvas || robotType !== 'rover') return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.fillText('vx (m/s)', 5, 15);
    ctx.fillText('wz (rad/s)', 5, 30);
    ctx.fillText('0', width - 15, height / 2 + 5);

    if (velocityHistory.length > 1) {
      const timeWindow = 10000; // 10 seconds
      const now = Date.now();
      const minTime = now - timeWindow;

      // Draw vx line (blue)
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let firstPoint = true;
      velocityHistory.forEach((point, index) => {
        if (point.time < minTime) return;
        
        const x = ((point.time - minTime) / timeWindow) * width;
        const vxY = height / 2 - (point.vx * 30); // Scale: 1 m/s = 30 pixels
        const clampedY = Math.max(0, Math.min(height, vxY));

        if (firstPoint) {
          ctx.moveTo(x, clampedY);
          firstPoint = false;
        } else {
          ctx.lineTo(x, clampedY);
        }
      });
      ctx.stroke();

      // Draw wz line (red)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      firstPoint = true;
      velocityHistory.forEach((point) => {
        if (point.time < minTime) return;
        
        const x = ((point.time - minTime) / timeWindow) * width;
        const wzY = height / 2 - (point.wz * 30); // Scale: 1 rad/s = 30 pixels
        const clampedY = Math.max(0, Math.min(height, wzY));

        if (firstPoint) {
          ctx.moveTo(x, clampedY);
          firstPoint = false;
        } else {
          ctx.lineTo(x, clampedY);
        }
      });
      ctx.stroke();
    }

    // Draw current values
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(`vx: ${velocity.vx.toFixed(2)} m/s`, width - 120, 15);
    ctx.fillStyle = '#ef4444';
    ctx.fillText(`wz: ${velocity.wz.toFixed(2)} rad/s`, width - 120, 30);
  }, [velocity, velocityHistory, robotType]);

  // Draw occupancy map
  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas || robotType !== 'rover' || !occupancyMap) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const mapSize = Math.sqrt(occupancyMap.length);
    const cellSize = width / mapSize;

    // Clear canvas
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= mapSize; i++) {
      const pos = (width / mapSize) * i;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(width, pos);
      ctx.stroke();
    }

    // Draw map cells
    for (let i = 0; i < mapSize; i++) {
      for (let j = 0; j < mapSize; j++) {
        const idx = i * mapSize + j;
        const cellValue = occupancyMap[idx];
        
        let color = '#111827'; // Unknown (black)
        if (cellValue === 1) {
          color = '#374151'; // Free space (gray)
        } else if (cellValue === 2) {
          color = '#ef4444'; // Occupied (red)
        }

        ctx.fillStyle = color;
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }

    // Draw robot position (centered)
    const [x, , z] = position;
    const mapCenterX = width / 2;
    const mapCenterZ = height / 2;
    const cellSizeMeters = 10 / mapSize; // 10m map size
    const robotX = mapCenterX + (x / cellSizeMeters);
    const robotZ = mapCenterZ + (z / cellSizeMeters);

    // Draw robot as a small circle
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(robotX, robotZ, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw robot direction indicator
    const dirLength = 10;
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(robotX, robotZ);
    ctx.lineTo(
      robotX + Math.sin(rotation) * dirLength,
      robotZ + Math.cos(rotation) * dirLength
    );
    ctx.stroke();
  }, [occupancyMap, position, rotation, robotType]);

  // Update velocity history continuously
  useEffect(() => {
    if (robotType !== 'rover') return;

    const interval = setInterval(() => {
      const state = useRobotStore.getState();
      state.addVelocityHistory(state.velocity.vx, state.velocity.wz);
    }, 33); // ~30fps

    return () => clearInterval(interval);
  }, [robotType]);

  if (robotType !== 'rover') return null;

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800 border-t border-gray-700">
      {/* Velocity Graph */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-2">Velocity Graph</h3>
        <div className="bg-gray-900 rounded p-2">
          <canvas
            ref={velocityCanvasRef}
            width={400}
            height={150}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Occupancy Map */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-2">Occupancy Map</h3>
        <div className="bg-gray-900 rounded p-2">
          <canvas
            ref={mapCanvasRef}
            width={300}
            height={300}
            className="w-full h-full"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Robot position: ({position[0].toFixed(2)}, {position[2].toFixed(2)})
        </p>
      </div>
    </div>
  );
}
