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
import type { Student } from "@/types/student";

interface EditStudentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: EditStudentFormData) => void;
    student: Student | null;
    adminEmail?: string;
    isLoading?: boolean;
}

export interface EditStudentFormData {
    id: number;
    name: string;
    email: string;
    /** Empty string means keep current password */
    password: string;
}

export function EditStudentModal({
    open,
    onOpenChange,
    onSubmit,
    student,
    adminEmail = "",
    isLoading,
}: EditStudentModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Pre-fill when student changes
    useEffect(() => {
        if (student) {
            setName(student.name);
            setEmail(student.email);
            setPassword("");
        }
    }, [student]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!student) return;
        onSubmit({ id: student.id, name, email, password });
    }

    const isAdminEmail = adminEmail !== "" && email.trim().toLowerCase() === adminEmail;
    const canSubmit = name.trim() && email.trim() && !isAdminEmail;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-pencil-line text-primary" />
                        Editar Aluno
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-name" className="text-sm font-medium">
                            Nome
                        </Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do aluno"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-email" className="text-sm font-medium">
                            Email
                        </Label>
                        <Input
                            id="edit-email"
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
                        <Label htmlFor="edit-password" className="text-sm font-medium">
                            Nova Senha
                        </Label>
                        <Input
                            id="edit-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Deixe em branco para manter a atual"
                        />
                        <p className="text-xs text-muted-foreground">
                            Deixe vazio para manter a senha atual do aluno.
                        </p>
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
                                    Salvando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className="ri-check-line" />
                                    Salvar Alterações
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
