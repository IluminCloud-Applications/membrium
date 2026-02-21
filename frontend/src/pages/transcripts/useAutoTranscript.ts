import { useState, useCallback, useRef } from "react";
import { transcriptsService } from "@/services/transcripts";
import type { PendingLesson } from "@/types/transcript";
import type { AutoTranscriptJob } from "@/components/transcripts/AutoTranscriptProgress";

/**
 * Hook that manages the auto-transcript generation process.
 * Processes lessons one by one and tracks progress.
 */
export function useAutoTranscript(onComplete: () => void) {
    const [job, setJob] = useState<AutoTranscriptJob | null>(null);
    const abortRef = useRef(false);

    const startGeneration = useCallback(
        async (lessons: PendingLesson[], provider: string, model: string) => {
            abortRef.current = false;

            const newJob: AutoTranscriptJob = {
                total: lessons.length,
                completed: 0,
                currentLesson: lessons[0]?.lessonName || "",
                status: "running",
                errors: [],
            };
            setJob({ ...newJob });

            for (let i = 0; i < lessons.length; i++) {
                if (abortRef.current) break;

                const lesson = lessons[i];

                setJob((prev) =>
                    prev
                        ? {
                            ...prev,
                            currentLesson: lesson.lessonName,
                        }
                        : null
                );

                try {
                    await transcriptsService.autoGenerate({
                        lessonId: lesson.lessonId,
                        provider,
                        model,
                    });
                } catch (error) {
                    const msg =
                        error instanceof Error
                            ? error.message
                            : `Erro na aula "${lesson.lessonName}"`;
                    setJob((prev) =>
                        prev
                            ? {
                                ...prev,
                                errors: [...prev.errors, msg],
                            }
                            : null
                    );
                }

                setJob((prev) =>
                    prev
                        ? {
                            ...prev,
                            completed: i + 1,
                        }
                        : null
                );
            }

            setJob((prev) =>
                prev
                    ? {
                        ...prev,
                        status: "done",
                        currentLesson: "",
                    }
                    : null
            );

            onComplete();
        },
        [onComplete]
    );

    const dismiss = useCallback(() => {
        setJob(null);
    }, []);

    return { job, startGeneration, dismiss };
}
