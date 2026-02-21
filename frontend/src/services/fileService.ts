import { apiClient } from "./apiClient";
import type { FilesResponse, DiskUsage, FileType, FileStatus } from "@/types/file";

interface GetFilesParams {
    page?: number;
    fileType?: FileType;
    status?: FileStatus;
    search?: string;
}

export const fileService = {
    async getFiles(params: GetFilesParams = {}): Promise<FilesResponse> {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set("page", String(params.page));
        if (params.fileType && params.fileType !== "all") searchParams.set("fileType", params.fileType);
        if (params.status && params.status !== "all") searchParams.set("status", params.status);
        if (params.search) searchParams.set("search", params.search);

        const query = searchParams.toString();
        return apiClient.get<FilesResponse>(`/files/${query ? `?${query}` : ""}`);
    },

    async deleteFile(fileId: number, filename: string): Promise<void> {
        const endpoint =
            fileId === -1
                ? `/files/-1?filename=${encodeURIComponent(filename)}`
                : `/files/${fileId}`;

        await apiClient.delete(endpoint);
    },

    async cleanUnusedFiles(): Promise<{ deleted: number; freedSpace: number }> {
        return apiClient.delete<{ deleted: number; freedSpace: number }>("/files/clean-unused");
    },

    async getDiskUsage(): Promise<DiskUsage> {
        return apiClient.get<DiskUsage>("/files/disk-usage");
    },
};
