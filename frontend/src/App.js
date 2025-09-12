import React, { useState } from 'react';
import ComponentLibraryPanel from './components/ComponentLibraryPanel';
import WorkflowCanvas from './components/WorkflowCanvas';
import ChatInterface from './components/ChatInterface';
import './App.css';

const initialNodesData = [
  { id: '1', position: { x: 160, y: 100 }, type: 'custom', data: { label: 'llm (Agent Brain)' } },
  { id: '2', position: { x: 160, y: 250 }, type: 'custom', data: { label: 'take_action (Tool Executor)' } },
  { id: '3', type: 'io', position: { x: 0, y: 175 }, data: { label: 'User Input' } },
  { id: '4', type: 'io', position: { x: 340, y: 175 }, data: { label: 'Final Answer' } },
];

const initialEdgesData = [
  { id: 'e3-1', source: '3', target: '1', animated: true },
  { id: 'e1-2', source: '1', target: '2', label: 'Tool needed' },
  { id: 'e1-4', source: '1', target: '4', label: 'No tool needed' },
  { id: 'e2-1', source: '2', target: '1', type: 'smoothstep', animated: true },
];

function App() {
  const [nodes, setNodes] = useState(initialNodesData);
  const [edges, setEdges] = useState(initialEdgesData);
  const [customMode, setCustomMode] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const toggleCustomMode = () => {
    setCustomMode((prev) => !prev);

    if (!customMode) {
      setNodes([]); // Switch to Custom Mode → empty canvas
      setEdges([]);
    } else {
      setNodes(initialNodesData); // Switch to Default Diagram
      setEdges(initialEdgesData);
    }
  };

  return (
    <div className="App">
      {/* Removed the header */}


      <div className="container">
        <div className="left-column">
          <ComponentLibraryPanel
            addComponent={(label) => {
              const newNode = {
                id: `node_${+new Date()}`,
                type: 'custom',
                position: { x: 250, y: 250 },
                data: { label },
              };
              setNodes((nds) => [...nds, newNode]);
            }}
          />

          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
            customMode={customMode}
            toggleCustomMode={toggleCustomMode}
            setReactFlowInstance={setReactFlowInstance}
          />
        </div>
        <ChatInterface />
      </div>
    </div>
  );
}

export default App;
