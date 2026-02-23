import { Button } from "@/components/ui/button";

interface YouTubeConnectionStatusProps {
    connected: boolean;
    channelName: string;
    connecting: boolean;
    canConnect: boolean;
    onConnect: () => void;
    onDisconnect: () => void;
}

export function YouTubeConnectionStatus({
    connected,
    channelName,
    connecting,
    canConnect,
    onConnect,
    onDisconnect,
}: YouTubeConnectionStatusProps) {
    if (connected) {
        return (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                        <i className="ri-youtube-fill text-red-500 text-xl" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center gap-1.5">
                            <i className="ri-check-double-line text-green-500" />
                            YouTube Conectado
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                            Canal: <span className="font-medium">{channelName}</span>
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDisconnect}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                >
                    <i className="ri-link-unlink mr-1.5" />
                    Desconectar
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                    <i className="ri-youtube-line text-amber-600 text-xl" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        YouTube não conectado
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        Conecte seu canal para habilitar uploads automáticos.
                    </p>
                </div>
            </div>
            <Button
                onClick={onConnect}
                disabled={!canConnect || connecting}
                className="btn-brand gap-1.5"
                size="sm"
            >
                {connecting ? (
                    <>
                        <i className="ri-loader-4-line animate-spin" />
                        Conectando...
                    </>
                ) : (
                    <>
                        <i className="ri-link" />
                        Conectar YouTube
                    </>
                )}
            </Button>
        </div>
    );
}
