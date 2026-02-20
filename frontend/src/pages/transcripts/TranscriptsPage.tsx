import { useState, useMemo } from "react";
import {
    TranscriptStats,
    TranscriptFilters,
    TranscriptTable,
    TranscriptEmptyState,
} from "@/components/transcripts";
import { TranscriptModal } from "@/components/modals/transcripts/TranscriptModal";
import { TranscriptDetailsModal } from "@/components/modals/transcripts/TranscriptDetailsModal";
import { YouTubeImportModal } from "@/components/modals/transcripts/YouTubeImportModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { Transcript } from "@/types/transcript";
import {
    mockTranscripts,
    mockCourses,
    mockModules,
    mockLessons,
} from "./mock-data";

export function TranscriptsPage() {
    const [transcripts] = useState<Transcript[]>(mockTranscripts);

    // Filters
    const [search, setSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("all");

    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Transcript | null>(null);
    const [detailsItem, setDetailsItem] = useState<Transcript | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Transcript | null>(null);
    const [youtubeOpen, setYoutubeOpen] = useState(false);

    // Filtered transcripts
    const filteredTranscripts = useMemo(() => {
        let result = [...transcripts];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (t) =>
                    t.lessonName.toLowerCase().includes(q) ||
                    t.moduleName.toLowerCase().includes(q) ||
                    t.courseName.toLowerCase().includes(q) ||
                    t.keywords.some((k) => k.toLowerCase().includes(q))
            );
        }

        if (courseFilter !== "all") {
            const courseName = mockCourses.find(
                (c) => c.id === Number(courseFilter)
            )?.name;
            if (courseName) {
                result = result.filter((t) => t.courseName === courseName);
            }
        }

        return result;
    }, [transcripts, search, courseFilter]);

    // Stats
    const stats = useMemo(() => {
        const uniqueCourses = new Set(transcripts.map((t) => t.courseName));
        const totalKeywords = transcripts.reduce(
            (sum, t) => sum + t.keywords.length,
            0
        );
        return {
            totalTranscripts: transcripts.length,
            coursesWithTranscripts: uniqueCourses.size,
            totalKeywords,
        };
    }, [transcripts]);

    const hasActiveFilters =
        search.trim() !== "" || courseFilter !== "all";

    // Handlers
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

    function handleConfirmDelete() {
        console.log("Delete:", deleteTarget?.id);
        setDeleteTarget(null);
    }

    function handleYoutubeImport(url: string, provider: string) {
        console.log("YouTube import:", url, provider);
        setYoutubeOpen(false);
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-file-text-line text-primary" />
                    Transcrições
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie as transcrições das aulas para buscas inteligentes
                </p>
            </div>

            {/* Stats */}
            <TranscriptStats {...stats} />

            {/* Filters */}
            <TranscriptFilters
                search={search}
                onSearchChange={setSearch}
                courseFilter={courseFilter}
                onCourseFilterChange={setCourseFilter}
                availableCourses={mockCourses}
                onCreateTranscript={handleCreateOpen}
            />

            {/* Content */}
            {filteredTranscripts.length === 0 ? (
                <TranscriptEmptyState
                    hasFilters={hasActiveFilters}
                    onCreateTranscript={handleCreateOpen}
                />
            ) : (
                <TranscriptTable
                    items={filteredTranscripts}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                />
            )}

            {/* Modals */}
            <TranscriptModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                editItem={editingItem}
                courses={mockCourses}
                modules={mockModules}
                lessons={mockLessons}
                onSubmit={(data) => {
                    console.log(editingItem ? "Update:" : "Create:", data);
                    setModalOpen(false);
                    setEditingItem(null);
                }}
                onYoutubeImport={() => setYoutubeOpen(true)}
            />

            <TranscriptDetailsModal
                open={!!detailsItem}
                onOpenChange={() => setDetailsItem(null)}
                item={detailsItem}
                onEdit={(item) => {
                    setDetailsItem(null);
                    handleEdit(item);
                }}
            />

            <YouTubeImportModal
                open={youtubeOpen}
                onOpenChange={setYoutubeOpen}
                onImport={handleYoutubeImport}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Transcrição"
                description={`Tem certeza que deseja excluir a transcrição da aula "${deleteTarget?.lessonName}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir Transcrição"
            />
        </div>
    );
}
