import { apiClient } from "./apiClient";

/* ============================================
   YOUTUBE UPLOAD TYPES
   ============================================ */

export interface YouTubeUploadResult {
    index: number;
    title: string;
    success: boolean;
    video_id?: string;
    video_url?: string;
    lesson_id?: number;
    error?: string;
}

interface SingleUploadResponse {
    success: boolean;
    video_id?: string;
    video_url?: string;
    message: string;
}

interface BulkUploadResponse {
    success: boolean;
    message: string;
    results: YouTubeUploadResult[];
}

/* ============================================
   YOUTUBE UPLOAD SERVICE
   ============================================ */

export const youtubeUploadService = {
    /** Upload a single video to YouTube */
    uploadSingle: (video: File, title: string, lessonId?: number) => {
        const formData = new FormData();
        formData.append("video", video);
        formData.append("title", title);
        if (lessonId) formData.append("lesson_id", String(lessonId));

        return apiClient.request<SingleUploadResponse>("/youtube/upload", {
            method: "POST",
            body: formData,
            headers: {},
        });
    },

    /** Upload multiple videos in bulk */
    uploadBulk: (videos: File[], titles: string[], moduleId: number) => {
        const formData = new FormData();
        for (const video of videos) {
            formData.append("videos", video);
        }
        formData.append("titles", JSON.stringify(titles));
        formData.append("module_id", String(moduleId));

        return apiClient.request<BulkUploadResponse>("/youtube/upload/bulk", {
            method: "POST",
            body: formData,
            headers: {},
        });
    },
};
