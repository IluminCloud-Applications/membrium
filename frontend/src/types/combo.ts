import type { CourseCategory } from "./course";

export interface ComboCourseItem {
    id: number;
    uuid?: string;
    name: string;
    category: CourseCategory;
    image: string | null;
}

export interface CourseCombo {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    created_at: string | null;
    courses_count: number;
    courses: ComboCourseItem[];
}

export interface CreateComboData {
    name: string;
    description?: string;
    course_ids: number[];
}

export interface UpdateComboData {
    name: string;
    description?: string;
    course_ids: number[];
}
