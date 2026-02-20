import { useState, useMemo } from "react";
import {
    CourseFilters,
    CourseCard,
    CourseListItem,
    CourseEmptyState,
} from "@/components/courses";
import { CourseModal } from "@/components/modals/courses/CreateCourseModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import { WebhookModal } from "@/components/modals/courses/WebhookModal";
import type { ViewMode, SortOption } from "@/components/courses";
import type { Course, CourseCategory } from "@/types/course";
import { mockCourses } from "./mock-data";

export function CoursesPage() {
    const [courses] = useState<Course[]>(mockCourses);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<CourseCategory | "all">("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [viewMode, setViewModeState] = useState<ViewMode>(
        () => (localStorage.getItem("courses-view-mode") as ViewMode) || "grid"
    );

    function setViewMode(mode: ViewMode) {
        setViewModeState(mode);
        localStorage.setItem("courses-view-mode", mode);
    }

    // Modal states
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
    const [webhookTarget, setWebhookTarget] = useState<Course | null>(null);

    const filteredCourses = useMemo(() => {
        let result = [...courses];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.description.toLowerCase().includes(q)
            );
        }

        if (activeCategory !== "all") {
            result = result.filter((c) => c.category === activeCategory);
        }

        switch (sortBy) {
            case "newest":
                result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                break;
            case "oldest":
                result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
                break;
            case "name":
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "students":
                result.sort((a, b) => b.studentsCount - a.studentsCount);
                break;
        }

        return result;
    }, [courses, search, activeCategory, sortBy]);

    const hasActiveFilters = search.trim() !== "" || activeCategory !== "all";

    function handleCreateOpen() {
        setEditingCourse(null);
        setCourseModalOpen(true);
    }

    function handleEdit(course: Course) {
        setEditingCourse(course);
        setCourseModalOpen(true);
    }

    function handleDelete(course: Course) {
        setDeleteTarget(course);
    }

    function handleWebhook(course: Course) {
        setWebhookTarget(course);
    }

    function handleConfirmDelete() {
        console.log("Delete course:", deleteTarget?.id);
        // TODO: API call
        setDeleteTarget(null);
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-book-open-line text-primary" />
                    Cursos
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie todos os cursos da sua plataforma
                </p>
            </div>

            {/* Filters */}
            <CourseFilters
                search={search}
                onSearchChange={setSearch}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onCreateCourse={handleCreateOpen}
            />

            {/* Course list/grid */}
            {filteredCourses.length === 0 ? (
                <CourseEmptyState
                    hasFilters={hasActiveFilters}
                    onCreateCourse={handleCreateOpen}
                />
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onWebhook={handleWebhook}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredCourses.map((course) => (
                        <CourseListItem
                            key={course.id}
                            course={course}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onWebhook={handleWebhook}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit course modal */}
            <CourseModal
                open={courseModalOpen}
                onOpenChange={setCourseModalOpen}
                editCourse={editingCourse}
                onSubmit={(data) => {
                    console.log(editingCourse ? "Update course:" : "Create course:", data);
                    setCourseModalOpen(false);
                    setEditingCourse(null);
                }}
            />

            {/* Delete confirmation modal */}
            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Curso"
                description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todos os alunos e aulas serão removidos permanentemente.`}
                confirmLabel="Excluir Curso"
            />

            {/* Webhook modal */}
            <WebhookModal
                open={!!webhookTarget}
                onOpenChange={() => setWebhookTarget(null)}
                courseName={webhookTarget?.name ?? ""}
            />
        </div>
    );
}
