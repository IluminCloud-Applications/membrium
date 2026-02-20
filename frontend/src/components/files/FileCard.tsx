import { Badge } from "@/components/ui/badge";
import type { FileItem } from "@/types/file";

interface FileCardProps {
    file: FileItem;
    onView: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function isImageFile(filename: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
}

function getFileIcon(filename: string): string {
    if (isImageFile(filename)) return "ri-image-line";
    if (/\.pdf$/i.test(filename)) return "ri-file-pdf-2-line";
    if (/\.(doc|docx)$/i.test(filename)) return "ri-file-word-line";
    if (/\.(xls|xlsx|csv)$/i.test(filename)) return "ri-file-excel-line";
    return "ri-file-3-line";
}

export function FileCard({ file, onView, onDelete }: FileCardProps) {
    const isImage = isImageFile(file.filename);
    const fileIcon = getFileIcon(file.filename);

    return (
        <div className="group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
            {/* Thumbnail / Icon */}
            <div className="aspect-video relative overflow-hidden bg-muted flex items-center justify-center">
                {isImage ? (
                    <img
                        src={`/static/uploads/${file.filename}`}
                        alt={file.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <i className={`${fileIcon} text-4xl text-muted-foreground`} />
                )}

                {/* Status badge */}
                <Badge
                    className={`absolute top-2 right-2 text-xs ${file.is_used
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                    variant="secondary"
                >
                    {file.is_used ? "Em uso" : "Não utilizado"}
                </Badge>
            </div>

            {/* Info */}
            <div className="p-3 space-y-1.5">
                <h3
                    className="font-medium text-sm truncate"
                    title={file.filename}
                >
                    {file.filename}
                </h3>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <i className="ri-database-2-line" />
                        {formatBytes(file.size)}
                    </span>
                    <span className="flex items-center gap-1">
                        <i className="ri-calendar-line" />
                        {file.upload_date}
                    </span>
                </div>

                {file.is_used && file.used_in.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                        <i className="ri-link mr-1" />
                        {file.used_in.join(", ")}
                    </p>
                )}
            </div>

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100">
                <div className="flex gap-1">
                    <FileActionButton
                        icon="ri-eye-line"
                        label="Ver"
                        onClick={() => onView(file)}
                    />
                    {!file.is_used && (
                        <FileActionButton
                            icon="ri-delete-bin-line"
                            label="Excluir"
                            onClick={() => onDelete(file)}
                            variant="danger"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ---- Internal action button ---- */
interface FileActionButtonProps {
    icon: string;
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
}

function FileActionButton({
    icon,
    label,
    onClick,
    variant = "default",
}: FileActionButtonProps) {
    const cls =
        variant === "danger"
            ? "bg-card shadow-sm hover:bg-destructive/10 text-destructive"
            : "bg-card shadow-sm hover:bg-accent";

    return (
        <button
            onClick={onClick}
            className={`group/action h-8 rounded-lg flex items-center gap-0 hover:gap-1.5 px-2 hover:px-3 transition-all duration-200 text-xs font-medium whitespace-nowrap ${cls}`}
        >
            <i className={`${icon} text-sm shrink-0`} />
            <span className="max-w-0 overflow-hidden group-hover/action:max-w-[80px] opacity-0 group-hover/action:opacity-100 transition-all duration-200">
                {label}
            </span>
        </button>
    );
}
