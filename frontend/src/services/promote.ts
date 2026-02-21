import { apiClient } from "./apiClient";
import type { PromoteItem } from "@/types/promote";

/* ============================================
   PROMOTE SERVICE — API calls for promotions
   ============================================ */

export interface PromotionsResponse {
    promotions: PromoteItem[];
    total_pages: number;
    current_page: number;
    total: number;
    active: number;
    total_views: number;
    total_clicks: number;
}

export interface PromoteCreatePayload {
    title: string;
    description: string;
    mediaType: string;
    mediaUrl: string;
    videoSource: string;
    startDate: string;
    endDate: string;
    hasCta: boolean;
    ctaText: string;
    ctaUrl: string;
    ctaDelay: number;
    hideVideoControls: boolean;
}

export const promoteService = {
    /** List promotions with pagination, search, and status filter */
    getAll: (params?: { page?: number; search?: string; status?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status && params.status !== "all")
            searchParams.set("status", params.status);

        const query = searchParams.toString();
        return apiClient.get<PromotionsResponse>(
            `/promote${query ? `?${query}` : ""}`
        );
    },

    /** Create a new promotion */
    create: async (data: PromoteCreatePayload, mediaFile?: File | null) => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("mediaType", data.mediaType);
        formData.append("video_source", data.videoSource);
        formData.append("media_url", data.mediaUrl);
        formData.append("start_date", data.startDate);
        formData.append("end_date", data.endDate);
        formData.append("has_cta", String(data.hasCta));
        formData.append("cta_text", data.ctaText);
        formData.append("cta_url", data.ctaUrl);
        formData.append("button_delay", String(data.ctaDelay));
        formData.append("hide_video_controls", String(data.hideVideoControls));

        if (mediaFile) {
            formData.append("media_file", mediaFile);
        }

        return apiClient.request<{ success: boolean; promotion: PromoteItem }>(
            "/promote",
            {
                method: "POST",
                body: formData,
                headers: {} as Record<string, string>,
            }
        );
    },

    /** Update an existing promotion */
    update: async (
        id: number,
        data: PromoteCreatePayload,
        mediaFile?: File | null
    ) => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("mediaType", data.mediaType);
        formData.append("video_source", data.videoSource);
        formData.append("media_url", data.mediaUrl);
        formData.append("start_date", data.startDate);
        formData.append("end_date", data.endDate);
        formData.append("has_cta", String(data.hasCta));
        formData.append("cta_text", data.ctaText);
        formData.append("cta_url", data.ctaUrl);
        formData.append("button_delay", String(data.ctaDelay));
        formData.append("hide_video_controls", String(data.hideVideoControls));

        if (mediaFile) {
            formData.append("media_file", mediaFile);
        }

        return apiClient.request<{ success: boolean; promotion: PromoteItem }>(
            `/promote/${id}`,
            {
                method: "PUT",
                body: formData,
                headers: {} as Record<string, string>,
            }
        );
    },

    /** Toggle active status */
    toggleActive: (id: number) =>
        apiClient.post<{ success: boolean; is_active: boolean }>(
            `/promote/${id}/toggle`,
            {}
        ),

    /** Delete a promotion */
    delete: (id: number) =>
        apiClient.delete<{ success: boolean }>(`/promote/${id}`),

    /** Track a view (public endpoint) */
    trackView: (id: number) =>
        apiClient.post<{ success: boolean }>(
            `/promote/${id}/analytics/view`,
            {}
        ),

    /** Track a click (public endpoint) */
    trackClick: (id: number) =>
        apiClient.post<{ success: boolean }>(
            `/promote/${id}/analytics/click`,
            {}
        ),
};
