/**
 * AutoFAQTable — Tabela de aulas com status para geração automática de FAQ.
 *
 * Exibe para cada aula:
 * - Status de FAQ existente
 * - Status de transcrição
 * - Se é YouTube (pode gerar sem transcrição manual)
 * - Se pode gerar (canGenerate)
 */

import { Badge } from "@/components/ui/badge";
import type { FAQPendingLesson } from "@/services/faq";

interface AutoFAQTableProps {
    lessons: FAQPendingLesson[];
}

export function AutoFAQTable({ lessons }: AutoFAQTableProps) {
    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
                <i className="ri-question-answer-line text-3xl" />
                <p className="text-sm">Nenhuma aula encontrada.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>Aula</span>
                <span className="text-center w-24">Transcrição</span>
                <span className="text-center w-20">Fonte</span>
                <span className="text-center w-16">FAQs</span>
                <span className="text-center w-24">Status</span>
            </div>

            {/* Rows */}
            <div className="divide-y max-h-64 overflow-y-auto">
                {lessons.map((lesson) => (
                    <LessonRow key={lesson.lessonId} lesson={lesson} />
                ))}
            </div>
        </div>
    );
}

function LessonRow({ lesson }: { lesson: FAQPendingLesson }) {
    return (
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 text-sm hover:bg-muted/30 transition-colors">
            {/* Lesson info */}
            <div className="min-w-0">
                <p className="font-medium truncate text-sm">{lesson.lessonName}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {lesson.courseName} › {lesson.moduleName}
                </p>
            </div>

            {/* Transcript */}
            <div className="w-24 flex justify-center">
                {lesson.hasTranscript ? (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <i className="ri-check-line mr-1" />
                        Sim
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        <i className="ri-close-line mr-1" />
                        Não
                    </Badge>
                )}
            </div>

            {/* Fonte */}
            <div className="w-20 flex justify-center">
                {lesson.isYoutube ? (
                    <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400">
                        <i className="ri-youtube-line mr-1" />
                        YT
                    </Badge>
                ) : lesson.isTelegram ? (
                    <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <i className="ri-telegram-line mr-1" />
                        TG
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Não
                    </Badge>
                )}
            </div>

            {/* FAQ count */}
            <div className="w-16 flex justify-center">
                {lesson.faqCount > 0 ? (
                    <Badge variant="secondary" className="text-[10px]">
                        {lesson.faqCount}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                )}
            </div>

            {/* Can generate status */}
            <div className="w-24 flex justify-center">
                <StatusBadge lesson={lesson} />
            </div>
        </div>
    );
}

function StatusBadge({ lesson }: { lesson: FAQPendingLesson }) {
    if (!lesson.canGenerate) {
        return (
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed" title="Adicione uma transcrição manual para gerar FAQ">
                <i className="ri-lock-line mr-1" />
                Manual
            </Badge>
        );
    }

    if (lesson.hasTranscript) {
        return (
            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <i className="ri-sparkle-line mr-1" />
                Pronto
            </Badge>
        );
    }

    // Is YouTube/Telegram but no transcript yet
    if (lesson.isYoutube) {
        return (
            <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <i className="ri-youtube-line mr-1" />
                Via YT
            </Badge>
        );
    }
    if (lesson.isTelegram) {
        return (
            <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <i className="ri-telegram-line mr-1" />
                Via TG
            </Badge>
        );
    }
}
