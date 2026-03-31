import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IntegrationToggle } from "../IntegrationToggle";
import { integrationsService } from "@/services/integrations";

export function ProxyTab() {
    const [enabled, setEnabled] = useState(false);
    const [url, setUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const loadData = useCallback(async () => {
        try {
            const res = await integrationsService.getAll();
            if (res.proxy) {
                setEnabled(res.proxy.enabled);
                setUrl(res.proxy.url || "");
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
            const res = await integrationsService.updateProxy({
                enabled: false,
                url: url,
            });
            setEnabled(false);
            setFeedback({ message: res.message, type: "success" });
        } catch {
            setFeedback({ message: "Erro ao desabilitar Proxy", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateProxy({
                enabled,
                url,
            });
            setFeedback({ message: res.message, type: "success" });
        } catch {
            setFeedback({ message: "Erro ao salvar configurações de Proxy", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    const canSave = url.trim().length > 0;

    return (
        <IntegrationToggle
            id="proxyToggle"
            icon="ri-shield-keyhole-line"
            title="Proxy (APIs e Extração)"
            description="Mascare o IP do servidor em requisições de extração como legendas do YouTube."
            enabled={enabled}
            onToggle={handleToggle}
        >
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <i className="ri-information-line text-amber-500" />
                <AlertDescription className="text-sm text-amber-700 dark:text-amber-300">
                    O YouTube e outros serviços costumam bloquear requisições de infraestruturas em nuvem (Data Centers).
                    Configurar um IP proxy residencial ou rotativo previne erros do tipo "IP Blocked" durante a 
                    coleta automática de legendas e transcrições.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="proxyUrl">URL do Proxy</Label>
                    <Input
                        id="proxyUrl"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Ex: http://usuario:senha@proxy-rotativo.com:8000"
                    />
                    <p className="text-xs text-muted-foreground">
                        Utilize o formato completo com protocolo, autenticação (se houver) e porta.
                    </p>
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
