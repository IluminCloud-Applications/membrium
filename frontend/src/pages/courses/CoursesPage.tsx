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
import { ImportCourseModal } from "@/components/modals/courses/ImportCourseModal";
import type { ViewMode, SortOption } from "@/components/courses";
import type { Course, CourseCategory } from "@/types/course";
import { coursesService } from "@/services/courses";
import { useCourses } from "./useCourses";
import { toast } from "sonner";

export function CoursesPage() {
    const { courses, loading, refetch } = useCourses();
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<CourseCategory | "all">("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [viewMode, setViewModeState] = useState<ViewMode>(
        () => (localStorage.getItem("courses-view-mode") as ViewMode) || "grid"
    );

    // Modals
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
    const [webhookTarget, setWebhookTarget] = useState<Course | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);

    function setViewMode(mode: ViewMode) {
        setViewModeState(mode);
        localStorage.setItem("courses-view-mode", mode);
    }

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
            case "newest": result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
            case "oldest": result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
            case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
            case "students": result.sort((a, b) => b.studentsCount - a.studentsCount); break;
        }
        return result;
    }, [courses, search, activeCategory, sortBy]);

    const hasActiveFilters = search.trim() !== "" || activeCategory !== "all";

    // Handlers
    function handleCreateOpen() { setEditingCourse(null); setCourseModalOpen(true); }
    function handleEdit(course: Course) { setEditingCourse(course); setCourseModalOpen(true); }
    function handleDelete(course: Course) { setDeleteTarget(course); }
    function handleWebhook(course: Course) { setWebhookTarget(course); }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try { await coursesService.delete(deleteTarget.id); await refetch(); }
        catch (err) { console.error("Erro ao deletar curso:", err); }
        setDeleteTarget(null);
    }

    async function handleCourseSubmit(data: import("@/components/modals/courses/CreateCourseModal").CourseFormData) {
        const formData = new FormData();
        formData.append("name", data.name);
        if (data.description) formData.append("description", data.description);
        formData.append("category", data.category);
        if (data.image) formData.append("image", data.image);
        if (data.imageRemoved) formData.append("image_removed", "true");
        try {
            if (editingCourse) await coursesService.update(editingCourse.id, formData);
            else await coursesService.create(formData);
            await refetch();
            setCourseModalOpen(false);
            setEditingCourse(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro ao salvar curso";
            toast.error(message);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <i className="ri-loader-4-line animate-spin text-2xl text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-book-open-line text-primary" />
                    Cursos
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie todos os cursos da sua plataforma
                </p>
            </div>

            <CourseFilters
                search={search} onSearchChange={setSearch}
                activeCategory={activeCategory} onCategoryChange={setActiveCategory}
                sortBy={sortBy} onSortChange={setSortBy}
                viewMode={viewMode} onViewModeChange={setViewMode}
                onCreateCourse={handleCreateOpen}
                onImportCourse={() => setImportModalOpen(true)}
            />

            {filteredCourses.length === 0 ? (
                <CourseEmptyState hasFilters={hasActiveFilters} onCreateCourse={handleCreateOpen} />
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCourses.map((c) => (
                        <CourseCard key={c.id} course={c} onEdit={handleEdit} onDelete={handleDelete} onWebhook={handleWebhook} />
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredCourses.map((c) => (
                        <CourseListItem key={c.id} course={c} onEdit={handleEdit} onDelete={handleDelete} onWebhook={handleWebhook} />
                    ))}
                </div>
            )}

            <CourseModal
                open={courseModalOpen}
                onOpenChange={setCourseModalOpen}
                editCourse={editingCourse}
                onSubmit={handleCourseSubmit}
                hasPrincipal={courses.some((c) => c.category === "principal")}
            />
            <DeleteConfirmModal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete}
                title="Excluir Curso" description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todos os alunos e aulas serão removidos permanentemente.`} confirmLabel="Excluir Curso" />
            <WebhookModal open={!!webhookTarget} onOpenChange={() => setWebhookTarget(null)} course={webhookTarget} />
            <ImportCourseModal open={importModalOpen} onOpenChange={setImportModalOpen} onSuccess={refetch} />
        </div>
    );
}
