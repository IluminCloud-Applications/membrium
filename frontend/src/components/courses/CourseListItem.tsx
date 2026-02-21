import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "./ActionButton";
import type { Course } from "@/types/course";
import { categoryLabels, categoryColors } from "@/types/course";

interface CourseListItemProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    onWebhook: (course: Course) => void;
}

export function CourseListItem({ course, onEdit, onDelete, onWebhook }: CourseListItemProps) {
    const navigate = useNavigate();

    function handleNavigate() {
        navigate(`/admin/course/${course.id}/modification`);
    }

    return (
        <div
            className="group flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={handleNavigate}
        >
            {/* Thumbnail */}
            <div className="h-16 w-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                {course.image ? (
                    <img
                        src={course.image}
                        alt={course.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-xl text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{course.name}</h3>
                    <Badge
                        className={`text-[10px] ${categoryColors[course.category]}`}
                        variant="secondary"
                    >
                        {categoryLabels[course.category]}
                    </Badge>
                    {!course.isPublished && (
                        <Badge className="text-[10px] bg-muted text-muted-foreground" variant="secondary">
                            Rascunho
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-md">
                    {course.description}
                </p>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground flex-shrink-0">
                <span className="flex items-center gap-1">
                    <i className="ri-group-line" />
                    {course.studentsCount}
                </span>
                <span className="flex items-center gap-1">
                    <i className="ri-play-circle-line" />
                    {course.lessonsCount}
                </span>
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <ActionButton icon="ri-settings-3-line" label="Personalizar" onClick={handleNavigate} />
                <ActionButton icon="ri-webhook-line" label="Webhook" onClick={() => onWebhook(course)} />
                <ActionButton icon="ri-pencil-line" label="Editar" onClick={() => onEdit(course)} />
                <ActionButton icon="ri-delete-bin-line" label="Excluir" onClick={() => onDelete(course)} variant="danger" />
            </div>
        </div>
    );
}
