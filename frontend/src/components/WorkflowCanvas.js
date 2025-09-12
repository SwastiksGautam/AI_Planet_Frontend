import React, { useState, useEffect } from 'react';
import ReactFlow, { Background, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';

function WorkflowCanvas({ nodes, edges, setNodes, setEdges, customMode, toggleCustomMode, setReactFlowInstance }) {
    const [reactFlowInstanceInternal, setInternalReactFlowInstance] = useState(null);
    const [selection, setSelection] = useState({ nodes: [], edges: [] });

    const onDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (event) => {
        if (!customMode) return; // Only allow adding nodes in Custom Mode
        event.preventDefault();
        if (!reactFlowInstanceInternal) return;

        const nodeLabel = event.dataTransfer.getData('application/reactflow');
        if (!nodeLabel) return;

        const bounds = event.target.getBoundingClientRect();
        const position = reactFlowInstanceInternal.project({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
        });

        const newNode = {
            id: `node_${+new Date()}`,
            type: 'default',
            position,
            data: { label: nodeLabel },
        };

        setNodes((nds) => [...nds, newNode]);
    };

    const handleNodesChange = (changes) => {
        if (!customMode) return; // Prevent moving nodes in Default Diagram
        setNodes((nds) => applyNodeChanges(changes, nds));
    };

    const handleEdgesChange = (changes) => {
        if (!customMode) return;
        setEdges((eds) => applyEdgeChanges(changes, eds));
    };

    const handleConnect = (connection) => {
        if (!customMode) return; // Prevent creating edges in Default Diagram
        setEdges((eds) => addEdge(connection, eds));
    };

    const onNodeDoubleClick = (_, node) => {
        if (!customMode) return; // Prevent moving nodes in Default Diagram
        const newPosition = { x: node.position.x + 50, y: node.position.y + 50 };
        setNodes((nds) =>
            nds.map((n) => (n.id === node.id ? { ...n, position: newPosition } : n))
        );
    };

    // Track selection
    const onSelectionChange = ({ nodes: selectedNodes, edges: selectedEdges }) => {
        setSelection({ nodes: selectedNodes, edges: selectedEdges });
    };

    // Delete selected nodes/edges (only in Custom Mode)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!customMode) return; // Delete allowed only in Custom Mode
            if (e.key === 'Delete') {
                if (selection.nodes.length > 0) {
                    setNodes((nds) => nds.filter((n) => !selection.nodes.some(s => s.id === n.id)));
                }
                if (selection.edges.length > 0) {
                    setEdges((eds) => eds.filter((e) => !selection.edges.some(s => s.id === e.id)));
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selection, setNodes, setEdges, customMode]);

    return (
        <div className="workflow-canvas" onDragOver={onDragOver} onDrop={onDrop}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ color: '#f3f4f6' }}>Workflow Canvas</h3>
                <button
                    onClick={toggleCustomMode}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#272d43ff',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    {customMode ? 'Switch to Agent Workflow' : 'Switch to Custom Mode'}
                </button>
            </div>

            <div style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={handleConnect}
                    onInit={(instance) => {
                        setInternalReactFlowInstance(instance);
                        setReactFlowInstance(instance);
                    }}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onSelectionChange={onSelectionChange}
                    fitView
                    nodesDraggable={customMode}      // ✅ Draggable only in Custom Mode
                    nodesConnectable={customMode}    // ✅ Connectable only in Custom Mode
                    panOnDrag={false}
                    zoomOnScroll={true}
                    zoomOnDoubleClick={true}
                    panOnScroll={false}
                    proOptions={{ hideAttribution: true }}
                    style={{ width: '100%', height: '100%' }}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                    minZoom={0.5}
                    maxZoom={2}
                >
                    <Background />
                </ReactFlow>
            </div>
        </div>
    );
}

export default WorkflowCanvas;
