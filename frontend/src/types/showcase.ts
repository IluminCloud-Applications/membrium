/* ============================================
   SHOWCASE TYPES — Shared across showcase components
   ============================================ */

export type ShowcaseStatus = "active" | "inactive";

export interface ShowcaseCourse {
    id: number;
    name: string;
}

export interface ShowcaseItem {
    id: number;
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    courses: ShowcaseCourse[];
    priority: number;
    status: ShowcaseStatus;
    views: number;
    clicks: number;
    createdAt: string;
}

export const statusLabels: Record<ShowcaseStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
};

export const statusColors: Record<ShowcaseStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    inactive: "bg-red-500/10 text-red-500",
};
