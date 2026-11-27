import { useRef, useState } from "react";

interface UseFileDropOptions {
    disabled?: boolean;
    onDropFiles: (files: File[]) => void;
}

/**
 * Reusable drag-and-drop hook with drag-depth counter so hovering over child elements
 * inside the dropzone never flickers the active drag state.
 */
export function useFileDrop({ disabled = false, onDropFiles }: UseFileDropOptions) {
    const [isDragging, setIsDragging] = useState(false);
    const dragDepthRef = useRef(0);

    const handleDragEnter = (e: React.DragEvent) => {
        if (disabled) return;
        if (!e.dataTransfer?.types?.includes("Files")) return;
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current += 1;
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (disabled) return;
        if (!e.dataTransfer?.types?.includes("Files")) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
        if (dragDepthRef.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        dragDepthRef.current = 0;
        setIsDragging(false);
        const files = Array.from(e.dataTransfer?.files ?? []);
        if (files.length > 0) {
            onDropFiles(files);
        }
    };

    return {
        isDragging,
        dropProps: {
            onDragEnter: handleDragEnter,
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
        },
    };
}
