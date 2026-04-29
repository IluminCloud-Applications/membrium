import { useState, useEffect, useCallback } from "react";
import { AIApiTab } from "./AIApiTab";
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

/**
 * AIIntegrationSection
 *
 * Self-contained section that loads AI settings from the API and renders
 * the Gemini + OpenAI configuration cards (AIApiTab).
 *
 * Can be embedded inside any settings page — IntegrationsPage, AIPage, etc.
 * All reads/writes go through the same `/api/settings/ai` route.
 */
export function AIIntegrationSection() {
    const [settings, setSettings] = useState<AISettingsData>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

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
            <div className="flex items-center justify-center py-12">
                <i className="ri-loader-4-line animate-spin text-2xl text-muted-foreground" />
            </div>
        );
    }

    return (
        <AIApiTab
            gemini={settings.gemini}
            openai={settings.openai}
            onUpdate={fetchSettings}
        />
    );
}
