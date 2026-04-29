import { useState, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BulkUploadList } from "./BulkUploadList";
import { BulkUploadProgress } from "./BulkUploadProgress";
import { youtubeUploadService, type YouTubeUploadResult } from "@/services/youtubeUpload";

type BulkResult = YouTubeUploadResult;
type Platform = "youtube";

interface BulkUploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleId: number;
    moduleName: string;
    platform?: Platform;
    onComplete: () => void;
}

export interface BulkVideoItem {
    id: string;
    file: File;
    title: string;
    preview: string; // Thumbnail placeholder or video name
}

const PLATFORM_CONFIG: Record<Platform, { icon: string; iconClass: string; label: string; description: string }> = {
    youtube: {
        icon: "ri-youtube-fill",
        iconClass: "text-red-500",
        label: "YouTube",
        description: "Os vídeos serão enviados para o YouTube e as aulas criadas automaticamente.",
    },
};

export function BulkUploadModal({
    open,
    onOpenChange,
    moduleId,
    moduleName,
    platform = "youtube",
    onComplete,
}: BulkUploadModalProps) {
    const [videos, setVideos] = useState<BulkVideoItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<BulkResult[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const config = PLATFORM_CONFIG[platform];

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        const newVideos: BulkVideoItem[] = files.map((file) => ({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            file,
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            preview: file.name,
        }));
        setVideos((prev) => [...prev, ...newVideos]);
        // Reset input for re-selection
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleTitleChange(id: string, title: string) {
        setVideos((prev) =>
            prev.map((v) => (v.id === id ? { ...v, title } : v))
        );
    }

    function handleRemove(id: string) {
        setVideos((prev) => prev.filter((v) => v.id !== id));
    }

    const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
        setVideos((prev) => {
            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
    }, []);

    async function handleUpload() {
        if (videos.length === 0) return;
        setUploading(true);
        setResults(null);

        try {
            const files = videos.map((v) => v.file);
            const res = await youtubeUploadService.uploadBulk(files, titles, moduleId);
            setResults(res.results);
            if (res.success) onComplete();
        } catch (err) {
            console.error("Erro no upload em massa:", err);
            setResults([{
                index: 0,
                title: "",
                success: false,
                error: "Erro de conexão. Tente novamente.",
            }]);
        } finally {
            setUploading(false);
        }
    }

    function handleClose() {
        if (uploading) return;
        setVideos([]);
        setResults(null);
        onOpenChange(false);
    }

    const hasVideos = videos.length > 0;
    const allTitlesValid = videos.every((v) => v.title.trim().length > 0);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className={`${config.icon} ${config.iconClass}`} />
                        Upload em Massa ({config.label}) — {moduleName}
                    </DialogTitle>
                    <DialogDescription>
                        Selecione os vídeos, organize a ordem e defina os títulos das aulas.{" "}
                        {config.description}
                    </DialogDescription>
                </DialogHeader>

                {/* File input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Video list or empty state */}
                {!results ? (
                    <>
                        <BulkUploadList
                            videos={videos}
                            onTitleChange={handleTitleChange}
                            onRemove={handleRemove}
                            onReorder={handleReorder}
                            disabled={uploading}
                        />

                        {/* Add more / select videos */}
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full gap-2 border-dashed"
                        >
                            <i className="ri-video-add-line" />
                            {hasVideos ? "Adicionar Mais Vídeos" : "Selecionar Vídeos"}
                        </Button>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                                {videos.length} {videos.length === 1 ? "vídeo" : "vídeos"} selecionados
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClose} disabled={uploading}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={!hasVideos || !allTitlesValid || uploading}
                                    className="btn-brand gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <i className="ri-loader-4-line animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-upload-cloud-2-line" />
                                            Enviar para {config.label}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <BulkUploadProgress results={results} onClose={handleClose} />
                )}
            </DialogContent>
        </Dialog>
    );
}
