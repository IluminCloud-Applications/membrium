import { useState, useCallback, useEffect } from "react";
import type { Student } from "@/types/student";
import {
    studentsService,
    type StudentFromAPI,
    type CourseOption,
    type StudentStats,
} from "@/services/students";
import { dashboardService } from "@/services/dashboard";

const PER_PAGE = 10;

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
 * Supports server-side pagination + full-text search bypass.
 */
export function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [stats, setStats] = useState<StudentStats>({ total: 0, active: 0, inactive: 0 });
    const [adminEmail, setAdminEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);

    // Current filters (kept in sync with the page)
    const [currentSearch, setCurrentSearch] = useState("");
    const [currentCourseFilter, setCurrentCourseFilter] = useState<number | undefined>(undefined);

    /* ---- Fetch students (paginated or search) ---- */
    const fetchStudents = useCallback(async (
        fetchPage = 1,
        search = "",
        courseId?: number,
    ) => {
        try {
            const hasFilters = Boolean(search.trim()) || Boolean(courseId);

            const [data, coursesData, statsData, userInfo] = await Promise.all([
                studentsService.getAll({
                    page: hasFilters ? undefined : fetchPage,
                    perPage: hasFilters ? undefined : PER_PAGE,
                    search: search.trim() || undefined,
                    courseId: courseId || undefined,
                }),
                studentsService.getCourses(),
                studentsService.getStats(),
                dashboardService.getUserInfo(),
            ]);

            setStudents(data.students.map(mapStudent));
            setTotalPages(data.pages);
            setTotalStudents(data.total);
            setPage(data.page);
            setCourses(coursesData);
            setStats(statsData);
            setAdminEmail(userInfo.email.toLowerCase());
        } catch (err) {
            console.error("Erro ao carregar alunos:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    /* ---- Initial load ---- */
    useEffect(() => {
        fetchStudents(1);
    }, [fetchStudents]);

    /* ---- Public page/filter controls ---- */
    function goToPage(newPage: number) {
        setPage(newPage);
        fetchStudents(newPage, currentSearch, currentCourseFilter);
    }

    function applyFilters(search: string, courseId?: number) {
        setCurrentSearch(search);
        setCurrentCourseFilter(courseId);
        setPage(1);
        fetchStudents(1, search, courseId);
    }

    function refreshCurrentPage() {
        fetchStudents(page, currentSearch, currentCourseFilter);
    }

    /* ---- Mutations ---- */
    async function createStudent(data: { name: string; email: string; password: string; courseIds: number[] }) {
        setActionLoading(true);
        try {
            await studentsService.create(data);
            await refreshCurrentPage();
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
            await refreshCurrentPage();
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
            await refreshCurrentPage();
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
            await refreshCurrentPage();
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
            await refreshCurrentPage();
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
        adminEmail,
        loading,
        actionLoading,
        // Pagination
        page,
        totalPages,
        totalStudents,
        goToPage,
        applyFilters,
        // Mutations
        createStudent,
        updateStudent,
        deleteStudent,
        addCourse,
        removeCourse,
        resendAccess,
    };
}
