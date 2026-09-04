import { useState, useEffect } from "react";
import { CourseModal } from "@/components/modals/courses/CreateCourseModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import { WebhookModal, type WebhookTarget } from "@/components/modals/courses/WebhookModal";
import { ImportCourseModal } from "@/components/modals/courses/ImportCourseModal";
import { ReorderCoursesModal } from "@/components/modals/courses/ReorderCoursesModal";
import type { ViewMode, SortOption } from "@/components/courses";
import type { Course, CourseCategory } from "@/types/course";
import { coursesService } from "@/services/courses";
import { useCourses } from "./useCourses";
import { useCombos } from "./useCombos";
import { CoursesSection } from "./CoursesSection";
import { CombosSection } from "./CombosSection";
import { toast } from "sonner";

export function CoursesPage() {
    const { courses, loading, refetch } = useCourses();
    const { combos, loading: combosLoading, refetch: refetchCombos } = useCombos();
    const [mainTab, setMainTab] = useState<"courses" | "combos">("courses");
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
    const [webhookTarget, setWebhookTarget] = useState<WebhookTarget | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [reorderModalOpen, setReorderModalOpen] = useState(false);

    // Auto-select custom sorting if at least one course has custom order
    useEffect(() => {
        if (courses.length > 0 && courses.some((c) => (c.order ?? 0) > 0)) {
            setSortBy("custom");
        }
    }, [courses]);

    function setViewMode(mode: ViewMode) {
        setViewModeState(mode);
        localStorage.setItem("courses-view-mode", mode);
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            await coursesService.delete(deleteTarget.id);
            await refetch();
        } catch (err) {
            console.error("Erro ao deletar curso:", err);
        }
        setDeleteTarget(null);
    }

    async function handleCourseSubmit(data: import("@/components/modals/courses/CreateCourseModal").CourseFormData) {
        const formData = new FormData();
        formData.append("name", data.name);
        if (data.description) formData.append("description", data.description);
        formData.append("checkout_url", data.checkoutUrl);
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
            {/* Header com título e seletor Cursos / Combos */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <i className="ri-book-open-line text-primary" />
                        Cursos & Combos
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Gerencie cursos individuais ou crie combos de ofertas para liberar múltiplos cursos de uma só vez
                    </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-fit shrink-0">
                    <button
                        onClick={() => setMainTab("courses")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            mainTab === "courses"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <i className="ri-book-open-line" />
                        Cursos ({courses.length})
                    </button>
                    <button
                        onClick={() => setMainTab("combos")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            mainTab === "combos"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <i className="ri-stack-line" />
                        Combos ({combos.length})
                    </button>
                </div>
            </div>

            {/* Alternância de Abas */}
            {mainTab === "courses" ? (
                <CoursesSection
                    courses={courses}
                    search={search}
                    onSearchChange={setSearch}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onCreateCourse={() => { setEditingCourse(null); setCourseModalOpen(true); }}
                    onImportCourse={() => setImportModalOpen(true)}
                    onReorderCourses={() => setReorderModalOpen(true)}
                    onEdit={(course) => { setEditingCourse(course); setCourseModalOpen(true); }}
                    onDelete={(course) => setDeleteTarget(course)}
                    onWebhook={(course) => setWebhookTarget(course)}
                />
            ) : (
                <CombosSection
                    courses={courses}
                    combos={combos}
                    loading={combosLoading}
                    refetch={refetchCombos}
                    onOpenWebhook={(combo) => setWebhookTarget(combo)}
                />
            )}

            <CourseModal
                open={courseModalOpen}
                onOpenChange={setCourseModalOpen}
                editCourse={editingCourse}
                onSubmit={handleCourseSubmit}
                hasPrincipal={courses.some((c) => c.category === "principal")}
            />
            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Curso"
                description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todos os alunos e aulas serão removidos permanentemente.`}
                confirmLabel="Excluir Curso"
            />
            <WebhookModal
                open={!!webhookTarget}
                onOpenChange={() => setWebhookTarget(null)}
                course={webhookTarget}
            />
            <ImportCourseModal open={importModalOpen} onOpenChange={setImportModalOpen} onSuccess={refetch} />
            <ReorderCoursesModal open={reorderModalOpen} onOpenChange={setReorderModalOpen} courses={courses} onSuccess={refetch} />
        </div>
    );
}
