import type { DiskUsage } from "@/types/file";

interface FileStatsProps {
    totalFiles: number;
    unusedFiles: number;
    totalSize: number;
    unusedSize: number;
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
    unusedSize,
    diskUsage,
}: FileStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total de Arquivos */}
            <StatCard
                icon="ri-file-3-line"
                iconBg="bg-primary/10"
                iconColor="text-primary"
                label="Total de Arquivos"
                value={String(totalFiles)}
            />

            {/* Espaço Utilizado (Arquivos) */}
            <StatCard
                icon="ri-hard-drive-2-line"
                iconBg="bg-blue-500/10"
                iconColor="text-blue-600"
                label="Espaço dos Arquivos"
                value={formatBytes(totalSize)}
            />

            {/* Arquivos Não Utilizados */}
            <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <i className="ri-file-warning-line text-amber-600 text-lg" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">
                        Não Utilizados
                    </p>
                    <p className="text-xl font-bold text-amber-600">
                        {unusedFiles}
                    </p>
                    {unusedSize > 0 && (
                        <p className="text-xs text-amber-600/70">
                            {formatBytes(unusedSize)} podem ser liberados
                        </p>
                    )}
                </div>
            </div>

            {/* Espaço em Disco (Docker) */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
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

/* ---- Reusable stat card ---- */
interface StatCardProps {
    icon: string;
    iconBg: string;
    iconColor: string;
    label: string;
    value: string;
}

function StatCard({ icon, iconBg, iconColor, label, value }: StatCardProps) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-4">
            <div
                className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}
            >
                <i className={`${icon} ${iconColor} text-lg`} />
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-medium">
                    {label}
                </p>
                <p className="text-xl font-bold">{value}</p>
            </div>
        </div>
    );
}

/* ---- Disk progress bar ---- */
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
