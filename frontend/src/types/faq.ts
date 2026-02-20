/* ============================================
   FAQ TYPES
   ============================================ */

export interface FAQItem {
    id: number;
    question: string;
    answer: string;
}

export interface FAQLessonGroup {
    lessonId: number;
    lessonName: string;
    moduleId: number;
    moduleName: string;
    courseId: number;
    courseName: string;
    faqs: FAQItem[];
    updatedAt: string;
}

export interface FAQCourseSummary {
    courseId: number;
    courseName: string;
    modulesWithFaq: number;
    totalFaqs: number;
}

export interface FAQModuleSummary {
    moduleId: number;
    moduleName: string;
    courseId: number;
    lessonsWithFaq: number;
    totalFaqs: number;
}

export interface FAQCourse {
    id: number;
    name: string;
}

export interface FAQModule {
    id: number;
    name: string;
    courseId: number;
}

export interface FAQLesson {
    id: number;
    name: string;
    moduleId: number;
}

export type FAQDrillLevel = "courses" | "modules" | "lessons";
