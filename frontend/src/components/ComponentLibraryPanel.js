function ComponentLibraryPanel() {
  const components = ['User Query', 'KnowledgeBase', 'LLM Engine', 'Output'];

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="component-library" style={{ fontSize: '30px' }}>
      <span className="library-title">Component Library:</span>
      <div className="library-buttons">
        {components.map((comp, idx) => (
          <button
            key={idx}
            draggable
            onDragStart={(event) => onDragStart(event, comp)}
          >
            {comp}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ComponentLibraryPanel;
