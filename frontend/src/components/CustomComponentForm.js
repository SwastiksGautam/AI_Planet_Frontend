import React, { useState } from 'react';

function CustomComponentForm({ addCustomComponent }) {
  const [componentName, setComponentName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!componentName.trim()) return;

    addCustomComponent(componentName, 'default');
    setComponentName('');
  };

  return (
    <div style={{ marginBottom: '15px', color: '#f3f4f6' }}>
      <h4>Create Custom Component</h4>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Component Name"
          value={componentName}
          onChange={(e) => setComponentName(e.target.value)}
          style={{ flex: 1, padding: '6px', borderRadius: '6px' }}
        />
        <button type="submit" style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          Add
        </button>
      </form>
    </div>
  );
}

export default CustomComponentForm;
