import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IntegrationToggle } from "../IntegrationToggle";
import { YouTubeApiForm } from "./YouTubeApiForm";
import { YouTubeSetupGuide } from "./YouTubeSetupGuide";
import { YouTubeConnectionStatus } from "./YouTubeConnectionStatus";
import { integrationsService } from "@/services/integrations";

export function YouTubeTab() {
    const [enabled, setEnabled] = useState(false);
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [channelName, setChannelName] = useState("");
    const [connecting, setConnecting] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const res = await integrationsService.getAll();
            if (res.youtube) {
                setEnabled(res.youtube.enabled);
                setClientId(res.youtube.client_id || "");
                setClientSecret(res.youtube.client_secret || "");
                setConnected(res.youtube.connected || false);
                setChannelName(res.youtube.channel_name || "");
            }
        } catch { /* keep defaults */ }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Listen for OAuth callback messages from popup
    // Guard to prevent duplicate callback processing (React StrictMode)
    const callbackProcessedRef = useRef(false);

    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (
                event.data?.type === "youtube-oauth-callback" &&
                event.data?.code &&
                !callbackProcessedRef.current
            ) {
                callbackProcessedRef.current = true;
                handleOAuthCallback(event.data.code);
            }
        }
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId, clientSecret]);

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateYouTube({
                enabled,
                client_id: clientId,
                client_secret: clientSecret,
            });
            setFeedback(res.message);
        } catch {
            setFeedback("Erro ao salvar");
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    async function handleConnect() {
        callbackProcessedRef.current = false;
        setConnecting(true);
        try {
            // Auto-save credentials before connecting
            await integrationsService.updateYouTube({
                enabled,
                client_id: clientId,
                client_secret: clientSecret,
            });

            const redirectUri = `${window.location.origin}/auth/youtube/callback`;
            const res = await integrationsService.getYouTubeAuthUrl(redirectUri);

            if (res.success && res.auth_url) {
                // Open popup for OAuth consent
                const popup = window.open(
                    res.auth_url,
                    "youtube-oauth",
                    "width=600,height=700,scrollbars=yes"
                );

                if (!popup) {
                    setFeedback("Popup bloqueado. Permita popups para este site.");
                    setConnecting(false);
                }
            } else {
                setFeedback(res.message || "Erro ao gerar URL de autenticação.");
                setConnecting(false);
            }
        } catch {
            setFeedback("Erro ao conectar com YouTube.");
            setConnecting(false);
        }
    }

    async function handleOAuthCallback(code: string) {
        try {
            const redirectUri = `${window.location.origin}/auth/youtube/callback`;
            const res = await integrationsService.youTubeCallback(code, redirectUri);

            if (res.success) {
                setConnected(true);
                setChannelName(res.channel_name || "");
                setFeedback(res.message);
            } else {
                setFeedback(res.message || "Erro ao conectar.");
            }
        } catch {
            setFeedback("Erro ao processar callback.");
        } finally {
            setConnecting(false);
            setTimeout(() => setFeedback(null), 5000);
        }
    }

    async function handleDisconnect() {
        try {
            const res = await integrationsService.disconnectYouTube();
            if (res.success) {
                setConnected(false);
                setChannelName("");
                setFeedback(res.message);
                setTimeout(() => setFeedback(null), 3000);
            }
        } catch {
            setFeedback("Erro ao desconectar.");
        }
    }

    const canSave = clientId.trim().length > 0 && clientSecret.trim().length > 0;
    const canConnect = canSave && enabled;

    return (
        <IntegrationToggle
            id="youtubeToggle"
            icon="ri-youtube-line"
            title="YouTube"
            description="Faça upload de vídeos para o YouTube via API"
            enabled={enabled}
            onToggle={setEnabled}
        >
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <i className="ri-information-line text-blue-500" />
                <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                    A integração com o YouTube permite fazer upload de vídeos diretamente
                    pela área de cursos, sem precisar acessar o YouTube manualmente.
                </AlertDescription>
            </Alert>

            <YouTubeApiForm
                clientId={clientId}
                setClientId={setClientId}
                clientSecret={clientSecret}
                setClientSecret={setClientSecret}
            />

            {/* Connection status */}
            <YouTubeConnectionStatus
                connected={connected}
                channelName={channelName}
                connecting={connecting}
                canConnect={canConnect}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
            />

            <YouTubeSetupGuide />

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
                {feedback && (
                    <span className="text-sm text-green-600 dark:text-green-400 animate-fade-in">
                        {feedback}
                    </span>
                )}
                <Button
                    onClick={handleSave}
                    disabled={saving || !canSave}
                    className="btn-brand"
                >
                    {saving ? (
                        <>
                            <i className="ri-loader-4-line animate-spin mr-2" />
                            Salvando...
                        </>
                    ) : (
                        "Salvar Configurações"
                    )}
                </Button>
            </div>
        </IntegrationToggle>
    );
}
