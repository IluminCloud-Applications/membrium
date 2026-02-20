import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
    isLoading?: boolean;
}

export interface AddStudentFormData {
    name: string;
    email: string;
    password: string;
    courseId: number | null;
}

export function AddStudentModal({
    open,
    onOpenChange,
    onSubmit,
    availableCourses,
    isLoading,
}: AddStudentModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [courseId, setCourseId] = useState<string>("");

    useEffect(() => {
        if (!open) resetForm();
    }, [open]);

    function resetForm() {
        setName("");
        setEmail("");
        setPassword("");
        setCourseId("");
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onSubmit({
            name,
            email,
            password,
            courseId: courseId ? Number(courseId) : null,
        });
    }

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
                        />
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

                    {/* Course */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Curso (opcional)
                        </Label>
                        <Select value={courseId} onValueChange={setCourseId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um curso" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {availableCourses.map((course) => (
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
                            disabled={isLoading || !name.trim() || !email.trim()}
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
