import { CodeEditor } from './components/Editor';
import { SimulationView } from './components/SimulationView';

function App() {
  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Gazebo Online - Robot IDE & Simulator</h1>
        <p className="text-sm text-gray-400 mt-1">Code your robot movements in C++ and see them execute in real-time</p>
      </header>

      {/* Main Content - Side by Side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor */}
        <div className="w-1/2 border-r border-gray-700">
          <CodeEditor />
        </div>

        {/* Right: 3D Simulation */}
        <div className="w-1/2">
          <SimulationView />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-3">
        <p className="text-sm text-gray-400 text-center">
          Made with <span className="text-red-500">❤️</span> by{' '}
          <a
            href="https://github.com/UditKarth/GazeboOnline"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors underline"
          >
            Udit
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
