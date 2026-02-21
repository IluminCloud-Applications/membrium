import { apiClient } from "./apiClient";

/* ============================================
   AI SETTINGS TYPES
   ============================================ */

export interface GeminiSettings {
    enabled: boolean;
    api_key: string;
}

export interface OpenAISettings {
    enabled: boolean;
    api_key: string;
}

export interface ChatbotSettings {
    enabled: boolean;
    name: string;
    provider: string;
    model: string;
    welcome_message: string;
    use_internal_knowledge: boolean;
}

export interface AISettingsData {
    gemini: GeminiSettings;
    openai: OpenAISettings;
    chatbot: ChatbotSettings;
}

export interface AIModel {
    id: string;
    name: string;
    description?: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
}

interface FetchModelsResponse {
    success: boolean;
    models?: AIModel[];
    message?: string;
}

/* ============================================
   AI SETTINGS SERVICE
   ============================================ */

export const aiService = {
    /** Get all AI settings */
    getAll: () =>
        apiClient.get<AISettingsData>("/settings/ai"),

    /** Update Gemini settings */
    updateGemini: (data: Partial<GeminiSettings>) =>
        apiClient.post<ApiResponse>("/settings/gemini", data),

    /** Update OpenAI settings */
    updateOpenAI: (data: Partial<OpenAISettings>) =>
        apiClient.post<ApiResponse>("/settings/openai", data),

    /** Update Chatbot settings */
    updateChatbot: (data: Partial<ChatbotSettings>) =>
        apiClient.post<ApiResponse>("/settings/chatbot", data),

    /** Fetch available Gemini models */
    fetchGeminiModels: (apiKey: string) =>
        apiClient.post<FetchModelsResponse>("/settings/ai/gemini-models", { api_key: apiKey }),

    /** Fetch available OpenAI models */
    fetchOpenAIModels: (apiKey: string) =>
        apiClient.post<FetchModelsResponse>("/settings/ai/openai-models", { api_key: apiKey }),

    /** Test chatbot — send a message as admin */
    testChatbot: (message: string) =>
        apiClient.post<{ response: string }>("/chatbot/test", { message }),

    /** Clear test chatbot history */
    clearTestHistory: () =>
        apiClient.post<{ success: boolean }>("/chatbot/test/clear", {}),
};
