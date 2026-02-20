import { Button } from "@/components/ui/button";

interface PromoteEmptyStateProps {
    hasFilters: boolean;
    onCreateItem: () => void;
}

export function PromoteEmptyState({ hasFilters, onCreateItem }: PromoteEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border bg-card shadow-sm">
            <i className={`${hasFilters ? "ri-search-line" : "ri-megaphone-line"} text-5xl mb-3`} />

            <h3 className="font-semibold text-foreground mb-1">
                {hasFilters ? "Nenhuma promoção encontrada" : "Nenhuma promoção criada"}
            </h3>

            <p className="text-sm mb-4 max-w-sm text-center">
                {hasFilters
                    ? "Tente ajustar os filtros ou a busca para encontrar a promoção."
                    : "Comece criando sua primeira promoção para engajar seus alunos!"}
            </p>

            {!hasFilters && (
                <Button onClick={onCreateItem} className="btn-brand text-sm">
                    <i className="ri-add-line mr-1" />
                    Criar Primeira Promoção
                </Button>
            )}
        </div>
    );
}
