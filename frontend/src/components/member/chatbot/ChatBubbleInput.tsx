import { useState, type FormEvent } from "react";

interface ChatBubbleInputProps {
    onSend: (text: string) => Promise<void>;
    disabled: boolean;
}

export function ChatBubbleInput({ onSend, disabled }: ChatBubbleInputProps) {
    const [input, setInput] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!input.trim() || disabled) return;
        onSend(input);
        setInput("");
    }

    return (
        <form className="chatbubble-input-area" onSubmit={handleSubmit}>
            <input
                type="text"
                className="chatbubble-input"
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={disabled}
                autoFocus
            />
            <button
                type="submit"
                className="chatbubble-send-btn"
                disabled={disabled || !input.trim()}
            >
                <i className="ri-send-plane-2-fill" />
            </button>
        </form>
    );
}
