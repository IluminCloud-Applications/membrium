import { useState, useMemo } from "react";
import {
    CourseFilters,
    CourseCard,
    CourseListItem,
    CourseGroupCard,
    CourseEmptyState,
} from "@/components/courses";
import { CourseModal } from "@/components/modals/courses/CreateCourseModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import { WebhookModal } from "@/components/modals/courses/WebhookModal";
import { GroupModal } from "@/components/modals/courses/GroupModal";
import type { ViewMode, SortOption } from "@/components/courses";
import type { Course, CourseCategory, CourseGroup } from "@/types/course";
import { mockCourses, mockGroups } from "./mock-data";

export function CoursesPage() {
    const [courses] = useState<Course[]>(mockCourses);
    const [groups] = useState<CourseGroup[]>(mockGroups);
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

    function setViewMode(mode: ViewMode) {
        setViewModeState(mode);
        localStorage.setItem("courses-view-mode", mode);
    }

    const filteredCourses = useMemo(() => {
        let result = [...courses];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
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
    function handleConfirmDelete() { setDeleteTarget(null); }
    function handleCreateGroup() { setEditingGroup(null); setGroupModalOpen(true); }
    function handleEditGroup(group: CourseGroup) { setEditingGroup(group); setGroupModalOpen(true); }
    function handleDeleteGroup(group: CourseGroup) { setDeleteGroupTarget(group); }
    function handleConfirmDeleteGroup() { setDeleteGroupTarget(null); }

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
                onCreateGroup={handleCreateGroup}
                groups={groups}
                activeGroupId={activeGroupId}
                onGroupChange={setActiveGroupId}
            />

            {/* Content */}
            {viewMode === "groups" ? (
                <GroupsView
                    groups={filteredGroups}
                    courses={courses}
                    onEditGroup={handleEditGroup}
                    onDeleteGroup={handleDeleteGroup}
                    onEditCourse={handleEdit}
                    onWebhook={handleWebhook}
                    onCreateGroup={handleCreateGroup}
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

            {/* Modals */}
            <CourseModal
                open={courseModalOpen}
                onOpenChange={setCourseModalOpen}
                editCourse={editingCourse}
                onSubmit={(data) => { console.log(editingCourse ? "Update:" : "Create:", data); setCourseModalOpen(false); setEditingCourse(null); }}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Curso"
                description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Todos os alunos e aulas serão removidos permanentemente.`}
                confirmLabel="Excluir Curso"
            />

            <DeleteConfirmModal
                open={!!deleteGroupTarget}
                onOpenChange={() => setDeleteGroupTarget(null)}
                onConfirm={handleConfirmDeleteGroup}
                title="Excluir Grupo"
                description={`Tem certeza que deseja excluir o grupo "${deleteGroupTarget?.name}"? Os cursos não serão removidos, apenas o agrupamento.`}
                confirmLabel="Excluir Grupo"
            />

            <WebhookModal
                open={!!webhookTarget}
                onOpenChange={() => setWebhookTarget(null)}
                courseName={webhookTarget?.name ?? ""}
            />

            <GroupModal
                open={groupModalOpen}
                onOpenChange={setGroupModalOpen}
                editGroup={editingGroup}
                courses={courses}
                onSubmit={(data) => { console.log(editingGroup ? "Update group:" : "Create group:", data); setGroupModalOpen(false); setEditingGroup(null); }}
            />
        </div>
    );
}

/* ---- Groups view subcomponent ---- */

interface GroupsViewProps {
    groups: CourseGroup[];
    courses: Course[];
    onEditGroup: (g: CourseGroup) => void;
    onDeleteGroup: (g: CourseGroup) => void;
    onEditCourse: (c: Course) => void;
    onWebhook: (c: Course) => void;
    onCreateGroup: () => void;
}

function GroupsView({ groups, courses, onEditGroup, onDeleteGroup, onEditCourse, onWebhook, onCreateGroup }: GroupsViewProps) {
    if (groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <i className="ri-stack-line text-5xl mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Nenhum grupo criado</h3>
                <p className="text-sm mb-4">Agrupe seus cursos para organizar suas ofertas.</p>
                <button onClick={onCreateGroup} className="btn-brand inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white">
                    <i className="ri-add-line" />
                    Criar Primeiro Grupo
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {groups.map((group) => (
                <CourseGroupCard
                    key={group.id}
                    group={group}
                    courses={courses}
                    onEditGroup={onEditGroup}
                    onDeleteGroup={onDeleteGroup}
                    onEditCourse={onEditCourse}
                    onWebhook={onWebhook}
                />
            ))}
        </div>
    );
}
