import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { courseModificationService } from "@/services/courseModification";
import type { Lesson, CourseModule } from "@/types/course-modification";
import { toast } from "sonner";

interface PublishLessonsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: number;
    draftLessons: Lesson[];
    modules: CourseModule[];
    onSuccess: () => void;
}

export function PublishLessonsModal({
    open,
    onOpenChange,
    courseId,
    draftLessons,
    modules,
    onSuccess,
}: PublishLessonsModalProps) {
    const [publishing, setPublishing] = useState(false);

    function getModuleName(lesson: Lesson): string {
        return modules.find((m) => m.id === lesson.moduleId)?.name ?? "Módulo";
    }

    async function handleConfirm() {
        setPublishing(true);
        try {
            const result = await courseModificationService.publishDraftLessons(courseId);
            toast.success(result.message || `${result.published.length} aula(s) publicada(s)!`);
            onOpenChange(false);
            onSuccess();
        } catch (err) {
            console.error("Erro ao publicar aulas:", err);
            toast.error("Erro ao publicar aulas. Tente novamente.");
        } finally {
            setPublishing(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md flex flex-col max-h-[90vh]">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-send-plane-line text-destructive" />
                        Publicar Aulas em Rascunho
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold text-foreground">{draftLessons.length}</span>{" "}
                        {draftLessons.length === 1 ? "aula será publicada" : "aulas serão publicadas"} e ficará visível para os alunos.
                    </DialogDescription>
                </DialogHeader>

                {/* Compact scrollable lesson list */}
                <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
                    {draftLessons.map((lesson, i) => (
                        <div
                            key={lesson.id}
                            className="flex items-baseline gap-2 py-1 border-b border-border/50 last:border-0"
                        >
                            <span className="text-xs text-muted-foreground shrink-0 w-5 text-right">
                                {i + 1}.
                            </span>
                            <span className="text-sm truncate flex-1">{lesson.title}</span>
                            <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[120px]">
                                {getModuleName(lesson)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-3 shrink-0 border-t border-border">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={publishing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleConfirm}
                        disabled={publishing}
                        className="btn-brand gap-2"
                    >
                        {publishing ? (
                            <i className="ri-loader-4-line animate-spin" />
                        ) : (
                            <i className="ri-send-plane-line" />
                        )}
                        Confirmar e Publicar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
