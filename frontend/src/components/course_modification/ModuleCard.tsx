import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LessonItem } from "./LessonItem";
import type { CourseModule } from "@/types/course-modification";
import { useState } from "react";

interface ModuleCardProps {
    module: CourseModule;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    onAddLesson: () => void;
    onEditLesson: (lessonId: number) => void;
    onDeleteLesson: (lessonId: number) => void;
}

export function ModuleCard({
    module,
    index: _index,
    onEdit,
    onDelete,
    onAddLesson,
    onEditLesson,
    onDeleteLesson,
}: ModuleCardProps) {
    const [isOpen, setIsOpen] = useState(true);
    const lessonsCount = module.lessons.length;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                {/* Module header */}
                <div className="flex items-center gap-3 p-4 border-b bg-card">
                    {/* Drag handle */}
                    <div className="flex-shrink-0 cursor-move text-muted-foreground hover:text-foreground transition-colors">
                        <i className="ri-draggable text-lg" />
                    </div>

                    {/* Module image or fallback */}
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/8 flex items-center justify-center overflow-hidden">
                        {module.image ? (
                            <img src={module.image} alt={module.name} className="h-full w-full object-cover" />
                        ) : (
                            <i className="ri-folder-3-line text-primary text-lg" />
                        )}
                    </div>

                    {/* Module info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold truncate">{module.name}</h3>
                            {module.hasDelayedUnlock && module.unlockAfterDays && (
                                <Badge variant="secondary" className="text-[10px] font-medium bg-amber-500/10 text-amber-600 flex-shrink-0">
                                    <i className="ri-timer-line mr-1 text-[10px]" />
                                    {module.unlockAfterDays}d
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {lessonsCount} {lessonsCount === 1 ? "aula" : "aulas"}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onAddLesson}
                            className="h-8 gap-1.5 text-xs"
                        >
                            <i className="ri-add-line" />
                            Aula
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <i className="ri-more-2-fill text-lg" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <DropdownMenuItem onClick={onEdit} className="rounded-lg cursor-pointer">
                                    <i className="ri-pencil-line mr-2 text-base" />
                                    Editar Módulo
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onAddLesson} className="rounded-lg cursor-pointer">
                                    <i className="ri-add-line mr-2 text-base" />
                                    Adicionar Aula
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={onDelete}
                                    className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                                >
                                    <i className="ri-delete-bin-line mr-2 text-base" />
                                    Excluir Módulo
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <i className={`ri-arrow-${isOpen ? "up" : "down"}-s-line text-lg transition-transform`} />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>

                {/* Lessons list */}
                <CollapsibleContent>
                    <div className="p-3 space-y-2 bg-muted/30">
                        {lessonsCount === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <i className="ri-play-circle-line text-3xl mb-2" />
                                <p className="text-sm font-medium">Nenhuma aula neste módulo</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onAddLesson}
                                    className="mt-3 gap-1.5"
                                >
                                    <i className="ri-add-line" />
                                    Adicionar Primeira Aula
                                </Button>
                            </div>
                        ) : (
                            module.lessons.map((lesson, lessonIndex) => (
                                <LessonItem
                                    key={lesson.id}
                                    lesson={lesson}
                                    index={lessonIndex}
                                    onEdit={() => onEditLesson(lesson.id)}
                                    onDelete={() => onDeleteLesson(lesson.id)}
                                />
                            ))
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
