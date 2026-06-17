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
import type { AdminRole } from "@/types/admin-user";

interface AddAdminModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { name: string; email: string; password: string; role: AdminRole }) => void;
    isLoading?: boolean;
}

export function AddAdminModal({ open, onOpenChange, onSubmit, isLoading }: AddAdminModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<AdminRole>("support");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!open) {
            setName("");
            setEmail("");
            setPassword("");
            setRole("support");
            setShowPassword(false);
        }
    }, [open]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim() || !password.trim()) return;
        onSubmit({ name: name.trim(), email: email.trim(), password, role });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-user-add-line" />
                        Adicionar Administrador
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="admin-name">Nome</Label>
                        <Input
                            id="admin-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do administrador"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="admin-email">E-mail *</Label>
                        <Input
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="admin-password">Senha *</Label>
                        <div className="relative">
                            <Input
                                id="admin-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Senha de acesso"
                                required
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Perfil</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrador Completo</SelectItem>
                                <SelectItem value="support">Suporte</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            {role === 'admin'
                                ? "Acesso total a todas as funcionalidades."
                                : "Acesso limitado a: Dashboard, Alunos, FAQ e Transcrições."
                            }
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !email.trim() || !password.trim()}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" /> Salvando...
                                </span>
                            ) : (
                                "Criar Administrador"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
