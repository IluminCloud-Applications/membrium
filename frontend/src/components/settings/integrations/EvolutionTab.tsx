import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IntegrationToggle } from "../IntegrationToggle";
import { TemplateTagsBlock } from "./TemplateTagsBlock";
import { TemplatePreview } from "./TemplatePreview";

export function EvolutionTab() {
    const [enabled, setEnabled] = useState(false);
    const [url, setUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [version, setVersion] = useState("");
    const [instance, setInstance] = useState("");
    const [message, setMessage] = useState(
        `Olá [[first_name]]! 👋\n\nSeu acesso ao curso foi liberado! ✅\n\n*Acesse com os dados abaixo:*\n\n📧 *Login:* [[email]]\n🔑 *Senha:* [[password]]\n\n🌐 *Link de acesso comum:* [[link]]\n🔑 *Link de acesso rápido:* [[fast_link]]\n\nSe precisar de ajuda, estamos à disposição!`
    );
    const [saving, setSaving] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [fetchingInstances, setFetchingInstances] = useState(false);

    async function handleDetectVersion() {
        setDetecting(true);
        // TODO: API call to detect version
        setTimeout(() => setDetecting(false), 1000);
    }

    async function handleFetchInstances() {
        setFetchingInstances(true);
        // TODO: API call to fetch instances
        setTimeout(() => setFetchingInstances(false), 1000);
    }

    async function handleSave() {
        setSaving(true);
        // TODO: API call
        setTimeout(() => setSaving(false), 800);
    }

    return (
        <IntegrationToggle
            id="evolutionToggle"
            icon="ri-whatsapp-line"
            title="Evolution API"
            description="Envie mensagens de WhatsApp para seus alunos"
            enabled={enabled}
            onToggle={setEnabled}
        >
            {/* URL + API Key */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="evolutionUrl">URL da Evolution API</Label>
                    <Input
                        id="evolutionUrl"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://seu-dominio.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="evolutionApiKey">API Key</Label>
                    <div className="relative">
                        <Input
                            id="evolutionApiKey"
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
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
                        <Select value={version} onValueChange={setVersion}>
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
                            disabled={detecting || !url}
                            title="Detectar versão automaticamente"
                        >
                            <i className={`ri-refresh-line ${detecting ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Instância do WhatsApp</Label>
                    <div className="flex gap-2">
                        <Select value={instance} onValueChange={setInstance}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione a instância" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="none" disabled className="rounded-lg">
                                    Busque as instâncias primeiro
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleFetchInstances}
                            disabled={fetchingInstances || !url || !apiKey}
                            title="Buscar instâncias disponíveis"
                        >
                            <i className={`ri-refresh-line ${fetchingInstances ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* WhatsApp template */}
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
                <h4 className="text-sm font-medium flex items-center gap-2">
                    <i className="ri-whatsapp-line text-primary" />
                    Template de Mensagem do WhatsApp
                </h4>

                <TemplateTagsBlock targetTextareaId="evolutionTemplate" />

                <div className="space-y-2">
                    <Label htmlFor="evolutionTemplate">Mensagem</Label>
                    <Textarea
                        id="evolutionTemplate"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[200px] font-mono text-sm"
                    />
                </div>
            </div>

            <TemplatePreview text={message} />

            <div className="flex justify-end">
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
