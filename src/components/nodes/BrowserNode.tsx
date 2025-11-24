import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { ExternalLink, X, Maximize2, Minimize2, ArrowLeft, RotateCw, Minus } from 'lucide-react';

interface BrowserNodeData {
    url: string;
    title?: string;
    onDelete?: (id: string) => void;
    onReload?: () => void;
}

const BrowserNode = ({ id, data, isConnectable, selected }: NodeProps<BrowserNodeData>) => {
    // Add timestamp to force reload
    const [reloadKey, setReloadKey] = useState(0);
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(data.url)}&nodeId=${id}&t=${reloadKey}`;
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
        if (isCollapsed) setIsCollapsed(false);
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
        if (isExpanded) setIsExpanded(false);
    };

    const handleReload = useCallback(() => {
        setReloadKey(prev => prev + 1);
    }, []);

    // Dynamic styles
    const baseStyle = "flex flex-col overflow-hidden transition-all duration-500 ease-out border shadow-2xl";

    // Theme: Black Ivory (Zinc/Steel/Ivory)
    // Active: Glow, Full Opacity. Inactive: Dimmed, Lower Opacity.
    const activeStyle = selected
        ? "border-zinc-300 shadow-[0_0_30px_-5px_rgba(255,255,240,0.3)] opacity-100 scale-100 z-50"
        : "border-zinc-800 opacity-60 hover:opacity-90 scale-95 z-0 grayscale-[0.5] hover:grayscale-0";

    const sizeStyle = isExpanded
        ? { width: '900px', height: '700px' }
        : isCollapsed
            ? { width: '250px', height: '50px', minHeight: '50px' }
            : { width: '100%', height: '100%' }; // Let React Flow control size via style prop on node, but we need to fill it.

    return (
        <div
            className={`${baseStyle} ${activeStyle} bg-black rounded-xl h-full`} // Added h-full
            style={isExpanded || isCollapsed ? sizeStyle : undefined} // Only apply fixed sizes for states, otherwise let Resizer control
        >
            <NodeResizer
                color="#71717a" // Zinc-500
                isVisible={selected && !isExpanded && !isCollapsed}
                minWidth={300}
                minHeight={200}
                lineStyle={{ border: '1px solid #71717a' }}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
            />

            {/* Navigation Bar / Header */}
            <div className={`
        h-12 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 
        flex items-center justify-between px-3 gap-3 cursor-grab active:cursor-grabbing drag-handle
        transition-colors duration-300
        ${selected ? 'bg-zinc-900' : 'bg-zinc-950'}
      `}>

                {/* Left Controls */}
                <div className="flex items-center gap-2">
                    {/* Collapse Toggle */}
                    <button
                        onClick={toggleCollapse}
                        className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-ivory transition-colors"
                    >
                        <Minus size={14} />
                    </button>

                    {/* Status Indicator */}
                    <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${selected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-700'}`} />
                </div>

                {/* URL Bar (Fake Input) - Show Title if Collapsed */}
                <div className="flex-1 flex items-center bg-zinc-950/50 border border-zinc-800 rounded-md px-3 py-1.5 mx-2 group hover:border-zinc-700 transition-colors">
                    <span className="text-xs text-zinc-500 font-mono truncate max-w-[200px] select-all group-hover:text-zinc-300 transition-colors">
                        {isCollapsed ? (data.title || data.url) : data.url}
                    </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-1">
                    {!isCollapsed && (
                        <>
                            <button
                                onClick={handleReload}
                                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-200 transition-colors"
                                title="Reload"
                            >
                                <RotateCw size={14} />
                            </button>
                            <button
                                onClick={toggleExpand}
                                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-200 transition-colors"
                                title={isExpanded ? "Minimize" : "Maximize"}
                            >
                                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                            </button>
                            <a
                                href={data.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-200 transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink size={14} />
                            </a>
                        </>
                    )}

                    {data.onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent selecting node when deleting
                                data.onDelete?.(id);
                            }}
                            className="p-1.5 hover:bg-red-900/30 hover:text-red-400 rounded-md text-zinc-600 transition-colors ml-1"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Iframe Content */}
            <div className={`flex-1 bg-zinc-950 relative transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0' : 'opacity-100'} h-full`}>
                {!isCollapsed && (
                    <>
                        <iframe
                            src={proxyUrl}
                            className="border-none bg-white"
                            style={{
                                width: '125%',
                                height: '125%',
                                transform: 'scale(0.8)',
                                transformOrigin: 'top left'
                            }}
                            title={`Node ${id}`}
                            sandbox="allow-scripts allow-same-origin allow-forms"
                        />
                        {/* Overlay for resizing/dragging when not interacting */}
                        {!selected && <div className="absolute inset-0 bg-black/10 backdrop-grayscale-[0.2] pointer-events-none" />}
                    </>
                )}
            </div>

            {/* Handles for connections - Styled as subtle steel dots */}
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-zinc-600 border-2 border-zinc-900 hover:bg-zinc-200 transition-colors"
            />
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-zinc-600 border-2 border-zinc-900 hover:bg-zinc-200 transition-colors"
            />
        </div >
    );
};

export default memo(BrowserNode);
