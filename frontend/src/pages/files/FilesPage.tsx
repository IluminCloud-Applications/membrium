import { useState, useMemo } from "react";
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
import type { FileItem, FileType, FileStatus } from "@/types/file";
import { mockFiles, mockDiskUsage } from "./mock-data";

const ITEMS_PER_PAGE = 12;

export function FilesPage() {
    const [files] = useState<FileItem[]>(mockFiles);
    const [diskUsage] = useState(mockDiskUsage);

    // Filters
    const [search, setSearch] = useState("");
    const [fileType, setFileType] = useState<FileType>("all");
    const [status, setStatus] = useState<FileStatus>("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [cleanModalOpen, setCleanModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);

    // Filtered files
    const filteredFiles = useMemo(() => {
        let result = [...files];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter((f) =>
                f.filename.toLowerCase().includes(q)
            );
        }

        if (fileType !== "all") {
            result = result.filter((f) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(f.filename);
                return fileType === "image" ? isImage : !isImage;
            });
        }

        if (status !== "all") {
            result = result.filter((f) =>
                status === "used" ? f.is_used : !f.is_used
            );
        }

        return result;
    }, [files, search, fileType, status]);

    // Stats
    const stats = useMemo(() => {
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        const unusedCount = files.filter((f) => !f.is_used).length;
        return { totalFiles: files.length, unusedFiles: unusedCount, totalSize };
    }, [files]);

    // Pagination
    const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
    const paginatedFiles = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredFiles.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredFiles, currentPage]);

    const hasActiveFilters =
        search.trim() !== "" || fileType !== "all" || status !== "all";

    // Handlers
    function handleCleanConfirm() {
        console.log("Clean unused files");
        setCleanModalOpen(false);
    }

    function handleDeleteConfirm() {
        console.log("Delete file:", deleteTarget?.filename);
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
                diskUsage={diskUsage}
            />

            {/* Filters */}
            <FileFilters
                search={search}
                onSearchChange={(v) => {
                    setSearch(v);
                    setCurrentPage(1);
                }}
                fileType={fileType}
                onFileTypeChange={(v) => {
                    setFileType(v);
                    setCurrentPage(1);
                }}
                status={status}
                onStatusChange={(v) => {
                    setStatus(v);
                    setCurrentPage(1);
                }}
                unusedCount={stats.unusedFiles}
                onCleanUnused={() => setCleanModalOpen(true)}
            />

            {/* Content */}
            {paginatedFiles.length === 0 ? (
                <FileEmptyState hasFilters={hasActiveFilters} />
            ) : (
                <>
                    <FileGrid
                        files={paginatedFiles}
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
            />
        </div>
    );
}
