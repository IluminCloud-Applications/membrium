import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TranscriptFormContentProps {
    transcriptText: string;
    vector: string;
    keywords: string[];
    onTranscriptTextChange: (value: string) => void;
    onVectorChange: (value: string) => void;
    onKeywordsChange: (keywords: string[]) => void;
    onYoutubeImport: () => void;
    importingYoutube?: boolean;
    onGenerateAI?: () => void;
    generatingAI?: boolean;
}

/**
 * Right column — transcript text area, AI summary, and keyword tags.
 * Groups all content editing fields together.
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

            {/* Gerar com IA — botão unificado */}
            {onGenerateAI && (
                <button
                    type="button"
                    onClick={onGenerateAI}
                    disabled={generatingAI || !transcriptText.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg transition-colors"
                >
                    {generatingAI ? (
                        <>
                            <i className="ri-loader-4-line animate-spin" />
                            Gerando resumo e palavras-chave com IA...
                        </>
                    ) : (
                        <>
                            <i className="ri-sparkle-line" />
                            Gerar Resumo e Palavras-chave com IA
                        </>
                    )}
                </button>
            )}

            {/* Resumo */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <i className="ri-magic-line text-primary" />
                        Resumo da Aula
                    </h3>
                </div>
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
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <i className="ri-hashtag text-primary" />
                        Palavras-chave
                    </h3>
                </div>

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
