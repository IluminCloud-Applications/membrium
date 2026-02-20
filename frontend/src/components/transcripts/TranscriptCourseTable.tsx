import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { TranscriptCourseSummary } from "@/types/transcript";

interface TranscriptCourseTableProps {
    items: TranscriptCourseSummary[];
    onSelectCourse: (courseId: number) => void;
}

/**
 * Level 1: Shows courses that have transcripts.
 * Click on a course to drill down to its modules.
 */
export function TranscriptCourseTable({ items, onSelectCourse }: TranscriptCourseTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">
                            Curso
                        </TableHead>
                        <TableHead className="font-semibold px-4 text-center">
                            Módulos com Transcrição
                        </TableHead>
                        <TableHead className="font-semibold px-4 text-center">
                            Total de Transcrições
                        </TableHead>
                        <TableHead className="font-semibold text-right pr-6 px-4">
                            Ação
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item) => (
                        <TableRow
                            key={item.courseId}
                            className="group cursor-pointer"
                            onClick={() => onSelectCourse(item.courseId)}
                        >
                            <TableCell className="font-medium pl-6 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                                        <i className="ri-book-open-line text-primary text-sm" />
                                    </div>
                                    <p className="truncate max-w-[250px] font-medium text-sm">
                                        {item.courseName}
                                    </p>
                                </div>
                            </TableCell>

                            <TableCell className="px-4 text-center">
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-emerald-500/10 text-emerald-600"
                                >
                                    {item.modulesWithTranscript} módulos
                                </Badge>
                            </TableCell>

                            <TableCell className="px-4 text-center">
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-primary/8 text-primary/80"
                                >
                                    {item.totalTranscripts} transcrições
                                </Badge>
                            </TableCell>

                            <TableCell className="text-right pr-6 px-4">
                                <button
                                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                                    onClick={() => onSelectCourse(item.courseId)}
                                >
                                    Ver módulos
                                    <i className="ri-arrow-right-s-line" />
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
