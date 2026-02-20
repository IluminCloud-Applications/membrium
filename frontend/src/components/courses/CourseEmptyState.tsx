import { Button } from "@/components/ui/button";

interface CourseEmptyStateProps {
    hasFilters: boolean;
    onCreateCourse: () => void;
}

export function CourseEmptyState({ hasFilters, onCreateCourse }: CourseEmptyStateProps) {
    if (hasFilters) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <i className="ri-search-line text-4xl mb-3" />
                <h3 className="font-semibold text-foreground mb-1">
                    Nenhum curso encontrado
                </h3>
                <p className="text-sm">Tente ajustar os filtros ou a busca.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <i className="ri-book-open-line text-5xl mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
                Nenhum curso criado
            </h3>
            <p className="text-sm mb-4">Comece criando seu primeiro curso.</p>
            <Button onClick={onCreateCourse} className="btn-brand">
                <i className="ri-add-line mr-2" />
                Criar Primeiro Curso
            </Button>
        </div>
    );
}
