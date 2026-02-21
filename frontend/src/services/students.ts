import { apiClient } from "./apiClient";

/* ============================================
   STUDENTS TYPES
   ============================================ */

export interface StudentFromAPI {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: "active" | "inactive";
    courses: { id: number; name: string }[];
    createdAt: string | null;
    quickAccessToken: string;
}

export interface PaginatedStudents {
    students: StudentFromAPI[];
    total: number;
    page: number;
    per_page: number;
    pages: number;
}

export interface StudentStats {
    total: number;
    active: number;
    inactive: number;
}

export interface CreateStudentPayload {
    name: string;
    email: string;
    password: string;
    courseIds: number[];
}

export interface UpdateStudentPayload {
    name: string;
    email: string;
    password: string;
}

export interface CourseOption {
    id: number;
    name: string;
}

interface MutationResponse {
    success: boolean;
    message: string;
    student?: StudentFromAPI;
    courses?: { id: number; name: string }[];
}

interface EmailCheckResponse {
    exists: boolean;
}

/* ============================================
   STUDENTS SERVICE
   ============================================ */

export const studentsService = {
    /** List students (paginated or search) */
    getAll: (params?: { page?: number; perPage?: number; search?: string; courseId?: number }) => {
        const qs = new URLSearchParams();
        if (params?.page) qs.set("page", String(params.page));
        if (params?.perPage) qs.set("per_page", String(params.perPage));
        if (params?.search) qs.set("search", params.search);
        if (params?.courseId) qs.set("course_id", String(params.courseId));
        const query = qs.toString();
        return apiClient.get<PaginatedStudents>(`/students/${query ? `?${query}` : ""}`);
    },

    /** Get available courses for dropdowns */
    getCourses: () =>
        apiClient.get<CourseOption[]>("/students/courses"),

    /** Get student stats */
    getStats: () =>
        apiClient.get<StudentStats>("/students/stats"),

    /** Check if student email already exists */
    checkEmail: (email: string, excludeId?: number) => {
        const qs = new URLSearchParams({ email });
        if (excludeId) qs.set("exclude_id", String(excludeId));
        return apiClient.get<EmailCheckResponse>(`/students/check-email?${qs.toString()}`);
    },

    /** Create a new student */
    create: (data: CreateStudentPayload) =>
        apiClient.post<MutationResponse>("/students/", data),

    /** Update a student */
    update: (studentId: number, data: UpdateStudentPayload) =>
        apiClient.put<MutationResponse>(`/students/${studentId}`, data),

    /** Delete a student */
    delete: (studentId: number) =>
        apiClient.delete<MutationResponse>(`/students/${studentId}`),

    /** Add a course to a student */
    addCourse: (studentId: number, courseId: number) =>
        apiClient.post<MutationResponse>(
            `/students/${studentId}/courses`,
            { courseId }
        ),

    /** Remove a course from a student */
    removeCourse: (studentId: number, courseId: number) =>
        apiClient.delete<MutationResponse>(
            `/students/${studentId}/courses/${courseId}`
        ),

    /** Resend access email to a student */
    resendAccess: (studentId: number) =>
        apiClient.post<MutationResponse>(
            `/students/${studentId}/resend-access`,
            {}
        ),
};
