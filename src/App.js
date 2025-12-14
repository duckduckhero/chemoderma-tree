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
import NavigationBar from './components/NavigationBar';
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
  const [allNodes, setAllNodes] = useState([]);
  const [allEdges, setAllEdges] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set()); // Start with nothing expanded (only root visible)
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
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 200 });
    
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
    
    // Store all nodes and edges
    setAllNodes(layoutedNodes);
    setAllEdges(initialEdges);
  }, [treeData]);

  // Filter visible nodes and edges based on expansion state
  useEffect(() => {
    if (allNodes.length === 0) return;

    // Build a set of visible node IDs (root is always visible + all descendants of expanded nodes)
    const visibleNodeIds = new Set(['root']);
    
    function addVisibleChildren(nodeId) {
      // Root is always visible, but only show its children if expanded
      // For other nodes, only show children if the node itself is expanded
      if (nodeId !== 'root' && !expandedNodes.has(nodeId)) return;
      
      // Find all children of this node
      const children = allEdges
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target);
      
      children.forEach(childId => {
        visibleNodeIds.add(childId);
        addVisibleChildren(childId); // Recursively add children if parent is expanded
      });
    }
    
    // Start from root - it's always visible, show children if expanded
    if (expandedNodes.has('root')) {
      addVisibleChildren('root');
    }
    
    // Filter nodes and edges
    const visibleNodes = allNodes.filter(node => visibleNodeIds.has(node.id));
    const visibleEdges = allEdges.filter(
      edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
    
    // Recalculate layout for visible nodes only
    const tempGraph = new dagre.graphlib.Graph();
    tempGraph.setDefaultEdgeLabel(() => ({}));
    tempGraph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 200 });
    
    visibleNodes.forEach((node) => {
      tempGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
    
    visibleEdges.forEach((edge) => {
      tempGraph.setEdge(edge.source, edge.target);
    });
    
    dagre.layout(tempGraph);
    
    const relayoutedNodes = visibleNodes.map((node) => {
      const nodeWithPosition = tempGraph.node(node.id);
      if (nodeWithPosition) {
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
          },
        };
      }
      return node;
    });
    
    setNodes(relayoutedNodes);
    setEdges(visibleEdges);
    
    // Fit view after layout
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ 
          padding: 0.2,
          minZoom: 0.1,
          maxZoom: 1.5,
        });
      }
    }, 100);
  }, [allNodes, allEdges, expandedNodes, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    // If it's a phenotype, show details panel
    if (node.type === 'phenotype' && treeData) {
      const phenotypeData = getPhenotypeDetails(treeData, node.id);
      if (phenotypeData) {
        setSelectedPhenotype(phenotypeData);
        setIsPanelOpen(true);
      }
    } 
    // For other node types, toggle expansion
    else if (node.type !== 'phenotype') {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(node.id)) {
          newSet.delete(node.id);
        } else {
          newSet.add(node.id);
        }
        return newSet;
      });
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
      <NavigationBar />
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
