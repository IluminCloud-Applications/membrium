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
import type { PromoteItem } from "@/types/promote";
import { statusLabels, statusColors, statusIcons } from "@/types/promote";

interface PromoteTableProps {
    items: PromoteItem[];
    onEdit: (item: PromoteItem) => void;
    onDelete: (item: PromoteItem) => void;
    onToggleActive: (item: PromoteItem) => void;
}

function getConversionRate(views: number, clicks: number): string {
    return views > 0 ? ((clicks / views) * 100).toFixed(1) : "0.0";
}

export function PromoteTable({
    items,
    onEdit,
    onDelete,
    onToggleActive,
}: PromoteTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">Promoção</TableHead>
                        <TableHead className="font-semibold px-4">Período</TableHead>
                        <TableHead className="font-semibold px-4">Status</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Views</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Cliques</TableHead>
                        <TableHead className="font-semibold px-4 text-center">CTA</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Conversão</TableHead>
                        <TableHead className="font-semibold text-right pr-6 px-4">
                            Ações
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.map((item) => (
                        <PromoteRow
                            key={item.id}
                            item={item}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleActive={onToggleActive}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

/* ---- Individual row ---- */

interface PromoteRowProps {
    item: PromoteItem;
    onEdit: (item: PromoteItem) => void;
    onDelete: (item: PromoteItem) => void;
    onToggleActive: (item: PromoteItem) => void;
}

function PromoteRow({ item, onEdit, onDelete, onToggleActive }: PromoteRowProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <TableRow className="group">
            {/* Title + thumbnail */}
            <TableCell className="font-medium pl-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {item.mediaType === "image" && item.mediaUrl ? (
                            <img
                                src={`/static/uploads/${item.mediaUrl}`}
                                alt={item.title}
                                className="h-full w-full object-cover"
                            />
                        ) : item.mediaType === "video" ? (
                            <div className="h-full w-full flex items-center justify-center bg-primary/5">
                                <i className={`${item.videoSource === "youtube" ? "ri-youtube-line" :
                                    item.videoSource === "vimeo" ? "ri-vimeo-line" :
                                        "ri-code-s-slash-line"
                                    } text-primary`} />
                            </div>
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

            {/* Period */}
            <TableCell className="text-sm text-muted-foreground px-4">
                <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1">
                        <i className="ri-calendar-line text-xs" />
                        {formatDate(item.startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                        <i className="ri-arrow-right-line text-xs" />
                        {formatDate(item.endDate)}
                    </span>
                </div>
            </TableCell>

            {/* Status */}
            <TableCell className="px-4">
                <Badge
                    variant="secondary"
                    className={`text-[11px] font-medium ${statusColors[item.status]}`}
                >
                    <i className={`ri-circle-fill text-[6px] mr-1 ${statusIcons[item.status]}`} />
                    {statusLabels[item.status]}
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

            {/* CTA */}
            <TableCell className="text-center px-4">
                {item.hasCta ? (
                    <Badge
                        variant="secondary"
                        className="text-[11px] font-medium bg-primary/8 text-primary"
                    >
                        <i className="ri-cursor-line text-xs mr-1" />
                        {item.ctaText || "CTA"}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                )}
            </TableCell>

            {/* Conversion Rate */}
            <TableCell className="text-center px-4">
                <Badge
                    variant="secondary"
                    className="text-[11px] font-medium bg-emerald-500/10 text-emerald-600"
                >
                    {getConversionRate(item.views, item.clicks)}%
                </Badge>
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right pr-6 px-4">
                <PromoteRowActions
                    item={item}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleActive={onToggleActive}
                />
            </TableCell>
        </TableRow>
    );
}

/* ---- Actions dropdown ---- */

interface PromoteRowActionsProps {
    item: PromoteItem;
    onEdit: (item: PromoteItem) => void;
    onDelete: (item: PromoteItem) => void;
    onToggleActive: (item: PromoteItem) => void;
}

function PromoteRowActions({ item, onEdit, onDelete, onToggleActive }: PromoteRowActionsProps) {
    return (
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
                    Editar Promoção
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => onToggleActive(item)}
                    className="rounded-lg cursor-pointer"
                >
                    <i className={`${item.isActive ? "ri-eye-off-line" : "ri-eye-line"} mr-2 text-base`} />
                    {item.isActive ? "Desativar" : "Ativar"}
                </DropdownMenuItem>

                {item.hasCta && item.ctaUrl && (
                    <DropdownMenuItem
                        onClick={() => window.open(item.ctaUrl, "_blank")}
                        className="rounded-lg cursor-pointer"
                    >
                        <i className="ri-external-link-line mr-2 text-base" />
                        Abrir URL do CTA
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => onDelete(item)}
                    className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                >
                    <i className="ri-delete-bin-line mr-2 text-base" />
                    Excluir Promoção
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
