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

/** Maps API response to frontend ShowcaseItem shape */
export function mapShowcaseItem(
    raw: {
        id: number;
        name: string;
        description: string;
        image: string | null;
        url: string;
        status: string;
        priority: number;
        courses: { id: number; name: string }[];
        created_at: string | null;
    },
    views = 0,
    clicks = 0,
): ShowcaseItem {
    return {
        id: raw.id,
        title: raw.name,
        description: raw.description || "",
        url: raw.url,
        imageUrl: raw.image ? `/static/uploads/${raw.image}` : "",
        courses: raw.courses,
        priority: raw.priority,
        status: raw.status as ShowcaseStatus,
        views,
        clicks,
        createdAt: raw.created_at || new Date().toISOString(),
    };
}

export const statusLabels: Record<ShowcaseStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
};

export const statusColors: Record<ShowcaseStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    inactive: "bg-red-500/10 text-red-500",
};
