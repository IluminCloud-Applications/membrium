import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CourseMultiSelectProps {
    selectedCourses: { id: number; name: string }[];
    unselectedCourses: { id: number; name: string }[];
    courseToAdd: string;
    onCourseToAddChange: (val: string) => void;
    onAdd: () => void;
    onRemove: (courseId: number) => void;
}

export function CourseMultiSelect({
    selectedCourses,
    unselectedCourses,
    courseToAdd,
    onCourseToAddChange,
    onAdd,
    onRemove,
}: CourseMultiSelectProps) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">Cursos (opcional)</Label>

            {selectedCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedCourses.map((course) => (
                        <Badge
                            key={course.id}
                            variant="secondary"
                            className="text-xs bg-primary/8 text-primary/80 pr-1 gap-1"
                        >
                            {course.name}
                            <button
                                type="button"
                                onClick={() => onRemove(course.id)}
                                className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
                            >
                                <i className="ri-close-line text-[10px]" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {unselectedCourses.length > 0 && (
                <div className="flex gap-2">
                    <Select value={courseToAdd} onValueChange={onCourseToAddChange}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione um curso" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {unselectedCourses.map((course) => (
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
                        type="button"
                        onClick={onAdd}
                        className="btn-brand shrink-0"
                        disabled={!courseToAdd}
                    >
                        <i className="ri-add-line" />
                    </Button>
                </div>
            )}

            {unselectedCourses.length === 0 && selectedCourses.length > 0 && (
                <p className="text-xs text-muted-foreground italic">
                    Todos os cursos foram adicionados.
                </p>
            )}
        </div>
    );
}
