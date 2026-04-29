import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsHeader } from "@/components/settings";
import { ChatbotTab } from "@/components/settings/ai/ChatbotTab";
import { AIIntegrationSection } from "@/components/settings/ai/AIIntegrationSection";
import { aiService, type AISettingsData } from "@/services/ai";

const DEFAULT_SETTINGS: AISettingsData = {
    gemini: { enabled: false, api_key: "" },
    openai: { enabled: false, api_key: "" },
    chatbot: {
        enabled: false,
        name: "",
        provider: "",
        model: "",
        welcome_message: "",
        use_internal_knowledge: false,
        additional_instructions: "",
    },
};

export function AIPage() {
    const [settings, setSettings] = useState<AISettingsData>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    const hasApiConfigured = settings.gemini.enabled || settings.openai.enabled;

    const fetchSettings = useCallback(async () => {
        try {
            const data = await aiService.getAll();
            setSettings(data);
        } catch {
            console.error("Erro ao carregar configurações de IA");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                <SettingsHeader
                    icon="ri-sparkling-line"
                    title="Inteligência Artificial"
                    description="Configure os provedores de IA e o chatbot de suporte."
                />
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-2xl text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <SettingsHeader
                icon="ri-sparkling-line"
                title="Inteligência Artificial"
                description="Configure os provedores de IA e o chatbot de suporte."
            />

            <Tabs defaultValue="chatbot" className="w-full">
                <TabsList className="h-9">
                    <TabsTrigger value="chatbot" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-robot-2-line" />
                        Chatbot
                    </TabsTrigger>
                    <TabsTrigger value="api" className="text-sm px-4 h-8 gap-1.5">
                        <i className="ri-key-2-line" />
                        API
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="chatbot" className="mt-4">
                    {!hasApiConfigured && <ApiWarningBanner />}
                    <ChatbotTab
                        chatbot={settings.chatbot}
                        gemini={settings.gemini}
                        openai={settings.openai}
                        onUpdate={fetchSettings}
                    />
                </TabsContent>

                {/* Shared component — same routes/state as Integrations page */}
                <TabsContent value="api" className="mt-4">
                    <AIIntegrationSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}

/* ─── API Warning Banner ──────────────────────────────────────── */

function ApiWarningBanner() {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 mb-6">
            <i className="ri-alert-line text-amber-500 text-lg mt-0.5" />
            <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Nenhuma API de IA configurada
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Para utilizar o Chatbot, configure pelo menos um provedor de IA na aba{" "}
                    <button
                        type="button"
                        className="underline font-medium hover:text-amber-800"
                        onClick={() => {
                            const apiTab = document.querySelector<HTMLButtonElement>(
                                '[data-state][value="api"]'
                            );
                            apiTab?.click();
                        }}
                    >
                        API
                    </button>.
                </p>
            </div>
        </div>
    );
}
