import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type {
    TranscriptCourse,
    TranscriptModule,
    TranscriptLesson,
} from "@/types/transcript";

interface TranscriptFormLessonProps {
    courseId: string;
    moduleId: string;
    lessonId: string;
    courses: TranscriptCourse[];
    modules: TranscriptModule[];
    lessons: TranscriptLesson[];
    onCourseChange: (value: string) => void;
    onModuleChange: (value: string) => void;
    onLessonChange: (value: string) => void;
    selectedLessonName?: string;
}

/**
 * Step 1 — Compact lesson selector with cascade: Course → Module → Lesson.
 * When a lesson is selected, shows a success summary with option to change.
 */
export function TranscriptFormLesson({
    courseId,
    moduleId,
    lessonId,
    courses,
    modules,
    lessons,
    onCourseChange,
    onModuleChange,
    onLessonChange,
    selectedLessonName,
}: TranscriptFormLessonProps) {
    const filteredModules = modules.filter(
        (m) => m.courseId === Number(courseId)
    );
    const filteredLessons = lessons.filter(
        (l) => l.moduleId === Number(moduleId)
    );

    const isSelected = !!lessonId;

    return (
        <div
            className={`rounded-lg border p-4 transition-colors ${isSelected
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-muted/30"
                }`}
        >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                {isSelected ? (
                    <i className="ri-checkbox-circle-fill text-emerald-500" />
                ) : (
                    <i className="ri-play-circle-line text-primary" />
                )}
                {isSelected ? (
                    <span>
                        Aula selecionada:{" "}
                        <span className="text-emerald-600">
                            {selectedLessonName}
                        </span>
                    </span>
                ) : (
                    "Selecionar Aula"
                )}
            </h3>

            <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[150px] space-y-1.5">
                    <Label className="text-xs">Curso</Label>
                    <Select value={courseId} onValueChange={onCourseChange}>
                        <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {courses.map((c) => (
                                <SelectItem
                                    key={c.id}
                                    value={c.id.toString()}
                                    className="rounded-lg"
                                >
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 min-w-[150px] space-y-1.5">
                    <Label className="text-xs">Módulo</Label>
                    <Select
                        value={moduleId}
                        onValueChange={onModuleChange}
                        disabled={!courseId}
                    >
                        <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {filteredModules.map((m) => (
                                <SelectItem
                                    key={m.id}
                                    value={m.id.toString()}
                                    className="rounded-lg"
                                >
                                    {m.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 min-w-[150px] space-y-1.5">
                    <Label className="text-xs">Aula</Label>
                    <Select
                        value={lessonId}
                        onValueChange={onLessonChange}
                        disabled={!moduleId}
                    >
                        <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {filteredLessons.map((l) => (
                                <SelectItem
                                    key={l.id}
                                    value={l.id.toString()}
                                    className="rounded-lg"
                                >
                                    {l.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
