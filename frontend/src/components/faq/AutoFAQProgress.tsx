/**
 * AutoFAQProgress — Floating progress bar for batch FAQ generation.
 *
 * Same design pattern as AutoTranscriptProgress.
 * Shows current lesson being processed and error count.
 */

import { Button } from "@/components/ui/button";
import type { AutoFAQJob } from "@/pages/faq/useAutoFAQ";

interface AutoFAQProgressProps {
    job: AutoFAQJob | null;
    onDismiss: () => void;
}

export function AutoFAQProgress({ job, onDismiss }: AutoFAQProgressProps) {
    if (!job) return null;

    const percent = job.total > 0 ? Math.round((job.completed / job.total) * 100) : 0;
    const isDone = job.status === "done";

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border bg-background shadow-lg animate-fade-in">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                    {isDone ? (
                        <i className="ri-checkbox-circle-line text-emerald-600" />
                    ) : (
                        <i className="ri-loader-4-line animate-spin text-primary" />
                    )}
                    <span className="text-sm font-medium">
                        {isDone ? "FAQ Automático concluído" : "Gerando FAQs..."}
                    </span>
                </div>
                {isDone && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={onDismiss}
                    >
                        <i className="ri-close-line text-sm" />
                    </Button>
                )}
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-2">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>
                        {isDone ? "Concluído" : job.currentLesson}
                    </span>
                    <span>{job.completed}/{job.total}</span>
                </div>
            </div>

            {/* Errors */}
            {job.errors.length > 0 && (
                <div className="border-t mx-4 pt-2 pb-3">
                    <p className="text-xs text-amber-600 font-medium mb-1">
                        <i className="ri-error-warning-line mr-1" />
                        {job.errors.length} erro{job.errors.length !== 1 ? "s" : ""}
                    </p>
                    <ul className="space-y-0.5 max-h-20 overflow-y-auto">
                        {job.errors.map((err, i) => (
                            <li key={i} className="text-[10px] text-muted-foreground leading-tight">
                                {err}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
