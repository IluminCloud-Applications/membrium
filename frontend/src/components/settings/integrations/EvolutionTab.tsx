import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IntegrationToggle } from "../IntegrationToggle";
import { TemplateEditor } from "./TemplateEditor";
import { integrationsService, type EvolutionSettings, type EvolutionInstance } from "@/services/integrations";

const DEFAULT_MESSAGE = `Olá [[first_name]]! 👋\n\nSeu acesso ao curso foi liberado! ✅\n\n*Acesse com os dados abaixo:*\n\n📧 *Login:* [[email]]\n🔑 *Senha:* [[password]]\n\n🌐 *Link de acesso comum:* [[link]]\n🔑 *Link de acesso rápido:* [[fast_link]]\n\nSe precisar de ajuda, estamos à disposição!`;

export function EvolutionTab() {
    const [data, setData] = useState<EvolutionSettings>({
        enabled: false,
        url: "",
        api_key: "",
        version: "",
        instance: "",
        message_template: DEFAULT_MESSAGE,
        template_mode: "simple",
    });
    const [showApiKey, setShowApiKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [detecting, setDetecting] = useState(false);
    const [fetchingInstances, setFetchingInstances] = useState(false);
    const [instances, setInstances] = useState<EvolutionInstance[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const res = await integrationsService.getAll();
            if (res.evolution) {
                setData((prev) => ({
                    ...prev,
                    ...res.evolution,
                    message_template: res.evolution.message_template || prev.message_template,
                }));
                // If instance is already saved, add it to the list so it shows in select
                if (res.evolution.instance) {
                    setInstances([{ name: res.evolution.instance, status: 'saved' }]);
                }
            }
        } catch { /* keep defaults */ }
    }

    function update(patch: Partial<EvolutionSettings>) {
        setData((prev) => ({ ...prev, ...patch }));
    }

    async function handleDetectVersion() {
        setDetecting(true);
        setFeedback(null);
        try {
            const res = await integrationsService.detectEvolutionVersion(data.url, data.api_key);
            if (res.success && res.version) {
                update({ version: res.version });
                setFeedback(`Versão detectada: ${res.version}`);
            } else {
                setFeedback(res.message || "Não foi possível detectar a versão");
            }
        } catch {
            setFeedback("Erro ao detectar versão");
        } finally {
            setDetecting(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    async function handleFetchInstances() {
        setFetchingInstances(true);
        setFeedback(null);
        try {
            const res = await integrationsService.fetchEvolutionInstances(data.url, data.api_key);
            if (res.success && res.instances) {
                setInstances(res.instances);
                if (res.instances.length === 0) {
                    setFeedback("Nenhuma instância encontrada");
                } else {
                    setFeedback(`${res.instances.length} instância(s) encontrada(s)`);
                    // Auto-select if only one
                    if (res.instances.length === 1) {
                        update({ instance: res.instances[0].name });
                    }
                }
            } else {
                setFeedback(res.message || "Erro ao buscar instâncias");
            }
        } catch {
            setFeedback("Erro ao buscar instâncias");
        } finally {
            setFetchingInstances(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await integrationsService.updateEvolution(data);
            setFeedback(res.message);
        } catch {
            setFeedback("Erro ao salvar");
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    return (
        <IntegrationToggle
            id="evolutionToggle"
            icon="ri-whatsapp-line"
            title="Evolution API"
            description="Envie mensagens de WhatsApp para seus alunos"
            enabled={data.enabled}
            onToggle={(v) => update({ enabled: v })}
        >
            {/* URL + API Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="evolutionUrl">URL da Evolution API</Label>
                    <Input
                        id="evolutionUrl"
                        type="url"
                        value={data.url}
                        onChange={(e) => update({ url: e.target.value })}
                        placeholder="https://seu-dominio.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="evolutionApiKey">API Key</Label>
                    <div className="relative">
                        <Input
                            id="evolutionApiKey"
                            type={showApiKey ? "text" : "password"}
                            value={data.api_key}
                            onChange={(e) => update({ api_key: e.target.value })}
                            placeholder="Sua API Key da Evolution"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className={showApiKey ? "ri-eye-off-line" : "ri-eye-line"} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Version + Instance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Versão da Evolution API</Label>
                    <div className="flex gap-2">
                        <Select value={data.version} onValueChange={(v) => update({ version: v })}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione a versão" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="1.8.x" className="rounded-lg">
                                    1.8.x ou inferior
                                </SelectItem>
                                <SelectItem value="2.x.x" className="rounded-lg">
                                    2.x.x ou superior
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleDetectVersion}
                            disabled={detecting || !data.url}
                            title="Detectar versão automaticamente"
                        >
                            <i className={`ri-refresh-line ${detecting ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Instância do WhatsApp</Label>
                    <div className="flex gap-2">
                        <Select value={data.instance} onValueChange={(v) => update({ instance: v })}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione a instância" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {instances.length === 0 ? (
                                    <SelectItem value="none" disabled className="rounded-lg">
                                        Busque as instâncias primeiro
                                    </SelectItem>
                                ) : (
                                    instances.map((inst) => (
                                        <SelectItem key={inst.name} value={inst.name} className="rounded-lg">
                                            <span className="flex items-center gap-2">
                                                {inst.name}
                                                <span className={`w-2 h-2 rounded-full ${inst.status === "open" || inst.status === "CONNECTED"
                                                        ? "bg-green-500"
                                                        : "bg-muted-foreground/40"
                                                    }`} />
                                            </span>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleFetchInstances}
                            disabled={fetchingInstances || !data.url || !data.api_key}
                            title="Buscar instâncias disponíveis"
                        >
                            <i className={`ri-refresh-line ${fetchingInstances ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* WhatsApp template with 70/30 preview */}
            <TemplateEditor
                format="whatsapp"
                body={data.message_template}
                onBodyChange={(v) => update({ message_template: v })}
                templateMode={data.template_mode}
                onTemplateModeChange={(v) => update({ template_mode: v })}
            />

            <div className="flex items-center justify-end gap-3">
                {feedback && (
                    <span className="text-sm text-green-600">{feedback}</span>
                )}
                <Button
                    onClick={handleSave}
                    disabled={saving}
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
