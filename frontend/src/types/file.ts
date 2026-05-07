/* ============================================
   FILE MANAGER TYPES
   ============================================ */

export interface FileItem {
    id: number;
    filename: string;
    is_used: boolean;
    used_in: string[];
    size: number;
    upload_date: string;
    /** null = not an image; true = compressed; false = not yet compressed */
    is_compressed: boolean | null;
}

export interface FileStats {
    totalFiles: number;
    unusedFiles: number;
    totalSize: number;
    unusedSize: number;
}

export interface DiskUsage {
    used: number;
    total: number;
    free: number;
    usedPercentage: number;
}

export interface FilesResponse {
    files: FileItem[];
    totalPages: number;
    currentPage: number;
    stats: FileStats;
}

export type FileType = "all" | "image" | "document";
export type FileStatus = "all" | "used" | "unused";
