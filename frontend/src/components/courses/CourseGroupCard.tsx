import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "./ActionButton";
import type { Course, CourseGroup } from "@/types/course";
import { categoryLabels, categoryColors } from "@/types/course";
import { coursesService } from "@/services/courses";

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
    const groupCourses = group.courseIds
        .map((id) => courses.find((c) => c.id === id))
        .filter(Boolean) as Course[];

    const principal = groupCourses.find((c) => c.id === group.principalCourseId);
    const allOrdered = principal
        ? [principal, ...groupCourses.filter((c) => c.id !== group.principalCourseId)]
        : groupCourses;

    const [orderedCourses, setOrderedCourses] = useState(allOrdered);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const dragOverIndex = useRef<number | null>(null);

    const totalStudents = groupCourses.reduce((sum, c) => sum + c.studentsCount, 0);
    const totalLessons = groupCourses.reduce((sum, c) => sum + c.lessonsCount, 0);

    function goToCourse(id: number) {
        navigate(`/admin/course/${id}/modification`);
    }

    function handleDragStart(index: number) {
        setDragIndex(index);
    }

    function handleDragEnter(index: number) {
        dragOverIndex.current = index;
    }

    async function handleDragEnd() {
        if (dragIndex === null || dragOverIndex.current === null || dragIndex === dragOverIndex.current) {
            setDragIndex(null);
            return;
        }

        const newOrder = [...orderedCourses];
        const [removed] = newOrder.splice(dragIndex, 1);
        newOrder.splice(dragOverIndex.current, 0, removed);
        setOrderedCourses(newOrder);
        setDragIndex(null);
        dragOverIndex.current = null;

        // Save to backend
        try {
            await coursesService.reorderGroup(group.id, newOrder.map((c) => c.id));
        } catch (err) {
            console.error("Erro ao reordenar:", err);
        }
    }

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {/* Group header */}
            <GroupHeaderBar
                group={group}
                coursesCount={groupCourses.length}
                totalStudents={totalStudents}
                totalLessons={totalLessons}
                onEdit={() => onEditGroup(group)}
                onDelete={() => onDeleteGroup(group)}
            />

            <div className="p-4 space-y-1.5">
                {orderedCourses.map((course, index) => {
                    const isPrincipal = course.id === group.principalCourseId;
                    return (
                        <CourseRowItem
                            key={course.id}
                            course={course}
                            isPrincipal={isPrincipal}
                            index={index}
                            isDragging={dragIndex === index}
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onGoToCourse={goToCourse}
                            onWebhook={onWebhook}
                            onEditCourse={onEditCourse}
                        />
                    );
                })}
            </div>
        </div>
    );
}


/* ---- Sub-components ---- */

interface GroupHeaderBarProps {
    group: CourseGroup;
    coursesCount: number;
    totalStudents: number;
    totalLessons: number;
    onEdit: () => void;
    onDelete: () => void;
}

function GroupHeaderBar({ group, coursesCount, totalStudents, totalLessons, onEdit, onDelete }: GroupHeaderBarProps) {
    return (
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
                <i className="ri-stack-line text-primary" />
                <h3 className="font-semibold text-sm">{group.name}</h3>
                <span className="text-xs text-muted-foreground">
                    · {coursesCount} cursos
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
                    <ActionButton icon="ri-pencil-line" label="Editar" onClick={onEdit} />
                    <ActionButton icon="ri-delete-bin-line" label="Excluir" onClick={onDelete} variant="danger" />
                </div>
            </div>
        </div>
    );
}

interface CourseRowItemProps {
    course: Course;
    isPrincipal: boolean;
    index: number;
    isDragging: boolean;
    onDragStart: () => void;
    onDragEnter: () => void;
    onDragEnd: () => void;
    onGoToCourse: (id: number) => void;
    onWebhook: (course: Course) => void;
    onEditCourse: (course: Course) => void;
}

function CourseRowItem({
    course,
    isPrincipal,
    isDragging,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onGoToCourse,
    onWebhook,
    onEditCourse,
}: CourseRowItemProps) {
    const baseClass = isPrincipal
        ? "group/item flex items-center gap-4 p-3 rounded-lg bg-primary/5 border border-primary/15 cursor-grab"
        : "group/item flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors cursor-grab";

    return (
        <div
            className={`${baseClass} ${isDragging ? "opacity-40" : ""}`}
            draggable
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
        >
            {/* Drag handle */}
            <div className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab shrink-0">
                <i className="ri-draggable text-sm" />
            </div>

            {/* Thumbnail */}
            <div className={`${isPrincipal ? "h-14 w-24" : "h-8 w-14"} flex-shrink-0 rounded-lg overflow-hidden bg-muted`}>
                {course.image ? (
                    <img src={course.image} alt={course.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <i className={`ri-image-line ${isPrincipal ? "text-lg" : "text-xs"} text-muted-foreground`} />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                    {isPrincipal && <i className="ri-star-fill text-amber-500 text-xs" />}
                    <span className={`${isPrincipal ? "font-semibold" : ""} text-sm truncate`}>
                        {course.name}
                    </span>
                    <Badge
                        className={`text-[10px] ${isPrincipal ? "bg-primary/10 text-primary" : categoryColors[course.category]}`}
                        variant="secondary"
                    >
                        {isPrincipal ? "Principal" : categoryLabels[course.category]}
                    </Badge>
                </div>
                {isPrincipal && course.description && (
                    <p className="text-xs text-muted-foreground truncate">{course.description}</p>
                )}
            </div>

            {/* Stats (desktop) */}
            {!isPrincipal && (
                <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{course.studentsCount} alunos</span>
                    <span>{course.lessonsCount} aulas</span>
                </div>
            )}

            {/* Actions */}
            <div
                className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
            >
                <ActionButton icon="ri-settings-3-line" label="Personalizar" onClick={() => onGoToCourse(course.id)} />
                <ActionButton icon="ri-webhook-line" label="Webhook" onClick={() => onWebhook(course)} />
                <ActionButton icon="ri-pencil-line" label="Editar" onClick={() => onEditCourse(course)} />
            </div>
        </div>
    );
}
