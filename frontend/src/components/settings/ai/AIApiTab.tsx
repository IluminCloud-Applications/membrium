import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IntegrationToggle } from "../IntegrationToggle";
import { aiService, type GeminiSettings, type OpenAISettings } from "@/services/ai";
import { toast } from "sonner";

interface AIApiTabProps {
    gemini: GeminiSettings;
    openai: OpenAISettings;
    onUpdate: () => void;
}

export function AIApiTab({ gemini, openai, onUpdate }: AIApiTabProps) {
    const [geminiEnabled, setGeminiEnabled] = useState(gemini.enabled);
    const [geminiKey, setGeminiKey] = useState(gemini.api_key);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [savingGemini, setSavingGemini] = useState(false);

    const [openaiEnabled, setOpenaiEnabled] = useState(openai.enabled);
    const [openaiKey, setOpenaiKey] = useState(openai.api_key);
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);
    const [savingOpenai, setSavingOpenai] = useState(false);

    async function handleSaveGemini() {
        setSavingGemini(true);
        try {
            const resp = await aiService.updateGemini({
                enabled: geminiEnabled,
                api_key: geminiKey,
            });
            toast.success(resp.message);
            onUpdate();
        } catch {
            toast.error("Erro ao salvar configurações do Gemini");
        } finally {
            setSavingGemini(false);
        }
    }

    async function handleSaveOpenai() {
        setSavingOpenai(true);
        try {
            const resp = await aiService.updateOpenAI({
                enabled: openaiEnabled,
                api_key: openaiKey,
            });
            toast.success(resp.message);
            onUpdate();
        } catch {
            toast.error("Erro ao salvar configurações da OpenAI");
        } finally {
            setSavingOpenai(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Gemini — recommended */}
            <IntegrationToggle
                id="geminiToggle"
                icon="ri-sparkling-2-line"
                title="Google Gemini"
                description="IA do Google — rápida, gratuita e recomendada"
                enabled={geminiEnabled}
                onToggle={setGeminiEnabled}
                badge={
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">
                        Recomendado
                    </Badge>
                }
            >
                <div className="space-y-2">
                    <Label htmlFor="geminiApiKey">API Key</Label>
                    <div className="relative">
                        <Input
                            id="geminiApiKey"
                            type={showGeminiKey ? "text" : "password"}
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="AIzaSy-xxxxxxxxxxxxxxxxxxxxxxxx"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className={showGeminiKey ? "ri-eye-off-line" : "ri-eye-line"} />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            Obter sua API Key no Google AI Studio
                        </a>
                    </p>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSaveGemini} disabled={savingGemini} className="btn-brand">
                        {savingGemini ? (
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

            {/* OpenAI */}
            <IntegrationToggle
                id="openaiToggle"
                icon="ri-openai-line"
                title="OpenAI"
                description="IA premium com acesso ao ChatGPT — mais avançada e inteligente"
                enabled={openaiEnabled}
                onToggle={setOpenaiEnabled}
            >
                <div className="space-y-2">
                    <Label htmlFor="openaiApiKey">API Key</Label>
                    <div className="relative">
                        <Input
                            id="openaiApiKey"
                            type={showOpenaiKey ? "text" : "password"}
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <i className={showOpenaiKey ? "ri-eye-off-line" : "ri-eye-line"} />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            Obter sua API Key na plataforma OpenAI
                        </a>
                    </p>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSaveOpenai} disabled={savingOpenai} className="btn-brand">
                        {savingOpenai ? (
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
        </div>
    );
}
