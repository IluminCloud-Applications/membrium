import { useState, useEffect, useRef, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VTurbBulkList } from "./VTurbBulkList";
import type { VTurbBulkItem } from "./VTurbBulkList";
import { BulkUploadProgress } from "./BulkUploadProgress";
import { integrationsService, type VTurbVideo } from "@/services/integrations";
import { courseModificationService } from "@/services/courseModification";
import type { YouTubeUploadResult } from "@/services/youtubeUpload";

type BulkResult = YouTubeUploadResult;

interface VTurbBulkModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleId: number;
    moduleName: string;
    onComplete: () => void;
}

function formatDuration(seconds: number): string {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export function VTurbBulkModal({
    open,
    onOpenChange,
    moduleId,
    moduleName,
    onComplete,
}: VTurbBulkModalProps) {
    // Selected videos to save
    const [items, setItems] = useState<VTurbBulkItem[]>([]);

    // VTurb video search
    const [search, setSearch] = useState("");
    const [videos, setVideos] = useState<VTurbVideo[]>([]);
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Saving state
    const [saving, setSaving] = useState(false);
    const [results, setResults] = useState<BulkResult[] | null>(null);

    // Load videos on open
    useEffect(() => {
        if (open) {
            fetchVideos();
        }
    }, [open]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchVideos(search.trim() || undefined);
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    async function fetchVideos(query?: string) {
        setLoadingVideos(true);
        setVideoError(null);
        try {
            const res = await integrationsService.listVTurbVideos(query);
            if (res.success) {
                setVideos(res.videos);
            } else {
                setVideoError(res.message || "Erro ao buscar vídeos.");
            }
        } catch {
            setVideoError("Não foi possível buscar os vídeos. Verifique a API Key VTurb em Integrações.");
        } finally {
            setLoadingVideos(false);
        }
    }

    const selectedIds = new Set(items.map((i) => i.vturbId));

    function handleToggleVideo(video: VTurbVideo) {
        if (selectedIds.has(video.id)) {
            // Remove it
            setItems((prev) => prev.filter((i) => i.vturbId !== video.id));
        } else {
            // Add it
            setItems((prev) => [
                ...prev,
                {
                    key: `${video.id}-${Date.now()}`,
                    vturbId: video.id,
                    title: video.name,
                    duration: video.duration,
                },
            ]);
        }
    }

    function handleTitleChange(key: string, title: string) {
        setItems((prev) => prev.map((i) => (i.key === key ? { ...i, title } : i)));
    }

    function handleRemove(key: string) {
        setItems((prev) => prev.filter((i) => i.key !== key));
    }

    const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
        setItems((prev) => {
            const updated = [...prev];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return updated;
        });
    }, []);

    async function handleSave() {
        if (items.length === 0) return;
        setSaving(true);
        setResults(null);

        const localResults: BulkResult[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            try {
                const formData = new FormData();
                formData.append("title", item.title.trim() || item.vturbId);
                formData.append("description", "");
                formData.append("video_platform", "vturb");
                formData.append("video_url", item.vturbId);
                formData.append("has_cta", "false");

                const created = await courseModificationService.createLesson(moduleId, formData);

                localResults.push({
                    index: i,
                    title: item.title,
                    success: true,
                    video_url: item.vturbId,
                    lesson_id: created.lesson?.id,
                });
            } catch (err) {
                localResults.push({
                    index: i,
                    title: item.title,
                    success: false,
                    error: err instanceof Error ? err.message : "Erro ao criar aula",
                });
            }
        }

        setResults(localResults);
        setSaving(false);
        if (localResults.some((r) => r.success)) onComplete();
    }

    function handleClose() {
        if (saving) return;
        setItems([]);
        setSearch("");
        setResults(null);
        setVideoError(null);
        onOpenChange(false);
    }

    const hasItems = items.length > 0;
    const allTitlesValid = items.every((i) => i.title.trim().length > 0);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[92vh] h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-5 pr-12 border-b flex-shrink-0 bg-muted/10">
                    <DialogTitle className="flex items-center gap-2 min-w-0">
                        <i className="ri-play-circle-fill text-orange-500 flex-shrink-0" />
                        <span className="truncate min-w-0">Upload em Massa (VTurb) — {moduleName}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Busque e selecione os vídeos do VTurb. Organize a ordem e edite os títulos antes de salvar.
                    </DialogDescription>
                </DialogHeader>

                {!results ? (
                    <>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-6">
                        {/* Selected items list */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                                Vídeos Selecionados ({items.length})
                            </Label>
                            <VTurbBulkList
                                items={items}
                                onTitleChange={handleTitleChange}
                                onRemove={handleRemove}
                                onReorder={handleReorder}
                                disabled={saving}
                            />
                        </div>

                        {/* Divider */}
                        <div className="border-t -mx-6" />

                        {/* Video picker */}
                        <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                                Buscar Vídeos no VTurb
                            </Label>

                            {/* Search input */}
                            <div className="relative">
                                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                                <Input
                                    placeholder="Buscar por nome ou ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 text-sm h-9"
                                />
                                {loadingVideos && (
                                    <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                                )}
                            </div>

                            {/* Error */}
                            {videoError && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <i className="ri-error-warning-line" />
                                    {videoError}
                                </p>
                            )}

                            {/* Video list */}
                            {!videoError && (
                                <div className="max-h-56 overflow-y-auto overflow-x-hidden rounded-md border bg-muted/20 divide-y">
                                    {videos.length === 0 && !loadingVideos ? (
                                        <p className="text-xs text-muted-foreground text-center py-5">
                                            Nenhum vídeo encontrado.
                                        </p>
                                    ) : (
                                        videos.map((video) => {
                                            const isSelected = selectedIds.has(video.id);
                                            return (
                                                <div
                                                    key={video.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => handleToggleVideo(video)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleToggleVideo(video)}
                                                    className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50 ${
                                                        isSelected ? "bg-primary/10 border-l-2 border-primary" : ""
                                                    }`}
                                                    style={{ boxSizing: "border-box" }}
                                                >
                                                    {/* Check / Play icon */}
                                                    <div
                                                        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                                                            isSelected
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted"
                                                        }`}
                                                    >
                                                        <i
                                                            className={
                                                                isSelected
                                                                    ? "ri-check-line text-xs"
                                                                    : "ri-play-fill text-xs text-muted-foreground"
                                                            }
                                                        />
                                                    </div>

                                                    {/* Info — must have min-w-0 for truncate to work in flex */}
                                                    <div className="flex-1 min-w-0 overflow-hidden">
                                                        <p className="text-xs font-medium truncate leading-tight w-full block">{video.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono truncate w-full block">
                                                            {video.id}
                                                        </p>
                                                    </div>

                                                    {/* Duration */}
                                                    <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
                                                        {formatDuration(video.duration)}
                                                    </span>

                                                    {/* Add / Remove badge */}
                                                    <span
                                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                                            isSelected
                                                                ? "bg-destructive/10 text-destructive"
                                                                : "bg-primary/10 text-primary"
                                                        }`}
                                                    >
                                                        {isSelected ? "Remover" : "+ Add"}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* Refresh */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full gap-1.5 text-xs text-muted-foreground h-7"
                                onClick={() => fetchVideos(search.trim() || undefined)}
                                disabled={loadingVideos}
                            >
                                <i className="ri-refresh-line" />
                                Atualizar lista
                            </Button>
                        </div>

                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-card flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                                {items.length} {items.length === 1 ? "vídeo" : "vídeos"} selecionados
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClose} disabled={saving}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!hasItems || !allTitlesValid || saving}
                                    className="btn-brand gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <i className="ri-loader-4-line animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-save-line" />
                                            Salvar Tudo ({items.length})
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-6 overflow-y-auto">
                        <BulkUploadProgress results={results} onClose={handleClose} />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
