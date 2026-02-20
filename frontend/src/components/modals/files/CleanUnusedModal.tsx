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

interface CleanUnusedModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    unusedCount: number;
    isLoading?: boolean;
}

/**
 * Confirmation modal for cleaning all unused files.
 * Shows warning with count and irreversibility notice.
 */
export function CleanUnusedModal({
    open,
    onOpenChange,
    onConfirm,
    unusedCount,
    isLoading,
}: CleanUnusedModalProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <i className="ri-error-warning-line text-amber-500" />
                        Limpar Arquivos Não Utilizados
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Você está prestes a excluir{" "}
                        <strong className="text-foreground">
                            {unusedCount} {unusedCount === 1 ? "arquivo" : "arquivos"}
                        </strong>{" "}
                        que não estão sendo utilizados em nenhum curso, módulo,
                        vitrine ou promoção.
                        <br />
                        <br />
                        <span className="text-destructive font-medium">
                            Esta ação não pode ser desfeita.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <i className="ri-loader-4-line animate-spin" />
                                Limpando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <i className="ri-delete-bin-line" />
                                Limpar {unusedCount}{" "}
                                {unusedCount === 1 ? "arquivo" : "arquivos"}
                            </span>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
