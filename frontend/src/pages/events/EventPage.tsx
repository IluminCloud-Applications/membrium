import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EventStats } from "@/components/events/EventStats";
import { EventFilters } from "@/components/events/EventFilters";
import { EventTable } from "@/components/events/EventTable";
import { EventEmptyState } from "@/components/events/EventEmptyState";
import { EventModal, type EventFormData } from "@/components/modals/events/EventModal";
import { eventService, type EventsResponse } from "@/services/event";
import type { EventItem } from "@/types/event";

export function EventPage() {
    const [data, setData] = useState<EventsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<EventItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentPage, statusFilter]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                loadData();
            } else {
                setCurrentPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    async function loadData() {
        try {
            setIsLoading(true);
            const response = await eventService.getAll({
                page: currentPage,
                search,
                status: statusFilter,
                sort: sortBy,
            });
            setData(response);
        } catch (error) {
            toast.error("Erro ao carregar eventos");
        } finally {
            setIsLoading(false);
        }
    }

    function handleOpenModal(item?: EventItem) {
        setEditingItem(item || null);
        setIsModalOpen(true);
    }

    async function handleSubmit(formData: EventFormData) {
        try {
            setIsSaving(true);
            if (editingItem) {
                await eventService.update(editingItem.id, formData as any, formData.mediaFile);
                toast.success("Evento atualizado com sucesso!");
            } else {
                await eventService.create(formData as any, formData.mediaFile);
                toast.success("Evento criado com sucesso!");
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            toast.error(editingItem ? "Erro ao atualizar evento" : "Erro ao criar evento");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleToggleActive(id: number) {
        try {
            await eventService.toggleActive(id);
            toast.success("Status atualizado");
            loadData();
        } catch (error) {
            toast.error("Erro ao atualizar status");
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Tem certeza que deseja excluir este evento?")) return;
        try {
            await eventService.delete(id);
            toast.success("Evento excluído com sucesso");
            loadData();
        } catch (error) {
            toast.error("Erro ao excluir evento");
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-calendar-event-line text-primary" />
                    Eventos
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie chamadas ao vivo, webinários e eventos da sua plataforma.
                </p>
            </div>

            {/* Stats Overview */}
            <EventStats
                total={data?.total || 0}
                activeCount={data?.active || 0}
                totalViews={data?.total_views || 0}
                totalClicks={data?.total_clicks || 0}
            />

            {/* Filters */}
            <EventFilters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onCreateItem={() => handleOpenModal()}
            />

            {/* Table or Empty State */}
            {data?.events.length === 0 && !isLoading ? (
                <EventEmptyState hasFilters={!!search || statusFilter !== "all"} onCreateItem={() => handleOpenModal()} />
            ) : (
                <div className="space-y-4">
                    <EventTable
                        data={data?.events || []}
                        isLoading={isLoading}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                        onToggleActive={handleToggleActive}
                    />

                    {/* Pagination */}
                    {data && data.total_pages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Mostrando página {data.current_page} de {data.total_pages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={data.current_page === 1}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(data.total_pages, p + 1))}
                                    disabled={data.current_page === data.total_pages}
                                >
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <EventModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                editItem={editingItem}
                onSubmit={handleSubmit}
                isLoading={isSaving}
            />
        </div>
    );
}
