import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * YouTube OAuth Callback Page
 * 
 * This page is opened in a popup when the user authorizes YouTube access.
 * It extracts the auth code from the URL, sends it to the parent window,
 * and then closes the popup.
 */
export function YouTubeCallbackPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [message, setMessage] = useState("Processando autorização...");

    useEffect(() => {
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");

        if (errorParam) {
            setStatus("error");
            setMessage("Autorização negada. Você pode fechar esta janela.");
            return;
        }

        if (code) {
            // Send code to parent window
            if (window.opener) {
                window.opener.postMessage(
                    { type: "youtube-oauth-callback", code },
                    window.location.origin
                );
                setStatus("success");
                setMessage("YouTube conectado! Fechando esta janela...");

                // Auto-close popup after 2 seconds
                setTimeout(() => window.close(), 2000);
            } else {
                setStatus("error");
                setMessage("Janela pai não encontrada. Feche e tente novamente.");
            }
        } else {
            setStatus("error");
            setMessage("Código de autorização não encontrado.");
        }
    }, [searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-4 p-8">
                {status === "processing" && (
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary" />
                )}
                {status === "success" && (
                    <i className="ri-check-double-line text-4xl text-green-500" />
                )}
                {status === "error" && (
                    <i className="ri-error-warning-line text-4xl text-red-500" />
                )}
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}
