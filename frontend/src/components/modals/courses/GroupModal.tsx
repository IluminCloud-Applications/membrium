import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Course, CourseGroup } from "@/types/course";
import { categoryLabels, categoryColors } from "@/types/course";

interface GroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: GroupFormData) => void;
    courses: Course[];
    editGroup?: CourseGroup | null;
}

export interface GroupFormData {
    name: string;
    principalCourseId: number | null;
    courseIds: number[];
}

export function GroupModal({
    open,
    onOpenChange,
    onSubmit,
    courses,
    editGroup,
}: GroupModalProps) {
    const [name, setName] = useState("");
    const [principalId, setPrincipalId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const isEditing = !!editGroup;

    useEffect(() => {
        if (editGroup) {
            setName(editGroup.name);
            setPrincipalId(editGroup.principalCourseId);
            setSelectedIds(new Set(editGroup.courseIds));
        }
    }, [editGroup]);

    function toggleCourse(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                if (principalId === id) setPrincipalId(null);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    function handleSetPrincipal(id: number) {
        setPrincipalId(id);
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit({
            name,
            principalCourseId: principalId,
            courseIds: Array.from(selectedIds),
        });
    }

    function resetForm() {
        setName("");
        setPrincipalId(null);
        setSelectedIds(new Set());
    }

    const canSubmit = name.trim() && principalId && selectedIds.size >= 2;

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) resetForm();
                onOpenChange(value);
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-stack-line text-primary" />
                        {isEditing ? "Editar Grupo" : "Criar Grupo"}
                    </DialogTitle>
                    <DialogDescription>
                        Agrupe cursos para organizar sua oferta. Selecione o curso principal
                        e os cursos complementares.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Group name */}
                    <div className="space-y-2">
                        <Label htmlFor="group-name" className="text-sm font-medium">
                            Nome do Grupo
                        </Label>
                        <Input
                            id="group-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Pacote Marketing Digital"
                            required
                        />
                    </div>

                    {/* Course selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Selecione os Cursos
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Clique para selecionar. Marque ★ para definir o curso principal.
                        </p>

                        <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-1">
                            {courses.map((course) => {
                                const isSelected = selectedIds.has(course.id);
                                const isPrincipal = principalId === course.id;

                                return (
                                    <div
                                        key={course.id}
                                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all duration-150 ${isSelected
                                                ? "border-primary/40 bg-primary/5"
                                                : "border-transparent hover:bg-accent"
                                            }`}
                                        onClick={() => toggleCourse(course.id)}
                                    >
                                        {/* Checkbox visual */}
                                        <div
                                            className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground/30"
                                                }`}
                                        >
                                            {isSelected && <i className="ri-check-line text-[10px]" />}
                                        </div>

                                        {/* Course info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium truncate">
                                                    {course.name}
                                                </span>
                                                <Badge
                                                    className={`text-[10px] ${categoryColors[course.category]}`}
                                                    variant="secondary"
                                                >
                                                    {categoryLabels[course.category]}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Star / Principal toggle */}
                                        {isSelected && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSetPrincipal(course.id);
                                                }}
                                                className={`shrink-0 h-7 w-7 rounded-md flex items-center justify-center transition-colors ${isPrincipal
                                                        ? "text-amber-500 bg-amber-500/10"
                                                        : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                                    }`}
                                                title="Definir como principal"
                                            >
                                                <i className={isPrincipal ? "ri-star-fill" : "ri-star-line"} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedIds.size > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                            <i className="ri-information-line" />
                            {selectedIds.size} curso{selectedIds.size > 1 ? "s" : ""} selecionado{selectedIds.size > 1 ? "s" : ""}
                            {principalId ? " · Principal definido" : " · Defina o curso principal ★"}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-brand flex-1"
                            disabled={!canSubmit}
                        >
                            <i className="ri-check-line mr-1" />
                            {isEditing ? "Salvar Grupo" : "Criar Grupo"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
