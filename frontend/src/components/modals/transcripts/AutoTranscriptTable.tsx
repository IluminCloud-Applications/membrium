import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { PendingLesson } from "@/types/transcript";

interface AutoTranscriptTableProps {
    lessons: PendingLesson[];
}

export function AutoTranscriptTable({ lessons }: AutoTranscriptTableProps) {
    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <i className="ri-checkbox-circle-fill text-3xl text-emerald-500 mb-2" />
                <p className="font-medium text-foreground">Tudo concluído!</p>
                <p className="text-sm">Todas as aulas já possuem transcrição completa.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden max-h-[350px] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-4">Curso</TableHead>
                        <TableHead className="font-semibold">Módulo</TableHead>
                        <TableHead className="font-semibold">Aula</TableHead>
                        <TableHead className="font-semibold text-center">Transcrição</TableHead>
                        <TableHead className="font-semibold text-center">Resumo</TableHead>
                        <TableHead className="font-semibold text-center">Keywords</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lessons.map((lesson) => (
                        <AutoTranscriptRow key={lesson.lessonId} lesson={lesson} />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

/* ---- Individual row ---- */

function AutoTranscriptRow({ lesson }: { lesson: PendingLesson }) {
    return (
        <TableRow>
            <TableCell className="pl-4 text-sm max-w-[140px]">
                <p className="truncate font-medium">{lesson.courseName}</p>
            </TableCell>
            <TableCell className="text-sm max-w-[120px]">
                <p className="truncate text-muted-foreground">{lesson.moduleName}</p>
            </TableCell>
            <TableCell className="text-sm max-w-[160px]">
                <div className="flex items-center gap-1.5">
                    {lesson.isYoutube && (
                        <i className="ri-youtube-line text-red-500 text-xs flex-shrink-0" />
                    )}
                    {lesson.isTelegram && (
                        <i className="ri-telegram-line text-blue-500 text-xs flex-shrink-0" />
                    )}
                    <p className="truncate">{lesson.lessonName}</p>
                </div>
            </TableCell>
            <TableCell className="text-center">
                <StatusIcon ok={lesson.hasTranscript} />
            </TableCell>
            <TableCell className="text-center">
                <StatusIcon ok={lesson.hasSummary} />
            </TableCell>
            <TableCell className="text-center">
                <StatusIcon ok={lesson.hasKeywords} />
            </TableCell>
        </TableRow>
    );
}

/* ---- Status icon ---- */

function StatusIcon({ ok }: { ok: boolean }) {
    if (ok) {
        return (
            <i className="ri-checkbox-circle-fill text-emerald-500" />
        );
    }
    return (
        <i className="ri-close-circle-fill text-red-400" />
    );
}
