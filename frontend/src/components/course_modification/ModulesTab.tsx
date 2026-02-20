import { Button } from "@/components/ui/button";
import { ModuleCard } from "./ModuleCard";
import type { CourseModule } from "@/types/course-modification";

interface ModulesTabProps {
    modules: CourseModule[];
    onAddModule: () => void;
    onEditModule: (mod: CourseModule) => void;
    onDeleteModule: (mod: CourseModule) => void;
    onAddLesson: (moduleId: number) => void;
    onEditLesson: (moduleId: number, lessonId: number) => void;
    onDeleteLesson: (moduleId: number, lessonId: number) => void;
}

export function ModulesTab({
    modules,
    onAddModule,
    onEditModule,
    onDeleteModule,
    onAddLesson,
    onEditLesson,
    onDeleteLesson,
}: ModulesTabProps) {
    if (modules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-16 w-16 rounded-2xl bg-primary/8 flex items-center justify-center mb-4">
                    <i className="ri-folder-3-line text-primary text-3xl" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Nenhum módulo criado</h3>
                <p className="text-sm mb-4 text-center max-w-sm">
                    Comece criando o primeiro módulo para organizar as aulas do seu curso.
                </p>
                <Button onClick={onAddModule} className="btn-brand gap-2 rounded-lg">
                    <i className="ri-add-line" />
                    Criar Primeiro Módulo
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add module button */}
            <div className="flex justify-end">
                <Button onClick={onAddModule} className="btn-brand gap-2 rounded-lg">
                    <i className="ri-folder-add-line" />
                    Adicionar Módulo
                </Button>
            </div>

            {/* Module list */}
            <div className="space-y-4">
                {modules.map((mod, index) => (
                    <ModuleCard
                        key={mod.id}
                        module={mod}
                        index={index}
                        onEdit={() => onEditModule(mod)}
                        onDelete={() => onDeleteModule(mod)}
                        onAddLesson={() => onAddLesson(mod.id)}
                        onEditLesson={(lessonId) => onEditLesson(mod.id, lessonId)}
                        onDeleteLesson={(lessonId) => onDeleteLesson(mod.id, lessonId)}
                    />
                ))}
            </div>
        </div>
    );
}
