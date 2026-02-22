import { apiClient } from "./apiClient";
import type {
    MemberCourse,
    MemberCourseDetail,
    MemberProfile,
    MemberProgress,
    MemberModuleLessonsResponse,
    SearchResult,
} from "@/types/member";
import type { ApiResponse } from "@/types/api";

export const memberService = {
    /** Get all courses the student is enrolled in */
    getCourses: () =>
        apiClient.get<MemberCourse[]>("/member/courses"),

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
};

