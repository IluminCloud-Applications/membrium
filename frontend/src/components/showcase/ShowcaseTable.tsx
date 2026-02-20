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
import type { ShowcaseItem } from "@/types/showcase";
import { statusLabels, statusColors } from "@/types/showcase";

interface ShowcaseTableProps {
    items: ShowcaseItem[];
    onEdit: (item: ShowcaseItem) => void;
    onDelete: (item: ShowcaseItem) => void;
    onToggleStatus: (item: ShowcaseItem) => void;
}

export function ShowcaseTable({
    items,
    onEdit,
    onDelete,
    onToggleStatus,
}: ShowcaseTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">Vitrine</TableHead>
                        <TableHead className="font-semibold px-4">Cursos</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Prioridade</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Views</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Cliques</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Conversão</TableHead>
                        <TableHead className="font-semibold px-4">Status</TableHead>
                        <TableHead className="font-semibold text-right pr-6 px-4">
                            Ações
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item) => (
                        <ShowcaseRow
                            key={item.id}
                            item={item}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleStatus={onToggleStatus}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

/* ---- Individual row ---- */

interface ShowcaseRowProps {
    item: ShowcaseItem;
    onEdit: (item: ShowcaseItem) => void;
    onDelete: (item: ShowcaseItem) => void;
    onToggleStatus: (item: ShowcaseItem) => void;
}

function ShowcaseRow({ item, onEdit, onDelete, onToggleStatus }: ShowcaseRowProps) {
    const maxVisibleCourses = 2;
    const visibleCourses = item.courses.slice(0, maxVisibleCourses);
    const extraCount = item.courses.length - maxVisibleCourses;
    const conversionRate = item.views > 0
        ? ((item.clicks / item.views) * 100).toFixed(1)
        : "0.0";

    return (
        <TableRow className="group">
            {/* Title + thumbnail */}
            <TableCell className="font-medium pl-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                            <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center">
                                <i className="ri-image-line text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate max-w-[200px] font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.description}
                        </p>
                    </div>
                </div>
            </TableCell>

            {/* Courses */}
            <TableCell className="px-4">
                <div className="flex flex-wrap gap-1">
                    {visibleCourses.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                            Nenhum curso
                        </span>
                    ) : (
                        <>
                            {visibleCourses.map((course) => (
                                <Badge
                                    key={course.id}
                                    variant="secondary"
                                    className="text-[10px] bg-primary/8 text-primary/80"
                                >
                                    {course.name}
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

            {/* Priority */}
            <TableCell className="text-center px-4">
                <Badge
                    variant="secondary"
                    className="text-[11px] font-medium bg-primary/8 text-primary"
                >
                    {item.priority}
                </Badge>
            </TableCell>

            {/* Views */}
            <TableCell className="text-center text-sm text-muted-foreground px-4">
                {item.views.toLocaleString("pt-BR")}
            </TableCell>

            {/* Clicks */}
            <TableCell className="text-center text-sm text-muted-foreground px-4">
                {item.clicks.toLocaleString("pt-BR")}
            </TableCell>

            {/* Conversion Rate */}
            <TableCell className="text-center px-4">
                <Badge
                    variant="secondary"
                    className="text-[11px] font-medium bg-emerald-500/10 text-emerald-600"
                >
                    {conversionRate}%
                </Badge>
            </TableCell>

            {/* Status */}
            <TableCell className="px-4">
                <Badge
                    variant="secondary"
                    className={`text-[11px] font-medium ${statusColors[item.status]}`}
                >
                    <i
                        className={`ri-circle-fill text-[6px] mr-1 ${item.status === "active" ? "text-emerald-500" : "text-red-400"
                            }`}
                    />
                    {statusLabels[item.status]}
                </Badge>
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
                            onClick={() => onEdit(item)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-pencil-line mr-2 text-base" />
                            Editar Item
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => onToggleStatus(item)}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className={`${item.status === "active" ? "ri-eye-off-line" : "ri-eye-line"} mr-2 text-base`} />
                            {item.status === "active" ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => window.open(item.url, "_blank")}
                            className="rounded-lg cursor-pointer"
                        >
                            <i className="ri-external-link-line mr-2 text-base" />
                            Abrir URL
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => onDelete(item)}
                            className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                        >
                            <i className="ri-delete-bin-line mr-2 text-base" />
                            Excluir Item
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}
