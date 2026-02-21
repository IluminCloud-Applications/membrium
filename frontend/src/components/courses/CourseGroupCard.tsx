import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "./ActionButton";
import type { Course, CourseGroup } from "@/types/course";
import { categoryLabels, categoryColors } from "@/types/course";

interface CourseGroupCardProps {
    group: CourseGroup;
    courses: Course[];
    onEditGroup: (group: CourseGroup) => void;
    onDeleteGroup: (group: CourseGroup) => void;
    onEditCourse: (course: Course) => void;
    onWebhook: (course: Course) => void;
}

export function CourseGroupCard({
    group,
    courses,
    onEditGroup,
    onDeleteGroup,
    onEditCourse,
    onWebhook,
}: CourseGroupCardProps) {
    const navigate = useNavigate();
    const groupCourses = courses.filter((c) => group.courseIds.includes(c.id));
    const principal = groupCourses.find((c) => c.id === group.principalCourseId);
    const secondary = groupCourses.filter((c) => c.id !== group.principalCourseId);

    const totalStudents = groupCourses.reduce((sum, c) => sum + c.studentsCount, 0);
    const totalLessons = groupCourses.reduce((sum, c) => sum + c.lessonsCount, 0);

    function goToCourse(id: number) {
        navigate(`/admin/course/${id}/modification`);
    }

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* Group header */}
            <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                    <i className="ri-stack-line text-primary" />
                    <h3 className="font-semibold text-sm">{group.name}</h3>
                    <span className="text-xs text-muted-foreground">
                        · {groupCourses.length} cursos
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <i className="ri-group-line" />
                        {totalStudents}
                    </span>
                    <span className="flex items-center gap-1">
                        <i className="ri-play-circle-line" />
                        {totalLessons}
                    </span>
                    <div className="flex gap-1 ml-2">
                        <ActionButton icon="ri-pencil-line" label="Editar" onClick={() => onEditGroup(group)} />
                        <ActionButton icon="ri-delete-bin-line" label="Excluir" onClick={() => onDeleteGroup(group)} variant="danger" />
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Principal course — prominent */}
                {principal && (
                    <div
                        className="group/item flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/15 cursor-pointer"
                        onClick={() => goToCourse(principal.id)}
                    >
                        <div className="h-14 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                            {principal.image ? (
                                <img src={principal.image} alt={principal.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <i className="ri-image-line text-lg text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                                <i className="ri-star-fill text-amber-500 text-xs" />
                                <span className="font-semibold text-sm truncate">{principal.name}</span>
                                <Badge className="text-[10px] bg-primary/10 text-primary" variant="secondary">
                                    Principal
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{principal.description}</p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <ActionButton icon="ri-settings-3-line" label="Personalizar" onClick={() => goToCourse(principal.id)} />
                            <ActionButton icon="ri-webhook-line" label="Webhook" onClick={() => onWebhook(principal)} />
                            <ActionButton icon="ri-pencil-line" label="Editar" onClick={() => onEditCourse(principal)} />
                        </div>
                    </div>
                )}

                {/* Secondary courses */}
                {secondary.length > 0 && (
                    <div className="space-y-1.5">
                        {secondary.map((course) => (
                            <div
                                key={course.id}
                                className="group/item flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                onClick={() => goToCourse(course.id)}
                            >
                                <div className="h-8 w-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                                    {course.image ? (
                                        <img src={course.image} alt={course.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <i className="ri-image-line text-xs text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm truncate">{course.name}</span>
                                        <Badge
                                            className={`text-[10px] ${categoryColors[course.category]}`}
                                            variant="secondary"
                                        >
                                            {categoryLabels[course.category]}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{course.studentsCount} alunos</span>
                                    <span>{course.lessonsCount} aulas</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                    <ActionButton icon="ri-settings-3-line" label="Personalizar" onClick={() => goToCourse(course.id)} />
                                    <ActionButton icon="ri-webhook-line" label="Webhook" onClick={() => onWebhook(course)} />
                                    <ActionButton icon="ri-pencil-line" label="Editar" onClick={() => onEditCourse(course)} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
