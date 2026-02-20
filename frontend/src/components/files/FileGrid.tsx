import { FileCard } from "./FileCard";
import type { FileItem } from "@/types/file";

interface FileGridProps {
    files: FileItem[];
    onView: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
}

export function FileGrid({ files, onView, onDelete }: FileGridProps) {
    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
                <FileCard
                    key={`${file.id}-${file.filename}`}
                    file={file}
                    onView={onView}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
