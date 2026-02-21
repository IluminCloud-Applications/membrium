import { apiClient } from "./apiClient";

/* ============================================
   DASHBOARD TYPES
   ============================================ */

export interface DashboardStats {
    total_courses: number;
    total_students: number;
    total_lessons: number;
    active_students: number;
}

export interface CourseStudentData {
    id: number;
    name: string;
    student_count: number;
}

export interface CourseStudentsResponse {
    courses: CourseStudentData[];
    total_courses: number;
}

export interface RecentStudent {
    id: number;
    name: string;
    email: string;
    course_name: string | null;
    courses: string[];
}

export interface RecentStudentsResponse {
    students: RecentStudent[];
}

export interface UserInfo {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    platform_name: string;
}

/* ============================================
   DASHBOARD SERVICE
   ============================================ */

export const dashboardService = {
    /** Get dashboard stats (totals) */
    getStats: () =>
        apiClient.get<DashboardStats>("/dashboard/stats"),

    /** Get student count per course (for chart + filter) */
    getCourseStudents: () =>
        apiClient.get<CourseStudentsResponse>("/dashboard/course-students"),

    /** Get recent students */
    getRecentStudents: (limit = 5) =>
        apiClient.get<RecentStudentsResponse>(
            `/dashboard/recent-students?limit=${limit}`
        ),

    /** Get current admin user info */
    getUserInfo: () =>
        apiClient.get<UserInfo>("/dashboard/user-info"),
};
