import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
    connected: boolean;
    sessionError?: string;
    canalNome: string;
    canalId: string;
    phone: string;
    onDisconnect: () => void;
    onCreateChannel: () => void;
    creatingChannel: boolean;
}

export function TelegramConnectionStatus({
    connected,
    sessionError,
    canalNome,
    canalId,
    phone,
    onDisconnect,
    onCreateChannel,
    creatingChannel,
}: Props) {
    // Session expirada — mostra aviso e botão para reconectar
    if (!connected && sessionError) {
        return (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <i className="ri-alert-line text-red-500" />
                <AlertDescription className="text-sm text-red-700 dark:text-red-300">
                    <strong>Sessão expirada:</strong> {sessionError}
                </AlertDescription>
            </Alert>
        );
    }

    if (!connected) return null;

    const hasChannel = Boolean(canalId);

    return (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4 space-y-3">
            {/* Status header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Telegram Conectado
                    </span>
                    {phone && (
                        <Badge variant="secondary" className="text-xs">
                            <i className="ri-phone-line mr-1" />
                            {phone}
                        </Badge>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDisconnect}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                    <i className="ri-logout-box-line mr-1" />
                    Desconectar
                </Button>
            </div>

            {/* Canal */}
            {hasChannel ? (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <i className="ri-megaphone-line" />
                    <span>
                        Canal: <strong>{canalNome || "Canal sem nome"}</strong>
                        <span className="text-xs text-muted-foreground ml-2">(ID: {canalId})</span>
                    </span>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        <i className="ri-alert-line mr-1" />
                        Nenhum canal criado. Crie um para começar a fazer uploads.
                    </p>
                    <Button
                        onClick={onCreateChannel}
                        disabled={creatingChannel}
                        variant="outline"
                        size="sm"
                        className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                        {creatingChannel ? (
                            <><i className="ri-loader-4-line animate-spin mr-1" />Criando...</>
                        ) : (
                            <><i className="ri-add-line mr-1" />Criar Canal de Armazenamento</>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
