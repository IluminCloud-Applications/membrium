import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Transcript } from "@/types/transcript";

interface TranscriptTableProps {
    items: Transcript[];
    onView: (item: Transcript) => void;
    onEdit: (item: Transcript) => void;
    onDelete: (item: Transcript) => void;
}

export function TranscriptTable({
    items,
    onView,
    onEdit,
    onDelete,
}: TranscriptTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">
                            Aula
                        </TableHead>
                        <TableHead className="font-semibold px-4">
                            Módulo
                        </TableHead>
                        <TableHead className="font-semibold px-4">
                            Curso
                        </TableHead>

                        <TableHead className="font-semibold px-4 text-center">
                            Keywords
                        </TableHead>
                        <TableHead className="font-semibold px-4 text-center">
                            Atualizado
                        </TableHead>
                        <TableHead className="font-semibold text-right pr-6 px-4">
                            Ações
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item) => (
                        <TranscriptRow
                            key={item.id}
                            item={item}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

/* ---- Individual row ---- */

interface TranscriptRowProps {
    item: Transcript;
    onView: (item: Transcript) => void;
    onEdit: (item: Transcript) => void;
    onDelete: (item: Transcript) => void;
}

function TranscriptRow({ item, onView, onEdit, onDelete }: TranscriptRowProps) {
    const maxKeywords = 3;
    const visibleKeywords = item.keywords.slice(0, maxKeywords);
    const extraCount = item.keywords.length - maxKeywords;

    return (
        <TableRow className="group">
            {/* Lesson name */}
            <TableCell className="font-medium pl-6 px-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                        <i className="ri-file-text-line text-primary text-sm" />
                    </div>
                    <p className="truncate max-w-[200px] font-medium text-sm">
                        {item.lessonName}
                    </p>
                </div>
            </TableCell>

            {/* Module */}
            <TableCell className="px-4 text-sm text-muted-foreground">
                {item.moduleName}
            </TableCell>

            {/* Course */}
            <TableCell className="px-4">
                <Badge
                    variant="secondary"
                    className="text-[10px] bg-primary/8 text-primary/80"
                >
                    {item.courseName}
                </Badge>
            </TableCell>


            {/* Keywords */}
            <TableCell className="px-4 text-center">
                <div className="flex flex-wrap gap-1 justify-center">
                    {visibleKeywords.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                            —
                        </span>
                    ) : (
                        <>
                            {visibleKeywords.map((kw, idx) => (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-[10px] bg-primary/10 text-primary"
                                >
                                    {kw}
                                </Badge>
                            ))}
                            {extraCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-muted text-muted-foreground"
                                >
                                    +{extraCount}
                                </Badge>
                            )}
                        </>
                    )}
                </div>
            </TableCell>

            {/* Updated */}
            <TableCell className="text-center text-sm text-muted-foreground px-4">
                {item.updatedAt}
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right pr-6 px-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <i className="ri-more-2-fill text-lg" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem
                            onClick={() => onView(item)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-eye-line mr-2 text-base" />
                            Ver Detalhes
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onEdit(item)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-pencil-line mr-2 text-base" />
                            Editar
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => onDelete(item)}
                            className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                        >
                            <i className="ri-delete-bin-line mr-2 text-base" />
                            Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}
