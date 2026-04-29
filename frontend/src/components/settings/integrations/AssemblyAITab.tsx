import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IntegrationToggle } from "../IntegrationToggle";
import { integrationsService } from "@/services/integrations";

export function AssemblyAITab() {
    const [enabled, setEnabled] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadData = useCallback(async () => {
        try {
            const res = await integrationsService.getAll();
            if (res.assemblyai) {
                setEnabled(res.assemblyai.enabled);
                setApiKey(res.assemblyai.api_key || "");
            }
        } catch { /* keep defaults */ }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleToggle(newValue: boolean) {
        if (newValue) {
            setEnabled(true);
            return;
        }

        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateAssemblyAI({
                enabled: false,
                api_key: apiKey,
            });
            setEnabled(false);
            setFeedback({ message: res.message, type: "success" });
        } catch {
            setFeedback({ message: "Erro ao desabilitar AssemblyAI", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateAssemblyAI({
                enabled,
                api_key: apiKey,
            });
            setFeedback({ message: res.message, type: "success" });
        } catch {
            setFeedback({ message: "Erro ao salvar configurações do AssemblyAI", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    const canSave = apiKey.trim().length > 0;

    return (
        <IntegrationToggle
            id="assemblyaiToggle"
            icon="ri-mic-line"
            title="AssemblyAI"
            description="Transcreva automaticamente vídeos longos."
            enabled={enabled}
            onToggle={handleToggle}
        >
            <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
                <i className="ri-information-line text-purple-500" />
                <AlertDescription className="text-sm text-purple-700 dark:text-purple-300">
                    O AssemblyAI é utilizado para fornecer transcrições automatizadas
                    e geração de FAQ / legendedas para os seus vídeos.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Key */}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="assemblyaiApiKey">API Key</Label>
                    <div className="relative">
                        <Input
                            id="assemblyaiApiKey"
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Sua chave API da AssemblyAI"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className={showKey ? "ri-eye-off-line" : "ri-eye-line"} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
                {feedback && (
                    <span
                        className={`text-sm animate-fade-in ${
                            feedback.type === "success"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                        }`}
                    >
                        {feedback.message}
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
