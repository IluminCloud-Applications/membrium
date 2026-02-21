import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

    useEffect(() => {
        if (!open) resetForm();
    }, [open]);

    function resetForm() {
        setName("");
        setEmail("");
        setPassword("");
        setSelectedCourseIds([]);
        setCourseToAdd("");
    }

    /* ---- Email admin check ---- */
    const isAdminEmail = adminEmail !== "" && email.trim().toLowerCase() === adminEmail;

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

    const canSubmit = name.trim() && email.trim() && password.trim() && !isAdminEmail;

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
                        <Input
                            id="student-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="aluno@email.com"
                            required
                            className={isAdminEmail ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {isAdminEmail && (
                            <div className="flex items-center gap-1.5 text-destructive text-xs">
                                <i className="ri-error-warning-line text-sm" />
                                Este é o email do administrador. Use um email diferente.
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
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Cursos (opcional)
                        </Label>

                        {/* Selected courses chips */}
                        {selectedCourses.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedCourses.map((course) => (
                                    <Badge
                                        key={course.id}
                                        variant="secondary"
                                        className="text-xs bg-primary/8 text-primary/80 pr-1 gap-1"
                                    >
                                        {course.name}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCourse(course.id)}
                                            className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive/20 hover:text-destructive transition-colors"
                                        >
                                            <i className="ri-close-line text-[10px]" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Add course selector */}
                        {unselectedCourses.length > 0 && (
                            <div className="flex gap-2">
                                <Select value={courseToAdd} onValueChange={setCourseToAdd}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecione um curso" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {unselectedCourses.map((course) => (
                                            <SelectItem
                                                key={course.id}
                                                value={course.id.toString()}
                                                className="rounded-lg"
                                            >
                                                {course.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    onClick={handleAddCourse}
                                    className="btn-brand shrink-0"
                                    disabled={!courseToAdd}
                                >
                                    <i className="ri-add-line" />
                                </Button>
                            </div>
                        )}

                        {unselectedCourses.length === 0 && selectedCourses.length > 0 && (
                            <p className="text-xs text-muted-foreground italic">
                                Todos os cursos foram adicionados.
                            </p>
                        )}
                    </div>

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
