import type { RefObject } from "react";
import { MarkdownContent } from "@/components/shared/MarkdownContent";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatBubbleMessagesProps {
    messages: ChatMessage[];
    sending: boolean;
    botName: string;
    avatarUrl?: string | null;
    messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatBubbleMessages({
    messages,
    sending,
    botName,
    avatarUrl,
    messagesEndRef,
}: ChatBubbleMessagesProps) {
    return (
        <div className="chatbubble-messages">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`chatbubble-msg ${msg.role === "user"
                        ? "chatbubble-msg-user"
                        : "chatbubble-msg-assistant"
                        }`}
                >
                    {msg.role === "assistant" && (
                        <div className="chatbubble-msg-avatar">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={botName} />
                            ) : (
                                <i className="ri-robot-2-fill" />
                            )}
                        </div>
                    )}
                    <div
                        className={`chatbubble-msg-bubble ${msg.role === "user"
                            ? "chatbubble-msg-bubble-user"
                            : "chatbubble-msg-bubble-bot"
                            }`}
                    >
                        {msg.role === "user" ? (
                            msg.content
                        ) : (
                            <MarkdownContent content={msg.content} />
                        )}
                    </div>
                </div>
            ))}

            {/* Typing indicator */}
            {sending && (
                <div className="chatbubble-msg chatbubble-msg-assistant">
                    <div className="chatbubble-msg-avatar">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={botName} />
                        ) : (
                            <i className="ri-robot-2-fill" />
                        )}
                    </div>
                    <div className="chatbubble-typing">
                        <span />
                        <span />
                        <span />
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
}
