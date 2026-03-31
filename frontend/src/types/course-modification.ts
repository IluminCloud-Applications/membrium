/* ============================================
   COURSE MODIFICATION TYPES
   Used across course editing components
   ============================================ */

export type VideoPlatform = "youtube" | "custom" | "vturb";

export interface LessonCTA {
    text: string;
    url: string;
    delaySeconds: number;
}

export interface LessonAttachment {
    id: number;
    name: string;
    size: string;
    url: string;
}

export interface Lesson {
    id: number;
    moduleId: number;
    title: string;
    description: string;
    videoPlatform: VideoPlatform;
    videoUrl: string;
    customVideoCode: string;
    attachments: LessonAttachment[];
    hasCta: boolean;
    cta: LessonCTA;
    order: number;
}

export interface CourseModule {
    id: number;
    courseId: number;
    name: string;
    image: string | null;
    lessons: Lesson[];
    order: number;
    hasDelayedUnlock?: boolean;
    unlockAfterDays?: number;
}

export interface CourseCover {
    desktop: string | null;
    mobile: string | null;
}

export interface CourseMenuItem {
    id: number;
    name: string;
    url: string;
    icon: string;
    order: number;
}

export interface CourseModificationData {
    id: number;
    name: string;
    description: string;
    modules: CourseModule[];
    cover: CourseCover;
    menuItems: CourseMenuItem[];
}

/* ---- Form data types ---- */

export interface ModuleFormData {
    name: string;
    imageFile: File | null;
    imagePreview: string | null;
    hasDelayedUnlock: boolean;
    unlockAfterDays: number;
}

export interface LessonFormData {
    title: string;
    description: string;
    videoPlatform: VideoPlatform;
    videoUrl: string;
    customVideoCode: string;
    vturbVideoId: string;
    attachments: File[];
    existingAttachments: LessonAttachment[];
    hasCta: boolean;
    ctaText: string;
    ctaUrl: string;
    ctaDelay: number;
}

export interface MenuItemFormData {
    name: string;
    url: string;
    icon: string;
}

/* ---- Menu icon options ---- */

export const menuIconOptions = [
    { value: "ri-customer-service-2-line", label: "Suporte" },
    { value: "ri-whatsapp-line", label: "WhatsApp" },
    { value: "ri-question-line", label: "Ajuda" },
    { value: "ri-group-line", label: "Comunidade" },
    { value: "ri-telegram-line", label: "Telegram" },
    { value: "ri-instagram-line", label: "Instagram" },
    { value: "ri-links-line", label: "Link" },
    { value: "ri-global-line", label: "Website" },
    { value: "ri-mail-line", label: "Email" },
    { value: "ri-book-open-line", label: "Documentação" },
] as const;
