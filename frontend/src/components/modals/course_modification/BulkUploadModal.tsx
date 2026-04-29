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
import { cloudflareUploadService } from "@/services/cloudflareUpload";
import { courseModificationService } from "@/services/courseModification";

type BulkResult = YouTubeUploadResult;
type Platform = "youtube" | "cloudflare";

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
    cloudflare: {
        icon: "ri-cloud-line",
        iconClass: "text-orange-600",
        label: "Cloudflare R2",
        description: "Os vídeos sobem direto para o seu bucket R2 (sem passar pelo servidor) e cada aula é criada automaticamente.",
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
    const [progressNote, setProgressNote] = useState<string | null>(null);
    const [results, setResults] = useState<BulkResult[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const config = PLATFORM_CONFIG[platform];

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || []);
        const newVideos: BulkVideoItem[] = files.map((file) => ({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            file,
            title: file.name.replace(/\.[^/.]+$/, ""),
            preview: file.name,
        }));
        setVideos((prev) => [...prev, ...newVideos]);
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
        setProgressNote(null);

        try {
            if (platform === "youtube") {
                const files = videos.map((v) => v.file);
                const titles = videos.map((v) => v.title);
                const res = await youtubeUploadService.uploadBulk(files, titles, moduleId);
                setResults(res.results);
                if (res.success) onComplete();
            } else {
                // Cloudflare R2: per-file presign → PUT → create-lesson, sequentially.
                // Sequential keeps the public_url ordering stable and avoids hammering R2.
                const localResults: BulkResult[] = [];
                for (let i = 0; i < videos.length; i++) {
                    const v = videos[i];
                    setProgressNote(`Enviando ${i + 1}/${videos.length}: ${v.title}`);
                    try {
                        const upload = await cloudflareUploadService.upload(v.file, {
                            onProgress: (frac) => {
                                setProgressNote(
                                    `Enviando ${i + 1}/${videos.length}: ${v.title} — ${Math.round(frac * 100)}%`
                                );
                            },
                        });

                        const formData = new FormData();
                        formData.append("title", v.title);
                        formData.append("description", "");
                        formData.append("video_platform", "cloudflare");
                        formData.append("video_url", upload.publicUrl);
                        formData.append("has_cta", "false");

                        const created = await courseModificationService.createLesson(moduleId, formData);

                        localResults.push({
                            index: i,
                            title: v.title,
                            success: true,
                            video_url: upload.publicUrl,
                            lesson_id: created.lesson?.id,
                        });
                    } catch (err) {
                        localResults.push({
                            index: i,
                            title: v.title,
                            success: false,
                            error: err instanceof Error ? err.message : "Erro desconhecido",
                        });
                    }
                }
                setResults(localResults);
                setProgressNote(null);
                if (localResults.some((r) => r.success)) onComplete();
            }
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
            setProgressNote(null);
        }
    }

    function handleClose() {
        if (uploading) return;
        setVideos([]);
        setResults(null);
        setProgressNote(null);
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

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {!results ? (
                    <>
                        <BulkUploadList
                            videos={videos}
                            onTitleChange={handleTitleChange}
                            onRemove={handleRemove}
                            onReorder={handleReorder}
                            disabled={uploading}
                        />

                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full gap-2 border-dashed"
                        >
                            <i className="ri-video-add-line" />
                            {hasVideos ? "Adicionar Mais Vídeos" : "Selecionar Vídeos"}
                        </Button>

                        {progressNote && (
                            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2 animate-fade-in">
                                <i className="ri-loader-4-line animate-spin text-primary" />
                                {progressNote}
                            </div>
                        )}

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
