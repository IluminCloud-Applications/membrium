import { useState, useMemo } from "react";
import {
    PromoteStats,
    PromoteFilters,
    PromoteTable,
    PromoteEmptyState,
} from "@/components/promote";
import type { PromoteSortOption } from "@/components/promote";
import { PromoteModal } from "@/components/modals/promote/PromoteModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { PromoteItem } from "@/types/promote";
import { mockPromotions } from "./mock-data";

export function PromotePage() {
    const [items] = useState<PromoteItem[]>(mockPromotions);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState<PromoteSortOption>("newest");

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PromoteItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PromoteItem | null>(null);

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
            case "name":
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        return result;
    }, [items, search, statusFilter, sortBy]);

    // Computed stats
    const activeCount = items.filter((item) => item.status === "active").length;
    const totalViews = items.reduce((sum, item) => sum + item.views, 0);
    const totalClicks = items.reduce((sum, item) => sum + item.clicks, 0);

    const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

    // Handlers
    function handleCreateOpen() {
        setEditingItem(null);
        setModalOpen(true);
    }

    function handleEdit(item: PromoteItem) {
        setEditingItem(item);
        setModalOpen(true);
    }

    function handleDelete(item: PromoteItem) {
        setDeleteTarget(item);
    }

    function handleToggleActive(item: PromoteItem) {
        console.log("Toggle active:", item.id, !item.isActive);
    }

    function handleConfirmDelete() {
        console.log("Delete promotion:", deleteTarget?.id);
        setDeleteTarget(null);
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-megaphone-line text-primary" />
                    Promoções
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie todas as suas promoções em um só lugar
                </p>
            </div>

            {/* Stats */}
            <PromoteStats
                total={items.length}
                activeCount={activeCount}
                totalViews={totalViews}
                totalClicks={totalClicks}
            />

            {/* Filters */}
            <PromoteFilters
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
                <PromoteEmptyState
                    hasFilters={hasActiveFilters}
                    onCreateItem={handleCreateOpen}
                />
            ) : (
                <PromoteTable
                    items={filteredItems}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                />
            )}

            {/* Modals */}
            <PromoteModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                editItem={editingItem}
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
                title="Excluir Promoção"
                description={`Tem certeza que deseja excluir "${deleteTarget?.title}"? Esta promoção será removida permanentemente.`}
                confirmLabel="Excluir Promoção"
            />
        </div>
    );
}
