export type EventStatus = "active" | "inactive" | "upcoming" | "expired";
export type EventMediaType = "default" | "image" | "html";

export interface EventItem {
    id: number;
    title: string;
    description: string;
    mediaType: EventMediaType;
    mediaUrl: string;
    htmlContent: string;
    callLink: string;
    eventDate: string;
    sendEmail: boolean;
    sendWhatsapp: boolean;
    status: EventStatus;
    isActive: boolean;
    views: number;
    clicks: number;
    createdAt: string;
}

export const statusLabels: Record<EventStatus, string> = {
    active: "Ativo",
    inactive: "Inativo",
    upcoming: "Programado",
    expired: "Expirado",
};

export const statusColors: Record<EventStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    inactive: "bg-red-500/10 text-red-500",
    upcoming: "bg-blue-500/10 text-blue-600",
    expired: "bg-gray-500/10 text-gray-500",
};

export const statusIcons: Record<EventStatus, string> = {
    active: "text-emerald-500",
    inactive: "text-red-400",
    upcoming: "text-blue-500",
    expired: "text-gray-400",
};
