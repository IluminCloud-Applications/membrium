/**
 * AutoDescriptionModal — Descrição Automática de Aulas via IA.
 *
 * Fases:
 *   1. PREFLIGHT — Carrega status das aulas e configurações.
 *      - Verifica se IA está configurada (Gemini/OpenAI).
 *      - Verifica AssemblyAI (obrigatório para Cloudflare R2 sem transcrição).
 *      - Mostra breakdown: processáveis / já tem descrição (skip) / bloqueadas.
 *      - Bloqueia início se IA não configurada ou nenhuma aula processável.
 *
 *   2. RUNNING — Processa aula a aula:
 *      - Se tem transcrição e não tem descrição → gera descrição.
 *      - Se não tem transcrição e não tem descrição → transcreve e gera.
 *      - Se tem descrição → skip (economiza tokens).
 *
 *   3. DONE — Exibe resultado com sumário de erros.
 */

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ModelCombobox } from "@/components/settings/ai/ModelCombobox";
import { useAIModels } from "@/hooks/useAIModels";
import {
    courseModificationService,
    type LessonAutoFillStatus,
} from "@/services/courseModification";

/* ============================================================ */

interface AutoDescriptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: number;
    onComplete: () => void;
}

type Phase = "preflight" | "running" | "done";

type JobStatus = "pending" | "running" | "done" | "error" | "skipped";

interface JobItem {
    lesson: LessonAutoFillStatus;
    status: JobStatus;
    steps: Record<string, string>;
    errors: string[];
}

/* ============================================================ */

