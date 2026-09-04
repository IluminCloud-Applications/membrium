import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types/course";
import { categoryLabels, categoryColors } from "@/types/course";

interface ComboCoursePickerProps {
    courses: Course[];
    selectedCourseIds: number[];
    onToggleCourse: (courseId: number) => void;
    onSelectAll: () => void;
}

export function ComboCoursePicker({
    courses,
    selectedCourseIds,
    onToggleCourse,
    onSelectAll,
}: ComboCoursePickerProps) {
    const allSelected = courses.length > 0 && courses.every((c) => selectedCourseIds.includes(c.id));

    return (
        <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                    Cursos inclusos ({selectedCourseIds.length}/{courses.length})
                    <span className="text-destructive">*</span>
                </Label>
                {courses.length > 0 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectAll();
                        }}
                        className="text-xs text-primary hover:underline font-medium cursor-pointer"
                    >
                        {allSelected ? "Desmarcar todos" : "Selecionar todos"}
                    </button>
                )}
            </div>

            <div className="border rounded-lg max-h-56 overflow-y-auto divide-y bg-card">
                {courses.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                        Nenhum curso disponível para vincular.
                    </div>
                ) : (
                    courses.map((course) => {
                        const isChecked = selectedCourseIds.includes(course.id);
                        return (
                            <div
                                key={course.id}
                                role="checkbox"
                                aria-checked={isChecked}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === " " || e.key === "Enter") {
                                        e.preventDefault();
                                        onToggleCourse(course.id);
                                    }
                                }}
                                onClick={() => onToggleCourse(course.id)}
                                className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-accent/50 transition-colors select-none ${
                                    isChecked ? "bg-primary/5" : ""
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Checkbox
                                        checked={isChecked}
                                        tabIndex={-1}
                                        className="pointer-events-none"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{course.name}</p>
                                    </div>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={`text-[10px] shrink-0 font-normal ${
                                        categoryColors[course.category] || ""
                                    }`}
                                >
                                    {categoryLabels[course.category] || course.category}
                                </Badge>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
