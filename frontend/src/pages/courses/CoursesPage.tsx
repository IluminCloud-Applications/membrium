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
import { GroupModal } from "@/components/modals/courses/GroupModal";
import { ImportCourseModal } from "@/components/modals/courses/ImportCourseModal";
import type { ViewMode, SortOption } from "@/components/courses";
import type { Course, CourseCategory, CourseGroup } from "@/types/course";
import { coursesService } from "@/services/courses";
import { useCourses } from "./useCourses";
import { GroupsView } from "./GroupsView";

export function CoursesPage() {
    const { courses, groups, loading, refetch } = useCourses();
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<CourseCategory | "all">("all");
    const [sortBy, setSortBy] = useState<SortOption>("newest");
    const [viewMode, setViewModeState] = useState<ViewMode>(
        () => (localStorage.getItem("courses-view-mode") as ViewMode) || "grid"
    );
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

    // Modals
    const [courseModalOpen, setCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
    const [webhookTarget, setWebhookTarget] = useState<Course | null>(null);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CourseGroup | null>(null);
    const [deleteGroupTarget, setDeleteGroupTarget] = useState<CourseGroup | null>(null);
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
        if (activeGroupId !== null) {
            const group = groups.find((g) => g.id === activeGroupId);
            if (group) result = result.filter((c) => group.courseIds.includes(c.id));
        }
        switch (sortBy) {
            case "newest": result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
            case "oldest": result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
            case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
            case "students": result.sort((a, b) => b.studentsCount - a.studentsCount); break;
        }
        return result;
    }, [courses, groups, search, activeCategory, sortBy, activeGroupId]);

    const filteredGroups = useMemo(() => {
        if (activeGroupId !== null) return groups.filter((g) => g.id === activeGroupId);
        return groups;
    }, [groups, activeGroupId]);

    const hasActiveFilters = search.trim() !== "" || activeCategory !== "all" || activeGroupId !== null;

    // Handlers
    function handleCreateOpen() { setEditingCourse(null); setCourseModalOpen(true); }
    function handleEdit(course: Course) { setEditingCourse(course); setCourseModalOpen(true); }
    function handleDelete(course: Course) { setDeleteTarget(course); }
    function handleWebhook(course: Course) { setWebhookTarget(course); }
    function handleCreateGroup() { setEditingGroup(null); setGroupModalOpen(true); }
    function handleEditGroup(group: CourseGroup) { setEditingGroup(group); setGroupModalOpen(true); }
    function handleDeleteGroup(group: CourseGroup) { setDeleteGroupTarget(group); }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try { await coursesService.delete(deleteTarget.id); await refetch(); }
        catch (err) { console.error("Erro ao deletar curso:", err); }
        setDeleteTarget(null);
    }

    async function handleConfirmDeleteGroup() {
        if (!deleteGroupTarget) return;
        try { await coursesService.deleteGroup(deleteGroupTarget.id); await refetch(); }
        catch (err) { console.error("Erro ao deletar grupo:", err); }
        setDeleteGroupTarget(null);
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
        } catch (err) { console.error("Erro ao salvar curso:", err); }
        setCourseModalOpen(false);
        setEditingCourse(null);
    }

    async function handleGroupSubmit(data: import("@/components/modals/courses/GroupModal").GroupFormData) {
        const payload = { name: data.name, principal_course_id: data.principalCourseId, course_ids: data.courseIds };
        try {
            if (editingGroup) await coursesService.updateGroup(editingGroup.id, payload);
            else await coursesService.createGroup(payload);
            await refetch();
        } catch (err) { console.error("Erro ao salvar grupo:", err); }
        setGroupModalOpen(false);
        setEditingGroup(null);
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
                onCreateCourse={handleCreateOpen} onCreateGroup={handleCreateGroup}
                onImportCourse={() => setImportModalOpen(true)}
                groups={groups} activeGroupId={activeGroupId} onGroupChange={setActiveGroupId}
            />

            {viewMode === "groups" ? (
                <GroupsView
                    groups={filteredGroups} courses={courses}
                    onEditGroup={handleEditGroup} onDeleteGroup={handleDeleteGroup}
                    onEditCourse={handleEdit} onWebhook={handleWebhook}
                    onCreateGroup={handleCreateGroup} onRefetch={refetch}
                />
            ) : filteredCourses.length === 0 ? (
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

            <CourseModal open={courseModalOpen} onOpenChange={setCourseModalOpen} editCourse={editingCourse} onSubmit={handleCourseSubmit} />
            <DeleteConfirmModal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete}
                title="Excluir Curso" description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todos os alunos e aulas serão removidos permanentemente.`} confirmLabel="Excluir Curso" />
            <DeleteConfirmModal open={!!deleteGroupTarget} onOpenChange={() => setDeleteGroupTarget(null)} onConfirm={handleConfirmDeleteGroup}
                title="Excluir Grupo" description={`Tem certeza que deseja excluir o grupo "${deleteGroupTarget?.name}"? Os cursos não serão removidos, apenas o agrupamento.`} confirmLabel="Excluir Grupo" />
            <WebhookModal open={!!webhookTarget} onOpenChange={() => setWebhookTarget(null)} course={webhookTarget} />
            <GroupModal open={groupModalOpen} onOpenChange={setGroupModalOpen} editGroup={editingGroup} courses={courses} onSubmit={handleGroupSubmit} />
            <ImportCourseModal open={importModalOpen} onOpenChange={setImportModalOpen} onSuccess={refetch} />
        </div>
    );
}
