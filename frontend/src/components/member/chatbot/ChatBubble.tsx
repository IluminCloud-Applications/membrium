import { useState, useRef, useEffect } from "react";
import { useChatbot } from "@/hooks/useChatbot";
import { ChatBubbleMessages } from "./ChatBubbleMessages";
import { ChatBubbleInput } from "./ChatBubbleInput";

/**
 * Floating AI Chatbot Bubble — Zendesk/Chatwoot style.
 * Only renders if the chatbot is enabled in settings.
 */
export function ChatBubble() {
    const { config, loading, messages, sending, sendMessage, clearHistory } =
        useChatbot();
    const [open, setOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, open]);

    // Don't render anything if chatbot is not configured
    if (loading || !config?.enabled) return null;

    const botName = config.name || "Assistente IA";
    const avatarUrl = config.avatar;

    return (
        <>
            {/* Chat Window */}
            {open && (
                <div className="chatbubble-window">
                    {/* Header */}
                    <div className="chatbubble-header">
                        <div className="chatbubble-header-left">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={botName}
                                    className="chatbubble-header-avatar"
                                />
                            ) : (
                                <div className="chatbubble-header-avatar-fallback">
                                    <i className="ri-robot-2-fill" />
                                </div>
                            )}
                            <div>
                                <div className="chatbubble-header-name">
                                    {botName}
                                </div>
                                <div className="chatbubble-header-status">
                                    Online
                                </div>
                            </div>
                        </div>
                        <div className="chatbubble-header-actions">
                            <button
                                className="chatbubble-header-btn"
                                title="Limpar conversa"
                                onClick={clearHistory}
                            >
                                <i className="ri-delete-bin-line" />
                            </button>
                            <button
                                className="chatbubble-header-btn"
                                title="Fechar"
                                onClick={() => setOpen(false)}
                            >
                                <i className="ri-close-line" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <ChatBubbleMessages
                        messages={messages}
                        sending={sending}
                        botName={botName}
                        avatarUrl={avatarUrl}
                        messagesEndRef={messagesEndRef}
                    />

                    {/* Input */}
                    <ChatBubbleInput
                        onSend={sendMessage}
                        disabled={sending}
                    />
                </div>
            )}

            {/* Floating Button */}
            <button
                className={`chatbubble-fab ${open ? "chatbubble-fab-open" : ""}`}
                onClick={() => setOpen(!open)}
                aria-label={open ? "Fechar chat" : "Abrir chat"}
            >
                <i className={open ? "ri-close-line" : "ri-chat-smile-3-fill"} />
            </button>
        </>
    );
}
