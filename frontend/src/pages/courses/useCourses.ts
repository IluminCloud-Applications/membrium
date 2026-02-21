import { useState, useEffect, useCallback } from "react";
import type { Course, CourseGroup } from "@/types/course";
import { coursesService } from "@/services/courses";
import { mapCourse, mapGroup } from "./mappers";

export function useCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [groups, setGroups] = useState<CourseGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const [coursesRes, groupsRes] = await Promise.all([
                coursesService.list(),
                coursesService.listGroups(),
            ]);
            setCourses(coursesRes.map(mapCourse));
            setGroups(groupsRes.map(mapGroup));
        } catch (err) {
            console.error("Erro ao carregar cursos:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { courses, groups, loading, refetch: fetchData };
}
