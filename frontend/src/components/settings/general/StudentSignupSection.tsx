import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "../SettingsSection";
import { settingsService } from "@/services/settings";

export function StudentSignupSection() {
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await settingsService.getAll();
            setPassword(data.new_student_password || "");
            setLoaded(true);
        } catch {
            setLoaded(true);
        }
    }

    async function handleSave() {
        setSaving(true);
        setFeedback(null);
        try {
            const res = await settingsService.updateStudentSignup({
                new_student_password: password,
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
            icon="ri-user-add-line"
            title="Cadastro de Alunos"
            description="Configure as opções de acesso para novos alunos criados de forma automática."
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="defaultPassword">Senha Padrão (Webhook/API)</Label>
                    <Input
                        id="defaultPassword"
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ex: senha123 (vazio usará a padrão do sistema)"
                    />
                    <p className="text-xs text-muted-foreground">
                        Esta senha será definida para os novos alunos que forem cadastrados automaticamente via Webhooks de plataformas de vendas ou integrações customizadas (API/n8n).
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
                            "Salvar Configurações"
                        )}
                    </Button>
                </div>
            </div>
        </SettingsSection>
    );
}
