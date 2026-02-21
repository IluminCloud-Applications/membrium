import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    FAQAINoApiState,
    FAQAIConfigState,
    FAQAIGeneratingState,
    FAQAIResultState,
    FAQAIErrorState,
} from "./FAQAIStates";
import type { FAQItem } from "@/types/faq";
import { aiService, type AIModel } from "@/services/ai";
import { faqService } from "@/services/faq";

type GenerationState = "loading" | "config" | "no-api" | "generating" | "result" | "error";

interface FAQAIModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lessonId: number;
    lessonName: string;
    onApplyFaqs: (faqs: FAQItem[]) => void;
}

export function FAQAIModal({ open, onOpenChange, lessonId, lessonName, onApplyFaqs }: FAQAIModalProps) {
    const [state, setState] = useState<GenerationState>("loading");
    const [provider, setProvider] = useState("");
    const [model, setModel] = useState("");
    const [models, setModels] = useState<AIModel[]>([]);
    const [generatedFaqs, setGeneratedFaqs] = useState<FAQItem[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [hasGemini, setHasGemini] = useState(false);
    const [hasOpenai, setHasOpenai] = useState(false);
    const [geminiKey, setGeminiKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");

    // Carregar configurações de IA ao abrir
    useEffect(() => {
        if (!open) return;
        loadAISettings();
    }, [open]);

    async function loadAISettings() {
        setState("loading");
        try {
            const data = await aiService.getAll();
            const gEnabled = data.gemini.enabled && !!data.gemini.api_key;
            const oEnabled = data.openai.enabled && !!data.openai.api_key;

            setHasGemini(gEnabled);
            setHasOpenai(oEnabled);
            setGeminiKey(data.gemini.api_key);
            setOpenaiKey(data.openai.api_key);

            if (!gEnabled && !oEnabled) {
                setState("no-api");
                return;
            }

            const defaultProvider = gEnabled ? "gemini" : "openai";
            setProvider(defaultProvider);
            setState("config");

            // Load models for default provider
            await loadModels(defaultProvider, gEnabled ? data.gemini.api_key : data.openai.api_key);
        } catch {
            setState("no-api");
        }
    }

    async function loadModels(prov: string, apiKey: string) {
        try {
            const fetcher = prov === "gemini"
                ? aiService.fetchGeminiModels
                : aiService.fetchOpenAIModels;
            const result = await fetcher(apiKey);
            if (result.success && result.models) {
                setModels(result.models);
            } else {
                setModels([]);
            }
        } catch {
            setModels([]);
        }
    }

    async function handleProviderChange(newProvider: string) {
        setProvider(newProvider);
        setModel("");
        const key = newProvider === "gemini" ? geminiKey : openaiKey;
        await loadModels(newProvider, key);
    }

    async function handleStartGeneration() {
        setState("generating");
        setErrorMessage("");
        try {
            const result = await faqService.generateWithAI({
                lesson_id: lessonId,
                provider,
                model,
            });

            if (result.success && result.faqs) {
                const mapped: FAQItem[] = result.faqs.map((f, idx) => ({
                    id: Date.now() + idx,
                    question: f.question,
                    answer: f.answer,
                }));
                setGeneratedFaqs(mapped);
                setState("result");
            } else {
                setErrorMessage(result.message || "Erro ao gerar FAQ");
                setState("error");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erro desconhecido";
            setErrorMessage(message);
            setState("error");
        }
    }

    function handleApply() {
        onApplyFaqs(generatedFaqs);
        handleClose();
    }

    function handleClose() {
        onOpenChange(false);
        setState("loading");
        setProvider("");
        setModel("");
        setModels([]);
        setGeneratedFaqs([]);
        setErrorMessage("");
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-sparkle-line text-purple-600" />
                        Gerar FAQ com IA
                    </DialogTitle>
                    <DialogDescription>
                        A IA irá analisar o conteúdo da aula e gerar perguntas frequentes automaticamente.
                    </DialogDescription>
                </DialogHeader>

                {state === "loading" && (
                    <div className="py-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                        <p className="text-sm text-muted-foreground mt-2">Carregando configurações...</p>
                    </div>
                )}
                {state === "no-api" && <FAQAINoApiState />}
                {state === "config" && (
                    <FAQAIConfigState
                        lessonName={lessonName}
                        provider={provider}
                        onProviderChange={handleProviderChange}
                        model={model}
                        onModelChange={setModel}
                        models={models}
                        hasGemini={hasGemini}
                        hasOpenai={hasOpenai}
                    />
                )}
                {state === "generating" && <FAQAIGeneratingState />}
                {state === "result" && <FAQAIResultState faqs={generatedFaqs} />}
                {state === "error" && <FAQAIErrorState message={errorMessage} onRetry={() => setState("config")} />}

                <DialogFooter className="gap-2 pt-2">
                    {state === "config" && (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white" disabled={!model} onClick={handleStartGeneration}>
                                <i className="ri-sparkle-line mr-1" />
                                Iniciar Geração
                            </Button>
                        </>
                    )}
                    {state === "result" && (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleApply}>
                                <i className="ri-check-line mr-1" />
                                Aplicar FAQ Gerado
                            </Button>
                        </>
                    )}
                    {(state === "no-api" || state === "error") && (
                        <Button variant="outline" onClick={handleClose}>Fechar</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
