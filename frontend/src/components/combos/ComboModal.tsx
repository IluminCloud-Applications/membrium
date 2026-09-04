import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ComboCoursePicker } from "./ComboCoursePicker";
import type { CourseCombo } from "@/types/combo";
import type { Course } from "@/types/course";

interface ComboModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { name: string; description: string; course_ids: number[] }) => Promise<void>;
    editCombo?: CourseCombo | null;
    courses: Course[];
    isLoading?: boolean;
}

export function ComboModal({
    open,
    onOpenChange,
    onSubmit,
    editCombo,
    courses,
    isLoading = false,
}: ComboModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            if (editCombo) {
                setName(editCombo.name);
                setDescription(editCombo.description || "");
                setSelectedCourseIds(editCombo.courses.map((c) => c.id));
            } else {
                setName("");
                setDescription("");
                setSelectedCourseIds([]);
            }
        }
    }, [open, editCombo]);

    function toggleCourse(courseId: number) {
        setSelectedCourseIds((prev) =>
            prev.includes(courseId)
                ? prev.filter((id) => id !== courseId)
                : [...prev, courseId]
        );
    }

    function handleSelectAll() {
        if (selectedCourseIds.length === courses.length) {
            setSelectedCourseIds([]);
        } else {
            setSelectedCourseIds(courses.map((c) => c.id));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || selectedCourseIds.length === 0) return;

        setSubmitting(true);
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                course_ids: selectedCourseIds,
            });
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <i className="ri-stack-line text-primary" />
                        {editCombo ? "Editar Combo de Cursos" : "Criar Novo Combo de Cursos"}
                    </DialogTitle>
                    <DialogDescription>
                        Agrupe múltiplos cursos sob uma única oferta. Ao receber o webhook, todos os cursos selecionados serão liberados para o aluno de uma vez só.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
                    <div className="space-y-1.5">
                        <Label htmlFor="combo-name" className="text-sm font-medium">
                            Nome do Combo <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="combo-name"
                            placeholder="Ex: Tudo Vitalício, Combo Black Friday, Formação Completa"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="combo-desc" className="text-sm font-medium">
                            Descrição (Opcional)
                        </Label>
                        <Textarea
                            id="combo-desc"
                            placeholder="Breve descrição dos produtos inclusos neste pacote"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <ComboCoursePicker
                        courses={courses}
                        selectedCourseIds={selectedCourseIds}
                        onToggleCourse={toggleCourse}
                        onSelectAll={handleSelectAll}
                    />

                    <DialogFooter className="pt-3 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting || isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-brand"
                            disabled={submitting || isLoading || !name.trim() || selectedCourseIds.length === 0}
                        >
                            {submitting ? (
                                <>
                                    <i className="ri-loader-4-line animate-spin mr-1.5" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <i className="ri-check-line mr-1.5" />
                                    {editCombo ? "Salvar Alterações" : "Criar Combo"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
