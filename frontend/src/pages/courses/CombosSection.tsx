import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboCard, ComboModal, ComboEmptyState } from "@/components/combos";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { CourseCombo } from "@/types/combo";
import type { Course } from "@/types/course";
import { combosService } from "@/services/combosService";
import { toast } from "sonner";

interface CombosSectionProps {
    courses: Course[];
    combos: CourseCombo[];
    loading: boolean;
    refetch: () => Promise<void>;
    onOpenWebhook: (combo: CourseCombo) => void;
}

export function CombosSection({
    courses,
    combos,
    loading,
    refetch,
    onOpenWebhook,
}: CombosSectionProps) {
    const [search, setSearch] = useState("");
    const [comboModalOpen, setComboModalOpen] = useState(false);
    const [editingCombo, setEditingCombo] = useState<CourseCombo | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<CourseCombo | null>(null);

    const filteredCombos = useMemo(() => {
        if (!search.trim()) return combos;
        const q = search.toLowerCase();
        return combos.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.description && c.description.toLowerCase().includes(q)) ||
                c.courses.some((course) => course.name.toLowerCase().includes(q))
        );
    }, [combos, search]);

    function handleCreateOpen() {
        setEditingCombo(null);
        setComboModalOpen(true);
    }

    function handleEdit(combo: CourseCombo) {
        setEditingCombo(combo);
        setComboModalOpen(true);
    }

    async function handleComboSubmit(data: {
        name: string;
        description: string;
        course_ids: number[];
    }) {
        try {
            if (editingCombo) {
                await combosService.update(editingCombo.id, data);
                toast.success(`Combo "${data.name}" atualizado com sucesso`);
            } else {
                const res = await combosService.create(data);
                toast.success(`Combo "${data.name}" criado com sucesso`);
                // Se desejar, já pode abrir o webhook do combo recém-criado
                if (res.combo) {
                    onOpenWebhook(res.combo);
                }
            }
            await refetch();
            setComboModalOpen(false);
            setEditingCombo(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao salvar combo";
            toast.error(message);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            await combosService.delete(deleteTarget.id);
            toast.success(`Combo "${deleteTarget.name}" excluído`);
            await refetch();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Erro ao excluir combo";
            toast.error(message);
        }
        setDeleteTarget(null);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <i className="ri-loader-4-line animate-spin text-2xl text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top row: search + action */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <Input
                        placeholder="Buscar combo por nome ou curso incluso..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                <Button onClick={handleCreateOpen} className="btn-brand h-9 text-sm shrink-0">
                    <i className="ri-add-line mr-1.5" />
                    Novo Combo
                </Button>
            </div>

            {/* List or Empty State */}
            {filteredCombos.length === 0 ? (
                <ComboEmptyState onCreateCombo={handleCreateOpen} />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCombos.map((combo) => (
                        <ComboCard
                            key={combo.id}
                            combo={combo}
                            onEdit={handleEdit}
                            onDelete={(c) => setDeleteTarget(c)}
                            onWebhook={onOpenWebhook}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <ComboModal
                open={comboModalOpen}
                onOpenChange={setComboModalOpen}
                onSubmit={handleComboSubmit}
                editCombo={editingCombo}
                courses={courses}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Combo"
                description={`Tem certeza que deseja excluir o combo "${deleteTarget?.name}"? Os cursos individuais NÃO serão excluídos, apenas a oferta agrupada e seu webhook.`}
                confirmLabel="Excluir Combo"
            />
        </div>
    );
}
