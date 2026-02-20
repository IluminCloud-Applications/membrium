interface ShowcaseStatsProps {
    total: number;
    totalViews: number;
    totalClicks: number;
    filteredCount: number;
}

export function ShowcaseStats({ total, totalViews, totalClicks, filteredCount }: ShowcaseStatsProps) {
    const conversionRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="ri-store-2-line text-primary text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Itens na Vitrine
                    </p>
                    <p className="text-xl font-bold">{total}</p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <i className="ri-eye-line text-blue-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Visualizações
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                        {totalViews.toLocaleString("pt-BR")}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <i className="ri-cursor-line text-purple-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Cliques
                    </p>
                    <p className="text-xl font-bold text-purple-600">
                        {totalClicks.toLocaleString("pt-BR")}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <i className="ri-line-chart-line text-emerald-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Conversão
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                        {conversionRate}%{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                            ({filteredCount} ativos)
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
