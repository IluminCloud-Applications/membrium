/**
 * YoutubeTranscriptSection — Exibe opções de transcrição para aulas com vídeo YouTube.
 *
 * Funcionalidades:
 * - Buscar transcrição via API oficial Google (captions.list + captions.download)
 * - Preview do texto extraído
 * - Download do SRT como legenda
 * - Indicação se a legenda é automática ou manual
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { transcriptsService } from "@/services/transcripts";

interface YoutubeTranscriptSectionProps {
    /** ID da lesson já salva no banco. Undefined quando é nova aula (ainda não salva). */
    lessonId?: number;
}

interface TranscriptResult {
    text: string;
    srt: string;
    wordCount: number;
    language: string;
    captionId: string;
    isAutoSynced: boolean;
}

export function YoutubeTranscriptSection({ lessonId }: YoutubeTranscriptSectionProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<TranscriptResult | null>(null);
    const [showText, setShowText] = useState(false);

    async function handleFetchTranscript() {
        if (!lessonId) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await transcriptsService.fetchYoutubeTranscript(lessonId);

            if (!res.success) {
                setError(res.message || "Não foi possível obter a transcrição.");
                return;
            }

            setResult({
                text: res.text,
                srt: res.srt,
                wordCount: res.wordCount,
                language: res.language,
                captionId: res.captionId,
                isAutoSynced: res.isAutoSynced,
            });
            setShowText(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao buscar transcrição.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    function handleDownloadSrt() {
        if (!result?.srt) return;

        const blob = new Blob([result.srt], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `legenda-aula-${lessonId}.srt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /* Aula ainda não criada — avisa que precisa salvar primeiro */
    if (!lessonId) {
        return (
            <div className="rounded-lg border border-dashed p-3 text-center space-y-1">
                <i className="ri-file-text-line text-muted-foreground text-lg" />
                <p className="text-xs text-muted-foreground">
                    Salve a aula primeiro para buscar a transcrição automaticamente.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Fetch button */}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFetchTranscript}
                disabled={loading}
                className="w-full gap-2 border-dashed text-xs"
            >
                {loading ? (
                    <>
                        <i className="ri-loader-4-line animate-spin" />
                        Buscando legenda no YouTube...
                    </>
                ) : (
                    <>
                        <i className="ri-youtube-line text-red-500" />
                        Buscar Transcrição via Google API
                    </>
                )}
            </Button>

            {/* Error feedback */}
            {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 animate-fade-in">
                    <i className="ri-error-warning-line text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-destructive">{error}</p>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="space-y-3 animate-fade-in">
                    {/* Meta info */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant="secondary"
                                className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400"
                            >
                                <i className="ri-check-line mr-1" />
                                Transcrição obtida
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                                {result.language}
                            </Badge>
                            {result.isAutoSynced && (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                    automática
                                </Badge>
                            )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                            {result.wordCount.toLocaleString("pt-BR")} palavras
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2 text-xs"
                            onClick={() => setShowText((v) => !v)}
                        >
                            <i className={showText ? "ri-eye-off-line" : "ri-eye-line"} />
                            {showText ? "Ocultar texto" : "Ver texto"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2 text-xs"
                            onClick={handleDownloadSrt}
                            disabled={!result.srt}
                        >
                            <i className="ri-download-2-line" />
                            Baixar .SRT
                        </Button>
                    </div>

                    {/* Text preview */}
                    {showText && (
                        <Textarea
                            readOnly
                            value={result.text}
                            rows={6}
                            className="text-xs font-mono resize-none bg-muted/30 animate-fade-in"
                        />
                    )}

                    <p className="text-[10px] text-muted-foreground">
                        A transcrição foi obtida via API oficial Google YouTube. Para salvar, acesse a página de{" "}
                        <strong>Transcrições</strong>.
                    </p>
                </div>
            )}
        </div>
    );
}
