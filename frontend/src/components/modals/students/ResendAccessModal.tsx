import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Student } from "@/types/student";

interface ResendAccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
    onConfirm: (studentId: number, password?: string) => void;
    isLoading?: boolean;
}

export function ResendAccessModal({
    open,
    onOpenChange,
    student,
    onConfirm,
    isLoading,
}: ResendAccessModalProps) {
    const [password, setPassword] = useState("");

    if (!student) return null;

    function handleConfirm() {
        if (!student) return;
        onConfirm(student.id, password.trim() || undefined);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-send-plane-line text-primary" />
                        Reenviar Acesso
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Student info */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {student.email}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Os dados de acesso serão reenviados para{" "}
                        <strong className="text-foreground">
                            {student.email}
                        </strong>{" "}
                        através das integrações configuradas (Email e/ou WhatsApp).
                    </p>

                    {/* Senha personalizada ou padrão */}
                    <div className="space-y-2">
                        <Label htmlFor="resend-password" className="text-sm font-medium">
                            Senha de Acesso (opcional)
                        </Label>
                        <Input
                            id="resend-password"
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Deixe em branco para usar a senha padrão"
                        />
                        <p className="text-xs text-muted-foreground">
                            Se deixar em branco, será enviada e definida a senha padrão configurada no sistema.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-blue-500/5 border-blue-500/20">
                        <i className="ri-information-line text-primary text-lg shrink-0" />
                        <p className="text-xs text-muted-foreground">
                            A senha de acesso do aluno será atualizada para corresponder exatamente à enviada na notificação.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            className="btn-brand flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <i className="ri-loader-4-line animate-spin" />
                                    Enviando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <i className="ri-send-plane-line" />
                                    Reenviar Acesso
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
