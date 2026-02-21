import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SettingsSection } from "../SettingsSection";
import { settingsService } from "@/services/settings";

export function PlatformSection() {
    const [name, setName] = useState("");
    const [theme, setTheme] = useState<"light" | "dark">("light");
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
            setTheme(data.default_theme || "light");
            setLoaded(true);
        } catch {
            setLoaded(true);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await settingsService.updatePlatform({
                platform_name: name,
                default_theme: theme,
            });
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
            title="Plataforma"
            description="Nome e aparência padrão da sua plataforma."
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="platformName">Nome da Plataforma</Label>
                        <Input
                            id="platformName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome da sua plataforma"
                        />
                    </div>

                    {/* Tema padrão */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                            <Label>Tema Padrão</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <i className="ri-information-2-line text-muted-foreground text-sm cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                                        Este é o tema dos alunos. Para alterar o seu tema,
                                        clique no seu nome na sidebar e selecione Modo Escuro/Claro.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setTheme("light")}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2
                                    text-sm font-medium transition-all cursor-pointer
                                    ${theme === "light"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-muted-foreground/40 text-muted-foreground"
                                    }
                                `}
                            >
                                <i className="ri-sun-line" />
                                Claro
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme("dark")}
                                className={`
                                    flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2
                                    text-sm font-medium transition-all cursor-pointer
                                    ${theme === "dark"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-muted-foreground/40 text-muted-foreground"
                                    }
                                `}
                            >
                                <i className="ri-moon-line" />
                                Escuro
                            </button>
                        </div>
                    </div>
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
