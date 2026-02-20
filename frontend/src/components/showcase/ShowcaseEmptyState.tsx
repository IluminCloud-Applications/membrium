import { Button } from "@/components/ui/button";

interface ShowcaseEmptyStateProps {
    hasFilters: boolean;
    onCreateItem: () => void;
}

export function ShowcaseEmptyState({ hasFilters, onCreateItem }: ShowcaseEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border bg-card shadow-sm">
            <i className={`${hasFilters ? "ri-search-line" : "ri-store-2-line"} text-5xl mb-3`} />

            <h3 className="font-semibold text-foreground mb-1">
                {hasFilters ? "Nenhum item encontrado" : "Vitrine vazia"}
            </h3>

            <p className="text-sm mb-4 max-w-sm text-center">
                {hasFilters
                    ? "Tente ajustar os filtros ou a busca para encontrar o item."
                    : "Comece adicionando seu primeiro item à vitrine para exibir aos seus alunos."}
            </p>

            {!hasFilters && (
                <Button onClick={onCreateItem} className="btn-brand text-sm">
                    <i className="ri-add-line mr-1" />
                    Criar Primeiro Item
                </Button>
            )}
        </div>
    );
}
