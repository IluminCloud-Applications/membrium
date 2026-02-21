import type { Course, CourseCategory, CourseGroup } from "@/types/course";
import type { CourseResponse, CourseGroupResponse } from "@/services/courses";

/* ---- API → Frontend type mappers ---- */

export function mapCourse(raw: CourseResponse): Course {
    return {
        id: raw.id,
        uuid: raw.uuid,
        name: raw.name,
        description: raw.description || "",
        image: raw.image,
        category: (raw.category || "principal") as CourseCategory,
        studentsCount: raw.students_count,
        lessonsCount: raw.lessons_count,
        createdAt: raw.created_at || "",
        isPublished: raw.is_published,
    };
}

export function mapGroup(raw: CourseGroupResponse): CourseGroup {
    return {
        id: raw.id,
        name: raw.name,
        principalCourseId: raw.principal_course_id,
        courseIds: raw.course_ids,
    };
}
