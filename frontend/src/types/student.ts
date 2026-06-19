/* ============================================
   STUDENT TYPES — Shared across student components
   ============================================ */

export type StudentStatus = "active" | "inactive";

export interface StudentCourse {
    id: number;
    name: string;
}

export interface Student {
    id: number;
    name: string;
    email: string;
    phone?: string;
    status: StudentStatus;
    courses: StudentCourse[];
    createdAt: string;
    quickAccessToken?: string;
    extra_data?: Record<string, any>;
}

export const statusLabels: Record<StudentStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
};

export const statusColors: Record<StudentStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    inactive: "bg-red-500/10 text-red-500",
};
