import { useState, useEffect, useMemo, useCallback } from "react";
import {
    PromoteStats,
    PromoteFilters,
    PromoteTable,
    PromoteEmptyState,
} from "@/components/promote";
import type { PromoteSortOption } from "@/components/promote";
import { PromoteModal } from "@/components/modals/promote/PromoteModal";
import type { PromoteFormData } from "@/components/modals/promote/PromoteModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { PromoteItem } from "@/types/promote";
import { promoteService } from "@/services/promote";

export function PromotePage() {
    const [items, setItems] = useState<PromoteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalViews, setTotalViews] = useState(0);
    const [totalClicks, setTotalClicks] = useState(0);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState<PromoteSortOption>("newest");

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PromoteItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PromoteItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch promotions
    const fetchPromotions = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await promoteService.getAll({
                search: search.trim() || undefined,
                status: statusFilter !== "all" ? statusFilter : undefined,
            });
            setItems(data.promotions);
            setTotalViews(data.total_views);
            setTotalClicks(data.total_clicks);
        } catch (err) {
            console.error("Failed to fetch promotions:", err);
        } finally {
            setIsLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    // Sorted items (filtering done server-side)
    const sortedItems = useMemo(() => {
        const result = [...items];
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
    }, [items, sortBy]);

    // Computed stats
    const activeCount = items.filter((item) => item.status === "active").length;
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

    async function handleToggleActive(item: PromoteItem) {
        try {
            await promoteService.toggleActive(item.id);
            fetchPromotions();
        } catch (err) {
            console.error("Failed to toggle promotion:", err);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            await promoteService.delete(deleteTarget.id);
            setDeleteTarget(null);
            fetchPromotions();
        } catch (err) {
            console.error("Failed to delete promotion:", err);
        }
    }

    async function handleSubmit(data: PromoteFormData) {
        try {
            setIsSaving(true);
            const payload = {
                title: data.title,
                description: data.description,
                mediaType: data.mediaType,
                mediaUrl: data.mediaUrl,
                videoSource: data.videoSource,
                startDate: data.startDate,
                endDate: data.endDate,
                hasCta: data.hasCta,
                ctaText: data.ctaText,
                ctaUrl: data.ctaUrl,
                ctaDelay: data.ctaDelay,
                hideVideoControls: data.hideVideoControls,
            };

            if (editingItem) {
                await promoteService.update(editingItem.id, payload, data.mediaFile);
            } else {
                await promoteService.create(payload, data.mediaFile);
            }

            setModalOpen(false);
            setEditingItem(null);
            fetchPromotions();
        } catch (err) {
            console.error("Failed to save promotion:", err);
        } finally {
            setIsSaving(false);
        }
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
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <i className="ri-loader-4-line animate-spin text-3xl text-primary" />
                </div>
            ) : sortedItems.length === 0 ? (
                <PromoteEmptyState
                    hasFilters={hasActiveFilters}
                    onCreateItem={handleCreateOpen}
                />
            ) : (
                <PromoteTable
                    items={sortedItems}
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
                isLoading={isSaving}
                onSubmit={handleSubmit}
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
