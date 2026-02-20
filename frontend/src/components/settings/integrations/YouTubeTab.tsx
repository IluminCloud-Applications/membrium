import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IntegrationToggle } from "../IntegrationToggle";
import { YouTubeApiForm } from "./YouTubeApiForm";
import { YouTubeSetupGuide } from "./YouTubeSetupGuide";

export function YouTubeTab() {
    const [enabled, setEnabled] = useState(false);
    const [clientId, setClientId] = useState("");
    const [clientSecret, setClientSecret] = useState("");
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

    async function handleSave() {
        setSaving(true);
        // TODO: API call to save YouTube credentials
        setTimeout(() => setSaving(false), 800);
    }

    async function handleTestConnection() {
        setTesting(true);
        setTestResult(null);
        // TODO: API call to test YouTube OAuth connection
        setTimeout(() => {
            setTestResult(clientId && clientSecret ? "success" : "error");
            setTesting(false);
        }, 1200);
    }

    const canTest = clientId.trim().length > 0 && clientSecret.trim().length > 0;
    const canSave = canTest;

    return (
        <IntegrationToggle
            id="youtubeToggle"
            icon="ri-youtube-line"
            title="YouTube"
            description="Faça upload de vídeos para o YouTube via API"
            enabled={enabled}
            onToggle={setEnabled}
        >
            {/* Info alert */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <i className="ri-information-line text-blue-500" />
                <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                    A integração com o YouTube permite fazer upload de vídeos diretamente
                    pela API, sem precisar acessar o YouTube manualmente.
                </AlertDescription>
            </Alert>

            {/* OAuth credentials form */}
            <YouTubeApiForm
                clientId={clientId}
                setClientId={setClientId}
                clientSecret={clientSecret}
                setClientSecret={setClientSecret}
            />

            {/* Setup guide */}
            <YouTubeSetupGuide />

            {/* Test result feedback */}
            {testResult === "success" && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 animate-fade-in">
                    <i className="ri-check-line text-green-500" />
                    <AlertDescription className="text-sm text-green-700 dark:text-green-300">
                        Conexão com a API do YouTube estabelecida com sucesso!
                    </AlertDescription>
                </Alert>
            )}
            {testResult === "error" && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 animate-fade-in">
                    <i className="ri-error-warning-line text-red-500" />
                    <AlertDescription className="text-sm text-red-700 dark:text-red-300">
                        Não foi possível conectar. Verifique suas credenciais e tente novamente.
                    </AlertDescription>
                </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing || !canTest}
                >
                    {testing ? (
                        <>
                            <i className="ri-loader-4-line animate-spin mr-2" />
                            Testando...
                        </>
                    ) : (
                        <>
                            <i className="ri-wifi-line mr-2" />
                            Testar Conexão
                        </>
                    )}
                </Button>
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
