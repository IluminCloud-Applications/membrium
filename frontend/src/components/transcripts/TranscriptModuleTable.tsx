import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { TranscriptModuleSummary } from "@/types/transcript";

interface TranscriptModuleTableProps {
    items: TranscriptModuleSummary[];
    onSelectModule: (moduleId: number) => void;
}

/**
 * Level 2: Shows modules within a selected course that have transcripts.
 * Click on a module to drill down to its lessons.
 */
export function TranscriptModuleTable({ items, onSelectModule }: TranscriptModuleTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">
                            Módulo
                        </TableHead>
                        <TableHead className="font-semibold px-4 text-center">
                            Aulas com Transcrição
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
                            key={item.moduleId}
                            className="group cursor-pointer"
                            onClick={() => onSelectModule(item.moduleId)}
                        >
                            <TableCell className="font-medium pl-6 px-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                                        <i className="ri-folder-line text-primary text-sm" />
                                    </div>
                                    <p className="truncate max-w-[250px] font-medium text-sm">
                                        {item.moduleName}
                                    </p>
                                </div>
                            </TableCell>

                            <TableCell className="px-4 text-center">
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-emerald-500/10 text-emerald-600"
                                >
                                    {item.lessonsWithTranscript} aulas
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
                                    onClick={() => onSelectModule(item.moduleId)}
                                >
                                    Ver aulas
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
