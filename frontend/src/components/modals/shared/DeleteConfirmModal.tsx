import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    isLoading?: boolean;
}

/**
 * Reusable delete confirmation dialog.
 * Can be used for courses, students, or any resource deletion.
 */
export function DeleteConfirmModal({
    open,
    onOpenChange,
    onConfirm,
    title = "Tem certeza?",
    description = "Esta ação não pode ser desfeita. Isso removerá permanentemente este item.",
    confirmLabel = "Excluir",
    isLoading,
}: DeleteConfirmModalProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <i className="ri-error-warning-line text-destructive" />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <i className="ri-loader-4-line animate-spin" />
                                Excluindo...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <i className="ri-delete-bin-line" />
                                {confirmLabel}
                            </span>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
