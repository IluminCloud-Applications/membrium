import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Student } from "@/types/student";

interface QuickAccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
}

export function QuickAccessModal({
    open,
    onOpenChange,
    student,
}: QuickAccessModalProps) {
    const [copied, setCopied] = useState(false);

    if (!student) return null;

    const quickAccessUrl = `${window.location.origin}/quick-access/${student.quickAccessToken}`;

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(quickAccessUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const input = document.querySelector<HTMLInputElement>(
                "#quick-access-input"
            );
            if (input) {
                input.select();
                document.execCommand("copy");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                if (!value) setCopied(false);
                onOpenChange(value);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-link text-primary" />
                        Link de Acesso Rápido
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

                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Este link permite que o aluno acesse a plataforma
                            diretamente, sem precisar de email e senha.
                        </p>

                        {/* Link + copy */}
                        <div className="flex gap-2">
                            <Input
                                id="quick-access-input"
                                value={quickAccessUrl}
                                readOnly
                                className="text-xs font-mono"
                                onClick={(e) =>
                                    (e.target as HTMLInputElement).select()
                                }
                            />
                            <Button
                                onClick={handleCopy}
                                variant={copied ? "default" : "outline"}
                                className={
                                    copied
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                                        : "shrink-0"
                                }
                            >
                                {copied ? (
                                    <span className="flex items-center gap-1">
                                        <i className="ri-check-line" />
                                        Copiado
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <i className="ri-file-copy-line" />
                                        Copiar
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        <i className="ri-error-warning-line text-lg shrink-0 mt-0.5" />
                        <p className="text-xs">
                            Cuidado ao compartilhar este link. Qualquer pessoa
                            com este link terá acesso à conta do aluno.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
