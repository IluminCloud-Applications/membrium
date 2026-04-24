import { apiClient } from "./apiClient";

/* ============================================
   TELEGRAM SERVICE TYPES
   ============================================ */

export interface TelegramStatus {
    enabled: boolean;
    connected: boolean;
    api_id: string;
    canal_id: string;
    canal_nome: string;
    phone: string;
}

export interface TelegramUploadResult {
    index: number;
    title: string;
    success: boolean;
    message_id?: number;
    canal_id?: number;
    lesson_id?: number;
    duracao_segundos?: number;
    error?: string;
}

interface SendCodeResponse {
    success: boolean;
    message: string;
}

interface VerifyCodeResponse {
    success: boolean;
    message: string;
}

interface CreateChannelResponse {
    success: boolean;
    canal_id?: number;
    canal_nome?: string;
    invite_link?: string;
    message: string;
}

interface SingleUploadResponse {
    success: boolean;
    message_id?: number;
    canal_id?: number;
    lesson_id?: number;
    duracao_segundos?: number;
    tamanho_bytes?: number;
    video_url?: string;
    message: string;
}

interface BulkUploadResponse {
    success: boolean;
    message: string;
    results: TelegramUploadResult[];
}

/* ============================================
   TELEGRAM SERVICE
   ============================================ */

export const telegramService = {
    /** Get current Telegram integration status */
    getStatus: () =>
        apiClient.get<TelegramStatus>("/telegram/status"),

    /** Send SMS verification code to phone number */
    sendCode: (api_id: string, api_hash: string, phone: string) =>
        apiClient.post<SendCodeResponse>("/telegram/auth/send-code", {
            api_id,
            api_hash,
            phone,
        }),

    /** Verify SMS code and generate session string. Pass cloudPassword if 2FA is active. */
    verifyCode: (code: string, cloudPassword?: string) =>
        apiClient.post<VerifyCodeResponse>("/telegram/auth/verify-code", {
            code,
            cloud_password: cloudPassword || undefined,
        }),

    /** Disconnect Telegram account */
    disconnect: () =>
        apiClient.post<{ success: boolean; message: string }>("/telegram/disconnect", {}),

    /** Create a private storage channel */
    createChannel: (title?: string) =>
        apiClient.post<CreateChannelResponse>("/telegram/channel/create", {
            title: title || "Membrium Vídeos",
        }),

    /** Upload a single video to Telegram */
    uploadSingle: (video: File, title: string, lessonId?: number) => {
        const formData = new FormData();
        formData.append("video", video);
        formData.append("title", title);
        if (lessonId) formData.append("lesson_id", String(lessonId));

        return apiClient.request<SingleUploadResponse>("/telegram/upload", {
            method: "POST",
            body: formData,
            headers: {},
        });
    },

    /** Upload multiple videos in bulk */
    uploadBulk: (videos: File[], titles: string[], moduleId: number) => {
        const formData = new FormData();
        for (const video of videos) formData.append("videos", video);
        formData.append("titles", JSON.stringify(titles));
        formData.append("module_id", String(moduleId));

        return apiClient.request<BulkUploadResponse>("/telegram/upload/bulk", {
            method: "POST",
            body: formData,
            headers: {},
        });
    },

    /** Build the stream URL for a lesson (used by the video player) */
    getStreamUrl: (lessonId: number) =>
        `/api/telegram/stream/${lessonId}`,
};