export function AutoDescriptionModal({
    open,
    onOpenChange,
    courseId,
    onComplete,
}: AutoDescriptionModalProps) {
    const ai = useAIModels(open);

    // Pre-flight state
    const [loading, setLoading] = useState(false);
    const [aiConfigured, setAiConfigured] = useState(false);
    const [assemblyAIConfigured, setAssemblyAIConfigured] = useState(false);
    const [allLessons, setAllLessons] = useState<LessonAutoFillStatus[]>([]);
    const [prefligtError, setPrefligtError] = useState<string | null>(null);

    // Processing state
    const [phase, setPhase] = useState<Phase>("preflight");
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    // ── Load pre-flight data on open ──
    useEffect(() => {
        if (!open || !courseId) return;
        setPhase("preflight");
        setLoading(true);
        setPrefligtError(null);

        courseModificationService
            .getAutoFillStatus(courseId)
            .then((data) => {
                setAiConfigured(data.config.aiConfigured);
                setAssemblyAIConfigured(data.config.assemblyAIConfigured);
                setAllLessons(data.lessons);
            })
            .catch(() => setPrefligtError("Não foi possível carregar o status das aulas. Tente novamente."))
            .finally(() => setLoading(false));
    }, [open, courseId]);

    // Derived lesson groups
    const processable = allLessons.filter((l) => l.needsAction);
    const skippedDesc = allLessons.filter((l) => l.hasDescription);
    const blocked = allLessons.filter((l) => !l.needsAction && !l.hasDescription);

    // ── Can start? ──
    const canStart =
        aiConfigured &&
        !loading &&
        !prefligtError &&
        processable.length > 0 &&
        !!ai.model;

    // ── Start processing ──
    async function handleStart() {
        if (!canStart) return;

        // Build job list only for processable lessons
        const initialJobs: JobItem[] = processable.map((lesson) => ({
            lesson,
            status: "pending",
            steps: {},
            errors: [],
        }));
        setJobs(initialJobs);
        setPhase("running");
        setCurrentIndex(0);

        for (let i = 0; i < initialJobs.length; i++) {
            setCurrentIndex(i);
            setJobs((prev) => {
                const next = [...prev];
                next[i] = { ...next[i], status: "running" };
                return next;
            });

            try {
                const result = await courseModificationService.autoFillLesson(
                    initialJobs[i].lesson.lessonId,
                    {
                        provider: ai.provider,
                        model: ai.model ?? undefined,
                        skip_if_exists: true,
                    }
                );

                setJobs((prev) => {
                    const next = [...prev];
                    next[i] = {
                        ...next[i],
                        status: result.success ? "done" : "error",
                        steps: result.steps || {},
                        errors: result.errors || [],
                    };
                    return next;
                });
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Erro desconhecido";
                setJobs((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i], status: "error", errors: [msg] };
                    return next;
                });
            }
        }

        setCurrentIndex(-1);
        setPhase("done");
        onComplete();
    }

    function handleClose() {
        if (phase === "running") return;
        onOpenChange(false);
        // Small delay to reset after close animation
        setTimeout(() => {
            setPhase("preflight");
            setJobs([]);
            setCurrentIndex(-1);
        }, 300);
    }

    const doneCount = jobs.filter((j) => j.status === "done").length;
    const errorCount = jobs.filter((j) => j.status === "error").length;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-magic-line text-primary" />
                        Descrição Automática
                    </DialogTitle>
                    <DialogDescription>
                        Gera descrições de aulas com IA — usando a transcrição existente ou
                        criando uma nova. Aulas que já possuem descrição são ignoradas.
                    </DialogDescription>
                </DialogHeader>

                {/* ── PREFLIGHT PHASE ── */}
                {phase === "preflight" && (
                    <PreflightContent
                        loading={loading}
                        error={prefligtError}
                        aiConfigured={aiConfigured}
                        assemblyAIConfigured={assemblyAIConfigured}
                        processable={processable}
                        skippedDesc={skippedDesc}
                        blocked={blocked}
                        ai={ai}
                    />
                )}

                {/* ── RUNNING PHASE ── */}
                {phase === "running" && (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {jobs.map((job, idx) => (
                            <RunningRow
                                key={job.lesson.lessonId}
                                job={job}
                                isActive={currentIndex === idx}
                            />
                        ))}
                    </div>
                )}

                {/* ── DONE PHASE ── */}
                {phase === "done" && (
                    <div className="space-y-4">
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {jobs.map((job) => (
                                <RunningRow key={job.lesson.lessonId} job={job} isActive={false} />
                            ))}
                        </div>
                        <div
                            className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border ${
                                errorCount > 0
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            }`}
                        >
                            <i
                                className={`mt-0.5 flex-shrink-0 ${
                                    errorCount > 0 ? "ri-error-warning-line" : "ri-check-double-line"
                                }`}
                            />
                            <span>
                                {errorCount > 0
                                    ? `Concluído com ${errorCount} erro${errorCount !== 1 ? "s" : ""}. ${doneCount} aulas processadas com sucesso.`
                                    : `Concluído! ${doneCount} aula${doneCount !== 1 ? "s" : ""} preenchida${doneCount !== 1 ? "s" : ""} com sucesso.`}
                            </span>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 pt-2">
                    {phase !== "running" && (
                        <Button variant="outline" onClick={handleClose}>
                            {phase === "done" ? "Fechar" : "Cancelar"}
                        </Button>
                    )}
                    {phase === "preflight" && (
                        <Button
                            onClick={handleStart}
                            className="btn-brand"
                            disabled={!canStart}
                        >
                            <i className="ri-magic-line mr-1.5" />
                            Iniciar para {processable.length} aula{processable.length !== 1 ? "s" : ""}
                        </Button>
                    )}
                    {phase === "running" && (
                        <Button className="btn-brand" disabled>
                            <i className="ri-loader-4-line animate-spin mr-1.5" />
                            Processando {currentIndex + 1}/{jobs.length}...
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ============================================================
   PRE-FLIGHT CONTENT
   ============================================================ */

function PreflightContent({
    loading,
    error,
    aiConfigured,
    assemblyAIConfigured,
    processable,
    skippedDesc,
    blocked,
    ai,
}: {
    loading: boolean;
    error: string | null;
    aiConfigured: boolean;
    assemblyAIConfigured: boolean;
    processable: LessonAutoFillStatus[];
    skippedDesc: LessonAutoFillStatus[];
    blocked: LessonAutoFillStatus[];
    ai: ReturnType<typeof useAIModels>;
}) {
    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-3 text-sm text-destructive">
                <i className="ri-error-warning-line mt-0.5 flex-shrink-0" />
                {error}
            </div>
        );
    }

    const hasNoProcessable = processable.length === 0;
    const allBlocked = blocked.length > 0 && processable.length === 0 && skippedDesc.length === 0;
    const needsCloudflareAAI = blocked.some((l) => l.isCloudflare && !l.hasTranscript);

    return (
        <div className="space-y-4">
            {/* ── Config warnings ── */}
            <div className="space-y-2">
                <ConfigCheckRow
                    icon="ri-robot-2-line"
                    label="IA configurada (Gemini ou OpenAI)"
                    ok={aiConfigured}
                    failAction="Configure em Configurações → IA"
                />
                {needsCloudflareAAI && (
                    <ConfigCheckRow
                        icon="ri-mic-2-line"
                        label="AssemblyAI configurada (necessário para Cloudflare R2 sem transcrição)"
                        ok={assemblyAIConfigured}
                        failAction="Configure em Configurações → Integrações → AssemblyAI"
                    />
                )}
            </div>

            {/* ── Lesson summary cards ── */}
            <div className="grid grid-cols-3 gap-2">
                <SummaryCard
                    icon="ri-magic-line"
                    label="Serão processadas"
                    count={processable.length}
                    variant="primary"
                />
                <SummaryCard
                    icon="ri-skip-forward-line"
                    label="Já têm descrição"
                    count={skippedDesc.length}
                    variant="neutral"
                />
                <SummaryCard
                    icon="ri-forbid-line"
                    label="Bloqueadas"
                    count={blocked.length}
                    variant="blocked"
                />
            </div>

            {/* ── What will happen per lesson ── */}
            {processable.length > 0 && (
                <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                        O que será gerado por aula:
                    </p>
                    <ul className="space-y-1.5">
                        {[
                            { icon: "ri-file-text-line", text: "Descrição curta (~500 chars: \"Nesse vídeo você vai...\")" },
                            { icon: "ri-question-answer-line", text: "FAQ (5 perguntas e respostas)" },
                            { icon: "ri-key-line", text: "Palavras-chave e resumo da transcrição" },
                        ].map(({ icon, text }) => (
                            <li key={text} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <i className={`${icon} text-primary mt-0.5 flex-shrink-0`} />
                                {text}
                            </li>
                        ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground/60">
                        Aulas com transcrição já existente usam ela diretamente (economiza tokens).
                    </p>
                </div>
            )}

            {/* ── Blocked warning ── */}
            {blocked.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                    <i className="ri-information-line mt-0.5 flex-shrink-0" />
                    <span>
                        <strong>{blocked.length} aula{blocked.length !== 1 ? "s" : ""}</strong> não {blocked.length !== 1 ? "podem ser processadas" : "pode ser processada"} automaticamente.{" "}
                        {blocked.some((l) => !l.canProcess) && "VTurb/Custom não suporta transcrição automática. "}
                        {needsCloudflareAAI && !assemblyAIConfigured && "Configure o AssemblyAI para processar vídeos do Cloudflare R2."}
                    </span>
                </div>
            )}

            {/* ── Empty state — all blocked or only skipped ── */}
            {hasNoProcessable && !allBlocked && skippedDesc.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <i className="ri-check-double-line mt-0.5 flex-shrink-0" />
                    <span>
                        Todas as aulas já possuem descrição. Nenhuma ação necessária.
                    </span>
                </div>
            )}

            {allBlocked && (
                <div className="flex items-start gap-2 rounded-lg bg-muted border px-3 py-3 text-sm text-muted-foreground">
                    <i className="ri-forbid-line mt-0.5 flex-shrink-0" />
                    <span>
                        Nenhuma aula disponível para processamento automático. Apenas vídeos do{" "}
                        <strong>YouTube</strong> e <strong>Cloudflare R2</strong> são suportados.
                    </span>
                </div>
            )}

            {/* ── Model selector ── */}
            {processable.length > 0 && aiConfigured && (
                <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Modelo de IA</Label>
                    <ModelCombobox
                        models={ai.models}
                        value={ai.model}
                        onValueChange={ai.setModel}
                        placeholder="Selecione o modelo de IA..."
                        loading={ai.loading}
                    />
                </div>
            )}
        </div>
    );
}

/* ============================================================
   RUNNING ROW
   ============================================================ */

const STEP_LABELS: Record<string, string> = {
    transcript: "Transcrição",
    metadata: "Resumo",
    faq: "FAQ",
    description: "Descrição",
};

function RunningRow({ job, isActive }: { job: JobItem; isActive: boolean }) {
    const iconMap: Record<JobStatus, string> = {
        pending: "ri-time-line text-muted-foreground",
        running: "ri-loader-4-line animate-spin text-primary",
        done: "ri-check-line text-emerald-500",
        error: "ri-error-warning-line text-destructive",
        skipped: "ri-skip-forward-line text-muted-foreground",
    };

    const bgNote = job.lesson.hasTranscript ? (
        <span className="text-[10px] text-muted-foreground ml-1">(transcrição existente)</span>
    ) : null;

    return (
        <div
            className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/30"
            }`}
        >
            <i className={`mt-0.5 flex-shrink-0 ${iconMap[job.status]}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                    <span className="font-medium truncate">{job.lesson.lessonTitle}</span>
                    {bgNote}
                    <span className="text-xs text-muted-foreground ml-1">— {job.lesson.moduleName}</span>
                </div>
                {Object.keys(job.steps).length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                        {Object.entries(job.steps).map(([step, status]) => {
                            const isDone = status === "done";
                            const isSkipped = status.startsWith("skipped");
                            const isError = status === "error";
                            return (
                                <Badge
                                    key={step}
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0 h-4 ${
                                        isDone
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : isError
                                            ? "bg-destructive/10 text-destructive"
                                            : "bg-muted/60 text-muted-foreground"
                                    }`}
                                >
                                    {isDone && <i className="ri-check-line mr-0.5" />}
                                    {isSkipped && <i className="ri-skip-forward-line mr-0.5" />}
                                    {isError && <i className="ri-close-line mr-0.5" />}
                                    {STEP_LABELS[step] ?? step}
                                </Badge>
                            );
                        })}
                    </div>
                )}
                {job.errors.length > 0 && (
                    <p className="text-xs text-destructive mt-1 line-clamp-1">{job.errors[0]}</p>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   SMALL COMPONENTS
   ============================================================ */

function ConfigCheckRow({
    icon,
    label,
    ok,
    failAction,
}: {
    icon: string;
    label: string;
    ok: boolean;
    failAction: string;
}) {
    return (
        <div
            className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm border ${
                ok
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-destructive/5 border-destructive/20"
            }`}
        >
            <i
                className={`mt-0.5 flex-shrink-0 text-base ${
                    ok ? "ri-check-circle-line text-emerald-500" : "ri-error-warning-line text-destructive"
                }`}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <i className={`${icon} text-muted-foreground text-xs`} />
                    <span className={ok ? "text-foreground" : "text-destructive font-medium"}>
                        {label}
                    </span>
                </div>
                {!ok && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        → {failAction}
                    </p>
                )}
            </div>
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    count,
    variant,
}: {
    icon: string;
    label: string;
    count: number;
    variant: "primary" | "neutral" | "blocked";
}) {
    const styles = {
        primary: "bg-primary/8 border-primary/20 text-primary",
        neutral: "bg-emerald-500/8 border-emerald-500/20 text-emerald-600",
        blocked: "bg-muted/60 border-muted-foreground/20 text-muted-foreground",
    };

    return (
        <div className={`rounded-lg border px-3 py-3 text-center ${styles[variant]}`}>
            <i className={`${icon} text-xl`} />
            <p className="text-2xl font-bold mt-1">{count}</p>
            <p className="text-[11px] font-medium opacity-70 leading-tight mt-0.5">{label}</p>
        </div>
    );
}
