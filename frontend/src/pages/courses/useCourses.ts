import { useState, useEffect, useCallback } from "react";
import type { Course } from "@/types/course";
import { coursesService } from "@/services/courses";
import { mapCourse } from "./mappers";

export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const coursesRes = await coursesService.list();
            setCourses(coursesRes.map(mapCourse));
        } catch (err) {
            console.error("Erro ao carregar cursos:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { courses, loading, refetch: fetchData };
}
