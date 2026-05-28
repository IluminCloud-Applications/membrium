import type { Course, CourseCategory } from "@/types/course";
import type { CourseResponse } from "@/services/courses";

/* ---- API → Frontend type mappers ---- */

export function mapCourse(raw: CourseResponse): Course {
    return {
        id: raw.id,
        uuid: raw.uuid,
        name: raw.name,
        description: raw.description || "",
        image: raw.image,
        checkoutUrl: raw.checkout_url || null,
        category: (raw.category || "principal") as CourseCategory,
        studentsCount: raw.students_count,
        lessonsCount: raw.lessons_count,
        createdAt: raw.created_at || "",
        isPublished: raw.is_published,
        order: raw.order || 0,
    };
}
