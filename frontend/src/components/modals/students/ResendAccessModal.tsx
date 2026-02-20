import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Student } from "@/types/student";

interface ResendAccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
    onConfirm: (studentId: number) => void;
    isLoading?: boolean;
}

export function ResendAccessModal({
    open,
    onOpenChange,
    student,
    onConfirm,
    isLoading,
}: ResendAccessModalProps) {
    if (!student) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-mail-send-line text-primary" />
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
                        Um email será enviado para{" "}
                        <strong className="text-foreground">
                            {student.email}
                        </strong>{" "}
                        com os dados de acesso à plataforma.
                    </p>

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
                            onClick={() => onConfirm(student.id)}
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
                                    <i className="ri-mail-send-line" />
                                    Enviar Email
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
