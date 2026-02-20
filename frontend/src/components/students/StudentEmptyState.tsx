import { Button } from "@/components/ui/button";

interface StudentEmptyStateProps {
    hasFilters: boolean;
    onAddStudent: () => void;
}

export function StudentEmptyState({ hasFilters, onAddStudent }: StudentEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-xl border bg-card shadow-sm">
            <i className={`${hasFilters ? "ri-search-line" : "ri-user-line"} text-5xl mb-3`} />

            <h3 className="font-semibold text-foreground mb-1">
                {hasFilters ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
            </h3>

            <p className="text-sm mb-4 max-w-sm text-center">
                {hasFilters
                    ? "Tente ajustar os filtros ou a busca para encontrar o aluno."
                    : "Comece adicionando seu primeiro aluno à plataforma."}
            </p>

            {!hasFilters && (
                <Button onClick={onAddStudent} className="btn-brand text-sm">
                    <i className="ri-user-add-line mr-1" />
                    Adicionar Aluno
                </Button>
            )}
        </div>
    );
}
