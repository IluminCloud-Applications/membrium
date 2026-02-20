import type { FilesResponse, DiskUsage, FileType, FileStatus } from "@/types/file";

const API_BASE = "/admin";

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

        const response = await fetch(`${API_BASE}/files?${searchParams.toString()}`);
        if (!response.ok) throw new Error("Falha ao buscar arquivos");
        return response.json();
    },

    async deleteFile(fileId: number, filename: string): Promise<void> {
        const url =
            fileId === -1
                ? `${API_BASE}/files/-1?filename=${encodeURIComponent(filename)}`
                : `${API_BASE}/files/${fileId}`;

        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Falha ao excluir arquivo");
        }
    },

    async cleanUnusedFiles(): Promise<{ deleted: number; freedSpace: number }> {
        const response = await fetch(`${API_BASE}/files/clean-unused`, {
            method: "DELETE",
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Falha ao limpar arquivos");
        }
        return response.json();
    },

    async getDiskUsage(): Promise<DiskUsage> {
        const response = await fetch(`${API_BASE}/disk-usage`);
        if (!response.ok) throw new Error("Falha ao buscar espaço em disco");
        return response.json();
    },
};
