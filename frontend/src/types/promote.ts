/* ============================================
   PROMOTE TYPES — Shared across promote components
   ============================================ */

export type PromoteStatus = "active" | "inactive" | "upcoming" | "expired";
export type PromoteMediaType = "image" | "video";

export interface PromoteItem {
    id: number;
    title: string;
    description: string;
    mediaType: PromoteMediaType;
    mediaUrl: string;
    startDate: string;
    endDate: string;
    hasCta: boolean;
    ctaText: string;
    ctaUrl: string;
    ctaDelay: number;
    status: PromoteStatus;
    isActive: boolean;
    views: number;
    clicks: number;
    createdAt: string;
}

export const statusLabels: Record<PromoteStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
    upcoming: "Programado",
    expired: "Expirado",
};

export const statusColors: Record<PromoteStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    inactive: "bg-red-500/10 text-red-500",
    upcoming: "bg-blue-500/10 text-blue-600",
    expired: "bg-gray-500/10 text-gray-500",
};

export const statusIcons: Record<PromoteStatus, string> = {
    active: "text-emerald-500",
    inactive: "text-red-400",
    upcoming: "text-blue-500",
    expired: "text-gray-400",
};
