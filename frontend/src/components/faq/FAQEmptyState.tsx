import { Button } from "@/components/ui/button";

interface FAQEmptyStateProps {
    hasFilters: boolean;
    onCreateFaq: () => void;
}

export function FAQEmptyState({ hasFilters, onCreateFaq }: FAQEmptyStateProps) {
    if (hasFilters) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <i className="ri-search-line text-4xl mb-3" />
                <h3 className="font-semibold text-foreground mb-1">
                    Nenhum FAQ encontrado
                </h3>
                <p className="text-sm">
                    Tente ajustar os filtros ou a busca.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <i className="ri-question-answer-line text-5xl mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
                Nenhum FAQ criado
            </h3>
            <p className="text-sm mb-4">
                Crie FAQs para ajudar seus alunos com as dúvidas mais frequentes.
            </p>
            <Button onClick={onCreateFaq} className="btn-brand">
                <i className="ri-add-line mr-2" />
                Criar Primeiro FAQ
            </Button>
        </div>
    );
}
