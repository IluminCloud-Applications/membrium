import { useState, useEffect } from "react";
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
import { ModelCombobox } from "./ModelCombobox";
import {
    aiService,
    type ChatbotSettings,
    type GeminiSettings,
    type OpenAISettings,
    type AIModel,
} from "@/services/ai";
import { toast } from "sonner";
import { ChatbotTestDrawer } from "./ChatbotTestDrawer";

interface ChatbotTabProps {
    chatbot: ChatbotSettings;
    gemini: GeminiSettings;
    openai: OpenAISettings;
    onUpdate: () => void;
}

export function ChatbotTab({ chatbot, gemini, openai, onUpdate }: ChatbotTabProps) {
    const [enabled, setEnabled] = useState(chatbot.enabled);
    const [name, setName] = useState(chatbot.name);
    const [provider, setProvider] = useState(chatbot.provider);
    const [model, setModel] = useState(chatbot.model);
    const [welcomeMessage, setWelcomeMessage] = useState(chatbot.welcome_message);
    const [useInternalKnowledge, setUseInternalKnowledge] = useState(chatbot.use_internal_knowledge);
    const [saving, setSaving] = useState(false);
    const [testDrawerOpen, setTestDrawerOpen] = useState(false);

    const [models, setModels] = useState<AIModel[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    // Available providers based on configured API keys
    const availableProviders = [
        ...(gemini.enabled ? [{ value: "gemini", label: "Google Gemini" }] : []),
        ...(openai.enabled ? [{ value: "openai", label: "OpenAI" }] : []),
    ];

    // Fetch models when provider changes
    useEffect(() => {
        if (!provider) {
            setModels([]);
            return;
        }
        fetchModels(provider);
    }, [provider]);

    async function fetchModels(selectedProvider: string) {
        setLoadingModels(true);
        setModels([]);
        try {
            let resp;
            if (selectedProvider === "gemini" && gemini.api_key) {
                resp = await aiService.fetchGeminiModels(gemini.api_key);
            } else if (selectedProvider === "openai" && openai.api_key) {
                resp = await aiService.fetchOpenAIModels(openai.api_key);
            } else {
                toast.error("API Key não configurada para este provedor");
                setLoadingModels(false);
                return;
            }

            if (resp.success && resp.models) {
                setModels(resp.models);
            } else {
                toast.error(resp.message || "Erro ao buscar modelos");
            }
        } catch {
            toast.error("Erro ao buscar modelos disponíveis");
        } finally {
            setLoadingModels(false);
        }
    }

    function handleProviderChange(value: string) {
        setProvider(value);
        setModel("");
    }

    async function handleSave() {
        setSaving(true);
        try {
            const resp = await aiService.updateChatbot({
                enabled,
                name,
                provider,
                model,
                welcome_message: welcomeMessage,
                use_internal_knowledge: useInternalKnowledge,
            });
            toast.success(resp.message);
            onUpdate();
        } catch {
            toast.error("Erro ao salvar configurações do Chatbot");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
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
                                {availableProviders.length === 0 ? (
                                    <SelectItem value="_none" disabled className="rounded-lg text-muted-foreground">
                                        Nenhuma API configurada
                                    </SelectItem>
                                ) : (
                                    availableProviders.map((p) => (
                                        <SelectItem key={p.value} value={p.value} className="rounded-lg">
                                            {p.label}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Modelo de IA</Label>
                        <ModelCombobox
                            models={models}
                            value={model}
                            onValueChange={setModel}
                            disabled={!provider}
                            loading={loadingModels}
                        />
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
                    <ChatbotPreview name={name} welcomeMessage={welcomeMessage} />
                )}

                <div className="flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setTestDrawerOpen(true)}
                        disabled={!enabled || !provider || !model}
                        className="gap-1.5"
                    >
                        <i className="ri-chat-check-line" />
                        Testar Chatbot
                    </Button>

                    <Button onClick={handleSave} disabled={saving} className="btn-brand">
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

            <ChatbotTestDrawer
                open={testDrawerOpen}
                onOpenChange={setTestDrawerOpen}
                chatbotName={name}
                welcomeMessage={welcomeMessage}
            />
        </>
    );
}

/* ─── Chatbot Preview ─────────────────────────────────────────── */

function ChatbotPreview({ name, welcomeMessage }: { name: string; welcomeMessage: string }) {
    return (
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
                    {name && <p className="text-xs font-medium mb-0.5">{name}</p>}
                    <p className="text-sm">{welcomeMessage || "Olá! Como posso ajudar?"}</p>
                </div>
            </div>
        </div>
    );
}
