import { useState, useMemo, useEffect, useCallback } from "react";
import { transcriptsService } from "@/services/transcripts";
import { useAutoTranscript } from "./useAutoTranscript";
import type {
    Transcript,
    TranscriptDrillLevel,
    TranscriptCourseSummary,
    TranscriptModuleSummary,
    TranscriptStats,
} from "@/types/transcript";

export function useTranscriptsPage() {
    // Data from API
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [stats, setStats] = useState<TranscriptStats>({
        totalTranscripts: 0,
        coursesWithTranscripts: 0,
        totalKeywords: 0,
    });
    const [loading, setLoading] = useState(true);

    // Drill-down
    const [level, setLevel] = useState<TranscriptDrillLevel>("courses");
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);

    // Filters
    const [search, setSearch] = useState("");

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Transcript | null>(null);
    const [detailsItem, setDetailsItem] = useState<Transcript | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Transcript | null>(null);
    const [youtubeOpen, setYoutubeOpen] = useState(false);
    const [autoTranscriptOpen, setAutoTranscriptOpen] = useState(false);

    /* ---- Data fetching ---- */

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [groupsData, statsData] = await Promise.all([
                transcriptsService.getGroups(),
                transcriptsService.getStats(),
            ]);
            setTranscripts(groupsData);
            setStats(statsData);
        } catch (error) {
            console.error("Erro ao carregar transcrições:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ---- Auto transcript ---- */

    const autoTranscript = useAutoTranscript(fetchData);

    /* ---- Drill-down computed data ---- */

    const courseSummaries = useMemo<TranscriptCourseSummary[]>(() => {
        const map = new Map<number, TranscriptCourseSummary>();
        for (const t of transcripts) {
            const existing = map.get(t.courseId);
            if (existing) {
                existing.totalTranscripts += 1;
                const moduleIds = new Set(
                    transcripts.filter((tr) => tr.courseId === t.courseId).map((tr) => tr.moduleId)
                );
                existing.modulesWithTranscript = moduleIds.size;
            } else {
                const moduleIds = new Set(
                    transcripts.filter((tr) => tr.courseId === t.courseId).map((tr) => tr.moduleId)
                );
                map.set(t.courseId, {
                    courseId: t.courseId,
                    courseName: t.courseName,
                    modulesWithTranscript: moduleIds.size,
                    totalTranscripts: 1,
                });
            }
        }
        return Array.from(map.values());
    }, [transcripts]);

    const moduleSummaries = useMemo<TranscriptModuleSummary[]>(() => {
        if (selectedCourseId === null) return [];
        const courseTranscripts = transcripts.filter((t) => t.courseId === selectedCourseId);
        const map = new Map<number, TranscriptModuleSummary>();
        for (const t of courseTranscripts) {
            const existing = map.get(t.moduleId);
            if (existing) {
                existing.totalTranscripts += 1;
                existing.lessonsWithTranscript += 1;
            } else {
                map.set(t.moduleId, {
                    moduleId: t.moduleId,
                    moduleName: t.moduleName,
                    courseId: t.courseId,
                    lessonsWithTranscript: 1,
                    totalTranscripts: 1,
                });
            }
        }
        return Array.from(map.values());
    }, [transcripts, selectedCourseId]);

    const lessonTranscripts = useMemo(() => {
        if (selectedModuleId === null) return [];
        return transcripts.filter((t) => t.moduleId === selectedModuleId);
    }, [transcripts, selectedModuleId]);

    /* ---- Filtered data ---- */

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

    const filteredLessonTranscripts = useMemo(() => {
        if (!search.trim()) return lessonTranscripts;
        const q = search.toLowerCase();
        return lessonTranscripts.filter(
            (t) =>
                t.lessonName.toLowerCase().includes(q) ||
                t.keywords.some((k) => k.toLowerCase().includes(q))
        );
    }, [lessonTranscripts, search]);

    const hasActiveFilters = search.trim() !== "";

    const selectedCourseName = selectedCourseId !== null
        ? courseSummaries.find((c) => c.courseId === selectedCourseId)?.courseName
        : undefined;
    const selectedModuleName = selectedModuleId !== null
        ? moduleSummaries.find((m) => m.moduleId === selectedModuleId)?.moduleName
        : undefined;

    /* ---- Navigation ---- */

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

    /* ---- CRUD handlers ---- */

    function handleCreateOpen() {
        setEditingItem(null);
        setModalOpen(true);
    }

    function handleEdit(item: Transcript) {
        setEditingItem(item);
        setModalOpen(true);
    }

    function handleView(item: Transcript) {
        setDetailsItem(item);
    }

    async function handleSubmit(data: {
        lessonId: string;
        text: string;
        vector: string;
        keywords: string[];
    }) {
        try {
            if (editingItem) {
                await transcriptsService.update(editingItem.id, {
                    text: data.text,
                    vector: data.vector,
                    keywords: data.keywords,
                });
            } else {
                await transcriptsService.create({
                    lessonId: Number(data.lessonId),
                    text: data.text,
                    vector: data.vector,
                    keywords: data.keywords,
                });
            }
            setModalOpen(false);
            setEditingItem(null);
            await fetchData();
        } catch (error) {
            console.error("Erro ao salvar transcrição:", error);
        }
    }

    async function handleConfirmDelete() {
        if (!deleteTarget) return;
        try {
            await transcriptsService.delete(deleteTarget.id);
            setDeleteTarget(null);
            await fetchData();
        } catch (error) {
            console.error("Erro ao excluir transcrição:", error);
        }
    }

    function handleYoutubeImport(url: string, provider: string) {
        console.log("YouTube import:", url, provider);
        setYoutubeOpen(false);
    }

    return {
        loading, stats,
        level, search, setSearch,
        filteredCourseSummaries, filteredModuleSummaries, filteredLessonTranscripts,
        hasActiveFilters, selectedCourseName, selectedModuleName,
        handleSelectCourse, handleSelectModule, handleNavigateCourses, handleNavigateModules,
        modalOpen, setModalOpen, editingItem, setEditingItem,
        detailsItem, setDetailsItem, deleteTarget, setDeleteTarget,
        youtubeOpen, setYoutubeOpen,
        autoTranscriptOpen, setAutoTranscriptOpen,
        autoTranscript,
        handleCreateOpen, handleEdit, handleView, handleSubmit, handleConfirmDelete, handleYoutubeImport,
    };
}
