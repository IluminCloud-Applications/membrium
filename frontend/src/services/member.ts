import { apiClient } from "./apiClient";
import type {
    MemberCourse,
    MemberCourseDetail,
    MemberProfile,
    MemberProgress,
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

    /** Get student profile */
    getProfile: () =>
        apiClient.get<MemberProfile>("/member/profile"),

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
