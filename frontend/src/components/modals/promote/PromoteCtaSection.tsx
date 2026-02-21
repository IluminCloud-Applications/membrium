import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PromoteCtaSectionProps {
    hasCta: boolean;
    ctaText: string;
    ctaUrl: string;
    ctaDelay: number;
    isDisabled?: boolean;
    onToggleCta: (value: boolean) => void;
    onCtaTextChange: (value: string) => void;
    onCtaUrlChange: (value: string) => void;
    onCtaDelayChange: (value: number) => void;
}

export function PromoteCtaSection({
    hasCta,
    ctaText,
    ctaUrl,
    ctaDelay,
    isDisabled,
    onToggleCta,
    onCtaTextChange,
    onCtaUrlChange,
    onCtaDelayChange,
}: PromoteCtaSectionProps) {
    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <i className="ri-cursor-line text-primary" />
                Call to Action (CTA)
            </h4>

            {/* CTA toggle */}
            <div
                className={`flex items-center justify-between rounded-lg border p-3 transition-opacity ${isDisabled ? "opacity-50" : ""
                    }`}
            >
                <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Adicionar CTA</Label>
                    <p className="text-xs text-muted-foreground">
                        {isDisabled
                            ? "Indisponível para vídeos externos."
                            : "Exibe um botão de ação na promoção."}
                    </p>
                </div>
                <Switch
                    checked={hasCta}
                    onCheckedChange={onToggleCta}
                    disabled={isDisabled}
                />
            </div>

            {/* CTA fields */}
            {hasCta && !isDisabled && (
                <div className="space-y-4 animate-fade-in">
                    <div className="space-y-2">
                        <Label htmlFor="promote-cta-text">Texto do Botão</Label>
                        <Input
                            id="promote-cta-text"
                            placeholder="Ex: Comprar Agora"
                            value={ctaText}
                            onChange={(e) => onCtaTextChange(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="promote-cta-url">URL do Botão</Label>
                        <div className="relative">
                            <i className="ri-link absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                            <Input
                                id="promote-cta-url"
                                type="url"
                                placeholder="https://..."
                                value={ctaUrl}
                                onChange={(e) => onCtaUrlChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="promote-cta-delay">Delay do Botão (segundos)</Label>
                        <Input
                            id="promote-cta-delay"
                            type="number"
                            min={0}
                            value={ctaDelay}
                            onChange={(e) => onCtaDelayChange(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Se 0, o botão será exibido imediatamente. Caso contrário, aparecerá
                            após o tempo especificado.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
