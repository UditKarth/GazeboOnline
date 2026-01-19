import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useRobotStore } from '../store/robotStore';
import { RobotCommandParser, executeCommands } from '../utils/cppParser';

const defaultArmCode = `void main() {
    robot.moveJoint(0, 45);
    robot.moveJoint(1, 30);
    robot.moveJoint(2, -20);
    robot.openGripper();
    robot.moveJoint(0, 90);
    robot.closeGripper();
}`;

const defaultRoverCode = `void main() {
    robot.setLight("green");
    robot.move(1.0, 0.0);  // Move forward at 1 m/s
    // Wait a bit...
    float dist = robot.getDistance();
    if (dist < 2.0) {
        robot.move(0.0, 0.5);  // Turn if obstacle detected
    }
    robot.move(0.0, 0.0);  // Stop
}`;

export function CodeEditor() {
  const editorRef = useRef(null);
  const robotStore = useRobotStore();
  const { robotType } = robotStore;
  const [code, setCode] = useState(robotType === 'arm' ? defaultArmCode : defaultRoverCode);

  // Update code when robot type changes
  useEffect(() => {
    if (editorRef.current) {
      const newCode = robotType === 'arm' ? defaultArmCode : defaultRoverCode;
      editorRef.current.setValue(newCode);
      setCode(newCode);
    }
  }, [robotType]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure C++ language settings
    monaco.languages.setLanguageConfiguration('cpp', {
      comments: {
        lineComment: '//',
        blockComment: ['/*', '*/']
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    });
  };

  const handleRun = async () => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    const parser = new RobotCommandParser();
    const commands = parser.parse(code);

    // Filter commands for current robot type
    const validCommands = commands.filter(cmd => 
      !cmd.robotType || cmd.robotType === robotType
    );

    if (validCommands.length === 0) {
      const errorMsg = robotType === 'arm'
        ? 'No valid robot commands found. Use robot.moveJoint(jointIndex, angle), robot.openGripper(), or robot.closeGripper()'
        : 'No valid robot commands found. Use robot.move(vx, wz), robot.getDistance(), or robot.setLight(color)';
      alert(errorMsg);
      return;
    }

    // Reset robot to initial position
    robotStore.reset();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Execute commands sequentially
    await executeCommands(validCommands, robotStore);
  };

  const handleReset = () => {
    robotStore.reset();
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Code Editor (C++)</h2>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleRun}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
          >
            Run
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
