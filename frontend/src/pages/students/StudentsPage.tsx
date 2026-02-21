import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    StudentFilters,
    StudentTable,
    StudentEmptyState,
    StudentStats,
    StudentPagination,
} from "@/components/students";
import { AddStudentModal } from "@/components/modals/students/AddStudentModal";
import { EditStudentModal } from "@/components/modals/students/EditStudentModal";
import { ManageCoursesModal } from "@/components/modals/students/ManageCoursesModal";
import { ResendAccessModal } from "@/components/modals/students/ResendAccessModal";
import { QuickAccessModal } from "@/components/modals/students/QuickAccessModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { Student } from "@/types/student";
import { useStudents } from "@/hooks/useStudents";

const DEBOUNCE_MS = 400;

export function StudentsPage() {
    const navigate = useNavigate();
    const {
        students, courses, stats, adminEmail, loading, actionLoading,
        page, totalPages, totalStudents,
        goToPage, applyFilters,
        createStudent, updateStudent, deleteStudent,
        addCourse, removeCourse, resendAccess,
    } = useStudents();

    // Filter inputs (local, debounced)
    const [search, setSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("all");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search + course filter → server
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const courseId = courseFilter !== "all" ? Number(courseFilter) : undefined;
            applyFilters(search, courseId);
        }, DEBOUNCE_MS);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search, courseFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const hasActiveFilters = search.trim() !== "" || courseFilter !== "all";

    // Modal states
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Student | null>(null);
    const [manageCoursesTarget, setManageCoursesTarget] = useState<Student | null>(null);
    const [resendTarget, setResendTarget] = useState<Student | null>(null);
    const [quickAccessTarget, setQuickAccessTarget] = useState<Student | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

    /* ---- Handlers ---- */

    async function handleCreate(data: { name: string; email: string; password: string; courseIds: number[] }) {
        const ok = await createStudent(data);
        if (ok) setAddModalOpen(false);
    }

    async function handleUpdate(data: { id: number; name: string; email: string; password: string }) {
        const ok = await updateStudent(data);
        if (ok) setEditTarget(null);
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        const ok = await deleteStudent(deleteTarget.id);
        if (ok) setDeleteTarget(null);
    }

    async function handleAddCourse(studentId: number, courseId: number) {
        const updatedCourses = await addCourse(studentId, courseId);
        if (updatedCourses && manageCoursesTarget) {
            setManageCoursesTarget({
                ...manageCoursesTarget,
                courses: updatedCourses,
                status: updatedCourses.length > 0 ? "active" : "inactive",
            });
        }
    }

    async function handleRemoveCourse(studentId: number, courseId: number) {
        const updatedCourses = await removeCourse(studentId, courseId);
        if (updatedCourses && manageCoursesTarget) {
            setManageCoursesTarget({
                ...manageCoursesTarget,
                courses: updatedCourses,
                status: updatedCourses.length > 0 ? "active" : "inactive",
            });
        }
    }

    async function handleResendAccess(studentId: number) {
        const ok = await resendAccess(studentId);
        if (ok) setResendTarget(null);
    }

    /* ---- Loading ---- */
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <i className="ri-loader-4-line animate-spin text-3xl text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <i className="ri-group-line text-primary" />
                    Alunos
                </h1>
                <p className="text-sm text-muted-foreground">
                    Gerencie todos os alunos da sua plataforma
                </p>
            </div>

            <StudentStats total={stats.total} active={stats.active} inactive={stats.inactive} />

            <StudentFilters
                search={search}
                onSearchChange={setSearch}
                courseFilter={courseFilter}
                onCourseFilterChange={setCourseFilter}
                availableCourses={courses}
                onAddStudent={() => setAddModalOpen(true)}
                onImport={() => navigate("/admin/alunos/importar")}
            />

            {students.length === 0 ? (
                <StudentEmptyState
                    hasFilters={hasActiveFilters}
                    onAddStudent={() => setAddModalOpen(true)}
                />
            ) : (
                <>
                    <StudentTable
                        students={students}
                        onEdit={setEditTarget}
                        onManageCourses={setManageCoursesTarget}
                        onResendAccess={setResendTarget}
                        onQuickAccess={setQuickAccessTarget}
                        onDelete={setDeleteTarget}
                    />

                    {!hasActiveFilters && (
                        <StudentPagination
                            page={page}
                            totalPages={totalPages}
                            totalStudents={totalStudents}
                            onPageChange={goToPage}
                        />
                    )}
                </>
            )}

            {/* Modals */}
            <AddStudentModal
                open={addModalOpen}
                onOpenChange={setAddModalOpen}
                availableCourses={courses}
                adminEmail={adminEmail}
                isLoading={actionLoading}
                onSubmit={handleCreate}
            />

            <EditStudentModal
                open={!!editTarget}
                onOpenChange={() => setEditTarget(null)}
                student={editTarget}
                adminEmail={adminEmail}
                isLoading={actionLoading}
                onSubmit={handleUpdate}
            />

            <ManageCoursesModal
                open={!!manageCoursesTarget}
                onOpenChange={() => setManageCoursesTarget(null)}
                student={manageCoursesTarget}
                availableCourses={courses}
                isLoading={actionLoading}
                onAddCourse={handleAddCourse}
                onRemoveCourse={handleRemoveCourse}
            />

            <ResendAccessModal
                open={!!resendTarget}
                onOpenChange={() => setResendTarget(null)}
                student={resendTarget}
                isLoading={actionLoading}
                onConfirm={handleResendAccess}
            />

            <QuickAccessModal
                open={!!quickAccessTarget}
                onOpenChange={() => setQuickAccessTarget(null)}
                student={quickAccessTarget}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                isLoading={actionLoading}
                title="Excluir Aluno"
                description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? O aluno será removido de todos os cursos permanentemente.`}
                confirmLabel="Excluir Aluno"
            />
        </div>
    );
}
