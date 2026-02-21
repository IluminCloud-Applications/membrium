import { useState } from "react";
import {
    FileStats,
    FileFilters,
    FileGrid,
    FileEmptyState,
    FilePagination,
} from "@/components/files";
import { CleanUnusedModal } from "@/components/modals/files/CleanUnusedModal";
import { FilePreviewModal } from "@/components/modals/files/FilePreviewModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import { FileLoadingSkeleton } from "@/components/files/FileLoadingSkeleton";
import type { FileItem } from "@/types/file";
import { useFilesPage } from "./useFilesPage";

export function FilesPage() {
    const {
        files,
        stats,
        diskUsage,
        totalPages,
        isLoading,
        isCleanLoading,
        isDeleteLoading,
        search,
        fileType,
        status,
        currentPage,
        setSearch,
        setFileType,
        setStatus,
        setCurrentPage,
        hasActiveFilters,
        deleteFile,
        cleanUnusedFiles,
    } = useFilesPage();

    // Modals
    const [cleanModalOpen, setCleanModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

    // Handlers
    async function handleCleanConfirm() {
        await cleanUnusedFiles();
        setCleanModalOpen(false);
    }

    async function handleDeleteConfirm() {
        if (!deleteTarget) return;
        await deleteFile(deleteTarget);
        setDeleteTarget(null);
    }

    function handlePageChange(page: number) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-folder-3-line text-primary" />
                    Arquivos
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie todos os arquivos da sua plataforma
                </p>
            </div>

            {/* Stats */}
            <FileStats
                totalFiles={stats.totalFiles}
                unusedFiles={stats.unusedFiles}
                totalSize={stats.totalSize}
                unusedSize={stats.unusedSize}
                diskUsage={diskUsage}
            />

            {/* Filters */}
            <FileFilters
                search={search}
                onSearchChange={setSearch}
                fileType={fileType}
                onFileTypeChange={setFileType}
                status={status}
                onStatusChange={setStatus}
                unusedCount={stats.unusedFiles}
                onCleanUnused={() => setCleanModalOpen(true)}
            />

            {/* Content */}
            {isLoading ? (
                <FileLoadingSkeleton />
            ) : files.length === 0 ? (
                <FileEmptyState hasFilters={hasActiveFilters} />
            ) : (
                <>
                    <FileGrid
                        files={files}
                        onView={setPreviewFile}
                        onDelete={setDeleteTarget}
                    />
                    <FilePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}

            {/* Modals */}
            <CleanUnusedModal
                open={cleanModalOpen}
                onOpenChange={setCleanModalOpen}
                onConfirm={handleCleanConfirm}
                unusedCount={stats.unusedFiles}
                isLoading={isCleanLoading}
            />

            <FilePreviewModal
                open={!!previewFile}
                onOpenChange={() => setPreviewFile(null)}
                file={previewFile}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                title="Excluir Arquivo"
                description={`Tem certeza que deseja excluir "${deleteTarget?.filename}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir Arquivo"
                isLoading={isDeleteLoading}
            />
        </div>
    );
}
