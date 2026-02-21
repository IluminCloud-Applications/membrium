import { useState } from "react";
import type { WebhookPlatform } from "./WebhookModal";

interface WebhookLinkViewProps {
    platform: WebhookPlatform;
    webhookUrl: string;
    onBack: () => void;
}

export function WebhookLinkView({ platform, webhookUrl, onBack }: WebhookLinkViewProps) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="space-y-4 pt-2">
            {/* Plataforma selecionada */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                <img
                    src={platform.logo}
                    alt={platform.name}
                    className="w-10 h-10 rounded-lg object-contain"
                />
                <div>
                    <p className="font-medium text-sm">{platform.name}</p>
                    <p className="text-xs text-muted-foreground">Webhook configurado</p>
                </div>
            </div>

            {/* Link */}
            <div className="space-y-2">
                <label className="text-sm font-medium">URL do Webhook:</label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 rounded-lg bg-muted/50 border text-xs font-mono break-all select-all">
                        {webhookUrl}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="shrink-0 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                        title="Copiar link"
                    >
                        <i className={copied ? "ri-check-line text-green-500" : "ri-file-copy-line"} />
                    </button>
                </div>
                {copied && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                        <i className="ri-check-double-line" /> Link copiado!
                    </p>
                )}
            </div>

            {/* Instruções */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <p className="font-medium flex items-center gap-1">
                    <i className="ri-information-line" /> Como usar:
                </p>
                <p>Cole este link na config. de webhook/postback da plataforma <strong>{platform.name}</strong>.</p>
                <p>Quando um aluno comprar, ele será adicionado automaticamente ao curso. Em caso de reembolso, ele será removido.</p>
            </div>

            {/* Botão voltar */}
            <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
                <i className="ri-arrow-left-line" /> Voltar para plataformas
            </button>
        </div>
    );
}
