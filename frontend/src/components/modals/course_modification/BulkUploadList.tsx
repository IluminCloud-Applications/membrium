import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { BulkVideoItem } from "./BulkUploadModal";

interface BulkUploadListProps {
    videos: BulkVideoItem[];
    onTitleChange: (id: string, title: string) => void;
    onRemove: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    disabled: boolean;
}

export function BulkUploadList({
    videos,
    onTitleChange,
    onRemove,
    onReorder,
    disabled,
}: BulkUploadListProps) {
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragIndexRef = useRef<number | null>(null);

    function handleDragStart(index: number) {
        dragIndexRef.current = index;
    }

    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        if (dragIndexRef.current !== index) {
            setDragOverIndex(index);
        }
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

    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg">
                <i className="ri-video-upload-line text-3xl mb-2" />
                <p className="text-sm font-medium">Nenhum vídeo selecionado</p>
                <p className="text-xs mt-1">
                    Clique no botão abaixo para selecionar os vídeos do módulo.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {videos.map((video, index) => (
                <div
                    key={video.id}
                    draggable={!disabled}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={cleanup}
                    className={`group flex items-center gap-3 rounded-lg border bg-card p-3 transition-all
                        ${dragOverIndex === index ? "ring-2 ring-primary/40" : ""}
                        ${disabled ? "opacity-60" : ""}
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

                    {/* Video file icon */}
                    <div className="flex-shrink-0 h-9 w-12 rounded bg-muted flex items-center justify-center">
                        <i className="ri-film-line text-muted-foreground" />
                    </div>

                    {/* Title input */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <Input
                            value={video.title}
                            onChange={(e) => onTitleChange(video.id, e.target.value)}
                            placeholder="Título da aula"
                            disabled={disabled}
                            className="h-8 text-sm"
                        />
                        <p className="text-[10px] text-muted-foreground truncate">
                            <i className="ri-file-video-line mr-1" />
                            {video.file.name} • {formatFileSize(video.file.size)}
                        </p>
                    </div>

                    {/* Remove button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(video.id)}
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

function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
