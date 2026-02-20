import { Button } from "@/components/ui/button";

interface TranscriptEmptyStateProps {
    hasFilters: boolean;
    onCreateTranscript: () => void;
}

export function TranscriptEmptyState({
    hasFilters,
    onCreateTranscript,
}: TranscriptEmptyStateProps) {
    if (hasFilters) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <i className="ri-search-line text-4xl mb-3" />
                <h3 className="font-semibold text-foreground mb-1">
                    Nenhuma transcrição encontrada
                </h3>
                <p className="text-sm">
                    Tente ajustar os filtros ou a busca.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <i className="ri-file-text-line text-5xl mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
                Nenhuma transcrição criada
            </h3>
            <p className="text-sm mb-4">
                Adicione transcrições para melhorar a busca dos seus alunos.
            </p>
            <Button onClick={onCreateTranscript} className="btn-brand">
                <i className="ri-add-line mr-2" />
                Criar Primeira Transcrição
            </Button>
        </div>
    );
}
