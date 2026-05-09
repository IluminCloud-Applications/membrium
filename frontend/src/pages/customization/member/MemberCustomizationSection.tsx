import { useState, useEffect } from "react";
import { SettingsSection } from "@/components/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { customizationService, type MemberAreaConfig, DEFAULT_MEMBER_CONFIG } from "@/services/customization";
import { MemberCssEditor } from "./MemberCssEditor";
import { MemberAiPrompt } from "./MemberAiPrompt";
import { MemberThemePreview } from "./MemberThemePreview";

export function MemberCustomizationSection() {
    const [config, setConfig] = useState<MemberAreaConfig>(DEFAULT_MEMBER_CONFIG);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

    useEffect(() => {
        customizationService.getMemberConfig()
            .then((d) => setConfig(d))
            .catch(() => {})
            .finally(() => setLoaded(true));
    }, []);

    function updateConfig(update: Partial<MemberAreaConfig>) {
        setConfig(prev => ({ ...prev, ...update }));
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await customizationService.updateMemberConfig(config);
            setFeedback(res.message || "Tema salvo com sucesso");
            setFeedbackType("success");
        } catch {
            setFeedback("Erro ao salvar tema");
            setFeedbackType("error");
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    async function handleClear() {
        if (!confirm("Remover todas as personalizações e voltar ao tema padrão?")) return;
        setSaving(true);
        setFeedback(null);
        try {
            await customizationService.updateMemberConfig(DEFAULT_MEMBER_CONFIG);
            setConfig(DEFAULT_MEMBER_CONFIG);
            setFeedback("Tema padrão restaurado");
            setFeedbackType("success");
        } catch {
            setFeedback("Erro ao remover tema");
            setFeedbackType("error");
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    if (!loaded) return null;

    const hasChanges = JSON.stringify(config) !== JSON.stringify(DEFAULT_MEMBER_CONFIG);

    return (
        <SettingsSection icon="ri-layout-2-line" title="Tema da Área de Membros">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left — controls */}
                <div className="space-y-6">
                    {/* Visual Settings */}
                    <div className="space-y-4 p-4 border border-border rounded-xl bg-card">
                        <h3 className="font-medium flex items-center gap-2">
                            <i className="ri-palette-line text-primary" />
                            Ajustes Visuais
                        </h3>
                        
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5 pr-4">
                                <Label className="text-sm font-medium">Ocultar Informações do Módulo</Label>
                                <p className="text-xs text-muted-foreground">
                                    Remove a quantidade de aulas e o título nos cards da vitrine, exibindo apenas a capa dos módulos.
                                </p>
                            </div>
                            <Switch
                                checked={config.hide_module_info}
                                onCheckedChange={(val) => updateConfig({ hide_module_info: val })}
                            />
                        </div>
                    </div>

                    {/* CSS Customization */}
                    <div className="space-y-4">
                        <MemberCssEditor value={config.member_custom_css} onChange={(css) => updateConfig({ member_custom_css: css })} />
                        <MemberAiPrompt css={config.member_custom_css} />

                    </div>

                    {/* Action bar */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 gap-2"
                        >
                            {saving ? (
                                <><i className="ri-loader-4-line animate-spin" /> Salvando...</>
                            ) : (
                                <><i className="ri-save-line" /> Salvar Tema</>
                            )}
                        </Button>
                        {hasChanges && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClear}
                                className="text-muted-foreground hover:text-destructive gap-1.5"
                            >
                                <i className="ri-arrow-go-back-line" />
                                Voltar ao Original
                            </Button>
                        )}
                    </div>

                    {/* Feedback */}
                    {feedback && (
                        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border animate-fade-in ${
                            feedbackType === "success"
                                ? "text-green-600 bg-green-500/10 border-green-500/20"
                                : "text-red-500 bg-red-500/10 border-red-500/20"
                        }`}>
                            <i className={feedbackType === "success" ? "ri-check-circle-line" : "ri-error-warning-line"} />
                            {feedback}
                        </div>
                    )}
                </div>

                {/* Right — preview */}
                <MemberThemePreview css={config.member_custom_css} hideModuleInfo={config.hide_module_info} />
            </div>
        </SettingsSection>
    );
}
