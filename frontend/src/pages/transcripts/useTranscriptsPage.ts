import { useState, useMemo } from "react";
import type {
    Transcript,
    TranscriptDrillLevel,
    TranscriptCourseSummary,
    TranscriptModuleSummary,
} from "@/types/transcript";

interface UseTranscriptsPageProps {
    transcripts: Transcript[];
}

export function useTranscriptsPage({ transcripts }: UseTranscriptsPageProps) {
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

    // Stats
    const stats = useMemo(() => {
        const uniqueCourses = new Set(transcripts.map((t) => t.courseName));
        const totalKeywords = transcripts.reduce((sum, t) => sum + t.keywords.length, 0);
        return {
            totalTranscripts: transcripts.length,
            coursesWithTranscripts: uniqueCourses.size,
            totalKeywords,
        };
    }, [transcripts]);

    // Drill-down data: Course summaries
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

    // Drill-down data: Module summaries
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

    // Drill-down data: Lessons
    const lessonTranscripts = useMemo(() => {
        if (selectedModuleId === null) return [];
        return transcripts.filter((t) => t.moduleId === selectedModuleId);
    }, [transcripts, selectedModuleId]);

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
    function handleEdit(item: Transcript) { setEditingItem(item); setModalOpen(true); }
    function handleView(item: Transcript) { setDetailsItem(item); }
    function handleConfirmDelete() { console.log("Delete:", deleteTarget?.id); setDeleteTarget(null); }
    function handleYoutubeImport(url: string, provider: string) {
        console.log("YouTube import:", url, provider);
        setYoutubeOpen(false);
    }

    return {
        level, search, setSearch, stats,
        filteredCourseSummaries, filteredModuleSummaries, filteredLessonTranscripts,
        hasActiveFilters, selectedCourseName, selectedModuleName,
        handleSelectCourse, handleSelectModule, handleNavigateCourses, handleNavigateModules,
        modalOpen, setModalOpen, editingItem, setEditingItem,
        detailsItem, setDetailsItem, deleteTarget, setDeleteTarget,
        youtubeOpen, setYoutubeOpen,
        handleCreateOpen, handleEdit, handleView, handleConfirmDelete, handleYoutubeImport,
    };
}
