import { apiClient } from "./apiClient";
import type {
    FAQItem,
    FAQLessonGroup,
    FAQCourse,
    FAQModule,
    FAQLesson,
} from "@/types/faq";

/* ============================================
   FAQ RESPONSE TYPES
   ============================================ */

export interface FAQStatsResponse {
    totalFaqs: number;
    lessonsWithFaq: number;
    averageFaqPerLesson: number;
}

export interface FAQCreatePayload {
    lesson_id: number;
    faqs: { question: string; answer: string }[];
}

export interface FAQUpdatePayload {
    faqs: { question: string; answer: string }[];
}

export interface FAQAIGeneratePayload {
    lesson_id: number;
    provider: string;
    model: string;
    num_questions?: number;
}

export interface FAQAIGenerateResponse {
    success: boolean;
    faqs?: { question: string; answer: string }[];
    message?: string;
}

/** Lesson status for the auto-FAQ modal */
export interface FAQPendingLesson {
    lessonId: number;
    lessonName: string;
    moduleId: number;
    moduleName: string;
    courseId: number;
    courseName: string;
    hasTranscript: boolean;
    hasFaq: boolean;
    isYoutube: boolean;
    canGenerate: boolean;
    videoUrl: string;
    faqCount: number;
}

/* ============================================
   FAQ SERVICE
   ============================================ */

export const faqService = {
    /** Get all FAQ groups for drill-down navigation */
    getGroups: () =>
        apiClient.get<FAQLessonGroup[]>("/faq/groups"),

    /** Get FAQ statistics */
    getStats: () =>
        apiClient.get<FAQStatsResponse>("/faq/stats"),

    /** Get FAQs for a specific lesson */
    getLessonFaqs: (lessonId: number) =>
        apiClient.get<FAQItem[]>(`/faq/lesson/${lessonId}`),

    /** Create FAQs for a lesson */
    create: (data: FAQCreatePayload) =>
        apiClient.post<{ success: boolean; message: string }>(
            "/faq/create",
            data
        ),

    /** Update all FAQs for a lesson */
    update: (lessonId: number, data: FAQUpdatePayload) =>
        apiClient.put<{ success: boolean; message: string }>(
            `/faq/update/${lessonId}`,
            data
        ),

    /** Delete all FAQs for a lesson */
    delete: (lessonId: number) =>
        apiClient.delete<{ success: boolean; message: string }>(
            `/faq/lesson/${lessonId}`
        ),

    /** Get all courses (for modal selector) */
    getCourses: () =>
        apiClient.get<FAQCourse[]>("/faq/courses"),

    /** Get modules for a course (for modal selector) */
    getModules: (courseId: number) =>
        apiClient.get<FAQModule[]>(`/faq/courses/${courseId}/modules`),

    /** Get lessons for a module (only without existing FAQs) */
    getLessons: (moduleId: number) =>
        apiClient.get<FAQLesson[]>(`/faq/modules/${moduleId}/lessons`),

    /** Get all lessons with FAQ/transcript/youtube status (for auto-FAQ modal) */
    getPendingLessons: () =>
        apiClient.get<FAQPendingLesson[]>("/faq/ai/pending-lessons"),

    /** Generate FAQs using AI */
    generateWithAI: (data: FAQAIGeneratePayload) =>
        apiClient.post<FAQAIGenerateResponse>("/faq/ai/generate", data),
};

