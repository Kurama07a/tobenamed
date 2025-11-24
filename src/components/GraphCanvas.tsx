'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    useReactFlow,
    Panel,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import BrowserNode from './nodes/BrowserNode';
import { Plus, Search, Focus } from 'lucide-react';

const nodeTypes = {
    browser: BrowserNode,
};

const INITIAL_NODES: Node[] = [
    {
        id: '1',
        type: 'browser',
        position: { x: 250, y: 250 },
        data: { url: 'https://en.wikipedia.org/wiki/Main_Page', title: 'Wikipedia' },
        style: { width: 850, height: 600 },
    },
];

// Custom Edge Style
const defaultEdgeOptions = {
    style: { stroke: '#52525b', strokeWidth: 2 }, // Zinc-600
    type: 'smoothstep', // Or 'bezier'
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#52525b',
    },
    animated: true,
};

const GraphCanvasContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView, setCenter } = useReactFlow();

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#71717a' } }, eds)),
        [setEdges]
    );

    const handleDeleteNode = useCallback((id: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    }, [setNodes, setEdges]);

    // Update nodes with delete handler
    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: { ...node.data, onDelete: handleDeleteNode },
            }))
        );
    }, [handleDeleteNode, setNodes]);

    // Listen for iframe messages
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { data } = event;
            if (data?.type === 'GRAPH_NAV_CLICK' && data.url && data.nodeId) {
                console.log('Spawning new node from:', data.nodeId, 'to', data.url);
                spawnNode(data.nodeId, data.url);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [nodes, edges]);

    const spawnNode = (sourceNodeId: string, url: string) => {
        const sourceNode = nodes.find((n) => n.id === sourceNodeId);
        if (!sourceNode) return;

        const newNodeId = uuidv4();
        // Offset logic for visual tree
        const newPosition = {
            x: sourceNode.position.x + 900, // Increased offset for larger nodes
            y: sourceNode.position.y + (Math.random() * 200 - 100),
        };

        const newNode: Node = {
            id: newNodeId,
            type: 'browser',
            position: newPosition,
            data: {
                url,
                title: url,
                onDelete: handleDeleteNode
            },
            selected: true, // Auto-focus new node
            style: { width: 850, height: 600 },
        };

        const newEdge: Edge = {
            id: `e${sourceNodeId}-${newNodeId}`,
            source: sourceNodeId,
            target: newNodeId,
            animated: true,
            style: { stroke: '#71717a', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a' }
        };

        // Deselect other nodes
        setNodes((nds) => nds.map(n => ({ ...n, selected: false } as Node)).concat(newNode));
        setEdges((eds) => [...eds, newEdge]);

        // Pan to new node after slight delay
        setTimeout(() => {
            fitView({ nodes: [newNode], duration: 800, padding: 0.5 });
        }, 100);
    };

    const [inputUrl, setInputUrl] = useState('');

    const addStartNode = () => {
        if (!inputUrl) return;
        const id = uuidv4();
        const newNode: Node = {
            id,
            type: 'browser',
            position: { x: 100, y: 100 },
            data: { url: inputUrl, onDelete: handleDeleteNode },
            selected: true,
            style: { width: 850, height: 600 },
        };
        setNodes((nds) => nds.map(n => ({ ...n, selected: false } as Node)).concat(newNode));
        setInputUrl('');
        setTimeout(() => fitView({ nodes: [newNode], duration: 800 }), 100);
    };

    return (
        <div className="w-full h-screen bg-[#09090b] text-zinc-100">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                panOnScroll
                selectionOnDrag
                panOnDrag={[1, 2]}
                zoomOnScroll
                zoomOnDoubleClick
                className="bg-[#09090b]"
            >
                <Background color="#27272a" gap={20} size={1} />

                <Controls className="bg-zinc-900 border-zinc-800 fill-zinc-400 text-zinc-400" />

                <MiniMap
                    className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl"
                    maskColor="rgba(9, 9, 11, 0.8)"
                    nodeColor={() => '#3f3f46'} // Zinc-700
                />

                {/* Top Bar / Navigation */}
                <Panel position="top-center" className="mt-4">
                    <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-2 rounded-xl shadow-2xl flex gap-3 items-center">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-zinc-300 transition-colors" />
                            <input
                                type="text"
                                value={inputUrl}
                                onChange={e => setInputUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addStartNode()}
                                placeholder="Enter URL to start..."
                                className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg pl-9 pr-3 py-2 w-80 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all placeholder:text-zinc-600"
                            />
                        </div>
                        <button
                            onClick={addStartNode}
                            className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-zinc-900/50"
                        >
                            <Plus size={16} />
                            <span>New Node</span>
                        </button>
                        <div className="w-px h-6 bg-zinc-800 mx-1" />
                        <button
                            onClick={() => fitView({ duration: 800 })}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Recenter Map"
                        >
                            <Focus size={18} />
                        </button>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default function GraphCanvas() {
    return (
        <ReactFlowProvider>
            <GraphCanvasContent />
        </ReactFlowProvider>
    );
}
