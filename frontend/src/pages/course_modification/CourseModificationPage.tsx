import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CourseHeader, CourseTabs } from "@/components/course_modification";
import { ModuleModal } from "@/components/modals/course_modification/ModuleModal";
import { LessonModal } from "@/components/modals/course_modification/LessonModal";
import { MenuItemModal } from "@/components/modals/course_modification/MenuItemModal";
import { BulkUploadModal } from "@/components/modals/course_modification/BulkUploadModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type {
    CourseModule, CourseMenuItem, Lesson,
    ModuleFormData, LessonFormData, MenuItemFormData,
} from "@/types/course-modification";
import { courseModificationService } from "@/services/courseModification";
import { integrationsService } from "@/services/integrations";
import { useCourseModification } from "./useCourseModification";
import { toast } from "sonner";

export function CourseModificationPage() {
    const { id } = useParams<{ id: string }>();
    const courseId = id ? Number(id) : undefined;
    const { course, loading, error, refetch } = useCourseModification(courseId);

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

    // YouTube state
    const [youtubeConnected, setYoutubeConnected] = useState(false);
    const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
    const [bulkUploadModuleId, setBulkUploadModuleId] = useState<number | null>(null);

    // Check YouTube connection status
    useEffect(() => {
        async function checkYouTube() {
            try {
                const res = await integrationsService.getYouTubeStatus();
                setYoutubeConnected(res.connected);
            } catch {
                setYoutubeConnected(false);
            }
        }
        checkYouTube();
    }, []);

    const totalLessons = useMemo(
        () => course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0,
        [course?.modules]
    );

    /* ---- Module handlers ---- */
    function handleAddModule() { setEditingModule(null); setModuleModalOpen(true); }
    function handleEditModule(mod: CourseModule) { setEditingModule(mod); setModuleModalOpen(true); }
    function handleDeleteModule(mod: CourseModule) {
        setDeleteTarget({ type: "module", label: mod.name, moduleId: mod.id });
    }

    async function handleModuleSubmit(data: ModuleFormData) {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("unlock_after_days", String(data.unlockAfterDays || 0));
        if (data.imageFile) formData.append("image", data.imageFile);
        if (!data.imagePreview && editingModule?.image) formData.append("image_removed", "true");

        try {
            if (editingModule) await courseModificationService.updateModule(editingModule.id, formData);
            else if (courseId) await courseModificationService.createModule(courseId, formData);
            await refetch();
        } catch (err) { console.error("Erro ao salvar módulo:", err); }
        setModuleModalOpen(false);
        setEditingModule(null);
    }

    /* ---- Lesson handlers ---- */
    function handleAddLesson(moduleId: number) {
        setActiveModuleId(moduleId); setEditingLesson(null); setLessonModalOpen(true);
    }
    function handleEditLesson(moduleId: number, lessonId: number) {
        setActiveModuleId(moduleId);
        const lesson = course?.modules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId) ?? null;
        setEditingLesson(lesson);
        setLessonModalOpen(true);
    }
    function handleDeleteLesson(moduleId: number, lessonId: number) {
        const lesson = course?.modules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId);
        setDeleteTarget({ type: "lesson", label: lesson?.title ?? "Aula", moduleId, lessonId });
    }

    async function handleLessonSubmit(data: LessonFormData) {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("video_platform", data.videoPlatform);
        formData.append("video_url", data.videoPlatform === "custom" ? data.customVideoCode : data.videoUrl);
        formData.append("has_cta", String(data.hasCta));
        if (data.hasCta) {
            formData.append("cta_text", data.ctaText);
            formData.append("cta_url", data.ctaUrl);
            formData.append("cta_delay", String(data.ctaDelay));
        }
        for (const file of data.attachments) formData.append("documents", file);

        try {
            if (editingLesson) {
                await courseModificationService.updateLesson(editingLesson.id, formData);
            } else if (activeModuleId) {
                const result = await courseModificationService.createLesson(activeModuleId, formData);
                if (result.transcript_imported) {
                    toast.success("Transcrição importada automaticamente do YouTube!");
                }
            }
            await refetch();
        } catch (err) { console.error("Erro ao salvar aula:", err); }
        setLessonModalOpen(false);
        setEditingLesson(null);
        setActiveModuleId(null);
    }

    /* ---- Cover handlers ---- */
    async function handleCoverChange(type: "desktop" | "mobile", file: File | null) {
        if (!courseId || !file) return;
        const formData = new FormData();
        formData.append(type, file);
        try { await courseModificationService.updateCover(courseId, formData); await refetch(); }
        catch (err) { console.error("Erro ao salvar capa:", err); }
    }
    async function handleCoverDelete(type: "desktop" | "mobile") {
        if (!courseId) return;
        const formData = new FormData();
        formData.append(`${type}_removed`, "true");
        try { await courseModificationService.updateCover(courseId, formData); await refetch(); }
        catch (err) { console.error("Erro ao remover capa:", err); }
    }

    /* ---- Reorder handlers ---- */
    async function handleReorderModules(orderedIds: number[]) {
        try { await courseModificationService.reorderModules(orderedIds); await refetch(); }
        catch (err) { console.error("Erro ao reordenar módulos:", err); }
    }
    async function handleReorderLessons(_moduleId: number, orderedIds: number[]) {
        try { await courseModificationService.reorderLessons(orderedIds); await refetch(); }
        catch (err) { console.error("Erro ao reordenar aulas:", err); }
    }

    /* ---- Menu handlers ---- */
    function handleAddMenuItem() { setEditingMenuItem(null); setMenuModalOpen(true); }
    function handleEditMenuItem(item: CourseMenuItem) { setEditingMenuItem(item); setMenuModalOpen(true); }
    function handleDeleteMenuItem(item: CourseMenuItem) {
        setDeleteTarget({ type: "menuItem", label: item.name, menuItemId: item.id });
    }

    async function handleMenuItemSubmit(data: MenuItemFormData) {
        if (!course || !courseId) return;
        let items = [...(course.menuItems || [])];

        if (editingMenuItem) {
            items = items.map(i =>
                i.id === editingMenuItem.id ? { ...i, name: data.name, url: data.url, icon: data.icon } : i
            );
        } else {
            items.push({ id: Date.now(), name: data.name, url: data.url, icon: data.icon, order: items.length + 1 });
        }

        try {
            await courseModificationService.updateMenu(courseId, items.map((i, idx) => ({
                name: i.name, url: i.url, icon: i.icon, order: idx + 1,
            })));
            await refetch();
        } catch (err) { console.error("Erro ao salvar menu:", err); }
        setMenuModalOpen(false);
        setEditingMenuItem(null);
    }

    /* ---- Bulk Upload ---- */
    function handleBulkUpload(moduleId: number) {
        setBulkUploadModuleId(moduleId);
        setBulkUploadOpen(true);
    }

    function handleBulkUploadComplete() {
        refetch();
        toast.success("Upload em massa concluído!");
    }

    /* ---- Delete confirm ---- */
    async function handleConfirmDelete() {
        if (!deleteTarget || !courseId) return;
        try {
            if (deleteTarget.type === "module" && deleteTarget.moduleId) {
                await courseModificationService.deleteModule(deleteTarget.moduleId);
            } else if (deleteTarget.type === "lesson" && deleteTarget.lessonId) {
                await courseModificationService.deleteLesson(deleteTarget.lessonId);
            } else if (deleteTarget.type === "menuItem" && course) {
                const items = course.menuItems.filter(i => i.id !== deleteTarget.menuItemId);
                await courseModificationService.updateMenu(courseId, items.map((i, idx) => ({
                    name: i.name, url: i.url, icon: i.icon, order: idx + 1,
                })));
            }
            await refetch();
        } catch (err) { console.error("Erro ao deletar:", err); }
        setDeleteTarget(null);
    }

    const deleteMessages: Record<string, { title: string; description: string; label: string }> = {
        module: { title: "Excluir Módulo", description: `Tem certeza que deseja excluir "${deleteTarget?.label}"?`, label: "Excluir Módulo" },
        lesson: { title: "Excluir Aula", description: `Tem certeza que deseja excluir "${deleteTarget?.label}"?`, label: "Excluir Aula" },
        menuItem: { title: "Excluir Link", description: `Tem certeza que deseja excluir "${deleteTarget?.label}"?`, label: "Excluir Link" },
    };
    const currentDelete = deleteTarget ? deleteMessages[deleteTarget.type] : null;

    if (loading) return <div className="flex items-center justify-center py-20"><i className="ri-loader-4-line animate-spin text-2xl text-primary" /></div>;
    if (error || !course) return <div className="flex items-center justify-center py-20 text-destructive">{error || "Curso não encontrado"}</div>;

    // Get module name for bulk upload modal
    const bulkUploadModuleName = bulkUploadModuleId
        ? course.modules.find(m => m.id === bulkUploadModuleId)?.name ?? "Módulo"
        : "Módulo";

    return (
        <div className="space-y-6 animate-fade-in">
            <CourseHeader courseName={course.name} courseId={courseId} modulesCount={course.modules.length} lessonsCount={totalLessons} />
            <CourseTabs
                modules={course.modules} cover={course.cover} menuItems={course.menuItems}
                onAddModule={handleAddModule} onEditModule={handleEditModule} onDeleteModule={handleDeleteModule}
                onAddLesson={handleAddLesson} onEditLesson={handleEditLesson} onDeleteLesson={handleDeleteLesson}
                onReorderModules={handleReorderModules} onReorderLessons={handleReorderLessons}
                onCoverChange={handleCoverChange} onCoverDelete={handleCoverDelete}
                onAddMenuItem={handleAddMenuItem} onEditMenuItem={handleEditMenuItem} onDeleteMenuItem={handleDeleteMenuItem}
                onBulkUpload={handleBulkUpload}
                youtubeConnected={youtubeConnected}
            />
            <ModuleModal open={moduleModalOpen} onOpenChange={setModuleModalOpen} editModule={editingModule} onSubmit={handleModuleSubmit} />
            <LessonModal open={lessonModalOpen} onOpenChange={setLessonModalOpen} editLesson={editingLesson} onSubmit={handleLessonSubmit} />
            <MenuItemModal open={menuModalOpen} onOpenChange={setMenuModalOpen} editItem={editingMenuItem} onSubmit={handleMenuItemSubmit} />
            <DeleteConfirmModal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleConfirmDelete}
                title={currentDelete?.title} description={currentDelete?.description} confirmLabel={currentDelete?.label} />

            {/* Bulk Upload Modal */}
            {bulkUploadModuleId && (
                <BulkUploadModal
                    open={bulkUploadOpen}
                    onOpenChange={setBulkUploadOpen}
                    moduleId={bulkUploadModuleId}
                    moduleName={bulkUploadModuleName}
                    onComplete={handleBulkUploadComplete}
                />
            )}
        </div>
    );
}
