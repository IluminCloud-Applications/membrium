import { useState } from "react";
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

type GenerationState = "config" | "no-api" | "generating" | "result" | "error";

interface FAQAIModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lessonName: string;
    onApplyFaqs: (faqs: FAQItem[]) => void;
}

const GEMINI_MODELS = [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash (Recomendado)" },
    { id: "gemini-2.0-pro", name: "Gemini 2.0 Pro" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
];

const OPENAI_MODELS = [
    { id: "gpt-4o", name: "GPT-4o (Recomendado)" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
];

// Mock: set to true to simulate having API configured
const HAS_GEMINI_API = true;
const HAS_OPENAI_API = true;

const MOCK_GENERATED: FAQItem[] = [
    { id: 100, question: "Qual o objetivo principal desta aula?", answer: "O objetivo principal é apresentar os conceitos fundamentais e práticos que serão aplicados ao longo do módulo." },
    { id: 101, question: "Preciso de conhecimento prévio?", answer: "Não é necessário conhecimento prévio. A aula foi projetada para guiar você do básico ao avançado." },
    { id: 102, question: "Onde posso tirar dúvidas?", answer: "Você pode utilizar a área de comentários da aula ou participar do grupo exclusivo de alunos." },
    { id: 103, question: "Existe material complementar?", answer: "Sim! Na descrição da aula você encontra links para materiais complementares, planilhas e templates." },
    { id: 104, question: "Posso aplicar o conteúdo imediatamente?", answer: "Sim, todo o conteúdo é prático e pode ser aplicado imediatamente no seu negócio." },
];

export function FAQAIModal({ open, onOpenChange, lessonName, onApplyFaqs }: FAQAIModalProps) {
    const hasAnyApi = HAS_GEMINI_API || HAS_OPENAI_API;
    const [state, setState] = useState<GenerationState>(hasAnyApi ? "config" : "no-api");
    const [provider, setProvider] = useState(HAS_GEMINI_API ? "gemini" : "openai");
    const [model, setModel] = useState("");
    const [generatedFaqs, setGeneratedFaqs] = useState<FAQItem[]>([]);

    const models = provider === "gemini" ? GEMINI_MODELS : OPENAI_MODELS;

    function handleStartGeneration() {
        setState("generating");
        setTimeout(() => { setGeneratedFaqs(MOCK_GENERATED); setState("result"); }, 3000);
    }

    function handleApply() {
        onApplyFaqs(generatedFaqs);
        handleClose();
    }

    function handleClose() {
        onOpenChange(false);
        setState(hasAnyApi ? "config" : "no-api");
        setProvider(HAS_GEMINI_API ? "gemini" : "openai");
        setModel("");
        setGeneratedFaqs([]);
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

                {state === "no-api" && <FAQAINoApiState />}
                {state === "config" && (
                    <FAQAIConfigState
                        lessonName={lessonName}
                        provider={provider}
                        onProviderChange={setProvider}
                        model={model}
                        onModelChange={setModel}
                        models={models}
                        hasGemini={HAS_GEMINI_API}
                        hasOpenai={HAS_OPENAI_API}
                    />
                )}
                {state === "generating" && <FAQAIGeneratingState />}
                {state === "result" && <FAQAIResultState faqs={generatedFaqs} />}
                {state === "error" && <FAQAIErrorState />}

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
