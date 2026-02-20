import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    StudentFilters,
    StudentTable,
    StudentEmptyState,
    StudentStats,
} from "@/components/students";
import { AddStudentModal } from "@/components/modals/students/AddStudentModal";
import { EditStudentModal } from "@/components/modals/students/EditStudentModal";
import { ManageCoursesModal } from "@/components/modals/students/ManageCoursesModal";
import { ResendAccessModal } from "@/components/modals/students/ResendAccessModal";
import { QuickAccessModal } from "@/components/modals/students/QuickAccessModal";
import { DeleteConfirmModal } from "@/components/modals/shared/DeleteConfirmModal";
import type { Student } from "@/types/student";
import { mockStudents, mockAvailableCourses } from "./mock-data";

export function StudentsPage() {
    const navigate = useNavigate();
    const [students] = useState<Student[]>(mockStudents);

    // Filters
    const [search, setSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("all");

    // Modal states
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Student | null>(null);
    const [manageCoursesTarget, setManageCoursesTarget] = useState<Student | null>(null);
    const [resendTarget, setResendTarget] = useState<Student | null>(null);
    const [quickAccessTarget, setQuickAccessTarget] = useState<Student | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

    // Filtered students
    const filteredStudents = useMemo(() => {
        let result = [...students];

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (s) =>
                    s.name.toLowerCase().includes(q) ||
                    s.email.toLowerCase().includes(q)
            );
        }

        if (courseFilter !== "all") {
            const courseId = Number(courseFilter);
            result = result.filter((s) =>
                s.courses.some((c) => c.id === courseId)
            );
        }

        return result;
    }, [students, search, courseFilter]);

    const hasActiveFilters = search.trim() !== "" || courseFilter !== "all";

    // Handlers
    function handleImport() {
        navigate("/admin/alunos/importar");
    }

    function handleConfirmDelete() {
        console.log("Delete student:", deleteTarget?.id);
        setDeleteTarget(null);
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

            {/* Stats */}
            <StudentStats
                total={students.length}
                filteredCount={filteredStudents.length}
            />

            {/* Filters */}
            <StudentFilters
                search={search}
                onSearchChange={setSearch}
                courseFilter={courseFilter}
                onCourseFilterChange={setCourseFilter}
                availableCourses={mockAvailableCourses}
                onAddStudent={() => setAddModalOpen(true)}
                onImport={handleImport}
            />

            {/* Content */}
            {filteredStudents.length === 0 ? (
                <StudentEmptyState
                    hasFilters={hasActiveFilters}
                    onAddStudent={() => setAddModalOpen(true)}
                />
            ) : (
                <StudentTable
                    students={filteredStudents}
                    onEdit={setEditTarget}
                    onManageCourses={setManageCoursesTarget}
                    onResendAccess={setResendTarget}
                    onQuickAccess={setQuickAccessTarget}
                    onDelete={setDeleteTarget}
                />
            )}

            {/* Modals */}
            <AddStudentModal
                open={addModalOpen}
                onOpenChange={setAddModalOpen}
                availableCourses={mockAvailableCourses}
                onSubmit={(data) => {
                    console.log("Create student:", data);
                    setAddModalOpen(false);
                }}
            />

            <EditStudentModal
                open={!!editTarget}
                onOpenChange={() => setEditTarget(null)}
                student={editTarget}
                onSubmit={(data) => {
                    console.log("Update student:", data);
                    setEditTarget(null);
                }}
            />

            <ManageCoursesModal
                open={!!manageCoursesTarget}
                onOpenChange={() => setManageCoursesTarget(null)}
                student={manageCoursesTarget}
                availableCourses={mockAvailableCourses}
                onAddCourse={(studentId, courseId) => {
                    console.log("Add course:", studentId, courseId);
                }}
                onRemoveCourse={(studentId, courseId) => {
                    console.log("Remove course:", studentId, courseId);
                }}
            />

            <ResendAccessModal
                open={!!resendTarget}
                onOpenChange={() => setResendTarget(null)}
                student={resendTarget}
                onConfirm={(studentId) => {
                    console.log("Resend access:", studentId);
                    setResendTarget(null);
                }}
            />

            <QuickAccessModal
                open={!!quickAccessTarget}
                onOpenChange={() => setQuickAccessTarget(null)}
                student={quickAccessTarget}
            />

            <DeleteConfirmModal
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                title="Excluir Aluno"
                description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? O aluno será removido de todos os cursos permanentemente.`}
                confirmLabel="Excluir Aluno"
            />
        </div>
    );
}
