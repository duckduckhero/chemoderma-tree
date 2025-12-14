import React from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNode.css';

/**
 * Custom node component that renders different styles based on node type
 */
function CustomNode({ data, selected }) {
  const { type, label } = data;

  // Determine node styling based on type
  const getNodeClass = () => {
    switch (type) {
      case 'root':
        return 'node-root';
      case 'therapy_class':
        return 'node-therapy-class';
      case 'drug_subclass':
        return 'node-drug-subclass';
      case 'phenotype':
        return 'node-phenotype';
      default:
        return 'node-default';
    }
  };

  // Only show handles for non-root nodes
  const showInputHandle = type !== 'root';
  const showOutputHandle = type !== 'phenotype';

  return (
    <div className={`custom-node ${getNodeClass()} ${selected ? 'selected' : ''}`}>
      {showInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#555' }}
        />
      )}
      <div className="node-content">
        <div className="node-label">{label}</div>
      </div>
      {showOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#555' }}
        />
      )}
    </div>
  );
}

export default CustomNode;

