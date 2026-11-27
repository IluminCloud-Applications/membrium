import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cloudflareUploadService } from "@/services/cloudflareUpload";
import { courseModificationService } from "@/services/courseModification";
import { extractVideoThumbnail } from "@/utils/videoThumbnail";
import type { LessonFormData } from "@/types/course-modification";
import { toast } from "sonner";

export type UploadJobStatus = "queued" | "uploading" | "saving" | "done" | "error" | "cancelled";

export interface LessonUploadJob {
    id: string;
    title: string;
    moduleId: number;
    lessonId?: number; // present when updating an existing lesson
    removedAttachmentIds?: number[];
    data: LessonFormData;
    status: UploadJobStatus;
    progress: number; // 0..100
    error?: string;
}

function buildLessonFormData(data: LessonFormData, cloudflareUrlOverride?: string): FormData {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("video_platform", data.videoPlatform);

    if (data.videoPlatform === "custom") {
        formData.append("video_url", data.customVideoCode);
    } else if (data.videoPlatform === "vturb") {
        formData.append("video_url", data.vturbVideoId);
    } else if (data.videoPlatform === "cloudflare") {
        formData.append("video_url", cloudflareUrlOverride ?? data.cloudflareUrl);
    } else if (data.videoPlatform === "none") {
        formData.append("video_url", "");
    } else {
        formData.append("video_url", data.videoUrl);
    }

    formData.append("has_cta", String(data.hasCta));
    if (data.hasCta) {
        formData.append("cta_text", data.ctaText);
        formData.append("cta_url", data.ctaUrl);
        formData.append("cta_delay", String(data.ctaDelay));
    }
    for (const file of data.attachments) {
        formData.append("documents", file);
    }
    return formData;
}

