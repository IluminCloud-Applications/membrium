import { useState, useCallback, useEffect } from "react";
import type { Student } from "@/types/student";
import {
    studentsService,
    type StudentFromAPI,
    type CourseOption,
    type StudentStats,
} from "@/services/students";

/* ---- Convert API format → frontend Student type ---- */
function mapStudent(s: StudentFromAPI): Student {
    return {
        id: s.id,
        name: s.name,
        email: s.email,
        status: s.status,
        courses: s.courses,
        createdAt: s.createdAt ?? "",
        quickAccessToken: s.quickAccessToken,
    };
}

/**
 * Hook that encapsulates all student data fetching and mutations.
 */
export function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [stats, setStats] = useState<StudentStats>({ total: 0, active: 0, inactive: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    /* ---- Fetch ---- */
    const fetchStudents = useCallback(async () => {
        try {
            const [studentsData, coursesData, statsData] = await Promise.all([
                studentsService.getAll(),
                studentsService.getCourses(),
                studentsService.getStats(),
            ]);
            setStudents(studentsData.map(mapStudent));
            setCourses(coursesData);
            setStats(statsData);
        } catch (err) {
            console.error("Erro ao carregar alunos:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    /* ---- Mutations ---- */
    async function createStudent(data: { name: string; email: string; password: string; courseId: number | null }) {
        setActionLoading(true);
        try {
            await studentsService.create(data);
            await fetchStudents();
            return true;
        } catch (err) {
            console.error("Erro ao criar aluno:", err);
            return false;
        } finally {
            setActionLoading(false);
        }
    }

    async function updateStudent(data: { id: number; name: string; email: string; password: string }) {
        setActionLoading(true);
        try {
            await studentsService.update(data.id, {
                name: data.name,
                email: data.email,
                password: data.password,
            });
            await fetchStudents();
            return true;
        } catch (err) {
            console.error("Erro ao atualizar aluno:", err);
            return false;
        } finally {
            setActionLoading(false);
        }
    }

    async function deleteStudent(studentId: number) {
        setActionLoading(true);
        try {
            await studentsService.delete(studentId);
            await fetchStudents();
            return true;
        } catch (err) {
            console.error("Erro ao excluir aluno:", err);
            return false;
        } finally {
            setActionLoading(false);
        }
    }

    async function addCourse(studentId: number, courseId: number) {
        setActionLoading(true);
        try {
            const res = await studentsService.addCourse(studentId, courseId);
            await fetchStudents();
            return res.courses ?? null;
        } catch (err) {
            console.error("Erro ao adicionar curso:", err);
            return null;
        } finally {
            setActionLoading(false);
        }
    }

    async function removeCourse(studentId: number, courseId: number) {
        setActionLoading(true);
        try {
            const res = await studentsService.removeCourse(studentId, courseId);
            await fetchStudents();
            return res.courses ?? null;
        } catch (err) {
            console.error("Erro ao remover curso:", err);
            return null;
        } finally {
            setActionLoading(false);
        }
    }

    async function resendAccess(studentId: number) {
        setActionLoading(true);
        try {
            await studentsService.resendAccess(studentId);
            return true;
        } catch (err) {
            console.error("Erro ao reenviar acesso:", err);
            return false;
        } finally {
            setActionLoading(false);
        }
    }

    return {
        students,
        courses,
        stats,
        loading,
        actionLoading,
        createStudent,
        updateStudent,
        deleteStudent,
        addCourse,
        removeCourse,
        resendAccess,
    };
}
