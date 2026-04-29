/* ============================================
   TRANSCRIPT TYPES
   ============================================ */

export interface Transcript {
    id: number;
    lessonId: number;
    lessonName: string;
    moduleId: number;
    moduleName: string;
    courseId: number;
    courseName: string;
    text: string;
    vector: string;
    keywords: string[];
    wordCount: number;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface TranscriptStats {
    totalTranscripts: number;
    coursesWithTranscripts: number;
    totalKeywords: number;
}

export interface TranscriptCourse {
    id: number;
    name: string;
}

export interface TranscriptModule {
    id: number;
    name: string;
    courseId: number;
}

export interface TranscriptLesson {
    id: number;
    name: string;
    moduleId: number;
    /** 'youtube' | 'cloudflare' | 'vturb' | 'custom' */
    videoPlatform: string;
}

export interface TranscriptCourseSummary {
    courseId: number;
    courseName: string;
    modulesWithTranscript: number;
    totalTranscripts: number;
}

export interface TranscriptModuleSummary {
    moduleId: number;
    moduleName: string;
    courseId: number;
    lessonsWithTranscript: number;
    totalTranscripts: number;
}

export type TranscriptDrillLevel = "courses" | "modules" | "lessons";

export interface PendingLesson {
    lessonId: number;
    lessonName: string;
    moduleId: number;
    moduleName: string;
    courseId: number;
    courseName: string;
    hasTranscript: boolean;
    hasSummary: boolean;
    hasKeywords: boolean;
    isYoutube: boolean;
    isCloudflare: boolean;
    videoUrl: string;
}
