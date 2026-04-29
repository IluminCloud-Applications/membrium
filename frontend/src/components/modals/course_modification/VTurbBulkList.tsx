import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface VTurbBulkItem {
    /** Unique key within the bulk list (not the VTurb video ID) */
    key: string;
    vturbId: string;
    title: string;
    duration?: number;
}

interface VTurbBulkListProps {
    items: VTurbBulkItem[];
    onTitleChange: (key: string, title: string) => void;
    onRemove: (key: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    disabled?: boolean;
}

function formatDuration(seconds?: number): string {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export function VTurbBulkList({
    items,
    onTitleChange,
    onRemove,
    onReorder,
    disabled,
}: VTurbBulkListProps) {
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragIndexRef = useRef<number | null>(null);

    function handleDragStart(index: number) {
        dragIndexRef.current = index;
    }

    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        if (dragIndexRef.current !== index) setDragOverIndex(index);
    }

    function handleDrop(targetIndex: number) {
        const sourceIndex = dragIndexRef.current;
        if (sourceIndex !== null && sourceIndex !== targetIndex) {
            onReorder(sourceIndex, targetIndex);
        }
        cleanup();
    }

    function cleanup() {
        dragIndexRef.current = null;
        setDragOverIndex(null);
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed rounded-lg">
                <i className="ri-video-add-line text-3xl mb-2" />
                <p className="text-sm font-medium">Nenhum vídeo adicionado</p>
                <p className="text-xs mt-1 text-center max-w-xs">
                    Busque e clique nos vídeos abaixo para adicioná-los à lista.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {items.map((item, index) => (
                <div
                    key={item.key}
                    draggable={!disabled}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={cleanup}
                    className={`group flex items-center gap-3 rounded-lg border bg-card p-3 transition-all
                        ${dragOverIndex === index ? "ring-2 ring-primary/40" : ""}
                        ${disabled ? "opacity-60" : ""}
                        min-w-0 overflow-hidden
                    `}
                >
                    {/* Drag handle */}
                    <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
                        <i className="ri-draggable text-lg" />
                    </div>

                    {/* Order number */}
                    <div className="flex-shrink-0 h-7 w-7 rounded-md bg-primary/8 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>

                    {/* VTurb icon */}
                    <div className="flex-shrink-0 h-9 w-12 rounded bg-orange-500/10 flex items-center justify-center">
                        <i className="ri-play-circle-line text-orange-500 text-lg" />
                    </div>

                    {/* Title + ID */}
                    <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                        <Input
                            value={item.title}
                            onChange={(e) => onTitleChange(item.key, e.target.value)}
                            placeholder="Título da aula"
                            disabled={disabled}
                            className="h-8 text-sm w-full"
                        />
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono min-w-0 w-full overflow-hidden">
                            <i className="ri-video-line flex-shrink-0" />
                            <span className="truncate block min-w-0">
                                ID: {item.vturbId}
                                {item.duration ? ` • ${formatDuration(item.duration)}` : ""}
                            </span>
                        </div>
                    </div>

                    {/* Remove */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(item.key)}
                        disabled={disabled}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <i className="ri-close-line text-lg" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
