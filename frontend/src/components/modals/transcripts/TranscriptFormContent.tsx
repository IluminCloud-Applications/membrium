import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ModelCombobox } from "@/components/settings/ai/ModelCombobox";
import type { AIModel } from "@/services/ai";

interface TranscriptFormContentProps {
    transcriptText: string;
    vector: string;
    keywords: string[];
    onTranscriptTextChange: (value: string) => void;
    onVectorChange: (value: string) => void;
    onKeywordsChange: (keywords: string[]) => void;
    onYoutubeImport: () => void;
    importingYoutube?: boolean;
    onGenerateAI?: (model: string) => void;
    generatingAI?: boolean;
    aiModels: AIModel[];
    aiModelsLoading: boolean;
    selectedModel: string;
    onModelChange: (model: string) => void;
}

/**
 * Right column — transcript text area, AI summary, and keyword tags.
 */
export function TranscriptFormContent({
    transcriptText,
    vector,
    keywords,
    onTranscriptTextChange,
    onVectorChange,
    onKeywordsChange,
    onYoutubeImport,
    importingYoutube = false,
    onGenerateAI,
    generatingAI = false,
    aiModels,
    aiModelsLoading,
    selectedModel,
    onModelChange,
}: TranscriptFormContentProps) {
    const [keywordInput, setKeywordInput] = useState("");

    function handleAddKeyword(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const value = keywordInput.trim().replace(/,+$/, "");
            if (value && !keywords.includes(value)) {
                onKeywordsChange([...keywords, value]);
            }
            setKeywordInput("");
        }
    }

    function handleRemoveKeyword(keyword: string) {
        onKeywordsChange(keywords.filter((k) => k !== keyword));
    }

    const canGenerate = !!transcriptText.trim() && !!selectedModel;

    return (
        <div className="space-y-5">
            {/* Transcrição */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <i className="ri-draft-line text-primary" />
                        Transcrição
                    </h3>
                    <button
                        type="button"
                        onClick={onYoutubeImport}
                        disabled={importingYoutube}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded-md transition-colors"
                    >
                        {importingYoutube ? (
                            <>
                                <i className="ri-loader-4-line animate-spin text-red-500" />
                                Importando...
                            </>
                        ) : (
                            <>
                                <i className="ri-youtube-line text-red-500" />
                                Importar do YouTube
                            </>
                        )}
                    </button>
                </div>
                <Textarea
                    value={transcriptText}
                    onChange={(e) => onTranscriptTextChange(e.target.value)}
                    placeholder="Digite ou cole aqui a transcrição completa da aula..."
                    rows={8}
                    className="resize-none max-h-[200px] overflow-y-auto"
                />
            </div>

            {/* Gerar com IA — modelo + botão */}
            {onGenerateAI && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-3">
                    <div className="flex items-center gap-2">
                        <i className="ri-sparkle-line text-blue-600" />
                        <Label className="text-sm font-semibold text-blue-800">Gerar com IA</Label>
                    </div>

                    <ModelCombobox
                        models={aiModels}
                        value={selectedModel}
                        onValueChange={onModelChange}
                        placeholder="Selecione o modelo de IA..."
                        loading={aiModelsLoading}
                    />

                    <button
                        type="button"
                        onClick={() => onGenerateAI(selectedModel)}
                        disabled={generatingAI || !canGenerate}
                        className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg transition-colors"
                    >
                        {generatingAI ? (
                            <>
                                <i className="ri-loader-4-line animate-spin" />
                                Gerando resumo e palavras-chave...
                            </>
                        ) : (
                            <>
                                <i className="ri-sparkle-fill" />
                                Gerar Resumo e Palavras-chave
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Resumo */}
            <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <i className="ri-magic-line text-primary" />
                    Resumo da Aula
                </h3>
                <Textarea
                    value={vector}
                    onChange={(e) => onVectorChange(e.target.value)}
                    placeholder="Um resumo conciso da aula para ajudar nas buscas..."
                    rows={3}
                    className="resize-none max-h-[100px] overflow-y-auto"
                />
            </div>

            {/* Palavras-chave */}
            <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <i className="ri-hashtag text-primary" />
                    Palavras-chave
                </h3>

                <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Digite e pressione Enter..."
                    className="h-9"
                />

                {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {keywords.map((kw) => (
                            <Badge
                                key={kw}
                                variant="secondary"
                                className="pl-2 pr-1 py-0.5 text-xs bg-primary/10 text-primary gap-1"
                            >
                                {kw}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveKeyword(kw)}
                                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                >
                                    <i className="ri-close-line text-xs" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
