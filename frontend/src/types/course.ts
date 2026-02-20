/* ============================================
   COURSE TYPES — Shared across course components
   ============================================ */

export type CourseCategory = "principal" | "order_bump" | "upsell" | "bonus";

export interface Course {
    id: number;
    name: string;
    description: string;
    image: string;
    category: CourseCategory;
    studentsCount: number;
    lessonsCount: number;
    createdAt: string;
    isPublished: boolean;
}

export const categoryLabels: Record<CourseCategory, string> = {
    principal: "Principal",
    order_bump: "Order Bump",
    upsell: "Upsell",
    bonus: "Bônus",
};

export const categoryColors: Record<CourseCategory, string> = {
    principal: "bg-primary/10 text-primary",
    order_bump: "bg-amber-500/10 text-amber-600",
    upsell: "bg-blue-500/10 text-blue-600",
    bonus: "bg-emerald-500/10 text-emerald-600",
};
