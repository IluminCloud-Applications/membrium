import { CourseGroupCard } from "@/components/courses";
import type { Course, CourseGroup } from "@/types/course";

interface GroupsViewProps {
    groups: CourseGroup[];
    courses: Course[];
    onEditGroup: (g: CourseGroup) => void;
    onDeleteGroup: (g: CourseGroup) => void;
    onEditCourse: (c: Course) => void;
    onWebhook: (c: Course) => void;
    onCreateGroup: () => void;
    onRefetch: () => void;
}

export function GroupsView({
    groups,
    courses,
    onEditGroup,
    onDeleteGroup,
    onEditCourse,
    onWebhook,
    onCreateGroup,
    onRefetch,
}: GroupsViewProps) {
    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <i className="ri-stack-line text-5xl mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Nenhum grupo criado</h3>
                <p className="text-sm mb-4">Agrupe seus cursos para organizar suas ofertas.</p>
                <button
                    onClick={onCreateGroup}
                    className="btn-brand inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                >
                    <i className="ri-add-line" />
                    Criar Primeiro Grupo
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {groups.map((group) => (
                <CourseGroupCard
                    key={group.id}
                    group={group}
                    courses={courses}
                    onEditGroup={onEditGroup}
                    onDeleteGroup={onDeleteGroup}
                    onEditCourse={onEditCourse}
                    onWebhook={onWebhook}
                    onRefetch={onRefetch}
                />
            ))}
        </div>
    );
}
