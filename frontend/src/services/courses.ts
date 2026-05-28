import { apiClient } from "./apiClient";

/* ============================================
   COURSES TYPES (API responses)
   ============================================ */

export interface CourseResponse {
    id: number;
    uuid: string;
    name: string;
    description: string;
    image: string | null;
    checkout_url?: string | null;
    category: string;
    is_published: boolean;
    students_count: number;
    lessons_count: number;
    created_at: string | null;
    order?: number;
}

export interface CourseSimple {
    id: number;
    name: string;
}

export interface MutationResult {
    success: boolean;
    message?: string;
}

/* ============================================
   COURSES SERVICE
   ============================================ */

export const coursesService = {
    /** List all courses with stats */
    list: () => apiClient.get<CourseResponse[]>("/courses"),

    /** Get a single course */
    get: (id: number) => apiClient.get<CourseResponse>(`/courses/${id}`),

    /** Get simple list for dropdowns */
    listSimple: () => apiClient.get<CourseSimple[]>("/courses/simple"),

    /** Create a new course (FormData — supports file upload) */
    create: (formData: FormData) =>
        apiClient.request<MutationResult>("/courses", {
            method: "POST",
            body: formData,
            headers: {}, // let browser set Content-Type for FormData
        }),

    /** Update a course (FormData — supports file upload) */
    update: (id: number, formData: FormData) =>
        apiClient.request<MutationResult>(`/courses/${id}`, {
            method: "PUT",
            body: formData,
            headers: {},
        }),

    /** Publish a draft course */
    publish: (id: number) => {
        const formData = new FormData();
        formData.append("is_published", "true");
        return apiClient.request<MutationResult>(`/courses/${id}`, {
            method: "PUT",
            body: formData,
            headers: {},
        });
    },

    /** Delete a course */
    delete: (id: number) =>
        apiClient.request<MutationResult>(`/courses/${id}`, {
            method: "DELETE",
        }),

    /** Reorder courses */
    reorder: (ids: number[]) =>
        apiClient.post<MutationResult>("/courses/reorder", { ids }),
};
