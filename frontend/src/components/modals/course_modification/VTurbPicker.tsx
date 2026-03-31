import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { integrationsService, type VTurbVideo } from "@/services/integrations";

interface VTurbPickerProps {
    vturbVideoId: string;
    onChange: (videoId: string) => void;
}

function formatDuration(seconds: number): string {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export function VTurbPicker({ vturbVideoId, onChange }: VTurbPickerProps) {
    const [search, setSearch] = useState("");
    const [videos, setVideos] = useState<VTurbVideo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    async function fetchVideos(query?: string) {
        setLoading(true);
        setError(null);
        try {
            const res = await integrationsService.listVTurbVideos(query);
            if (res.success) {
                setVideos(res.videos);
                setSearched(true);
            } else {
                setError(res.message || "Erro ao buscar vídeos.");
            }
        } catch {
            setError("Não foi possível buscar os vídeos. Verifique sua API Key em Integrações → VTurb.");
        } finally {
            setLoading(false);
        }
    }

    // Load all videos on mount
    useEffect(() => {
        fetchVideos();
    }, []);

    // Debounce search
    useEffect(() => {
        if (!searched) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchVideos(search.trim() || undefined);
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const filteredVideos = videos.filter((v) =>
        !search.trim() ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-3">
            {/* Manual ID input */}
            <div className="space-y-1.5">
                <Label htmlFor="vturb-video-id">ID do Vídeo VTurb</Label>
                <div className="relative">
                    <i className="ri-play-circle-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <Input
                        id="vturb-video-id"
                        placeholder="Cole o ID do vídeo ou selecione abaixo"
                        value={vturbVideoId}
                        onChange={(e) => onChange(e.target.value)}
                        className="pl-9 font-mono text-xs"
                    />
                </div>
            </div>

            {/* Search */}
            <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Buscar vídeo por nome ou ID</Label>
                <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <Input
                        placeholder="Nome ou ID do vídeo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 text-sm h-8"
                    />
                    {loading && (
                        <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <i className="ri-error-warning-line" />
                    {error}
                </p>
            )}

            {/* Video list */}
            {!error && (
                <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/20 divide-y">
                    {filteredVideos.length === 0 && !loading ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            {searched ? "Nenhum vídeo encontrado." : "Carregando..."}
                        </p>
                    ) : (
                        filteredVideos.map((video) => (
                            <VideoRow
                                key={video.id}
                                video={video}
                                selected={vturbVideoId === video.id}
                                onSelect={() => onChange(video.id)}
                            />
                        ))
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
                disabled={loading}
            >
                <i className="ri-refresh-line" />
                Atualizar lista
            </Button>
        </div>
    );
}

/* ---- Video row ---- */

interface VideoRowProps {
    video: VTurbVideo;
    selected: boolean;
    onSelect: () => void;
}

function VideoRow({ video, selected, onSelect }: VideoRowProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                selected ? "bg-primary/10 border-l-2 border-primary" : ""
            }`}
        >
            <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                selected ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
                <i className={selected ? "ri-check-line text-xs" : "ri-play-fill text-xs text-muted-foreground"} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{video.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{video.id}</p>
            </div>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatDuration(video.duration)}
            </span>
        </button>
    );
}
