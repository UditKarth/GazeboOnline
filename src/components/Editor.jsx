import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useRobotStore } from '../store/robotStore';
import { RobotCommandParser, executeCommands } from '../utils/cppParser';

const defaultCode = `void main() {
    robot.moveJoint(0, 45);
    robot.moveJoint(1, 30);
    robot.moveJoint(2, -20);
    robot.openGripper();
    robot.moveJoint(0, 90);
    robot.closeGripper();
}`;

export function CodeEditor() {
  const editorRef = useRef(null);
  const robotStore = useRobotStore();

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

    if (commands.length === 0) {
      alert('No valid robot commands found. Use robot.moveJoint(jointIndex, angle), robot.openGripper(), or robot.closeGripper()');
      return;
    }

    // Reset robot to initial position
    robotStore.reset();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Execute commands sequentially
    await executeCommands(commands, robotStore);
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
          defaultValue={defaultCode}
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
