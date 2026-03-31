import { useState, useCallback, useRef } from "react";
import { faqService, type FAQPendingLesson } from "@/services/faq";

export interface AutoFAQJob {
    total: number;
    completed: number;
    currentLesson: string;
    status: "running" | "done";
    errors: string[];
}

/**
 * Hook que gerencia a geração automática de FAQs.
 * Processa as aulas uma a uma e rastreia o progresso.
 */
export function useAutoFAQ(onComplete: () => void) {
    const [job, setJob] = useState<AutoFAQJob | null>(null);
    const abortRef = useRef(false);

    const startGeneration = useCallback(
        async (lessons: FAQPendingLesson[], provider: string, model: string) => {
            abortRef.current = false;

            const newJob: AutoFAQJob = {
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
                    prev ? { ...prev, currentLesson: lesson.lessonName } : null
                );

                try {
                    const result = await faqService.generateWithAI({
                        lesson_id: lesson.lessonId,
                        provider,
                        model,
                    });

                    if (result.success && result.faqs && result.faqs.length > 0) {
                        // Save the generated FAQs
                        if (lesson.hasFaq) {
                            await faqService.update(lesson.lessonId, {
                                faqs: result.faqs,
                            });
                        } else {
                            await faqService.create({
                                lesson_id: lesson.lessonId,
                                faqs: result.faqs,
                            });
                        }
                    } else if (!result.success) {
                        throw new Error(result.message || `Erro ao gerar FAQ para "${lesson.lessonName}"`);
                    }
                } catch (error) {
                    const msg =
                        error instanceof Error
                            ? error.message
                            : `Erro na aula "${lesson.lessonName}"`;
                    setJob((prev) =>
                        prev
                            ? { ...prev, errors: [...prev.errors, msg] }
                            : null
                    );
                }

                setJob((prev) =>
                    prev ? { ...prev, completed: i + 1 } : null
                );
            }

            setJob((prev) =>
                prev ? { ...prev, status: "done", currentLesson: "" } : null
            );

            onComplete();
        },
        [onComplete]
    );

    const dismiss = useCallback(() => {
        setJob(null);
    }, []);

    const abort = useCallback(() => {
        abortRef.current = true;
    }, []);

    return { job, startGeneration, dismiss, abort };
}
