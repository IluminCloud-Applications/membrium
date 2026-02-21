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

/* ============================================
   STUDENTS SERVICE
   ============================================ */

export const studentsService = {
    /** List all students */
    getAll: () =>
        apiClient.get<StudentFromAPI[]>("/students/"),

    /** Get available courses for dropdowns */
    getCourses: () =>
        apiClient.get<CourseOption[]>("/students/courses"),

    /** Get student stats */
    getStats: () =>
        apiClient.get<StudentStats>("/students/stats"),

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
