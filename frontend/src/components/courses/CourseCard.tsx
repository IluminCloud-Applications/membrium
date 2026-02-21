import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "./ActionButton";
import type { Course } from "@/types/course";
import { categoryLabels, categoryColors } from "@/types/course";

interface CourseCardProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    onWebhook: (course: Course) => void;
}

export function CourseCard({ course, onEdit, onDelete, onWebhook }: CourseCardProps) {
    const navigate = useNavigate();

    function handleNavigate() {
        navigate(`/admin/course/${course.id}/modification`);
    }

    return (
        <div className="group relative rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
            {/* Image — clickable */}
            <div className="aspect-video relative overflow-hidden bg-muted cursor-pointer" onClick={handleNavigate}>
                {course.image ? (
                    <img
                        src={course.image}
                        alt={course.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <i className="ri-image-line text-3xl text-muted-foreground" />
                    </div>
                )}

                {/* Category badge */}
                <Badge
                    className={`absolute top-2 left-2 text-xs ${categoryColors[course.category]}`}
                    variant="secondary"
                >
                    {categoryLabels[course.category]}
                </Badge>

                {!course.isPublished && (
                    <Badge className="absolute top-2 right-2 text-xs bg-muted text-muted-foreground" variant="secondary">
                        Rascunho
                    </Badge>
                )}
            </div>

            {/* Info — clickable */}
            <div className="p-4 space-y-2 cursor-pointer" onClick={handleNavigate}>
                <h3 className="font-semibold text-sm truncate">{course.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {course.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                        <i className="ri-group-line" />
                        {course.studentsCount} alunos
                    </span>
                    <span className="flex items-center gap-1">
                        <i className="ri-play-circle-line" />
                        {course.lessonsCount} aulas
                    </span>
                </div>
            </div>

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 pointer-events-none">
                <div className="flex gap-1 pointer-events-auto">
                    <ActionButton icon="ri-settings-3-line" label="Personalizar" onClick={handleNavigate} />
                    <ActionButton icon="ri-webhook-line" label="Webhook" onClick={() => onWebhook(course)} />
                    <ActionButton icon="ri-pencil-line" label="Editar" onClick={() => onEdit(course)} />
                    <ActionButton icon="ri-delete-bin-line" label="Excluir" onClick={() => onDelete(course)} variant="danger" />
                </div>
            </div>
        </div>
    );
}
