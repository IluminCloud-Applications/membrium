import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelCombobox } from "@/components/settings/ai/ModelCombobox";
import { useAIModels } from "@/hooks/useAIModels";
import { courseModificationService, type BannerPromptVariant } from "@/services/courseModification";
import { toast } from "sonner";

interface BannerPromptModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moduleName: string;
}

interface PromptResult {
    with_expert: BannerPromptVariant;
    without_expert: BannerPromptVariant;
}

function PromptCard({ variant }: { variant: BannerPromptVariant; label: string }) {
    const json = JSON.stringify(variant, null, 2);

    function handleCopyPrompt() {
        navigator.clipboard.writeText(variant.midjourney_ready_prompt);
        toast.success("Prompt copiado!");
    }

    function handleCopyJson() {
        navigator.clipboard.writeText("```json\n" + json + "\n```");
        toast.success("JSON copiado!");
    }

    return (
        <div className="space-y-4">
            {/* Quick prompt */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                        <i className="ri-magic-line text-primary" />
                        Prompt Pronto (Midjourney / DALL-E)
                    </Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPrompt}
                        className="gap-1.5 h-7 text-xs"
                    >
                        <i className="ri-clipboard-line" />
                        Copiar
                    </Button>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground font-mono leading-relaxed break-words">
                    {variant.midjourney_ready_prompt}
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                    { icon: "ri-focus-3-line", label: "Objetivo", value: variant.objective },
                    { icon: "ri-palette-line", label: "Estilo", value: variant.design_style },
                    { icon: "ri-sun-foggy-line", label: "Iluminação", value: variant.lighting_and_atmosphere },
                    { icon: "ri-landscape-line", label: "Background", value: variant.background },
                    { icon: "ri-dashboard-line", label: "Elementos UI", value: variant.ui_ux_elements },
                    { icon: "ri-user-star-line", label: "Elemento Principal", value: variant.main_subject_instruction },
                ].map(({ icon, label: l, value }) => (
                    <div key={l} className="rounded-md border p-2.5 space-y-0.5">
                        <p className="font-semibold text-foreground flex items-center gap-1">
                            <i className={`${icon} text-primary`} />
                            {l}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">{value}</p>
                    </div>
                ))}
            </div>

            {/* Palette */}
            <div className="rounded-md border p-2.5 space-y-1">
                <p className="text-xs font-semibold flex items-center gap-1">
                    <i className="ri-contrast-2-line text-primary" />
                    Paleta de Cores
                </p>
                <p className="text-xs text-muted-foreground">{variant.parameters.Color_Palette}</p>
            </div>

            {/* Copy full JSON */}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyJson}
                className="w-full gap-1.5"
            >
                <i className="ri-code-box-line" />
                Copiar JSON Completo
            </Button>
        </div>
    );
}

export function BannerPromptModal({
    open,
    onOpenChange,
    moduleName,
}: BannerPromptModalProps) {
    const ai = useAIModels(open);
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<PromptResult | null>(null);

    function handleClose(val: boolean) {
        if (!val) {
            setDescription("");
            setResult(null);
        }
        onOpenChange(val);
    }

    async function handleGenerate() {
        if (!description.trim()) return;
        setIsLoading(true);
        try {
            const res = await courseModificationService.generateBannerPrompt(
                moduleName,
                description.trim(),
                undefined,
                ai.provider,
                ai.model || undefined,
            );
            setResult(res.prompts);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Erro ao gerar prompts.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <i className="ri-image-ai-line text-primary" />
                        Gerar Prompt de Banner
                    </DialogTitle>
                    <DialogDescription>
                        Crie prompts profissionais para Midjourney, DALL-E, Leonardo AI e outros geradores.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {/* Module info */}
                    <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-2.5">
                        <i className="ri-folder-3-line text-primary text-lg" />
                        <div>
                            <p className="text-xs text-muted-foreground">Módulo</p>
                            <p className="text-sm font-semibold">{moduleName}</p>
                        </div>
                    </div>

                    {/* Description input */}
                    {!result && (
                        <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Modelo de IA</Label>
                            <ModelCombobox
                                models={ai.models}
                                value={ai.model}
                                onValueChange={ai.setModel}
                                loading={ai.loading}
                                placeholder="Modelo padrão"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="banner-desc">
                                Sobre o Módulo <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Descreva o conteúdo, tema e o que o aluno vai aprender neste módulo.
                                Quanto mais detalhes, melhor o banner gerado.
                            </p>
                            <Textarea
                                id="banner-desc"
                                placeholder="Ex: Neste módulo o aluno vai aprender as estratégias avançadas de tráfego pago no Meta Ads, incluindo como criar campanhas de retargeting, otimizar o CPA e escalar orçamento de forma inteligente..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold flex items-center gap-1.5 text-green-600">
                                    <i className="ri-check-double-line" />
                                    Prompts gerados com sucesso!
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setResult(null); }}
                                    className="gap-1 text-xs"
                                >
                                    <i className="ri-refresh-line" />
                                    Gerar novamente
                                </Button>
                            </div>

                            <Tabs defaultValue="without_expert">
                                <TabsList className="w-full">
                                    <TabsTrigger value="without_expert" className="flex-1 gap-1.5">
                                        <i className="ri-image-line" />
                                        Sem Expert
                                    </TabsTrigger>
                                    <TabsTrigger value="with_expert" className="flex-1 gap-1.5">
                                        <i className="ri-user-star-line" />
                                        Com Expert
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="without_expert" className="mt-4">
                                    <PromptCard variant={result.without_expert} label="Sem Expert" />
                                </TabsContent>
                                <TabsContent value="with_expert" className="mt-4">
                                    <PromptCard variant={result.with_expert} label="Com Expert" />
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                            Fechar
                        </Button>
                        {!result && (
                            <Button
                                type="button"
                                className="btn-brand gap-1.5"
                                disabled={isLoading || !description.trim()}
                                onClick={handleGenerate}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="ri-loader-4-line animate-spin" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-magic-line" />
                                        Gerar Prompts
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
