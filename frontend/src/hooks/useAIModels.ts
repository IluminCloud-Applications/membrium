import { useState, useEffect, useCallback } from "react";
import { aiService } from "@/services/ai";
import type { AIModel } from "@/services/ai";

const STORAGE_KEY = "ai_selected_model";

function getSavedModel(): string {
    try { return localStorage.getItem(STORAGE_KEY) ?? ""; }
    catch { return ""; }
}

function saveModel(model: string) {
    try { localStorage.setItem(STORAGE_KEY, model); }
    catch { /* ignore */ }
}

/**
 * Hook reutilizável que carrega as configurações de IA e os modelos disponíveis.
 * Detecta automaticamente o provider habilitado (gemini ou openai) e busca os modelos.
 * Persiste o modelo selecionado no localStorage.
 */
export function useAIModels(active: boolean) {
    const [provider, setProvider] = useState("gemini");
    const [model, setModelState] = useState(getSavedModel);
    const [models, setModels] = useState<AIModel[]>([]);
    const [loading, setLoading] = useState(false);

    const setModel = useCallback((value: string) => {
        setModelState(value);
        saveModel(value);
    }, []);

    useEffect(() => {
        if (!active) return;
        setLoading(true);

        aiService
            .getAll()
            .then(async (data) => {
                const geminiEnabled = data.gemini.enabled && !!data.gemini.api_key;
                const openaiEnabled = data.openai.enabled && !!data.openai.api_key;

                if (geminiEnabled) {
                    setProvider("gemini");
                    const res = await aiService.fetchGeminiModels(data.gemini.api_key);
                    setModels(res.models || []);
                } else if (openaiEnabled) {
                    setProvider("openai");
                    const res = await aiService.fetchOpenAIModels(data.openai.api_key);
                    setModels(res.models || []);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [active]);

    return { provider, model, setModel, models, loading };
}
