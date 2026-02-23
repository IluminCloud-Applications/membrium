import { Button } from "@/components/ui/button";
import type { YouTubeUploadResult } from "@/services/youtubeUpload";

interface BulkUploadProgressProps {
    results: YouTubeUploadResult[];
    onClose: () => void;
}

export function BulkUploadProgress({ results, onClose }: BulkUploadProgressProps) {
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const allSuccess = failCount === 0;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className={`flex items-center gap-3 rounded-lg p-4 ${allSuccess
                    ? "bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : "bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                }`}>
                <i className={`text-2xl ${allSuccess
                        ? "ri-check-double-line text-green-500"
                        : "ri-error-warning-line text-amber-500"
                    }`} />
                <div>
                    <p className={`text-sm font-semibold ${allSuccess
                            ? "text-green-800 dark:text-green-200"
                            : "text-amber-800 dark:text-amber-200"
                        }`}>
                        {allSuccess
                            ? "Todos os vídeos foram enviados com sucesso!"
                            : `${successCount} de ${results.length} vídeos enviados`}
                    </p>
                    {failCount > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            {failCount} {failCount === 1 ? "vídeo falhou" : "vídeos falharam"}.
                        </p>
                    )}
                </div>
            </div>

            {/* Results list */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {results.map((result, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-sm ${result.success
                                ? "border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-800"
                                : "border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-800"
                            }`}
                    >
                        <i className={`text-lg ${result.success
                                ? "ri-check-line text-green-500"
                                : "ri-close-line text-red-500"
                            }`} />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            {result.success && result.video_url && (
                                <p className="text-xs text-muted-foreground truncate">
                                    <i className="ri-youtube-line mr-1" />
                                    {result.video_url}
                                </p>
                            )}
                            {!result.success && result.error && (
                                <p className="text-xs text-red-500">{result.error}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Close button */}
            <div className="flex justify-end pt-2 border-t">
                <Button onClick={onClose} className="btn-brand">
                    Fechar
                </Button>
            </div>
        </div>
    );
}
