import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Student, StudentCourse } from "@/types/student";

interface ManageCoursesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
    availableCourses: { id: number; name: string }[];
    onAddCourse: (studentId: number, courseId: number) => void;
    onRemoveCourse: (studentId: number, courseId: number) => void;
    isLoading?: boolean;
}

export function ManageCoursesModal({
    open,
    onOpenChange,
    student,
    availableCourses,
    onAddCourse,
    onRemoveCourse,
    isLoading,
}: ManageCoursesModalProps) {
    const [selectedCourseId, setSelectedCourseId] = useState<string>("");

    if (!student) return null;

    const enrolledIds = new Set(student.courses.map((c) => c.id));
    const unenrolledCourses = availableCourses.filter(
        (c) => !enrolledIds.has(c.id)
    );

    function handleAddCourse() {
        if (!selectedCourseId || !student) return;
        onAddCourse(student.id, Number(selectedCourseId));
        setSelectedCourseId("");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-book-open-line text-primary" />
                        Gerenciar Cursos
                    </DialogTitle>
                </DialogHeader>

                {/* Student info */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {student.email}
                        </p>
                    </div>
                </div>

                {/* Current courses */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Cursos matriculados</p>
                    {student.courses.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic py-2">
                            Nenhum curso matriculado.
                        </p>
                    ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                            {student.courses.map((course) => (
                                <CourseRow
                                    key={course.id}
                                    course={course}
                                    onRemove={() =>
                                        onRemoveCourse(student.id, course.id)
                                    }
                                    isLoading={isLoading}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Add course */}
                {unenrolledCourses.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <p className="text-sm font-medium">
                            Adicionar ao curso
                        </p>
                        <div className="flex gap-2">
                            <Select
                                value={selectedCourseId}
                                onValueChange={setSelectedCourseId}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Selecione um curso" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {unenrolledCourses.map((course) => (
                                        <SelectItem
                                            key={course.id}
                                            value={course.id.toString()}
                                            className="rounded-lg"
                                        >
                                            {course.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleAddCourse}
                                className="btn-brand"
                                disabled={!selectedCourseId || isLoading}
                            >
                                <i className="ri-add-line" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Close */}
                <div className="flex justify-end pt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* ---- Course row inside modal ---- */

function CourseRow({
    course,
    onRemove,
    isLoading,
}: {
    course: StudentCourse;
    onRemove: () => void;
    isLoading?: boolean;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2 group/course hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2">
                <i className="ri-book-open-line text-sm text-primary/60" />
                <span className="text-sm">{course.name}</span>
            </div>
            <button
                onClick={onRemove}
                disabled={isLoading}
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover/course:opacity-100"
                title="Remover do curso"
            >
                <i className="ri-close-line text-sm" />
            </button>
        </div>
    );
}
