import { useState } from "react";
import {
    TranscriptStats,
    TranscriptFilters,
    TranscriptBreadcrumb,
    TranscriptCourseTable,
    TranscriptModuleTable,
    TranscriptLessonTable,
    TranscriptEmptyState,
} from "@/components/transcripts";
import { TranscriptModal } from "@/components/modals/transcripts/TranscriptModal";
import { TranscriptDetailsModal } from "@/components/modals/transcripts/TranscriptDetailsModal";
import { YouTubeImportModal } from "@/components/modals/transcripts/YouTubeImportModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { Transcript } from "@/types/transcript";
import { mockTranscripts, mockCourses, mockModules, mockLessons } from "./mock-data";
import { useTranscriptsPage } from "./useTranscriptsPage";

export function TranscriptsPage() {
    const [transcripts] = useState<Transcript[]>(mockTranscripts);
    const tp = useTranscriptsPage({ transcripts });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-mic-2-ai-line text-primary" />
                    Transcrições
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie as transcrições das aulas para buscas inteligentes
                </p>
            </div>

            <TranscriptStats {...tp.stats} />

            <TranscriptFilters
                search={tp.search}
                onSearchChange={tp.setSearch}
                onCreateTranscript={tp.handleCreateOpen}
            />

            <TranscriptBreadcrumb
                level={tp.level}
                courseName={tp.selectedCourseName}
                moduleName={tp.selectedModuleName}
                onNavigateCourses={tp.handleNavigateCourses}
                onNavigateModules={tp.handleNavigateModules}
            />

            {/* Drill-down content */}
            <TranscriptContent tp={tp} />

            {/* Modals */}
            <TranscriptModal
                open={tp.modalOpen}
                onOpenChange={tp.setModalOpen}
                editItem={tp.editingItem}
                courses={mockCourses}
                modules={mockModules}
                lessons={mockLessons}
                onSubmit={(data) => {
                    console.log(tp.editingItem ? "Update:" : "Create:", data);
                    tp.setModalOpen(false);
                    tp.setEditingItem(null);
                }}
                onYoutubeImport={() => tp.setYoutubeOpen(true)}
            />

            <TranscriptDetailsModal
                open={!!tp.detailsItem}
                onOpenChange={() => tp.setDetailsItem(null)}
                item={tp.detailsItem}
                onEdit={(item) => {
                    tp.setDetailsItem(null);
                    tp.handleEdit(item);
                }}
            />

            <YouTubeImportModal
                open={tp.youtubeOpen}
                onOpenChange={tp.setYoutubeOpen}
                onImport={tp.handleYoutubeImport}
            />

            <DeleteConfirmModal
                open={!!tp.deleteTarget}
                onOpenChange={() => tp.setDeleteTarget(null)}
                onConfirm={tp.handleConfirmDelete}
                title="Excluir Transcrição"
                description={`Tem certeza que deseja excluir a transcrição da aula "${tp.deleteTarget?.lessonName}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir Transcrição"
            />
        </div>
    );
}

/* ---- Drill-down content ---- */

function TranscriptContent({ tp }: { tp: ReturnType<typeof useTranscriptsPage> }) {
    if (tp.level === "courses") {
        return tp.filteredCourseSummaries.length === 0 ? (
            <TranscriptEmptyState hasFilters={tp.hasActiveFilters} onCreateTranscript={tp.handleCreateOpen} />
        ) : (
            <TranscriptCourseTable items={tp.filteredCourseSummaries} onSelectCourse={tp.handleSelectCourse} />
        );
    }

    if (tp.level === "modules") {
        return tp.filteredModuleSummaries.length === 0 ? (
            <TranscriptEmptyState hasFilters={tp.hasActiveFilters} onCreateTranscript={tp.handleCreateOpen} />
        ) : (
            <TranscriptModuleTable items={tp.filteredModuleSummaries} onSelectModule={tp.handleSelectModule} />
        );
    }

    return tp.filteredLessonTranscripts.length === 0 ? (
        <TranscriptEmptyState hasFilters={tp.hasActiveFilters} onCreateTranscript={tp.handleCreateOpen} />
    ) : (
        <TranscriptLessonTable
            items={tp.filteredLessonTranscripts}
            onView={tp.handleView}
            onEdit={tp.handleEdit}
            onDelete={tp.setDeleteTarget}
        />
    );
}
