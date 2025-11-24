import React, { useState } from 'react';
import { Node, useReactFlow } from 'reactflow';
import { ChevronRight, ChevronDown, Globe, Folder, FolderOpen, ChevronLeft } from 'lucide-react';

interface SidebarProps {
    nodes: Node[];
}

const SidebarItem = ({ node, allNodes, onNavigate }: { node: Node, allNodes: Node[], onNavigate: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isGroup = node.type === 'group';
    const children = allNodes.filter(n => n.parentNode === node.id);
    const hasChildren = children.length > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onNavigate(node.id);
    };

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="pl-2">
            <div
                className={`
                    flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors
                    hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200
                `}
                onClick={handleClick}
            >
                {isGroup && (
                    <button onClick={toggleOpen} className="p-0.5 hover:bg-zinc-700 rounded">
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                )}

                {isGroup ? (
                    isOpen ? <FolderOpen size={14} className="text-zinc-500" /> : <Folder size={14} className="text-zinc-500" />
                ) : (
                    <Globe size={14} className="text-emerald-500/70" />
                )}

                <span className="text-sm truncate select-none">
                    {node.data.label || node.data.title || node.data.url || 'Untitled'}
                </span>
            </div>

            {isGroup && isOpen && hasChildren && (
                <div className="border-l border-zinc-800 ml-2.5">
                    {children.map(child => (
                        <SidebarItem
                            key={child.id}
                            node={child}
                            allNodes={allNodes}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Sidebar({ nodes }: SidebarProps) {
    const { fitView } = useReactFlow();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleNavigate = (id: string) => {
        fitView({ nodes: [{ id } as any], duration: 800, padding: 0.5 });
    };

    // Get top-level nodes (no parent)
    const rootNodes = nodes.filter(n => !n.parentNode);

    return (
        <div
            className={`
                absolute left-4 top-4 bottom-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-12' : 'w-64'}
            `}
        >
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                {!isCollapsed && <h2 className="text-zinc-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap">Explorer</h2>}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors mx-auto"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {rootNodes.length === 0 ? (
                        <div className="text-zinc-600 text-sm text-center mt-10 italic">
                            No nodes yet.
                        </div>
                    ) : (
                        rootNodes.map(node => (
                            <SidebarItem
                                key={node.id}
                                node={node}
                                allNodes={nodes}
                                onNavigate={handleNavigate}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
