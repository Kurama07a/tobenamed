import React, { memo, useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { FolderOpen, Edit2, Check } from 'lucide-react';

interface GroupNodeData {
    label: string;
}

const GroupNode = ({ id, data, selected }: NodeProps<GroupNodeData>) => {
    const [isEditing, setIsEditing] = useState(false);
    const [label, setLabel] = useState(data.label || 'New Group');

    const onLabelChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(evt.target.value);
        // We mutate data directly here for simplicity in this specific context, 
        // but ideally this should propagate up via an onNodeDataChange callback if we had one.
        // For visual updates it works because React Flow handles data updates.
        data.label = evt.target.value;
    };

    const toggleEdit = () => setIsEditing(!isEditing);

    return (
        <div className={`
            w-full h-full rounded-xl border-2 border-dashed transition-all duration-300
            ${selected ? 'border-zinc-400 bg-zinc-900/20' : 'border-zinc-700 bg-zinc-900/10'}
        `}>
            <NodeResizer
                color="#71717a"
                isVisible={selected}
                minWidth={100}
                minHeight={100}
            />

            <div className="absolute -top-8 left-0 flex items-center gap-2">
                <FolderOpen className="text-zinc-500" size={16} />
                {isEditing ? (
                    <div className="flex items-center bg-zinc-800 rounded px-1 border border-zinc-700">
                        <input
                            value={label}
                            onChange={onLabelChange}
                            className="bg-transparent text-zinc-200 text-sm focus:outline-none w-32 px-1 py-0.5"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && toggleEdit()}
                        />
                        <button onClick={toggleEdit} className="text-emerald-500 hover:text-emerald-400 ml-1 p-1">
                            <Check size={12} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={toggleEdit}>
                        <span className="text-zinc-400 text-sm font-medium group-hover:text-zinc-200 transition-colors">
                            {label}
                        </span>
                        <Edit2 size={10} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(GroupNode);