export function useLessonUploadQueue(onLessonSaved: () => Promise<void> | void) {
    const [jobs, setJobs] = useState<LessonUploadJob[]>([]);
    const processingRef = useRef(false);
    const abortMapRef = useRef<Map<string, AbortController>>(new Map());
    const jobsRef = useRef<LessonUploadJob[]>(jobs);
    jobsRef.current = jobs;

    const updateJob = useCallback((id: string, patch: Partial<LessonUploadJob>) => {
        setJobs((prev) => {
            const next = prev.map((j) => (j.id === id ? { ...j, ...patch } : j));
            jobsRef.current = next;
            return next;
        });
    }, []);

    const drainQueue = useCallback(async () => {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            while (true) {
                const nextJob = jobsRef.current.find((j) => j.status === "queued");
                if (!nextJob) break;

                const controller = new AbortController();
                abortMapRef.current.set(nextJob.id, controller);

                try {
                    let cloudflareVideoUrl = nextJob.data.cloudflareUrl;
                    let browserThumbnail: File | null = null;

                    if (nextJob.data.videoPlatform === "cloudflare" && nextJob.data.cloudflareFile) {
                        updateJob(nextJob.id, { status: "uploading", progress: 0 });
                        // Extract thumbnail in the browser in parallel with presign+upload.
                        // Never let a background-throttled <video> element stall the upload queue.
                        const thumbPromise = extractVideoThumbnail(nextJob.data.cloudflareFile).catch(() => null);
                        const result = await cloudflareUploadService.upload(nextJob.data.cloudflareFile, {
                            signal: controller.signal,
                            onProgress: (fraction) => {
                                const pct = Math.max(0, Math.min(100, Math.round(fraction * 100)));
                                updateJob(nextJob.id, { progress: pct });
                            },
                        });
                        cloudflareVideoUrl = result.publicUrl;
                        browserThumbnail = await Promise.race([
                            thumbPromise,
                            new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1500)),
                        ]);
                    }

                    if (controller.signal.aborted) {
                        updateJob(nextJob.id, { status: "cancelled" });
                        continue;
                    }

                    updateJob(nextJob.id, { status: "saving", progress: 100 });
                    const formData = buildLessonFormData(nextJob.data, cloudflareVideoUrl);
                    if (browserThumbnail) {
                        formData.append("thumbnail", browserThumbnail);
                    }

                    if (nextJob.lessonId) {
                        for (const attId of nextJob.removedAttachmentIds || []) {
                            try {
                                await courseModificationService.deleteLessonFile(nextJob.lessonId, attId);
                            } catch (err) {
                                console.error(`Erro ao deletar anexo ${attId}:`, err);
                            }
                        }
                        await courseModificationService.updateLesson(nextJob.lessonId, formData);
                    } else {
                        const res = await courseModificationService.createLesson(nextJob.moduleId, formData);
                        if (res.transcript_imported) {
                            toast.success(
                                nextJob.data.videoPlatform === "cloudflare"
                                    ? `Transcrição agendada: ${nextJob.title}`
                                    : `Transcrição importada: ${nextJob.title}`
                            );
                        }
                    }

                    updateJob(nextJob.id, { status: "done", progress: 100 });
                    // Refresh course list without blocking the next queued upload
                    Promise.resolve(onLessonSaved()).catch((err) => {
                        console.error("Erro ao atualizar lista de aulas:", err);
                    });
                } catch (err) {
                    if (err instanceof DOMException && err.name === "AbortError") {
                        updateJob(nextJob.id, { status: "cancelled" });
                    } else {
                        const msg = err instanceof Error ? err.message : "Erro ao enviar aula";
                        updateJob(nextJob.id, { status: "error", error: msg });
                        toast.error(`Erro em "${nextJob.title}": ${msg}`);
                    }
                } finally {
                    abortMapRef.current.delete(nextJob.id);
                }
            }
        } finally {
            processingRef.current = false;
            if (jobsRef.current.some((j) => j.status === "queued")) {
                queueMicrotask(() => {
                    void drainQueue();
                });
            }
        }
    }, [onLessonSaved, updateJob]);

    useEffect(() => {
        if (!processingRef.current && jobs.some((j) => j.status === "queued")) {
            void drainQueue();
        }
    }, [jobs, drainQueue]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && !processingRef.current && jobsRef.current.some((j) => j.status === "queued")) {
                void drainQueue();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [drainQueue]);

    const enqueue = useCallback(
        (params: {
            title: string;
            moduleId: number;
            lessonId?: number;
            removedAttachmentIds?: number[];
            data: LessonFormData;
        }) => {
            const id = `lesson-job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            const newJob: LessonUploadJob = {
                id,
                title: params.title,
                moduleId: params.moduleId,
                lessonId: params.lessonId,
                removedAttachmentIds: params.removedAttachmentIds,
                data: params.data,
                status: "queued",
                progress: 0,
            };
            setJobs((prev) => {
                const next = [...prev, newJob];
                jobsRef.current = next;
                return next;
            });
            queueMicrotask(() => {
                void drainQueue();
            });
        },
        [drainQueue],
    );

    const cancelJob = useCallback((id: string) => {
        const controller = abortMapRef.current.get(id);
        if (controller) {
            controller.abort();
        }
        setJobs((prev) => {
            const next = prev.map((j) =>
                j.id === id && (j.status === "queued" || j.status === "uploading")
                    ? { ...j, status: "cancelled" as const }
                    : j
            );
            jobsRef.current = next;
            return next;
        });
    }, []);

    const clearFinished = useCallback(() => {
        setJobs((prev) => {
            const next = prev.filter((j) => j.status === "queued" || j.status === "uploading" || j.status === "saving");
            jobsRef.current = next;
            return next;
        });
    }, []);

    return { jobs, enqueue, cancelJob, clearFinished };
}

interface LessonUploadQueueWidgetProps {
    jobs: LessonUploadJob[];
    onCancel: (id: string) => void;
    onClearFinished: () => void;
}

export function LessonUploadQueueWidget({
    jobs,
    onCancel,
    onClearFinished,
}: LessonUploadQueueWidgetProps) {
    const [expanded, setExpanded] = useState(true);

    if (jobs.length === 0) return null;

    const activeJob = jobs.find((j) => j.status === "uploading" || j.status === "saving");
    const queuedCount = jobs.filter((j) => j.status === "queued").length;
    const doneCount = jobs.filter((j) => j.status === "done").length;
    const errorCount = jobs.filter((j) => j.status === "error").length;
    const hasPending = Boolean(activeJob) || queuedCount > 0;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 rounded-xl border bg-background/95 backdrop-blur shadow-xl overflow-hidden animate-fade-in">
            {/* Header badge */}
            <div
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-muted/50 border-b cursor-pointer select-none"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {hasPending ? (
                        <i className="ri-upload-cloud-2-line text-primary animate-pulse text-base flex-shrink-0" />
                    ) : errorCount > 0 ? (
                        <i className="ri-error-warning-line text-destructive text-base flex-shrink-0" />
                    ) : (
                        <i className="ri-checkbox-circle-line text-emerald-500 text-base flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                            {activeJob
                                ? activeJob.status === "uploading"
                                    ? `Enviando (${activeJob.progress}%): ${activeJob.title}`
                                    : `Salvando aula: ${activeJob.title}`
                                : hasPending
                                    ? `${queuedCount} na fila`
                                    : errorCount > 0
                                        ? `${doneCount} enviada(s), ${errorCount} erro(s)`
                                        : `${doneCount} ${doneCount === 1 ? "aula criada" : "aulas criadas"}`}
                        </p>
                        {queuedCount > 0 && activeJob && (
                            <p className="text-[11px] text-muted-foreground">
                                +{queuedCount} {queuedCount === 1 ? "aula na fila" : "aulas na fila"}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {!hasPending && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearFinished();
                            }}
                        >
                            Limpar
                        </Button>
                    )}
                    <i className={`ri-arrow-${expanded ? "down" : "up"}-s-line text-muted-foreground`} />
                </div>
            </div>

            {/* Active progress bar */}
            {activeJob && (
                <div className="h-1 w-full bg-muted overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-200"
                        style={{ width: `${activeJob.progress}%` }}
                    />
                </div>
            )}

            {/* Expanded queue list */}
            {expanded && (
                <div className="max-h-60 overflow-y-auto divide-y">
                    {jobs.map((job) => (
                        <div key={job.id} className="px-3.5 py-2 flex items-center gap-2.5 text-xs">
                            <div className="flex-shrink-0">
                                {job.status === "uploading" || job.status === "saving" ? (
                                    <i className="ri-loader-4-line animate-spin text-primary text-sm" />
                                ) : job.status === "queued" ? (
                                    <i className="ri-time-line text-muted-foreground text-sm" />
                                ) : job.status === "done" ? (
                                    <i className="ri-check-line text-emerald-500 text-sm" />
                                ) : job.status === "cancelled" ? (
                                    <i className="ri-close-circle-line text-muted-foreground text-sm" />
                                ) : (
                                    <i className="ri-error-warning-line text-destructive text-sm" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{job.title}</p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                    {job.status === "queued" && "Aguardando na fila..."}
                                    {job.status === "uploading" && `Enviando vídeo... ${job.progress}%`}
                                    {job.status === "saving" && "Salvando aula..."}
                                    {job.status === "done" && "Aula salva com sucesso"}
                                    {job.status === "cancelled" && "Cancelado"}
                                    {job.status === "error" && (job.error || "Erro ao enviar")}
                                </p>
                            </div>

                            {(job.status === "queued" || job.status === "uploading") && (
                                <button
                                    type="button"
                                    onClick={() => onCancel(job.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                    title="Cancelar"
                                >
                                    <i className="ri-close-line text-sm" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
