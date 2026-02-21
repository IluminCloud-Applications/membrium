import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CourseMultiSelect } from "@/components/students/CourseMultiSelect";
import { studentsService } from "@/services/students";

interface AddStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: AddStudentFormData) => void;
    availableCourses: { id: number; name: string }[];
    adminEmail?: string;
    isLoading?: boolean;
}

export interface AddStudentFormData {
    name: string;
    email: string;
    password: string;
    courseIds: number[];
}

export function AddStudentModal({
    open,
    onOpenChange,
    onSubmit,
    availableCourses,
    adminEmail = "",
    isLoading,
}: AddStudentModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [courseToAdd, setCourseToAdd] = useState<string>("");

    // Email validation states
    const [emailExists, setEmailExists] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);

    useEffect(() => {
        if (!open) resetForm();
    }, [open]);

    function resetForm() {
        setName("");
        setEmail("");
        setPassword("");
        setSelectedCourseIds([]);
        setCourseToAdd("");
        setEmailExists(false);
        setCheckingEmail(false);
    }

    /* ---- Email checks ---- */
    const isAdminEmail = adminEmail !== "" && email.trim().toLowerCase() === adminEmail;

    const checkEmailExists = useCallback(async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || isAdminEmail) {
            setEmailExists(false);
            return;
        }
        setCheckingEmail(true);
        try {
            const res = await studentsService.checkEmail(trimmed);
            setEmailExists(res.exists);
        } catch {
            setEmailExists(false);
        } finally {
            setCheckingEmail(false);
        }
    }, [email, isAdminEmail]);

    const hasEmailError = isAdminEmail || emailExists;

    /* ---- Course management ---- */
    const unselectedCourses = useMemo(
        () => availableCourses.filter((c) => !selectedCourseIds.includes(c.id)),
        [availableCourses, selectedCourseIds]
    );

    const selectedCourses = useMemo(
        () => availableCourses.filter((c) => selectedCourseIds.includes(c.id)),
        [availableCourses, selectedCourseIds]
    );

    function handleAddCourse() {
        if (!courseToAdd) return;
        const id = Number(courseToAdd);
        if (!selectedCourseIds.includes(id)) {
            setSelectedCourseIds((prev) => [...prev, id]);
        }
        setCourseToAdd("");
    }

    function handleRemoveCourse(courseId: number) {
        setSelectedCourseIds((prev) => prev.filter((id) => id !== courseId));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit({ name, email, password, courseIds: selectedCourseIds });
    }

    const canSubmit = name.trim() && email.trim() && password.trim() && !hasEmailError;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-user-add-line text-primary" />
                        Adicionar Novo Aluno
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="student-name" className="text-sm font-medium">
                            Nome
                        </Label>
                        <Input
                            id="student-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="student-email" className="text-sm font-medium">
                            Email
                        </Label>
                        <div className="relative">
                            <Input
                                id="student-email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setEmailExists(false);
                                }}
                                onBlur={checkEmailExists}
                                placeholder="aluno@email.com"
                                required
                                className={hasEmailError ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                            {checkingEmail && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <i className="ri-loader-4-line animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        {isAdminEmail && (
                            <div className="flex items-center gap-1.5 text-destructive text-xs">
                                <i className="ri-error-warning-line text-sm" />
                                Este é o email do administrador. Use um email diferente.
                            </div>
                        )}
                        {emailExists && !isAdminEmail && (
                            <div className="flex items-center gap-1.5 text-destructive text-xs">
                                <i className="ri-error-warning-line text-sm" />
                                Já existe um aluno cadastrado com este email.
                            </div>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="student-password" className="text-sm font-medium">
                            Senha
                        </Label>
                        <Input
                            id="student-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Senha de acesso"
                            required
                        />
                    </div>

                    {/* Courses — multi-select */}
                    <CourseMultiSelect
                        selectedCourses={selectedCourses}
                        unselectedCourses={unselectedCourses}
                        courseToAdd={courseToAdd}
                        onCourseToAddChange={setCourseToAdd}
                        onAdd={handleAddCourse}
                        onRemove={handleRemoveCourse}
                    />

                    {/* Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="btn-brand flex-1"
                            disabled={isLoading || !canSubmit}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    Adicionando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className="ri-check-line" />
                                    Adicionar Aluno
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
