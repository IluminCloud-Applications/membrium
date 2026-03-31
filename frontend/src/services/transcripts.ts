import { apiClient } from "./apiClient";
import type {
    Transcript,
    TranscriptCourse,
    TranscriptModule,
    TranscriptLesson,
    TranscriptStats,
    PendingLesson,
} from "@/types/transcript";

/* ============================================
   PAYLOAD TYPES
   ============================================ */

export interface TranscriptCreatePayload {
    lessonId: number;
    text: string;
    vector: string;
    keywords: string[];
}

export interface TranscriptUpdatePayload {
    text?: string;
    vector?: string;
    keywords?: string[];
}

export interface GenerateMetadataPayload {
    text: string;
    provider: string;
    model?: string;
}

export interface AutoGeneratePayload {
    lessonId: number;
    provider: string;
    model?: string;
}

/* ============================================
   API RESPONSE TYPES
   ============================================ */

interface MutationResponse {
    success: boolean;
    message: string;
    item?: Transcript;
}

interface MetadataResponse {
    success: boolean;
    keywords: string;
    summary: string;
    message?: string;
}

interface AutoGenerateResponse {
    success: boolean;
    lessonId: number;
    message: string;
}

/* ============================================
   TRANSCRIPT SERVICE
   ============================================ */

export const transcriptsService = {
    /** Get all transcripts for drill-down view */
    getGroups: () =>
        apiClient.get<Transcript[]>("/transcripts/groups"),

    /** Get transcript for a specific lesson */
    getLessonTranscript: (lessonId: number) =>
        apiClient.get<Transcript>(`/transcripts/lesson/${lessonId}`),

    /** Get transcript statistics */
    getStats: () =>
        apiClient.get<TranscriptStats>("/transcripts/stats"),

    /** Create a new transcript */
    create: (data: TranscriptCreatePayload) =>
        apiClient.post<MutationResponse>("/transcripts/create", data),

    /** Update an existing transcript */
    update: (id: number, data: TranscriptUpdatePayload) =>
        apiClient.put<MutationResponse>(`/transcripts/update/${id}`, data),

    /** Delete a transcript */
    delete: (id: number) =>
        apiClient.delete<MutationResponse>(`/transcripts/${id}`),

    /* ---- Selectors for the modal ---- */

    /** Get all courses for the selector */
    getCourses: () =>
        apiClient.get<TranscriptCourse[]>("/transcripts/courses"),

    /** Get modules for a course */
    getModules: (courseId: number) =>
        apiClient.get<TranscriptModule[]>(`/transcripts/courses/${courseId}/modules`),

    /** Get available lessons (without existing transcripts) */
    getLessons: (moduleId: number) =>
        apiClient.get<TranscriptLesson[]>(`/transcripts/modules/${moduleId}/lessons`),

    /* ---- AI Features ---- */

    /** Get pending lessons (missing transcript/summary/keywords) */
    getPendingLessons: () =>
        apiClient.get<PendingLesson[]>("/transcripts/pending-lessons"),

    /** Generate metadata (summary + keywords) with AI */
    generateMetadata: (data: GenerateMetadataPayload) =>
        apiClient.post<MetadataResponse>("/transcripts/generate-metadata", data),

    /** Auto-generate transcript + metadata for a single lesson */
    autoGenerate: (data: AutoGeneratePayload) =>
        apiClient.post<AutoGenerateResponse>("/transcripts/auto-generate", data),

    /** Fetch YouTube transcript for a lesson by lessonId (via Google YouTube API) */
    fetchYoutubeTranscript: (lessonId: number) =>
        apiClient.post<{
            success: boolean;
            text: string;
            srt: string;
            wordCount: number;
            language: string;
            captionId: string;
            isAutoSynced: boolean;
            message?: string;
        }>(
            "/transcripts/youtube-transcript",
            { lessonId }
        ),
};
