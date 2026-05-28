import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types/course";
import { coursesService } from "@/services/courses";
import { categoryColors, categoryLabels } from "@/types/course";
import { toast } from "sonner";

interface ReorderCoursesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courses: Course[];
    onSuccess: () => void;
}

export function ReorderCoursesModal({
    open,
    onOpenChange,
    courses,
    onSuccess,
}: ReorderCoursesModalProps) {
    const [items, setItems] = useState<Course[]>([]);
    const [saving, setSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Initialize list when modal opens
    useEffect(() => {
        if (open) {
            // Copy and sort by order/created_at to match listing
            const sorted = [...courses].sort((a, b) => {
                if ((a.order ?? 0) > 0 || (b.order ?? 0) > 0) {
                    return (a.order ?? 999999) - (b.order ?? 999999);
                }
                return b.createdAt.localeCompare(a.createdAt);
            });
            setItems(sorted);
        }
    }, [open, courses]);

    // Keyboard / Click order adjusters
    const moveUp = (index: number) => {
        if (index === 0) return;
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[index - 1];
        newItems[index - 1] = temp;
        setItems(newItems);
    };

    const moveDown = (index: number) => {
        if (index === items.length - 1) return;
        const newItems = [...items];
        const temp = newItems[index];
        newItems[index] = newItems[index + 1];
        newItems[index + 1] = temp;
        setItems(newItems);
    };

    // HTML5 Drag and Drop events
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Create clean drag image behavior
        const dragImg = new Image();
        dragImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        e.dataTransfer.setDragImage(dragImg, 0, 0);
    };

    const handleDragOver = (index: number) => {
        if (draggedIndex === null || draggedIndex === index) return;

        const newItems = [...items];
        const draggedItem = newItems[draggedIndex];
        newItems.splice(draggedIndex, 1);
        newItems.splice(index, 0, draggedItem);

        setDraggedIndex(index);
        setItems(newItems);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const ids = items.map((item) => item.id);
            const res = await coursesService.reorder(ids);
            if (res.success) {
                toast.success("Ordem dos cursos salva com sucesso!");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(res.message || "Erro ao reordenar cursos");
            }
        } catch (err) {
            console.error("Erro ao salvar ordem:", err);
            toast.error("Ocorreu um erro ao salvar a nova ordenação");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <i className="ri-arrow-up-down-line text-primary" />
                        Reordenar Cursos
                    </DialogTitle>
                    <DialogDescription>
                        Arraste e solte os cursos ou use as setas para ajustar a ordem de exibição na área de membros.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-2 max-h-[50vh]">
                    {items.map((course, index) => {
                        const isDragging = draggedIndex === index;
                        return (
                            <div
                                key={course.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    handleDragOver(index);
                                }}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center justify-between p-3 rounded-lg border bg-card transition-all select-none ${
                                    isDragging
                                        ? "border-primary/50 bg-primary/5 opacity-50 scale-[0.98]"
                                        : "border-border hover:border-primary/30"
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Arrastar para reordenar"
                                    >
                                        <i className="ri-drag-move-2-line text-lg" />
                                    </div>

                                    {course.image ? (
                                        <img
                                            src={course.image}
                                            alt={course.name}
                                            className="w-10 h-10 rounded object-cover border bg-muted"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center">
                                            <i className="ri-book-open-line text-muted-foreground" />
                                        </div>
                                    )}

                                    <div className="min-w-0">
                                        <h4 className="font-medium text-sm truncate max-w-[280px]">
                                            {course.name}
                                        </h4>
                                        <span
                                            className={`inline-block px-2 py-0.5 mt-1 text-[10px] font-semibold rounded-full ${
                                                categoryColors[course.category]
                                            }`}
                                        >
                                            {categoryLabels[course.category]}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                    >
                                        <i className="ri-arrow-up-line" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                                        onClick={() => moveDown(index)}
                                        disabled={index === items.length - 1}
                                    >
                                        <i className="ri-arrow-down-line" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <i className="ri-loader-4-line animate-spin mr-2" />
                                Salvando...
                            </>
                        ) : (
                            "Salvar Ordenação"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
