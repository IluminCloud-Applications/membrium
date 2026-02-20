import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IntegrationToggle } from "../IntegrationToggle";

/**
 * API tab — toggle cards for Gemini (recommended) and OpenAI.
 * Both share the same simple pattern: toggle + API key.
 */
export function AIApiTab() {
    const [geminiEnabled, setGeminiEnabled] = useState(false);
    const [geminiKey, setGeminiKey] = useState("");
    const [showGeminiKey, setShowGeminiKey] = useState(false);

    const [openaiEnabled, setOpenaiEnabled] = useState(false);
    const [openaiKey, setOpenaiKey] = useState("");
    const [showOpenaiKey, setShowOpenaiKey] = useState(false);

    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setSaving(true);
        // TODO: API call
        setTimeout(() => setSaving(false), 800);
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
        </div>
    );
}
