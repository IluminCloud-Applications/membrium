export function FileEmptyState({ hasFilters }: { hasFilters: boolean }) {
    if (hasFilters) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <i className="ri-search-line text-4xl mb-3" />
                <h3 className="font-semibold text-foreground mb-1">
                    Nenhum arquivo encontrado
                </h3>
                <p className="text-sm">Tente ajustar os filtros ou a busca.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <i className="ri-folder-open-line text-5xl mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
                Nenhum arquivo encontrado
            </h3>
            <p className="text-sm">
                Os arquivos enviados aparecerão aqui automaticamente.
            </p>
        </div>
    );
}
