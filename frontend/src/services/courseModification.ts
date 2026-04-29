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

export interface BannerPromptVariant {
    objective: string;
    design_style: string;
    lighting_and_atmosphere: string;
    background: string;
    ui_ux_elements: string;
    main_subject_instruction: string;
    parameters: {
        Module_Title: string;
        Course_Name: string;
        Color_Palette: string;
        Aspect_Ratio: string;
    };
    midjourney_ready_prompt: string;
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

    generateBannerPrompt: (moduleName: string, moduleDescription: string, courseName?: string, provider?: string, model?: string) =>
        apiClient.post<{
            success: boolean;
            prompts: {
                with_expert: BannerPromptVariant;
                without_expert: BannerPromptVariant;
            };
        }>(`${BASE}/banner-prompt`, { module_name: moduleName, module_description: moduleDescription, course_name: courseName, provider, model }),

    /* ---------- Lessons ---------- */

    createLesson: (moduleId: number, formData: FormData) =>
        apiClient.request<{
            success: boolean;
            lesson: LessonResponse;
            transcript_imported: boolean;
            transcript_message: string;
        }>(
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

    /* ---------- Export / Import ---------- */

    /** Export course as ZIP download */
    exportCourse: (courseId: number, courseName: string) => {
        const safeName = courseName.replace(/\s+/g, '_').toLowerCase().slice(0, 30);
        return apiClient.downloadBlob(
            `${BASE}/${courseId}/export`,
            `curso_${safeName}.zip`
        );
    },

    /** Import course from ZIP file */
    importCourse: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.request<{ success: boolean; message: string; course_id: number }>(
            `${BASE}/import`,
            { method: 'POST', body: formData, headers: {} }
        );
    },

    /** Auto-fill all lesson info with AI (transcript → metadata + FAQ + description in parallel) */
    autoFillLesson: (
        lessonId: number,
        options: { provider?: string; model?: string; num_questions?: number; skip_if_exists?: boolean } = {}
    ) =>
        apiClient.post<AutoFillLessonResponse>(`${BASE}/lessons/${lessonId}/auto-fill`, options),

    /** Pre-flight: get per-lesson status to decide which lessons need processing */
    getAutoFillStatus: (courseId: number) =>
        apiClient.get<AutoFillStatusResponse>(`${BASE}/courses/${courseId}/auto-fill-status`),
};

export interface AutoFillLessonResponse {
    success: boolean;
    lessonId: number;
    lessonTitle: string;
    message: string;
    description: string;
    faqCount: number;
    steps: {
        transcript?: string;
        metadata?: string;
        faq?: string;
        description?: string;
    };
    errors: string[];
}

export interface LessonAutoFillStatus {
    lessonId: number;
    lessonTitle: string;
    moduleId: number;
    moduleName: string;
    videoType: string;
    isYoutube: boolean;
    isCloudflare: boolean;
    hasTranscript: boolean;
    hasDescription: boolean;
    hasFaq: boolean;
    canProcess: boolean;
    needsAssemblyAI: boolean;
    assemblyAIOk: boolean;
    needsAction: boolean;
    skipReason: string | null;
}

export interface AutoFillStatusResponse {
    success: boolean;
    config: {
        aiConfigured: boolean;
        assemblyAIConfigured: boolean;
    };
    summary: {
        total: number;
        processable: number;
        skippedHasDescription: number;
        blocked: number;
    };
    lessons: LessonAutoFillStatus[];
}

