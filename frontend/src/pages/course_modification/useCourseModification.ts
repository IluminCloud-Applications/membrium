import { useState, useEffect, useCallback, useRef } from "react";
import type { CourseModificationData } from "@/types/course-modification";
import { courseModificationService } from "@/services/courseModification";
import { mapCourse } from "./mappers";

export function useCourseModification(courseId: number | undefined) {
    const [course, setCourse] = useState<CourseModificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Track whether it's the very first load — refetches must NOT show the spinner
    const isInitialLoad = useRef(true);

    const fetchCourse = useCallback(async () => {
        if (!courseId) return;
        // Only show full-page spinner on the very first load
        if (isInitialLoad.current) setLoading(true);
        try {
            const raw = await courseModificationService.getCourse(courseId);
            setCourse(mapCourse(raw));
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar curso:", err);
            setError("Erro ao carregar curso");
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    return { course, loading, error, refetch: fetchCourse };
}
