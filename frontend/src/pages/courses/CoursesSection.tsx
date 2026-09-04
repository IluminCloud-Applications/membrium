import { useMemo } from "react";
import {
    CourseFilters,
    CourseCard,
    CourseListItem,
    CourseEmptyState,
} from "@/components/courses";
import type { ViewMode, SortOption } from "@/components/courses";
import type { Course, CourseCategory } from "@/types/course";

interface CoursesSectionProps {
    courses: Course[];
    search: string;
    onSearchChange: (val: string) => void;
    activeCategory: CourseCategory | "all";
    onCategoryChange: (val: CourseCategory | "all") => void;
    sortBy: SortOption;
    onSortChange: (val: SortOption) => void;
    viewMode: ViewMode;
    onViewModeChange: (val: ViewMode) => void;
    onCreateCourse: () => void;
    onImportCourse: () => void;
    onReorderCourses: () => void;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    onWebhook: (course: Course) => void;
}

export function CoursesSection({
    courses,
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
    onEdit,
    onDelete,
    onWebhook,
}: CoursesSectionProps) {
    const filteredCourses = useMemo(() => {
        let result = [...courses];
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
            );
        }
        if (activeCategory !== "all") {
            result = result.filter((c) => c.category === activeCategory);
        }
        switch (sortBy) {
            case "custom":
                result.sort((a, b) => {
                    const orderA = a.order ?? 0;
                    const orderB = b.order ?? 0;
                    if (orderA > 0 || orderB > 0) {
                        return (orderA || 999999) - (orderB || 999999);
                    }
                    return b.createdAt.localeCompare(a.createdAt);
                });
                break;
            case "newest": result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
            case "oldest": result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
            case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
            case "students": result.sort((a, b) => b.studentsCount - a.studentsCount); break;
        }
        return result;
    }, [courses, search, activeCategory, sortBy]);

    const hasActiveFilters = search.trim() !== "" || activeCategory !== "all";

    return (
        <div className="space-y-6">
            <CourseFilters
                search={search}
                onSearchChange={onSearchChange}
                activeCategory={activeCategory}
                onCategoryChange={onCategoryChange}
                sortBy={sortBy}
                onSortChange={onSortChange}
                viewMode={viewMode}
                onViewModeChange={onViewModeChange}
                onCreateCourse={onCreateCourse}
                onImportCourse={onImportCourse}
                onReorderCourses={onReorderCourses}
            />

            {filteredCourses.length === 0 ? (
                <CourseEmptyState hasFilters={hasActiveFilters} onCreateCourse={onCreateCourse} />
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((c) => (
                        <CourseCard
                            key={c.id}
                            course={c}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onWebhook={onWebhook}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredCourses.map((c) => (
                        <CourseListItem
                            key={c.id}
                            course={c}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onWebhook={onWebhook}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
