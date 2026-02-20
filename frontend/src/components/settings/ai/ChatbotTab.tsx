import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IntegrationToggle } from "../IntegrationToggle";

const PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
    openai: [
        { value: "gpt-4o", label: "GPT-4o" },
        { value: "gpt-4o-mini", label: "GPT-4o Mini" },
        { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    ],
    gemini: [
        { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
        { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
        { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
};

export function ChatbotTab() {
    const [enabled, setEnabled] = useState(false);
    const [name, setName] = useState("");
    const [provider, setProvider] = useState("");
    const [model, setModel] = useState("");
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [useInternalKnowledge, setUseInternalKnowledge] = useState(false);
    const [saving, setSaving] = useState(false);

    const models = provider ? PROVIDER_MODELS[provider] ?? [] : [];

    function handleProviderChange(value: string) {
        setProvider(value);
        setModel("");
    }

    async function handleSave() {
        setSaving(true);
        // TODO: API call
        setTimeout(() => setSaving(false), 800);
    }

    return (
        <IntegrationToggle
            id="chatbotToggle"
            icon="ri-robot-2-line"
            title="Chatbot de Suporte"
            description="Assistente virtual que responde dúvidas com base nas transcrições das aulas"
            enabled={enabled}
            onToggle={setEnabled}
        >
            {/* Name + Provider + Model — side by side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="chatbotName">Nome do Chatbot</Label>
                    <Input
                        id="chatbotName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Assistente Virtual"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Provedor de IA</Label>
                    <Select value={provider} onValueChange={handleProviderChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="gemini" className="rounded-lg">Google Gemini</SelectItem>
                            <SelectItem value="openai" className="rounded-lg">OpenAI</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Modelo de IA</Label>
                    <Select
                        value={model}
                        onValueChange={setModel}
                        disabled={!provider}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {models.map((m) => (
                                <SelectItem key={m.value} value={m.value} className="rounded-lg">
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Welcome message */}
            <div className="space-y-2">
                <Label htmlFor="chatbotWelcomeMessage">Mensagem de Boas-vindas</Label>
                <Textarea
                    id="chatbotWelcomeMessage"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Ex: Olá! Sou o assistente virtual. Como posso ajudar nos seus estudos hoje?"
                    className="min-h-[80px] max-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                    Mensagem exibida quando o aluno abre o chat
                </p>
            </div>

            {/* Internal knowledge */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                        Usar conhecimento interno da IA
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Quando ativado, o chatbot responderá perguntas gerais e permitirá conversas casuais
                    </p>
                </div>
                <Switch
                    checked={useInternalKnowledge}
                    onCheckedChange={setUseInternalKnowledge}
                />
            </div>

            {/* Preview */}
            {(name || welcomeMessage) && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <i className="ri-eye-line" />
                        Visualização do Chatbot
                    </h4>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <i className="ri-robot-2-line text-primary" />
                        </div>
                        <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-xs">
                            {name && (
                                <p className="text-xs font-medium mb-0.5">{name}</p>
                            )}
                            <p className="text-sm">
                                {welcomeMessage || "Olá! Como posso ajudar?"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

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
