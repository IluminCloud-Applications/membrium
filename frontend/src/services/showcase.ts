import { apiClient } from "./apiClient";

/* ============================================
   SHOWCASE TYPES (API response shapes)
   ============================================ */

export interface ShowcaseItemResponse {
    id: number;
    name: string;
    description: string;
    image: string | null;
    url: string;
    status: "active" | "inactive";
    priority: number;
    courses: { id: number; name: string }[];
    created_at: string | null;
}

export interface ShowcaseCreatePayload {
    name: string;
    description: string;
    url: string;
    priority: number;
    course_ids: number[];
}

export interface ShowcaseUpdatePayload {
    name?: string;
    description?: string;
    url?: string;
    priority?: number;
    course_ids?: number[];
}

/* ============================================
   SHOWCASE SERVICE
   ============================================ */

export const showcaseService = {
    /** List all showcase items */
    getAll: () =>
        apiClient.get<ShowcaseItemResponse[]>("/showcase/items"),

    /** Create a new showcase item */
    create: (data: ShowcaseCreatePayload) =>
        apiClient.post<{ success: boolean; item: ShowcaseItemResponse }>(
            "/showcase/items",
            data
        ),

    /** Update an existing showcase item */
    update: (id: number, data: ShowcaseUpdatePayload) =>
        apiClient.put<{ success: boolean; item: ShowcaseItemResponse }>(
            `/showcase/items/${id}`,
            data
        ),

    /** Upload image for a showcase item */
    uploadImage: async (id: number, file: File) => {
        const formData = new FormData();
        formData.append("image", file);

        return apiClient.request<{ success: boolean; image: string }>(
            `/showcase/items/${id}/image`,
            {
                method: "POST",
                body: formData,
                headers: {} as Record<string, string>,
            }
        );
    },

    /** Toggle showcase item status */
    toggleStatus: (id: number, status: "active" | "inactive") =>
        apiClient.patch<{ success: boolean; status: string }>(
            `/showcase/items/${id}/status`,
            { status }
        ),

    /** Delete a showcase item */
    delete: (id: number) =>
        apiClient.delete<{ success: boolean }>(`/showcase/items/${id}`),

    /** Get total analytics (views + clicks) for all showcase items */
    getAnalyticsTotal: () =>
        apiClient.get<{
            success: boolean;
            analytics: { showcase_id: number; total_views: number; total_conversions: number }[];
        }>("/showcase/analytics/total"),
};
