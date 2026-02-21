import { useState, useEffect, useCallback, useRef } from "react";
import { fileService } from "@/services/fileService";
import type {
    FileItem,
    FileStats,
    DiskUsage,
    FileType,
    FileStatus,
} from "@/types/file";

interface UseFilesPageReturn {
    /* Data */
    files: FileItem[];
    stats: FileStats;
    diskUsage: DiskUsage | null;
    totalPages: number;
    isLoading: boolean;
    isCleanLoading: boolean;
    isDeleteLoading: boolean;

    /* Filters */
    search: string;
    fileType: FileType;
    status: FileStatus;
    currentPage: number;
    setSearch: (v: string) => void;
    setFileType: (v: FileType) => void;
    setStatus: (v: FileStatus) => void;
    setCurrentPage: (v: number) => void;
    hasActiveFilters: boolean;

    /* Actions */
    deleteFile: (file: FileItem) => Promise<void>;
    cleanUnusedFiles: () => Promise<void>;
    refresh: () => void;
}

const EMPTY_STATS: FileStats = {
    totalFiles: 0,
    unusedFiles: 0,
    totalSize: 0,
    unusedSize: 0,
};

export function useFilesPage(): UseFilesPageReturn {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [stats, setStats] = useState<FileStats>(EMPTY_STATS);
    const [diskUsage, setDiskUsage] = useState<DiskUsage | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCleanLoading, setIsCleanLoading] = useState(false);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [fileType, setFileType] = useState<FileType>("all");
    const [status, setStatus] = useState<FileStatus>("all");
    const [currentPage, setCurrentPage] = useState(1);

    const hasActiveFilters =
        search.trim() !== "" || fileType !== "all" || status !== "all";

    /* ---- Debounce search ---- */
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    /* ---- Reset page on filter change ---- */
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setCurrentPage(1);
    }, [debouncedSearch, fileType, status]);

    /* ---- Fetch files ---- */
    const fetchFiles = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fileService.getFiles({
                page: currentPage,
                fileType,
                status,
                search: debouncedSearch.trim() || undefined,
            });
            setFiles(data.files);
            setStats(data.stats);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error("Erro ao buscar arquivos:", err);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, fileType, status, debouncedSearch]);

    /* ---- Fetch disk usage ---- */
    const fetchDiskUsage = useCallback(async () => {
        try {
            const data = await fileService.getDiskUsage();
            setDiskUsage(data);
        } catch (err) {
            console.error("Erro ao buscar uso de disco:", err);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    useEffect(() => {
        fetchDiskUsage();
    }, [fetchDiskUsage]);

    /* ---- Actions ---- */
    const deleteFile = async (file: FileItem) => {
        setIsDeleteLoading(true);
        try {
            await fileService.deleteFile(file.id, file.filename);
            await fetchFiles();
            await fetchDiskUsage();
        } catch (err) {
            console.error("Erro ao excluir arquivo:", err);
            throw err;
        } finally {
            setIsDeleteLoading(false);
        }
    };

    const cleanUnusedFiles = async () => {
        setIsCleanLoading(true);
        try {
            await fileService.cleanUnusedFiles();
            await fetchFiles();
            await fetchDiskUsage();
        } catch (err) {
            console.error("Erro ao limpar arquivos:", err);
            throw err;
        } finally {
            setIsCleanLoading(false);
        }
    };

    const refresh = () => {
        fetchFiles();
        fetchDiskUsage();
    };

    return {
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
        refresh,
    };
}
