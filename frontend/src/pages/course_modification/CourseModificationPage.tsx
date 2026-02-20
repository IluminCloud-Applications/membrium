import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { CourseHeader, CourseTabs } from "@/components/course_modification";
import { ModuleModal } from "@/components/modals/course_modification/ModuleModal";
import { LessonModal } from "@/components/modals/course_modification/LessonModal";
import { MenuItemModal } from "@/components/modals/course_modification/MenuItemModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type {
    CourseModule,
    CourseMenuItem,
    Lesson,
    ModuleFormData,
    LessonFormData,
    MenuItemFormData,
} from "@/types/course-modification";
import { mockCourseData } from "./mock-data";

export function CourseModificationPage() {
    const { id: _courseId } = useParams<{ id: string }>();
    const [course] = useState(mockCourseData);

    // Modal states
    const [moduleModalOpen, setModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<CourseModule | null>(null);

    const [lessonModalOpen, setLessonModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<number | null>(null);

    const [menuModalOpen, setMenuModalOpen] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState<CourseMenuItem | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<{
        type: "module" | "lesson" | "menuItem";
        label: string;
        moduleId?: number;
        lessonId?: number;
        menuItemId?: number;
    } | null>(null);

    // Computed stats
    const totalLessons = useMemo(
        () => course.modules.reduce((sum, m) => sum + m.lessons.length, 0),
        [course.modules]
    );

    // ---- Module handlers ----
    function handleAddModule() {
        setEditingModule(null);
        setModuleModalOpen(true);
    }

    function handleEditModule(mod: CourseModule) {
        setEditingModule(mod);
        setModuleModalOpen(true);
    }

    function handleDeleteModule(mod: CourseModule) {
        setDeleteTarget({
            type: "module",
            label: mod.name,
            moduleId: mod.id,
        });
    }

    function handleModuleSubmit(data: ModuleFormData) {
        console.log(editingModule ? "Update module:" : "Create module:", data);
        setModuleModalOpen(false);
        setEditingModule(null);
    }

    // ---- Lesson handlers ----
    function handleAddLesson(moduleId: number) {
        setActiveModuleId(moduleId);
        setEditingLesson(null);
        setLessonModalOpen(true);
    }

    function handleEditLesson(moduleId: number, lessonId: number) {
        setActiveModuleId(moduleId);
        const mod = course.modules.find((m) => m.id === moduleId);
        const lesson = mod?.lessons.find((l) => l.id === lessonId) ?? null;
        setEditingLesson(lesson);
        setLessonModalOpen(true);
    }

    function handleDeleteLesson(moduleId: number, lessonId: number) {
        const mod = course.modules.find((m) => m.id === moduleId);
        const lesson = mod?.lessons.find((l) => l.id === lessonId);
        setDeleteTarget({
            type: "lesson",
            label: lesson?.title ?? "Aula",
            moduleId,
            lessonId,
        });
    }

    function handleLessonSubmit(data: LessonFormData) {
        console.log(editingLesson ? "Update lesson:" : "Create lesson:", data, "in module:", activeModuleId);
        setLessonModalOpen(false);
        setEditingLesson(null);
        setActiveModuleId(null);
    }

    // ---- Cover handlers ----
    function handleCoverChange(type: "desktop" | "mobile", file: File | null) {
        console.log("Cover change:", type, file?.name);
    }

    function handleCoverDelete(type: "desktop" | "mobile") {
        console.log("Cover delete:", type);
    }

    // ---- Menu item handlers ----
    function handleAddMenuItem() {
        setEditingMenuItem(null);
        setMenuModalOpen(true);
    }

    function handleEditMenuItem(item: CourseMenuItem) {
        setEditingMenuItem(item);
        setMenuModalOpen(true);
    }

    function handleDeleteMenuItem(item: CourseMenuItem) {
        setDeleteTarget({
            type: "menuItem",
            label: item.name,
            menuItemId: item.id,
        });
    }

    function handleMenuItemSubmit(data: MenuItemFormData) {
        console.log(editingMenuItem ? "Update menu item:" : "Create menu item:", data);
        setMenuModalOpen(false);
        setEditingMenuItem(null);
    }

    // ---- Delete confirm ----
    function handleConfirmDelete() {
        if (!deleteTarget) return;
        console.log("Delete:", deleteTarget);
        setDeleteTarget(null);
    }

    const deleteMessages: Record<string, { title: string; description: string; label: string }> = {
        module: {
            title: "Excluir Módulo",
            description: `Tem certeza que deseja excluir "${deleteTarget?.label}"? Todas as aulas dentro deste módulo serão removidas permanentemente.`,
            label: "Excluir Módulo",
        },
        lesson: {
            title: "Excluir Aula",
            description: `Tem certeza que deseja excluir "${deleteTarget?.label}"? Esta aula será removida permanentemente.`,
            label: "Excluir Aula",
        },
        menuItem: {
            title: "Excluir Link",
            description: `Tem certeza que deseja excluir o link "${deleteTarget?.label}"? Ele será removido do menu do curso.`,
            label: "Excluir Link",
        },
    };

    const currentDelete = deleteTarget ? deleteMessages[deleteTarget.type] : null;

    return (
        <div className="space-y-6 animate-fade-in">
            <CourseHeader
                courseName={course.name}
                modulesCount={course.modules.length}
                lessonsCount={totalLessons}
            />

            <CourseTabs
                modules={course.modules}
                cover={course.cover}
                menuItems={course.menuItems}
                onAddModule={handleAddModule}
                onEditModule={handleEditModule}
                onDeleteModule={handleDeleteModule}
                onAddLesson={handleAddLesson}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
                onCoverChange={handleCoverChange}
                onCoverDelete={handleCoverDelete}
                onAddMenuItem={handleAddMenuItem}
                onEditMenuItem={handleEditMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
            />

            {/* Modals */}
            <ModuleModal
                open={moduleModalOpen}
                onOpenChange={setModuleModalOpen}
                editModule={editingModule}
                onSubmit={handleModuleSubmit}
            />

            <LessonModal
                open={lessonModalOpen}
                onOpenChange={setLessonModalOpen}
                editLesson={editingLesson}
                onSubmit={handleLessonSubmit}
            />

            <MenuItemModal
                open={menuModalOpen}
                onOpenChange={setMenuModalOpen}
                editItem={editingMenuItem}
                onSubmit={handleMenuItemSubmit}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title={currentDelete?.title}
                description={currentDelete?.description}
                confirmLabel={currentDelete?.label}
            />
        </div>
    );
}
