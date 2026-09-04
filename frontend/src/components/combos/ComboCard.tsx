import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/courses/ActionButton";
import type { CourseCombo } from "@/types/combo";
import { categoryColors, categoryLabels } from "@/types/course";

interface ComboCardProps {
    combo: CourseCombo;
    onEdit: (combo: CourseCombo) => void;
    onDelete: (combo: CourseCombo) => void;
    onWebhook: (combo: CourseCombo) => void;
}

export function ComboCard({ combo, onEdit, onDelete, onWebhook }: ComboCardProps) {
    return (
        <div className="group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
            <div className="p-5 space-y-4">
                {/* Header do Card com Ícone e Badge */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <i className="ri-stack-line text-lg" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-base truncate" title={combo.name}>
                                {combo.name}
                            </h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <i className="ri-link text-xs" />
                                Webhook unificado
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs bg-primary/10 text-primary font-medium">
                        {combo.courses_count} {combo.courses_count === 1 ? "curso" : "cursos"}
                    </Badge>
                </div>

                {/* Descrição opcional */}
                {combo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {combo.description}
                    </p>
                )}

                {/* Lista de cursos inclusos */}
                <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Cursos inclusos nesta oferta:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {combo.courses.map((course) => (
                            <Badge
                                key={course.id}
                                variant="outline"
                                className="text-xs py-0.5 px-2 bg-muted/50 flex items-center gap-1.5 font-normal"
                            >
                                <span className="truncate max-w-[150px]">{course.name}</span>
                                {course.category && (
                                    <span
                                        className={`text-[9px] px-1 py-0.2 rounded font-medium ${categoryColors[course.category] || "bg-muted text-muted-foreground"}`}
                                    >
                                        {categoryLabels[course.category] || course.category}
                                    </span>
                                )}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Rodapé com botões de ação sempre acessíveis e com overlay no hover */}
            <div className="border-t px-4 py-3 bg-muted/20 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <i className="ri-checkbox-circle-line text-green-500" />
                    Cadastra em todos de 1x
                </span>

                <div className="flex gap-1">
                    <ActionButton
                        icon="ri-webhook-line"
                        label="Webhook"
                        onClick={() => onWebhook(combo)}
                        variant="default"
                    />
                    <ActionButton
                        icon="ri-pencil-line"
                        label="Editar"
                        onClick={() => onEdit(combo)}
                        variant="default"
                    />
                    <ActionButton
                        icon="ri-delete-bin-line"
                        label="Excluir"
                        onClick={() => onDelete(combo)}
                        variant="danger"
                    />
                </div>
            </div>
        </div>
    );
}
