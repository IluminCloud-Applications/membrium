import { apiClient } from "./apiClient";

/* ============================================
   API Response Types
   ============================================ */

export interface AttachmentResponse {
    id: number;
    name: string;
    url?: string;
}

export interface LessonResponse {
    id: number;
    module_id: number;
    title: string;
    description: string;
    video_platform: string;
    video_url: string;
    order: number;
    has_cta: boolean;
    cta_text: string;
    cta_url: string;
    cta_delay: number;
    attachments: AttachmentResponse[];
}

export interface ModuleResponse {
    id: number;
    course_id: number;
    name: string;
    image: string | null;
    order: number;
    unlock_after_days: number;
    lessons: LessonResponse[];
}

export interface CourseFullResponse {
    id: number;
    name: string;
    description: string;
    modules: ModuleResponse[];
    cover: { desktop: string | null; mobile: string | null };
    menu_items: MenuItemResponse[];
}

export interface MenuItemResponse {
    name: string;
    url: string;
    icon: string;
    order: number;
}

/* ============================================
   Service
   ============================================ */

const BASE = "/course-modification";

export const courseModificationService = {
    /** Get full course for editing */
    getCourse: (courseId: number) =>
        apiClient.get<CourseFullResponse>(`${BASE}/${courseId}`),

    /* ---------- Cover ---------- */

    /** Update cover images */
    updateCover: (courseId: number, formData: FormData) =>
        apiClient.request<{ success: boolean; cover: { desktop: string | null; mobile: string | null } }>(
            `${BASE}/${courseId}/cover`, { method: "PUT", body: formData, headers: {} }
        ),

    /* ---------- Menu ---------- */

    /** Replace all menu items */
    updateMenu: (courseId: number, items: MenuItemResponse[]) =>
        apiClient.post<{ success: boolean; menu_items: MenuItemResponse[] }>(
            `${BASE}/${courseId}/menu`, { items }
        ),

    /* ---------- Modules ---------- */

    createModule: (courseId: number, formData: FormData) =>
        apiClient.request<{ success: boolean; module: ModuleResponse }>(
            `${BASE}/${courseId}/modules`, { method: "POST", body: formData, headers: {} }
        ),

    updateModule: (moduleId: number, formData: FormData) =>
        apiClient.request<{ success: boolean }>(
            `${BASE}/modules/${moduleId}`, { method: "PUT", body: formData, headers: {} }
        ),

    deleteModule: (moduleId: number) =>
        apiClient.delete<{ success: boolean }>(`${BASE}/modules/${moduleId}`),

    reorderModules: (order: number[]) =>
        apiClient.post<{ success: boolean }>(`${BASE}/modules/reorder`, { order }),

    /* ---------- Lessons ---------- */

    createLesson: (moduleId: number, formData: FormData) =>
        apiClient.request<{ success: boolean; lesson: LessonResponse }>(
            `${BASE}/modules/${moduleId}/lessons`, { method: "POST", body: formData, headers: {} }
        ),

    updateLesson: (lessonId: number, formData: FormData) =>
        apiClient.request<{ success: boolean; lesson: LessonResponse }>(
            `${BASE}/lessons/${lessonId}`, { method: "PUT", body: formData, headers: {} }
        ),

    deleteLesson: (lessonId: number) =>
        apiClient.delete<{ success: boolean }>(`${BASE}/lessons/${lessonId}`),

    reorderLessons: (order: number[]) =>
        apiClient.post<{ success: boolean }>(`${BASE}/lessons/reorder`, { order }),

    deleteLessonFile: (lessonId: number, fileId: number) =>
        apiClient.delete<{ success: boolean }>(`${BASE}/lessons/${lessonId}/files/${fileId}`),
};
