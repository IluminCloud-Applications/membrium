import { useState, useEffect } from "react";
import { aiService } from "@/services/ai";
import type { AIModel } from "@/services/ai";

/**
 * Hook reutilizável que carrega as configurações de IA e os modelos disponíveis.
 * Detecta automaticamente o provider habilitado (gemini ou openai) e busca os modelos.
 */
export function useAIModels(active: boolean) {
    const [provider, setProvider] = useState("gemini");
    const [model, setModel] = useState("");
    const [models, setModels] = useState<AIModel[]>([]);
    const [loading, setLoading] = useState(false);

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
