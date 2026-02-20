import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { TranscriptCourse } from "@/types/transcript";

interface TranscriptFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    courseFilter: string;
    onCourseFilterChange: (value: string) => void;
    availableCourses: TranscriptCourse[];
    onCreateTranscript: () => void;
}

export function TranscriptFilters({
    search,
    onSearchChange,
    courseFilter,
    onCourseFilterChange,
    availableCourses,
    onCreateTranscript,
}: TranscriptFiltersProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-1">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <Input
                    placeholder="Buscar transcrição..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>

            <div className="flex items-center gap-2">
                {/* Course filter */}
                <Select
                    value={courseFilter}
                    onValueChange={onCourseFilterChange}
                >
                    <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Filtrar curso" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="all" className="rounded-lg">
                            Todos os cursos
                        </SelectItem>
                        {availableCourses.map((c) => (
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

                <Button
                    onClick={onCreateTranscript}
                    className="btn-brand h-9 text-sm"
                >
                    <i className="ri-add-line mr-1" />
                    Nova Transcrição
                </Button>
            </div>
        </div>
    );
}
