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
import type { AdminUser, AdminRole, UpdateAdminRequest } from "@/types/admin-user";

interface EditAdminModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    admin: AdminUser | null;
    onSubmit: (id: number, data: UpdateAdminRequest) => void;
    isLoading?: boolean;
}

export function EditAdminModal({ open, onOpenChange, admin, onSubmit, isLoading }: EditAdminModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<AdminRole>("support");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (open && admin) {
            setName(admin.name || "");
            setEmail(admin.email);
            setRole(admin.role);
            setPassword("");
            setShowPassword(false);
        }
    }, [open, admin]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!admin || !email.trim()) return;

        const data: UpdateAdminRequest = {
            name: name.trim(),
            email: email.trim(),
            role,
        };

        // Only include password if user typed a new one
        if (password.trim()) {
            data.password = password;
        }

        onSubmit(admin.id, data);
    }

    if (!admin) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-user-settings-line" />
                        Editar Administrador
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-admin-name">Nome</Label>
                        <Input
                            id="edit-admin-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome do administrador"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-admin-email">E-mail *</Label>
                        <Input
                            id="edit-admin-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@exemplo.com"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Perfil</Label>
                        <Select
                            value={role}
                            onValueChange={(v) => setRole(v as AdminRole)}
                            disabled={admin.is_primary}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrador Completo</SelectItem>
                                <SelectItem value="support">Suporte</SelectItem>
                            </SelectContent>
                        </Select>
                        {admin.is_primary && (
                            <p className="text-xs text-muted-foreground">
                                O perfil do administrador principal não pode ser alterado.
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-admin-password">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="edit-admin-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Deixe em branco para manter a atual"
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
                        <p className="text-xs text-muted-foreground">
                            Preencha apenas se deseja alterar a senha.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !email.trim()}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" /> Salvando...
                                </span>
                            ) : (
                                "Salvar Alterações"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
