/* ============================================
   MEMBER AREA TYPES — Student-facing area
   ============================================ */

export interface MemberModule {
    id: number;
    name: string;
    image: string | null;
    order: number;
    totalLessons: number;
    completedLessons: number;
    unlockAfterDays?: number;
    isLocked?: boolean;
    unlockDaysRemaining?: number;
}

export interface MemberCourse {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    image: string | null;
    category: string;
    moduleFormat: string;
    theme: string;
    coverDesktop: string | null;
    coverMobile: string | null;
    menuItems: MemberMenuItem[];
    modules: MemberModule[];
}

export interface MemberMenuItem {
    name: string;
    url: string;
    icon?: string;
    order: number;
}

export interface MemberLesson {
    id: number;
    title: string;
    description: string | null;
    videoUrl: string | null;
    videoType: string;
    order: number;
    hasButton: boolean;
    buttonText: string | null;
    buttonLink: string | null;
    buttonDelay: number | null;
    completed: boolean;
}

export interface MemberModuleDetail {
    id: number;
    name: string;
    image: string | null;
    order: number;
    lessons: MemberLesson[];
}

export interface MemberCourseDetail {
    id: number;
    uuid: string;
    name: string;
    description: string | null;
    image: string | null;
    category: string;
    moduleFormat: string;
    theme: string;
    coverDesktop: string | null;
    coverMobile: string | null;
    menuItems: MemberMenuItem[];
    modules: MemberModuleDetail[];
}

export interface MemberProfile {
    id: number;
    name: string;
    email: string;
    phone: string;
    platformName: string;
}

export interface MemberProgress {
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
}

export interface SearchResult {
    type: "module" | "lesson";
    id: number;
    title: string;
    courseId: number;
    courseName: string;
    moduleId?: number;
    moduleName?: string;
    image?: string | null;
}

/* ============================================
   LESSON PLAYER PAGE TYPES
   ============================================ */

export interface MemberLessonDocument {
    id: number;
    filename: string;
}

export interface MemberLessonFAQ {
    id: number;
    question: string;
    answer: string;
    order: number;
}

export interface MemberLessonDetail {
    id: number;
    title: string;
    description: string | null;
    videoUrl: string | null;
    videoType: string;
    order: number;
    hasButton: boolean;
    buttonText: string | null;
    buttonLink: string | null;
    buttonDelay: number | null;
    completed: boolean;
    documents: MemberLessonDocument[];
    faqs: MemberLessonFAQ[];
}

export interface MemberModuleLessonsResponse {
    course: {
        id: number;
        name: string;
        theme: string;
        menuItems: MemberMenuItem[];
    };
    module: {
        id: number;
        name: string;
        order: number;
    };
    lessons: MemberLessonDetail[];
    totalLessons: number;
    completedLessons: number;
}

