import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { FAQLessonGroup } from "@/types/faq";

interface FAQLessonTableProps {
    items: FAQLessonGroup[];
    onView: (item: FAQLessonGroup) => void;
    onEdit: (item: FAQLessonGroup) => void;
    onDelete: (item: FAQLessonGroup) => void;
}

/**
 * Level 3: Shows lessons with FAQs within a module.
 * Each row has actions to view, edit, or delete.
 */
export function FAQLessonTable({
    items,
    onView,
    onEdit,
    onDelete,
}: FAQLessonTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">
                            Aula
                        </TableHead>
                        <TableHead className="font-semibold px-4 text-center">
                            Total de FAQs
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
                        <FAQLessonRow
                            key={item.lessonId}
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

interface FAQLessonRowProps {
    item: FAQLessonGroup;
    onView: (item: FAQLessonGroup) => void;
    onEdit: (item: FAQLessonGroup) => void;
    onDelete: (item: FAQLessonGroup) => void;
}

function FAQLessonRow({ item, onView, onEdit, onDelete }: FAQLessonRowProps) {
    return (
        <TableRow className="group">
            <TableCell className="font-medium pl-6 px-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                        <i className="ri-question-answer-line text-primary text-sm" />
                    </div>
                    <p className="truncate max-w-[250px] font-medium text-sm">
                        {item.lessonName}
                    </p>
                </div>
            </TableCell>

            <TableCell className="px-4 text-center">
                <Badge
                    variant="secondary"
                    className="text-[10px] bg-primary/8 text-primary/80"
                >
                    {item.faqs.length} FAQs
                </Badge>
            </TableCell>

            <TableCell className="text-center text-sm text-muted-foreground px-4">
                {item.updatedAt}
            </TableCell>

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
