/* ============================================
   TRANSCRIPT TYPES
   ============================================ */

export interface Transcript {
    id: number;
    lessonId: number;
    lessonName: string;
    moduleName: string;
    courseName: string;
    text: string;
    vector: string;
    keywords: string[];
    wordCount: number;
    createdAt: string;
    updatedAt: string;
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
}
