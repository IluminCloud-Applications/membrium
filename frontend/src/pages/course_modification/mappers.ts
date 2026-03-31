import type {
    CourseModule,
    CourseMenuItem,
    Lesson,
    LessonAttachment,
    CourseCover,
    CourseModificationData,
} from "@/types/course-modification";
import type {
    CourseFullResponse,
    ModuleResponse,
    LessonResponse,
    MenuItemResponse,
} from "@/services/courseModification";

export function mapLesson(raw: LessonResponse): Lesson {
    const platform = (raw.video_platform as "youtube" | "custom" | "vturb") || "youtube";
    return {
        id: raw.id,
        moduleId: raw.module_id,
        title: raw.title,
        description: raw.description,
        videoPlatform: platform,
        videoUrl: raw.video_url,
        customVideoCode: platform === "custom" ? raw.video_url : "",
        attachments: raw.attachments.map((a): LessonAttachment => ({
            id: a.id,
            name: a.name,
            size: "",
            url: a.url || "#",
        })),
        hasCta: raw.has_cta,
        cta: {
            text: raw.cta_text,
            url: raw.cta_url,
            delaySeconds: raw.cta_delay,
        },
        order: raw.order,
    };
}


export function mapModule(raw: ModuleResponse): CourseModule {
    return {
        id: raw.id,
        courseId: raw.course_id,
        name: raw.name,
        image: raw.image,
        lessons: raw.lessons.map(mapLesson),
        order: raw.order,
        hasDelayedUnlock: (raw.unlock_after_days || 0) > 0,
        unlockAfterDays: raw.unlock_after_days || 0,
    };
}

export function mapMenuItem(raw: MenuItemResponse, index: number): CourseMenuItem {
    return {
        id: index + 1, // menu items don't have IDs from backend, use index
        name: raw.name,
        url: raw.url,
        icon: raw.icon,
        order: raw.order ?? index + 1,
    };
}

export function mapCourse(raw: CourseFullResponse): CourseModificationData {
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        modules: raw.modules.map(mapModule),
        cover: {
            desktop: raw.cover?.desktop || null,
            mobile: raw.cover?.mobile || null,
        } as CourseCover,
        menuItems: (raw.menu_items || []).map(mapMenuItem),
    };
}
