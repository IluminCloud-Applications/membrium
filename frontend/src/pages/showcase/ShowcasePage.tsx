import { useState, useMemo } from "react";
import {
    ShowcaseStats,
    ShowcaseFilters,
    ShowcaseTable,
    ShowcaseEmptyState,
} from "@/components/showcase";
import type { ShowcaseSortOption } from "@/components/showcase";
import { ShowcaseModal } from "@/components/modals/showcase/ShowcaseModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { ShowcaseItem } from "@/types/showcase";
import { mockShowcaseItems, mockAvailableCourses, mockCourseGroups } from "./mock-data";

export function ShowcasePage() {
    const [items] = useState<ShowcaseItem[]>(mockShowcaseItems);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState<ShowcaseSortOption>("priority");

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ShowcaseItem | null>(null);

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

    function handleToggleStatus(item: ShowcaseItem) {
        console.log("Toggle status:", item.id, item.status === "active" ? "inactive" : "active");
    }

    function handleConfirmDelete() {
        console.log("Delete item:", deleteTarget?.id);
        setDeleteTarget(null);
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
                availableCourses={mockAvailableCourses}
                courseGroups={mockCourseGroups}
                onSubmit={(data) => {
                    console.log(editingItem ? "Update:" : "Create:", data);
                    setModalOpen(false);
                    setEditingItem(null);
                }}
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
