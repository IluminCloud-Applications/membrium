import { useState, useRef } from "react";
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
    onReorderModules?: (orderedIds: number[]) => void;
    onReorderLessons?: (moduleId: number, orderedIds: number[]) => void;
    onBulkUpload?: (moduleId: number, platform: "youtube" | "cloudflare") => void;
    youtubeConnected?: boolean;
    cloudflareEnabled?: boolean;
}

export function ModulesTab({
    modules,
    onAddModule,
    onEditModule,
    onDeleteModule,
    onAddLesson,
    onEditLesson,
    onDeleteLesson,
    onReorderModules,
    onReorderLessons,
    onBulkUpload,
    youtubeConnected,
    cloudflareEnabled,
}: ModulesTabProps) {
    const [dragOverId, setDragOverId] = useState<number | null>(null);
    const dragItemRef = useRef<number | null>(null);

    function handleDragStart(moduleId: number) {
        dragItemRef.current = moduleId;
    }

    function handleDragOver(e: React.DragEvent, moduleId: number) {
        e.preventDefault();
        if (dragItemRef.current !== moduleId) {
            setDragOverId(moduleId);
        }
    }

    function handleDrop(targetModuleId: number) {
        const sourceId = dragItemRef.current;
        if (sourceId == null || sourceId === targetModuleId) {
            cleanup();
            return;
        }
        const ids = modules.map((m) => m.id);
        const fromIndex = ids.indexOf(sourceId);
        const toIndex = ids.indexOf(targetModuleId);
        if (fromIndex === -1 || toIndex === -1) { cleanup(); return; }

        const reordered = [...ids];
        reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, sourceId);
        onReorderModules?.(reordered);
        cleanup();
    }

    function cleanup() {
        dragItemRef.current = null;
        setDragOverId(null);
    }

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
            <div className="flex justify-end">
                <Button onClick={onAddModule} className="btn-brand gap-2 rounded-lg">
                    <i className="ri-folder-add-line" />
                    Adicionar Módulo
                </Button>
            </div>

            <div className="space-y-4">
                {modules.map((mod, index) => (
                    <div
                        key={mod.id}
                        draggable
                        onDragStart={() => handleDragStart(mod.id)}
                        onDragOver={(e) => handleDragOver(e, mod.id)}
                        onDrop={() => handleDrop(mod.id)}
                        onDragEnd={cleanup}
                        className={`transition-all duration-150 ${dragOverId === mod.id ? "border-2 border-primary/40 rounded-xl" : ""
                            }`}
                    >
                        <ModuleCard
                            module={mod}
                            index={index}
                            onEdit={() => onEditModule(mod)}
                            onDelete={() => onDeleteModule(mod)}
                            onAddLesson={() => onAddLesson(mod.id)}
                            onEditLesson={(lessonId) => onEditLesson(mod.id, lessonId)}
                            onDeleteLesson={(lessonId) => onDeleteLesson(mod.id, lessonId)}
                            onReorderLessons={onReorderLessons ? (ids) => onReorderLessons(mod.id, ids) : undefined}
                            onBulkUpload={onBulkUpload ? (platform) => onBulkUpload(mod.id, platform) : undefined}
                            youtubeConnected={youtubeConnected}
                            cloudflareEnabled={cloudflareEnabled}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
