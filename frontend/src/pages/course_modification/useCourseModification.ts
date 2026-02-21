import { useState, useEffect, useCallback } from "react";
import type { CourseModificationData } from "@/types/course-modification";
import { courseModificationService } from "@/services/courseModification";
import { mapCourse } from "./mappers";

export function useCourseModification(courseId: number | undefined) {
    const [course, setCourse] = useState<CourseModificationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourse = useCallback(async () => {
        if (!courseId) return;
        try {
            setLoading(true);
            const raw = await courseModificationService.getCourse(courseId);
            setCourse(mapCourse(raw));
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar curso:", err);
            setError("Erro ao carregar curso");
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    return { course, loading, error, refetch: fetchCourse };
}
