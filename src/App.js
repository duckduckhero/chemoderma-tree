import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

import CustomNode from './components/CustomNode';
import PhenotypeDetailsPanel from './components/PhenotypeDetailsPanel';
import { transformTreeToReactFlow, getPhenotypeDetails } from './utils/dataTransform';
import './App.css';

// Define custom node types
const nodeTypes = {
  default: CustomNode,
  root: CustomNode,
  therapy_class: CustomNode,
  drug_subclass: CustomNode,
  phenotype: CustomNode,
};

// Dagre layout configuration for horizontal layout
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 80;

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPhenotype, setSelectedPhenotype] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [treeData, setTreeData] = useState(null);
  const reactFlowInstance = useRef(null);

  // Load tree data
  useEffect(() => {
    fetch('/chemoderma_tree.json')
      .then((response) => response.json())
      .then((data) => setTreeData(data))
      .catch((error) => console.error('Error loading tree data:', error));
  }, []);

  // Transform tree data and apply layout
  useEffect(() => {
    if (!treeData) return;

    const { nodes: initialNodes, edges: initialEdges } = transformTreeToReactFlow(treeData);
    
    // Apply dagre layout - increased horizontal spacing (ranksep) for wider tree
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 350 });
    
    initialNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
    
    initialEdges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });
    
    dagre.layout(dagreGraph);
    
    const layoutedNodes = initialNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    });
    
    setNodes(layoutedNodes);
    setEdges(initialEdges);
    
    // Fit view after a short delay to ensure nodes are rendered
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ 
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5,
        });
      }
    }, 100);
  }, [treeData, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'phenotype' && treeData) {
      const phenotypeData = getPhenotypeDetails(treeData, node.id);
      if (phenotypeData) {
        setSelectedPhenotype(phenotypeData);
        setIsPanelOpen(true);
      }
    }
  }, [treeData]);

  // Handle edge connection (not needed for tree, but required by ReactFlow)
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Close panel
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedPhenotype(null);
  }, []);

  if (!treeData) {
    return (
      <div className="app-container loading">
        <div className="loading-message">Loading ChemoDERMA Tree...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="reactflow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      
      <PhenotypeDetailsPanel
        phenotype={selectedPhenotype}
        isOpen={isPanelOpen}
        onClose={closePanel}
      />
    </div>
  );
}

export default App;
