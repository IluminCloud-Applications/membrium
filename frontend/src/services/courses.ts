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
    category: string;
    is_published: boolean;
    students_count: number;
    lessons_count: number;
    created_at: string | null;
}

export interface CourseSimple {
    id: number;
    name: string;
}

export interface CourseGroupResponse {
    id: number;
    name: string;
    principal_course_id: number | null;
    course_ids: number[];
    created_at: string | null;
}

export interface GroupFormPayload {
    name: string;
    principal_course_id: number | null;
    course_ids: number[];
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

    /** Delete a course */
    delete: (id: number) =>
        apiClient.request<MutationResult>(`/courses/${id}`, {
            method: "DELETE",
        }),

    /* ---------- Groups ---------- */

    /** List all course groups */
    listGroups: () =>
        apiClient.get<CourseGroupResponse[]>("/courses/groups"),

    /** Create a course group */
    createGroup: (data: GroupFormPayload) =>
        apiClient.post<{ success: boolean; group: CourseGroupResponse }>(
            "/courses/groups",
            data
        ),

    /** Update a course group */
    updateGroup: (id: number, data: GroupFormPayload) =>
        apiClient.request<{ success: boolean; group: CourseGroupResponse }>(
            `/courses/groups/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            }
        ),

    /** Delete a course group */
    deleteGroup: (id: number) =>
        apiClient.request<MutationResult>(`/courses/groups/${id}`, {
            method: "DELETE",
        }),
};
