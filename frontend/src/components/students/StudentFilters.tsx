import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface StudentFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    courseFilter: string;
    onCourseFilterChange: (value: string) => void;
    availableCourses: { id: number; name: string }[];
    onAddStudent: () => void;
    onImport: () => void;
}

export function StudentFilters({
    search,
    onSearchChange,
    courseFilter,
    onCourseFilterChange,
    availableCourses,
    onAddStudent,
    onImport,
}: StudentFiltersProps) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <Input
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>

            {/* Course filter */}
            <Select value={courseFilter} onValueChange={onCourseFilterChange}>
                <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="rounded-lg">
                        Todos os cursos
                    </SelectItem>
                    {availableCourses.map((course) => (
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

            {/* Actions */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={onImport}
                    variant="outline"
                    className="h-9 text-sm"
                >
                    <i className="ri-upload-2-line mr-1" />
                    Importar
                </Button>

                <Button
                    onClick={onAddStudent}
                    className="btn-brand h-9 text-sm"
                >
                    <i className="ri-user-add-line mr-1" />
                    Adicionar Aluno
                </Button>
            </div>
        </div>
    );
}
