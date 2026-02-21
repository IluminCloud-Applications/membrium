import { useState, useEffect, useMemo, useCallback } from "react";
import { faqService } from "@/services/faq";
import type {
    FAQLessonGroup,
    FAQDrillLevel,
    FAQCourseSummary,
    FAQModuleSummary,
    FAQItem,
} from "@/types/faq";
import type { FAQStatsResponse } from "@/services/faq";

export function useFAQPage() {
    // Data state
    const [faqGroups, setFaqGroups] = useState<FAQLessonGroup[]>([]);
    const [stats, setStats] = useState<FAQStatsResponse>({
        totalFaqs: 0,
        lessonsWithFaq: 0,
        averageFaqPerLesson: 0,
    });
    const [loading, setLoading] = useState(true);

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
    const [aiLessonId, setAiLessonId] = useState<number>(0);
    const [aiLessonName, setAiLessonName] = useState("");

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [groupsData, statsData] = await Promise.all([
                faqService.getGroups(),
                faqService.getStats(),
            ]);
            setFaqGroups(groupsData);
            setStats(statsData);
        } catch (error) {
            console.error("Erro ao carregar FAQs:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Drill-down summaries
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
                l.faqs.some(
                    (f) =>
                        f.question.toLowerCase().includes(q) ||
                        f.answer.toLowerCase().includes(q)
                )
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

    // CRUD operations
    function handleCreateOpen() {
        setEditingItem(null);
        setModalOpen(true);
    }

    function handleEdit(item: FAQLessonGroup) {
        setEditingItem(item);
        setModalOpen(true);
    }

    function handleView(item: FAQLessonGroup) {
        setDetailsItem(item);
    }

    async function handleSubmit(data: { lessonId: string; faqs: FAQItem[] }) {
        try {
            const lessonId = Number(data.lessonId);
            const faqsPayload = data.faqs
                .filter((f) => f.question.trim() && f.answer.trim())
                .map((f) => ({ question: f.question, answer: f.answer }));

            if (editingItem) {
                await faqService.update(lessonId, { faqs: faqsPayload });
            } else {
                await faqService.create({ lesson_id: lessonId, faqs: faqsPayload });
            }

            setModalOpen(false);
            setEditingItem(null);
            await fetchData();
        } catch (error) {
            console.error("Erro ao salvar FAQ:", error);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            await faqService.delete(deleteTarget.lessonId);
            setDeleteTarget(null);
            await fetchData();
        } catch (error) {
            console.error("Erro ao excluir FAQ:", error);
        }
    }

    function handleAIGenerate(lessonId: number, lessonName: string) {
        setAiLessonId(lessonId);
        setAiLessonName(lessonName);
        setAiModalOpen(true);
    }

    async function handleApplyAIFaqs(faqs: FAQItem[]) {
        if (!aiLessonId) {
            setAiModalOpen(false);
            return;
        }
        try {
            const faqsPayload = faqs
                .filter((f) => f.question.trim() && f.answer.trim())
                .map((f) => ({ question: f.question, answer: f.answer }));

            // Check if lesson already has FAQs
            const existingGroup = faqGroups.find((g) => g.lessonId === aiLessonId);
            if (existingGroup && existingGroup.faqs.length > 0) {
                await faqService.update(aiLessonId, { faqs: faqsPayload });
            } else {
                await faqService.create({ lesson_id: aiLessonId, faqs: faqsPayload });
            }

            setAiModalOpen(false);
            setModalOpen(false);
            setEditingItem(null);
            await fetchData();
        } catch (error) {
            console.error("Erro ao salvar FAQ gerado por IA:", error);
        }
    }

    return {
        loading,
        level, search, setSearch, stats,
        filteredCourseSummaries, filteredModuleSummaries, filteredLessonGroups,
        hasActiveFilters, selectedCourseName, selectedModuleName,
        handleSelectCourse, handleSelectModule, handleNavigateCourses, handleNavigateModules,
        modalOpen, setModalOpen, editingItem, setEditingItem,
        detailsItem, setDetailsItem, deleteTarget, setDeleteTarget,
        aiModalOpen, setAiModalOpen,
        aiLessonId, aiLessonName,
        handleCreateOpen, handleEdit, handleView, handleSubmit, handleConfirmDelete,
        handleAIGenerate, handleApplyAIFaqs,
    };
}
