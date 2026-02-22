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

export const memberService = {
    /** Get all courses the student is enrolled in */
    getCourses: () =>
        apiClient.get<MemberCourse[]>("/member/courses"),

    /** Get courses organized by groups for the member area */
    getCoursesGrouped: () =>
        apiClient.get<MemberGroupedResponse>("/member/courses/grouped"),

    /** Get single course detail with lessons */
    getCourseDetail: (courseId: number) =>
        apiClient.get<MemberCourseDetail>(`/member/courses/${courseId}`),

    /** Get all lessons in a module for the player page */
    getModuleLessons: (courseId: number, moduleId: number) =>
        apiClient.get<MemberModuleLessonsResponse>(
            `/member/courses/${courseId}/modules/${moduleId}`
        ),

    /** Get student profile */
    getProfile: () =>
        apiClient.get<MemberProfile>("/member/profile"),

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
    completeLesson: (lessonId: number) =>
        apiClient.post<ApiResponse>(`/member/lessons/${lessonId}/complete`, {}),

    /** Unmark a lesson as completed */
    uncompleteLesson: (lessonId: number) =>
        apiClient.post<ApiResponse>(`/member/lessons/${lessonId}/uncomplete`, {}),

    /** Search content */
    search: (query: string) =>
        apiClient.get<SearchResult[]>(`/member/search?q=${encodeURIComponent(query)}`),

    /* ======= SHOWCASE (Vitrine) ======= */

    /** Get active showcases for the member */
    getShowcases: () =>
        apiClient.get<MemberShowcaseItem[]>("/member/showcase"),

    /** Track showcase view */
    trackShowcaseView: (showcaseId: number) =>
        apiClient.post<ApiResponse>(`/member/showcase/${showcaseId}/view`, {}),

    /** Track showcase click */
    trackShowcaseClick: (showcaseId: number) =>
        apiClient.post<ApiResponse>(`/member/showcase/${showcaseId}/click`, {}),

    /* ======= PROMOTION (Promoção) ======= */

    /** Get all currently active promotions */
    getActivePromotions: () =>
        apiClient.get<{ promotions: MemberActivePromotion[] }>("/member/promotions/active"),

    /** Track promotion view */
    trackPromotionView: (promoId: number) =>
        apiClient.post<ApiResponse>(`/member/promotions/${promoId}/view`, {}),

    /** Track promotion CTA click */
    trackPromotionClick: (promoId: number) =>
        apiClient.post<ApiResponse>(`/member/promotions/${promoId}/click`, {}),
};

