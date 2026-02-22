import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "@/services/apiClient";

interface ChatbotConfig {
    enabled: boolean;
    name?: string;
    avatar?: string;
    welcome_message?: string;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface UseChatbotReturn {
    config: ChatbotConfig | null;
    loading: boolean;
    messages: ChatMessage[];
    sending: boolean;
    sendMessage: (text: string) => Promise<void>;
    clearHistory: () => Promise<void>;
}

export function useChatbot(): UseChatbotReturn {
    const [config, setConfig] = useState<ChatbotConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const idCounter = useRef(0);

    useEffect(() => {
        fetchConfig();
    }, []);

    async function fetchConfig() {
        try {
            const data = await apiClient.get<ChatbotConfig>("/chatbot/config");
            setConfig(data);

            // Add welcome message if enabled
            if (data.enabled && data.welcome_message) {
                setMessages([
                    {
                        id: `msg-${++idCounter.current}`,
                        role: "assistant",
                        content: data.welcome_message,
                    },
                ]);
            }
        } catch {
            setConfig({ enabled: false });
        } finally {
            setLoading(false);
        }
    }

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || sending) return;

            const userMsg: ChatMessage = {
                id: `msg-${++idCounter.current}`,
                role: "user",
                content: text.trim(),
            };
            setMessages((prev) => [...prev, userMsg]);
            setSending(true);

            try {
                const data = await apiClient.post<{ response: string }>(
                    "/chatbot/chat",
                    { message: text.trim() }
                );

                const assistantMsg: ChatMessage = {
                    id: `msg-${++idCounter.current}`,
                    role: "assistant",
                    content: data.response,
                };
                setMessages((prev) => [...prev, assistantMsg]);
            } catch {
                const errorMsg: ChatMessage = {
                    id: `msg-${++idCounter.current}`,
                    role: "assistant",
                    content: "Desculpe, ocorreu um erro. Tente novamente.",
                };
                setMessages((prev) => [...prev, errorMsg]);
            } finally {
                setSending(false);
            }
        },
        [sending]
    );

    const clearHistory = useCallback(async () => {
        try {
            await apiClient.post("/chatbot/clear", {});
            // Reset to welcome message only
            if (config?.welcome_message) {
                setMessages([
                    {
                        id: `msg-${++idCounter.current}`,
                        role: "assistant",
                        content: config.welcome_message,
                    },
                ]);
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error("Erro ao limpar histórico:", err);
        }
    }, [config]);

    return {
        config,
        loading,
        messages,
        sending,
        sendMessage,
        clearHistory,
    };
}
