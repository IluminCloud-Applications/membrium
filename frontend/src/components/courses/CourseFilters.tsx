import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CourseCategory } from "@/types/course";

export type ViewMode = "grid" | "list";
export type SortOption = "newest" | "oldest" | "name" | "students" | "custom";

interface CourseFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    activeCategory: CourseCategory | "all";
    onCategoryChange: (value: CourseCategory | "all") => void;
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
    viewMode: ViewMode;
    onViewModeChange: (value: ViewMode) => void;
    onCreateCourse: () => void;
    onImportCourse: () => void;
    onReorderCourses?: () => void;
}

const categories = [
    { value: "all", label: "Todos" },
    { value: "principal", label: "Principal" },
    { value: "order_bump", label: "Order Bump" },
    { value: "upsell", label: "Upsell" },
    { value: "bonus", label: "Bônus" },
];

export function CourseFilters({
    search,
    onSearchChange,
    activeCategory,
    onCategoryChange,
    sortBy,
    onSortChange,
    viewMode,
    onViewModeChange,
    onCreateCourse,
    onImportCourse,
    onReorderCourses,
}: CourseFiltersProps) {
    return (
        <div className="space-y-4">
            {/* Top row: wraps on mobile */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search — full width on mobile, flex-1 on desktop */}
                <div className="relative w-full sm:flex-1">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                    <Input
                        placeholder="Buscar curso..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {/* Actions — wrap on mobile */}
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    {/* Sort */}
                    <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
                        <SelectTrigger className="w-[170px] h-9 flex-shrink-0">
                            <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="custom" className="rounded-lg">Ordem personalizada</SelectItem>
                            <SelectItem value="newest" className="rounded-lg">Mais recentes</SelectItem>
                            <SelectItem value="oldest" className="rounded-lg">Mais antigos</SelectItem>
                            <SelectItem value="name" className="rounded-lg">Nome A-Z</SelectItem>
                            <SelectItem value="students" className="rounded-lg">Mais alunos</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* View toggle — desktop only */}
                    <div className="hidden sm:flex border rounded-lg overflow-hidden">
                        <button
                            onClick={() => onViewModeChange("grid")}
                            className={`h-9 w-9 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                            title="Grid"
                        >
                            <i className="ri-grid-fill text-sm" />
                        </button>
                        <button
                            onClick={() => onViewModeChange("list")}
                            className={`h-9 w-9 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                            title="Lista"
                        >
                            <i className="ri-list-check text-sm" />
                        </button>
                    </div>

                    {onReorderCourses && (
                        <Button onClick={onReorderCourses} variant="outline" className="h-9 text-sm flex-shrink-0">
                            <i className="ri-arrow-up-down-line mr-1" />
                            Reordenar
                        </Button>
                    )}

                    <Button onClick={onImportCourse} variant="outline" className="h-9 text-sm flex-shrink-0">
                        <i className="ri-upload-2-line mr-1" />
                        Importar
                    </Button>

                    <Button onClick={onCreateCourse} className="btn-brand h-9 text-sm flex-shrink-0">
                        <i className="ri-add-line mr-1" />
                        Novo Curso
                    </Button>
                </div>
            </div>

            {/* Category tabs — scrollable on mobile */}
            <Tabs
                value={activeCategory}
                onValueChange={(v) => onCategoryChange(v as CourseCategory | "all")}
            >
                <TabsList className="h-8 overflow-x-auto max-w-full">
                    {categories.map((cat) => (
                        <TabsTrigger key={cat.value} value={cat.value} className="text-xs px-3 h-7 whitespace-nowrap">
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    );
}
