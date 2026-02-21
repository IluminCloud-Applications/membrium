import { useEffect, useState } from "react";
import type { ImportProgress, ImportResult } from "@/services/students";

interface ImportProgressFloatProps {
    progress: ImportProgress | null;
    result: ImportResult | null;
    onDismiss: () => void;
}

export function ImportProgressFloat({
    progress,
    result,
    onDismiss,
}: ImportProgressFloatProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (progress || result) setVisible(true);
    }, [progress, result]);

    // Auto-dismiss after 8s when done
    useEffect(() => {
        if (!result) return;
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
        }, 8000);
        return () => clearTimeout(timer);
    }, [result, onDismiss]);

    if (!visible) return null;

    const isDone = !!result;
    const current = isDone ? result.total : (progress?.current ?? 0);
    const total = isDone ? result.total : (progress?.total ?? 0);
    const imported = isDone ? result.imported : (progress?.imported ?? 0);
    const skipped = isDone ? result.skipped : (progress?.skipped ?? 0);
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
            <div className="bg-card border rounded-xl shadow-xl p-4 w-80 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isDone ? (
                            <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                <i className="ri-check-line text-emerald-600 text-sm" />
                            </div>
                        ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                <i className="ri-loader-4-line animate-spin text-primary text-sm" />
                            </div>
                        )}
                        <span className="text-sm font-semibold">
                            {isDone ? "Importação Concluída" : "Importando Alunos..."}
                        </span>
                    </div>
                    {isDone && (
                        <button
                            onClick={() => {
                                setVisible(false);
                                setTimeout(onDismiss, 300);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className="ri-close-line text-lg" />
                        </button>
                    )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${isDone ? "bg-emerald-500" : "bg-primary"
                                }`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{current} / {total}</span>
                        <span>{pct}%</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1 text-emerald-600">
                        <i className="ri-user-add-line text-sm" />
                        {imported} {imported === 1 ? "importado" : "importados"}
                    </div>
                    {skipped > 0 && (
                        <div className="flex items-center gap-1 text-amber-600">
                            <i className="ri-user-follow-line text-sm" />
                            {skipped} {skipped === 1 ? "existente" : "existentes"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
