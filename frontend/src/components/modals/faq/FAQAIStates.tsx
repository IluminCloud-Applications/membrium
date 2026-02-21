import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ModelCombobox } from "@/components/settings/ai/ModelCombobox";
import type { FAQItem } from "@/types/faq";
import type { AIModel } from "@/services/ai";

/* ---- No API Warning ---- */

export function FAQAINoApiState() {
    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:bg-amber-950/20 dark:border-amber-800">
            <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <i className="ri-alert-line text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        API de IA não configurada
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        Para gerar FAQ com IA, é necessário configurar pelo menos uma API (Gemini ou OpenAI).
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                        onClick={() => (window.location.href = "/admin/configuracoes/ia")}
                    >
                        <i className="ri-settings-3-line mr-1" />
                        Configurar IA
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ---- Config State ---- */

interface FAQAIConfigStateProps {
    lessonName: string;
    provider: string;
    onProviderChange: (value: string) => void;
    model: string;
    onModelChange: (value: string) => void;
    models: AIModel[];
    hasGemini: boolean;
    hasOpenai: boolean;
}

export function FAQAIConfigState({
    lessonName,
    provider,
    onProviderChange,
    model,
    onModelChange,
    models,
    hasGemini,
    hasOpenai,
}: FAQAIConfigStateProps) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <i className="ri-video-line text-purple-600" />
                </div>
                <div>
                    <p className="text-sm font-medium">{lessonName || "Aula selecionada"}</p>
                    <p className="text-xs text-muted-foreground">O FAQ será gerado com base no conteúdo desta aula</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm">Provedor de IA</Label>
                <div className="flex gap-3">
                    {hasGemini && (
                        <ProviderCard name="Gemini" icon="ri-google-line" recommended selected={provider === "gemini"} onClick={() => onProviderChange("gemini")} />
                    )}
                    {hasOpenai && (
                        <ProviderCard name="OpenAI" icon="ri-openai-line" selected={provider === "openai"} onClick={() => onProviderChange("openai")} />
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm">Modelo de IA</Label>
                <ModelCombobox
                    models={models}
                    value={model}
                    onValueChange={onModelChange}
                    loading={!models.length}
                />
                <p className="text-xs text-muted-foreground">Modelos mais avançados geram respostas de maior qualidade.</p>
            </div>
        </div>
    );
}

function ProviderCard({ name, icon, recommended, selected, onClick }: {
    name: string; icon: string; recommended?: boolean; selected: boolean; onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${selected ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20" : "border-border hover:border-muted-foreground/30"}`}
        >
            <div className="flex items-center gap-2">
                <i className={`${icon} text-lg`} />
                <span className="text-sm font-medium">{name}</span>
                {recommended && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full dark:bg-purple-900/40 dark:text-purple-300">Recomendado</span>}
            </div>
        </button>
    );
}

/* ---- Generating State ---- */

export function FAQAIGeneratingState() {
    return (
        <div className="py-8 text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            <div>
                <h3 className="text-lg font-medium">Gerando FAQ...</h3>
                <p className="text-sm text-muted-foreground mt-1">A IA está analisando a transcrição e gerando perguntas. Isso pode levar alguns segundos.</p>
            </div>
        </div>
    );
}

/* ---- Result State ---- */

export function FAQAIResultState({ faqs }: { faqs: FAQItem[] }) {
    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
                <i className="ri-sparkle-fill text-purple-600" />
                FAQ Gerado pela IA
                <span className="text-xs text-muted-foreground font-normal">({faqs.length} perguntas)</span>
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {faqs.map((faq, idx) => (
                    <div key={faq.id} className="rounded-lg border p-3 bg-muted/30">
                        <p className="text-sm font-medium mb-1"><span className="text-purple-600 mr-1">P{idx + 1}:</span>{faq.question}</p>
                        <p className="text-sm text-muted-foreground pl-3 border-l-2 border-purple-200">{faq.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---- Error State ---- */

interface FAQAIErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function FAQAIErrorState({ message, onRetry }: FAQAIErrorStateProps) {
    return (
        <div className="py-8 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                <i className="ri-error-warning-line text-xl text-destructive" />
            </div>
            <div>
                <h3 className="text-lg font-medium">Erro na geração</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    {message || "Ocorreu um erro ao gerar o FAQ. Por favor, tente novamente."}
                </p>
            </div>
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
                    <i className="ri-refresh-line mr-1" />
                    Tentar novamente
                </Button>
            )}
        </div>
    );
}
