import type { DiskUsage } from "@/types/file";

interface FileStatsProps {
    totalFiles: number;
    unusedFiles: number;
    totalSize: number;
    diskUsage: DiskUsage | null;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function FileStats({
    totalFiles,
    unusedFiles,
    totalSize,
    diskUsage,
}: FileStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total de Arquivos */}
            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i className="ri-file-3-line text-primary text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Total de Arquivos
                    </p>
                    <p className="text-xl font-bold">{totalFiles}</p>
                </div>
            </div>

            {/* Espaço Utilizado (Arquivos) */}
            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <i className="ri-hard-drive-2-line text-blue-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Espaço dos Arquivos
                    </p>
                    <p className="text-xl font-bold">{formatBytes(totalSize)}</p>
                </div>
            </div>

            {/* Arquivos Não Utilizados */}
            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <i className="ri-file-warning-line text-amber-600 text-lg" />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Não Utilizados
                    </p>
                    <p className="text-xl font-bold text-amber-600">
                        {unusedFiles}
                    </p>
                </div>
            </div>

            {/* Espaço em Disco (Docker) */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <i className="ri-server-line text-emerald-600 text-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">
                            Disco do Servidor
                        </p>
                        {diskUsage ? (
                            <p className="text-xl font-bold">
                                {formatBytes(diskUsage.used)}{" "}
                                <span className="text-sm font-normal text-muted-foreground">
                                    / {formatBytes(diskUsage.total)}
                                </span>
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Carregando...
                            </p>
                        )}
                    </div>
                </div>
                {diskUsage && (
                    <DiskProgressBar percentage={diskUsage.usedPercentage} />
                )}
            </div>
        </div>
    );
}

function DiskProgressBar({ percentage }: { percentage: number }) {
    const color =
        percentage > 90
            ? "bg-destructive"
            : percentage > 70
                ? "bg-amber-500"
                : "bg-emerald-500";

    return (
        <div className="w-full">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">
                {percentage.toFixed(1)}% usado
            </p>
        </div>
    );
}
