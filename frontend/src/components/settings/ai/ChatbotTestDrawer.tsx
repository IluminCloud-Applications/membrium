import { useState, useRef, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiService } from "@/services/ai";

interface ChatbotTestDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    chatbotName: string;
    welcomeMessage: string;
}

interface ChatMessage {
    id: number;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
}

export function ChatbotTestDrawer({
    open,
    onOpenChange,
    chatbotName,
    welcomeMessage,
}: ChatbotTestDrawerProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize welcome message when opened
    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([
                {
                    id: 1,
                    role: "assistant",
                    content: welcomeMessage || "Olá! Como posso ajudar nos seus estudos hoje?",
                    timestamp: new Date(),
                },
            ]);
            // Focus input after a small delay
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function handleSend() {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg: ChatMessage = {
            id: Date.now(),
            role: "user",
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const result = await aiService.testChatbot(text);
            const botMsg: ChatMessage = {
                id: Date.now() + 1,
                role: "assistant",
                content: result.response,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: "system",
                    content: "Erro ao obter resposta. Verifique se o provider e modelo estão configurados.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    async function handleClearHistory() {
        try {
            await aiService.clearTestHistory();
        } catch {
            // ignore
        }
        setMessages([
            {
                id: Date.now(),
                role: "assistant",
                content: welcomeMessage || "Olá! Como posso ajudar nos seus estudos hoje?",
                timestamp: new Date(),
            },
        ]);
    }

    function handleClose() {
        onOpenChange(false);
        setMessages([]);
        setInput("");
    }

    return (
        <Sheet open={open} onOpenChange={handleClose}>
            <SheetContent className="w-[420px] sm:max-w-[420px] flex flex-col p-0">
                {/* Header */}
                <SheetHeader className="p-4 pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <i className="ri-robot-2-line text-primary text-sm" />
                            </div>
                            <div>
                                <SheetTitle className="text-sm">
                                    {chatbotName || "Chatbot"}
                                    <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-normal dark:bg-amber-900/40 dark:text-amber-300">
                                        Modo Teste
                                    </span>
                                </SheetTitle>
                                <SheetDescription className="text-xs">
                                    Teste o chatbot como seus alunos veriam
                                </SheetDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearHistory}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <i className="ri-delete-bin-line mr-1" />
                            Limpar
                        </Button>
                    </div>
                </SheetHeader>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} botName={chatbotName} />
                    ))}

                    {/* Typing indicator */}
                    {loading && <TypingIndicator botName={chatbotName} />}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-3">
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite uma mensagem..."
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            size="icon"
                            className="bg-primary hover:bg-primary/90 shrink-0"
                        >
                            {loading ? (
                                <i className="ri-loader-4-line animate-spin" />
                            ) : (
                                <i className="ri-send-plane-2-fill" />
                            )}
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                        Este é o modo de teste. As conversas não são salvas.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}

/* ─── Message Bubble ──────────────────────────────────────────── */

function MessageBubble({ message, botName }: { message: ChatMessage; botName: string }) {
    if (message.role === "system") {
        return (
            <div className="flex justify-center">
                <div className="rounded-lg bg-destructive/10 text-destructive text-xs px-3 py-2 max-w-[90%] text-center">
                    <i className="ri-alert-line mr-1" />
                    {message.content}
                </div>
            </div>
        );
    }

    const isUser = message.role === "user";

    return (
        <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isUser
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-primary/10"
                    }`}
            >
                <i
                    className={`text-xs ${isUser ? "ri-user-line text-blue-600" : "ri-robot-2-line text-primary"
                        }`}
                />
            </div>

            {/* Bubble */}
            <div
                className={`rounded-2xl px-3 py-2 max-w-[80%] ${isUser
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    }`}
            >
                {!isUser && (
                    <p className="text-[10px] font-medium mb-0.5 opacity-70">
                        {botName || "Chatbot"}
                    </p>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p
                    className={`text-[9px] mt-1 ${isUser ? "text-primary-foreground/50" : "text-muted-foreground"
                        }`}
                >
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>
        </div>
    );
}

/* ─── Typing Indicator ────────────────────────────────────────── */

function TypingIndicator({ botName }: { botName: string }) {
    return (
        <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <i className="ri-robot-2-line text-primary text-xs" />
            </div>
            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                <p className="text-[10px] font-medium mb-1 opacity-70">{botName || "Chatbot"}</p>
                <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );
}
