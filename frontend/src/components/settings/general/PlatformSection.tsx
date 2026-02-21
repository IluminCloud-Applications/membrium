import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "../SettingsSection";
import { settingsService } from "@/services/settings";

export function PlatformSection() {
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await settingsService.getAll();
            setName(data.platform_name || "");
            setLoaded(true);
        } catch {
            setLoaded(true);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await settingsService.updatePlatform({ platform_name: name });
            setFeedback(res.message);
        } catch {
            setFeedback("Erro ao salvar");
        } finally {
            setSaving(false);
            setTimeout(() => setFeedback(null), 3000);
        }
    }

    if (!loaded) return null;

    return (
        <SettingsSection
            icon="ri-layout-line"
            title="Nome da Plataforma"
            description="Este nome será exibido no cabeçalho e no título das páginas."
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="platformName">Nome da Plataforma</Label>
                    <Input
                        id="platformName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome da sua plataforma"
                    />
                    <p className="text-xs text-muted-foreground">
                        Este nome aparecerá para os alunos na área de membros.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                    {feedback && (
                        <span className="text-sm text-green-600">{feedback}</span>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-brand"
                    >
                        {saving ? (
                            <>
                                <i className="ri-loader-4-line animate-spin mr-2" />
                                Salvando...
                            </>
                        ) : (
                            "Salvar Alterações"
                        )}
                    </Button>
                </div>
            </div>
        </SettingsSection>
    );
}
