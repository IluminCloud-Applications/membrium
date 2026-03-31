import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IntegrationToggle } from "../IntegrationToggle";
import { integrationsService } from "@/services/integrations";

export function VTurbTab() {
    const [enabled, setEnabled] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [orgId, setOrgId] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadData = useCallback(async () => {
        try {
            const res = await integrationsService.getAll();
            if (res.vturb) {
                setEnabled(res.vturb.enabled);
                setApiKey(res.vturb.api_key || "");
                setOrgId(res.vturb.org_id || "");
            }
        } catch { /* keep defaults */ }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /**
     * Called by the toggle switch.
     * - Enabling: just expand the form (don't call API yet — fields may not be filled)
     * - Disabling: call API immediately to disable, preserving saved credentials
     */
    async function handleToggle(newValue: boolean) {
        if (newValue) {
            // Just open the form so the user can fill in the fields
            setEnabled(true);
            return;
        }

        // Disabling — call API immediately
        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateVTurb({
                enabled: false,
                api_key: apiKey,
                org_id: orgId,
            });
            setEnabled(false);
            setFeedback({ message: res.message, type: "success" });
        } catch {
            setFeedback({ message: "Erro ao desabilitar VTurb", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    /** Called by "Salvar Configurações" button */
    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateVTurb({
                enabled,
                api_key: apiKey,
                org_id: orgId,
            });
            setFeedback({ message: res.message, type: "success" });
        } catch {
            setFeedback({ message: "Erro ao salvar configurações do VTurb", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    const canSave = apiKey.trim().length > 0 && orgId.trim().length > 0;

    return (
        <IntegrationToggle
            id="vturbToggle"
            icon="ri-play-circle-line"
            title="VTurb"
            description="Player de vídeo inteligente para seus cursos e aulas"
            enabled={enabled}
            onToggle={handleToggle}
        >
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <i className="ri-information-line text-blue-500" />
                <AlertDescription className="text-sm text-blue-700 dark:text-blue-300">
                    Integre o VTurb para usar um player de vídeo profissional com recursos
                    avançados. Preencha a API Key e o ID da organização para habilitar a busca
                    de vídeos diretamente no modal de aulas.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Key */}
                <div className="space-y-2">
                    <Label htmlFor="vturbApiKey">API Key</Label>
                    <div className="relative">
                        <Input
                            id="vturbApiKey"
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Sua API Key do VTurb"
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
                    <p className="text-xs text-muted-foreground">
                        Encontre em Configurações → API no painel VTurb.
                    </p>
                </div>

                {/* Organization ID */}
                <div className="space-y-2">
                    <Label htmlFor="vturbOrgId">ID da Organização</Label>
                    <Input
                        id="vturbOrgId"
                        value={orgId}
                        onChange={(e) => setOrgId(e.target.value)}
                        placeholder="Ex: d4400715-979b-4acf-818d-f478491cf63a"
                    />
                    <p className="text-xs text-muted-foreground">
                        Usado para renderizar o player. Ex: <code className="bg-muted px-1 rounded text-[10px]">scripts.converteai.net/&#123;org_id&#125;/...</code>
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
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
