import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

export interface AutoTranscriptJob {
    total: number;
    completed: number;
    currentLesson: string;
    status: "running" | "done" | "error";
    errors: string[];
}

interface AutoTranscriptProgressProps {
    job: AutoTranscriptJob | null;
    onDismiss: () => void;
}

export function AutoTranscriptProgress({ job, onDismiss }: AutoTranscriptProgressProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (job) setVisible(true);
    }, [job]);

    if (!job || !visible) return null;

    const percentage = job.total > 0 ? Math.round((job.completed / job.total) * 100) : 0;
    const isDone = job.status === "done";
    const hasErrors = job.errors.length > 0;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
            <div className="w-80 rounded-xl border bg-card shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
                    <div className="flex items-center gap-2">
                        {isDone ? (
                            <i className="ri-checkbox-circle-fill text-emerald-500" />
                        ) : (
                            <i className="ri-robot-2-line text-primary animate-pulse" />
                        )}
                        <span className="text-sm font-semibold">
                            {isDone ? "Transcrição Concluída" : "Transcrevendo..."}
                        </span>
                    </div>
                    {isDone && (
                        <button
                            onClick={() => { setVisible(false); onDismiss(); }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className="ri-close-line text-lg" />
                        </button>
                    )}
                </div>

                {/* Progress content */}
                <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{job.completed}/{job.total} aulas</span>
                        <span className="font-semibold text-foreground">{percentage}%</span>
                    </div>

                    <Progress value={percentage} className="h-2" />

                    {!isDone && job.currentLesson && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                            <i className="ri-loader-4-line animate-spin inline mr-1" />
                            {job.currentLesson}
                        </p>
                    )}

                    {isDone && hasErrors && (
                        <div className="mt-2 rounded-lg bg-destructive/10 p-2 max-h-20 overflow-y-auto">
                            <p className="text-xs font-medium text-destructive mb-1">
                                {job.errors.length} erro(s):
                            </p>
                            {job.errors.map((err, i) => (
                                <p key={i} className="text-xs text-destructive/80 truncate">
                                    • {err}
                                </p>
                            ))}
                        </div>
                    )}

                    {isDone && !hasErrors && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">
                            <i className="ri-check-line mr-1" />
                            Todas as transcrições foram processadas com sucesso!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
