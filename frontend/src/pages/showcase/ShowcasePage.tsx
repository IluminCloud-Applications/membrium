import { useState, useEffect, useMemo, useCallback } from "react";
import {
    ShowcaseStats,
    ShowcaseFilters,
    ShowcaseTable,
    ShowcaseEmptyState,
} from "@/components/showcase";
import type { ShowcaseSortOption } from "@/components/showcase";
import { ShowcaseModal } from "@/components/modals/showcase/ShowcaseModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { ShowcaseItem, ShowcaseCourse } from "@/types/showcase";
import { mapShowcaseItem } from "@/types/showcase";
import { showcaseService } from "@/services/showcase";
import { coursesService } from "@/services/courses";
import { toast } from "sonner";

export function ShowcasePage() {
    const [items, setItems] = useState<ShowcaseItem[]>([]);
    const [availableCourses, setAvailableCourses] = useState<ShowcaseCourse[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState<ShowcaseSortOption>("priority");

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ShowcaseItem | null>(null);

    // Load data
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [showcaseData, coursesData] = await Promise.all([
                showcaseService.getAll(),
                coursesService.listSimple(),
            ]);
            setItems(showcaseData.map(mapShowcaseItem));
            setAvailableCourses(
                coursesData.map((c: { id: number; name: string }) => ({
                    id: c.id,
                    name: c.name,
                }))
            );
        } catch {
            toast.error("Erro ao carregar dados da vitrine");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Filtered & sorted items
    const filteredItems = useMemo(() => {
        let result = [...items];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (item) =>
                    item.title.toLowerCase().includes(q) ||
                    item.description.toLowerCase().includes(q)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter((item) => item.status === statusFilter);
        }

        switch (sortBy) {
            case "newest":
                result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                break;
            case "oldest":
                result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
                break;
            case "priority":
                result.sort((a, b) => b.priority - a.priority);
                break;
            case "views":
                result.sort((a, b) => b.views - a.views);
                break;
        }

        return result;
    }, [items, search, statusFilter, sortBy]);

    // Computed stats
    const totalViews = items.reduce((sum, item) => sum + item.views, 0);
    const totalClicks = items.reduce((sum, item) => sum + item.clicks, 0);
    const activeCount = items.filter((item) => item.status === "active").length;
    const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

    // Handlers
    function handleCreateOpen() {
        setEditingItem(null);
        setModalOpen(true);
    }

    function handleEdit(item: ShowcaseItem) {
        setEditingItem(item);
        setModalOpen(true);
    }

    function handleDelete(item: ShowcaseItem) {
        setDeleteTarget(item);
    }

    async function handleToggleStatus(item: ShowcaseItem) {
        const newStatus = item.status === "active" ? "inactive" : "active";
        try {
            await showcaseService.toggleStatus(item.id, newStatus);
            toast.success(
                newStatus === "active" ? "Item ativado" : "Item desativado"
            );
            loadData();
        } catch {
            toast.error("Erro ao alterar status");
        }
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            await showcaseService.delete(deleteTarget.id);
            toast.success("Item excluído com sucesso");
            setDeleteTarget(null);
            loadData();
        } catch {
            toast.error("Erro ao excluir item");
        }
    }

    async function handleSubmit(data: {
        title: string;
        description: string;
        url: string;
        image: File | null;
        courseIds: number[];
        priority: number;
    }) {
        try {
            if (editingItem) {
                const response = await showcaseService.update(editingItem.id, {
                    name: data.title,
                    description: data.description,
                    url: data.url,
                    priority: data.priority,
                    course_ids: data.courseIds,
                });
                if (data.image && response.item) {
                    await showcaseService.uploadImage(response.item.id, data.image);
                }
                toast.success("Item atualizado com sucesso");
            } else {
                const response = await showcaseService.create({
                    name: data.title,
                    description: data.description,
                    url: data.url,
                    priority: data.priority,
                    course_ids: data.courseIds,
                });
                if (data.image && response.item) {
                    await showcaseService.uploadImage(response.item.id, data.image);
                }
                toast.success("Item criado com sucesso");
            }
            setModalOpen(false);
            setEditingItem(null);
            loadData();
        } catch {
            toast.error("Erro ao salvar item");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <i className="ri-loader-4-line text-2xl animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-store-2-line text-primary" />
                    Vitrine
                </h1>
                <p className="text-sm text-muted-foreground">
                    Crie uma exibição atraente para seus alunos
                </p>
            </div>

            {/* Stats */}
            <ShowcaseStats
                total={items.length}
                totalViews={totalViews}
                totalClicks={totalClicks}
                filteredCount={activeCount}
            />

            {/* Filters */}
            <ShowcaseFilters
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onCreateItem={handleCreateOpen}
            />

            {/* Content */}
            {filteredItems.length === 0 ? (
                <ShowcaseEmptyState
                    hasFilters={hasActiveFilters}
                    onCreateItem={handleCreateOpen}
                />
            ) : (
                <ShowcaseTable
                    items={filteredItems}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                />
            )}

            {/* Modals */}
            <ShowcaseModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                editItem={editingItem}
                availableCourses={availableCourses}
                onSubmit={handleSubmit}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Item da Vitrine"
                description={`Tem certeza que deseja excluir "${deleteTarget?.title}"? Este item será removido permanentemente da vitrine.`}
                confirmLabel="Excluir Item"
            />
        </div>
    );
}
