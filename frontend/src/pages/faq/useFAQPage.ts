import { useState, useMemo } from "react";
import type {
    FAQLessonGroup,
    FAQDrillLevel,
    FAQCourseSummary,
    FAQModuleSummary,
    FAQItem,
} from "@/types/faq";

interface UseFAQPageProps {
    faqGroups: FAQLessonGroup[];
}

export function useFAQPage({ faqGroups }: UseFAQPageProps) {
    // Drill-down
    const [level, setLevel] = useState<FAQDrillLevel>("courses");
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

    // Filters
    const [search, setSearch] = useState("");

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<FAQLessonGroup | null>(null);
    const [detailsItem, setDetailsItem] = useState<FAQLessonGroup | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FAQLessonGroup | null>(null);
    const [aiModalOpen, setAiModalOpen] = useState(false);

    // Stats
    const stats = useMemo(() => {
        const totalFaqs = faqGroups.reduce((sum, g) => sum + g.faqs.length, 0);
        const lessonsWithFaq = faqGroups.length;
        const avg = lessonsWithFaq > 0 ? Math.round(totalFaqs / lessonsWithFaq) : 0;
        return { totalFaqs, lessonsWithFaq, averageFaqPerLesson: avg };
    }, [faqGroups]);

    // Drill-down data
    const courseSummaries = useMemo<FAQCourseSummary[]>(() => {
        const map = new Map<number, FAQCourseSummary>();
        for (const g of faqGroups) {
            const existing = map.get(g.courseId);
            if (existing) {
                existing.totalFaqs += g.faqs.length;
                const moduleIds = new Set(
                    faqGroups.filter((fg) => fg.courseId === g.courseId).map((fg) => fg.moduleId)
                );
                existing.modulesWithFaq = moduleIds.size;
            } else {
                const moduleIds = new Set(
                    faqGroups.filter((fg) => fg.courseId === g.courseId).map((fg) => fg.moduleId)
                );
                map.set(g.courseId, {
                    courseId: g.courseId,
                    courseName: g.courseName,
                    modulesWithFaq: moduleIds.size,
                    totalFaqs: g.faqs.length,
                });
            }
        }
        return Array.from(map.values());
    }, [faqGroups]);

    const moduleSummaries = useMemo<FAQModuleSummary[]>(() => {
        if (selectedCourseId === null) return [];
        const courseGroups = faqGroups.filter((g) => g.courseId === selectedCourseId);
        const map = new Map<number, FAQModuleSummary>();
        for (const g of courseGroups) {
            const existing = map.get(g.moduleId);
            if (existing) {
                existing.totalFaqs += g.faqs.length;
                existing.lessonsWithFaq += 1;
            } else {
                map.set(g.moduleId, {
                    moduleId: g.moduleId,
                    moduleName: g.moduleName,
                    courseId: g.courseId,
                    lessonsWithFaq: 1,
                    totalFaqs: g.faqs.length,
                });
            }
        }
        return Array.from(map.values());
    }, [faqGroups, selectedCourseId]);

    const lessonGroups = useMemo(() => {
        if (selectedModuleId === null) return [];
        return faqGroups.filter((g) => g.moduleId === selectedModuleId);
    }, [faqGroups, selectedModuleId]);

    // Filtered data
    const filteredCourseSummaries = useMemo(() => {
        if (!search.trim()) return courseSummaries;
        const q = search.toLowerCase();
        return courseSummaries.filter((c) => c.courseName.toLowerCase().includes(q));
    }, [courseSummaries, search]);

    const filteredModuleSummaries = useMemo(() => {
        if (!search.trim()) return moduleSummaries;
        const q = search.toLowerCase();
        return moduleSummaries.filter((m) => m.moduleName.toLowerCase().includes(q));
    }, [moduleSummaries, search]);

    const filteredLessonGroups = useMemo(() => {
        if (!search.trim()) return lessonGroups;
        const q = search.toLowerCase();
        return lessonGroups.filter(
            (l) =>
                l.lessonName.toLowerCase().includes(q) ||
                l.faqs.some((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
        );
    }, [lessonGroups, search]);

    const hasActiveFilters = search.trim() !== "";

    const selectedCourseName = selectedCourseId !== null
        ? courseSummaries.find((c) => c.courseId === selectedCourseId)?.courseName
        : undefined;
    const selectedModuleName = selectedModuleId !== null
        ? moduleSummaries.find((m) => m.moduleId === selectedModuleId)?.moduleName
        : undefined;

    // Navigation
    function handleSelectCourse(courseId: number) {
        setSelectedCourseId(courseId);
        setLevel("modules");
        setSearch("");
    }

    function handleSelectModule(moduleId: number) {
        setSelectedModuleId(moduleId);
        setLevel("lessons");
        setSearch("");
    }

    function handleNavigateCourses() {
        setLevel("courses");
        setSelectedCourseId(null);
        setSelectedModuleId(null);
        setSearch("");
    }

    function handleNavigateModules() {
        setLevel("modules");
        setSelectedModuleId(null);
        setSearch("");
    }

    // CRUD
    function handleCreateOpen() { setEditingItem(null); setModalOpen(true); }
    function handleEdit(item: FAQLessonGroup) { setEditingItem(item); setModalOpen(true); }
    function handleView(item: FAQLessonGroup) { setDetailsItem(item); }
    function handleConfirmDelete() { console.log("Delete FAQ:", deleteTarget?.lessonId); setDeleteTarget(null); }
    function handleAIGenerate() { setAiModalOpen(true); }
    function handleApplyAIFaqs(faqs: FAQItem[]) { console.log("Apply AI FAQs:", faqs); setAiModalOpen(false); }

    return {
        level, search, setSearch, stats,
        filteredCourseSummaries, filteredModuleSummaries, filteredLessonGroups,
        hasActiveFilters, selectedCourseName, selectedModuleName,
        handleSelectCourse, handleSelectModule, handleNavigateCourses, handleNavigateModules,
        modalOpen, setModalOpen, editingItem, setEditingItem,
        detailsItem, setDetailsItem, deleteTarget, setDeleteTarget,
        aiModalOpen, setAiModalOpen,
        handleCreateOpen, handleEdit, handleView, handleConfirmDelete,
        handleAIGenerate, handleApplyAIFaqs,
    };
}
