import { apiClient } from "./apiClient";
import type {
    MemberCourse,
    MemberCourseDetail,
    MemberProfile,
    MemberProgress,
    MemberModuleLessonsResponse,
    MemberGroupedResponse,
    SearchResult,
    MemberShowcaseItem,
    MemberActivePromotion,
} from "@/types/member";
import type { ApiResponse } from "@/types/api";

/** Appends ?preview=true to the endpoint if preview mode is enabled */
function withPreview(endpoint: string, preview?: boolean): string {
    if (!preview) return endpoint;
    const separator = endpoint.includes("?") ? "&" : "?";
    return `${endpoint}${separator}preview=true`;
}

export const memberService = {
    /** Get all courses the student is enrolled in */
    getCourses: (preview?: boolean) =>
        apiClient.get<MemberCourse[]>(withPreview("/member/courses", preview)),

    /** Get courses organized by groups for the member area */
    getCoursesGrouped: (preview?: boolean) =>
        apiClient.get<MemberGroupedResponse>(withPreview("/member/courses/grouped", preview)),

    /** Get single course detail with lessons */
    getCourseDetail: (courseId: number, preview?: boolean) =>
        apiClient.get<MemberCourseDetail>(withPreview(`/member/courses/${courseId}`, preview)),

    /** Get all lessons in a module for the player page */
    getModuleLessons: (courseId: number, moduleId: number, preview?: boolean) =>
        apiClient.get<MemberModuleLessonsResponse>(
            withPreview(`/member/courses/${courseId}/modules/${moduleId}`, preview)
        ),

    /** Get student profile */
    getProfile: (preview?: boolean) =>
        apiClient.get<MemberProfile>(withPreview("/member/profile", preview)),

    /** Update student profile (name, phone) */
    updateProfile: (data: { name: string; phone: string }) =>
        apiClient.put<ApiResponse>("/member/profile", data),

    /** Update student password */
    updatePassword: (newPassword: string) =>
        apiClient.put<ApiResponse>("/member/profile/password", {
            new_password: newPassword,
        }),

    /** Get overall progress */
    getProgress: () =>
        apiClient.get<MemberProgress>("/member/progress"),

    /** Mark a lesson as completed */
    completeLesson: (lessonId: number, preview?: boolean) =>
        apiClient.post<ApiResponse>(withPreview(`/member/lessons/${lessonId}/complete`, preview), {}),

    /** Unmark a lesson as completed */
    uncompleteLesson: (lessonId: number, preview?: boolean) =>
        apiClient.post<ApiResponse>(withPreview(`/member/lessons/${lessonId}/uncomplete`, preview), {}),

    /** Search content */
    search: (query: string, preview?: boolean) =>
        apiClient.get<SearchResult[]>(withPreview(`/member/search?q=${encodeURIComponent(query)}`, preview)),

    /* ======= SHOWCASE (Vitrine) ======= */

    /** Get active showcases for the member */
    getShowcases: (preview?: boolean) =>
        apiClient.get<MemberShowcaseItem[]>(withPreview("/member/showcase", preview)),

    /** Track showcase view */
    trackShowcaseView: (showcaseId: number, preview?: boolean) =>
        apiClient.post<ApiResponse>(withPreview(`/member/showcase/${showcaseId}/view`, preview), {}),

    /** Track showcase click */
    trackShowcaseClick: (showcaseId: number, preview?: boolean) =>
        apiClient.post<ApiResponse>(withPreview(`/member/showcase/${showcaseId}/click`, preview), {}),

    /* ======= PROMOTION (Promoção) ======= */

    /** Get all currently active promotions */
    getActivePromotions: (preview?: boolean) =>
        apiClient.get<{ promotions: MemberActivePromotion[] }>(withPreview("/member/promotions/active", preview)),

    /** Track promotion view */
    trackPromotionView: (promoId: number, preview?: boolean) =>
        apiClient.post<ApiResponse>(withPreview(`/member/promotions/${promoId}/view`, preview), {}),

    /** Track promotion CTA click */
    trackPromotionClick: (promoId: number, preview?: boolean) =>
        apiClient.post<ApiResponse>(withPreview(`/member/promotions/${promoId}/click`, preview), {}),
};
