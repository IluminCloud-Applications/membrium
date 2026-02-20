import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { FAQItem } from "@/types/faq";

interface FAQFormQuestionsProps {
    faqs: FAQItem[];
    onFaqsChange: (faqs: FAQItem[]) => void;
    onGenerateAI: () => void;
}

const MAX_FAQS = 10;

/**
 * FAQ question-answer pairs editor.
 * Shows only after a lesson is selected.
 */
export function FAQFormQuestions({
    faqs,
    onFaqsChange,
    onGenerateAI,
}: FAQFormQuestionsProps) {
    const [nextId, setNextId] = useState(
        () => Math.max(0, ...faqs.map((f) => f.id)) + 1
    );

    function handleAdd() {
        if (faqs.length >= MAX_FAQS) return;
        onFaqsChange([
            ...faqs,
            { id: nextId, question: "", answer: "" },
        ]);
        setNextId((prev) => prev + 1);
    }

    function handleRemove(id: number) {
        if (faqs.length <= 1) return;
        onFaqsChange(faqs.filter((f) => f.id !== id));
    }

    function handleChange(
        id: number,
        field: "question" | "answer",
        value: string
    ) {
        onFaqsChange(
            faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f))
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <i className="ri-question-answer-line text-primary" />
                    Perguntas e Respostas
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {faqs.length}/{MAX_FAQS}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={onGenerateAI}
                    >
                        <i className="ri-sparkle-line" />
                        Gerar com IA
                    </Button>
                </div>
            </div>

            {/* FAQ pairs */}
            <div className="space-y-3">
                {faqs.map((faq, idx) => (
                    <div
                        key={faq.id}
                        className="rounded-lg border p-3 bg-muted/30 relative group"
                    >
                        {faqs.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemove(faq.id)}
                                className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <i className="ri-close-line text-sm" />
                            </button>
                        )}

                        <div className="space-y-2">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                    Pergunta {idx + 1}
                                </label>
                                <Input
                                    value={faq.question}
                                    onChange={(e) =>
                                        handleChange(
                                            faq.id,
                                            "question",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Digite a pergunta..."
                                    className="h-9"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                    Resposta
                                </label>
                                <Textarea
                                    value={faq.answer}
                                    onChange={(e) =>
                                        handleChange(
                                            faq.id,
                                            "answer",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Digite a resposta..."
                                    rows={2}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add more button */}
            {faqs.length < MAX_FAQS && (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-sm border-dashed"
                    onClick={handleAdd}
                >
                    <i className="ri-add-line mr-1" />
                    Adicionar outra pergunta
                </Button>
            )}
        </div>
    );
}
