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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { EventItem } from "@/types/event";
import { statusLabels, statusColors, statusIcons } from "@/types/event";

interface EventTableProps {
    data: EventItem[];
    onEdit: (item: EventItem) => void;
    onDelete: (id: number) => void;
    onToggleActive: (id: number) => void;
    isLoading: boolean;
}

export function EventTable({
    data,
    onEdit,
    onDelete,
    onToggleActive,
    isLoading,
}: EventTableProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <i className="ri-loader-4-line text-3xl animate-spin mb-4" />
                <p>Carregando eventos...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden p-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold pl-6 px-4">Evento</TableHead>
                        <TableHead className="font-semibold px-4">Data do Evento</TableHead>
                        <TableHead className="font-semibold px-4">Status</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Views</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Cliques</TableHead>
                        <TableHead className="font-semibold px-4 text-center">Notificações</TableHead>
                        <TableHead className="font-semibold text-right pr-6 px-4">Ações</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.map((item) => (
                        <EventRow
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

interface EventRowProps {
    item: EventItem;
    onEdit: (item: EventItem) => void;
    onDelete: (id: number) => void;
    onToggleActive: (id: number) => void;
}

function EventRow({ item, onEdit, onDelete, onToggleActive }: EventRowProps) {
    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "dd MMM, yyyy HH:mm", { locale: ptBR });
    };

    return (
        <TableRow className="group">
            {/* Title + thumbnail */}
            <TableCell className="font-medium pl-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {item.mediaType === "image" && item.mediaUrl ? (
                            <img
                                src={item.mediaUrl.startsWith("http") ? item.mediaUrl : `/static/uploads/${item.mediaUrl}`}
                                alt={item.title}
                                className="h-full w-full object-cover"
                            />
                        ) : item.mediaType === "html" ? (
                            <div className="h-full w-full flex items-center justify-center bg-primary/5">
                                <i className="ri-html5-line text-primary" />
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

            {/* Event Date */}
            <TableCell className="text-sm text-muted-foreground px-4">
                <div className="flex items-center gap-1">
                    <i className="ri-calendar-event-line text-xs" />
                    {formatDate(item.eventDate)}
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

            {/* Notifications */}
            <TableCell className="text-center px-4">
                <div className="flex items-center justify-center gap-2">
                    {item.sendEmail ? (
                        <i className="ri-mail-send-line text-primary" title="Email habilitado" />
                    ) : (
                        <i className="ri-mail-close-line text-muted-foreground/30" title="Email desabilitado" />
                    )}
                    {item.sendWhatsapp ? (
                        <i className="ri-whatsapp-line text-emerald-500" title="WhatsApp habilitado" />
                    ) : (
                        <i className="ri-whatsapp-line text-muted-foreground/30" title="WhatsApp desabilitado" />
                    )}
                </div>
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right pr-6 px-4">
                <EventRowActions
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

interface EventRowActionsProps {
    item: EventItem;
    onEdit: (item: EventItem) => void;
    onDelete: (id: number) => void;
    onToggleActive: (id: number) => void;
}

function EventRowActions({ item, onEdit, onDelete, onToggleActive }: EventRowActionsProps) {
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
                    Editar Evento
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => onToggleActive(item.id)}
                    className="rounded-lg cursor-pointer"
                >
                    <i className={`${item.isActive ? "ri-eye-off-line" : "ri-eye-line"} mr-2 text-base`} />
                    {item.isActive ? "Desativar" : "Ativar"}
                </DropdownMenuItem>

                {item.callLink && (
                    <DropdownMenuItem
                        onClick={() => window.open(item.callLink, "_blank")}
                        className="rounded-lg cursor-pointer"
                    >
                        <i className="ri-external-link-line mr-2 text-base" />
                        Abrir Link da Chamada
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    onClick={() => {
                        const url = `${window.location.origin}/e/${item.id}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link do convite copiado!");
                    }}
                    className="rounded-lg cursor-pointer"
                >
                    <i className="ri-calendar-event-fill mr-2 text-base" />
                    Copiar Agendamento
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => onDelete(item.id)}
                    className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                >
                    <i className="ri-delete-bin-line mr-2 text-base" />
                    Excluir Evento
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
