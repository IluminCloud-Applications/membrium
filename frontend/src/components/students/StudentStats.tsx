interface StudentStatsProps {
    total: number;
    active: number;
    inactive: number;
}

export function StudentStats({ total, active, inactive }: StudentStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="ri-group-line text-primary text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Total de Alunos
                    </p>
                    <p className="text-xl font-bold">{total}</p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <i className="ri-user-follow-line text-emerald-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Ativos
                    </p>
                    <p className="text-xl font-bold text-emerald-600">
                        {active}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <i className="ri-user-unfollow-line text-amber-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Inativos
                    </p>
                    <p className="text-xl font-bold text-amber-600">
                        {inactive}
                    </p>
                </div>
            </div>
        </div>
    );
}
