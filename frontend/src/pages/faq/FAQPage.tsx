import {
    FAQStats,
    FAQFilters,
    FAQBreadcrumb,
    FAQCourseTable,
    FAQModuleTable,
    FAQLessonTable,
    FAQEmptyState,
} from "@/components/faq";
import { FAQModal } from "@/components/modals/faq/FAQModal";
import { FAQDetailsModal } from "@/components/modals/faq/FAQDetailsModal";
import { FAQAIModal } from "@/components/modals/faq/FAQAIModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import { useFAQPage } from "./useFAQPage";

export function FAQPage() {
    const faq = useFAQPage();

    if (faq.loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <i className="ri-loader-4-line text-3xl text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Carregando FAQs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-question-answer-line text-primary" />
                    FAQ
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie as perguntas frequentes das suas aulas
                </p>
            </div>

            <FAQStats {...faq.stats} />

            <FAQFilters
                search={faq.search}
                onSearchChange={faq.setSearch}
                onCreateFaq={faq.handleCreateOpen}
            />

            <FAQBreadcrumb
                level={faq.level}
                courseName={faq.selectedCourseName}
                moduleName={faq.selectedModuleName}
                onNavigateCourses={faq.handleNavigateCourses}
                onNavigateModules={faq.handleNavigateModules}
            />

            {/* Drill-down content */}
            <FAQContent faq={faq} />

            {/* Modals */}
            <FAQModal
                open={faq.modalOpen}
                onOpenChange={faq.setModalOpen}
                editItem={faq.editingItem}
                onSubmit={faq.handleSubmit}
                onGenerateAI={faq.handleAIGenerate}
            />

            <FAQDetailsModal
                open={!!faq.detailsItem}
                onOpenChange={() => faq.setDetailsItem(null)}
                item={faq.detailsItem}
                onEdit={(item) => { faq.setDetailsItem(null); faq.handleEdit(item); }}
            />

            <FAQAIModal
                open={faq.aiModalOpen}
                onOpenChange={faq.setAiModalOpen}
                lessonId={faq.editingItem?.lessonId ?? 0}
                lessonName={faq.editingItem?.lessonName ?? ""}
                onApplyFaqs={faq.handleApplyAIFaqs}
            />

            <DeleteConfirmModal
                open={!!faq.deleteTarget}
                onOpenChange={() => faq.setDeleteTarget(null)}
                onConfirm={faq.handleConfirmDelete}
                title="Excluir FAQ"
                description={`Tem certeza que deseja excluir o FAQ da aula "${faq.deleteTarget?.lessonName}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir FAQ"
            />
        </div>
    );
}

/* ---- Drill-down content ---- */

function FAQContent({ faq }: { faq: ReturnType<typeof useFAQPage> }) {
    if (faq.level === "courses") {
        return faq.filteredCourseSummaries.length === 0 ? (
            <FAQEmptyState hasFilters={faq.hasActiveFilters} onCreateFaq={faq.handleCreateOpen} />
        ) : (
            <FAQCourseTable items={faq.filteredCourseSummaries} onSelectCourse={faq.handleSelectCourse} />
        );
    }

    if (faq.level === "modules") {
        return faq.filteredModuleSummaries.length === 0 ? (
            <FAQEmptyState hasFilters={faq.hasActiveFilters} onCreateFaq={faq.handleCreateOpen} />
        ) : (
            <FAQModuleTable items={faq.filteredModuleSummaries} onSelectModule={faq.handleSelectModule} />
        );
    }

    return faq.filteredLessonGroups.length === 0 ? (
        <FAQEmptyState hasFilters={faq.hasActiveFilters} onCreateFaq={faq.handleCreateOpen} />
    ) : (
        <FAQLessonTable
            items={faq.filteredLessonGroups}
            onView={faq.handleView}
            onEdit={faq.handleEdit}
            onDelete={faq.setDeleteTarget}
        />
    );
}
