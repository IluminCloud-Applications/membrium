import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { FileItem } from "@/types/file";

interface FilePreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: FileItem | null;
}

function isImageFile(filename: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Full-size preview modal for files.
 * Shows image preview for images, file info for documents.
 */
export function FilePreviewModal({
    open,
    onOpenChange,
    file,
}: FilePreviewModalProps) {
    if (!file) return null;

    const isImage = isImageFile(file.filename);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm">
                        <i className="ri-file-3-line text-primary" />
                        <span className="truncate">{file.filename}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Preview */}
                    {isImage ? (
                        <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center max-h-[400px]">
                            <img
                                src={`/static/uploads/${file.filename}`}
                                alt={file.filename}
                                className="max-w-full max-h-[400px] object-contain"
                            />
                        </div>
                    ) : (
                        <div className="rounded-lg bg-muted p-12 flex flex-col items-center justify-center gap-2">
                            <i className="ri-file-3-line text-5xl text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Pré-visualização não disponível
                            </p>
                        </div>
                    )}

                    {/* File info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <InfoRow
                            icon="ri-file-3-line"
                            label="Nome"
                            value={file.filename}
                        />
                        <InfoRow
                            icon="ri-database-2-line"
                            label="Tamanho"
                            value={formatBytes(file.size)}
                        />
                        <InfoRow
                            icon="ri-calendar-line"
                            label="Data de Upload"
                            value={file.upload_date}
                        />
                        <InfoRow
                            icon={file.is_used ? "ri-check-line" : "ri-close-line"}
                            label="Status"
                            value={file.is_used ? "Em uso" : "Não utilizado"}
                        />
                    </div>

                    {file.is_used && file.used_in.length > 0 && (
                        <div className="text-sm">
                            <p className="font-medium mb-1 flex items-center gap-1">
                                <i className="ri-link text-muted-foreground" />
                                Utilizado em:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                                {file.used_in.map((usage, idx) => (
                                    <li key={idx}>{usage}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2">
            <i className={`${icon} text-muted-foreground mt-0.5`} />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium truncate" title={value}>
                    {value}
                </p>
            </div>
        </div>
    );
}
