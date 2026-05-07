/**
 * CompressAllModal
 *
 * Mostra o progresso enquanto comprime imagem por imagem.
 * Cada clique em "Iniciar" chama o endpoint /compress-next em loop até
 * não restar mais imagens pendentes.
 */
import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fileService } from "@/services/fileService";

interface CompressAllModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingCount: number;
    onDone: () => void;
}

interface LogEntry {
    original: string;
    new_filename: string;
}

export function CompressAllModal({
    open,
    onOpenChange,
    pendingCount,
    onDone,
}: CompressAllModalProps) {
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [processed, setProcessed] = useState(0);
    const [total, setTotal] = useState(pendingCount);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Sync total when modal opens
    useEffect(() => {
        if (open) {
            setTotal(pendingCount);
            setProcessed(0);
            setLog([]);
            setDone(false);
            setError(null);
            abortRef.current = false;
        }
    }, [open, pendingCount]);

    // Auto-scroll log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [log]);

    async function start() {
        setRunning(true);
        setError(null);
        abortRef.current = false;

        while (!abortRef.current) {
            try {
                const result = await fileService.compressNext();

                if (!result.compressed) {
                    if ("error" in result && result.error) {
                        setError(result.error);
                    }
                    break;
                }

                setProcessed((p) => p + 1);
                setLog((prev) => [
                    ...prev,
                    { original: result.original, new_filename: result.new_filename },
                ]);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Erro desconhecido";
                setError(msg);
                break;
            }
        }

        setRunning(false);
        setDone(true);
        onDone();
    }

    function handleStop() {
        abortRef.current = true;
    }

    const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
    const wasStopped = done && !error && processed < total;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!running) onOpenChange(v); }}>
            <DialogContent className="sm:max-w-lg overflow-hidden">

                {/* ── DONE state: full-panel success screen ── */}
                {done && !error && !wasStopped && (
                    <>
                        <div className="flex flex-col items-center justify-center gap-4 py-8 px-4 text-center">
                            {/* Animated check circle */}
                            <div className="relative flex items-center justify-center w-20 h-20">
                                <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30 animate-ping opacity-30" />
                                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border-2 border-emerald-300 dark:border-emerald-700">
                                    <i className="ri-check-line text-4xl text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-lg font-semibold">Compressão concluída!</h3>
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">{processed}</strong> imagem{processed !== 1 ? "ns foram comprimidas" : " foi comprimida"} e convertida{processed !== 1 ? "s" : ""} para{" "}
                                    <span className="font-medium text-primary">WebP</span>.
                                </p>
                            </div>

                            {/* Stats strip */}
                            <div className="flex items-center gap-6 rounded-xl bg-muted/50 border px-6 py-3 text-sm">
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{processed}</span>
                                    <span className="text-xs text-muted-foreground">Comprimidas</span>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xl font-bold">WebP</span>
                                    <span className="text-xs text-muted-foreground">Formato</span>
                                </div>
                                <div className="h-8 w-px bg-border" />
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xl font-bold text-primary">75</span>
                                    <span className="text-xs text-muted-foreground">Qualidade</span>
                                </div>
                            </div>

                            {/* Log (collapsed by default, scrollable) */}
                            {log.length > 0 && (
                                <details className="w-full text-left">
                                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
                                        Ver arquivos processados ({log.length})
                                    </summary>
                                    <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border bg-muted/30 p-3 space-y-1 text-xs font-mono">
                                        {log.map((entry, i) => (
                                            <div key={i} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                <i className="ri-check-line shrink-0" />
                                                <span className="truncate opacity-70">{entry.original}</span>
                                                <i className="ri-arrow-right-line shrink-0 text-muted-foreground" />
                                                <span className="truncate font-semibold">{entry.new_filename}</span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </div>

                        <DialogFooter>
                            <Button className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
                                <i className="ri-check-double-line mr-1.5" />
                                Fechar
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ── STOPPED state ── */}
                {done && !error && wasStopped && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <i className="ri-pause-circle-line text-amber-500" />
                                Processo interrompido
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <p className="text-sm text-muted-foreground">
                                <strong>{processed}</strong> de <strong>{total}</strong> imagens foram comprimidas.
                                Você pode retomar clicando em "Comprimir tudo" novamente.
                            </p>
                            {log.length > 0 && (
                                <div className="max-h-36 overflow-y-auto rounded-lg border bg-muted/30 p-3 space-y-1 text-xs font-mono">
                                    {log.map((entry, i) => (
                                        <div key={i} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                            <i className="ri-check-line shrink-0" />
                                            <span className="truncate">{entry.original}</span>
                                            <i className="ri-arrow-right-line shrink-0 text-muted-foreground" />
                                            <span className="truncate">{entry.new_filename}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Fechar
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ── ERROR state ── */}
                {done && error && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <i className="ri-error-warning-line" />
                                Erro durante a compressão
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <p className="text-sm text-muted-foreground">
                                {processed > 0 && (
                                    <><strong>{processed}</strong> imagens foram comprimidas antes do erro.<br /></>
                                )}
                            </p>
                            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Fechar
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ── IDLE / RUNNING state ── */}
                {!done && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <i className={`ri-image-edit-line ${running ? "text-primary animate-pulse" : "text-primary"}`} />
                                Comprimir imagens
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            {/* Summary (idle only) */}
                            {!running && (
                                <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">{total}</strong> imagem(ns) ainda não foram comprimidas.
                                    O processo converte para <strong className="text-foreground">WebP</strong> com qualidade 75 e
                                    largura máxima de 1280px. Os links no banco são atualizados automaticamente.
                                </p>
                            )}

                            {/* Progress bar (running only) */}
                            {running && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-1.5">
                                            <i className="ri-loader-4-line animate-spin text-primary" />
                                            {processed} / {total} comprimidas
                                        </span>
                                        <span className="font-medium">{progress}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Live log */}
                            {log.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-lg border bg-muted/30 p-3 space-y-1 text-xs font-mono">
                                    {log.map((entry, i) => (
                                        <div key={i} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                            <i className="ri-check-line shrink-0" />
                                            <span className="truncate">{entry.original}</span>
                                            <i className="ri-arrow-right-line shrink-0 text-muted-foreground" />
                                            <span className="truncate">{entry.new_filename}</span>
                                        </div>
                                    ))}
                                    <div ref={logEndRef} />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            {!running && (
                                <>
                                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={start} disabled={total === 0}>
                                        <i className="ri-flashlight-line mr-1.5" />
                                        Comprimir tudo
                                    </Button>
                                </>
                            )}
                            {running && (
                                <Button variant="outline" onClick={handleStop}>
                                    <i className="ri-stop-circle-line mr-1.5" />
                                    Parar
                                </Button>
                            )}
                        </DialogFooter>
                    </>
                )}

            </DialogContent>
        </Dialog>
    );
}
