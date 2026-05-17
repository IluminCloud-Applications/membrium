import { apiClient } from "./apiClient";
import type { EventItem } from "@/types/event";

export interface EventsResponse {
    events: EventItem[];
    total_pages: number;
    current_page: number;
    total: number;
    active: number;
    total_views: number;
    total_clicks: number;
}

export interface EventCreatePayload {
    title: string;
    description: string;
    mediaType: string;
    mediaUrl: string;
    htmlContent: string;
    callLink: string;
    eventDate: string;
    sendEmail: boolean;
    sendWhatsapp: boolean;
}

export const eventService = {
    getAll: (params?: { page?: number; search?: string; status?: string; sort?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status && params.status !== "all")
            searchParams.set("status", params.status);
        if (params?.sort) searchParams.set("sort", params.sort);

        const query = searchParams.toString();
        return apiClient.get<EventsResponse>(
            `/admin/events${query ? `?${query}` : ""}`
        );
    },

    create: async (data: EventCreatePayload, mediaFile?: File | null) => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("mediaType", data.mediaType);
        formData.append("mediaUrl", data.mediaUrl);
        formData.append("htmlContent", data.htmlContent);
        formData.append("callLink", data.callLink);
        formData.append("eventDate", data.eventDate);
        formData.append("sendEmail", String(data.sendEmail));
        formData.append("sendWhatsapp", String(data.sendWhatsapp));

        if (mediaFile) {
            formData.append("media_file", mediaFile);
        }

        return apiClient.request<{ success: boolean; event: EventItem }>(
            "/admin/events",
            {
                method: "POST",
                body: formData,
                headers: {} as Record<string, string>,
            }
        );
    },

    update: async (
        id: number,
        data: EventCreatePayload,
        mediaFile?: File | null
    ) => {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("description", data.description);
        formData.append("mediaType", data.mediaType);
        formData.append("mediaUrl", data.mediaUrl);
        formData.append("htmlContent", data.htmlContent);
        formData.append("callLink", data.callLink);
        formData.append("eventDate", data.eventDate);
        formData.append("sendEmail", String(data.sendEmail));
        formData.append("sendWhatsapp", String(data.sendWhatsapp));

        if (mediaFile) {
            formData.append("media_file", mediaFile);
        }

        return apiClient.request<{ success: boolean; event: EventItem }>(
            `/admin/events/${id}`,
            {
                method: "PUT",
                body: formData,
                headers: {} as Record<string, string>,
            }
        );
    },

    toggleActive: (id: number) =>
        apiClient.post<{ success: boolean; is_active: boolean }>(
            `/admin/events/${id}/toggle`,
            {}
        ),

    delete: (id: number) =>
        apiClient.delete<{ success: boolean }>(`/admin/events/${id}`),

    trackView: (id: number) =>
        apiClient.post<{ success: boolean }>(
            `/member/events/${id}/view`,
            {}
        ),

    trackClick: (id: number) =>
        apiClient.post<{ success: boolean }>(
            `/member/events/${id}/click`,
            {}
        ),
};
