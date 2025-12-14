/**
 * Transforms the hierarchical tree JSON into ReactFlow nodes and edges
 * @param {Object} treeData - The tree data object
 * @returns {Object} { nodes: Array, edges: Array }
 */
export function transformTreeToReactFlow(treeData) {
  const nodes = [];
  const edges = [];
  let nodeIdCounter = 0;

  /**
   * Recursively process tree nodes
   * @param {Object} node - Current node from tree data
   * @param {string|null} parentId - Parent node ID for edge creation
   * @param {number} level - Depth level for positioning
   */
  function processNode(node, parentId = null, level = 0) {
    const nodeId = node.id || `node-${nodeIdCounter++}`;
    
    // Create node object
    const reactFlowNode = {
      id: nodeId,
      type: node.type || 'default',
      data: {
        label: node.name,
        ...node, // Include all original node properties
      },
      position: { x: 0, y: 0 }, // Will be calculated by dagre
    };

    nodes.push(reactFlowNode);

    // Create edge from parent to current node
    if (parentId) {
      edges.push({
        id: `edge-${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        type: 'smoothstep',
        animated: false,
      });
    }

    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => {
        processNode(child, nodeId, level + 1);
      });
    }
  }

  // Start processing from root
  processNode(treeData);

  return { nodes, edges };
}

/**
 * Get phenotype details by ID
 * @param {Object} treeData - The tree data object
 * @param {string} phenotypeId - The ID of the phenotype node
 * @returns {Object|null} Phenotype data or null
 */
export function getPhenotypeDetails(treeData, phenotypeId) {
  function findPhenotype(node) {
    if (node.id === phenotypeId && node.type === 'phenotype') {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findPhenotype(child);
        if (found) return found;
      }
    }
    return null;
  }
  return findPhenotype(treeData);
}

